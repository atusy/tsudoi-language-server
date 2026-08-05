// NOT WHAT `documents.get(uri)` HANDS BACK -- that is `DocumentView` in
// src/types.ts, which upstream's document satisfies and which upstream's
// `update` refuses. This is published for the two things an author does that
// the view cannot do for them: BUILDING a document, in their own tests or as a
// copy they can update, and annotating a helper of their own against the type
// upstream's namespace requires.
//
// TYPE-ONLY IS A RULING, and nothing reddens if you drop the `type`: upstream's
// is a namespace carrying `create`, `update` and `applyEdits`, so `export {`
// works -- and publishing it would publish three entry points this project must
// then keep, for helpers an author who only ever RECEIVES a document never calls.
export type { TextDocument } from "vscode-languageserver-textdocument";
