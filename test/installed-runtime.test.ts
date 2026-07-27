import { expect, test } from "bun:test";
import { installConsumer } from "./helpers/install.ts";
import { bunRuntime, denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { runCommand } from "./helpers/spawn.ts";

await requireRuntime(denoRuntime);

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
