import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// Setting exitCode rather than calling process.exit lets the stderr pipe drain;
// process.exit can truncate it. Nothing holds the event loop open yet.
function fail(message: string): void {
  process.stderr.write(`tsudoi: ${message}\n`);
  process.exitCode = 1;
}

const args = process.argv.slice(2);
const flagIndex = args.indexOf("--config");
const configPath = flagIndex === -1 ? undefined : args[flagIndex + 1];

if (configPath === undefined) {
  fail("--config <path> is required");
} else {
  const absolutePath = resolve(process.cwd(), configPath);
  try {
    // pathToFileURL is what makes this resolve identically under bun and deno.
    await import(pathToFileURL(absolutePath).href);
  } catch (cause) {
    fail(`failed to load config ${absolutePath}\n  ${String(cause)}`);
  }
}
