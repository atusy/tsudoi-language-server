import { setTimeout as sleep } from "node:timers/promises";

export const NPM_VIEW_RETRY_DELAYS_MS = [
  0, 1_000, 2_000, 5_000, 10_000, 20_000, 30_000, 30_000,
] as const;

interface NpmViewResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

interface RetryOptions {
  readonly delays?: readonly number[];
  readonly sleep?: (delay: number) => Promise<unknown>;
  readonly onRetry?: (delay: number) => void;
}

export async function runNpmViewWithRetries<T extends NpmViewResult>(
  run: () => T,
  options: RetryOptions = {},
): Promise<T> {
  const delays = options.delays ?? NPM_VIEW_RETRY_DELAYS_MS;
  const wait = options.sleep ?? sleep;
  let result = run();
  for (const delay of delays) {
    let jsonErrorCode: unknown;
    try {
      const output = JSON.parse(result.stdout) as { readonly error?: { readonly code?: unknown } };
      jsonErrorCode = output.error?.code;
    } catch {
      // npm versions and log levels differ on whether errors are JSON on stdout or text on stderr.
    }
    if (
      result.status === 0 ||
      result.status === null ||
      (jsonErrorCode !== "E404" && !/\bE404\b/.test(result.stderr))
    ) {
      return result;
    }
    options.onRetry?.(delay);
    await wait(delay);
    result = run();
  }
  return result;
}
