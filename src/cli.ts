import process from "node:process";
import { ConfigError, loadConfig } from "./config.ts";
import { startServer } from "./server.ts";
import { createTsudoi } from "./tsudoi.ts";

const { tsudoi, documents } = createTsudoi();

try {
  // startServer runs only on success; that ordering is what keeps stdout clean
  // for every config failure.
  //
  // THE SAME ORDERING CONSTRAINS WHAT A CONFIG CAN EVER READ AT LOAD, and it is
  // an ORDERING fact rather than a surface one, which is why it lives here. The
  // config factory is invoked by loadConfig -- so it runs BEFORE the connection
  // exists, therefore strictly before `initialize`. Anything the client sends at
  // initialize is invisible at that moment NO MATTER WHAT the factory is handed:
  // a factory-time read would capture the pre-initialize value forever,
  // silently, which is presence wearing absence's clothes.
  //
  // THE FACTORY IS NOW HANDED NOTHING AT ALL, which strengthens this rather than
  // retiring it: since PBI-44 `TsudoiConfigFactory` takes no parameter, so the
  // stale capture has no channel to arrive through and the failure is
  // FORECLOSED rather than deferred -- this file's own long-stated preference,
  // arriving. workspaceFolders is carried on `RequestContext` for the same
  // reason and by the same argument.
  //
  // WHAT WOULD UN-FORECLOSE IT is now a TYPE edit rather than a field addition:
  // giving that factory type a parameter again. Additive and therefore
  // non-breaking, so the door is deferred rather than welded -- and the guard is
  // a comment AT THAT TYPE, where the edit would be made, rather than here.
  startServer(await loadConfig(process.argv.slice(2)), documents, tsudoi);
} catch (error) {
  if (!(error instanceof ConfigError)) {
    throw error;
  }
  // Setting exitCode rather than calling process.exit lets the stderr pipe
  // drain; process.exit can truncate it. No LSP traffic has started yet.
  process.stderr.write(`tsudoi: ${error.message}\n`);
  process.exitCode = 1;
}
