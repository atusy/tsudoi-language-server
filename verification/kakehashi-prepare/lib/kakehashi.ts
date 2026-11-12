// One kakehashi process under test, with its downstream servers wrapped in
// recording proxies and (optionally) tsudoi as its prepare peer.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LspClient, type Received, type RpcMessage, sleep } from "./lsp.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const harnessRoot = dirname(here);
export const repoRoot = dirname(dirname(harnessRoot));
const tee = join(here, "tee.ts");
const tsudoiCli = join(repoRoot, "packages", "tsudoi-language-server", "src", "cli.ts");
const peerConfig = join(harnessRoot, "peer", "tsudoi.config.ts");

export const PREPARE_METHOD = "kakehashi/virtualDocument/prepare";
/** The server name the prepare key names. */
export const PEER_NAME = "tsudoi";

export interface DownstreamServer {
  /** The name it is configured under. */
  readonly name: string;
  readonly command: readonly string[];
  /** Injection languages it serves. */
  readonly languages: readonly string[];
  readonly initializationOptions?: unknown;
  /** Methods this server alone answers for its languages (the rest go to the others). */
  readonly only?: readonly string[];
}

export type PeerSetup =
  /** tsudoi with this repository's package. */
  | "tsudoi"
  /** No server is named at the prepare key. */
  | "none"
  /** The prepare key names a server whose command does not exist. */
  | "missing";

export interface SessionOptions {
  readonly kakehashi: string;
  readonly experimental: boolean;
  readonly peer: PeerSetup;
  /**
   * Which aggregation entries the configuration writes:
   * - `explicit` (the default): the prepare key names the peer for each pair,
   *   and the `_` entry keeps it out of every other method;
   * - `default-only`: the `_` entry alone, as a user writes it to keep the
   *   peer out of the other methods, and nothing at the prepare key;
   * - `none`: no aggregation entry at all.
   */
  readonly entries?: "explicit" | "default-only" | "none";
  readonly servers: readonly DownstreamServer[];
  /** Host languages whose injections are prepared and bridged. */
  readonly hosts: readonly string[];
  /** Files written into the workspace before start (go.mod and the like). */
  readonly files?: Readonly<Record<string, string>>;
  /** Where logs are kept after the session; a temporary directory otherwise. */
  readonly artifacts?: string;
  readonly label: string;
}

export interface TeeEntry {
  readonly at: number;
  readonly direction?: "in" | "out";
  readonly message?: RpcMessage;
  readonly exit?: unknown;
}

export interface PeerEntry {
  readonly at: number;
  readonly pid: number;
  readonly event: "start" | "prepare" | "crash";
  readonly mode?: string;
  readonly params?: {
    readonly textDocument: { uri: string; languageId: string; version: number };
    readonly hostTextDocument: { uri: string; languageId: string };
    readonly segments: readonly { type: string; content: string }[];
  };
  readonly result?: unknown;
  readonly error?: string;
}

export interface PeerControl {
  readonly mode?: "package" | "null" | "error" | "insert" | "count" | "crash";
  readonly delayMs?: number;
  readonly onlyWhenContentIncludes?: string;
}

export interface OpenDocument {
  readonly uri: string;
  readonly languageId: string;
  version: number;
  text: string;
}

function readJsonLines<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });
}

const tomlString = (value: string): string => JSON.stringify(value);
const tomlArray = (values: readonly string[]): string => `[${values.map(tomlString).join(", ")}]`;

function tomlValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(", ")}]`;
  if (typeof value === "object" && value !== null) {
    return `{ ${Object.entries(value)
      .map(([key, inner]) => `${tomlString(key)} = ${tomlValue(inner)}`)
      .join(", ")} }`;
  }
  return JSON.stringify(value);
}

/** The capabilities an editor with a full feature set declares. */
const clientCapabilities = {
  general: { positionEncodings: ["utf-16"] },
  workspace: {
    applyEdit: true,
    configuration: true,
    workspaceFolders: true,
    workspaceEdit: { documentChanges: true },
    diagnostics: { refreshSupport: true },
    inlayHint: { refreshSupport: true },
    executeCommand: {},
  },
  window: { workDoneProgress: true, showDocument: { support: true } },
  textDocument: {
    synchronization: { didSave: true },
    publishDiagnostics: { relatedInformation: true, versionSupport: true },
    diagnostic: { relatedDocumentSupport: false },
    hover: { contentFormat: ["markdown", "plaintext"] },
    definition: { linkSupport: false },
    references: {},
    documentHighlight: {},
    documentSymbol: { hierarchicalDocumentSymbolSupport: true },
    signatureHelp: {
      signatureInformation: {
        documentationFormat: ["markdown", "plaintext"],
        parameterInformation: { labelOffsetSupport: true },
        activeParameterSupport: true,
      },
    },
    completion: {
      completionItem: {
        snippetSupport: true,
        documentationFormat: ["markdown", "plaintext"],
        insertReplaceSupport: true,
        insertTextModeSupport: { valueSet: [1, 2] },
        resolveSupport: { properties: ["documentation", "detail", "additionalTextEdits"] },
        labelDetailsSupport: true,
      },
      insertTextMode: 2,
      completionList: { itemDefaults: ["editRange", "insertTextFormat", "insertTextMode", "data"] },
    },
    formatting: {},
    rangeFormatting: {},
    rename: { prepareSupport: true },
    codeAction: {
      codeActionLiteralSupport: {
        codeActionKind: {
          valueSet: [
            "",
            "quickfix",
            "refactor",
            "source",
            "source.organizeImports",
            "source.fixAll",
          ],
        },
      },
      resolveSupport: { properties: ["edit"] },
      dataSupport: true,
      isPreferredSupport: true,
    },
    inlayHint: { resolveSupport: { properties: ["textEdits", "tooltip"] } },
    semanticTokens: {
      requests: { full: true },
      tokenTypes: [],
      tokenModifiers: [],
      formats: ["relative"],
    },
    foldingRange: {},
  },
};

export class Session {
  readonly root: string;
  readonly logs: string;
  readonly client: LspClient;
  readonly options: SessionOptions;
  readonly #teeLog: string;
  readonly #peerLog: string;
  readonly #controlPath: string;
  readonly #keepLogs: boolean;
  /** kakehashi's own log (stderr), at debug level. */
  readonly stderrLog: string;
  readonly documents = new Map<string, OpenDocument>();
  initializeResult: { capabilities?: Record<string, unknown> } = {};
  /** `workspace/applyEdit` requests the server sent. */
  readonly appliedEdits: unknown[] = [];

  private constructor(options: SessionOptions) {
    this.options = options;
    // The real path: a server that resolves symlinks (clangd, where the
    // temporary directory is one) would otherwise answer with other URIs.
    this.root = mkdtempSync(join(realpathSync(tmpdir()), "kakehashi-prepare-"));
    // A marker so every downstream server is rooted at the workspace.
    mkdirSync(join(this.root, ".git"));
    for (const [name, text] of Object.entries(options.files ?? {})) {
      mkdirSync(dirname(join(this.root, name)), { recursive: true });
      writeFileSync(join(this.root, name), text);
    }
    this.#keepLogs = options.artifacts !== undefined;
    this.logs = options.artifacts ?? mkdtempSync(join(tmpdir(), "kakehashi-prepare-logs-"));
    mkdirSync(this.logs, { recursive: true });
    const stem = options.label.replace(/[^A-Za-z0-9._-]+/g, "_");
    this.#teeLog = join(this.logs, `${stem}.downstream.jsonl`);
    this.#peerLog = join(this.logs, `${stem}.peer.jsonl`);
    this.#controlPath = join(this.logs, `${stem}.control.json`);
    const stderrLog = join(this.logs, `${stem}.kakehashi.stderr.log`);
    this.stderrLog = stderrLog;
    for (const stale of [this.#teeLog, this.#peerLog, this.#controlPath, stderrLog]) {
      rmSync(stale, { force: true });
    }
    const configPath = join(this.root, "kakehashi.toml");
    writeFileSync(configPath, this.#config());
    writeFileSync(join(this.logs, `${stem}.kakehashi.toml`), this.#config());
    this.client = new LspClient([options.kakehashi, "--config-file", configPath], {
      cwd: this.root,
      env: {
        KAKEHASHI_EXPERIMENTAL: options.experimental ? "true" : undefined,
        PREPARE_PEER_LOG: this.#peerLog,
        PREPARE_PEER_CONTROL: this.#controlPath,
        RUST_LOG: process.env.RUST_LOG ?? "kakehashi=debug",
      },
      stderrLog,
    });
    this.client.onRequest("workspace/configuration", (params) =>
      ((params as { items?: unknown[] } | null)?.items ?? []).map(() => null),
    );
    this.client.onRequest("workspace/applyEdit", (params) => {
      this.appliedEdits.push(params);
      return { applied: true };
    });
  }

  #config(): string {
    const { servers, hosts, peer } = this.options;
    const entries = this.options.entries ?? "explicit";
    const lines = ["autoInstall = false", ""];
    const languages = [...new Set(servers.flatMap((server) => server.languages))];
    for (const host of hosts) {
      for (const language of languages) {
        const serving = servers.filter((server) => server.languages.includes(language));
        const general = serving.filter((server) => server.only === undefined);
        const key = `languages.${host}.bridge.${language}.aggregation`;
        // Named at the key itself, for each pair: no inheritance default decides it.
        if (entries === "none") continue;
        if (peer !== "none" && entries === "explicit") {
          lines.push(
            `[${key}.${tomlString(PREPARE_METHOD)}]`,
            `priorities = ${tomlArray([PEER_NAME])}`,
            "",
          );
        }
        // The peer is bridged for every language; this keeps it out of their methods.
        lines.push(
          `[${key}._]`,
          `priorities = ${tomlArray(general.map((server) => server.name))}`,
          "",
        );
        for (const server of serving) {
          for (const method of server.only ?? []) {
            lines.push(
              `[${key}.${tomlString(method)}]`,
              `priorities = ${tomlArray([server.name])}`,
              "",
            );
          }
        }
      }
      // Regions no scenario looks at: prose inlines in Markdown, comments in Nix.
      for (const noise of ["markdown_inline", "comment", "regex"]) {
        lines.push(`[languages.${host}.bridge.${noise}]`, "enabled = false", "");
      }
    }
    if (peer === "tsudoi") {
      lines.push(
        `[languageServers.${PEER_NAME}]`,
        `cmd = ${tomlArray([process.execPath, tsudoiCli, "--config", peerConfig])}`,
        'languages = ["*"]',
        "",
      );
    } else if (peer === "missing") {
      lines.push(
        `[languageServers.${PEER_NAME}]`,
        `cmd = ${tomlArray([join(this.root, "no-such-prepare-peer")])}`,
        'languages = ["*"]',
        "",
      );
    }
    for (const server of servers) {
      lines.push(
        `[languageServers.${server.name}]`,
        `cmd = ${tomlArray([process.execPath, tee, this.#teeLog, ...server.command])}`,
        `languages = ${tomlArray(server.languages)}`,
      );
      if (server.initializationOptions !== undefined) {
        lines.push(`initializationOptions = ${tomlValue(server.initializationOptions)}`);
      }
      lines.push("");
    }
    return `${lines.join("\n")}\n`;
  }

  static async start(options: SessionOptions): Promise<Session> {
    const session = new Session(options);
    const rootUri = pathToFileURL(session.root).href;
    session.initializeResult = await session.client.request(
      "initialize",
      {
        processId: process.pid,
        clientInfo: { name: "kakehashi-prepare-verification" },
        rootUri,
        workspaceFolders: [{ uri: rootUri, name: "workspace" }],
        capabilities: clientCapabilities,
      },
      60_000,
    );
    session.client.notify("initialized", {});
    return session;
  }

  uri(name: string): string {
    return pathToFileURL(join(this.root, name)).href;
  }

  open(name: string, languageId: string, text: string): OpenDocument {
    const document: OpenDocument = { uri: this.uri(name), languageId, version: 1, text };
    this.documents.set(document.uri, document);
    this.client.notify("textDocument/didOpen", {
      textDocument: { uri: document.uri, languageId, version: 1, text },
    });
    return document;
  }

  /** Replaces the whole text, as one full-document change. */
  change(document: OpenDocument, text: string): void {
    document.version += 1;
    document.text = text;
    this.client.notify("textDocument/didChange", {
      textDocument: { uri: document.uri, version: document.version },
      contentChanges: [{ text }],
    });
  }

  /** Sends one incremental change; `document.text` must already be the result. */
  changeRange(
    document: OpenDocument,
    range: { start: { line: number; character: number }; end: { line: number; character: number } },
    newText: string,
    resultingText: string,
  ): void {
    document.version += 1;
    document.text = resultingText;
    this.client.notify("textDocument/didChange", {
      textDocument: { uri: document.uri, version: document.version },
      contentChanges: [{ range, text: newText }],
    });
  }

  closeDocument(document: OpenDocument): void {
    this.documents.delete(document.uri);
    this.client.notify("textDocument/didClose", { textDocument: { uri: document.uri } });
  }

  setPeerControl(control: PeerControl): void {
    writeFileSync(this.#controlPath, JSON.stringify(control));
  }

  /** Everything the downstream servers were sent and answered, in order. */
  downstream(): TeeEntry[] {
    return readJsonLines<TeeEntry>(this.#teeLog);
  }

  peerLog(): PeerEntry[] {
    return readJsonLines<PeerEntry>(this.#peerLog);
  }

  prepareRequests(): PeerEntry[] {
    return this.peerLog().filter((entry) => entry.event === "prepare" || entry.event === "crash");
  }

  /**
   * The texts downstream servers hold for virtual documents of `languageId`,
   * newest last: every `didOpen` and full `didChange` they were sent.
   */
  downstreamTexts(languageId?: string): { at: number; uri: string; text: string; kind: string }[] {
    const languages = new Map<string, string>();
    const texts: { at: number; uri: string; text: string; kind: string }[] = [];
    for (const entry of this.downstream()) {
      const message = entry.message;
      if (entry.direction !== "in" || message?.method === undefined) continue;
      const params = message.params as {
        textDocument?: { uri?: string; languageId?: string; text?: string };
        contentChanges?: { text?: string; range?: unknown }[];
      } | null;
      const uri = params?.textDocument?.uri;
      if (uri === undefined) continue;
      if (message.method === "textDocument/didOpen") {
        languages.set(uri, params?.textDocument?.languageId ?? "");
        texts.push({ at: entry.at, uri, text: params?.textDocument?.text ?? "", kind: "didOpen" });
      } else if (message.method === "textDocument/didChange") {
        for (const change of params?.contentChanges ?? []) {
          if (change.range === undefined && change.text !== undefined) {
            texts.push({ at: entry.at, uri, text: change.text, kind: "didChange" });
          }
        }
      } else if (message.method === "textDocument/didClose") {
        texts.push({ at: entry.at, uri, text: "", kind: "didClose" });
      }
    }
    return languageId === undefined
      ? texts
      : texts.filter((text) => languages.get(text.uri) === languageId);
  }

  /** The last text each open virtual document of `languageId` was sent. */
  heldTexts(languageId: string): string[] {
    const held = new Map<string, string>();
    for (const text of this.downstreamTexts(languageId)) {
      if (text.kind === "didClose") held.delete(text.uri);
      else held.set(text.uri, text.text);
    }
    return [...held.values()];
  }

  notificationsFor(method: string, uri: string): Received[] {
    return this.client.notifications.filter(
      (notification) =>
        notification.method === method &&
        (notification.params as { uri?: string } | null)?.uri === uri,
    );
  }

  async close(): Promise<void> {
    await this.client.close();
    // Downstream servers are the server's children; give them a moment to go.
    await sleep(200);
    rmSync(this.root, { recursive: true, force: true });
    if (!this.#keepLogs) rmSync(this.logs, { recursive: true, force: true });
  }
}
