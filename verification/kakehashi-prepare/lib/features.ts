// Each LSP feature, asked of kakehashi at a host position and read back in
// the code's own coordinates -- so the answer for one embedding can be compared
// with the answer for another, or with a plain fence nothing prepared.
import {
  applyEdits,
  type Embedded,
  type Position,
  type Range,
  type TextEditLike,
} from "./embed.ts";
import type { OpenDocument, Session } from "./kakehashi.ts";
import { type CompletionProbe, type LanguageSpec, locate, type Marker } from "./languages.ts";
import { RpcError, sleep, TimeoutError } from "./lsp.ts";

// LSP results are read structurally; this harness types only what it touches.
type Wire = any;

export interface Subject {
  readonly session: Session;
  readonly document: OpenDocument;
  readonly embedded: Embedded;
  readonly spec: LanguageSpec;
  /**
   * The document holds other regions too: what an answer says about places
   * outside this one is theirs, and is left out rather than reported unmapped.
   */
  readonly oneOfSeveral?: boolean;
}

/** What a feature answered: a value to compare, or why there is none. */
export type Answer =
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "error"; readonly error: string }
  | { readonly kind: "empty" }
  /** The language has no probe for the feature: nothing was asked. */
  | { readonly kind: "absent" };

const value = (result: unknown): Answer =>
  result === null ||
  result === undefined ||
  (Array.isArray(result) && result.length === 0) ||
  result === ""
    ? { kind: "empty" }
    : { kind: "value", value: result };

function hostPosition(subject: Subject, marker: Marker): Position {
  // Markers are written against LF code; a CRLF embedding has the same lines.
  const inCode = locate(subject.spec.code, marker);
  const inHost = subject.embedded.toHost(inCode);
  if (inHost === undefined) throw new Error(`no host position for ${JSON.stringify(marker)}`);
  return inHost;
}

function codePosition(subject: Subject, position: Position): Position | { unmapped: Position } {
  return subject.embedded.toCode(position) ?? { unmapped: position };
}

function codeRange(subject: Subject, range: Range | undefined): unknown {
  if (range === undefined || range === null) return undefined;
  return { start: codePosition(subject, range.start), end: codePosition(subject, range.end) };
}

function codeLocation(subject: Subject, location: Wire): unknown {
  const uri: string = location.uri ?? location.targetUri;
  const range: Range = location.range ?? location.targetSelectionRange;
  if (uri === subject.document.uri) return { in: "document", range: codeRange(subject, range) };
  // Another file: its name, without the directory a run happens to be in.
  return { in: uri.split("/").at(-1), range };
}

const byJson = (a: unknown, b: unknown): number => {
  const [left, right] = [JSON.stringify(a), JSON.stringify(b)];
  return left < right ? -1 : left > right ? 1 : 0;
};

const textDocument = (subject: Subject) => ({ uri: subject.document.uri });

async function ask(subject: Subject, method: string, params: unknown): Promise<Wire> {
  return await subject.session.client.request<Wire>(method, params, 20_000);
}

function diagnosticsToCode(subject: Subject, items: Wire[]): unknown[] {
  return items
    .filter(
      (item) =>
        subject.oneOfSeveral !== true || subject.embedded.toCode(item.range.start) !== undefined,
    )
    .map((item) => ({
      range: codeRange(subject, item.range),
      severity: item.severity,
      source: item.source,
      code: typeof item.code === "object" ? item.code?.value : item.code,
      message: item.message,
    }))
    .sort(byJson);
}

function contentsText(contents: Wire): string {
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) return contents.map(contentsText).join("\n");
  return contents?.value ?? "";
}

function flattenSymbols(subject: Subject, symbols: Wire[], depth = 0): unknown[] {
  return symbols.flatMap((symbol) => [
    {
      depth,
      name: symbol.name,
      kind: symbol.kind,
      range: codeRange(subject, symbol.range ?? symbol.location?.range),
      selectionRange: codeRange(subject, symbol.selectionRange),
    },
    ...flattenSymbols(subject, symbol.children ?? [], depth + 1),
  ]);
}

