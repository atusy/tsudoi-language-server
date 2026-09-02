import process from "node:process";
import { writeFileSync } from "node:fs";
// Relative with .ts, and Bun-free: deno executes this file too.
import type { Tsudoi, TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * Reports, at process exit, what the CONFIG AUTHOR's `tsudoi.documents` holds.
 *
 * The store is reached through `RequestContext.tsudoi`, captured by a handler
 * and read from an exit handler -- the only moment a test outside the process
 * can observe a store that has no wire representation of its own. Reading it
 * here, rather than from a server-side hook, is what makes the assertion about
 * the store the config sees rather than one the server happens to keep.
 *
 * CAPTURE AND READ ARE DIFFERENT MOMENTS, and that is what lets this fixture
 * still report for the two sessions no request can reach: the capture happens
 * during a PRE-shutdown request, while the read happens at exit. A
 * post-shutdown or pre-initialize notification is refused long after the
 * handle was taken, so lifecycle refusal never enters the observation.
 */
let captured: Tsudoi | undefined;

/**
 * WHAT THIS FIXTURE SAYS WHEN IT WAS NEVER HANDED A CONTEXT AT ALL.
 *
 * A PRECONDITION THAT IS REAL RATHER THAN THEORETICAL: the factory is NOT
 * handed the store unconditionally, so it can fail to be primed, and an
 * unprimed session left to print `[]` would be INDISTINGUISHABLE from a
 * session that was primed and found the store empty -- which is most of the
 * assertions this fixture serves. Two outcomes producing one observation
 * record nothing, so the unprimed state is named instead.
 *
 * DELIBERATELY NOT PREFIX-COMPATIBLE with the snapshot line: the marker the
 * tests read ends in a SPACE, so no reader mistakes this for a store that was
 * read, and `readMarkedLine` throws quoting the whole of stderr -- which puts
 * this word in the failure message.
 */
const unprimedMarker = "TSUDOI_SNAPSHOT_UNPRIMED";

export default (): Promise<TsudoiConfig> => {
  process.on("exit", () => {
    if (captured === undefined) {
      writeFileSync(2, `${unprimedMarker}\n`);
      return;
    }
    const documents = [...captured.documents.values()].map((document) => ({
      uri: document.uri,
      languageId: document.languageId,
      version: document.version,
      text: document.getText(),
    }));
    // An exit handler gets no later event-loop turn in which an asynchronous
    // pipe write can finish. The large-document arm crosses the pipe capacity,
    // so write the complete observation synchronously before the process ends.
    writeFileSync(2, `TSUDOI_SNAPSHOT ${JSON.stringify(documents)}\n`);
  });

  return Promise.resolve({
    // THE PRIMING ROUTE, and hover rather than `completionItem/resolve`
    // because a config supplying resolve without completion is refused at
    // load. It answers null and writes nothing: every session using this
    // fixture asserts on stderr, and protocol.test.ts asserts that tsudoi
    // itself said nothing there.
    methods: {
      "textDocument/hover": (context) => {
        captured = context.tsudoi;
        return Promise.resolve(null);
      },
    },
  });
};
