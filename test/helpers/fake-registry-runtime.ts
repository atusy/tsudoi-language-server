import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";

const [runtime, ...args] = process.argv.slice(2);
const logPath = process.env.TSUDOI_FAKE_REGISTRY_LOG;
const version = process.env.TSUDOI_FAKE_REGISTRY_VERSION;
if ((runtime !== "bun" && runtime !== "deno") || logPath === undefined || version === undefined) {
  process.stderr.write("invalid fake registry runtime invocation\n");
  process.exit(1);
}
const runtimeName = runtime;
const callsPath = logPath;
const releaseVersion = version;

function record(value: unknown): void {
  appendFileSync(callsPath, `${JSON.stringify(value)}\n`);
}

record({
  runtime: runtimeName,
  args,
  cwd: process.cwd(),
  registry: process.env.NPM_CONFIG_REGISTRY,
  cache: runtimeName === "bun" ? process.env.BUN_INSTALL_CACHE_DIR : process.env.DENO_DIR,
});

function packageName(specifier: string): string {
  const suffix = "@alpha";
  const withoutProtocol = specifier.startsWith("npm:") ? specifier.slice(4) : specifier;
  if (!withoutProtocol.endsWith(suffix)) {
    throw new Error(`not an alpha package specifier: ${specifier}`);
  }
  return withoutProtocol.slice(0, -suffix.length);
}

function serveLsp(): void {
  let buffer = Buffer.alloc(0);
  let expectedDocumentOpened = false;
  process.stdin.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = buffer.subarray(0, headerEnd).toString("ascii");
      const length = /^Content-Length: (\d+)$/im.exec(header)?.[1];
      if (length === undefined) process.exit(2);
      const bodyLength = Number(length);
      const frameEnd = headerEnd + 4 + bodyLength;
      if (buffer.length < frameEnd) return;
      const message = JSON.parse(buffer.subarray(headerEnd + 4, frameEnd).toString("utf8")) as {
        readonly id?: number;
        readonly method?: string;
        readonly params?: unknown;
      };
      buffer = buffer.subarray(frameEnd);
      record({ runtime: runtimeName, lsp: message.method, params: message.params });
      if (message.method === process.env.TSUDOI_FAKE_REGISTRY_HANG_METHOD) continue;
      if (message.method === "exit") process.exit(0);
      if (message.method === "textDocument/didOpen") {
        expectedDocumentOpened =
          JSON.stringify(message.params) ===
          JSON.stringify({
            textDocument: {
              uri: "file:///registry-smoke.txt",
              languageId: "plaintext",
              version: 1,
              text: "registry reg",
            },
          });
      }
      if (message.id === undefined) continue;
      let result: unknown;
      if (message.method === "initialize") {
        result = { serverInfo: { name: "tsudoi" }, capabilities: { completionProvider: {} } };
      } else if (message.method === "textDocument/completion") {
        const expectedCompletion =
          JSON.stringify(message.params) ===
          JSON.stringify({
            textDocument: { uri: "file:///registry-smoke.txt" },
            position: { line: 0, character: 12 },
          });
        result =
          expectedDocumentOpened && expectedCompletion
            ? [{ label: "registry", detail: "around" }]
            : [];
      } else if (message.method === "shutdown") {
        result = null;
      } else {
        process.exit(3);
      }
      const body = JSON.stringify({ jsonrpc: "2.0", id: message.id, result });
      process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    }
  });
}

if (runtimeName === "bun" && args[0] === "add") {
  for (const specifier of args.slice(2)) {
    const name = packageName(specifier);
    const directory = join(process.cwd(), "node_modules", ...name.split("/"));
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "package.json"),
      `${JSON.stringify({ name, version: releaseVersion })}\n`,
    );
  }
} else if (runtimeName === "deno" && args[0] === "add") {
  writeFileSync(join(process.cwd(), "deno.json"), "{}\n");
} else if (runtimeName === "deno" && args[0] === "info") {
  const name = args.at(-1);
  if (name === undefined) process.exit(4);
  process.stdout.write(
    JSON.stringify({
      npmPackages: {
        [`${name}@${releaseVersion}`]: {
          name,
          version: releaseVersion,
          registryUrl: "https://registry.npmjs.org/",
        },
      },
    }),
  );
} else if (runtimeName === "deno" && args[0] === "check") {
  const config = readFileSync(join(process.cwd(), basename(args.at(-1) ?? "")), "utf8");
  record({ runtime: runtimeName, phase: "check", config });
} else if (
  (runtimeName === "bun" && args[0] === "run") ||
  (runtimeName === "deno" && args[0] === "run")
) {
  const config = readFileSync(join(process.cwd(), "tsudoi.config.ts"), "utf8");
  record({ runtime: runtimeName, phase: "run", config });
  serveLsp();
} else {
  process.stderr.write(`unsupported fake ${runtimeName} invocation: ${args.join(" ")}\n`);
  process.exit(7);
}