function editsFor(subject: Subject, edit: Wire): TextEditLike[] | { error: string } {
  if (edit === null || edit === undefined) return { error: "no edit" };
  const own: TextEditLike[] = [];
  const foreign: string[] = [];
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) {
    if (uri === subject.document.uri) own.push(...(edits as TextEditLike[]));
    else foreign.push(uri);
  }
  for (const change of edit.documentChanges ?? []) {
    if (change.textDocument?.uri === subject.document.uri) own.push(...change.edits);
    else foreign.push(change.textDocument?.uri ?? change.kind ?? "?");
  }
  if (foreign.length > 0) return { error: `edits outside the document: ${foreign.join(", ")}` };
  return own;
}

/** The code a set of host edits leaves, or why the host no longer holds code. */
function codeAfter(subject: Subject, edits: TextEditLike[] | { error: string }): Answer {
  if (!Array.isArray(edits)) return { kind: "error", error: edits.error };
  if (edits.length === 0) return { kind: "empty" };
  try {
    return {
      kind: "value",
      value: subject.embedded.extract(applyEdits(subject.document.text, edits)),
    };
  } catch (error) {
    return {
      kind: "error",
      error: `${String(error instanceof Error ? error.message : error)}; edits: ${JSON.stringify(edits)}`,
    };
  }
}

const formattingOptions = { tabSize: 2, insertSpaces: true };

type Feature = (subject: Subject) => Promise<Answer>;

function atMarker(
  pick: (spec: LanguageSpec) => Marker | undefined,
  method: string,
  read: (subject: Subject, result: Wire) => unknown,
  extra: Record<string, unknown> = {},
): Feature {
  return async (subject) => {
    const marker = pick(subject.spec);
    if (marker === undefined) return { kind: "absent" };
    const result = await ask(subject, method, {
      textDocument: textDocument(subject),
      position: hostPosition(subject, marker),
      ...extra,
    });
    return value(result === null ? null : read(subject, result));
  };
}

const locations = (subject: Subject, result: Wire): unknown[] =>
  (Array.isArray(result) ? result : [result])
    .map((location) => codeLocation(subject, location))
    .sort(byJson);

const hover = (subject: Subject, result: Wire): unknown => ({
  contents: contentsText(result.contents),
  range: codeRange(subject, result.range),
});

