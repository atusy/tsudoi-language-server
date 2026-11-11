// What happens over time: edits that change the peer's answer, edits arriving
// faster than answers, a peer that fails in every way a peer can, several
// regions in one file, and the feature turned off.
import { existsSync, readFileSync } from "node:fs";
import {
  applyEdits,
  type Embedded,
  type Embedding,
  markdownEmbeddings,
  nixEmbeddings,
  nixGapEmbedding,
  nixMultilineGapEmbedding,
  overIndentedFence,
  plainFence,
  type Position,
} from "../lib/embed.ts";
import {
  type Answer,
  describeAnswer,
  features,
  sameAnswer,
  settle,
  type Subject,
} from "../lib/features.ts";
import { type PeerSetup, Session } from "../lib/kakehashi.ts";
import { type LanguageSpec, nameOf } from "../lib/languages.ts";
import { sleep } from "../lib/lsp.ts";
import type { Report } from "../lib/report.ts";
import { awaitHeld, baselineFor, embed, openSubject, type RunOptions } from "./features.ts";

const named = (name: string): Embedding => {
  const found = [...markdownEmbeddings, ...nixEmbeddings].find(
    (embedding) => embedding("", { language: "x" }).name === name,
  );
  if (found === undefined) throw new Error(`no embedding named ${name}`);
  return found;
};

const list = named("md-list-2");
const quote = named("md-blockquote");
const indentedFence = named("md-indented-fence");
const blankEdges = named("md-blank-edges");
const nixString = named("nix-string");

/** The features that say whether coordinates still land: cheap, and position-bearing. */
const positional = ["hover", "definition", "diagnostics (pull)"] as const;

/** The longest a request may take while a peer misbehaves before it counts as a hang. */
const HANG_MS = 9_000;

interface Context {
  readonly spec: LanguageSpec;
  readonly report: Report;
  readonly options: RunOptions;
  readonly baseline: Map<string, Answer>;
}

function start(context: Context, label: string, experimental: boolean, peer: PeerSetup) {
  return Session.start({
    kakehashi: context.options.kakehashi,
    experimental,
    peer,
    servers: context.spec.servers,
    hosts: ["markdown", "nix"],
    files: context.spec.files,
    artifacts: context.options.artifacts,
    label: `${nameOf(context.spec)}.${label}`,
  });
}

/** Checks that the servers hold `embedded.code` and that positions land. */
async function expectState(
  context: Context,
  subject: Subject,
  scenario: string,
  step: string,
): Promise<void> {
  const { spec, report, options, baseline } = context;
  report.check(
    nameOf(spec),
    scenario,
    `${step}: prepared text`,
    JSON.stringify([subject.embedded.code]),
    await awaitHeld(subject.session, spec, subject.embedded.code, options.patienceMs),
  );
  for (const name of positional) {
    const expected = baseline.get(name);
    const feature = features[name];
    if (expected?.kind !== "value" || feature === undefined) continue;
    const observed = await settle(() => feature(subject), {
      timeoutMs: options.patienceMs,
      until: (answer) => sameAnswer(answer, expected),
    });
    report.check(
      nameOf(spec),
      scenario,
      `${step}: ${name}`,
      describeAnswer(expected),
      describeAnswer(observed),
    );
  }
}

function retarget(subject: Subject, embedded: Embedded): Subject {
  subject.session.change(subject.document, embedded.hostText);
  return { ...subject, embedded };
}

/**
 * Types a comment as a new last line of the code: another text, the same
 * meaning. One incremental change at the end of the last line, as an editor
 * sends it, so the region stays the document it was.
 */
function appendComment(subject: Subject, tag: string): Subject {
  const { spec, session, document, embedded } = subject;
  if (spec.comment === undefined) throw new Error(`${spec.id} has no comment syntax`);
  const comment = spec.comment(tag);
  const codeLines = embedded.code.split("\n");
  const last = codeLines.length - 2;
  const lineStart = embedded.toHost({ line: last, character: 0 });
  const lineEnd = embedded.toHost({ line: last, character: codeLines[last]?.length ?? 0 });
  if (lineStart === undefined || lineEnd === undefined) {
    throw new Error("the code's last line has no host position");
  }
  const prefix = (document.text.split("\n")[lineStart.line] ?? "").slice(0, lineStart.character);
  const inserted = `\n${prefix}${comment}`;
  // The embedding of the longer code is where expectations come from: the
  // typed text must make exactly that document.
  const next = embedded.rebuild(`${embedded.code}${comment}\n`);
  const text = applyEdits(document.text, [
    { range: { start: lineEnd, end: lineEnd }, newText: inserted },
  ]);
  if (text !== next.hostText) throw new Error("the typed line does not make the embedded text");
  session.changeRange(document, { start: lineEnd, end: lineEnd }, inserted, text);
  return { ...subject, embedded: next };
}

