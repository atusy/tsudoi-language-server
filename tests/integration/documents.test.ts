import { expect, test } from "bun:test";
import { typeCheckProbe } from "../helpers/typecheck.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

/**
 * THE ONE THING THE PUBLISHED TYPE CANNOT SAY, ASSERTED AS THE GREEN IT IS.
 *
 * `DocumentView` carries exactly upstream's seven members with exactly their
 * signatures, so the two interfaces are MUTUALLY ASSIGNABLE and tsc accepts a
 * view wherever upstream's `TextDocument` is asked for -- including the call the
 * test above watches THROW. A reader who assumes the rename closed that hole is
 * owed the measurement rather than the assurance.
 *
 * WHY IT IS NOT CLOSED, since the shape that would close it is one line: a
 * required brand member makes the view unassignable to upstream AND upstream
 * unassignable to the view, and the second direction is the one an author uses
 * -- a helper of theirs typed against `DocumentView`, handed a document they
 * built with `TextDocument.create` in their own tests. That direction is pinned
 * below. There is no member set that keeps it and refuses this.
 *
 * WHAT REDDENS IT is upstream branding its own interface, which would make the
 * runtime refusal a compile error at last -- and this is the test that would
 * report it, rather than the change being noticed by nobody.
 */
test("passing a handed-out document to an upstream update still type-checks, which is why the throw is pinned", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import { TextDocument } from "vscode-languageserver-textdocument";',
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      'const document = tsudoi.documents.get("file:///a.txt");',
      "if (document !== undefined) {",
      '  TextDocument.update(document, [{ text: "x" }], 2);',
      "}",
      "",
    ].join("\n"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE DIRECTION AN AUTHOR ACTUALLY WRITES, and the reason the view is declared
 * structurally rather than branded: `DocumentView` is SATISFIED BY a real
 * upstream document, so a helper typed against tsudoi's own type accepts the one
 * a config author builds with `TextDocument.create` for their own tests. Without
 * this they would have to keep two overloads, or annotate against a type tsudoi
 * does not hand them.
 *
 * `TextDocument.create` AND NOT A DECLARED BINDING, because the value is what an
 * author has: a probe over `declare const` would go on passing if `create` ever
 * returned something narrower than the interface it is declared to return.
 */
test("a document built by the upstream factory satisfies the published view", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import { TextDocument } from "vscode-languageserver-textdocument";',
      'import type { DocumentView } from "./src/types.ts";',
      'export const view: DocumentView = TextDocument.create("file:///a.txt", "plaintext", 1, "x");',
      "export const text = view.getText();",
      "",
    ].join("\n"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});
