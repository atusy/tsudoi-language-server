// Deviations already examined, each with its class, so a re-run reports what
// is new and what went away rather than the same list again.
//
// Recorded against kakehashi 4ed05a9efc (feat/prepare-8-completion-resolve-edits).

export type DeviationClass =
  /** kakehashi does something its own protocol document says it does not. */
  | "kakehashi defect"
  /** kakehashi behaves the same with experimental features off: not the peer's doing. */
  | "kakehashi limitation"
  | "package defect"
  /** The protocol cannot express, or does not tell the peer, what the case needs. */
  | "protocol gap"
  /** The protocol document says so. Listed because a user will still meet it. */
  | "by design"
  | "downstream quirk"
  | "harness";

export interface Known {
  readonly id: string;
  readonly class: DeviationClass;
  readonly note: string;
  readonly group: RegExp;
  readonly scenario: RegExp;
  readonly variant: RegExp;
  /** Narrows the match to deviations whose observation reads like this. */
  readonly observed?: RegExp;
}

const any = /^/;
const prepared = /^(?!.*\(flag off\))/;
const flagOff = /\(flag off\)$/;
/** Embeddings whose line prefix kakehashi strips itself: lists and quotes. */
const prefixed = /^md-(list|nested-list|blockquote|quoted-list)/;
const gapped = /^nix-string(-multiline)?-gap$|^nix, .*gap/;
/** An edit-producing request that came back without its edit. */
const noEdit = /^\(nothing\)$|^error: no edit|-32803|no action titled|"addedEdits":0/;

export const knownDeviations: readonly Known[] = [
  {
    id: "prefixed-region-edits",
    class: "kakehashi limitation",
    note: "In a fence whose lines carry a host prefix kakehashi strips itself (a list item's indentation, a blockquote's `> `), an answer whose edit holds a line break is dropped whole: formatting, range formatting, a code action that adds or moves a line, the import a completion's resolve adds. Identical with experimental features off.",
    group: any,
    scenario:
      /^(formatting|rangeFormatting|codeAction|completion resolve \(auto-import\), item highlighted)$/,
    variant: prefixed,
    observed: noEdit,
  },
  {
    id: "prefixed-region-multiline-completion",
    class: "kakehashi limitation",
    note: "The same rule for completion items that break a line (`for .. in pairs`, `if .. fi`): dropped in a list or a blockquote, with experimental features off as well.",
    group: flagOff,
    scenario: /^completion \((fo|if)\)$/,
    variant: prefixed,
  },
  {
    id: "gaps-close-edits",
    class: "by design",
    note: "A prepared document with gaps is closed to every edit-producing method and to inlay hints (protocol document, Coordinates): rename, formatting, range formatting, code actions, completion and its resolve answer nothing in a Nix string that holds an interpolation.",
    group: prepared,
    scenario: /^(rename|formatting|rangeFormatting|codeAction|inlayHint|completion .*)$/,
    variant: gapped,
    observed: /^\(nothing\)$|^error: no edit|"addedEdits":0|no action titled/,
  },
  {
    id: "multiline-snippets-refused",
    class: "by design",
    note: "A snippet completion that breaks a line is refused on every prepared document (protocol document, Negative consequences) -- including a plain fence where the peer answered `null`, since a declined document is still a prepared one. Naming a peer for a language costs its multi-line snippets everywhere.",
    group: prepared,
    scenario: /^completion \((fo|if)\)$/,
    variant: any,
  },
  {
    id: "resolve-without-main-edit",
    class: "by design",
    note: "deno lsp's completion items carry no edit of their own, and the edits a resolve adds are placed only beside a main edit (protocol document, Edits): its auto-import is dropped on every prepared document, a plain fence included.",
    group: /^typescript \(deno\)$/,
    scenario: /^completion resolve \(auto-import\), item highlighted$/,
    variant: any,
    observed: /"addedEdits":0/,
  },
  {
    id: "server-writes-lf-into-crlf",
    class: "downstream quirk",
    note: "The server's edit holds LF line breaks in a CRLF document (shfmt behind bash-language-server, lua-language-server's `disable-next-line`, typescript-language-server's import), so the host ends up with mixed line endings. The edit is placed where it belongs; the same happens with experimental features off.",
    group: any,
    scenario: /^(formatting|rangeFormatting|codeAction|completion resolve .*)$/,
    variant: /crlf/,
    observed: /foreign line ending/,
  },
  {
    id: "shellcheck-reports-cr",
    class: "downstream quirk",
    note: "shellcheck reports every CR of a CRLF document (SC1017), as it does for a CRLF file on disk: the server is sent the region's own line endings.",
    group: /^bash/,
    scenario: /^diagnostics|^codeAction$/,
    variant: /crlf/,
  },
  {
    id: "stale-virtual-document",
    class: "kakehashi defect",
    note: "After an edit that makes kakehashi mint a region anew (a line inserted right above the closing fence, a whole-document replacement, an interpolation added to a Nix string) the previous virtual document stays open downstream, beside the new one, until the host closes. Identical with experimental features off. A server that reads every open file together shows it: gopls reports `main redeclared` and loses go-to-definition.",
    group: any,
    scenario: /^one virtual document per region after an edit$/,
    variant: any,
  },
  {
    id: "stale-virtual-document",
    class: "kakehashi defect",
    note: "The same defect as gopls sees it: the stale document redeclares everything the current one declares.",
    group: /^go$/,
    scenario: /^edits that change the peer's answer$|^peer |^edit while/,
    variant: /: (definition|diagnostics \(pull\))$/,
    observed: /redeclared|^\(nothing\)$/,
  },
  {
    id: "gap-opening-a-host-line",
    class: "protocol gap",
    note: "An interpolation with nothing injected before it on its host line (`${pkgs.hello}/bin/hello` at column 0) is stripped from the virtual document and never presented as a gap, so no rule can give it a placeholder: the server sees `/bin/hello`. The protocol document says stripped host text is not presented; for a Nix string written at column 0 that is the motivating case itself.",
    group: /^contract$/,
    scenario: /^every interpolation is presented as a gap$/,
    variant: any,
  },
];
