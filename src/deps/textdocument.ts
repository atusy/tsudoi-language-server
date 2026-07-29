// The document a config author receives, and it is upstream's: `getText(range)`,
// `positionAt`, `offsetAt` and `lineCount` come with it.
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
