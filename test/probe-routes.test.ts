import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { repoRoot } from "./helpers/spawn.ts";
import { mirrorInstalledDependencies, typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT A THROWAWAY PROBE IS ALLOWED TO REACH, ASSERTED AT THE HARNESS THAT HANDS
 * IT OUT.
 *
 * A PROBE PERTURBS ONE PACKAGE'S OWN ROUTE AND THEN ASKS WHETHER THE SPECIFIER
 * STILL RESOLVES. That question is answerable only if the harness has not
 * quietly supplied a SECOND route -- and it had: the whole of this repository's
 * node_modules was handed to every probe, and this repository's node_modules
 * holds entries pointing straight back at packages under packages/. A probe that
 * deleted a package's `exports` then resolved anyway and reported EXIT 0, and
 * the control written to prove the exports map load-bearing measured nothing.
 *
 * CLOSED HERE AND NOT PER PROBE, WHICH IS THE DIFFERENCE BETWEEN A FIX AND A
 * ROUND OF REPAIRS: every enumerated probe could be made to produce its own
 * predicted failure while the harness went on handing the NEXT probe a second
 * route. The predicate below is read off `realpath` rather than off a list of
 * package names, so the entry the workspace gains tomorrow is dropped with no
 * edit to anything.
 *
 * AND A PROBE CANNOT CLOSE IT FOR ITSELF EVEN IF IT WANTED TO: the probe's only
 * node_modules WAS the repository's, shared and concurrent, so stashing a route
 * for the length of one probe would damage the checkout for every other test
 * running beside it.
 */

/** Where a probe's own node_modules is built, disposed by the caller. */
function probeDirectory(): string {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-routes-"));
  mirrorInstalledDependencies(dir);
  return dir;
}

/**
 * Every package a probe can reach by name, as the path each one really is.
 *
 * FOLLOWED RATHER THAN LISTED: an entry is a symlink, and the whole question is
 * where it lands. A reading that compared NAMES would answer `@atusy/... is
 * absent` for an entry that is present and points into this checkout under a
 * name nobody predicted.
 */
function reachedFrom(dir: string): string[] {
  const modules = join(dir, "node_modules");
  const found: string[] = [];
  for (const entry of readdirSync(modules)) {
    const at = join(modules, entry);
    if (entry.startsWith("@")) {
      for (const scoped of readdirSync(at)) {
        found.push(realpathSync(join(at, scoped)));
      }
      continue;
    }
    found.push(realpathSync(at));
  }
  return found;
}

/** Whether `path` is inside `container`, both already resolved. */
function inside(container: string, path: string): boolean {
  const step = relative(container, path);
  return step !== "" && !step.startsWith("..") && !step.startsWith(sep);
}

/**
 * THE FINDING, STATED AS THE PROPERTY RATHER THAN AS THE TWO PACKAGES THAT HAVE
 * IT TODAY: nothing a probe reaches by name may land in this checkout outside
 * its node_modules. A package under packages/ reached that way is one the probe
 * never installed and whose manifest the probe never copied, so every
 * perturbation of the probe's own copy leaves it answering.
 */
test("nothing a probe reaches by name lands in this checkout outside node_modules", () => {
  const dir = probeDirectory();
  try {
    const installed = realpathSync(join(repoRoot, "node_modules"));
    const checkout = realpathSync(repoRoot);

    expect(reachedFrom(dir).filter((at) => inside(checkout, at) && !inside(installed, at))).toEqual(
      [],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * THE OTHER HALF OF THE PAIR, AND IT IS REQUIRED RATHER THAN DECORATIVE: a
 * mirror that dropped everything satisfies the arm above perfectly, and so does
 * one that accidentally dropped a declared dependency. Both would redden the
 * probes for an APPARATUS reason that looks exactly like the finding those
 * probes exist to report.
 *
 * NAMED BY WHAT THE PROBES ACTUALLY NEED rather than by the whole install: the
 * compiler's own package, and the typings the probe sources import.
 */
test("the compiler and the type packages a probe compiles against are still reachable", () => {
  const dir = probeDirectory();
  try {
    const modules = join(dir, "node_modules");

    expect(existsSync(join(modules, "typescript"))).toBe(true);
    expect(existsSync(join(modules, "@types", "node"))).toBe(true);
    expect(existsSync(join(modules, "vscode-languageserver-protocol"))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * THE SAME PROPERTY READ THROUGH THE COMPILER, which is the reading that says
 * what the arms above are FOR: an entry the mirror drops is a specifier the
 * probe can no longer answer, so a control that perturbs the probe's own copy of
 * a manifest is the only thing left that can answer it.
 *
 * THE PAIR IS TWO SPECIFIERS AND ONE PROBE, because `TS2307` on its own is also
 * what a broken harness prints: one names a workspace package the probe never
 * installed and must fail, the other names an installed dependency and must
 * resolve, and no apparatus failure produces that combination.
 */
test("a probe cannot resolve a workspace package it never installed, and still resolves one it did", async () => {
  const unreachable = await typeCheckProbe({
    "probe.ts": 'export { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";\n',
  });
  const reachable = await typeCheckProbe({
    "probe.ts": 'export { CompletionItemKind } from "vscode-languageserver-protocol";\n',
  });

  expect(unreachable.output).toContain("TS2307");
  expect(unreachable.output).toContain("@atusy/tsudoi-hover-wordnet");
  expect(unreachable.code).not.toBe(0);
  expect(reachable.output).toBe("");
  expect(reachable.code).toBe(0);
});
