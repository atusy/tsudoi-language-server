import { expect, test } from "bun:test";
import { typeCheckProbe } from "../helpers/typecheck.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

/**
 * A probe project's source, with `body` spliced in under a bound `Tsudoi`.
 *
 * The binding is `null as unknown as` because nothing here RUNS -- the claim is
 * about what tsc accepts, and a probe that had to build a real session would be
 * measuring the construction as well.
 */
function tsudoiProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * NOT ONE CLAIM WITH THE FREEZE ABOVE: `readonly` is erased at run time and the
 * freeze arrives with no warning before it, so a type-checked config was told
 * nothing until the request that threw.
 *
 * TS2540 AND NOT THE EXIT CODE, which a probe that failed to resolve its import
 * would earn just as well; the code names `assigned to a read-only property` and
 * nothing else.
 *
 * SHALLOW `Readonly<>` IS THE WHOLE OF WHAT THIS NEEDS, and it is the
 * declaration that says so rather than a habit: the protocol gives
 * `WorkspaceFolder` two members, `uri` and `name`, both strings. There is no
 * depth for a deep wrapper to reach.
 */
test("a handler renaming a folder the lookup handed back does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      'for (const folder of tsudoi.workspaceFolders.get("file:///a.ts")) {\n  folder.name = "new";\n}',
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("name");
});

/**
 * THE OTHER SURFACE, and it is not the same claim: `get` hands back the index's
 * list and `values()` the mirror, so a type applied to one leaves the other
 * open. The member differs too -- `uri` is what the index is KEYED BY, so this
 * is the write whose run-time cost is a folder answering under a key nobody
 * holds any more.
 */
test("a handler rewriting the uri of a folder from values() does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      'for (const folder of tsudoi.workspaceFolders.values()) {\n  folder.uri = "file:///z";\n}',
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("uri");
});

/**
 * THE PAIRED CONTROL, and it reads the MEMBERS rather than merely calling the
 * operations: a folder type that had become unreadable -- mapped to `{}`, or
 * resolving to nothing -- would refuse both writes above for a reason that has
 * nothing to do with `readonly`, and a control that stopped at iterating would
 * not see it.
 */
test("reading those same members type-checks", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      [
        'export const covering = tsudoi.workspaceFolders.get("file:///a.ts").map((f) => `${f.name} ${f.uri}`);',
        "export const all = [...tsudoi.workspaceFolders.values()].map((f) => `${f.name} ${f.uri}`);",
      ].join("\n"),
    ),
  );

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});
