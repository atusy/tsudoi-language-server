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
  LogMessageNotification,
  MessageType,
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
  customNotifications,
  handlerFailure,
  registerMethods,
  requestContext,
} from "./methods.ts";
import {
  createGatedConnection,
  createKeyedOperationQueue,
  defineNotifications,
  type RequestOnlyConnection,
} from "./notifications.ts";
import { deepFrozen, type TsudoiRuntime } from "./tsudoi.ts";
import type { DeepReadonly, TsudoiConfig } from "./types.ts";
import { type EditorWatch, watchEditor, watchStdin } from "./watchdog.ts";
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
  const { tsudoi, documents, workspaceFolders, handshake, connect } = runtime;
  const lifecycle = createLifecycle();
  const configuredNotifications = customNotifications(config, tsudoi);
  const documentLifecycleMethods: ReadonlySet<string> = new Set([
    DidOpenTextDocumentNotification.method,
    DidChangeTextDocumentNotification.method,
    DidCloseTextDocumentNotification.method,
  ]);
  const documentQueue = configuredNotifications.some((entry) =>
    documentLifecycleMethods.has(entry.method),
  )
    ? createKeyedOperationQueue()
    : undefined;
  let editorWatch: EditorWatch = watchEditor(null, () => undefined);

  /**
   * How a session that nobody ended ENDS: say why on stderr, then leave with the
   * code the lifecycle already decides for an `exit` that arrived without a
   * `shutdown`.
   *
   * ZERO, AND `lifecycle.exitCode()` IS THE WRONG ANSWER HERE -- WRITTEN THAT WAY
   * FIRST AND CAUGHT BY AN ARM THAT ALREADY PINNED IT. That function answers 0
   * once a `shutdown` has been seen and 1 otherwise, which is the protocol's rule
   * for the `exit` NOTIFICATION: it grades whether a client that asked to exit
   * did so politely. A CLIENT THAT VANISHED NEVER SENT `exit` AT ALL, so that
   * rule has nothing to say about it, and reusing it reports the client's absence
   * as tsudoi's failure. test/editor-death.test.ts states the contract in its own
   * name -- EOF ends the session at code 0 -- and the parent going is the same
   * event one door along.
   *
   * `process.exit` AND NOT `exitCode`, WHICH IS THE OPPOSITE OF THE HANDSHAKE
   * FAILURE'S CHOICE ONE SCREEN DOWN, and the difference is who is still
   * listening: that path has a RESPONSE TO FLUSH and must not lose it, where
   * this one runs because there is nobody left to flush to. Waiting for a loop
   * to empty is the very thing that failed here.
   */
  function endSession(why: string): never {
    editorWatch.stop();
    process.stderr.write(`tsudoi: exiting because ${why}\n`);
    return process.exit(0);
  }

  // EVERY notification tsudoi answers is declared here, and each one DECIDES
  // when it may run; that the router applies the gate rather than the handler
  // body is decided at `NotificationEntry.handler`.
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
    // THE CONFIG'S OWN NOTIFICATIONS ARRIVE AS AN ARGUMENT rather than being
    // registered where they were read, and that is the whole of what keeps this
    // feature inside the existing foreclosure: the router applies one gate in one
    // loop, and a module registering its own would need a connection of its own.
    configuredNotifications,
    documentQueue,
  );

  // BEFORE ANYTHING IS REGISTERED, WHICH IS WHAT MAKES `tsudoi.notify`'s OWN
  // REFUSAL UNREACHABLE FROM A HANDLER: every route into a config author's code
  // is opened below this line, so no handler can run while the runtime still has
  // no connection. Move this after the registrations and that refusal becomes
  // reachable for exactly the requests that arrive first.
  connect((method, params) => connection.sendNotification(method, params));

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
      // THE FIFTH FIELD, AND IT IS READ RATHER THAN RETAINED, which is what the
      // paragraph above asks of anyone who names one: `processId` is handed to
      // the watchdog and reaches `Tsudoi` nowhere, so tsudoi owes a config author
      // no answer about it. WHY IT IS READ AT ALL: the protocol says a server
      // SHOULD exit once the parent it was told about is gone, and a server whose
      // stdin never reaches EOF -- because some surviving process still holds the
      // write end -- otherwise waits for ever. One was found at 99.4% of a core
      // five days after its parent died.
      editorWatch.stop();
      editorWatch = watchEditor(initializeParams.processId, () => {
        endSession("its editor's process is gone");
      });
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
      // A WINDOW IN WHICH A NOTIFICATION IS DROPPED, RECORDED RATHER THAN
      // REPAIRED. The transition below records that the handshake HAPPENED, so
      // between the `await` and it `acceptsNotification` reads `serving` as false
      // and a notification is dropped -- silently, there being no response to
      // carry a refusal. It was zero while this handler could not yield and is now
      // the author handler's whole duration. ACCEPTED because LSP
      // forbids a conforming client from sending anything before it holds the
      // InitializeResult, so only a non-conforming or pipelining one can reach it.
      //
      // AND QUEUEING IS DELIBERATELY NOT BUILT, WHICH IS AN ARGUMENT AND NOT AN
      // ASSERTION: a queue would hold notifications against a session this
      // handler may still FAIL, and a failed handshake now takes the PROCESS with
      // it -- so the only correct disposal of everything queued is the drop that
      // already happens, arrived at later and with a buffer to explain.
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
      // WHICH LEAVES THAT REFUSAL ONE LEG. `every field on that surface is one
      // tsudoi then owes an answer about` is delivered by another route now:
      // `ConfigMethodMap["initialize"].params` is `InitializeParams`, published,
      // and reached by the cast above out of `unknown`. So tsudoi DOES owe an
      // answer about every field of it -- and pays with the narrowest one
      // available, that it read none of them. What it refuses to owe is a field a
      // SESSION MEMBER would make it answer about for the whole run.
      let answer: DeepReadonly<InitializeResult>;
      try {
        answer = await handler(
          { ...requestContext(tsudoi, cancellation), preparedResult: deepFrozen(preparedResult) },
          initializeParams,
        );
      } catch (error) {
        // THE AUTHOR'S OWN ERROR IS WHAT THE CLIENT IS ANSWERED WITH, which is
        // how every other handler failure in this tree ends and the one thing
        // this path does not share with the one below. It arrives as a bare
        // -32603 carrying their message: a conformant `InitializeError { retry }`
        // would need a `ResponseError`, and none of the four published subpaths
        // hands one over -- `deps/protocol` is type-only and `deps/types` carries
        // no such value -- so an author reaching it must name vscode-jsonrpc
        // directly, the one thing `deps/` exists to spare a config. Exporting the
        // class as a VALUE is the fix and it widens the published surface, so it
        // waits for someone who wants the field.
        return await endFailedHandshake(connection, handlerFailure("initialize", error), error);
      }
      // STRINGIFIED HERE BECAUSE PAST THIS FUNCTION NOBODY CAN REPORT IT.
      // vscode-jsonrpc serialises the answer after `initialize` returns, and
      // WHAT THAT COST, MEASURED ON BOTH RUNTIMES BEFORE THIS CHECK EXISTED: the
      // client was answered -32603, stderr stayed EMPTY -- the failure happens
      // past the catch above, so this was the one handler failure in the tree
      // with no `tsudoi: ` line locating it -- and a client sending `initialize`
      // again was refused -32600 `already initialized`, the phase having moved by
      // then. A wedged session and nothing anywhere saying why.
      //
      // THE STAKEHOLDER RULED THAT UNACCEPTABLE AND THE PRICE ACCEPTABLE: one
      // stringify of one small object, on the handshake path, once a session
      // THAT DECLARES THIS HANDLER -- the fast path above returns before it.
      //
      // THE CLIENT IS ANSWERED THE SENTENCE AND NOT WHAT WAS CAUGHT, which is
      // where this path parts from the one above: what is caught here is a
      // SERIALISATION failure -- sometimes the author's own getter, sometimes the
      // engine's words for a BigInt or a cycle, which the two runtimes word
      // differently -- so rethrowing it would answer with a sentence saying
      // nothing about what tsudoi was doing with their answer.
      //
      // AND WHAT SURVIVES THE CHECK IS ONE READ AWAY. This stringify and
      // vscode-jsonrpc's own are TWO READS of the same value, so an answer that
      // serialises once and not twice -- a getter counting its calls, a proxy,
      // the shape test/fixtures/handler-proxy-throws-on-second-read.ts already
      // builds for another seam -- passes here and wedges the session. MEASURED
      // on both runtimes: -32603, a further `initialize` refused -32600, stderr
      // EMPTY and no logMessage at all, which is the paragraph above intact. NOT
      // ARMED, on the argument the overturned record made and that still holds
      // for this narrower door -- an arm would pin the wedge as promised
      // behaviour. AND `JSON.parse(JSON.stringify(answer))` IS THE FIX AND IS NOT
      // TAKEN: it makes the two reads one by putting a COPY on the wire, which is
      // a change to what the client is served and not what was ruled on here.
      try {
        JSON.stringify(answer);
      } catch (error) {
        const sentence =
          `the config's initialize handler returned a value that cannot be ` +
          `serialised: ${error instanceof Error ? error.message : String(error)}`;
        return await endFailedHandshake(
          connection,
          sentence,
          new ResponseError(ErrorCodes.InternalError, sentence),
        );
      }
      // AFTER `handshake`, AFTER the contributors, BEFORE this line -- each forced
      // rather than chosen. Earlier than `handshake` the context's `tsudoi` reads
      // the pre-handshake nulls; earlier than the contributors `preparedResult` is
      // not yet what it is DEFINED as, the answer tsudoi would otherwise have sent;
      // and LATER THAN BOTH FAILURE PATHS, which no longer DEPEND on it -- they end
      // the process, so nothing reads the phase after them. What keeps it last is
      // the record: a session that never served must not have written down a
      // completed handshake on its way out.
      lifecycle.initialize();
      // WHAT THE HANDLER RETURNED IS THE RESULT, WITH NO FALLBACK: a handler
      // returning nothing has not returned an InitializeResult, and treating that
      // as `send the prepared one` would make the one mistake unobservable. THE
      // RESIDUE BESIDE IT, AND THE CHECK ABOVE DOES NOT COVER IT: a STRUCTURALLY
      // INVALID result is unchecked at run time, src/config.ts having validated
      // `typeof === "function"` and nothing more -- and such a result SERIALISES
      // PERFECTLY, so it reaches the client as an answer nobody graded.
      //
      // THE CAST TAKES `readonly` BACK OFF AND DOES NOTHING ELSE. The published
      // return is DeepReadonly so an author MAY return the very object they were
      // handed; this value is serialised and never written, so widening it is a
      // statement about tsudoi and not about them.
      return answer as InitializeResult;
    },
  );

  registerMethods(connection, config, tsudoi, () => lifecycle.requestRejection(), documentQueue);

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
  // AND `unref()` IS OWED BY ANYTHING AN `initialize` HANDLER OPENS TOO, which
  // the test observes nothing of: the config it drives declares no such handler.
  //
  // AND IF YOU EVER DO WANT A HOOK ON THAT CLOSE: `reader.onClose` FIRES ON BUN
  // AND NEVER ON DENO, so a handler installed there is silently inert on half the
  // supported runtimes. `process.stdin.on("end", ...)` fires on both.
  // THE END OF STDIN IS THE END OF THE SESSION, AS A DECISION RATHER THAN AS A
  // CONSEQUENCE. The unref requirement above buys the exit only while EVERY
  // handle obeys it, and the paragraph itself records that a handle opened
  // inside a config author's own handler is observed by nothing -- so one timer
  // in a hover handler is one orphaned server per crash, exactly the state this
  // is here to foreclose.
  watchStdin(() => {
    endSession("its client closed the connection");
  });
  connection.listen();
}

