// Relative with .ts, and Bun-free: deno executes this file too.
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";
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
 * THE THREE MIRRORED FIELDS AND NOTHING DERIVED FROM THEM. A fourth key held
 * the published reduction run on this very context, and it went when the
 * stakeholder ruled that tsudoi's TYPES module may not export a runtime
 * function: there is no reduction left to run, so a probe that computed one HERE
 * would be asserting against a helper this fixture had written for itself.
 */
export function observationOf(context: RequestContext): string {
  return JSON.stringify({
    workspaceFolders: context.workspaceFolders,
    rootUri: context.rootUri,
    rootPath: context.rootPath,
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
