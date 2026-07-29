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
 * cancelled, WHICHEVER DRIVE its method uses. Before Sprint 35 those two
 * answers disagreed across the drives -- the stream drive returned ahead of
 * the cancellation epilogue and answered `null` to a cancelled request, where
 * the awaited-once drive reached the epilogue and answered -32800.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: {} });
};
