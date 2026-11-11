// Every feature, for every way of embedding the same code, compared with the
// answer for that code in a plain fence that no peer prepared.
import {
  type Embedded,
  type Embedding,
  markdownEmbeddings,
  nixEmbeddings,
  nixGapEmbedding,
  nixMultilineGapEmbedding,
  overIndentedFence,
  plainFence,
} from "../lib/embed.ts";
import {
  type Answer,
  completion,
  describeAnswer,
  features,
  resolveAfterInsert,
  resolveHighlighted,
  sameAnswer,
  settle,
  type Subject,
  typedCode,
} from "../lib/features.ts";
import { Session } from "../lib/kakehashi.ts";
import { type LanguageSpec, nameOf } from "../lib/languages.ts";
import { sleep } from "../lib/lsp.ts";
import type { Report } from "../lib/report.ts";

export interface RunOptions {
  readonly kakehashi: string;
  readonly artifacts: string;
  /** Only embeddings whose name matches run. */
  readonly embeddings?: RegExp;
  /** Only features whose name matches run. */
  readonly features?: RegExp;
  /** Only modes (`prepared`, `flag off`) whose name matches run. */
  readonly modes?: RegExp;
  readonly patienceMs: number;
}

export const PREPARED_TEXT = "prepared text sent downstream";
export const SENT_TEXT = "text sent downstream";

export function embed(spec: LanguageSpec, embedding: Embedding, code = spec.code): Embedded {
  return embedding(code, { language: spec.id, gaps: spec.gaps ?? [] });
}

export function openSubject(
  session: Session,
  spec: LanguageSpec,
  embedded: Embedded,
  name = embedded.name,
): Subject {
  const document = session.open(
    `${name}.${embedded.extension}`,
    embedded.hostLanguage,
    embedded.hostText,
  );
  return { session, document, embedded, spec };
}

export async function closeSubject(subject: Subject): Promise<void> {
  subject.session.closeDocument(subject.document);
  // Let the close reach the servers before the next document opens: some
  // (gopls) read every open file of a directory as one package.
  await sleep(300);
}

export const completionName = (typed: string): string => `completion (${typed.trim()})`;
export const RESOLVE_HIGHLIGHTED = "completion resolve (auto-import), item highlighted";
export const RESOLVE_INSERTED =
  "completion resolve (auto-import), right after the item is inserted";
export const RESOLVE_INSERTED_LATER =
  "completion resolve (auto-import), a moment after the item is inserted";

const baselines = new Map<string, Promise<Map<string, Answer>>>();

/**
 * What each feature answers for the code in a plain fence with experimental
 * features off: the reference every other answer is compared with. Collected
 * once per language.
 */
export function baselineFor(
  spec: LanguageSpec,
  options: Pick<RunOptions, "kakehashi" | "artifacts">,
): Promise<Map<string, Answer>> {
  const cached = baselines.get(nameOf(spec));
  if (cached !== undefined) return cached;
  const collected = (async () => {
    const baseline = new Map<string, Answer>();
    const session = await Session.start({
      kakehashi: options.kakehashi,
      experimental: false,
      peer: "none",
      servers: spec.servers,
      hosts: ["markdown"],
      files: spec.files,
      artifacts: options.artifacts,
      label: `${nameOf(spec)}.baseline`,
    });
    try {
      const subject = openSubject(session, spec, embed(spec, plainFence), "baseline");
      for (const [name, feature] of Object.entries(features)) {
        baseline.set(
          name,
          // The first answer waits for the server to start and index.
          await settle(() => feature(subject), {
            timeoutMs: baseline.size === 0 ? 60_000 : 15_000,
          }),
        );
      }
      await closeSubject(subject);
      for (const probe of spec.completions ?? []) {
        const typed = typedCode(spec.code, probe);
        const typing = openSubject(
          session,
          spec,
          embed(spec, plainFence, typed.code),
          "baseline-typing",
        );
        baseline.set(
          completionName(probe.typed),
          await settle(() => completion(typing, typed.at, probe.expect), { timeoutMs: 20_000 }),
        );
        await closeSubject(typing);
      }
      if (spec.resolve !== undefined) {
        const typed = typedCode(spec.code, { ...spec.resolve, expect: spec.resolve.label });
        const typing = openSubject(
          session,
          spec,
          embed(spec, plainFence, typed.code),
          "baseline-resolve",
        );
        const { resolve } = spec;
        baseline.set(
          RESOLVE_HIGHLIGHTED,
          await settle(
            () => resolveHighlighted(typing, typed.at, resolve.typed, resolve.label, 5_000),
            { timeoutMs: 30_000 },
          ),
        );
        await closeSubject(typing);
      }
    } finally {
      await session.close();
    }
    return baseline;
  })();
  baselines.set(nameOf(spec), collected);
  return collected;
}

/** Waits for the servers to hold exactly `expected` for a document of the language. */
export async function awaitHeld(
  session: Session,
  spec: LanguageSpec,
  expected: string,
  patienceMs: number,
): Promise<string> {
  const held = await session.client.waitFor(
    () => (session.heldTexts(spec.id).includes(expected) ? true : undefined),
    patienceMs,
  );
  return JSON.stringify(held === true ? [expected] : session.heldTexts(spec.id));
}

function embeddingsFor(spec: LanguageSpec): Embedding[] {
  return [
    plainFence,
    ...markdownEmbeddings,
    overIndentedFence,
    ...nixEmbeddings,
    ...(spec.gaps === undefined ? [] : [nixGapEmbedding, nixMultilineGapEmbedding]),
  ];
}

/**
 * The embeddings kakehashi presents as the code itself without any peer (it
 * strips a list's or a quote's line prefix on its own). Run with experimental
 * features off, they tell a deviation the peer brings from one kakehashi has
 * either way.
 */
