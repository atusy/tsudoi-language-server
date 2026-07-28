import process from "node:process";
import {
  createProtocolConnection,
  DidChangeTextDocumentNotification,
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
  type WorkspaceFolder,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import { createLifecycle, type Lifecycle } from "./lifecycle.ts";
import { registerMethods } from "./methods.ts";
import { defineNotifications, registerNotifications } from "./notifications.ts";
import type { Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * Where vscode-jsonrpc reports what it cannot answer for -- above all a
 * notification handler that threw, which it catches and would otherwise discard
 * in silence, since a notification has no response to carry the failure.
 *
 * Every level goes to stderr. stdout carries the protocol and nothing else, so
 * console.log here would corrupt the very stream the client is framing.
 *
 * WHAT THIS LOGGER DOES NOT COVER, recorded because the natural inference from
 * the paragraph above is WRONG and would manufacture a defect that does not
 * exist: a notification with NO REGISTERED HANDLER never reaches this logger at
 * all. MEASURED on both runtimes -- `workspace/didChangeWorkspaceFolders`,
 * `$/setTrace` and an invented `totally/madeUp` each produced ZERO BYTES here,
 * with a throwing hover in the SAME session through the SAME reader writing its
 * line, so the silence is real and not a reader that cannot see stderr. The
 * session stayed functional and exited 0: inert, not merely quiet.
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
  const connection = createProtocolConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
    stderrLogger,
  );

  // Every question about WHEN a message is allowed goes to this one object.
  // The gate it backs reaches what tsudoi REGISTERED, never the dispatch as a
  // whole -- that is what leaves a method nobody registered falling through to
  // vscode-jsonrpc's MethodNotFound, since `not initialized yet` and `no such
  // method` are different diagnoses.
  //
  // NOTIFICATIONS NO LONGER CONSULT IT ONE BY ONE, and the sentence above used
  // to say they did: each entry below DECLARES when it may run and
  // registerNotifications applies that. Requests still ask for themselves, in
  // methods.ts, because a refused request must be ANSWERED with a code the
  // handler's own signature can carry.
  const lifecycle = createLifecycle();

  /**
   * The workspace folders this session was opened with, for the handlers that
   * run afterwards. Empty until `initialize` arrives, which is the only moment
   * a client states them -- and the reason they are read here rather than
   * handed to the config factory, which has already run by now.
   */
  let workspaceFolders: readonly WorkspaceFolder[] = [];

  connection.onRequest(InitializeRequest.type, (params: InitializeParams): InitializeResult => {
    // initialize is the one request the gate may never refuse -- refusing it
    // would make the state it guards unreachable.
    lifecycle.initialize();
    // ONE FIELD, DELIBERATELY. `params` carries the client's capabilities too,
    // and a config author cannot see them -- LSP 3.16's
    // `completion.completionItem.insertReplaceSupport` is the known case, and
    // examples/completion-path.ts sends that shape unconditionally because of
    // it. That is a SECOND consumer of this argument, not a reason to widen
    // this line: retaining `params` wholesale would put the whole of
    // InitializeParams on tsudoi's surface as a side effect of needing one
    // field of it. Whoever needs capabilities opens a seam for capabilities.
    //
    // NORMALISED HERE AND NOWHERE ELSE. The protocol has TWO absent states --
    // the field omitted, and the field sent as null -- and no config author
    // should have to know that, nor should either be able to reach one of
    // their handlers wearing the shape of a value. `??` is what covers both;
    // an `=== undefined` check covers one and lets the other through.
    //
    // What absence must NEVER become is a ROOT. cwd is the tempting default
    // and the dangerous one: nvim spawns the server with cwd = root_dir when a
    // root is found and its own launch directory when not, so a cwd fallback
    // looks correct in every test and is silently wrong for the user who has
    // no root -- which is the state this normalisation exists to make visible.
    workspaceFolders = params.workspaceFolders ?? [];
    const capabilities: ServerCapabilities = {
      // openClose is not optional: advertising only `change` entitles a
      // conforming client to withhold didOpen/didClose, and then the store
      // never sees a document however correct its own code is.
      // Full, not Incremental: the client resends the whole buffer, so no
      // position/offset machinery is needed to answer getText().
      textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Full },
    };
    // Per-method and spelled out, not derived from the shape of `methods`: a
    // client is entitled to send whatever it was told about, so each capability
    // is claimed only where the config can actually answer it.
    if (config.methods?.["textDocument/hover"] !== undefined) {
      capabilities.hoverProvider = true;
    }
    // Empty options, not triggerCharacters: TsudoiConfig has no surface for a
    // config author to declare them, and claiming trigger characters nobody
    // configured would have the client ask at moments the handler knows
    // nothing about.
    if (config.methods?.["textDocument/completion"] !== undefined) {
      capabilities.completionProvider = {};
    }
    return { capabilities, serverInfo: { name: "tsudoi" } };
  });

  // EVERY notification tsudoi answers is declared here, and each one DECIDES
  // when it may run. The gate is applied by registerNotifications, never by a
  // handler body: a body that could consult it is a body that could forget to,
  // which is what these entries replaced.
  //
  // WHERE workspace/didChangeWorkspaceFolders WOULD GO, and why it is not here
  // yet: the folders read above are a SNAPSHOT of initialize, and a user adding
  // or removing a folder mid-session leaves it stale. MEASURED both ways -- the
  // notification arrives even when the server advertises `capabilities: {}` --
  // so this is ignored rather than opted out of, and staleness cannot be
  // foreclosed by declining to advertise.
  //
  // Also measured, and it is what makes ignoring it tolerable for now rather
  // than urgent: an unregistered notification is SILENT and INERT. Nothing
  // reaches stderr, the session stays functional and exits 0.
  //
  // Handling it means updating the captured list and is a separate story --
  // whoever takes it adds an ENTRY HERE and edits the `let workspaceFolders`
  // above, and should say at the type that the value tracks changes once it
  // does.
  registerNotifications(connection, lifecycle, notificationEntries(documents, lifecycle));

  // What the config can answer lives in its own module: lifecycle and document
  // sync are tsudoi's own business, whereas these hand control to code the
  // config author wrote and have a failure path of their own.
  registerMethods(
    connection,
    config,
    tsudoi,
    () => lifecycle.requestRejection(),
    () => workspaceFolders,
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

  connection.listen();
}

