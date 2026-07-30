import process from "node:process";
import {
  DidChangeTextDocumentNotification,
  DidChangeWorkspaceFoldersNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ErrorCodes,
  ExitNotification,
  InitializedNotification,
  type InitializeParams,
  InitializeRequest,
  type InitializeResult,
  type Logger,
  ResponseError,
  type ServerCapabilities,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import { createLifecycle, type Lifecycle } from "./lifecycle.ts";
import { contributeCapabilities, registerMethods } from "./methods.ts";
import { createGatedConnection, defineNotifications } from "./notifications.ts";
import type { TsudoiRuntime } from "./tsudoi.ts";
import type { TsudoiConfig } from "./types.ts";
import type { WorkspaceFoldersHandle } from "./workspace.ts";

/**
 * Where vscode-jsonrpc reports what it cannot answer for -- above all a
 * notification handler that threw, which it catches and would otherwise discard
 * in silence, since a notification has no response to carry the failure.
 *
 * Every level goes to stderr. stdout carries the protocol and nothing else, so
 * console.log here would corrupt the very stream the client is framing.
 *
 * WHAT THIS LOGGER DOES NOT COVER, because the natural inference from the
 * paragraph above is WRONG and would manufacture a defect that does not exist:
 * a notification with NO REGISTERED HANDLER never reaches this logger at all.
 * `$/setTrace` and an invented `totally/madeUp` each produce ZERO BYTES here on
 * both runtimes, and the session stays functional -- inert, not merely quiet,
 * and that silence is endorsed deliberately.
 *
 * So the reach is `a handler that threw`, never `anything the client sent that
 * we do not answer`. Someone reasoning from the throwing case to the
 * unregistered one would predict noise and size a defect against it.
 */
const stderrLogger: Logger = {
  error: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  warn: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  info: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  log: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
};

/**
 * Starts serving LSP over stdio. Called only after the config has loaded, so
 * that no failure path can put bytes on stdout.
 *
 * `capabilities` is assembled per method from what the config actually
 * supplies, so tsudoi never claims something the config cannot answer.
 */
export function startServer(config: TsudoiConfig, runtime: TsudoiRuntime): void {
  // THE SESSION'S OWN STATE AND THE WRITERS FOR IT, taken apart HERE and built
  // in src/tsudoi.ts. That side of the split is what makes `Tsudoi` one
  // server-lifetime object: this file is handed the finished view and the
  // handles that feed it, and has no way to assemble a second view per request.
  const { tsudoi, documents, workspaceFolders, handshake } = runtime;
  // Every question about WHEN a message is allowed goes to this one object.
  // The gate it backs reaches what tsudoi REGISTERED, never the dispatch as a
  // whole -- that is what leaves a method nobody registered falling through to
  // vscode-jsonrpc's MethodNotFound, since `not initialized yet` and `no such
  // method` are different diagnoses.
  //
  // NOTIFICATIONS DO NOT CONSULT IT ONE BY ONE: each entry below DECLARES when
  // it may run, and the router in notifications.ts applies that. The router is
  // reached through createGatedConnection, which is why `lifecycle` is handed to
  // that call rather than to a registration of its own. Requests still ask for
  // themselves, in methods.ts, because a refused request must be ANSWERED with a
  // code the handler's own signature can carry.
  const lifecycle = createLifecycle();

  // EVERY notification tsudoi answers is declared here, and each one DECIDES
  // when it may run. The gate is applied by the router, never by a handler
  // body: a body that could consult it is a body that could forget to.
  //
  // AND THE CONNECTION COMES BACK WITHOUT AN `onNotification` TO CALL. This
  // line is the only connection this file has, so a future edit cannot register
  // a notification beside the table instead of in it -- not by writing
  // `connection.onNotification`, and not by copying the value under another
  // name. `startServer` must NEVER bind the wide type: narrowing after the fact
  // would leave the wide value in scope and foreclose nothing, which is why
  // creation lives in the module that owns the table. The one route left --
  // importing `createProtocolConnection` here and getting a wide one back -- is
  // BANNED IN THIS FILE by .oxlintrc.json; why a detector is enough for it, and
  // what that depends on, is at `createGatedConnection`.
  const connection = createGatedConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
    stderrLogger,
    lifecycle,
    notificationEntries(documents, lifecycle, workspaceFolders),
  );

  // `unknown` AND NOT `InitializeParams`, AND THE CAST IS DELAYED past the check
  // below for the reason src/config.ts records at its own delayed cast: declaring
  // the wire's bytes to be the shape a CONFORMING client sends makes every check
  // on them dead code to the type checker, so the annotation would assert exactly
  // what this handler exists to establish. A wider parameter is assignable where
  // a narrower one is expected, so the registration still type-checks against the
  // request's declared params.
  connection.onRequest(InitializeRequest.type, (params: unknown): InitializeResult => {
    // THE GATE THIS REQUEST CONSULTS IS ITS OWN, and it is not the one every
    // other request asks: requestRejection() would answer ServerNotInitialized
    // to the very message that clears that phase, making the state it guards
    // unreachable. So `never refuses` holds for the UNINITIALIZED phase ALONE and
    // is not a blanket carve-out: in `serving` the refusal is what stops
    // everything below this line REWRITING STATE THE DOCUMENT STORE DOES NOT
    // REWRITE WITH IT, and after `shutdown` it is what keeps a clean session's
    // `exit` reading 0. The phase reading itself stays in src/lifecycle.ts,
    // beside the code it answers with, and so do both of those reasons.
    const rejection = lifecycle.initializeRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    // BEFORE THE PHASE MOVES, AND THAT ORDER IS THE WHOLE VALUE OF THE CHECK. A
    // refusal answered from AFTER the transition would be a session the client
    // cannot repair: its corrected `initialize` meets the serving phase and is
    // answered InvalidRequest, so a malformed handshake would cost the session
    // rather than the message.
    const malformed = malformedInitializeParams(params);
    if (malformed !== undefined) {
      throw new ResponseError(ErrorCodes.InvalidParams, malformed);
    }
    const initializeParams = params as InitializeParams;
    // FOUR FIELDS, DELIBERATELY, AND NOT ONE MORE: the three the protocol lets a
    // client name a ROOT in, and the CAPABILITIES the client declared. Nothing
    // else here is read, and `params` is NOT retained -- doing that would put the
    // whole of InitializeParams on tsudoi's surface as a side effect of needing
    // four fields of it, and every field on that surface is one tsudoi then owes
    // an answer about.
    //
    // CAPABILITIES ARE READ BECAUSE A READER NEEDED THEM, WHICH IS THE ONLY
    // REASON A FIELD IS ADDED HERE. LSP permits `InsertReplaceEdit` only to a
    // client that declared `completion.completionItem.insertReplaceSupport`, so
    // a config author with no way to read that could only violate the
    // specification or decline the feature for everyone;
    // examples/completion-path.ts now chooses its edit shape from that one
    // field. A FIFTH FIELD IS THE SAME TRANSACTION AND NOT A PRECEDENT ALREADY
    // SET: name the reader, or the field stays unread.
    //
    // MIRRORED IN workspace.ts AND NOWHERE ELSE, and NOTHING IS DERIVED FROM
    // ANOTHER FIELD HERE OR THERE. No folder is synthesised from `rootUri` or
    // `rootPath` when the client sends none, because a folder needs a `name`
    // and the protocol makes `name` a label the CLIENT owns. A non-absolute
    // `rootPath` is REFUSED in workspace.ts rather than forwarded: a relative
    // path is not a root, since it resolves against a working directory the
    // client does not share.
    //
    // What absence must NEVER become is a ROOT. cwd is the tempting default
    // and the dangerous one: nvim spawns the server with cwd = root_dir when a
    // root is found and its own launch directory when not, so a cwd fallback
    // looks correct in every test and is silently wrong for the user who has
    // no root.
    handshake(initializeParams);
    const capabilities: ServerCapabilities = {
      // openClose is not optional: advertising only `change` entitles a
      // conforming client to withhold didOpen/didClose, and then the store
      // never sees a document however correct its own code is.
      //
      // INCREMENTAL, AND THIS LINE IS THE WHOLE OF WHAT AN EDITOR READS: a
      // client sends what it was told the server accepts, so announcing Full
      // keeps the whole buffer going onto stdio at every keystroke however
      // well the store applies ranges.
      //
      // THE ORDER MATTERS AND IT IS A CORRECTNESS REQUIREMENT, NOT A
      // PREFERENCE: this value may never move ahead of the store's ability to
      // apply what it invites. A commit advertising Incremental over a store
      // that read one change per notification would corrupt every buffer a
      // client edited, silently, on the client's first keystroke.
      textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental },
      // WHAT MAKES THE FOLDER MIRROR REACHABLE. `changeNotifications` is an
      // OPT-IN and not a preference: a conforming client subscribes to folder
      // changes only when the server asked it to, so without this key
      // `workspace/didChangeWorkspaceFolders` never arrives, the delta path in
      // workspace.ts is dead code, and Tsudoi.workspaceFolders is frozen for the
      // life of the session at whatever `initialize` stated.
      //
      // UNCONDITIONAL, AND THAT IS WHY IT IS HERE RATHER THAN CONTRIBUTED FROM
      // THE TABLE IN src/methods.ts. Those entries are claimed per method because
      // a client is entitled to send whatever it was told about and the CONFIG
      // may have no handler to answer with. This one answers to nothing the
      // config declares: tsudoi mirrors the folders and populates
      // Tsudoi.workspaceFolders whether or not any method is supplied, so it is
      // a fact about tsudoi, and conditioning it would advertise less than
      // tsudoi does.
      //
      // NOR IS IT CONDITIONED ON THE CLIENT'S OWN `workspace.workspaceFolders`,
      // AND THAT IS NOW A DECISION RATHER THAN A LIMIT: the capabilities are
      // mirrored a few lines up, so this line COULD read them. It does not,
      // because the claim is about what tsudoi does and not about what the
      // client asked -- a client that did not ask for this simply ignores it,
      // where conditioning would advertise less than tsudoi delivers and make
      // the folder mirror depend on a field the client is free to omit.
      //
      // `true` RATHER THAN AN ID STRING: an id exists to be handed back to
      // `client/unregisterCapability`, and tsudoi never unregisters -- it wants
      // these for as long as the session lasts. `supported` is the plain
      // declaration that tsudoi answers from folders at all.
      workspace: { workspaceFolders: { supported: true, changeNotifications: true } },
    };
    // PER-METHOD, AND THE REASON IS THE STAKEHOLDER'S POLICY: a client is
    // entitled to send whatever it was told about, so each capability is
    // claimed ONLY where the config can actually answer it.
    //
    // NOT DERIVED FROM `methods`' SHAPE. It is derived from the TABLE in
    // src/methods.ts, whose entries are written by hand with their reasons
    // beside them, and each contributes through a FUNCTION rather than a flag --
    // because `completionProvider` is an object and `resolveProvider` is a key
    // INSIDE it, contributed by a different method than the one that owns it.
    // A method whose entry omits a capability contributor DOES NOT COMPILE,
    // where a forgotten `if` here was silent.
    contributeCapabilities(config, capabilities);
    // AFTER EVERY FALLIBLE LINE OF THE HANDSHAKE, AND THE ORDERING IS THE
    // DEFENCE RATHER THAN A PREFERENCE. This transition records that the
    // handshake HAPPENED, so it happens once the handshake has been prepared: a
    // failure from anywhere above answers the client with the phase still
    // `uninitialized`, which is the one state a corrected `initialize` can be
    // sent from. Below a transition the same failure leaves the phase saying
    // `serving`, where a second `initialize` is InvalidRequest -- so the client
    // would hold a failed handshake it may not repeat, while every later request
    // is treated as initialized.
    //
    // IT IS NOT THE SAME DECISION AS THE GATE AT THE TOP: that one decides
    // whether the handshake is ALLOWED, this one decides when it counts as
    // having HAPPENED.
    //
    // NOTHING BETWEEN THE GATE AND THIS LINE READS THE PHASE, which is what
    // makes the placement free rather than a trade: `handshake` writes the
    // mirror and the client's capabilities, `contributeCapabilities` reads the
    // config's own table, and neither asks the lifecycle anything.
    //
    // AND NO MESSAGE CAN OBSERVE THE WINDOW, BECAUSE THIS HANDLER IS
    // SYNCHRONOUS: nothing is dispatched between its first line and its return.
    // AN `await` ADDED ABOVE THIS LINE WOULD OPEN THAT WINDOW -- a notification
    // arriving inside it reads `uninitialized` and is DROPPED, silently, since
    // there is no response to carry a refusal. That is what this ordering costs
    // and the reason the handler stays synchronous.
    lifecycle.initialize();
    return { capabilities, serverInfo: { name: "tsudoi" } };
  });

  // What the config can answer lives in its own module: lifecycle and document
  // sync are tsudoi's own business, whereas these hand control to code the
  // config author wrote and have a failure path of their own.
  // NOTHING ABOUT THE CLIENT'S ROOTS IS HANDED OVER HERE, and the absence is the
  // decision: the folder list and the two deprecated fields are reached through
  // `tsudoi`, which this call already passes. A thunk assembling them per request
  // would put a snapshot back where the surface says there is a live read.
  registerMethods(connection, config, tsudoi, () => lifecycle.requestRejection());

  // ShutdownRequest's declared result is void; vscode-jsonrpc puts null on the
  // wire for it, which is what the LSP specification requires.
  //
  // A REST PARAMETER AND NOT A ZERO-ARGUMENT CALLBACK, AND THAT IS THE WHOLE OF
  // WHAT LETS THIS REFUSE ANYTHING. `shutdown`'s LSP signature takes no params,
  // so a callback declaring none reads as exactly right and SILENTLY ACCEPTS
  // every malformed spelling -- a `"params": null` shutdown would move the phase
  // permanently, in a repository that refuses `null` at the router's prologue and
  // at the `initialize` boundary alike, on the grounds that JSON-RPC 2.0 requires
  // a present `params` to be a Structured value.
  //
  // WHAT THE LIBRARY HANDS THIS HANDLER, MEASURED ON BOTH RUNTIMES (bun 1.3.13,
  // deno 2.9.2) rather than read off the types, because the arity IS the
  // discriminator:
  //
  // - params OMITTED: the cancellation token ALONE. `ShutdownRequest.type`
  //   declares zero params, which clears vscode-jsonrpc's own arity check, so
  //   nothing is prepended;
  // - params by NAME, or `null`, or a primitive: the value, THEN the token;
  // - params by POSITION: one argument PER ELEMENT, then the token.
  //
  // So `args.length > 1` is `the client supplied something`, and it is the only
  // question this handler can ask -- a typed registration never sees the raw
  // `params` value.
  //
  // THE ONE SHAPE IT CANNOT SEE IS `"params": []`, WHICH PROCEEDS. Spreading an
  // empty array prepends nothing, so it arrives identical to an omission -- and
  // that is the right answer rather than a leak: an empty by-position list is the
  // by-position spelling of `no arguments`, which is what `shutdown` accepts.
  // WHAT WOULD SEE IT is vscode-jsonrpc's STAR handler, which is handed the RAW
  // `params` and so tells `undefined`, `null` and `[]` apart exactly. DECLINED,
  // because reaching it means NOT REGISTERING `shutdown` AT ALL -- a registered
  // handler always wins the dispatch -- which trades `ShutdownRequest.type`'s
  // typing, and a method-agnostic handler's generality, for one shape that
  // already gets the answer it should.
  //
  // THE PHASE IS CONSULTED FIRST, exactly as the router's prologue in
  // src/methods.ts and the `initialize` boundary above both do: a server that has
  // not been initialized has no shutdown to refuse the params of, and -32002 tells
  // a client to send `initialize` where -32602 would send it hunting a field that
  // was never the reason.
  //
  // AND THE REFUSAL IS THROWN BEFORE shutDown(), which is the half a refusal
  // alone would not deliver. A phase moved and THEN refused leaves the client
  // holding a shutdown it may not repeat: its corrected `shutdown` meets the
  // shutdown phase and is answered -32600, so one malformed message would cost
  // the session rather than the message.
  connection.onRequest(ShutdownRequest.type, (...args: readonly unknown[]): void => {
    const rejection = lifecycle.requestRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    if (args.length > 1) {
      // The ARGUMENT LIST vscode-jsonrpc built, token dropped -- one element for
      // a by-name object, a primitive or `null`, and one per element for a
      // by-position array. Not the wire's `params` verbatim, because that value
      // does not reach a typed registration to be quoted.
      throw new ResponseError(
        ErrorCodes.InvalidParams,
        `shutdown takes no params; received ${JSON.stringify(args.slice(0, -1))}`,
      );
    }
    lifecycle.shutDown();
  });

  // THIS PROCESS EXITS WHEN ITS EDITOR DIES BECAUSE NOTHING KEEPS THE EVENT LOOP
  // ALIVE. Not one line here handles stdin closing: the reader above is the only
  // thing waiting on anything, and when the editor that spawned tsudoi dies its
  // end of the pipe closes, the reader has nothing left to wait for, the loop
  // empties and the process ends.
  //
  // SO ANY TIMER, SOCKET, WATCHER OR SUBSCRIPTION ADDED ANYWHERE IN src/ MUST BE
  // unref()'d. THAT IS A CORRECTNESS REQUIREMENT AND NOT AN OPTIMISATION: an
  // un-unref'd handle does not slow anything down, it makes tsudoi OUTLIVE THE
  // EDITOR FOREVER, one orphaned server per crash. A `setInterval` here for a
  // debounce or a cache sweep is the natural way to cause it.
  //
  // WHAT MAKES THAT SURVIVABLE IS THAT IT REDDENS: test/editor-death.test.ts
  // kills a fake editor and watches this process's pid, and an un-unref'd
  // interval on this line reddens it on both runtimes. THE PROPERTY IS HELD BY AN
  // ABSENCE -- of handles -- WHICH IS THE ONLY KIND THAT BREAKS BY ADDING
  // SOMETHING RATHER THAN BY CHANGING SOMETHING, so nothing in a diff shows it
  // going. That file is what shows it.
  //
  // AND HERE IS WHAT IT DOES NOT REACH, because the requirement above is wider
  // than the check below and reading them as equal is the natural mistake: THOSE
  // SESSIONS SEND ONE `initialize` AND NOTHING ELSE. So the handles they can
  // observe are the ones created on the STARTUP AND INITIALIZE PATH -- a timer
  // opened inside a hover handler, inside a document change, or on the shutdown
  // path is never constructed there and reddens NOTHING. Nor does anything else
  // in the suite cover it: every other session ends by `exit`, which calls
  // process.exit, or by being killed, and neither notices a lingering handle.
  //
  // THE EXIT CODE ON THAT PATH IS NOT DECIDED HERE: the reading is at exitCode()
  // in src/lifecycle.ts, which is the one place this project's reading of the
  // specification's exit-code sentence lives.
  //
  // AND IF YOU EVER DO WANT A HOOK ON THAT CLOSE: `reader.onClose` FIRES ON BUN
  // AND NEVER ON DENO (bun 1.3.13, deno 2.9.2), so a handler installed there is
  // silently inert on half the supported runtimes. `process.stdin.on("end", ...)`
  // fires on both.
  //
  // THE ONE CASE THIS DOES NOT COVER: FORK WITHOUT EXEC. If the editor forks a
  // child that inherits the write end of tsudoi's stdin and outlives it, the pipe
  // never closes, no EOF ever arrives, and tsudoi survives the editor it serves.
  // It is not hypothetical -- test/editor-death.test.ts builds exactly that
  // situation on purpose, to prove the mechanism is EOF and not bereavement.
  //
  // IT IS UNCOVERED BECAUSE TSUDOI DELIVERS THE SPECIFICATION'S PROPERTY BY A
  // DIFFERENT MECHANISM THAN THE SPECIFICATION'S. LSP asks a server to exit when
  // the parent named by `processId` is not alive; tsudoi NEVER READS processId at
  // all and gets the same outcome from EOF, which is why every session in the
  // suite can send `processId: null` and still exit. Fork-without-exec is the one
  // input on which the two mechanisms disagree -- the exact residue of the
  // substitution, not an arbitrary gap.
  //
  // A PID POLL WOULD CLOSE IT, AND AN UNREF'D ONE WOULD DESTROY THE EXIT THAT
  // ALREADY WORKS: an unref'd parent-pid poll reddens the survives-its-editor
  // test, because it makes the server exit for the WRONG REASON. AND THE
  // PORTABILITY TRAP, preserved even though no poll is being written, because it
  // is invisible until it has already shipped: `process.kill(pid, 0)` throws on
  // both runtimes with OPPOSITE ERRNO SIGNS -- bun 1.3.13 gives name
  // `SystemError`, errno 3, message `kill() failed: ESRCH: No such process`; deno
  // 2.9.2 gives name `Error`, errno -3, message `kill ESRCH`. `code === "ESRCH"`
  // is the ONLY portable discriminator; an implementation testing `errno === 3`,
  // or matching the message, SILENTLY NEVER FIRES ON DENO and the poll it guards
  // then reports every parent as alive forever.
  connection.listen();
}