/** Features answered for the code as it is. Keys are the names in the report. */
export const features: Readonly<Record<string, Feature>> = {
  "diagnostics (pull)": async (subject) => {
    const report = await ask(subject, "textDocument/diagnostic", {
      textDocument: textDocument(subject),
    });
    return value(diagnosticsToCode(subject, report?.items ?? []));
  },
  "diagnostics (push)": (subject) => {
    const pushed = subject.session
      .notificationsFor("textDocument/publishDiagnostics", subject.document.uri)
      .at(-1);
    const items = (pushed?.params as Wire)?.diagnostics ?? [];
    return Promise.resolve(value(diagnosticsToCode(subject, items)));
  },
  hover: atMarker((spec) => spec.hover, "textDocument/hover", hover),
  "hover after non-ASCII": atMarker((spec) => spec.hoverAfterNonAscii, "textDocument/hover", hover),
  definition: atMarker((spec) => spec.definition, "textDocument/definition", locations),
  references: atMarker((spec) => spec.references, "textDocument/references", locations, {
    context: { includeDeclaration: true },
  }),
  documentHighlight: atMarker(
    (spec) => spec.highlight,
    "textDocument/documentHighlight",
    (subject, result: Wire[]) =>
      result.map((highlight) => codeRange(subject, highlight.range)).sort(byJson),
  ),
  signatureHelp: atMarker(
    (spec) => spec.signature,
    "textDocument/signatureHelp",
    (_subject, result) => ({
      signatures: (result.signatures ?? []).map((signature: Wire) => signature.label),
      activeSignature: result.activeSignature ?? 0,
      activeParameter:
        result.activeParameter ?? result.signatures?.[result.activeSignature ?? 0]?.activeParameter,
    }),
  ),
  inlayHint: async (subject) => {
    if (subject.spec.inlayHints !== true) return { kind: "absent" };
    // The code's own range: kakehashi finds the region to ask by where the
    // range starts, and a whole-document range starts outside every region.
    const lines = subject.embedded.code.split(/\r\n|\r|\n/);
    const start = subject.embedded.toHost({ line: 0, character: 0 });
    const end = subject.embedded.toHost({
      line: lines.length - 2,
      character: lines.at(-2)?.length ?? 0,
    });
    if (start === undefined || end === undefined) return { kind: "error", error: "no host range" };
    const result = await ask(subject, "textDocument/inlayHint", {
      textDocument: textDocument(subject),
      range: { start, end },
    });
    return value(
      (result ?? [])
        .map((hint: Wire) => ({
          position: codePosition(subject, hint.position),
          label:
            typeof hint.label === "string"
              ? hint.label
              : hint.label.map((part: Wire) => part.value).join(""),
        }))
        .sort(byJson),
    );
  },
  documentSymbol: async (subject) => {
    if (subject.spec.documentSymbols !== true) return { kind: "absent" };
    const result = await ask(subject, "textDocument/documentSymbol", {
      textDocument: textDocument(subject),
    });
    // The host's own symbols (headings, attributes) are not the code's.
    return value(
      flattenSymbols(subject, result ?? []).filter(
        (symbol) => !JSON.stringify(symbol).includes("unmapped"),
      ),
    );
  },
  rename: async (subject) => {
    const rename = subject.spec.rename;
    if (rename === undefined) return { kind: "absent" };
    const edit = await ask(subject, "textDocument/rename", {
      textDocument: textDocument(subject),
      position: hostPosition(subject, rename.at),
      newName: rename.newName,
    });
    return codeAfter(subject, editsFor(subject, edit));
  },
  formatting: async (subject) => {
    if (subject.spec.formatting !== true) return { kind: "absent" };
    const edits = await ask(subject, "textDocument/formatting", {
      textDocument: textDocument(subject),
      options: formattingOptions,
    });
    return codeAfter(subject, edits ?? []);
  },
  rangeFormatting: async (subject) => {
    const lines = subject.spec.rangeFormatting;
    if (lines === undefined) return { kind: "absent" };
    const first = subject.embedded.toHost({ line: lines[0], character: 0 });
    const last = subject.embedded.toHost({ line: lines[1], character: 0 });
    if (first === undefined || last === undefined) return { kind: "error", error: "no host range" };
    // Whole host lines, as a linewise selection in an editor is.
    const start = { line: first.line, character: 0 };
    const end = { line: last.line, character: 0 };
    const edits = await ask(subject, "textDocument/rangeFormatting", {
      textDocument: textDocument(subject),
      range: { start, end },
      options: formattingOptions,
    });
    return codeAfter(subject, edits ?? []);
  },
  codeAction: async (subject) => {
    const probe = subject.spec.codeAction;
    if (probe === undefined) return { kind: "absent" };
    const at = hostPosition(subject, probe.at);
    const pulled = await ask(subject, "textDocument/diagnostic", {
      textDocument: textDocument(subject),
    });
    const pushed = (
      subject.session
        .notificationsFor("textDocument/publishDiagnostics", subject.document.uri)
        .at(-1)?.params as Wire
    )?.diagnostics;
    const diagnostics = [...(pulled?.items ?? []), ...(pushed ?? [])].filter(
      (diagnostic: Wire) =>
        diagnostic.range.start.line <= at.line && diagnostic.range.end.line >= at.line,
    );
    const actions: Wire[] =
      (await ask(subject, "textDocument/codeAction", {
        textDocument: textDocument(subject),
        range: { start: at, end: at },
        context: { diagnostics, ...(probe.only ? { only: probe.only } : {}) },
      })) ?? [];
    let action = actions.find((candidate) => probe.title.test(candidate.title ?? ""));
    if (action === undefined) {
      return actions.length === 0
        ? { kind: "empty" }
        : {
            kind: "error",
            error: `no action titled ${String(probe.title)} among ${JSON.stringify(actions.map((candidate) => candidate.title))}`,
          };
    }
    if (action.disabled !== undefined) {
      return { kind: "error", error: `action disabled: ${String(action.disabled.reason)}` };
    }
    if (action.edit === undefined) {
      action = await ask(subject, "codeAction/resolve", action);
    }
    return codeAfter(subject, editsFor(subject, action?.edit));
  },
};