/** Texts sent for the language since `since` that are none of `allowed`. */
function strayTexts(
  session: Session,
  spec: LanguageSpec,
  since: number,
  allowed: string[],
): string[] {
  return session
    .downstreamTexts(spec.id)
    .filter((sent) => sent.at >= since && sent.kind !== "didClose" && !allowed.includes(sent.text))
    .map((sent) => sent.text);
}

async function editsThatChangeTheAnswer(context: Context, session: Session): Promise<void> {
  const { spec } = context;
  const scenario = "edits that change the peer's answer";
  // Markdown: indentation added, edge lines added, removed again, and back.
  const steps: [string, Embedding][] = [
    ["open in a list", list],
    ["indent added", overIndentedFence],
    ["blank edge lines added", blankEdges],
    ["fence indented", indentedFence],
    ["indent removed", plainFence],
    ["undo to the indented text", overIndentedFence],
    ["undo to the list", list],
  ];
  let subject = openSubject(session, spec, embed(spec, list), "edits");
  for (const [step, embedding] of steps) {
    if (step !== "open in a list") subject = retarget(subject, embed(spec, embedding));
    await expectState(context, subject, scenario, `markdown, ${step}`);
  }
  session.closeDocument(subject.document);
  if (spec.gaps === undefined) return;
  // Nix: a gap appears, grows to several lines, shrinks back, and goes.
  const nixSteps: [string, Embedding][] = [
    ["open a string", nixString],
    ["gap added", nixGapEmbedding],
    ["gap grows to several lines", nixMultilineGapEmbedding],
    ["undo to the one-line gap", nixGapEmbedding],
    ["undo to no gap", nixString],
  ];
  subject = openSubject(session, spec, embed(spec, nixString), "edits");
  for (const [step, embedding] of nixSteps) {
    if (step !== "open a string") subject = retarget(subject, embed(spec, embedding));
    await expectState(context, subject, scenario, `nix, ${step}`);
  }
  session.closeDocument(subject.document);
}

async function rapidEdits(context: Context, session: Session): Promise<void> {
  const { spec, report } = context;
  const scenario = "rapid successive edits";
  const cycle = [overIndentedFence, plainFence, list, blankEdges, indentedFence, quote];
  let subject = openSubject(session, spec, embed(spec, overIndentedFence), "rapid");
  await awaitHeld(session, spec, subject.embedded.code, context.options.patienceMs);
  const since = Date.now();
  // Whole-document replacements, faster than any answer can come back.
  for (let edit = 0; edit < 40; edit++) {
    subject = retarget(subject, embed(spec, cycle[edit % cycle.length] ?? plainFence));
    if (edit % 4 === 3) await sleep(15);
  }
  subject = retarget(subject, embed(spec, overIndentedFence));
  await expectState(context, subject, scenario, "after 41 replacements");
  // Every one of those texts holds the same code, so anything else that
  // reached a server was unprepared or mangled.
  report.check(
    nameOf(spec),
    scenario,
    "only prepared text was sent meanwhile",
    "[]",
    JSON.stringify(strayTexts(session, spec, since, [subject.embedded.code])),
  );

  // Typing: a comment line typed character by character above the code, then
  // deleted the same way. Each keystroke is an incremental change.
  if (spec.comment !== undefined) {
    const typed = `${spec.comment("typed")}`;
    const first = subject.embedded.toHost({ line: 0, character: 0 });
    if (first === undefined) throw new Error("the code's first line has no host position");
    const original = subject.document.text;
    const lines = original.split("\n");
    const typingSince = Date.now();
    const lineWith = (text: string): string =>
      [...lines.slice(0, first.line), text, ...lines.slice(first.line)].join("\n");
    // A new line holding only the prefix, then the comment after it.
    const prefix = (lines[first.line] ?? "").slice(0, first.character);
    session.changeRange(
      subject.document,
      { start: { line: first.line, character: 0 }, end: { line: first.line, character: 0 } },
      `${prefix}\n`,
      lineWith(prefix),
    );
    for (let index = 0; index < typed.length; index++) {
      const at: Position = { line: first.line, character: prefix.length + index };
      session.changeRange(
        subject.document,
        { start: at, end: at },
        typed[index] ?? "",
        lineWith(prefix + typed.slice(0, index + 1)),
      );
      if (index % 3 === 2) await sleep(10);
    }
    for (let index = typed.length; index > 0; index--) {
      session.changeRange(
        subject.document,
        {
          start: { line: first.line, character: prefix.length + index - 1 },
          end: { line: first.line, character: prefix.length + index },
        },
        "",
        lineWith(prefix + typed.slice(0, index - 1)),
      );
    }
    session.changeRange(
      subject.document,
      { start: { line: first.line, character: 0 }, end: { line: first.line + 1, character: 0 } },
      "",
      original,
    );
    await expectState(context, subject, scenario, "after typing and deleting a line");
    // While typing, the servers may hold the code with any prefix of the
    // comment above it -- but never the fence's own indentation.
    const unprepared = strayTexts(session, spec, typingSince, []).filter((text) =>
      text.split("\n").some((line) => line.startsWith(prefix) && line.trim() !== ""),
    );
    report.check(
      nameOf(spec),
      scenario,
      "typing never sent the fence's indentation downstream",
      "[]",
      JSON.stringify(unprepared),
    );
  }
  session.closeDocument(subject.document);
}

