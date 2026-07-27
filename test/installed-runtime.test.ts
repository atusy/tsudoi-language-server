import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import { type InstalledConsumer, installConsumer } from "./helpers/install.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { runCommand } from "./helpers/spawn.ts";

await requireRuntime(denoRuntime);

/**
 * THE ROUTE, as the exact commands a config author runs. Nothing below
 * assembles spawn arguments of its own: these strings ARE the argv, split on
 * spaces by LspSession.startCommand, so the route a reader is told to follow
 * cannot drift from the route the suite proves.
 *
 * In a project that is not this repo, with a tsudoi.config.ts in it:
 *
 *   bun install ./atusy-tsudoi-0.0.0.tgz
 *   bun run node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts
 *   deno run -A node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts
 *
 * The install line is what these tests do -- from a tarball, because
 * publishing is out of scope for sprint 10. `bun add @atusy/tsudoi` and
 * `deno add npm:@atusy/tsudoi` are the same route once this is published, and
 * they are NOT VERIFIED HERE; nothing in this repo may claim they are until
 * something runs them.
 *
 * One artifact, one install, one file path, two runtimes: the only difference
 * between the last two lines is the runtime's own name and its permission
 * flag. That is what criterion 2 asks for, and a route that needed a
 * runtime-specific install or a runtime-specific entry point would fail it.
 */
const route = {
  bun: "bun run node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts",
  deno: "deno run -A node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts",
} as const;

/**
 * The stakeholder-facing example's own bytes, read at test time -- the config
 * author's artifact, not a fixture copy of it.
 */
const exampleConfig = readFileSync(
  fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url)),
  "utf8",
);

/** One consumer for every assertion here: packing and installing is the slow part. */
let consumer: InstalledConsumer;

beforeAll(async () => {
  consumer = await installConsumer();
  consumer.write("tsudoi.config.ts", exampleConfig);
});

afterAll(() => {
  consumer.dispose();
});

interface Started {
  readonly result: InitializeResult | undefined;
  readonly unframedStdoutBytes: number;
  readonly stderr: string;
}

/** Runs one stated command and completes the handshake against it. */
async function start(command: string): Promise<Started> {
  const session = LspSession.startCommand(command, consumer.dir);
  try {
    const result = await session.request<InitializeResult>("initialize", initializeParams).then(
      (value) => value,
      () => undefined,
    );
    return {
      result,
      unframedStdoutBytes: session.unframedStdoutBytes,
      stderr: session.stderr,
    };
  } finally {
    session.dispose();
  }
}

// PBI-13 criterion 1, and the sprint's headline: a deno user who obtained
// tsudoi the stated way gets a server that starts. Nothing in the checkout can
// stand in for this -- sprint 9's finding was that everything green in a
// checkout stayed green when the installed route was broken.
test("deno completes the handshake against the installed copy", async () => {
  const started = await start(route.deno);

  expect(started.result?.serverInfo?.name).toBe("tsudoi");
  // Counted, not eyeballed: one stray byte on stdout desyncs a real editor.
  expect(started.unframedStdoutBytes).toBe(0);
});

// Non-ASCII over the newly reachable path, permanently. The example answers
// hover in Japanese, so this also proves the installed server does not merely
// start: it loads the user's config and runs their handler, with multi-byte
// text surviving the pipe in both directions.
test("deno serves the example's Japanese hover from the installed copy", async () => {
  const session = LspSession.startCommand(route.deno, consumer.dir);
  try {
    await session.request<InitializeResult>("initialize", initializeParams);
    session.notify("textDocument/didOpen", {
      textDocument: {
        uri: "file:///こんにちは.txt",
        languageId: "plaintext",
        version: 1,
        text: "こんにちは 世界",
      },
    });

    const hover = await session.request<Hover | null>("textDocument/hover", {
      textDocument: { uri: "file:///こんにちは.txt" },
      position: { line: 0, character: 1 },
    });

    expect(hover?.contents).toEqual({
      kind: "markdown",
      value: "**こんにちは** はカーソル位置の語です。",
    });
    expect(session.unframedStdoutBytes).toBe(0);
  } finally {
    session.dispose();
  }
});

/**
 * PBI-13 criterion 1's NEGATIVE CONTROL, kept as a permanent test rather than
 * run once at Review: shipping .ts sources instead of compiled .js makes the
 * Deno route fail, and it fails by NAME.
 *
 * It is also the RED this sprint started from. Before the build landed, the
 * tarball's only entry point WAS src/cli.ts, so this is exactly what a Deno
 * user obtained. It lands earlier than the sprint's headline and defends
 * strictly less: it says `deno rejects a .ts entry point under node_modules
 * and bun does not`, NOT `the installed copy runs under deno` -- that one is
 * defended by the handshake below and by nothing here.
 *
 * COUPLED, deliberately, to deno 2.9.2's restriction. If a later deno strips
 * types under node_modules the first assertion will fail; the answer then is
 * to delete this test and keep the handshake, not to loosen it -- an
 * unnamed `it failed somehow` would pass for a broken helper too.
 */
test("deno refuses a .ts entry point under node_modules, and bun runs it fine", async () => {
  const consumer = await installConsumer({
    editPackage: (packageJson) => {
      const files = (packageJson.files as string[] | undefined) ?? [];
      packageJson.files = [...new Set([...files, "src"])];
    },
  });
  try {
    const tsEntry = "node_modules/@atusy/tsudoi/src/cli.ts";
    // A --config that does not exist, on purpose: reaching the CLI's own
    // `tsudoi:` message is what proves the module was loaded at all, and it
    // needs no config file to prove it.
    const args = ["--config", "./absent.config.ts"];

    const deno = await runCommand(
      `${denoRuntime.command} ${denoRuntime.runArgs.join(" ")} ${tsEntry}`,
      consumer.dir,
      args,
    );
    const bun = await runCommand(
      `${bunRuntime.command} ${bunRuntime.runArgs.join(" ")} ${tsEntry}`,
      consumer.dir,
      args,
    );

    expect(deno.stderr).toContain("ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING");
    expect(deno.code).toBe(1);
    expect(deno.stdout).toBe("");

    // The other half of the asymmetry, and the reason criterion 2 exists: a
    // route only bun can take would look perfectly healthy from bun.
    expect(bun.stderr).not.toContain("ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING");
    expect(bun.stderr).toContain("tsudoi: failed to load config");
    expect(bun.code).toBe(1);
    expect(bun.stdout).toBe("");
  } finally {
    consumer.dispose();
  }
});