/**
 * The sentence a malformed `initialize` must be refused with, or undefined where
 * the handshake may proceed.
 *
 * WHAT IS CHECKED IS WHAT TSUDOI PUBLISHES, AND NOT `InitializeParams` AS A
 * WHOLE. Four fields are read off this message; a field nothing reads is a field
 * nothing here can be wrong about, and checking it would put tsudoi in the
 * position of ruling on a client's message for no reader's benefit. Of the four,
 * these are the ones whose PUBLISHED TYPE is the promise being kept: `Tsudoi`
 * declares `rootUri` as `string | null` and `clientCapabilities` as an object,
 * and nothing downstream inspects either -- the mirror stores `rootUri` as the
 * client's own bytes and the capabilities are mirrored whole, both on purpose. So
 * a value refused here is one a config author would otherwise meet inside their
 * own handler, holding a type its declaration says cannot arrive.
 *
 * `rootPath` AND `workspaceFolders` ARE DECIDED IN src/workspace.ts AND ARE NOT
 * RESTATED HERE. That module REDUCES both -- a `rootPath` that is not an
 * absolute string arrives as `null`, a `workspaceFolders` that is not an array
 * arrives as an empty list -- and those are states the fields already have and
 * already mean `the client named none`. Refusing them here would give one field
 * two contradictory answers in one handshake, and the mirror's is the one the
 * published surface documents.
 *
 * WHICH IS ALSO THE LINE `rootUri` FALLS ON THE OTHER SIDE OF: `null` is a state
 * it has, but a client that sent a NUMBER did not name no root -- it sent
 * something no reading of this protocol makes sense of, and reducing that to
 * `the client named none` would answer a question the client never asked.
 *
 * AN ABSENT OR `null` `capabilities` IS NOT MALFORMED: src/tsudoi.ts reads both
 * as `{}`, which is what a client declaring nothing means and is the value a
 * handler is promised. A primitive or an ARRAY is not that -- it is a
 * declaration nothing can read -- so it is refused.
 *
 * -32602 IS THE CODE THE LIBRARY ITSELF ANSWERS on this very route for the two
 * malformed shapes it catches -- params OMITTED and params BY POSITION, measured
 * on both runtimes -- so this extends one answer to the shapes it lets through
 * rather than inventing a second. It is also why no array reaches the top-level
 * check: by-position params never arrive here at all.
 *
 * AND IT IS THE CODE THE SPECIFICATION EARNS: JSON-RPC 2.0 makes `params` `A
 * Structured value` that `MAY be omitted`, and requires that `If present,
 * parameters for the rpc call MUST be provided as a Structured value. Either
 * by-position through an Array or by-name through an Object`. `null` is neither,
 * and LSP requires an `InitializeParams` object besides.
 *
 * NOT REPORTED ON STDERR: the client is told, in the response it is waiting on,
 * and the one stderr channel a config author has means THEIR handler failed.
 */
