// Relative with .ts, and Bun-free: deno executes this file too.
import type { MethodHandler, TsudoiConfig } from "../../src/types.ts";

/** The document the session opens, and the folder the client names over it. */
export const documentUri = "file:///workspace/a.txt";
export const documentText = "genuine text";
export const folderUri = "file:///workspace";

/** What a handler reports of its own attempt, and of what it can still read. */
export interface StoreMutationReport {
  /** Whether THIS request is the one that tried the writes. */
  readonly attempted: boolean;
  readonly documentsGetRefused: boolean;
  readonly foldersGetRefused: boolean;
  readonly replaceStoreRefused: boolean;
  readonly addMemberRefused: boolean;
  /** What the published surface answers AFTER whatever happened above. */
  readonly text: string | undefined;
  readonly folders: number;
  readonly covering: number;
  readonly rootUri: string | null;
}

/**
 * A HANDLER THAT TRIES TO REPLACE THE STORES IT WAS HANDED, through a cast --
 * which is not a contrivance but the only thing a compile-time `readonly` leaves
 * open, and exactly what the JavaScript a config author ships does by default.
 *
 * FOUR WRITES, BECAUSE FOUR THINGS ARE PUBLISHED AND EACH FAILS DIFFERENTLY: an
 * OPERATION on a store, the same on the other store, the MEMBER of `Tsudoi`
 * holding a store, and a member `Tsudoi` does not have at all. A defence that
 * sealed the stores and left the object extensible would refuse the first three
 * and let the fourth through, and a `Tsudoi` gaining members no type declares is
 * a surface no config can be checked against.
 *
 * ONLY THE FIRST REQUEST ATTEMPTS THEM, which is what makes the second one a
 * measurement rather than a repeat: what a handler does to its own view is
 * nobody's business, and the finding is that the NEXT handler -- and every
 * handler for the life of the session -- reads the wreckage.
 */
export default (): Promise<TsudoiConfig> => {
  let attempted = false;
  const hover: MethodHandler<"textDocument/hover"> = (context) => {
    const tsudoi = context.tsudoi as unknown as {
      documents: { get?: unknown };
      workspaceFolders: { get?: unknown; values?: unknown };
      forged?: unknown;
    };
    let documentsGetRefused = false;
    let foldersGetRefused = false;
    let replaceStoreRefused = false;
    let addMemberRefused = false;
    const attemptingNow = !attempted;
    if (attemptingNow) {
      attempted = true;
      try {
        tsudoi.documents.get = () => undefined;
      } catch {
        documentsGetRefused = true;
      }
      try {
        tsudoi.workspaceFolders.get = () => [];
      } catch {
        foldersGetRefused = true;
      }
      // AFTER the two above: a successful replacement puts a fresh store where
      // the operation writes would have landed, so the other order cannot tell
      // whether those were ever possible. A WHOLE store and not a half one --
      // an object missing `values` would have the read below throw, and a
      // handler that died is not a handler that was refused.
      try {
        tsudoi.workspaceFolders = { get: () => [], values: () => [] };
      } catch {
        replaceStoreRefused = true;
      }
      try {
        tsudoi.forged = 1;
      } catch {
        addMemberRefused = true;
      }
    }
    // READ BACK THROUGH THE PUBLISHED SURFACE, not through the cast above: what
    // the NEXT handler would see is the claim, and it reaches these fields the
    // documented way. `rootUri` is a GETTER over state the handshake writes, so
    // reading it here is also what says the seal left the getters working.
    const report: StoreMutationReport = {
      attempted: attemptingNow,
      documentsGetRefused,
      foldersGetRefused,
      replaceStoreRefused,
      addMemberRefused,
      text: context.tsudoi.documents.get(documentUri)?.getText(),
      folders: [...context.tsudoi.workspaceFolders.values()].length,
      covering: context.tsudoi.workspaceFolders.get(documentUri).length,
      rootUri: context.tsudoi.rootUri,
    };
    // A MarkupContent rather than a bare string, which is what the neighbouring
    // reporting fixtures send: the test reads `contents.value`, and a plain
    // string would arrive as a shape it parses to nothing -- a red that looks
    // like the claim failing and is not.
    return Promise.resolve({ contents: { kind: "plaintext", value: JSON.stringify(report) } });
  };
  return Promise.resolve({ methods: { "textDocument/hover": hover } });
};
