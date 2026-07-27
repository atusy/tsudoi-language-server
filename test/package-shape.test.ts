import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";

/**
 * Decisions that have to live in package.json and tsconfig.json, asserted
 * here because THOSE FILES CANNOT CARRY THEIR OWN REASONS: JSON has no
 * comments, and oxfmt sorts an unknown key like `//exports` to the tail of
 * the file where a reader meets it last. A file that carries a decision and a
 * test that carries its reason is the arrangement this project settled on; a
 * prose note would drift, and this fails when someone violates it.
 */

/** The repo's tsconfig.json, with the given keys replaced, in a throwaway tree. */
async function typeCheckWith(
  config: Record<string, unknown>,
  dist: string,
): Promise<number | null> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-tsconfig-"));
  try {
    symlinkSync(join(repoRoot, "node_modules"), join(dir, "node_modules"), "dir");
    mkdirSync(join(dir, "src"));
    mkdirSync(join(dir, "dist"));
    writeFileSync(join(dir, "src", "ok.ts"), "export const ok = 1;\n");
    writeFileSync(join(dir, "dist", "broken.d.ts"), dist);
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(config));
    const result = await runTsc(dir);
    return result.code;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The repo's own bytes, read at test time -- never a copy that could drift. */
const repoTsconfig = JSON.parse(readFileSync(join(repoRoot, "tsconfig.json"), "utf8")) as Record<
  string,
  unknown
>;

// A SYNTAX error, and it took measuring to learn why: the repo sets
// skipLibCheck, which suppresses TYPE errors inside a .d.ts even when the file
// is in the program. A broken type here would make both halves below exit 0
// and the pair would prove nothing.
const brokenDeclaration = "export declare const broken: = ;\n";

// `tsc --noEmit` is a DoD check and dist/ is generated, so the DoD must not
// grade the compiler's own output: a build artifact failing the typecheck of
// the sources that produced it is a puzzle with no useful answer.
test("the repo's tsconfig keeps dist out of the program", async () => {
  expect(await typeCheckWith(repoTsconfig, brokenDeclaration)).toBe(0);
});

// The pair, and it is not decoration: without `exclude` this same tree fails,
// which is what makes the green above evidence rather than a coincidence.
// (Measured separately with --listFiles: 8 emitted files enter the program.)
test("the same tree fails once the dist exclusion is removed", async () => {
  const { exclude: _removed, ...withoutExclude } = repoTsconfig;

  expect(await typeCheckWith(withoutExclude, brokenDeclaration)).toBe(1);
});

// PBI-13 criterion 3, and one of the two reasons JSR was declined: it REQUIRES
// a deno.json, which this project has done without for ten sprints.
//
// ITS PAIR is not a probe that writes a deno.json to prove existsSync works --
// that would assert the function, not the guarantee. The guarantee is `deno
// runs tsudoi with no deno.json anywhere`, and what pairs with this absence is
// test/installed-runtime.test.ts, where deno completes the handshake in a
// consumer project that has none either. test/resolution.test.ts measures the
// other side: what a deno.json with an npm import map does and does not buy.
test("no deno.json is needed at the repo root", () => {
  expect(existsSync(join(repoRoot, "deno.json"))).toBe(false);
  expect(existsSync(join(repoRoot, "deno.jsonc"))).toBe(false);
});
