import type { TsudoiConfig } from "../../src/types.ts";

export default (): Promise<TsudoiConfig> =>
  Promise.reject(new Error("tsudoi fixture: the factory rejects"));