/** The code with `probe.typed` on a new line below the line holding `probe.below`. */
export function typedCode(code: string, probe: CompletionProbe): { code: string; at: Position } {
  const lines = code.split("\n");
  const line = lines.findIndex((candidate) => candidate.includes(probe.below));
  if (line < 0) throw new Error(`no line holds ${JSON.stringify(probe.below)}`);
  lines.splice(line + 1, 0, probe.typed);
  return { code: lines.join("\n"), at: { line: line + 1, character: probe.typed.length } };
}

function completionItem(subject: Subject, item: Wire, defaults: Wire): unknown {
  const edit = item.textEdit;
  const defaultRange = defaults?.editRange;
  return {
    label: item.label,
    kind: item.kind,
    insertTextFormat: item.insertTextFormat ?? defaults?.insertTextFormat,
    insertTextMode: item.insertTextMode ?? defaults?.insertTextMode,
    insertText: item.insertText,
    textEdit:
      edit === undefined
        ? defaultRange === undefined
          ? undefined
          : { default: true, range: codeRange(subject, defaultRange.range ?? defaultRange) }
        : {
            newText: edit.newText,
            range: codeRange(subject, edit.range),
            insert: codeRange(subject, edit.insert),
            replace: codeRange(subject, edit.replace),
          },
    additionalTextEdits: (item.additionalTextEdits ?? []).map((extra: Wire) => ({
      newText: extra.newText,
      range: codeRange(subject, extra.range),
    })),
  };
}

/** Completion at `at` (code coordinates), every item read in code coordinates. */
export async function completion(subject: Subject, at: Position, expect: string): Promise<Answer> {
  const position = subject.embedded.toHost(at);
  if (position === undefined) return { kind: "error", error: "no host position for the caret" };
  const result = await ask(subject, "textDocument/completion", {
    textDocument: textDocument(subject),
    position,
    context: { triggerKind: 1 },
  });
  const items: Wire[] = Array.isArray(result) ? result : (result?.items ?? []);
  // Some servers decorate the label (clangd puts a space before it).
  const names = (item: Wire): string[] => [item.label, item.filterText, item.insertText];
  if (
    !items.some((item) =>
      names(item).some((name) => typeof name === "string" && name.trim().startsWith(expect)),
    )
  ) {
    return { kind: "empty" };
  }
  return {
    kind: "value",
    value: items.map((item) => completionItem(subject, item, result?.itemDefaults)).sort(byJson),
  };
}

export const describeAnswer = (answer: Answer): string =>
  answer.kind === "value"
    ? JSON.stringify(answer.value)
    : answer.kind === "error"
      ? `error: ${answer.error}`
      : answer.kind === "absent"
        ? "(not asked)"
        : "(nothing)";

export const sameAnswer = (a: Answer, b: Answer): boolean =>
  describeAnswer(a) === describeAnswer(b);

/**
 * Asks until the answer stops changing (and is something), or the deadline:
 * servers analyze in the background, and an early answer is not a wrong one.
 */
export async function settle(
  feature: () => Promise<Answer>,
  options: { timeoutMs: number; until?: (answer: Answer) => boolean },
): Promise<Answer> {
  const deadline = Date.now() + options.timeoutMs;
  let previous: Answer | undefined;
  let last: Answer = { kind: "empty" };
  for (;;) {
    try {
      last = await feature();
    } catch (error) {
      last = {
        kind: "error",
        error:
          error instanceof RpcError
            ? `${String(error.code)} ${error.message}`
            : error instanceof TimeoutError
              ? error.message
              : String(error),
      };
    }
    if (options.until !== undefined) {
      if (options.until(last)) return last;
    } else if (last.kind === "value" && previous !== undefined && sameAnswer(previous, last)) {
      return last;
    }
    if (Date.now() >= deadline) return last;
    previous = last;
    await sleep(400);
  }
}

