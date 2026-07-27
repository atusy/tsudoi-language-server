import { expect, test } from "bun:test";
import { runCli } from "./helpers/spawn.ts";

test("omitting --config exits 1 with a stderr message and no stdout", async () => {
  const result = await runCli([]);

  expect(result.code).toBe(1);
  expect(result.stderr).toContain("--config");
  expect(result.stdout).toBe("");
});
