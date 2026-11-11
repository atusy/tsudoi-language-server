// Does kakehashi accept what the package answers? Generated Nix strings and
// Markdown HTML blocks -- indentation of every kind, blank and whitespace-only
// lines, interpolations opening, inside and ending lines or spanning several,
// two strings combined into one document, LF, CRLF and lone CR -- are opened
// one by one. For each, the text the downstream server is sent must be the
// request's segments with the package's answer applied. A refused answer
// shows as a document that is never sent.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { lineStarts } from "../lib/embed.ts";
import { harnessRoot, type PeerEntry, Session } from "../lib/kakehashi.ts";
import type { Report } from "../lib/report.ts";

const GROUP = "contract";

/** A small seeded generator, so a failing document can be generated again. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const indents = ["", "  ", "    ", "    ", "      ", "\t", "\t\t", "  \t", "        "];
const lineKinds = [
  (indent: string) => `${indent}echo plain`,
  (indent: string) => `${indent}echo plain`,
  (indent: string) => `${indent}\${pkgs.hello}/bin/hello`,
  (indent: string) => `${indent}echo \${toString cfg.port} done`,
  (indent: string) => `${indent}echo \${toString cfg.port}`,
  (indent: string) => `${indent}echo \${\n      toString\n        cfg.port\n    } done`,
  (indent: string) => `${indent}\${\n      cfg.script\n    }`,
  (indent: string) => `${indent}\${a}\${b}`,
  () => "",
  () => "",
  (indent: string) => indent,
];

function nixString(next: () => number, eol: string): string {
  const pick = <T>(from: readonly T[]): T => from[Math.floor(next() * from.length)] as T;
  // Mostly one indentation per string, as real code has; sometimes any.
  const base = pick(indents);
  const count = Math.floor(next() * 7);
  const lines: string[] = [];
  for (let line = 0; line < count; line++) {
    const indent = next() < 0.7 ? base + (next() < 0.3 ? "  " : "") : pick(indents);
    lines.push(pick(lineKinds)(indent));
  }
  const opening = next() < 0.8 ? eol : next() < 0.5 ? "" : " ";
  const closing = next() < 0.7 ? "  " : next() < 0.5 ? "" : "\t";
  const ending = lines.length === 0 || next() < 0.85 ? eol : "";
  return `''${opening}${lines.join(eol)}${lines.length > 0 ? ending : ""}${closing}''`;
}

function nixDocument(seed: number): string {
  const next = random(seed);
  // Mostly LF; CRLF and a lone CR are where line counting goes wrong.
  const eol = next() < 0.7 ? "\n" : next() < 0.7 ? "\r\n" : "\r";
  const strings = next() < 0.6 ? 1 : next() < 0.7 ? 2 : 3;
  const bindings: string[] = [];
  for (let index = 0; index < strings; index++) {
    const value = next() < 0.85 ? nixString(next, eol) : '"echo one-line"';
    bindings.push(`  ${index % 2 === 0 ? "" : "nested."}s${String(index)} = /* bash */ ${value};`);
  }
  return `{ cfg, pkgs }:\n{\n${bindings.join("\n")}\n}\n`;
}

function markdownDocument(seed: number): string {
  const next = random(seed);
  const pick = <T>(from: readonly T[]): T => from[Math.floor(next() * from.length)] as T;
  const blocks = 1 + Math.floor(next() * 3);
  const parts: string[] = ["# Title", ""];
  for (let index = 0; index < blocks; index++) {
    const indent = pick(["", "", "  ", "   "]);
    parts.push(`${indent}<div class="b${String(index)}">`);
    for (let line = 0; line < Math.floor(next() * 3); line++) {
      parts.push(`${indent}${pick(["  ", "    ", ""])}<p>text</p>`);
    }
    parts.push(`${indent}</div>`, "", pick(["prose between", "- a list item", "> a quote"]), "");
  }
  return `${parts.join("\n")}\n`;
}

/** The text an answer leaves, as a pattern: a kept gap is whitespace kakehashi chose. */
function expectedPattern(entry: PeerEntry): RegExp {
  const segments = entry.params?.segments ?? [];
  const answer = (entry.result as { segments?: { changes?: unknown[]; content?: string }[] } | null)
    ?.segments;
  const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = segments.map((segment, index) => {
    const own = answer?.[index];
    if (segment.type === "gap") {
      return own?.content === undefined ? "[ \\t\\r\\n]*" : escape(own.content);
    }
    const starts = lineStarts(segment.content);
    const offset = (position: { line: number; character: number }): number =>
      (starts[position.line] ?? segment.content.length) + position.character;
    let text = segment.content;
    const changes = (own?.changes ?? []) as {
      range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
    }[];
    for (const change of [...changes].sort(
      (a, b) => offset(b.range.start) - offset(a.range.start),
    )) {
      text = text.slice(0, offset(change.range.start)) + text.slice(offset(change.range.end));
    }
    return escape(text);
  });
  return new RegExp(`^${parts.join("")}$`);
}

export interface ContractOptions {
  readonly kakehashi: string;
  readonly artifacts: string;
  readonly documents: number;
  readonly seed: number;
  readonly patienceMs: number;
}

export async function runContract(report: Report, options: ContractOptions): Promise<void> {
  const session = await Session.start({
    kakehashi: options.kakehashi,
    experimental: true,
    peer: "tsudoi",
    servers: [
      {
        name: "sink",
        command: [process.execPath, join(harnessRoot, "lib", "sink.ts")],
        languages: ["bash", "html"],
      },
    ],
    hosts: ["nix", "markdown"],
    artifacts: options.artifacts,
    label: "contract",
  });
  try {
    for (let index = 0; index < options.documents; index++) {
      const seed = options.seed + index;
      const markdown = index % 5 === 4;
      const text = markdown ? markdownDocument(seed) : nixDocument(seed);
      const name = `generated-${String(seed)}.${markdown ? "md" : "nix"}`;
      const variant = `${markdown ? "markdown html" : "nix string"} #${String(seed)}`;
      const document = session.open(name, markdown ? "markdown" : "nix", text);
      const language = markdown ? "html" : "bash";
      const asked = (): PeerEntry[] =>
        session
          .prepareRequests()
          .filter(
            (entry) =>
              entry.params?.hostTextDocument.uri === document.uri &&
              entry.params.textDocument.languageId === language,
          );
      const sent = (uri: string): string | undefined =>
        session
          .downstreamTexts()
          .filter((sentText) => sentText.uri === uri && sentText.kind !== "didClose")
          .at(-1)?.text;
      // Every document asked about must arrive downstream as answered.
      const settled = await session.client.waitFor(() => {
        const requests = asked();
        if (requests.length === 0) return undefined;
        return requests.every((entry) => {
          const text = sent(entry.params?.textDocument.uri ?? "");
          return text !== undefined && expectedPattern(entry).test(text);
        })
          ? true
          : undefined;
      }, options.patienceMs);
      const requests = asked();
      if (requests.length === 0) {
        // A document with nothing injected (an empty string) is not asked about.
        report.skip(GROUP, "the package's answer is accepted and applied", variant, "no region");
      } else if (settled === true) {
        report.pass(GROUP, "the package's answer is accepted and applied", variant);
      } else {
        const entry = requests.find((candidate) => {
          const text = sent(candidate.params?.textDocument.uri ?? "");
          return text === undefined || !expectedPattern(candidate).test(text);
        });
        const stderr = readFileSync(join(session.logs, "contract.kakehashi.stderr.log"), "utf8")
          .split("\n")
          .filter((line) => /prepare/i.test(line) && /refus|invalid|error|fail/i.test(line))
          .slice(-3)
          .join(" | ");
        report.add({
          group: GROUP,
          scenario: "the package's answer is accepted and applied",
          variant,
          status: "deviation",
          expected: `downstream text matching ${String(entry ? expectedPattern(entry) : "")}`,
          observed: `${JSON.stringify(sent(entry?.params?.textDocument.uri ?? ""))}; host ${JSON.stringify(text)}; request ${JSON.stringify(entry?.params?.segments)}; answer ${JSON.stringify(entry?.result)}; log: ${stderr}`,
        });
      }
      session.closeDocument(document);
    }
    // An interpolation with nothing injected before it on its line: is it a
    // gap the peer can fill, like one after some indentation?
    const scenario = "every interpolation is presented as a gap";
    const text = `{ pkgs }:\n{\n  s = /* bash */ ''\n\${pkgs.hello}/bin/hello\necho \${pkgs.hello}\n  '';\n}\n`;
    const document = session.open("gap-opening-a-line.nix", "nix", text);
    const request = await session.client.waitFor(
      () =>
        session
          .prepareRequests()
          .find(
            (entry) =>
              entry.params?.hostTextDocument.uri === document.uri &&
              entry.params.textDocument.languageId === "bash",
          ),
      options.patienceMs,
    );
    const gaps = (request?.params?.segments ?? []).filter((segment) => segment.type === "gap");
    report.check(
      GROUP,
      scenario,
      "one opening a host line, one after text",
      JSON.stringify(["${pkgs.hello}", "${pkgs.hello}"]),
      JSON.stringify(gaps.map((gap) => gap.content)),
    );
    session.closeDocument(document);
  } finally {
    await session.close();
  }
}
