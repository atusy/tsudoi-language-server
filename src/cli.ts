import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { createTsudoi } from "./tsudoi.ts";

try {
  await loadConfig(process.argv.slice(2), createTsudoi());
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  // Setting exitCode rather than calling process.exit lets the stderr pipe
  // drain; process.exit can truncate it. No LSP traffic has started yet.
  process.stderr.write(`tsudoi: ${error.message}\n`);
  process.exitCode = 1;
}