function malformedInitializeParams(params: unknown): string | undefined {
  if (typeof params !== "object" || params === null) {
    return `initialize params must be an object; received ${JSON.stringify(params)}`;
  }
  // Read once into locals: every check below is about the value that reaches a
  // handler, and a second read is a second chance to answer differently. Safe to
  // read at all because this object came off JSON.parse, which builds no
  // accessors.
  const { capabilities, rootUri } = params as {
    readonly capabilities?: unknown;
    readonly rootUri?: unknown;
  };
  if (
    capabilities !== undefined &&
    capabilities !== null &&
    (typeof capabilities !== "object" || Array.isArray(capabilities))
  ) {
    return (
      `initialize capabilities must be an object; received ` +
      `${JSON.stringify(capabilities)}. A client that declares nothing omits the field`
    );
  }
  if (rootUri !== undefined && rootUri !== null && typeof rootUri !== "string") {
    return (
      `initialize rootUri must be a string or null; received ` +
      `${JSON.stringify(rootUri)}. A client that opened no project sends null`
    );
  }
  return undefined;
}

/**
 * Every notification tsudoi answers, as a VALUE.
 *
 * Built here rather than inline at the call site so the decisions are READABLE
 * BY A TEST: `exit`'s carve-out is the one that turns a mistake into a hung
 * process, and asserting the entry DECLARES `always` catches that by name
 * instead of as a suite that stopped finishing.
 *
 * IF THE SUITE HANGS, CHECK THIS TABLE'S GATES -- a `lifecycle` on `exit`
 * leaves the server alive after the client asked it to die, and the only
 * symptom is a run that normally takes twelve seconds taking minutes.
 */