/** Asks hover now and says how the answer relates to the reference, and how long it took. */
async function hoverNow(
  context: Context,
  subject: Subject,
): Promise<{ verdict: string; ms: number }> {
  const expected = context.baseline.get("hover");
  const feature = features.hover;
  if (expected?.kind !== "value" || feature === undefined) return { verdict: "not asked", ms: 0 };
  const started = Date.now();
  let answer: Answer;
  try {
    answer = await feature(subject);
  } catch (error) {
    answer = { kind: "error", error: String(error instanceof Error ? error.message : error) };
  }
  const ms = Date.now() - started;
  const verdict =
    answer.kind === "value"
      ? sameAnswer(answer, expected)
        ? "the right answer"
        : `a wrong answer: ${describeAnswer(answer)}`
      : answer.kind === "error"
        ? `an error: ${answer.error}`
        : "no answer";
  return { verdict, ms };
}

const acceptable = (verdict: string): boolean =>
  verdict === "the right answer" || verdict === "no answer" || verdict.startsWith("an error");

/** These scenarios tell texts apart by a comment and judge by hover. */
function unfit(context: Context, scenario: string): boolean {
  const { spec, report, baseline } = context;
  if (spec.comment !== undefined && baseline.get("hover")?.kind === "value") return false;
  report.skip(nameOf(spec), scenario, "*", "needs a comment syntax and a hover to judge by");
  return true;
}

async function editWhilePreparing(context: Context, session: Session): Promise<void> {
  const { spec, report } = context;
  const scenario = "edit while a prepare is in flight";
  if (unfit(context, scenario)) return;
  let subject = openSubject(session, spec, embed(spec, overIndentedFence), "in-flight");
  await awaitHeld(session, spec, subject.embedded.code, context.options.patienceMs);
  const since = Date.now();
  session.setPeerControl({ delayMs: 1_500 });
  subject = appendComment(subject, "in flight 1");
  const first = subject.embedded;
  await sleep(200);
  // The first answer is still a second away when the text moves on.
  subject = appendComment(subject, "in flight 2");
  const second = subject.embedded;
  const during = await hoverNow(context, subject);
  report.check(
    nameOf(spec),
    scenario,
    "a request made meanwhile is answered rightly or not at all",
    "true",
    acceptable(during.verdict) ? "true" : during.verdict,
  );
  report.check(
    nameOf(spec),
    scenario,
    "a request made meanwhile does not hang",
    "true",
    during.ms < HANG_MS ? "true" : `${String(during.ms)} ms (${during.verdict})`,
  );
  session.setPeerControl({});
  await expectState(context, subject, scenario, "the last text wins");
  report.check(
    nameOf(spec),
    scenario,
    "only prepared text was sent",
    "[]",
    JSON.stringify(strayTexts(session, spec, since, [first.code, second.code])),
  );
  session.closeDocument(subject.document);
}

