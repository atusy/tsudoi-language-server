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
 * Notification failures have no response frame; report upstream errors on stderr.
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
   * Editor loss is a normal exit, independent of the shutdown/exit notification sequence.
   * Exit immediately: no client remains to receive output, and config-owned handles
   * may otherwise keep the process alive.
   */
  function endSession(why: string): never {
    editorWatch.stop();
    process.stderr.write(`tsudoi: exiting because ${why}\n`);
    return process.exit(0);
  }

  // Keep notification registration inside the gated router. Its returned connection
  // has no notification registration methods; lint also prevents bypassing it here.
  const connection = createGatedConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
    stderrLogger,
    lifecycle,
    notificationEntries(documents, lifecycle, workspaceFolders),
    configuredNotifications,
    documentQueue,
  );

  // Connect before registering handlers so their tsudoi.notify calls can send.
  connect((method, params) => connection.sendNotification(method, params));

  // Validate wire data before treating it as InitializeParams.
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
      // Retain only the session fields exposed by Tsudoi.
      handshake(initializeParams);
      // Watch the editor PID as well as stdin: another process may hold the pipe open.
      editorWatch.stop();
      editorWatch = watchEditor(initializeParams.processId, () => {
        endSession("its editor's process is gone");
      });
      const capabilities: ServerCapabilities = {
        textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental },
        // Workspace folders are mirrored even when the config supplies no handlers.
        workspace: { workspaceFolders: { supported: true, changeNotifications: true } },
      };
      contributeCapabilities(config, capabilities);
      const preparedResult: InitializeResult = { capabilities, serverInfo: { name: "tsudoi" } };
      const handler = config.methods?.initialize;
      if (handler === undefined) {
        lifecycle.initialize();
        return preparedResult;
      }
      // Reject concurrent initialize requests before the handler can yield.
      lifecycle.beginInitialize();
      // Lifecycle-gated notifications remain blocked until initialization succeeds.
      // The handler has no deadline; its completion controls handshake duration.
      let answer: DeepReadonly<InitializeResult>;
      try {
        answer = await handler(
          { ...requestContext(tsudoi, cancellation), preparedResult: deepFrozen(preparedResult) },
          initializeParams,
        );
      } catch (error) {
        return await endFailedHandshake(connection, handlerFailure("initialize", error), error);
      }
      // Check serialization before recording a successful handshake so failures can
      // be logged and terminate the session. This does not validate the result shape.
      // Upstream serializes again: stateful getters can still fail on that second read.
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
      // Enter the serving phase only after the handler and serialization check succeed.
      lifecycle.initialize();
      // Return the handler result without a fallback. Removing readonly is safe here
      // because the connection serializes the value without modifying it.
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

  // ProtocolConnection omits the upstream catch-all onRequest overload. Restore
  // that overload without exposing notification registration methods.
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

  // Explicitly exit on EOF even if a config handler left active timers or sockets.
  // watchStdin uses stdin events because reader.onClose does not fire on Deno.
  watchStdin(() => {
    endSession("its client closed the connection");
  });
  connection.listen();
}

/**
 * Report a failed handshake and end the session; initialize cannot be retried.
 * Await the log notification and use exitCode with a paused reader so the error
 * response can flush. process.exit would discard buffered output.
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
 * Validate the fields retained without normalization. Workspace handling normalizes
 * rootPath and workspaceFolders separately. Other fields reach the initialize
 * handler without runtime validation.
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
 * Keep notification gates inspectable, particularly the unconditional exit route.
 */
export function notificationEntries(
  documents: DocumentStoreHandle,
  lifecycle: Lifecycle,
  workspaceFolders: Pick<WorkspaceFoldersHandle, "change">,
) {
  return defineNotifications([
    {
      type: InitializedNotification.type,
      // Register initialized as an explicit no-op within the lifecycle gate.
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
      // The lifecycle determines the exit code, but must never block exit.
      handler: () => process.exit(lifecycle.exitCode()),
      gate: "always",
    },
  ]);
}
