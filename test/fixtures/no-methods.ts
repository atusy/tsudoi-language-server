// Relative with .ts, and Bun-free: deno executes this file too.
import type { TsudoiConfig } from "../../src/types.ts";

/**
 * A config supplying NO handler for any method the request table declares, so
 * EVERY entry takes its own drive's no-handler path.
 *
 * `methods` is present and EMPTY rather than absent, for the reason
 * test/fixtures/hover-absent.ts already gives: a server reading
 * `methods !== undefined` instead of looking the method up would pass an absent
 * one and fail this.
 *
 * THE DUPLICATION WITH hover-absent.ts IS DELIBERATE AND THE NAME IS THE WHOLE
 * REASON. That fixture is driven by test/hover.test.ts and its block is written
 * about hover; a table-wide test iterating every entry through a file called
 * `hover-absent` would make both the name and that block lie. Renaming it
 * instead would edit a test no criterion here reaches.
 *
 * WHAT IT IS FOR: the by-construction assertions in test/methods-table.test.ts
 * that a request with no handler is answered `null` normally and -32800 when
 * cancelled, WHICHEVER DRIVE its method uses. THE DRIVES ARE THE THING THAT CAN
 * DISAGREE HERE, which is why the assertion is written across all of them: a
 * drive returning AHEAD of the cancellation epilogue answers a cancelled
 * request `null`, where one that reaches the epilogue answers -32800, and a
 * test naming one method exercises only whichever drive that method uses.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: {} });
};
