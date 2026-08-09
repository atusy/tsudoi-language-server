import process from "node:process";
import {
  type CancellationToken,
  DidChangeTextDocumentNotification,
  DidChangeWorkspaceFoldersNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  type Disposable,
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
  type StarRequestHandler,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import { createLifecycle, type Lifecycle } from "./lifecycle.ts";
import {
  contributeCapabilities,
  registerMethods,
  reportHandlerFailure,
  requestContext,
} from "./methods.ts";
import { createGatedConnection, defineNotifications } from "./notifications.ts";
import { deepFrozen, type TsudoiRuntime } from "./tsudoi.ts";
import type { DeepReadonly, TsudoiConfig } from "./types.ts";
import type { WorkspaceFoldersHandle } from "./workspace.ts";

/**
 * Where vscode-jsonrpc reports what it cannot answer for -- above all a
 * notification handler that threw, which it catches and would otherwise discard
 * in silence, since a notification has no response to carry the failure.
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
 */
export function startServer(config: TsudoiConfig, runtime: TsudoiRuntime): void {
  const { tsudoi, documents, workspaceFolders, handshake } = runtime;
  const lifecycle = createLifecycle();

  // EVERY notification tsudoi answers is declared here, and each one DECIDES
  // when it may run. The gate is applied by the router, never by a handler
  // body: a body that could consult it is a body that could forget to.
  //
  // AND THE CONNECTION COMES BACK WITHOUT AN `onNotification` TO CALL. This
  // line is the only connection this file has, and `startServer` must NEVER
  // bind the wide type: narrowing after the fact would leave the wide value in
  // scope and foreclose nothing. The one route left -- importing
  // `createProtocolConnection` here -- is BANNED IN THIS FILE by .oxlintrc.json;
  // why a detector is enough for it, and what that depends on, is at
  // `createGatedConnection`.
  const connection = createGatedConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
    stderrLogger,
    lifecycle,
    notificationEntries(documents, lifecycle, workspaceFolders),
  );

  // `unknown` AND NOT `InitializeParams`, AND THE CAST IS DELAYED past the check
  // below for the reason src/config.ts records at its own delayed cast: nothing
  // reddens if you annotate it, and that is the trouble -- declaring the wire's
  // bytes to be the shape a CONFORMING client sends makes every check on them
  // dead code to the type checker.
  connection.onRequest(
    InitializeRequest.type,
    async (params: unknown, cancellation: CancellationToken): Promise<InitializeResult> => {
      const rejection = lifecycle.initializeRejection();
      if (rejection !== undefined) {
        throw rejection;
      }
      const malformed = malformedInitializeParams(params);
      if (malformed !== undefined) {
        throw new ResponseError(ErrorCodes.InvalidParams, malformed);
      }
      const initializeParams = params as InitializeParams;
      // FOUR FIELDS, DELIBERATELY, AND NOT ONE MORE: the three the protocol lets a
      // client name a ROOT in, and the CAPABILITIES the client declared. `params`
      // is NOT retained -- doing that would put the whole of InitializeParams on
      // tsudoi's surface as a side effect of needing four fields of it, and every
      // field on that surface is one tsudoi then owes an answer about. A FIFTH
      // FIELD IS THE SAME TRANSACTION AND NOT A PRECEDENT ALREADY SET: name the
      // reader, or the field stays unread.
      handshake(initializeParams);
      const capabilities: ServerCapabilities = {
        textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental },
        // UNCONDITIONAL, and nothing reddens if you condition it on the config or
        // on the client's own `workspace.workspaceFolders`: tsudoi mirrors the
        // folders and populates Tsudoi.workspaceFolders whether or not any method
        // is supplied, so this is a fact about tsudoi, and conditioning it would
        // advertise less than tsudoi delivers.
        workspace: { workspaceFolders: { supported: true, changeNotifications: true } },
      };
      contributeCapabilities(config, capabilities);
      const preparedResult: InitializeResult = { capabilities, serverInfo: { name: "tsudoi" } };
      const handler = config.methods?.initialize;
      if (handler === undefined) {
        lifecycle.initialize();
        return preparedResult;
      }
      // ADMITTED BEFORE THE AWAIT, AND THIS LINE IS A REPAIR RATHER THAN A
      // PRECAUTION. Without it a second `initialize` arriving while the handler
      // runs reads `uninitialized` and is ACCEPTED -- MEASURED, both handshakes
      // served, `handshake` run twice from concurrent flows and the author's
      // handler run twice, with nothing on stderr. The fast path above never
      // yields, which is why no session without a handler could show it.
      lifecycle.beginInitialize();
      // THIS HANDLER WAS SYNCHRONOUS AND IS NO LONGER, AND WHAT THAT COSTS IS
      // RECORDED RATHER THAN REPAIRED. The transition below records that the
      // handshake HAPPENED, so between the `await` and it there is a window in
      // which `acceptsNotification` reads `serving` as false and a notification is
      // DROPPED -- silently, there being no response to carry a refusal. It used to
      // be zero and is now the author handler's duration. ACCEPTED because LSP
      // forbids a conforming client from sending anything before it holds the
      // InitializeResult, so only a non-conforming or pipelining one can reach it.
      //
      // AND QUEUEING IS DELIBERATELY NOT BUILT, WHICH IS AN ARGUMENT AND NOT AN
      // ASSERTION: a queue would hold notifications against a session this
      // handler may still FAIL, and the catch below returns the phase to
      // uninitialized -- so the only correct disposal of everything queued is the
      // drop that already happens, arrived at later and with a buffer to explain.
      // Note what this warns: nothing reddens if you drop a notification in here,
      // which is the whole subject -- no arm sends one into this window. The
      // WINDOW is a different question and does have colour now: CLOSING it, by
      // moving the transition above the await, reddens the concurrency arm in
      // test/initialize-handler.test.ts on the refusal's MESSAGE. MEASURED.
      //
      // NOTHING BOUNDS THIS CALL EITHER. Every table method runs through
      // `answerUnlessCancelled`; this one runs through nothing, so a handler that
      // never settles hangs the handshake with no diagnostic anywhere. Same class,
      // same acceptance: reachable only through the author's own code, and a
      // deadline here would be tsudoi deciding how long a config may take to
      // describe itself.
      //
      // THE WHOLE `InitializeParams` IS HANDED OVER, and that is NOT a way around
      // the four fields above: that refusal is about what the SESSION OBJECT
      // RETAINS, and this argument is the message. Nothing here is retained.
      //
      // BUT THE REFUSAL RESTED ON TWO LEGS AND ONLY ONE IS LEFT STANDING.
      // `every field on that surface is one tsudoi then owes an answer about` is
      // now delivered by another route: `ConfigMethodMap["initialize"].params` is
      // `InitializeParams`, published, and reached by the cast above out of
      // `unknown`. So tsudoi DOES owe an answer about every field of it -- and
      // pays with the narrowest one available, that it read none of them. What
      // it refuses to owe is a field a SESSION MEMBER would make it answer about
      // for the whole run.
      let answer: DeepReadonly<InitializeResult>;
      try {
        answer = await handler(
          { ...requestContext(tsudoi, cancellation), preparedResult: deepFrozen(preparedResult) },
          initializeParams,
        );
      } catch (error) {
        // THE ADMISSION IS GIVEN BACK BEFORE THE RETHROW, and the order is the
        // whole of it: `reportHandlerFailure` returns `never`, so a line after it
        // would leave the session wedged at `initializing` -- every later
        // `initialize` refused -32600 and every request -32002, with no way out.
        // Giving it back is what keeps the client answered an error, the NEXT
        // request reading -32002, and a corrected `initialize` ACCEPTED. THE ONE
        // THING NOT UNDONE IS `handshake`, and it is not owed: both of its
        // writers overwrite unconditionally, so the retry is clean.
        //
        // ALL OF WHICH IS ABOUT A HANDLER THAT THREW, AND ONLY THAT. A handler
        // that RETURNS badly is answered an error too and is NOT retryable; the
        // residue is recorded at the return below, where it happens.
        //
        // AND WHAT AN AUTHOR CANNOT THROW HERE IS RECORDED RATHER THAN FIXED: a
        // conformant `InitializeError { retry }` needs a `ResponseError`, and
        // none of the four published subpaths hands one over -- `deps/protocol`
        // is type-only and `deps/types` carries no such value -- so reaching it
        // means naming vscode-jsonrpc directly, which is the one thing `deps/`
        // exists to spare a config. Exporting the class as a VALUE is the fix
        // and it widens the published surface, so it waits for someone who wants
        // the field. Until then every handshake failure the author raises is
        // -32603 with their own message.
        lifecycle.abandonInitialize();
        reportHandlerFailure("initialize", error);
      }
      // AFTER `handshake`, AFTER the contributors, BEFORE this line -- each forced
      // rather than chosen. Earlier than `handshake` the context's `tsudoi` reads
      // the pre-handshake nulls; earlier than the contributors `preparedResult` is
      // not yet what it is DEFINED as, the answer tsudoi would otherwise have sent;
      // and LATER than this line the phase would already have moved when a handler
      // throws, which is exactly what the catch above depends on.
      lifecycle.initialize();
      // WHAT THE HANDLER RETURNED IS THE RESULT, WITH NO FALLBACK: a handler
      // returning nothing has not returned an InitializeResult, and treating that
      // as `send the prepared one` would make the one mistake unobservable. THE
      // RESIDUE BESIDE IT: a STRUCTURALLY INVALID result is unchecked at run time,
      // src/config.ts having validated `typeof === "function"` and nothing more.
      //
      // AND A SECOND RESIDUE THAT IS NOT THAT ONE: an UNSERIALIZABLE result --
      // a BigInt, a cycle, a getter that throws -- is the one failure that
      // WEDGES THE SESSION. vscode-jsonrpc stringifies AFTER this function
      // returns, so the phase has already moved: MEASURED on both runtimes, the
      // client is answered -32603 and the retry it would make is refused -32600
      // `already initialized`. WHAT IT COSTS THE AUTHOR IS THE SILENCE: the
      // failure happens past this function, so `reportHandlerFailure` never
      // runs and stderr stays EMPTY -- measured, beside zero unframed bytes on
      // stdout -- so this is the one handler failure in the tree with no
      // `tsudoi: ` line locating it. A structurally invalid
      // result serializes perfectly, so the residue above does not cover it, and
      // `abandonInitialize` cannot: the try completed successfully.
      //
      // RECORDED AND NOT CAUGHT, WHICH IS A CHOICE AND NOT AN OVERSIGHT. Catching
      // it means stringifying every handshake answer HERE, before the transition,
      // and throwing away the result -- one full serialization of every session's
      // handshake, on every run, to convert a config author's own bug from an
      // unretryable -32603 into a retryable one. NO ARM EITHER, deliberately: an
      // arm would pin the wedge as the promised behaviour, and this is the half
      // whoever catches it should be free to delete.
      //
      // THE CAST TAKES `readonly` BACK OFF AND DOES NOTHING ELSE. The published
      // return is DeepReadonly so an author MAY return the very object they were
      // handed; this value is serialised and never written, so widening it is a
      // statement about tsudoi and not about them.
      return answer as InitializeResult;
    },
  );

  registerMethods(connection, config, tsudoi, () => lifecycle.requestRejection());

  connection.onRequest(ShutdownRequest.type, (...args: readonly unknown[]): void => {
    const rejection = lifecycle.requestRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    if (args.length > 1) {
      throw new ResponseError(
        ErrorCodes.InvalidParams,
        `shutdown takes no params; received ${JSON.stringify(args.slice(0, -1))}`,
      );
    }
    lifecycle.shutDown();
  });

  // THE CAST WIDENS `onRequest` AND NOTHING ELSE, which is the sentence to read
  // before suspecting it of reopening what createGatedConnection forecloses.
  // vscode-jsonrpc's `MessageConnection` declares this star overload and
  // `ProtocolConnection` RE-DECLARES `onRequest` without it, so the VALUE has a
  // registration its TYPE does not name. Intersecting one member back leaves
  // `onNotification`, `onUnhandledNotification`, `onProgress` and `trace` absent
  // from the handle, so the notification gate is exactly as foreclosed as it was.
  const withFallback = connection as typeof connection & {
    onRequest(handler: StarRequestHandler): Disposable;
  };
  withFallback.onRequest((method: string): never => {
    const rejection = lifecycle.requestRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    throw new ResponseError(ErrorCodes.MethodNotFound, `Unhandled method ${method}`);
  });

  // THIS PROCESS EXITS WHEN ITS EDITOR DIES BECAUSE NOTHING KEEPS THE EVENT LOOP
  // ALIVE: the reader above is the only thing waiting on anything, so when the
  // editor's end of the pipe closes the loop empties and the process ends. SO
  // ANY TIMER, SOCKET, WATCHER OR SUBSCRIPTION ADDED ANYWHERE IN src/ MUST BE
  // unref()'d -- an un-unref'd handle does not slow anything down, it makes
  // tsudoi OUTLIVE THE EDITOR FOREVER, one orphaned server per crash.
  //
  // AND HERE IS WHAT THE CHECK DOES NOT REACH, because the requirement is wider
  // than it: test/editor-death.test.ts sends one `initialize` and nothing else,
  // so it observes handles created on the STARTUP AND INITIALIZE PATH alone. A
  // timer opened inside a hover handler, inside a document change, or on the
  // shutdown path reddens NOTHING there or anywhere else -- every other session
  // in the suite ends by `exit` or by being killed, and neither notices a
  // lingering handle.
  //
  // THAT PATH NOW RUNS A CONFIG AUTHOR'S OWN CODE, so the sentence above widened
  // WITHOUT THE TEST MOVING: `unref()` is owed by anything an `initialize`
  // handler opens too. What it actually observes did not widen at all -- the
  // config it drives declares no such handler -- so the coverage claim is
  // nominal, and a config that opened a handle in its handshake would be
  // measured by nothing here.
  //
  // AND IF YOU EVER DO WANT A HOOK ON THAT CLOSE: `reader.onClose` FIRES ON BUN
  // AND NEVER ON DENO, so a handler installed there is silently inert on half the
  // supported runtimes. `process.stdin.on("end", ...)` fires on both.
  connection.listen();
}