async function failingPeer(context: Context, session: Session): Promise<void> {
  const { spec, report, options } = context;
  if (unfit(context, "peer fails (every mode)")) return;
  const good = embed(spec, overIndentedFence);
  let subject = openSubject(session, spec, good, "failures");
  await awaitHeld(session, spec, good.code, options.patienceMs);
  let serial = 0;
  /** The next text: one more line typed at the end of the code. */
  const type = (): Embedded => {
    subject = appendComment(subject, `failure ${String(++serial)}`);
    return subject.embedded;
  };

  // An answer kakehashi cannot use: an error, text inserted into content, a
  // segment missing. The document must not be sent, in any form.
  for (const [mode, name] of [
    ["error", "peer answers with an error"],
    ["insert", "peer answers outside the contract (inserts text)"],
    ["count", "peer answers outside the contract (segment count)"],
  ] as const) {
    const since = Date.now();
    session.setPeerControl({ mode });
    type();
    const asked = await session.client.waitFor(
      () =>
        session
          .prepareRequests()
          .some((entry) => entry.at >= since && entry.params?.textDocument.languageId === spec.id)
          ? true
          : undefined,
      options.patienceMs,
    );
    report.check(nameOf(spec), name, "the peer was asked", "true", String(asked === true));
    await sleep(1_500);
    const during = await hoverNow(context, subject);
    report.check(
      nameOf(spec),
      name,
      "no text of the failed document reaches a server",
      "[]",
      JSON.stringify(strayTexts(session, spec, since, [])),
    );
    report.check(
      nameOf(spec),
      name,
      "a request on it gets no answer, without hanging",
      "no answer",
      during.ms < HANG_MS
        ? during.verdict.replace(/^an error: .*/, "no answer")
        : `${String(during.ms)} ms`,
    );
    // The next edit is a new input: prepared again, and sent.
    session.setPeerControl({});
    type();
    await expectState(context, subject, name, "the next edit recovers");
  }

  // A slow peer, inside kakehashi's five second limit.
  {
    const name = "peer answers after 2.5 s";
    const since = Date.now();
    session.setPeerControl({ delayMs: 2_500 });
    const slow = type();
    const during = await hoverNow(context, subject);
    report.check(
      nameOf(spec),
      name,
      "a request made while it waits is answered rightly or not at all, without hanging",
      "true",
      acceptable(during.verdict) && during.ms < HANG_MS
        ? "true"
        : `${during.verdict} after ${String(during.ms)} ms`,
    );
    await expectState(context, subject, name, "once answered");
    report.check(
      nameOf(spec),
      name,
      "only prepared text was sent",
      "[]",
      JSON.stringify(strayTexts(session, spec, since, [slow.code])),
    );
    session.setPeerControl({});
  }

  // A peer slower than the limit: no answer. kakehashi retries on its own.
  {
    const name = "peer answers after 7 s (past the limit)";
    const since = Date.now();
    session.setPeerControl({ delayMs: 7_000 });
    const slow = type();
    await sleep(5_500);
    report.check(
      nameOf(spec),
      name,
      "nothing is sent while there is no answer",
      "[]",
      JSON.stringify(strayTexts(session, spec, since, [])),
    );
    const during = await hoverNow(context, subject);
    report.check(
      nameOf(spec),
      name,
      "a request made meanwhile is answered rightly or not at all, without hanging",
      "true",
      acceptable(during.verdict) && during.ms < HANG_MS
        ? "true"
        : `${during.verdict} after ${String(during.ms)} ms`,
    );
    session.setPeerControl({});
    // No edit: the retry alone must bring the document.
    report.check(
      nameOf(spec),
      name,
      "the retry brings the prepared text without an edit",
      JSON.stringify([slow.code]),
      await awaitHeld(session, spec, slow.code, 30_000),
    );
    await expectState(context, subject, name, "after the retry");
  }

  // A peer that dies on the request and is started again.
  {
    const name = "peer restarted mid-session";
    const since = Date.now();
    const starts = session.peerLog().filter((entry) => entry.event === "start").length;
    session.setPeerControl({ mode: "crash" });
    const crashed = type();
    const died = await session.client.waitFor(
      () =>
        session.peerLog().some((entry) => entry.event === "crash" && entry.at >= since)
          ? true
          : undefined,
      options.patienceMs,
    );
    report.check(nameOf(spec), name, "the peer died on the request", "true", String(died === true));
    session.setPeerControl({});
    report.check(
      nameOf(spec),
      name,
      "the prepared text arrives once the peer is back, without an edit",
      JSON.stringify([crashed.code]),
      await awaitHeld(session, spec, crashed.code, 45_000),
    );
    report.check(
      nameOf(spec),
      name,
      "a new peer process was started",
      "true",
      String(session.peerLog().filter((entry) => entry.event === "start").length > starts),
    );
    report.check(
      nameOf(spec),
      name,
      "only prepared text was sent",
      "[]",
      JSON.stringify(strayTexts(session, spec, since, [crashed.code])),
    );
    await expectState(context, subject, name, "after the restart");
  }
  session.closeDocument(subject.document);
}

/**
 * After an edit that turns one region into another, the servers must hold one
 * virtual document for it, not the old one beside the new. Asked with and
 * without experimental features: a document left open is kakehashi's own.
 */
