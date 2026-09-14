import { expect, test } from "bun:test";
import { runWithRetries } from "./retry-npm-view.ts";
import { shouldRetryRegistryMetadata } from "./registry-metadata-retry.ts";

interface Result {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

const expectedVersion = "0.1.0-alpha.2";

test("one budget covers E404 and every propagation-shaped metadata state", async () => {
  const results: readonly Result[] = [
    { status: 1, stdout: '{"error":{"code":"E404"}}', stderr: "" },
    { status: 0, stdout: '{"dist-tags":{}}', stderr: "" },
    { status: 0, stdout: '{"dist-tags":{"alpha":"0.1.0-alpha.1"}}', stderr: "" },
    { status: 0, stdout: `{"dist-tags":{"alpha":"${expectedVersion}"}}`, stderr: "" },
    {
      status: 0,
      stdout: `{"dist-tags":{"alpha":"${expectedVersion}"},"dist.attestations":{}}`,
      stderr: "",
    },
  ];
  let calls = 0;

  const result = await runWithRetries(
    () => results[Math.min(calls++, results.length - 1)] as Result,
    (candidate) =>
      shouldRetryRegistryMetadata(candidate, { expectedVersion, requireProvenance: true }),
    { delays: [0, 0, 0, 0], sleep: () => Promise.resolve() },
  );

  expect(result).toBe(results.at(-1) as Result);
  expect(calls).toBe(5);
});

test("policy and authentication failures do not consume the retry budget", () => {
  for (const result of [
    { status: 1, stdout: '{"error":{"code":"E401"}}', stderr: "" },
    {
      status: 0,
      stdout: '{"dist-tags":{"alpha":"0.1.0-alpha.999"},"dist.attestations":{}}',
      stderr: "",
    },
    { status: 0, stdout: "not json", stderr: "" },
  ] satisfies readonly Result[]) {
    expect(
      shouldRetryRegistryMetadata(result, { expectedVersion, requireProvenance: true }),
    ).toBeFalse();
  }
});

test("provenance absence is complete metadata when provenance is not required", () => {
  expect(
    shouldRetryRegistryMetadata(
      {
        status: 0,
        stdout: `{"dist-tags":{"alpha":"${expectedVersion}"}}`,
        stderr: "",
      },
      { expectedVersion, requireProvenance: false },
    ),
  ).toBeFalse();
});
