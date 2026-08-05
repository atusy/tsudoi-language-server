import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { startServer } from "./server.ts";
import { createTsudoi } from "./tsudoi.ts";

const runtime = createTsudoi();

try {
  startServer(await loadConfig(process.argv.slice(2)), runtime);
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  process.stderr.write(`tsudoi: ${error.message}\n`);
  process.exitCode = 1;
}
