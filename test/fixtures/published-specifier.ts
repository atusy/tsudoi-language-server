// A config written the way a config author outside this repo would write one:
// its types come from the published specifier, not from a relative path into
// tsudoi's source tree. Only `tsc --noEmit` can fail this file -- `import type`
// is erased before either runtime resolves anything -- so the DoD's type check
// is what holds `@atusy/tsudoi/types` open.
import type { TsudoiConfig } from "@atusy/tsudoi/types";

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({});
};
