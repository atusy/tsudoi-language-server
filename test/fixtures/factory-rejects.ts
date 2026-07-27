import type { Tsudoi, TsudoiConfig } from "../../src/types.ts";

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> =>
  Promise.reject(new Error("tsudoi fixture: the factory rejects"));