/** An item of the answer at `at` whose label is `label`, asked until one comes. */
async function listedItem(
  subject: Subject,
  at: Position,
  label: string,
  timeoutMs: number,
): Promise<{ item: Wire; position: Position } | undefined> {
  const position = subject.embedded.toHost(at);
  if (position === undefined) return undefined;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const result = await ask(subject, "textDocument/completion", {
      textDocument: textDocument(subject),
      position,
      context: { triggerKind: 1 },
    }).catch(() => null);
    const items: Wire[] = Array.isArray(result) ? result : (result?.items ?? []);
    const item = items.find((candidate) => candidate.label === label);
    if (item !== undefined) return { item, position };
    if (Date.now() >= deadline) return undefined;
    await sleep(500);
  }
}

/** The edit that inserts an item: its own, or its text over the word typed so far. */
function mainEdit(item: Wire, position: Position, typed: string): TextEditLike {
  const edit = item.textEdit;
  if (edit !== undefined) return { range: edit.range ?? edit.insert, newText: edit.newText };
  const word = typed.trimStart();
  return {
    range: {
      start: { line: position.line, character: position.character - word.length },
      end: position,
    },
    newText: item.insertText ?? item.label,
  };
}

/**
 * Resolves an item while it is highlighted, before anything is inserted, and
 * reads the code its edit and the edits the resolve added leave together.
 */
export async function resolveHighlighted(
  subject: Subject,
  at: Position,
  typed: string,
  label: string,
  timeoutMs: number,
): Promise<Answer> {
  const listed = await listedItem(subject, at, label, timeoutMs);
  if (listed === undefined) return { kind: "empty" };
  const resolved = await ask(subject, "completionItem/resolve", listed.item);
  const added: TextEditLike[] = resolved?.additionalTextEdits ?? [];
  const after = codeAfter(subject, [mainEdit(listed.item, listed.position, typed), ...added]);
  if (after.kind !== "value") return after;
  return {
    kind: "value",
    value: {
      addedEdits: added.length,
      detail: typeof resolved?.detail === "string" && resolved.detail !== "",
      code: after.value,
    },
  };
}

/**
 * Resolves an item after its text was inserted, as an editor does that
 * resolves on accepting a completion. Says what came back: no added edits,
 * edits that leave `expectedCode`, or edits that leave something else.
 */
export async function resolveAfterInsert(
  subject: Subject,
  at: Position,
  typed: string,
  label: string,
  expectedCode: string,
  timeoutMs: number,
  /** How long after the insertion the resolve is sent: at once, or once the edit settled. */
  waitMs = 0,
): Promise<{ edits: string; detail: string } | undefined> {
  const listed = await listedItem(subject, at, label, timeoutMs);
  if (listed === undefined) return undefined;
  // One incremental change, as an editor sends an accepted completion.
  const main = mainEdit(listed.item, listed.position, typed);
  const inserted = applyEdits(subject.document.text, [main]);
  subject.session.changeRange(subject.document, main.range, main.newText, inserted);
  if (waitMs > 0) await sleep(waitMs);
  const response = await subject.session.client.respond(
    "completionItem/resolve",
    listed.item,
    20_000,
  );
  const resolved = response.result as Wire;
  // Whether the resolve told anything the list had not: the item comes back
  // as it was listed when the request was not forwarded.
  const told = (key: string): boolean =>
    resolved?.[key] !== undefined &&
    JSON.stringify(resolved[key]) !== JSON.stringify(listed.item[key]);
  const detail =
    told("detail") || told("documentation") ? "resolved" : "as listed (nothing resolved)";
  if (response.error !== undefined) {
    return { edits: `error ${String(response.error.code)}: ${response.error.message}`, detail };
  }
  const added: TextEditLike[] = resolved?.additionalTextEdits ?? [];
  if (added.length === 0) return { edits: "none", detail };
  try {
    const code = subject.embedded.extract(applyEdits(inserted, added));
    return {
      edits: code === expectedCode ? "placed rightly" : `MISPLACED: ${JSON.stringify(code)}`,
      detail,
    };
  } catch (error) {
    return {
      edits: `MISPLACED: ${String(error instanceof Error ? error.message : error)}; ${JSON.stringify(added)}`,
      detail,
    };
  }
}
