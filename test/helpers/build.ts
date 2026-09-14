import { fileURLToPath } from "node:url";
import { prepareWorkspace } from "../../scripts/workspaces.ts";

// import.meta.dir is Bun-only; the URL form works under both runtimes.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Build all workspace packages before loading tests: examples and consumers
 * resolve their imports through dist/. The shared builder orders dependencies
 * before their consumers and is also used by the workspace type check.
 *
 * Run bun test from the repository root so Bun loads bunfig.toml. Some tests
 * pack packages again, so they may replace the artifacts built by this preload.
 */
prepareWorkspace(repoRoot);
