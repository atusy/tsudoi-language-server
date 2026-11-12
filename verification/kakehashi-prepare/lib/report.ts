// What a run found: one case per (group, scenario, variant), each with what
// was expected and what was observed, and the class of every known deviation.
import { type Known, knownDeviations } from "../expectations.ts";

export type Status = "pass" | "deviation" | "skipped";

export interface Case {
  /** A language, or a group of scenarios about kakehashi itself. */
  readonly group: string;
  readonly scenario: string;
  readonly variant: string;
  readonly status: Status;
  readonly expected?: string;
  readonly observed?: string;
  readonly note?: string;
}

export interface Classified extends Case {
  readonly known?: Known;
}

const clip = (text: string | undefined, length = 600): string | undefined =>
  text === undefined || text.length <= length
    ? text
    : `${text.slice(0, length)}… (${String(text.length)} chars)`;

/** Something observed that is not right or wrong: who was asked, how long it took. */
export interface Measurement {
  readonly group: string;
  readonly scenario: string;
  readonly variant: string;
  readonly value: string;
}

export class Report {
  readonly cases: Classified[] = [];
  readonly measurements: Measurement[] = [];
  readonly #verbose: boolean;
  readonly #quiet: boolean;

  constructor(verbose: boolean, quiet = false) {
    this.#verbose = verbose;
    this.#quiet = quiet;
  }

  add(found: Case): void {
    const known =
      found.status === "deviation"
        ? knownDeviations.find(
            (candidate) =>
              candidate.group.test(found.group) &&
              candidate.scenario.test(found.scenario) &&
              candidate.variant.test(found.variant) &&
              (candidate.observed === undefined || candidate.observed.test(found.observed ?? "")),
          )
        : undefined;
    this.cases.push({ ...found, known });
    if (this.#quiet) return;
    const mark = found.status === "pass" ? "ok  " : found.status === "skipped" ? "skip" : "DEV ";
    if (found.status !== "pass" || this.#verbose) {
      const reason = known
        ? ` [${known.id}: ${known.class}]`
        : found.note
          ? ` (${found.note})`
          : "";
      console.log(`${mark} ${found.group} / ${found.scenario} / ${found.variant}${reason}`);
      if (found.status === "deviation" && known === undefined) {
        console.log(`       expected: ${clip(found.expected) ?? ""}`);
        console.log(`       observed: ${clip(found.observed) ?? ""}`);
      }
    }
  }

  measure(group: string, scenario: string, variant: string, value: string): void {
    this.measurements.push({ group, scenario, variant, value });
    if (this.#verbose) console.log(`note ${group} / ${scenario} / ${variant}: ${value}`);
  }

  pass(group: string, scenario: string, variant: string): void {
    this.add({ group, scenario, variant, status: "pass" });
  }

  skip(group: string, scenario: string, variant: string, note: string): void {
    this.add({ group, scenario, variant, status: "skipped", note });
  }

  /** Compares two readings, recording a pass or a deviation. */
  check(
    group: string,
    scenario: string,
    variant: string,
    expected: string,
    observed: string,
  ): boolean {
    const same = expected === observed;
    // A pass keeps what was compared too: the JSON report is where one checks
    // that a case passed on something, not on two empty answers.
    this.add({
      group,
      scenario,
      variant,
      status: same ? "pass" : "deviation",
      expected,
      ...(same ? {} : { observed }),
    });
    return same;
  }

  counts(of: readonly Classified[] = this.cases): Record<Status, number> {
    const counts: Record<Status, number> = { pass: 0, deviation: 0, skipped: 0 };
    for (const found of of) counts[found.status]++;
    return counts;
  }

  /** Known deviations that did not show up: fixed, or no longer reached. */
  unseen(): Known[] {
    return knownDeviations.filter(
      (known) => !this.cases.some((found) => found.known?.id === known.id),
    );
  }

  markdown(): string {
    const groups = [...new Set(this.cases.map((found) => found.group))];
    const scenarios = [...new Set(this.cases.map((found) => found.scenario))];
    const lines = [
      `| scenario | ${groups.join(" | ")} |`,
      `| --- | ${groups.map(() => "---").join(" | ")} |`,
    ];
    for (const scenario of scenarios) {
      const cells = groups.map((group) => {
        const own = this.cases.filter(
          (found) => found.group === group && found.scenario === scenario,
        );
        if (own.length === 0) return "";
        const counts = this.counts(own);
        return [
          counts.pass > 0 ? `${String(counts.pass)}✓` : "",
          counts.deviation > 0 ? `${String(counts.deviation)}✗` : "",
          counts.skipped > 0 ? `${String(counts.skipped)}–` : "",
        ]
          .filter((cell) => cell !== "")
          .join(" ");
      });
      lines.push(`| ${scenario} | ${cells.join(" | ")} |`);
    }
    const total = this.counts();
    lines.push(
      "",
      `Total: ${String(total.pass)} pass, ${String(total.deviation)} deviation, ${String(total.skipped)} skipped.`,
      "",
    );
    const deviations = this.cases.filter((found) => found.status === "deviation");
    const byId = new Map<string, Classified[]>();
    for (const found of deviations) {
      const id = found.known?.id ?? "UNCLASSIFIED";
      byId.set(id, [...(byId.get(id) ?? []), found]);
    }
    for (const [id, found] of byId) {
      const known = found[0]?.known;
      lines.push(
        `- **${id}** (${known?.class ?? "unclassified"}, ${String(found.length)} case(s)): ${known?.note ?? ""}`,
      );
      for (const one of found.slice(0, known ? 4 : 40)) {
        lines.push(`  - ${one.group} / ${one.scenario} / ${one.variant}`);
        if (!known) {
          lines.push(`    - expected: \`${clip(one.expected, 300) ?? ""}\``);
          lines.push(`    - observed: \`${clip(one.observed, 300) ?? ""}\``);
        }
      }
      if (known && found.length > 4) lines.push(`  - … and ${String(found.length - 4)} more`);
    }
    if (this.measurements.length > 0) {
      lines.push(
        "",
        "Measurements:",
        "",
        "| group | scenario | variant | observed |",
        "| --- | --- | --- | --- |",
      );
      for (const one of this.measurements) {
        lines.push(`| ${one.group} | ${one.scenario} | ${one.variant} | ${one.value} |`);
      }
    }
    const unseen = this.unseen();
    if (unseen.length > 0) {
      lines.push("", "Known deviations not observed in this run:");
      for (const known of unseen) lines.push(`- ${known.id} (${known.class}): ${known.note}`);
    }
    return `${lines.join("\n")}\n`;
  }
}
