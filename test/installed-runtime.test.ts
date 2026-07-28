import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import { exampleSources, type InstalledConsumer, installConsumer } from "./helpers/install.ts";
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
 * author's artifact, not a fixture copy of it. BOTH files: the config imports
 * its path-completion module by relative specifier, so a consumer given only
 * the config fails at import.
 */
const exampleConfig = exampleSources();

/** One consumer for every assertion here: packing and installing is the slow part. */
let consumer: InstalledConsumer;

beforeAll(async () => {
  consumer = await installConsumer();
  for (const [path, source] of Object.entries(exampleConfig)) {
    consumer.write(path, source);
  }
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

// PBI-13 criteria 1 AND 2, parameterised rather than written twice: the
// property under test is that ONE artifact and ONE install serve both
// runtimes, and two hand-written tests could drift into two different routes
// without either failing. Nothing in the checkout can stand in for these --
// sprint 9's finding was that everything green in a checkout stayed green
// while the installed route was broken.
for (const [runtime, command] of Object.entries(route)) {
  test(`${runtime} completes the handshake against the installed copy`, async () => {
    const started = await start(command);

    // Falls back to stderr rather than to undefined so a server that never
    // started reports WHY on the assertion line, instead of leaving a reader
    // to rerun it by hand to find out.
    expect(started.result?.serverInfo?.name ?? started.stderr).toBe("tsudoi");
    // Counted, not eyeballed: one stray byte on stdout desyncs a real editor.
    expect(started.unframedStdoutBytes).toBe(0);
  });

  // Non-ASCII over the newly reachable path, permanently. The example answers
  // hover in Japanese, so this also proves the installed server does not merely
  // start: it loads the config author's own file and runs their handler, with
  // multi-byte text surviving the pipe in both directions.
  test(`${runtime} serves the example's Japanese hover from the installed copy`, async () => {
    const session = LspSession.startCommand(command, consumer.dir);
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

  // The FAILURE half of `checkout and installed do not diverge`. A handshake
  // proves the happy path; PBI-1's contract -- exit 1, a tsudoi:-prefixed
  // reason on stderr, zero bytes on stdout -- is what an editor sees when the
  // config author gets it wrong, and until now it was only ever asserted
  // against a checkout. The run command is DERIVED from the stated route so a
  // failure case cannot quietly test a different entry point.
  const runCommandOnly = command.split(" --config ")[0] ?? command;

  test(`${runtime} reports a missing --config from the installed copy`, async () => {
    const result = await runCommand(runCommandOnly, consumer.dir);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("tsudoi: --config <path> is required");
    expect(result.stdout).toBe("");
  });

  // The config author's OWN file failing, imported by the installed CLI. This
  // is the mechanism JSR flagged as an unanalyzable dynamic import: the
  // installed .js reaching out to a .ts the user wrote, outside node_modules
  // where deno will strip types happily.
  test(`${runtime} reports a config with no default export from the installed copy`, async () => {
    consumer.write("broken.config.ts", "export const notDefault = 1;\n");

    const result = await runCommand(runCommandOnly, consumer.dir, [
      "--config",
      "./broken.config.ts",
    ]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("has no default export");
    expect(result.stderr).toContain("broken.config.ts");
    expect(result.stdout).toBe("");
  });
}

/**
 * The exports map's MIDDLE ARM, which nothing else would notice the loss of.
 *
 * `types` is what tsc takes and `default` is the in-repo fallback that keeps a
 * never-built checkout resolving; between them sits `import`, and it is there
 * so that the arm a RUNTIME matches names a file the tarball actually
 * contains. Without it a runtime resolving this subpath is sent to
 * ./src/types.ts, which is deliberately not published -- a package.json
 * pointing at a file it does not ship.
 *
 * The subpath is type-only, so no config author has cause to import it for
 * value. That is exactly why this is asserted rather than left to be noticed.
 */
const importsTheSubpath = 'import "@atusy/tsudoi/types";\n';

test("a runtime import of the types subpath resolves in the installed copy", async () => {
  consumer.write("probe.js", importsTheSubpath);

  for (const runtime of [bunRuntime, denoRuntime]) {
    const result = await runCommand(
      `${runtime.command} ${runtime.runArgs.join(" ")} ./probe.js`,
      consumer.dir,
    );

    expect(`${runtime.name}: ${String(result.code)} ${result.stderr}`).toBe(`${runtime.name}: 0 `);
  }
});

// The pair, perturbing WHAT GETS PACKED rather than the installed directory:
// drop the middle arm and the same import lands on the unpublished source.
test("dropping the import arm sends a runtime at a file the tarball does not ship", async () => {
  const perturbed = await installConsumer({
    editPackage: (packageJson) => {
      packageJson.exports = {
        "./types": { types: "./dist/types.d.ts", default: "./src/types.ts" },
      };
    },
  });
  try {
    perturbed.write("probe.js", importsTheSubpath);

    const result = await runCommand(
      `${denoRuntime.command} ${denoRuntime.runArgs.join(" ")} ./probe.js`,
      perturbed.dir,
    );

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("src/types.ts");
  } finally {
    perturbed.dispose();
  }
});

/**
 * Criterion 3's other half: the packaged CLI is PRODUCED BY THE BUILD, not
 * committed. The hazard a build step introduces is not the step, it is a stale
 * artifact passing while the source has moved.
 *
 * The plan's perturbation was `change a source file, do not rebuild, and this
 * must redden`. It cannot be run: there is no rebuild step to skip. `bun pm
 * pack` runs prepack before it collects files (MEASURED -- so does `npm
 * pack`), dist/ is gitignored and never committed, and installConsumer stages
 * a fresh temp directory per call, so the tarball's dist/ can only ever be
 * this compilation of these sources. A stale build is unrepresentable rather
 * than discouraged, and this test is the observable form of that: a change
 * made to the sources with no build command anywhere reaches the installed
 * consumer's behaviour.
 *
 * The assertion it defends by flipping is `<runtime> completes the handshake
 * against the installed copy`, which asserts the name `tsudoi` that this one
 * changes.
 */
test("a change to src/ reaches the installed copy with no rebuild step", async () => {
  const perturbed = await installConsumer({
    editSource: (srcDir) => {
      const server = join(srcDir, "server.ts");
      const source = readFileSync(server, "utf8");
      const renamed = source.replace(
        'serverInfo: { name: "tsudoi" }',
        'serverInfo: { name: "見" }',
      );
      // A replace that silently matched nothing would leave this test asserting
      // the unperturbed name and passing for the wrong reason.
      expect(renamed).not.toBe(source);
      writeFileSync(server, renamed);
    },
  });
  try {
    for (const [path, source] of Object.entries(exampleConfig)) {
      perturbed.write(path, source);
    }
    const session = LspSession.startCommand(route.deno, perturbed.dir);
    try {
      const result = await session.request<InitializeResult>("initialize", initializeParams);

      expect(result.serverInfo?.name).toBe("見");
    } finally {
      session.dispose();
    }
  } finally {
    perturbed.dispose();
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
