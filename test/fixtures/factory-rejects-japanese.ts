// Relative with .ts, and Bun-free: deno executes this file too.
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * One block of Japanese, LONGER THAN ONE PIPE CHUNK so a chunk boundary is
 * guaranteed to fall inside it. Chunks were measured at 192KiB and 256KiB
 * between these runtimes and node:child_process, so 300_000 bytes clears both.
 */
const block = "あ".repeat(100_000);

/**
 * A config author's own failure message, in Japanese and shaped so that a pipe
 * chunk boundary CANNOT avoid splitting a character.
 *
 * A short Japanese message arrives in one chunk, so a per-chunk decode still
 * gets it right and a test written against it is BORN GREEN BY ACCIDENT -- it
 * would pass with the defect present. MEASURED, and the reason this file is not
 * simply one long run: a bigger payload does NOT make a split more likely.
 * Chunks arrive at exact multiples of one size, so every boundary sits at the
 * same offset modulo the 3 bytes of `あ` -- either all of them split a character
 * or none of them do, and at 360KB `none` came up on roughly a third of runs.
 *
 * The single-byte separators are what remove the luck. Each one shifts the
 * following block's characters by one byte, so the three blocks cover all three
 * residues; with one separator before the second block and two more before the
 * third, no chunk size and no message prefix can leave every boundary aligned.
 * (0, 1, 3 is not an affine sequence mod 3, which is exactly the condition an
 * all-aligned run would need.)
 */
export const japaneseFailure = `設定の読み込みに失敗しました：${block}-${block}--${block}：以上です。`;

export default (): Promise<TsudoiConfig> => Promise.reject(new Error(japaneseFailure));
