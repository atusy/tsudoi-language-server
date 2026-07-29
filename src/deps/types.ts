// Every LSP data name the types package declares -- types AND the values a
// handler reads or builds: the kind and severity namespaces, and the `.create`
// helpers for Position, Range, Diagnostic, CompletionItem and the rest.
//
// A STAR RATHER THAN A LIST, so the set is upstream's and cannot fall behind it.
// An explicit list stood here first, to keep the DEPRECATED `TextDocument` this
// package also ships from shadowing the good one -- and that bought nothing,
// measured: deps/protocol.ts re-exports the same deprecated declaration through
// its own star, so the name was reachable either way. What makes the right one
// win is importing it from deps/textdocument.ts, not withholding the wrong one
// here.
//
// A STAR IS ONLY POSSIBLE BECAUSE NOTHING RE-EXPORTS TWO OF THESE MODULES. Put
// this beside deps/protocol.ts's type star in one module and it is TS2308,
// ambiguous re-export, under declaration emit -- which `--noEmit` does not
// reproduce.
export * from "vscode-languageserver-types";