/**
 * How a handshake that cannot complete ends, whatever made it fail: the failure
 * is written where a config author reads their own server -- stderr AND
 * `window/logMessage` -- the client's `initialize` is ANSWERED, and the process
 * dies. ONE function and not two that resemble each other, because a handshake
 * that does not complete does the same thing in every case; what the two callers
 * supply is the sentence and the answer, which are the only things that differ.
 *
 * THE PROCESS DIES BECAUSE THE STAKEHOLDER RULED A SECOND `initialize` REFUSED
 * WITH NO EXCEPTION, and a session that cannot hand back the handshake has
 * nothing left to serve. What stood here was a backwards edge to `uninitialized`
 * -- `abandonInitialize` -- justified as `a failed handshake must not consume the
 * one initialize LSP permits, InitializeError.retry is unimplementable
 * otherwise`. THAT JUSTIFICATION WAS ALREADY FALSE WHEN IT WAS WRITTEN, which is
 * worth more than the deletion: MEASURED, tsudoi never produces an
 * `InitializeError` at all -- the failure goes out as a bare -32603 with no
 * `data`, and no value route from the four published subpaths reaches a
 * `ResponseError` -- so no conforming client was ever told by tsudoi that it
 * might retry. The edge served a client retrying on its OWN initiative, which
 * the specification's `The initialize request may only be sent once` forbids.
 *
 * `exitCode` AND A PAUSED READER RATHER THAN `process.exit`, and that is what
 * buys the ANSWER: `process.exit` takes the unflushed response frame with it,
 * and a timer racing it is a race whichever way it lands. Pausing the reader
 * releases the one handle holding the loop open (see `connection.listen`) while
 * leaving the connection able to write, so the process ends of itself once the
 * answer has gone. MEASURED on both runtimes, every run: the logMessage, then
 * the response, then exit 1.
 *
 * THE NOTIFICATION IS AWAITED, and that is the repair rather than tidiness: an
 * unawaited frame is not on the wire when the loop empties, which is the same
 * silence in a different costume.
 */
