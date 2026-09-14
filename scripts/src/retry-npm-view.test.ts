import { expect, test } from "bun:test";
import { runNpmViewWithRetries } from "./retry-npm-view.ts";

interface Result {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function exercise(results: readonly Result[], delays: readonly number[]) {
  let calls = 0;
  const waited: number[] = [];
  const run = () => results[Math.min(calls++, results.length - 1)] as Result;
  const result = runNpmViewWithRetries(run, {
    delays,
    sleep: (delay) => {
      waited.push(delay);
      return Promise.resolve();
    },
  });
  return { result, calls: () => calls, waited };
}

test("a transient E404 is retried until npm view succeeds", async () => {
  const attempt = exercise(
    [
      { status: 1, stdout: '{"error":{"code":"E404"}}', stderr: "" },
      { status: 0, stdout: "{}", stderr: "" },
    ],
    [0, 1],
  );

  expect(await attempt.result).toEqual({ status: 0, stdout: "{}", stderr: "" });
  expect(attempt.calls()).toBe(2);
  expect(attempt.waited).toEqual([0]);
});

test("a persistent E404 stops after the bounded retry schedule", async () => {
  const attempt = exercise([{ status: 1, stdout: "", stderr: "npm error code E404" }], [0, 0, 0]);

  expect(await attempt.result).toEqual({
    status: 1,
    stdout: "",
    stderr: "npm error code E404",
  });
  expect(attempt.calls()).toBe(4);
  expect(attempt.waited).toEqual([0, 0, 0]);
});

test("a non-E404 npm view failure is not retried", async () => {
  const attempt = exercise(
    [{ status: 1, stdout: '{"error":{"code":"E401"}}', stderr: "" }],
    [0, 0, 0],
  );

  expect(await attempt.result).toEqual({
    status: 1,
    stdout: '{"error":{"code":"E401"}}',
    stderr: "",
  });
  expect(attempt.calls()).toBe(1);
  expect(attempt.waited).toEqual([]);
});
