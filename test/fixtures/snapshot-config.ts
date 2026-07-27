import process from "node:process";
// Relative with .ts, and Bun-free: deno executes this file too.
import type { Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * Reports, at process exit, what the CONFIG AUTHOR's `tsudoi.documents` holds.
 *
 * The factory captures `tsudoi` exactly as a real config would, then prints the
 * store from an exit handler -- the only moment a test outside the process can
 * observe a store that has no wire representation of its own. Reading it here,
 * rather than from a server-side hook, is what makes the assertion about the
 * store the config sees rather than one the server happens to keep.
 */
export default (tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  process.on("exit", () => {
    const documents = [...tsudoi.documents.values()].map((document) => ({
      uri: document.uri,
      languageId: document.languageId,
      version: document.version,
      text: document.getText(),
    }));
    process.stderr.write(`TSUDOI_SNAPSHOT ${JSON.stringify(documents)}\n`);
  });

  return Promise.resolve({});
};