async function oneDocumentPerRegion(
  context: Context,
  session: Session,
  mode: string,
): Promise<void> {
  const { spec, report, options } = context;
  const scenario = "one virtual document per region after an edit";
  const sequences: [string, Embedding, Embedding][] = [
    ["markdown: an over-indented fence becomes a list item's", overIndentedFence, list],
    ...(spec.gaps === undefined
      ? []
      : ([["nix: an interpolation is added to a string", nixString, nixGapEmbedding]] as [
          string,
          Embedding,
          Embedding,
        ][])),
  ];
  for (const [name, before, after] of sequences) {
    const first = embed(spec, before);
    const subject = openSubject(session, spec, first, `one-document-${mode.replace(" ", "-")}`);
    await session.client.waitFor(
      () => (session.heldTexts(spec.id).length > 0 ? true : undefined),
      options.patienceMs,
    );
    retarget(subject, embed(spec, after));
    // Long enough for a close to follow the open it belongs to.
    await sleep(2_500);
    const held = session.heldTexts(spec.id);
    report.check(
      nameOf(spec),
      scenario,
      `${name} (${mode})`,
      "1",
      held.length === 1 ? "1" : `${String(held.length)}: ${JSON.stringify(held)}`,
    );
    session.closeDocument(subject.document);
    await sleep(300);
  }
  if (spec.comment === undefined) return;
  // The smallest form: one line inserted where the fence's content ends, the
  // way a line pasted above the closing fence arrives.
  const fenced = embed(spec, plainFence);
  const subject = openSubject(session, spec, fenced, `one-document-${mode.replace(" ", "-")}`);
  await session.client.waitFor(
    () => (session.heldTexts(spec.id).length > 0 ? true : undefined),
    options.patienceMs,
  );
  const closing = fenced.hostText.split("\n").indexOf("```", 3);
  const at = { line: closing, character: 0 };
  const inserted = `${spec.comment("pasted")}\n`;
  session.changeRange(
    subject.document,
    { start: at, end: at },
    inserted,
    applyEdits(subject.document.text, [{ range: { start: at, end: at }, newText: inserted }]),
  );
  await sleep(2_500);
  const held = session.heldTexts(spec.id);
  report.check(
    nameOf(spec),
    scenario,
    `markdown: a line inserted right above the closing fence (${mode})`,
    "1",
    held.length === 1 ? "1" : `${String(held.length)}: ${JSON.stringify(held)}`,
  );
  session.closeDocument(subject.document);
  await sleep(300);
}