export function notificationEntries(
  documents: DocumentStoreHandle,
  lifecycle: Lifecycle,
  workspaceFolders: Pick<WorkspaceFoldersHandle, "change">,
) {
  return defineNotifications([
    {
      type: InitializedNotification.type,
      // The client is ready. Registered rather than left unhandled so that
      // vscode-jsonrpc does not log it as unanswered on every session.
      handler: () => {},
      // `lifecycle` is what the message MEANS -- `the client is ready to serve`
      // outside a serving session says nothing. Nothing observes this choice
      // while the body is empty: a dropped delivery has nothing to fail to do.
      gate: "lifecycle",
    },
    // The three sync notifications are pure delegation: what a change event
    // means -- a range to splice in or a whole buffer to replace -- is
    // documents.ts's business, and none of them answers the client.
    {
      type: DidOpenTextDocumentNotification.type,
      handler: (params) => documents.open(params),
      gate: "lifecycle",
    },
    {
      type: DidChangeTextDocumentNotification.type,
      handler: (params) => documents.change(params),
      gate: "lifecycle",
    },
    {
      type: DidCloseTextDocumentNotification.type,
      handler: (params) => documents.close(params),
      gate: "lifecycle",
    },
    {
      type: DidChangeWorkspaceFoldersNotification.type,
      // Pure delegation, exactly as the sync notifications are: what a change
      // event MEANS is workspace.ts's business. The params are typed from the
      // `type` on the line above by defineNotifications -- annotating them here
      // by hand would compile against the WRONG notification's shape just as
      // happily, which is the error this table exists to keep impossible.
      handler: (params) => workspaceFolders.change(params.event),
      // WHY THIS ENTRY EXISTS AT ALL: tsudoi ASKED for this message. A
      // conforming client sends it only to a server that advertised
      // `workspace.workspaceFolders.changeNotifications`, which startServer does
      // unconditionally -- so this entry and that advertisement stand or fall
      // together, and dropping either leaves the folder mirror frozen at what
      // `initialize` stated with nothing here to notice.
      //
      // OPTING IN ALSO BUYS A CATCH-UP EVENT: the client's feature sends the diff
      // between the folders it named at `initialize` and the folders it holds
      // when it registers. Usually those agree and nothing is sent; when they do
      // not, ONE notification carrying both arms arrives before any user action.
      // That is the ordinary path through `change()` in workspace.ts and not a
      // special case -- a `removed` URI it does not hold is skipped, so the
      // handler has nothing to guard against here.
      //
      // The gate: a folder change outside the serving window has no session to
      // change. Before `initialize` there is no client state and the folder list
      // is about to be REPLACED by what initialize states anyway; after
      // `shutdown` the session is over. LSP's own rule for a mistimed
      // notification is to drop it silently, which is what `lifecycle` does.
      gate: "lifecycle",
    },
    {
      type: ExitNotification.type,
      // Reads the lifecycle for the CODE, never for permission -- exitCode() is
      // not the gate, and this handler decides nothing about whether it runs.
      handler: () => process.exit(lifecycle.exitCode()),
      // THE ONE SITE AT WHICH exit's carve-out EXISTS: a client is entitled to
      // send `exit` at any moment, and a gate applied to it leaves the process
      // alive forever -- a hang instead of an exit code. Written here rather
      // than as a branch in the router or a name in a set, so there is no
      // second place to get it wrong.
      gate: "always",
    },
  ]);
}
