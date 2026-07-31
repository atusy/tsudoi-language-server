// NOT WHAT `documents.get(uri)` HANDS BACK -- that is `DocumentView` in
// src/types.ts, which upstream's document satisfies and which upstream's
// `update` refuses. This is published for the two things an author does that
// the view cannot do for them: BUILDING a document, in their own tests or as a
// copy they can update, and annotating a helper of their own against the type
// upstream's namespace requires.
//
// THE SPECIFIER IS THE POINT, AND THE OBVIOUS SIMPLIFICATION IS THE BUG. Both
// other dependencies re-export a `TextDocument` of their own -- same seven
// members, no `update`, marked `@deprecated` upstream. Taking one of those
// instead would be one line, would add no dependency, and would compile. It is
// the wrong type; the identity probe in test/published-artifacts.test.ts is what
// catches the substitution.
//
// TYPE-ONLY IS A RULING. Upstream's is a namespace carrying `create`, `update`
// and `applyEdits`, so `export {` would work -- but tsudoi constructs documents
// and an author only ever receives one. Publishing the namespace would publish
// three entry points this project must then keep.
export type { TextDocument } from "vscode-languageserver-textdocument";