async function severalRegions(context: Context, session: Session): Promise<void> {
  const { spec, report, options, baseline } = context;
  const scenario = "several regions of one language in one file";
  if (spec.oneScope === "documents") {
    report.skip(
      nameOf(spec),
      scenario,
      "*",
      "every open document of the language is one scope: the same code twice is an error of its own",
    );
    return;
  }
  // Three fences in one Markdown file: each is its own virtual document.
  const parts = [list, overIndentedFence, quote].map((embedding) => embed(spec, embedding));
  let hostText = "";
  const regions = parts.map((part) => {
    const lineOffset = hostText === "" ? 0 : hostText.split("\n").length - 1;
    hostText += part.hostText;
    const lineCount = part.hostText.split("\n").length - 1;
    const shifted: Embedded = {
      ...part,
      hostText: "",
      toHost: (position) => {
        const inPart = part.toHost(position);
        return inPart && { line: inPart.line + lineOffset, character: inPart.character };
      },
      toCode: (position) =>
        position.line < lineOffset || position.line >= lineOffset + lineCount
          ? undefined
          : part.toCode({ line: position.line - lineOffset, character: position.character }),
    };
    return shifted;
  });
  const document = session.open("regions.md", "markdown", hostText);
  const held = await session.client.waitFor(
    () =>
      session.heldTexts(spec.id).filter((text) => text === spec.code).length >= regions.length
        ? true
        : undefined,
    options.patienceMs,
  );
  report.check(
    nameOf(spec),
    scenario,
    "markdown: every region's prepared text",
    String(regions.length),
    held === true ? String(regions.length) : JSON.stringify(session.heldTexts(spec.id)),
  );
  for (const [index, embedded] of regions.entries()) {
    const subject: Subject = { session, document, embedded, spec, oneOfSeveral: true };
    for (const name of positional) {
      const expected = baseline.get(name);
      const feature = features[name];
      if (expected?.kind !== "value" || feature === undefined) continue;
      const observed = await settle(() => feature(subject), {
        timeoutMs: options.patienceMs,
        until: (answer) => sameAnswer(answer, expected),
      });
      report.check(
        nameOf(spec),
        scenario,
        `markdown region ${String(index + 1)} (${embedded.name}): ${name}`,
        describeAnswer(expected),
        describeAnswer(observed),
      );
    }
  }
  session.closeDocument(document);

  // Two Nix strings of one language are ONE document: the code between them
  // is a gap. Each string loses its own indentation.
  const eol = "\n";
  const body = (indent: string): string =>
    spec.code
      .split("\n")
      .slice(0, -1)
      .map((line) => (line === "" ? "" : indent + line))
      .join(eol);
  const nixHost = `{ cfg }:\n{\n  first = /* ${spec.id} */ ''\n${body("    ")}\n  '';\n  nested.second = /* ${spec.id} */ ''\n${body("        ")}\n      '';\n}\n`;
  const combined = `${spec.code}   \n\n${spec.code}`;
  const nixDocument = session.open("regions.nix", "nix", nixHost);
  report.check(
    nameOf(spec),
    scenario,
    "nix: two strings at different depths, each dedented on its own",
    JSON.stringify([combined]),
    await awaitHeld(session, spec, combined, options.patienceMs),
  );
  const expected = baseline.get("hover");
  if (expected?.kind === "value" && spec.hover !== undefined && spec.oneScope === undefined) {
    // The second string starts after the first's lines and the two between.
    const codeLines = spec.code.split("\n").length - 1;
    const secondStart = 3 + codeLines + 2;
    const second: Embedded = {
      ...(parts[0] as Embedded),
      toHost: (position) => ({
        line: position.line + secondStart,
        character: position.character + 8,
      }),
      toCode: (position) =>
        position.line >= secondStart && position.line < secondStart + codeLines
          ? { line: position.line - secondStart, character: position.character - 8 }
          : undefined,
    };
    const subject: Subject = {
      session,
      document: nixDocument,
      embedded: second,
      spec,
      oneOfSeveral: true,
    };
    const hover = features.hover;
    if (hover !== undefined) {
      // The second string's code sits lower in the combined document, and
      // some servers say so in the hover (`defined on line 3`).
      const read = (answer: Answer): string =>
        describeAnswer(answer).replace(/\bline \d+/g, "line N");
      const observed = await settle(() => hover(subject), {
        timeoutMs: options.patienceMs,
        until: (answer) => read(answer) === read(expected),
      });
      report.check(
        nameOf(spec),
        scenario,
        "nix: hover in the second string",
        read(expected),
        read(observed),
      );
    }
  }
  session.closeDocument(nixDocument);
}

/** Host documents whose injected region is empty or whitespace alone. */
function emptyRegions(
  spec: LanguageSpec,
): { name: string; languageId: string; text: string; at: Position }[] {
  const fence = (body: string): string => `# Title\n\n\`\`\`${spec.id}\n${body}\`\`\`\n`;
  const opener = `  s = /* ${spec.id} */ ${"''"}`;
  const string = (body: string): string => `{\n${opener}${body}${"''"};\n}\n`;
  const markdown = (name: string, body: string, at: Position) => ({
    name: `${name}.md`,
    languageId: "markdown",
    text: fence(body),
    at,
  });
  const nix = (name: string, body: string, at: Position) => ({
    name: `${name}.nix`,
    languageId: "nix",
    text: string(body),
    at,
  });
  return [
    markdown("md-empty-fence", "", { line: 2, character: 0 }),
    markdown("md-blank-line-fence", "\n", { line: 3, character: 0 }),
    markdown("md-whitespace-fence", "   \n\t\n", { line: 3, character: 3 }),
    // Four quotes in a row would read as an escape, so the emptiest string holds a space.
    nix("nix-space-string", " ", { line: 1, character: opener.length + 1 }),
    nix("nix-blank-string", "\n  ", { line: 2, character: 2 }),
    nix("nix-whitespace-string", "\n\n    \n  ", { line: 3, character: 4 }),
  ];
}

/** What one session says about a document, in host coordinates. */
async function reading(
  session: Session,
  spec: LanguageSpec,
  document: { name: string; languageId: string; text: string; at: Position },
  settleMs: number,
): Promise<{ sent: string; completion: string; hangs: string }> {
  const opened = session.open(document.name, document.languageId, document.text);
  await sleep(settleMs);
  const started = Date.now();
  const response = await session.client
    .respond(
      "textDocument/completion",
      { textDocument: { uri: opened.uri }, position: document.at, context: { triggerKind: 1 } },
      20_000,
    )
    .catch((error: unknown) => ({ error: { code: 0, message: String(error) } }));
  const ms = Date.now() - started;
  const result = (response as { result?: unknown }).result as
    | { items?: { label: string }[] }
    | { label: string }[]
    | null
    | undefined;
  const items = Array.isArray(result) ? result : (result?.items ?? []);
  const sent = JSON.stringify(session.heldTexts(spec.id));
  session.closeDocument(opened);
  await sleep(300);
  return {
    sent,
    // Whether anything is offered, not what: a server's list for an empty
    // file names the directory it is in, or is cut off wherever it likes.
    completion: items.length > 0 ? "items offered" : "nothing offered",
    hangs: ms < HANG_MS ? "no" : `${String(ms)} ms`,
  };
}

