import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { startServer } from "./server.ts";
import { createTsudoi } from "./tsudoi.ts";

const { tsudoi, documents } = createTsudoi();

try {
  // startServer runs only on success; that ordering is what keeps stdout clean
  // for every config failure.
  startServer(await loadConfig(process.argv.slice(2), tsudoi), documents, tsudoi);
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  // Setting exitCode rather than calling process.exit lets the stderr pipe
  // drain; process.exit can truncate it. No LSP traffic has started yet.
  process.stderr.write(`tsudoi: ${error.message}\n`);
  process.exitCode = 1;
}
