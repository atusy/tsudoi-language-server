import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

export default (): Promise<TsudoiConfig> =>
  Promise.reject(new Error("tsudoi fixture: the factory rejects"));
