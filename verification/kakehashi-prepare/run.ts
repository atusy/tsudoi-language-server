// Verifies kakehashi's experimental `kakehashi/virtualDocument/prepare` end to
// end: the real kakehashi binary, tsudoi with this repository's package as the
// prepare peer, and real language servers downstream.
//
//   KAKEHASHI_BIN=/path/to/kakehashi bun verification/kakehashi-prepare/run.ts
//
// See VERIFICATION.md beside this file for the options and what is skipped when.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { harnessRoot } from "./lib/kakehashi.ts";
import { languages, missingRequirements, nameOf } from "./lib/languages.ts";
import { type Case, type Measurement, Report } from "./lib/report.ts";
import { runContract } from "./scenarios/contract.ts";
import { type RunOptions, runFeatures } from "./scenarios/features.ts";
import { runLifecycle } from "./scenarios/lifecycle.ts";

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const flag = (name: string): boolean => process.argv.includes(`--${name}`);
const pattern = (name: string): RegExp | undefined => {
  const source = option(name);
  return source === undefined ? undefined : new RegExp(source);
};

// Re-reads a finished run under the current expectations.ts: no kakehashi needed.
const stored = option("render");
if (stored !== undefined) {
  const run = JSON.parse(readFileSync(stored, "utf8")) as {
    subject: string;
    cases: Case[];
    measurements: Measurement[];
  };
  const rendered = new Report(false, true);
  for (const found of run.cases) rendered.add(found);
  for (const one of run.measurements) {
    rendered.measure(one.group, one.scenario, one.variant, one.value);
  }
  console.log(`${run.subject}\n\n${rendered.markdown()}`);
  process.exit(0);
}

const kakehashi = option("kakehashi") ?? process.env.KAKEHASHI_BIN;
if (kakehashi === undefined || kakehashi === "" || !existsSync(kakehashi)) {
  console.log(
    "skipped: no kakehashi binary. Set KAKEHASHI_BIN (or pass --kakehashi=<path>) to a kakehashi built with the prepare protocol.",
  );
  process.exit(0);
}

const artifacts = resolve(option("out") ?? join(harnessRoot, "__ignored", "last-run"));
mkdirSync(artifacts, { recursive: true });
const only = pattern("languages");
const groups = pattern("groups");
const report = new Report(flag("verbose"));
const patienceMs = Number(option("patience") ?? 12_000);

const wants = (kind: string): boolean => groups === undefined || groups.test(kind);

/** Runs one kind of scenario; a crash of the harness itself is a case too. */
async function guarded(kind: string, group: string, run: () => Promise<void>): Promise<void> {
  if (!wants(kind)) return;
  console.log(`# ${group}: ${kind}`);
  try {
    await run();
  } catch (error) {
    report.add({
      group,
      scenario: `(harness: ${kind})`,
      variant: "*",
      status: "deviation",
      expected: "the scenarios to run",
      observed: String(error instanceof Error ? (error.stack ?? error.message) : error),
    });
  }
}

const runOptions: RunOptions = {
  kakehashi: resolve(kakehashi),
  artifacts,
  embeddings: pattern("embeddings"),
  features: pattern("features"),
  modes: pattern("modes"),
  patienceMs,
};

// Languages run side by side: each has its own kakehashi, servers and peer.
const queue = languages.filter((spec) => only === undefined || only.test(nameOf(spec)));
const jobs = Math.max(1, Number(option("jobs") ?? 3));
await Promise.all(
  Array.from({ length: jobs }, async () => {
    for (let spec = queue.shift(); spec !== undefined; spec = queue.shift()) {
      if (!wants("features") && !wants("lifecycle")) continue;
      const missing = missingRequirements(spec);
      if (missing.length > 0) {
        report.skip(nameOf(spec), "(every scenario)", "*", `not installed: ${missing.join(", ")}`);
        continue;
      }
      const current = spec;
      await guarded("features", nameOf(current), () => runFeatures(current, report, runOptions));
      await guarded("lifecycle", nameOf(current), () =>
        runLifecycle(current, report, runOptions, pattern("scenarios")),
      );
    }
  }),
);

await guarded("contract", "contract", () =>
  runContract(report, {
    kakehashi: resolve(kakehashi),
    artifacts,
    documents: Number(option("documents") ?? 60),
    seed: Number(option("seed") ?? 1),
    patienceMs,
  }),
);

// What the results are about: the binary cannot name its own commit.
const version = spawnSync(kakehashi, ["--version"], { encoding: "utf8" }).stdout.trim();
const commit = option("commit") ?? process.env.KAKEHASHI_COMMIT;
const subject = `Subject: ${version}${commit === undefined ? "" : ` at ${commit}`}`;
const markdown = `${subject}\n\n${report.markdown()}`;
writeFileSync(join(artifacts, "report.md"), markdown);
writeFileSync(
  join(artifacts, "report.json"),
  JSON.stringify({ subject, cases: report.cases, measurements: report.measurements }, null, 2),
);
console.log(`\n${markdown}`);
console.log(`Logs and the full report: ${artifacts}`);
const unclassified = report.cases.filter(
  (found) => found.status === "deviation" && found.known === undefined,
);
process.exit(unclassified.length > 0 ? 1 : 0);
