import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import process from "node:process";
import type { NativeShell, ShellCompletionRuntime, UseShellCompletionOptions } from "./shell.ts";

const endOfCompletion = "\x01EOC\x01";

interface PendingRequest {
  readonly lines: string[];
  resolve(lines: readonly string[]): void;
  reject(error: unknown): void;
}

function abortError(): Error {
  const error = new Error("shell completion was cancelled");
  error.name = "AbortError";
  return error;
}

function capturePath(shell: NativeShell): string {
  return fileURLToPath(new URL(`../capture/capture.${shell}`, import.meta.url));
}

class NativeShellSession {
  readonly #shell: NativeShell;
  readonly #options: UseShellCompletionOptions;
  #child: ChildProcessWithoutNullStreams | undefined;
  #idleTimer: ReturnType<typeof setTimeout> | undefined;
  #pending: PendingRequest | undefined;
  #stderr = "";
  #stdoutBuffer = "";
  #stdoutDecoder = new StringDecoder("utf8");
  #tail = Promise.resolve();

  constructor(shell: NativeShell, options: UseShellCompletionOptions) {
    this.#shell = shell;
    this.#options = options;
  }

  complete(input: string, signal: AbortSignal): Promise<readonly string[]> {
    const answer = this.#tail.then(async () => await this.#request(input, signal));
    this.#tail = answer.then(
      () => undefined,
      () => undefined,
    );
    return answer;
  }

  async #request(input: string, signal: AbortSignal): Promise<readonly string[]> {
    if (signal.aborted) {
      throw abortError();
    }
    this.#clearIdleTimer();
    const child = this.#child ?? this.#spawn();
    return await new Promise<readonly string[]>((resolve, reject) => {
      const timeoutMs = this.#options.timeoutMs ?? 2_000;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        signal.removeEventListener("abort", onAbort);
        this.#pending = undefined;
      };
      const onAbort = (): void => {
        cleanup();
        this.#stop();
        reject(abortError());
      };
      this.#pending = {
        lines: [],
        resolve: (lines) => {
          cleanup();
          this.#scheduleIdleStop();
          resolve(lines);
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
      };
      signal.addEventListener("abort", onAbort, { once: true });
      timer = setTimeout(() => {
        cleanup();
        this.#stop();
        reject(new Error(`${this.#shell} completion timed out after ${String(timeoutMs)}ms`));
      }, timeoutMs);
      child.stdin.write(`input:${input}\n`, (error) => {
        if (error !== null && error !== undefined) {
          this.#failAndStop(child, error);
        }
      });
    });
  }

  #spawn(): ChildProcessWithoutNullStreams {
    this.#stderr = "";
    this.#stdoutBuffer = "";
    this.#stdoutDecoder = new StringDecoder("utf8");
    const child = spawn(this.#options.command ?? this.#shell, [capturePath(this.#shell)], {
      cwd: this.#options.cwd,
      env: { ...process.env, ...this.#options.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.#child = child;
    child.stdout.on("data", (chunk: Buffer) => {
      this.#stdoutBuffer += this.#stdoutDecoder.write(chunk);
      this.#drainLines();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      this.#stderr = `${this.#stderr}${chunk.toString()}`.slice(-8_192);
    });
    child.stdin.on("error", (error) => this.#failAndStop(child, error));
    child.on("error", (error) => this.#failAndStop(child, error));
    child.on("close", (code, signal) => {
      if (this.#child !== child) {
        return;
      }
      this.#child = undefined;
      const detail = this.#stderr.trim();
      this.#fail(
        new Error(
          `${this.#shell} completion process stopped (${signal ?? `exit ${String(code)}`})${
            detail === "" ? "" : `: ${detail}`
          }`,
        ),
      );
    });
    return child;
  }

  #drainLines(): void {
    let newline = this.#stdoutBuffer.indexOf("\n");
    while (newline !== -1) {
      let line = this.#stdoutBuffer.slice(0, newline);
      this.#stdoutBuffer = this.#stdoutBuffer.slice(newline + 1);
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }
      if (line === endOfCompletion) {
        const pending = this.#pending;
        if (pending !== undefined) {
          pending.resolve(pending.lines);
        }
      } else {
        this.#pending?.lines.push(line);
      }
      newline = this.#stdoutBuffer.indexOf("\n");
    }
  }

  #fail(error: unknown): void {
    const pending = this.#pending;
    this.#pending = undefined;
    pending?.reject(error);
  }

  #failAndStop(child: ChildProcessWithoutNullStreams, error: unknown): void {
    if (this.#child === child) {
      this.#stop();
    }
    this.#fail(error);
  }

  #scheduleIdleStop(): void {
    const idleTimeoutMs = this.#options.idleTimeoutMs ?? 30_000;
    this.#idleTimer = setTimeout(() => this.#stop(), idleTimeoutMs);
    if (typeof this.#idleTimer === "object") {
      this.#idleTimer.unref();
    }
  }

  #clearIdleTimer(): void {
    if (this.#idleTimer !== undefined) {
      clearTimeout(this.#idleTimer);
      this.#idleTimer = undefined;
    }
  }

  #stop(): void {
    this.#clearIdleTimer();
    const child = this.#child;
    this.#child = undefined;
    if (child !== undefined) {
      try {
        child.kill();
      } catch {
        // The process already stopped between the state check and kill.
      }
    }
  }
}

export class NativeShellRuntime implements ShellCompletionRuntime {
  readonly #session: NativeShellSession;

  constructor(shell: NativeShell, options: UseShellCompletionOptions) {
    this.#session = new NativeShellSession(shell, options);
  }

  complete(
    _shell: NativeShell,
    input: string,
    options: UseShellCompletionOptions & { readonly signal: AbortSignal },
  ): Promise<readonly string[]> {
    return this.#session.complete(input, options.signal);
  }
}