/**
 * Every notification tsudoi answers, as a VALUE.
 *
 * Built here rather than inline at the call site so the decisions are
 * READABLE BY A TEST: `exit`'s carve-out is the one that turns a mistake into a
 * hung process, and asserting the entry DECLARES `always` catches that
 * immediately by name instead of as a suite that stopped finishing.
 *
 * IF THE SUITE HANGS, CHECK THIS TABLE'S GATES -- a `lifecycle` on `exit`
 * leaves the server alive after the client asked it to die, and the only
 * symptom is a run that used to take twelve seconds taking minutes.
 */
export function notificationEntries(documents: DocumentStoreHandle, lifecycle: Lifecycle) {
  return defineNotifications([
    {
      type: InitializedNotification.type,
      // The client is ready. Registered rather than left unhandled so that
      // vscode-jsonrpc does not log it as unanswered on every session.
      handler: () => {},
      // NOT CONSTRUCTED, and the label is deliberate: writing `always` here is
      // entirely REPRESENTABLE, so this is not foreclosed -- what is missing is
      // any observable consequence, because the body is empty and a dropped
      // delivery has nothing to fail to do. THE RESIDUAL: this gate choice is
      // UNVERIFIED, and stays so until the handler has its first line of body.
      //
      // REASONED, not measured: `lifecycle` is what the message MEANS -- `the
      // client is ready to serve` outside a serving session says nothing.
      gate: "lifecycle",
    },
    // The three sync notifications are pure delegation: what a full-sync buffer
    // means is documents.ts's business, and none of them answers the client.
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