/**
 * The sentence a malformed `initialize` must be refused with, or undefined where
 * the handshake may proceed.
 *
 * WHAT IS CHECKED IS WHAT TSUDOI READS AND ANSWERS FOR, AND NOT
 * `InitializeParams` AS A WHOLE -- AND `what tsudoi publishes` IS THE WRONG RULE
 * NOW THAT `ConfigMethodMap["initialize"].params` PUBLISHES THE MESSAGE ENTIRE.
 * The rest of it reaches a config author's handshake handler UNCHECKED, declared
 * `InitializeParams` by a cast off `unknown` and inspected by nothing.
 *
 * Of the four fields read off this message, these are the ones whose PUBLISHED
 * TYPE is the promise being kept: `Tsudoi` declares `rootUri` as
 * `string | null` and `clientCapabilities` as an object, and nothing downstream
 * inspects either. `rootPath` and `workspaceFolders` fall on the other side
 * because src/workspace.ts REDUCES both to states they already have and that
 * already mean `the client named none` -- where a `rootUri` that is a NUMBER did
 * not name no root, it sent something no reading of this protocol makes sense of.
 */
function malformedInitializeParams(params: unknown): string | undefined {
  if (typeof params !== "object" || params === null) {
    return `initialize params must be an object; received ${JSON.stringify(params)}`;
  }
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
 */
export function notificationEntries(
  documents: DocumentStoreHandle,
  lifecycle: Lifecycle,
  workspaceFolders: Pick<WorkspaceFoldersHandle, "change">,
) {
  return defineNotifications([
    {
      type: InitializedNotification.type,
      // AN EMPTY HANDLER, KEPT FOR THIS TABLE RATHER THAN FOR THE WIRE. MEASURED
      // on vscode-jsonrpc 9.0.1: an UNREGISTERED notification is fired at
      // `unhandledNotificationEmitter` and logged by nobody -- what produces
      // `Notification handler '...' failed` is a REGISTERED handler that THROWS
      // -- and nothing here subscribes, `onUnhandledNotification` being one of
      // the members `RequestOnlyConnection` removes. So the entry earns its line
      // by DECLARING that `initialized` is answered by doing nothing, inside the
      // lifecycle window, rather than leaving it absent and unexamined.
      handler: () => {},
      gate: "lifecycle",
    },
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
      handler: (params) => workspaceFolders.change(params.event),
      gate: "lifecycle",
    },
    {
      type: ExitNotification.type,
      // Reads the lifecycle for the CODE, never for permission -- exitCode() is
      // not the gate, and this handler decides nothing about whether it runs.
      handler: () => process.exit(lifecycle.exitCode()),
      gate: "always",
    },
  ]);
}