async function flagOffAndEmptyRegions(context: Context, prepared: Session): Promise<void> {
  const { spec, report } = context;
  // Three more sessions, all without a working prepare: the feature off with
  // the peer configured, the feature on with no peer named, and neither.
  const off = await start(context, "flag-off-peer-configured", false, "tsudoi");
  const unnamed = await start(context, "flag-on-no-peer", true, "none");
  const neither = await start(context, "flag-off-no-peer", false, "none");
  try {
    const documents = [overIndentedFence, nixString, list].map((embedding) =>
      embed(spec, embedding),
    );
    for (const embedded of documents) {
      const answers = new Map<Session, Map<string, string>>();
      for (const session of [off, unnamed, neither]) {
        const subject = openSubject(session, spec, embedded, `flag-${embedded.name}`);
        const own = new Map<string, string>();
        // Without a peer the servers get the text as kakehashi built it:
        // whatever that is, it must be the same in all three.
        await sleep(1_500);
        for (const name of positional) {
          const feature = features[name];
          if (feature === undefined) continue;
          own.set(name, describeAnswer(await settle(() => feature(subject), { timeoutMs: 5_000 })));
        }
        own.set("text sent downstream", JSON.stringify(session.heldTexts(spec.id)));
        answers.set(session, own);
        session.closeDocument(subject.document);
        await sleep(300);
      }
      const reference = answers.get(neither);
      for (const [label, session] of [
        ["flag off, peer configured", off],
        ["flag on, no peer named", unnamed],
      ] as const) {
        for (const [name, expected] of reference ?? []) {
          report.check(
            nameOf(spec),
            `${label} ≡ no peer at all`,
            `${embedded.name}: ${name}`,
            expected,
            answers.get(session)?.get(name) ?? "(not asked)",
          );
        }
      }
    }
    report.check(
      nameOf(spec),
      "flag off, peer configured ≡ no peer at all",
      "the peer is never asked to prepare",
      "0",
      String(off.prepareRequests().length),
    );

    // Empty and whitespace-only regions: with the peer, as without.
    for (const document of emptyRegions(spec)) {
      const withPeer = await reading(prepared, spec, document, 1_500);
      const without = await reading(neither, spec, document, 1_500);
      const scenario = "empty and whitespace-only regions";
      report.check(
        nameOf(spec),
        scenario,
        `${document.name}: text sent downstream`,
        without.sent,
        withPeer.sent,
      );
      report.check(
        nameOf(spec),
        scenario,
        `${document.name}: completion on the blank line`,
        without.completion,
        withPeer.completion,
      );
      report.check(nameOf(spec), scenario, `${document.name}: nothing hangs`, "no", withPeer.hangs);
    }
  } finally {
    await oneDocumentPerRegion(context, neither, "flag off").catch((error: unknown) => {
      report.add({
        group: nameOf(spec),
        scenario: "one virtual document per region after an edit",
        variant: "(flag off)",
        status: "deviation",
        expected: "the scenario to run",
        observed: String(error),
      });
    });
    await Promise.all([off.close(), unnamed.close(), neither.close()]);
  }
}

async function peerThatCannotStart(context: Context): Promise<void> {
  const { spec, report, options } = context;
  const name = "peer cannot start";
  const session = await start(context, "peer-missing", true, "missing");
  try {
    // The one failure that is not fail-closed, by the protocol's own rule: a
    // pair with no peer able to start has nothing to prepare its documents,
    // and they are sent as they are.
    const embedded = embed(spec, overIndentedFence);
    const subject = openSubject(session, spec, embedded, "peer-missing");
    const unprepared = embedded.hostText
      .split("\n")
      .slice(3, 3 + embedded.code.split("\n").length - 1)
      .join("\n");
    report.check(
      nameOf(spec),
      name,
      "the document is sent as it is (the protocol's rule for a peer that cannot start)",
      JSON.stringify([`${unprepared}\n`]),
      await awaitHeld(session, spec, `${unprepared}\n`, options.patienceMs + 10_000),
    );
    const during = await hoverNow(context, subject);
    report.check(
      nameOf(spec),
      name,
      "requests do not hang",
      "true",
      during.ms < HANG_MS ? "true" : `${String(during.ms)} ms`,
    );
    const log = existsSync(session.stderrLog) ? readFileSync(session.stderrLog, "utf8") : "";
    report.check(
      nameOf(spec),
      name,
      "kakehashi keeps running",
      "true",
      String(session.client.exited === null && log !== ""),
    );
  } finally {
    await session.close();
  }
}

