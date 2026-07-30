import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
 * publishing is out of scope. `bun add @atusy/tsudoi` and
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
// without either failing. NOTHING IN THE CHECKOUT CAN STAND IN FOR THESE: a
// checkout is entirely capable of being GREEN throughout while the installed
// route is broken, which is the finding this whole file is built on.
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

  // The installed server does not merely START: it loads the config author's
  // own file, runs their handler, and that handler reaches a THIRD-PARTY
  // PACKAGE the consumer installed separately -- which is the part an install
  // can break without breaking the handshake.
  //
  // Multi-byte text still crosses the pipe here, in the REQUEST direction: the
  // document's uri and its text are Japanese. The response direction is ASCII
  // now that the example answers with an English dictionary, and the byte-count
  // property lives on a fixture that answers Japanese -- see protocol.test.ts.
  test(`${runtime} serves the example's dictionary hover from the installed copy`, async () => {
    const session = LspSession.startCommand(command, consumer.dir);
    try {
      // DECLARED AS AN EDITOR DECLARES IT, because the example answers the
      // format the client named: `initializeParams` names none, which is a
      // client entitled to plaintext, and the markdown read below is what a
      // client that asked for markdown receives.
      await session.request<InitializeResult>("initialize", {
        ...initializeParams,
        capabilities: { textDocument: { hover: { contentFormat: ["markdown"] } } },
      });
      session.notify("textDocument/didOpen", {
        textDocument: {
          uri: "file:///こんにちは.txt",
          languageId: "plaintext",
          version: 1,
          text: "こんにちは dictionary 世界",
        },
      });

      const hover = await session.request<Hover | null>("textDocument/hover", {
        textDocument: { uri: "file:///こんにちは.txt" },
        // Inside `dictionary`, which starts at code unit 6 -- past the
        // Japanese, so the handler's own position math is counting UTF-16
        // units the way LSP does.
        position: { line: 0, character: 8 },
      });

      const contents = hover?.contents as { kind?: string; value?: string } | undefined;
      expect(contents?.kind).toBe("markdown");
      expect(contents?.value).toContain("**dictionary**");
      expect(contents?.value).toContain("*noun*");
      expect(session.unframedStdoutBytes).toBe(0);
    } finally {
      session.dispose();
    }
  });

  // The FAILURE half of `checkout and installed do not diverge`. A handshake
  // proves the happy path; PBI-1's contract -- exit 1, a tsudoi:-prefixed
  // reason on stderr, zero bytes on stdout -- is what an editor sees when the
  // config author gets it wrong, and a checkout can no more stand in for the
  // installed copy here than it can above. The run command is DERIVED from the
  // stated route so a
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
 * THE SUBPATH IS TYPE-ONLY, AND THIS PROBE IS STILL NOT THE ONLY THING THAT
 * NOTICES THE ARM'S LOSS -- measured rather than reasoned, because the obvious
 * argument gets it wrong. MEASURED: dropping `import` from the `./types` arm
 * reddens FIVE tests -- this one, the type-only surface assertion in
 * test/published-artifacts.test.ts, and the deno halves of the installed-example
 * tests. `A type-only consumer never runs` is true of the TYPES and false of
 * the IMPORT STATEMENT that carries them.
 *
 * WHY DENO IS IN THAT LIST AND BUN IS NOT, measured rather than reasoned:
 * examples/diagnostic-trailing-whitespace.ts writes
 * `import { type MethodHandler } from "@atusy/tsudoi/types"`, and bun ELIDES an
 * import whose bindings are all type-only while deno LOADS THE MODULE. So the
 * examples resolve this subpath at run time under one runtime and not the other,
 * from a line that looks type-only in the source.
 *
 * IT STAYS BECAUSE THE THREE FAIL DIFFERENTLY, which is the first-to-fail rule
 * rather than redundancy: this one says THE SUBPATH RESOLVES AT ALL, in the
 * smallest possible consumer and under both runtimes; the surface assertion says
 * the module loaded AND exported nothing; the example tests say a config author's
 * server started. Only this one names the arm.
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
 * PBI-13 criterion 1's NEGATIVE CONTROL, a PERMANENT test rather than a
 * one-time perturbation: shipping .ts sources instead of compiled .js makes the
 * Deno route fail, and it fails by NAME. A tarball whose only entry point is
 * src/cli.ts is exactly what a Deno user cannot run.
 *
 * IT DEFENDS STRICTLY LESS THAN IT LOOKS LIKE IT DOES, said so the two claims
 * are never read as one: it says `deno rejects a .ts entry point under
 * node_modules and bun does not`, NOT `the installed copy runs under deno` --
 * that one is defended by the handshake below and by nothing here.
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
