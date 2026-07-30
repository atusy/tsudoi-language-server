import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { startServer } from "./server.ts";
import { createTsudoi } from "./tsudoi.ts";

const runtime = createTsudoi();

try {
  // startServer runs only on success; that ordering is what keeps stdout clean
  // for every config failure.
  //
  // The same ordering is why the factory is handed nothing: loadConfig invokes it
  // BEFORE the connection exists, therefore strictly before `initialize`, so
  // anything read there would capture the pre-initialize value forever. With no
  // parameter that is unrepresentable; the guard against giving it one back is at
  // `TsudoiConfigFactory`, where the edit would be made.
  startServer(await loadConfig(process.argv.slice(2)), runtime);
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  // Setting exitCode rather than calling process.exit lets the stderr pipe
  // drain; process.exit can truncate it. No LSP traffic has started yet.
  process.stderr.write(`tsudoi: ${error.message}\n`);
  process.exitCode = 1;
}