async function endFailedHandshake(
  connection: Pick<RequestOnlyConnection, "sendNotification">,
  sentence: string,
  answer: unknown,
): Promise<never> {
  process.stderr.write(`tsudoi: ${sentence}\n`);
  await connection.sendNotification(LogMessageNotification.type, {
    type: MessageType.Error,
    message: `tsudoi: ${sentence}`,
  });
  process.exitCode = 1;
  process.stdin.pause();
  throw answer;
}

/**
 * The sentence a malformed `initialize` must be refused with, or undefined where
 * the handshake may proceed.
 *
 * WHAT IS CHECKED IS WHAT TSUDOI READS AND ANSWERS FOR, AND NOT
 * `InitializeParams` AS A WHOLE. `what tsudoi publishes` WOULD BE THE WRONG RULE:
 * `ConfigMethodMap["initialize"].params` publishes the message ENTIRE, and the
 * rest of it reaches a config author's handshake handler UNCHECKED, declared
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
      queue: (params) => params.textDocument.uri,
    },
    {
      type: DidChangeTextDocumentNotification.type,
      handler: (params) => documents.change(params),
      gate: "lifecycle",
      queue: (params) => params.textDocument.uri,
    },
    {
      type: DidCloseTextDocumentNotification.type,
      handler: (params) => documents.close(params),
      gate: "lifecycle",
      queue: (params) => params.textDocument.uri,
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
