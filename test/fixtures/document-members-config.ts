import process from "node:process";
// Relative with .ts, and Bun-free: deno executes this file too.
import type { Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * Reports, at process exit, what a CONFIG AUTHOR can COMPUTE from the document
 * tsudoi handed them -- as opposed to what tsudoi stored, which
 * test/fixtures/snapshot-config.ts already reports.
 *
 * The distinction is the whole reason this file exists. `uri`, `languageId`,
 * `version` and `getText()` are readable off any shape at all; `lineCount`,
 * `offsetAt`, `positionAt` and a ranged `getText` are the members that only
 * exist because tsudoi hands out a real document implementation rather than an
 * object literal of its own. A handler doing anything positional needs exactly
 * these, and this file is a handler-shaped consumer of them.
 *
 * THE PROBE CONSTANTS ARE HERE AND THE EXPECTED VALUES ARE IN THE TEST, on
 * purpose: the fixture asks the questions, the test knows the answers from the
 * text it put on the wire. A fixture that also asserted would let one wrong
 * belief satisfy both halves.
 */

/** Read back as a POSITION by the test, which knows where line 2 begins. */
const probeOffset = 12;
/** Read back as an OFFSET by the test, which knows the same thing. */
const probePosition = { line: 2, character: 0 };
/** Two characters inside the middle line, so a ranged read cannot be a whole one. */
const probeRange = { start: { line: 1, character: 0 }, end: { line: 1, character: 2 } };

export default (tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  process.on("exit", () => {
    const [document] = [...tsudoi.documents.values()];
    // `null` rather than an empty object: a store that held nothing must not be
    // reported as a document whose every member came back falsy.
    const report =
      document === undefined
        ? null
        : {
            version: document.version,
            lineCount: document.lineCount,
            offsetAt: document.offsetAt(probePosition),
            positionAt: document.positionAt(probeOffset),
            rangeText: document.getText(probeRange),
            wholeText: document.getText(),
          };
    process.stderr.write(`TSUDOI_MEMBERS ${JSON.stringify(report)}\n`);
  });

  return Promise.resolve({});
};
