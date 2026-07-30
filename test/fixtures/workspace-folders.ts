// Relative with .ts, and Bun-free: deno executes this file too.
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/**
 * A config that answers hover with WHAT THE SERVER HANDS IT THROUGH
 * `context.tsudoi`, so a test can read the workspace folders a handler was given
 * rather than infer them from a completion's output.
 *
 * READ AT THE MOMENT THE HOVER IS SERVED. Every field below is a live read off
 * one server-lifetime object, so what this reports is the session AS OF THIS
 * REQUEST -- which is what makes it usable for asserting that a notification
 * moved the mirror.
 *
 * JSON.stringify of a WRAPPER OBJECT, never of the field itself: an absent
 * field must be distinguishable from an empty list here, and
 * `JSON.stringify(undefined)` is not a string at all -- it would leave the
 * fixture deciding how to spell absence. Wrapped, `undefined` comes back as a
 * missing key, `null` as null and `[]` as [], which is exactly the three-way
 * distinction the criteria turn on.
 *
 * THE FOLDERS ARE SPREAD AND NOT REPORTED AS THE STORE: a store is methods and
 * no members, so `JSON.stringify` of it is `{}` -- the same observation for a
 * session holding two folders as for one holding none, which is exactly the
 * distinction every criterion below turns on.
 *
 * THE THREE MIRRORED FIELDS AND NOTHING DERIVED FROM THEM. A fourth key held
 * the published reduction run on this very context, and it went when the
 * stakeholder ruled that tsudoi's TYPES module may not export a runtime
 * function: there is no reduction left to run, so a probe that computed one HERE
 * would be asserting against a helper this fixture had written for itself.
 */
export function observationOf(context: RequestContext): string {
  return JSON.stringify({
    workspaceFolders: [...context.tsudoi.workspaceFolders.values()],
    rootUri: context.tsudoi.rootUri,
    rootPath: context.tsudoi.rootPath,
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