/**
 * What a user gets who writes nothing at the prepare key: who is asked, what
 * the servers are sent, and how long the first document of a language waits.
 */
async function inheritedPriorities(context: Context): Promise<void> {
  const { spec, report, options, baseline } = context;
  const scenario = "no prepare entry (priorities inherited)";
  const group = nameOf(spec);
  const embedded = embed(spec, overIndentedFence);
  const unprepared = `${embedded.hostText
    .split("\n")
    .slice(3, 3 + embedded.code.split("\n").length - 1)
    .join("\n")}\n`;
  const setups = [
    // No aggregation entry at all: the default `["*"]` reaches the prepare key.
    { label: "no aggregation entry", entries: "none", experimental: true, expected: embedded.code },
    // The entry a user writes to keep the peer out of the other methods now
    // decides the prepare key too: the peer is not in it.
    {
      label: "only the `_` entry, naming the language's servers",
      entries: "default-only",
      experimental: true,
      expected: unprepared,
    },
    {
      label: "the prepare key names the peer",
      entries: "explicit",
      experimental: true,
      expected: embedded.code,
    },
    {
      label: "experimental features off",
      entries: "explicit",
      experimental: false,
      expected: unprepared,
    },
  ] as const;
  for (const setup of setups) {
    const session = await Session.start({
      kakehashi: options.kakehashi,
      experimental: setup.experimental,
      peer: "tsudoi",
      entries: setup.entries,
      servers: spec.servers,
      hosts: ["markdown", "nix"],
      files: spec.files,
      artifacts: options.artifacts,
      label: `${group}.inherit-${setup.entries}-${setup.experimental ? "on" : "off"}`,
    });
    try {
      const opened = Date.now();
      const subject = openSubject(session, spec, embedded, "first-document");
      report.check(
        group,
        scenario,
        `${setup.label}: text sent downstream`,
        JSON.stringify([setup.expected]),
        await awaitHeld(session, spec, setup.expected, options.patienceMs + 20_000),
      );
      const first = session.downstreamTexts(spec.id).find((sent) => sent.kind === "didOpen");
      report.measure(
        group,
        scenario,
        setup.label,
        `first text reached a server after ${first === undefined ? "?" : String(first.at - opened)} ms; prepare requests: ${String(session.prepareRequests().length)}`,
      );
      if (setup.expected === embedded.code) {
        // The peer is in every method's fan-out here: answers must not change.
        const expected = baseline.get("hover");
        const hover = features.hover;
        if (expected?.kind === "value" && hover !== undefined && setup.entries === "none") {
          const observed = await settle(() => hover(subject), {
            timeoutMs: options.patienceMs,
            until: (answer) => sameAnswer(answer, expected),
          });
          report.check(
            group,
            scenario,
            `${setup.label}: hover (the peer is in the fan-out)`,
            describeAnswer(expected),
            describeAnswer(observed),
          );
        }
      }
    } finally {
      await session.close();
    }
  }
}

export async function runLifecycle(
  spec: LanguageSpec,
  report: Report,
  options: RunOptions,
  only?: RegExp,
): Promise<void> {
  const baseline = await baselineFor(spec, options);
  const context: Context = { spec, report, options, baseline };
  const session = await start(context, "lifecycle", true, "tsudoi");
  const wanted = (name: string): boolean => only === undefined || only.test(name);
  try {
    if (wanted("edits")) await editsThatChangeTheAnswer(context, session);
    if (wanted("edits")) await oneDocumentPerRegion(context, session, "prepared");
    if (wanted("rapid")) await rapidEdits(context, session);
    if (wanted("in flight")) await editWhilePreparing(context, session);
    if (wanted("regions")) await severalRegions(context, session);
    if (wanted("flag off")) await flagOffAndEmptyRegions(context, session);
    // Last: a restarted peer leaves the session with a new peer process.
    if (wanted("failures")) await failingPeer(context, session);
  } finally {
    await session.close();
  }
  if (wanted("failures")) await peerThatCannotStart(context);
  if (wanted("inherit")) await inheritedPriorities(context);
}
