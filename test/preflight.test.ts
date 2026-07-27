import { expect, test } from "bun:test";
import { bunRuntime, type Runtime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

const absentRuntime: Runtime = {
  name: "tsudoi-absent-runtime",
  command: "tsudoi-absent-runtime",
  runArgs: [],
  installUrl: "https://example.invalid/install-tsudoi-absent-runtime",
};

test("the preflight fails, rather than skipping, when a required runtime is absent", async () => {
  const error = await requireRuntime(absentRuntime).then(
    () => null,
    (cause: unknown) => cause,
  );

  expect(error).toBeInstanceOf(Error);
  const message = (error as Error).message;
  // Names the criterion it is protecting, and where to get the runtime.
  expect(message).toContain("The CLI starts under both bun and deno");
  expect(message).toContain(absentRuntime.installUrl);
  // Not a raw spawn failure leaking through.
  expect(message).not.toContain("ENOENT");
});

test("the preflight resolves for a runtime that is installed", async () => {
  await requireRuntime(bunRuntime);
});