const withoutPeer: readonly Embedding[] = [plainFence, ...markdownEmbeddings].filter(
  (embedding) =>
    !["md-indented-fence", "md-blank-edges"].includes(embedding("", { language: "x" }).name),
);

/** The group a language's cases are reported under when nothing prepares them. */
export const flagOffGroup = (language: string): string => `${language} (flag off)`;

export async function runFeatures(
  spec: LanguageSpec,
  report: Report,
  options: RunOptions,
): Promise<void> {
  const baseline = await baselineFor(spec, options);
  const wanted = Object.entries(features).filter(([name]) => options.features?.test(name) ?? true);
  const probes = (spec.completions ?? []).filter(
    (probe) => options.features?.test(completionName(probe.typed)) ?? true,
  );

  for (const mode of ["prepared", "flag off"] as const) {
    if (options.modes !== undefined && !options.modes.test(mode)) continue;
    const group = mode === "prepared" ? nameOf(spec) : flagOffGroup(nameOf(spec));
    const session = await Session.start({
      kakehashi: options.kakehashi,
      experimental: mode === "prepared",
      peer: mode === "prepared" ? "tsudoi" : "none",
      servers: spec.servers,
      hosts: ["markdown", "nix"],
      files: spec.files,
      artifacts: options.artifacts,
      label: `${nameOf(spec)}.${mode.replace(" ", "-")}`,
    });
    let warm = false;
    const compare = async (
      name: string,
      variant: string,
      ask: () => Promise<Answer>,
    ): Promise<void> => {
      const expected = baseline.get(name) ?? { kind: "absent" };
      // A feature the language has no probe for is not a case at all.
      if (expected.kind === "absent") return;
      if (expected.kind !== "value") {
        // Said once per feature: the server gave nothing to compare with.
        if (variant === "md-fence") {
          report.skip(group, name, "*", `no baseline: ${describeAnswer(expected).slice(0, 200)}`);
        }
        return;
      }
      const observed = await settle(ask, {
        // Full patience while the servers start and index; once a document
        // has been through every feature, a late answer is a wrong one.
        timeoutMs: warm ? Math.min(options.patienceMs, 5_000) : options.patienceMs,
        until: (answer) => sameAnswer(answer, expected),
      });
      report.check(group, name, variant, describeAnswer(expected), describeAnswer(observed));
    };
    try {
      for (const embedding of mode === "prepared" ? embeddingsFor(spec) : withoutPeer) {
        const embedded = embed(spec, embedding);
        if (options.embeddings !== undefined && !options.embeddings.test(embedded.name)) continue;
        const subject = openSubject(session, spec, embedded);
        // First: did the servers get the code, prepared as expected?
        report.check(
          group,
          mode === "prepared" ? PREPARED_TEXT : SENT_TEXT,
          embedded.name,
          JSON.stringify([embedded.code]),
          await awaitHeld(session, spec, embedded.code, options.patienceMs),
        );
        for (const [name, feature] of wanted) {
          await compare(name, embedded.name, () => feature(subject));
        }
        await closeSubject(subject);
        for (const probe of probes) {
          const typed = typedCode(spec.code, probe);
          const typing = openSubject(
            session,
            spec,
            embed(spec, embedding, typed.code),
            `${embedded.name}-typing`,
          );
          await compare(completionName(probe.typed), embedded.name, () =>
            completion(typing, typed.at, probe.expect),
          );
          await closeSubject(typing);
        }
        warm = true;
        const { resolve } = spec;
        const reference = baseline.get(RESOLVE_HIGHLIGHTED);
        if (resolve === undefined || !(options.features?.test(RESOLVE_HIGHLIGHTED) ?? true)) {
          continue;
        }
        const typed = typedCode(spec.code, { ...resolve, expect: resolve.label });
        // Resolved as the item is highlighted: the import comes back with it.
        const highlighted = openSubject(
          session,
          spec,
          embed(spec, embedding, typed.code),
          `${embedded.name}-resolve`,
        );
        await compare(RESOLVE_HIGHLIGHTED, embedded.name, () =>
          resolveHighlighted(highlighted, typed.at, resolve.typed, resolve.label, 4_000),
        );
        await closeSubject(highlighted);
        // Resolved once the item's text is in the document: whatever comes
        // back, an edit must not land in the wrong place.
        const expectedCode = (reference?.kind === "value" ? reference.value : undefined) as
          | { code: string }
          | undefined;
        if (expectedCode === undefined) continue;
        // At once, as an editor that resolves on accepting does; then again
        // a moment later, when the servers hold the edited text.
        for (const [scenario, waitMs] of [
          [RESOLVE_INSERTED, 0],
          [RESOLVE_INSERTED_LATER, 1_500],
        ] as const) {
          const inserted = openSubject(
            session,
            spec,
            embed(spec, embedding, typed.code),
            `${embedded.name}-resolve-inserted`,
          );
          const outcome = await resolveAfterInsert(
            inserted,
            typed.at,
            resolve.typed,
            resolve.label,
            expectedCode.code,
            options.patienceMs,
            waitMs,
          );
          report.check(
            group,
            scenario,
            embedded.name,
            "no misplaced edit",
            outcome !== undefined &&
              (outcome.edits.startsWith("MISPLACED") || outcome.edits.startsWith("error"))
              ? outcome.edits
              : "no misplaced edit",
          );
          report.measure(
            group,
            scenario,
            embedded.name,
            outcome === undefined
              ? "the item was not listed"
              : `added edits: ${outcome.edits}; detail and documentation: ${outcome.detail}`,
          );
          await closeSubject(inserted);
        }
      }
    } finally {
      await session.close();
    }
  }
}
