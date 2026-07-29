// THE PUBLISHED TYPE SURFACE. package.json maps `@atusy/tsudoi/types` here, and
// this is the only path a config author outside the repo can reach by bare
// specifier, so every exported name below is public API and renaming one breaks
// configs we cannot see.
//
// What ships is the COMPILED dist/types.d.ts, not this file: since sprint 10 the
// package publishes dist/ alone, so that a deno user can run the CLI from
// node_modules at all. The shape of that surface and the reason for every arm of
// the exports map are asserted in test/package-shape.test.ts, which is where a
// decision about a file that cannot carry comments lives.
import type {
  CompletionItem,
  CompletionParams,
  DocumentFormattingParams,
  Hover,
  HoverParams,
  TextEdit,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
// IMPORTED AS WELL AS RE-EXPORTED, and the duplication is the language's rather
// than a choice: `export ... from` publishes a name without binding it here, and
// DocumentStore below needs to NAME it.
import type { TextDocument } from "vscode-languageserver-textdocument";

/**
 * THE PROTOCOL NAMES A CONFIG AUTHOR GETS FROM HERE, so that standing up a
 * server needs ONE package and a config never names one its author did not
 * install.
 *
 * WHY EXACTLY THESE, measured against examples/ rather than chosen for
 * convenience: they are the protocol names the examples actually use.
 * completion-path.ts uses CompletionItem, CompletionItemKind, CompletionParams,
 * MarkupContent, Position and WorkspaceFolder; hover-wordnet.ts adds Hover and
 * HoverParams; tsudoi.config.ts adds none of its own. This is the minimum that
 * lets the examples import no protocol package, not a convenience dump.
 *
 * THE RULE FOR A NINTH: adding one is a deliberate act with a reason, because
 * every name exported from this file is public API and renaming or dropping one
 * breaks configs we cannot see. The reason belongs here, beside the name. What
 * a ninth name must NOT be is `a config author might want it` -- that argument
 * has no end, and the set it produces is the dependency's whole surface
 * re-published under names this project would then have to keep.
 *
 * CompletionItemKind IS RE-EXPORTED AS A VALUE, and the distinction is not
 * stylistic: it is an enum, so a handler reads CompletionItemKind.File at RUN
 * TIME. `export type` here would emit a perfect dist/types.d.ts beside a
 * dist/types.js that exports nothing, and every type-check in this repo would
 * stay green while a config author got `undefined` at their first completion.
 * test/published-artifacts.test.ts asserts the runtime namespace of the
 * PUBLISHED module, which is the only arm that can see that difference --
 * measured: making this line `export type` reddens that one assertion and
 * leaves every other test in that file green.
 *
 * WHY THE BARE SPECIFIER AND NOT `/node`, recorded here because this is where
 * the edit that undoes it would be made, and because an unrecorded specifier
 * decision is the defect that produced this work in the first place.
 *
 * MEASURED at vscode-languageserver-protocol 3.18.2, which pins vscode-jsonrpc
 * 9.0.1 and vscode-languageserver-types 3.18.0 exactly. In a project with
 * `types: []` and no @types/node reachable at all, importing CompletionItemKind
 * from the BARE specifier exits 0, while importing it from
 * `vscode-languageserver-protocol/node` exits 1. The diagnostics are NAMED
 * rather than counted, since a count falsifies at the next release that adds a
 * line: TS2591 for `child_process`, `net` and `worker_threads` out of
 * vscode-jsonrpc/lib/node/main.d.ts, and TS2503 for namespace `NodeJS` out of
 * that file AND vscode-languageserver-protocol/lib/node/main.d.ts. So the bare
 * specifier is what keeps this subpath usable by a config author who never
 * installed node's types.
 *
 * THE CONDITION THAT MEASUREMENT DEPENDS ON, and it is the half that is easy to
 * drop: `skipLibCheck` must be OFF. It is tsc's default, so a config author who
 * writes no tsconfig of their own is protected by this line -- but with
 * skipLibCheck ON, both specifiers exit 0 and the difference vanishes entirely.
 *
 * WHAT ASSERTS IT, replacing the paragraph that stood here saying NOTHING did:
 * test/installed-without-node-types.test.ts installs the packed package into a
 * consumer whose OWN tsconfig sets skipLibCheck OFF and `types: []`, and moving
 * the specifier below to `/node` reddens it BY NAME -- `child_process` and
 * `NodeJS`, out of the two files this comment lists.
 *
 * ITS SECOND CONTROL IS WHAT KEEPS THE FIRST MEANINGFUL, and it is the half to
 * check before trusting any of this again: the SAME perturbation with
 * skipLibCheck back ON exits 0. So a probe that quietly reverted to blind FAILS
 * rather than passing, which is the failure this paragraph used to describe as
 * the standing state.
 *
 * WHAT IS STILL NOT COVERED: that is the TYPE arm alone, and it reads the
 * INSTALLED dependency rather than the `^3.17.5` package.json asks for. And the
 * probe carries a fragility of its own -- skipLibCheck OFF type-checks the
 * dependency's whole declaration graph -- disclosed in its doc block together
 * with the triage for the day it fires for a reason that is not this line.
 */
export { CompletionItemKind } from "vscode-languageserver-protocol";
export type {
  CompletionItem,
  CompletionParams,
  Hover,
  HoverParams,
  MarkupContent,
  Position,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";

/**
 * THE DOCUMENT A CONFIG AUTHOR RECEIVES, and it is UPSTREAM'S, not a shape of
 * this project's own. `getText(range)`, `positionAt`, `offsetAt` and `lineCount`
 * come with it, so the offset arithmetic a positional handler needs is written
 * and fixed by other people.
 *
 * NOT ONE OF THE EIGHT ABOVE, AND DELIBERATELY NOT IN `publicProtocolNames`.
 * That list's own doc block in test/helpers/published-names.ts says it holds THE
 * PROTOCOL NAMES THE PUBLISHED SUBPATH RE-EXPORTS; this name comes from a
 * DIFFERENT PACKAGE, so adding it there would make that sentence false. The
 * consequence is that the two probes defending the eight defend NOTHING about
 * this name -- so it has its OWN probe in test/published-artifacts.test.ts,
 * rather than riding on theirs.
 *
 * THE SPECIFIER IS THE POINT, AND THE OBVIOUS SIMPLIFICATION IS THE BUG.
 * `vscode-languageserver-protocol` re-exports `vscode-languageserver-types`
 * whole, and that package STILL CARRIES A `TextDocument` -- same seven members,
 * no `update`, and its own doc comment reads `@deprecated Use the text document
 * from the new vscode-languageserver-textdocument package`. Re-exporting it from
 * the specifier this file already imports would be ONE LINE, would add no
 * dependency, would compile, and would satisfy every structural check. It is the
 * wrong type. What stops it is not this paragraph but the identity probe, which
 * reddens on that exact substitution -- MEASURED, naming its marker.
 *
 * TYPE-ONLY IS A RULING, NOT AN OVERSIGHT, and it is the `rule for a ninth`
 * applied to a name from somewhere else. Upstream's `TextDocument` is a
 * NAMESPACE CARRYING FUNCTIONS -- `create`, `update`, `applyEdits` -- so it has a
 * runtime value exactly as `CompletionItemKind` does, and `export {` would work.
 * It is withheld because TSUDOI CONSTRUCTS DOCUMENTS AND A CONFIG AUTHOR ONLY
 * EVER RECEIVES ONE: src/documents.ts calls `create` and `update`, and a handler
 * that built its own document would be building something tsudoi's store never
 * hands back. Publishing the namespace would publish three more entry points
 * this project would then have to keep, on the `an author might want it`
 * argument the block above forbids.
 *
 * WHAT THE RULING COSTS, and it is the strongest case against it, so it is
 * recorded rather than left for someone to rediscover: an author who wants to
 * unit-test a handler must BUILD a document, and `create` is the only supported
 * way to build one -- upstream's `update` accepts nothing else. So that author
 * installs `vscode-languageserver-textdocument` themselves and names it in one
 * import, which is a package this project otherwise keeps them from having to
 * know about. THIS REPOSITORY'S OWN TEST DOES EXACTLY THAT, at
 * test/completion-path.test.ts, which is where to look before reversing this.
 * THE CONDITION FOR REVERSAL, so the next reader is not re-deciding from
 * scratch: evidence that authors are writing that import, rather than the
 * prediction that they might.
 *
 * IT IS REVERSIBLE AT ONE TOKEN AND THE REVERSAL IS DEFENDED. Dropping `type`
 * below is the whole edit, and test/published-artifacts.test.ts's
 * `the published module re-exports CompletionItemKind as a runtime value`
 * asserts the published module's runtime surface EXACTLY -- so the reversal
 * reddens there and cannot happen quietly. MEASURED, not reasoned: making this
 * line `export {` reddens that one assertion and leaves every other test in that
 * file green.
 *
 * `Range` IS NOT EXPORTED BESIDE IT, considered and declined: `getText` takes a
 * structural `{ start, end }`, so an author writes an object literal and imports
 * nothing. Adding `Range` would be a genuine NINTH PROTOCOL NAME under the rule
 * above, bought with nothing.
 *
 * SO THIS SURFACE NOW CARRIES TWO `Position` DECLARATIONS, and it is said here
 * because this sprint spent itself proving that kind of thing is INVISIBLE to
 * every check but one. `positionAt` returns the `Position` declared in
 * vscode-languageserver-textdocument, while the `Position` exported above is the
 * protocol's. They are structurally identical, and NOTHING HERE IS NOMINAL --
 * no `instanceof`, no branded type, no augmentation -- so the two are
 * interchangeable in every direction a config author can reach. It is harmless
 * TODAY, and the condition that would end that is either package giving
 * `Position` a nominal member.
 *
 * THE BREAK THIS IS, stated where the edit that caused it lives: upstream's type
 * is a SUPERSET of what stood here, so every config that RECEIVES a document
 * keeps compiling -- `uri`, `languageId`, `version` and `getText()` are
 * unchanged. What breaks is a config that IMPLEMENTS the interface, which in
 * practice means a hand-written mock in an author's own tests. README says so
 * for the reader who is not looking at this file.
 */
export type { TextDocument } from "vscode-languageserver-textdocument";

// will expose a function to subscribe/unsubscribe events such as receiving notifications, requests, and responses from the client or submitting them to the client
/**
 * THE STORE A CONFIG AUTHOR READS, AND WHAT IT HANDS BACK IS LIVE.
 *
 * `get` answers with the document as it stands now, and THE DOCUMENT IT ANSWERS
 * WITH GOES ON MOVING: upstream's `TextDocument.update` mutates the instance it
 * was handed, so a reference kept across an `await` reflects every change that
 * arrived meanwhile rather than the text that was there when it was taken.
 *
 * THE ASYMMETRY WITH `RequestContext.workspaceFolders` IS WHY THIS IS WRITTEN
 * DOWN AT ALL. That list IS a snapshot -- of request start -- and an author who
 * read it first would reasonably generalise from one to the other. They are
 * opposite ON PURPOSE: a folder list that shifted mid-request would let one
 * response carry items attributed to a root that no longer exists, while a
 * document that did NOT shift would let a handler answer about text the user
 * has already replaced. So a handler that needs the text it STARTED with must
 * take a copy -- `getText()` returns a string, and a string does not move --
 * while a handler that needs the current text simply keeps its reference.
 *
 * ASSERTED RATHER THAN MERELY STATED: test/documents.test.ts pins that a
 * reference taken before a change reflects that change afterwards.
 */
export interface DocumentStore {
  get(uri: string): TextDocument | undefined;
  values(): Iterable<TextDocument>;
}

export interface Tsudoi {
  readonly documents: DocumentStore;
}

export interface MethodMap {
  // yield結果はpartial responseとしてクライアントに返す
  // returnしたらpartial response終了とみなす。partial responseが存在していてかつ、resultがnullの場合は、空のCompletionItem[]をクライアントに返す
  // クライアントがparital responseをサポートしない場合やpartialResultTokenがない場合は、yieldやreturnを1つのCompletionItem[]にまとめて返す
  "textDocument/completion": {
    params: CompletionParams;
    result: AsyncGenerator<CompletionItem[], CompletionItem[] | null, void>;
  };

  "textDocument/hover": {
    params: HoverParams;
    result: Promise<Hover | null>;
  };

  /**
   * Awaited once, exactly as hover is: a formatter has one answer for the whole
   * document, and the protocol gives it no partialResultToken to stream under.
   *
   * `DocumentFormattingParams` AND `TextEdit` ARE IMPORTED AND DELIBERATELY NOT
   * RE-EXPORTED, which is the rule-for-a-ninth above applied rather than
   * forgotten. That list is the protocol names the EXAMPLES use, and no example
   * formats anything; a handler written in a config needs neither name, because
   * `MethodHandler` supplies both by contextual typing -- which is what README
   * already tells a config author. What would reverse it is an example that
   * must NAME one of them.
   *
   * MEASURED RATHER THAN ASSUMED, AND THE MEASUREMENT IS A FILE RATHER THAN A
   * RECOLLECTION: test/fixtures/formatting-offsets.ts imports only `Tsudoi` and
   * `TsudoiConfig`, annotates its handler with nothing, calls
   * `document.positionAt` and returns object literals `{ range: { start, end },
   * newText }` -- and the DoD's `tsc --noEmit` type-checks it on every run. So
   * this paragraph goes stale LOUDLY: add an annotation to that file, or a
   * protocol import, and the evidence for this ruling is gone with it.
   *
   * THAT THE TYPING DISCRIMINATES rather than accepting anything was measured
   * on a THROWAWAY probe run in the same session and NOT KEPT, which is said
   * plainly because it cannot be re-run from the tree: renaming a handler's
   * `newText` to `newTxt` failed TS2322 naming the missing property, and a
   * handler reading `params.options.tabSize` -- a field NO fixture here touches
   * -- type-checked without an annotation.
   *
   * MEASURED at vscode-languageserver-protocol 3.18.2, which pins
   * vscode-languageserver-types 3.18.0: `DocumentFormattingRequest.type` is
   * `ProtocolRequestType<DocumentFormattingParams, TextEdit[] | null, never,
   * void, DocumentFormattingRegistrationOptions>`, so the result type below is
   * the protocol's own and not a shape this project chose.
   */
  "textDocument/formatting": {
    params: DocumentFormattingParams;
    result: Promise<TextEdit[] | null>;
  };
}

export type Method = keyof MethodMap;

export interface RequestContext {
  readonly signal: AbortSignal;
  readonly tsudoi: Tsudoi;
  /**
   * The workspace folders this request started on -- what the client stated at
   * `initialize`, plus every change it has notified since -- or an EMPTY LIST
   * when it has named none.
   *
   * Absence is a state a config author must be able to SEE: it is never
   * defaulted to the working directory, to `/`, or to anything else this
   * process could invent. An empty list means the editor opened no workspace,
   * and answering from a root nobody named is the failure this shape refuses.
   *
   * Both of the protocol's absent states -- the field omitted and the field
   * sent as null -- arrive here as the same empty list, so a config author
   * never has to know there were two.
   *
   * WHAT IT IS A SNAPSHOT OF, stated at the type because the answer CHANGED
   * and `snapshot` alone would let a reader assume the old one: it is a
   * snapshot of REQUEST START, not of `initialize`. tsudoi handles
   * `workspace/didChangeWorkspaceFolders`, so a folder the user adds or removes
   * mid-session reaches the NEXT request -- while a request already in flight
   * keeps the list it began with. That is what stops one response carrying
   * items attributed to a root that no longer exists beside items from one that
   * just appeared, and it matters because a completion handler may stream over
   * time rather than answer at once.
   *
   * AND IT IS THE ONLY SNAPSHOT ON THIS SURFACE. The documents reached through
   * `tsudoi` are LIVE, and generalising from this paragraph to those is the
   * mistake that is easy to make -- so the opposite half is stated at
   * `DocumentStore`, where an author reading about documents will meet it.
   *
   * MIRRORED, NOT INTERPRETED. What arrives is what the client said, and
   * nothing here normalises it: two spellings of one directory are TWO folders,
   * and a URI added twice is held twice, because this list is the CLIENT's
   * state rather than the filesystem's. MEASURED against nvim, which accepts
   * `…/plain` and `…/plain/` as different folders and removes them separately
   * -- so a normalising implementation would delete a folder the client still
   * holds.
   *
   * THE MIRROR HOLDS ON REMOVE TOO, which is the half that is easy to assume
   * rather than read: a URI held twice and removed ONCE still appears here
   * ONCE. N removals take N copies, whether they arrive in N events or in one
   * event carrying N entries. Pinned by two tests in test/workspace.test.ts,
   * one per arrival shape; see src/workspace.ts for which mistake each catches.
   *
   * WHICH FIELD THE CLIENT SAID IT IN IS NOT VISIBLE HERE, and that is the one
   * place this list is more than a mirror. A client may name its project in
   * `workspaceFolders`, in `rootUri` or in `rootPath`, the last two being the
   * deprecated spellings a client without the workspace-folders capability
   * still has -- and only the first is a list. So when a session opens with no
   * `workspaceFolders`, ONE FOLDER IS SYNTHESISED from `rootUri`, or failing
   * that from `rootPath`, and it appears here as an ORDINARY MEMBER: nothing
   * marks it, and a later add or remove applies to it like any other. Its
   * `name` is THE FULL PATH, since that is what can be derived from what the
   * client sent without inventing anything -- so a `name` here is not
   * guaranteed to be a label the user would recognise.
   *
   * WHAT IS NEVER SYNTHESISED IS A ROOT THE CLIENT DID NOT NAME. A client
   * naming none of the three leaves this EMPTY -- never cwd, never `/`.
   *
   * The name is deliberately not `initialWorkspaceFolders`. It was refused
   * BEFORE tracking landed, and tracking is why: every exported name here is
   * public API, so a name that became false would have had to stay.
   */
  readonly workspaceFolders: readonly WorkspaceFolder[];
}

export type MethodHandler<M extends Method> = (
  context: RequestContext,
  params: MethodMap[M]["params"],
) => MethodMap[M]["result"];

export type TsudoiConfig = {
  methods?: Partial<{
    [M in Method]: MethodHandler<M>;
  }>;
};

export type TsudoiConfigFactory = (tsudoi: Tsudoi) => Promise<TsudoiConfig>;
