import process from "node:process";
import {
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
import { contributeCapabilities, registerMethods } from "./methods.ts";
import { createGatedConnection, defineNotifications } from "./notifications.ts";
import type { TsudoiRuntime } from "./tsudoi.ts";
import type { TsudoiConfig } from "./types.ts";
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
  connection.onRequest(InitializeRequest.type, (params: unknown): InitializeResult => {
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
    // THIS HANDLER IS SYNCHRONOUS, and nothing reddens if you make it async: the
    // transition below records that the handshake HAPPENED, and an `await` above
    // it opens a window in which a notification reads `uninitialized` and is
    // DROPPED, silently, since there is no response to carry a refusal.
    lifecycle.initialize();
    return { capabilities, serverInfo: { name: "tsudoi" } };
  });

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
  // AND IF YOU EVER DO WANT A HOOK ON THAT CLOSE: `reader.onClose` FIRES ON BUN
  // AND NEVER ON DENO, so a handler installed there is silently inert on half the
  // supported runtimes. `process.stdin.on("end", ...)` fires on both.
  connection.listen();
}

/**
 * The sentence a malformed `initialize` must be refused with, or undefined where
 * the handshake may proceed.
 *
 * WHAT IS CHECKED IS WHAT TSUDOI PUBLISHES, AND NOT `InitializeParams` AS A
 * WHOLE. Of the four fields read off this message, these are the ones whose
 * PUBLISHED TYPE is the promise being kept: `Tsudoi` declares `rootUri` as
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
