// Relative with .ts, and Bun-free: deno executes this file too.
import {
  foldersWithRootFallback,
  type RequestContext,
  type TsudoiConfig,
} from "../../src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/**
 * A config that answers hover with WHAT ITS OWN RequestContext CARRIES, so a
 * test can read the workspace folders a handler was given rather than infer
 * them from a completion's output.
 *
 * JSON.stringify of a WRAPPER OBJECT, never of the field itself: an absent
 * field must be distinguishable from an empty list here, and
 * `JSON.stringify(undefined)` is not a string at all -- it would leave the
 * fixture deciding how to spell absence. Wrapped, `undefined` comes back as a
 * missing key, `null` as null and `[]` as [], which is exactly the three-way
 * distinction the criteria turn on.
 *
 * `fallback` IS THE PUBLISHED REDUCTION RUN ON THIS VERY CONTEXT, and it is here
 * so that one probe can report both what tsudoi handed the author and what the
 * author gets by asking for the root -- the two states criterion 2 has to tell
 * apart in ONE session. It is read by its own tests and never by the folder
 * ones, so a break in the reduction cannot flip an assertion about the mirror.
 */
export function observationOf(context: RequestContext): string {
  return JSON.stringify({
    workspaceFolders: context.workspaceFolders,
    rootUri: context.rootUri,
    rootPath: context.rootPath,
    fallback: foldersWithRootFallback(context),
  });
}

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (context: RequestContext, _params: HoverParams): Promise<Hover> => {
        return Promise.resolve({
          contents: { kind: "plaintext", value: observationOf(context) },
        });
      },
    },
  });
};
