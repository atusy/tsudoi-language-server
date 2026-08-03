// A config written the way a config author outside this repo would write one:
// its types come from the published specifier, not from a relative path into
// tsudoi's source tree. Only `tsc --noEmit` can fail this file -- `import type`
// is erased before either runtime resolves anything.
//
// WHAT THAT TYPE CHECK HOLDS OPEN IS THE EXPORTS MAP, AND THE SENTENCE THAT
// STOOD HERE SAID THE OPPOSITE BY A MECHANISM THAT IS GONE: it said the check
// holds open the `paths` MAPPING rather than the exports map, tsc resolving the
// specifier to src/ and never reaching package.json at all. There is no mapping
// anywhere in this repository now. The specifier goes through node_modules and
// the map's `types` arm to the framework member's dist/, so this file is one of
// the root program's routes into the artifact -- and it falls through to
// ./src/types.ts, at exit 0 and silently, on a checkout where that artifact is
// absent, which is the residue test/unbuilt-artifact.test.ts stages.
import type { TsudoiConfig } from "@atusy/tsudoi-language-server/types";

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({});
};
