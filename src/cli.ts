import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { startServer } from "./server.ts";
import { createTsudoi } from "./tsudoi.ts";

const { tsudoi, documents } = createTsudoi();

try {
  // startServer runs only on success; that ordering is what keeps stdout clean
  // for every config failure.
  //
  // THE SAME ORDERING CONSTRAINS WHAT `Tsudoi` CAN EVER CARRY, and it is an
  // ORDERING fact rather than a surface one, which is why it lives here. The
  // config factory is invoked by loadConfig -- so it runs BEFORE the connection
  // exists, therefore strictly before `initialize`. Anything the client sends at
  // initialize is invisible to the factory NO MATTER HOW COMPLETE `Tsudoi`
  // becomes: a factory-time read would capture the pre-initialize value forever,
  // silently, which is presence wearing absence's clothes.
  //
  // Hence workspaceFolders is carried on `RequestContext`, where the stale
  // capture is unrepresentable rather than merely documented. FORECLOSED, and
  // what would UN-foreclose it: adding workspaceFolders to `Tsudoi`. Additive,
  // so the door is deferred rather than welded -- but a comment would be the
  // only guard, and this project prefers foreclosing a failure to detecting it.
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
