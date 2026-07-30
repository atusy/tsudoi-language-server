import process from "node:process";
import {
  DidChangeTextDocumentNotification,
  DidChangeWorkspaceFoldersNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ExitNotification,
  InitializedNotification,
  type InitializeParams,
  InitializeRequest,
  type InitializeResult,
  type Logger,
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
import type { Tsudoi, TsudoiConfig } from "./types.ts";
import { createWorkspaceFolders, type WorkspaceFoldersHandle } from "./workspace.ts";

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
export function startServer(
  config: TsudoiConfig,
  documents: DocumentStoreHandle,
  tsudoi: Tsudoi,
): void {
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

  // The workspace folders this session answers from. A HANDLE rather than a
  // local: what writes it and what reads it are different messages, and
  // workspace.ts is where that split lives.
  const workspaceFolders = createWorkspaceFolders();

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

  connection.onRequest(InitializeRequest.type, (params: InitializeParams): InitializeResult => {
    // THE GATE THIS REQUEST CONSULTS IS ITS OWN, and it is not the one every
    // other request asks: requestRejection() would answer ServerNotInitialized
    // to the very message that clears that phase, making the state it guards
    // unreachable. So `never refuses` holds for the UNINITIALIZED phase alone --
    // it is not a blanket carve-out, and after `shutdown` the refusal is what
    // keeps a clean session's `exit` reading 0. The phase reading itself stays in
    // src/lifecycle.ts, beside the code it answers with.
    const rejection = lifecycle.initializeRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    lifecycle.initialize();
    // THREE FIELDS, DELIBERATELY, AND NOT ONE MORE -- they are the three the
    // protocol lets a client name a ROOT in, and nothing else here is read.
    // `params` carries the client's capabilities too, and a config author
    // cannot see them -- LSP 3.16's
    // `completion.completionItem.insertReplaceSupport` is the known case, and
    // examples/completion-path.ts sends that shape unconditionally because of
    // it. That is a SECOND consumer of this argument, not a reason to widen
    // this line: retaining `params` wholesale would put the whole of
    // InitializeParams on tsudoi's surface as a side effect of needing three
    // fields of it. Whoever needs capabilities opens a seam for capabilities.
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
    workspaceFolders.initialize(params);
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
      // workspace.ts is dead code, and RequestContext.workspaceFolders is frozen
      // for the life of the session at whatever `initialize` stated.
      //
      // UNCONDITIONAL, AND THAT IS WHY IT IS HERE RATHER THAN CONTRIBUTED FROM
      // THE TABLE IN src/methods.ts. Those entries are claimed per method because
      // a client is entitled to send whatever it was told about and the CONFIG
      // may have no handler to answer with. This one answers to nothing the
      // config declares: tsudoi mirrors the folders and populates
      // RequestContext.workspaceFolders whether or not any method is supplied,
      // so it is a fact about tsudoi, and conditioning it would advertise less
      // than tsudoi does.
      //
      // NOR IS IT CONDITIONED ON THE CLIENT'S OWN `workspace.workspaceFolders`,
      // which would mean reading `params.capabilities` here -- the widening the
      // note above refuses. A client that did not ask for this simply ignores it.
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
    return { capabilities, serverInfo: { name: "tsudoi" } };
  });

  // What the config can answer lives in its own module: lifecycle and document
  // sync are tsudoi's own business, whereas these hand control to code the
  // config author wrote and have a failure path of their own.
  registerMethods(
    connection,
    config,
    tsudoi,
    () => lifecycle.requestRejection(),
    () => ({
      // WHAT ONE REQUEST SEES OF THE CLIENT'S ROOTS, assembled at request start
      // from the two readers rather than held as one value: the folder list moves
      // under `workspace/didChangeWorkspaceFolders` and the two root fields never
      // move at all, and a single stored object would have to be rewritten by the
      // notification to keep that straight.
      workspaceFolders: workspaceFolders.current(),
      ...workspaceFolders.roots(),
    }),
  );

  // ShutdownRequest's declared result is void; vscode-jsonrpc puts null on the
  // wire for it, which is what the LSP specification requires.
  connection.onRequest(ShutdownRequest.type, (): void => {
    const rejection = lifecycle.requestRejection();
    if (rejection !== undefined) {
      throw rejection;
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
  workspaceFolders: WorkspaceFoldersHandle,
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
