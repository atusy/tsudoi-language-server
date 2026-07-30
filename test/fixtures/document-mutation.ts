// Relative with .ts, and Bun-free: deno executes this file too.
import type { MethodHandler, TsudoiConfig } from "../../src/types.ts";

/** The document the session opens, and what it edits the buffer to afterwards. */
export const documentUri = "file:///workspace/a.txt";
export const openedText = "genuine text";
export const changedText = "edited text";

/** What a handler reports of its own attempt, and of what it can still read. */
export interface DocumentMutationReport {
  /** Whether THIS request is the one that tried the writes. */
  readonly attempted: boolean;
  readonly getTextRefused: boolean;
  readonly addMemberRefused: boolean;
  /** What the published surface answers AFTER whatever happened above. */
  readonly text: string | undefined;
  readonly version: number | undefined;
}

/**
 * A HANDLER THAT TRIES TO FORGE THE BUFFER EVERY LATER HANDLER READS, through a
 * cast -- which is what the JavaScript a config author ships does by default,
 * and which upstream's own type permits even in checked code, since its members
 * are METHOD declarations and a method is a writable property.
 *
 * SHADOWING `getText` IS THE SHARP CASE and it is why this is worth a session:
 * the document lives in the store for as long as the uri is open, so a handler
 * that lands this leaves every following request answering from a string of its
 * own -- and synchronisation says nothing, since a later edit advances the
 * version while the shadow stays.
 *
 * ONLY THE FIRST REQUEST ATTEMPTS IT, so the second is a measurement rather than
 * a repeat, and an EDIT ARRIVES BETWEEN THEM: what the second request reads has
 * to be the text the client last sent, which no snapshot and no forgery answers.
 */
export default (): Promise<TsudoiConfig> => {
  let attempted = false;
  const hover: MethodHandler<"textDocument/hover"> = (context) => {
    const document = context.tsudoi.documents.get(documentUri) as unknown as
      | { getText: () => string; forged?: unknown }
      | undefined;
    let getTextRefused = false;
    let addMemberRefused = false;
    const attemptingNow = !attempted;
    if (attemptingNow && document !== undefined) {
      attempted = true;
      try {
        document.getText = () => "forged";
      } catch {
        getTextRefused = true;
      }
      try {
        document.forged = 1;
      } catch {
        addMemberRefused = true;
      }
    }
    // READ BACK THROUGH THE PUBLISHED SURFACE, not through the cast above: what
    // the NEXT handler would see is the claim, and it reaches the buffer the
    // documented way.
    const current = context.tsudoi.documents.get(documentUri);
    const report: DocumentMutationReport = {
      attempted: attemptingNow,
      getTextRefused,
      addMemberRefused,
      text: current?.getText(),
      version: current?.version,
    };
    // A MarkupContent rather than a bare string, which is what the neighbouring
    // reporting fixtures send: the test reads `contents.value`, and a plain
    // string would arrive as a shape it parses to nothing -- a red that looks
    // like the claim failing and is not.
    return Promise.resolve({ contents: { kind: "plaintext", value: JSON.stringify(report) } });
  };
  return Promise.resolve({ methods: { "textDocument/hover": hover } });
};
