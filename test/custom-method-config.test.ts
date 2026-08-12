import { expect, test } from "bun:test";
import { loadConfig } from "../packages/tsudoi-language-server/src/config.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * THE ARM FOR THE FAILURE THAT LOOKS EXACTLY LIKE SUCCESS, and this file exists
 * for it alone: `loadConfig` MATERIALISES a fresh config object rather than
 * handing the author's back, so a key it reads and does not write into that
 * object is dropped in silence. src/config.ts records the measured shape of it
 * for `methods.initialize` -- a config supplying `5` exited 0 with empty stderr,
 * the handler never run -- and every refusal `customMethod` gains is green under
 * exactly that fault, refusing what it must and carrying nothing.
 *
 * BOTH KEYS IN ONE READING, because the drop is directional: a `customMethod`
 * read written into the wrong object leaves `methods` empty instead, and one
 * assertion cannot tell which way it went.
 */
test("a declared custom method survives config load, and reading it does not drop methods", async () => {
  const config = await loadConfig(["--config", fixture("custom-method-echo.ts")]);

  const entry = config.customMethod?.["textDocument/didFocus"];
  expect(entry?.kind).toBe("request");
  expect(typeof entry?.handler).toBe("function");
  expect(typeof config.methods?.["textDocument/hover"]).toBe("function");
});

/**
 * ABSENCE IS NOT A DEFAULT, AND THE PAIR ABOVE IS WHAT MAKES THIS MORE THAN AN
 * EMPTY READ: a config declaring no custom method carries none, rather than an
 * empty map tsudoi would then iterate.
 */
test("a config declaring no custom method carries none", async () => {
  const config = await loadConfig(["--config", fixture("hover-fixed.ts")]);

  expect(config.customMethod).toBeUndefined();
});
