import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { loadEfmConfig } from "../src/load.ts";

const staged: string[] = [];

afterEach(() => {
  for (const root of staged.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A CONFIG AND A DOCUMENT ON DISK, because every tool this package runs is given
 * a PATH and half of them open it. A fixture that only pretended would pass for
 * an adapter that handed a linter its uri.
 */
function stage(yaml: string, text: string): { config: string; file: string; uri: string } {
  const root = mkdtempSync(join(tmpdir(), "efm-handlers-"));
  staged.push(root);
  const config = join(root, "config.yaml");
  writeFileSync(config, yaml);
  const file = join(root, "subject.txt");
  writeFileSync(file, text);
  return { config, file, uri: pathToFileURL(file).href };
}

/**
 * THE CONTEXT A HANDLER IS HANDED, BUILT BY HAND. tsudoi publishes the type, so
 * this is the shape a stranger's own tests take -- and building it here rather
 * than spawning a server is what keeps these arms about the ADAPTER. That the
 * handlers route at all is tsudoi's own claim, asserted in its suite.
 */
function contextFor(uri: string, text: string, languageId: string): RequestContext {
  const document = {
    uri,
    languageId,
    version: 1,
    lineCount: text.split("\n").length,
    getText: () => text,
    positionAt: (offset: number) => {
      const before = text.slice(0, offset).split("\n");
      return { line: before.length - 1, character: (before.at(-1) ?? "").length };
    },
    offsetAt: () => 0,
  };
  return {
    signal: new AbortController().signal,
    tsudoi: {
      documents: {
        get: (asked: string) => (asked === uri ? document : undefined),
        values: () => [],
      },
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      clientCapabilities: {},
      // PRESENT AND REFUSING, which is what a hand-built context owes a member
      // it does not exercise: no handler in this package notifies, and a stub
      // that RESOLVED would let one start silently.
      notify: () => Promise.reject(new Error("this context sends no notifications")),
    },
  };
}

describe("the handlers a config describes", () => {
  /**
   * A KEY IS PRESENT ONLY WHERE THE CONFIG DESCRIBES IT, AND THAT IS WHAT AN
   * EDITOR IS TOLD: tsudoi contributes a capability from handler PRESENCE, so a
   * formatting key here for a config with no `format-command` would advertise a
   * formatter that answers nothing. BOTH DIRECTIONS IN ONE ARM, because either
   * alone is satisfied by an adapter that always builds the same set.
   */
  test("only the methods the config describes get a handler", () => {
    const lintOnly = stage(`languages:\n  plaintext:\n    - lint-command: 'true'\n`, "x");
    const formatOnly = stage(`languages:\n  plaintext:\n    - format-command: 'cat'\n`, "x");

    expect(Object.keys(loadEfmConfig({ path: lintOnly.config }).methods ?? {})).toEqual([
      "textDocument/diagnostic",
    ]);
    expect(Object.keys(loadEfmConfig({ path: formatOnly.config }).methods ?? {})).toEqual([
      "textDocument/formatting",
    ]);
  });

  /** No config at all is not an error: a machine that never ran efm has no file. */
  test("a config that is not there yields no handlers and no error", () => {
    const loaded = loadEfmConfig({ path: undefined, ...{} });
    expect(loaded.methods).toBeDefined();
  });

  /**
   * THE FORMATTER'S OUTPUT REACHES THE BUFFER, over a chain of TWO tools -- which
   * is the shape efm users actually write (`black` then `isort`) and the one that
   * tells a chain from a single run: the second tool's effect is only visible if
   * it was fed the FIRST one's output.
   */
  test("a formatter chain runs in order, each tool fed the last one's output", async () => {
    const { config, uri } = stage(
      `languages:\n  plaintext:\n    - format-command: "tr 'a-z' 'A-Z'"\n      format-stdin: true\n    - format-command: "tr -d ' '"\n      format-stdin: true\n`,
      "hello world",
    );
    const methods = loadEfmConfig({ path: config }).methods ?? {};
    const handler = methods["textDocument/formatting"];
    if (handler === undefined) {
      throw new Error("the config declares a formatter");
    }

    const edits = await handler(contextFor(uri, "hello world", "plaintext"), {
      textDocument: { uri },
      options: { tabSize: 2, insertSpaces: true },
    });

    expect(edits?.[0]?.newText).toBe("HELLOWORLD");
  });

  /**
   * A FORMATTER THAT CHANGED NOTHING ANSWERS `null` AND NOT AN EMPTY EDIT: an
   * edit replacing a document with itself is a document version bump, an undo
   * entry and a diff for the user to read, all for no change.
   */
  test("a formatter that changed nothing answers null", async () => {
    const { config, uri } = stage(
      `languages:\n  plaintext:\n    - format-command: 'cat'\n      format-stdin: true\n`,
      "unchanged",
    );
    const handler = (loadEfmConfig({ path: config }).methods ?? {})["textDocument/formatting"];

    expect(
      await handler?.(contextFor(uri, "unchanged", "plaintext"), {
        textDocument: { uri },
        options: { tabSize: 2, insertSpaces: true },
      }),
    ).toBeNull();
  });

  /**
   * THE LINTER'S OWN OUTPUT BECOMES DIAGNOSTICS, positions and all. THE LINE AND
   * COLUMN ARE ASSERTED AS ZERO-BASED, which is the one translation this adapter
   * owes: a linter counts from one and LSP counts from zero, and an off-by-one
   * puts every diagnostic on the wrong line for every user.
   */
  test("a linter's output becomes diagnostics, one-based on the wire and zero-based in LSP", async () => {
    const { config, uri, file } = stage(
      `languages:\n  plaintext:\n    - lint-command: "printf '%s:4:7: bad thing\\n' \\"$0\\""\n      lint-formats:\n        - '%f:%l:%c: %m'\n      lint-source: 'probe'\n`,
      "a\nb\nc\nd",
    );
    const handler = (loadEfmConfig({ path: config }).methods ?? {})["textDocument/diagnostic"];

    const report = await handler?.(contextFor(uri, "a\nb\nc\nd", "plaintext"), {
      textDocument: { uri },
    });

    expect(report).toEqual({
      kind: "full",
      items: [
        {
          range: { start: { line: 3, character: 6 }, end: { line: 3, character: 6 } },
          severity: 1,
          source: "probe",
          message: "bad thing",
        },
      ],
    });
    expect(file).toContain("subject.txt");
  });

  /**
   * `lint-stdin` DEFAULTS TO **TRUE**, WHICH IS EFM'S SCHEMA AND NOT A GUESS --
   * and it differs from `format-stdin`, which documents no default at all. THE
   * ARM EXISTS BECAUSE THE OPPOSITE READING SHIPPED and was found only by driving
   * a real server: a linter reading stdin, whose config omits the key, was handed
   * NOTHING, exited clean, and the editor showed a file with no problems. A
   * LINTER THAT FOUND NOTHING AND A LINTER NEVER GIVEN THE DOCUMENT ARE THE SAME
   * PICTURE, which is why no other arm here could have noticed.
   *
   * THE COMMAND READS ONLY STDIN, deliberately: one that could fall back to the
   * path would pass under either reading.
   */
  test("a lint tool is fed the document by default, and only `false` withholds it", async () => {
    const yaml = (stdin: string) =>
      `languages:\n  plaintext:\n    - lint-command: "cat"\n${stdin}      lint-formats:\n        - '%m'\n`;
    const byDefault = stage(yaml(""), "only line");
    const withheld = stage(yaml("      lint-stdin: false\n"), "only line");

    const ask = async (config: string, uri: string) =>
      (await (loadEfmConfig({ path: config }).methods ?? {})["textDocument/diagnostic"]?.(
        contextFor(uri, "only line", "plaintext"),
        { textDocument: { uri } },
      )) as { items: readonly { message: string }[] };

    expect((await ask(byDefault.config, byDefault.uri)).items.map((one) => one.message)).toEqual([
      "only line",
    ]);
    // THE PAIR, AND IT IS WHAT MAKES THE DEFAULT A DEFAULT: an explicit `false`
    // withholds the document, so the same command reports nothing.
    expect((await ask(withheld.config, withheld.uri)).items).toEqual([]);
  });

  /**
   * A BROKEN `lint-formats` IS REFUSED WHEN THE CONFIG LOADS, which is where the
   * author is standing: `loadEfmConfig` runs inside their config factory, so
   * tsudoi reports it as a config failure and the server does not start.
   * Deferred to the first request it would be an editor opening onto a server
   * silently useless for one filetype.
   */
  test("a lint-format this reader cannot compile is refused at load", () => {
    const { config } = stage(
      `languages:\n  plaintext:\n    - lint-command: 'true'\n      lint-formats:\n        - '%+P%f'\n`,
      "x",
    );

    expect(() => loadEfmConfig({ path: config })).toThrow("multi-line");
  });

  /**
   * COMMANDS BECOME ACTIONS AND THE ADVERTISED LIST, WHICH IS ONE CLAIM AND NOT
   * TWO: tsudoi advertises `executeCommandProvider` with an EMPTY list from
   * handler presence alone, so an action naming a command that was never
   * advertised is dropped by a conforming client before it reaches the handler.
   * The initialize handler is what makes the code action reachable at all.
   */
  test("efm commands become code actions, and the initialize handler advertises them", async () => {
    const { config, uri } = stage(
      `commands:\n  - command: 'echo'\n    arguments: ['\${INPUT}']\n    title: 'Echo the file'\n`,
      "x",
    );
    const methods = loadEfmConfig({ path: config }).methods ?? {};

    const batches = methods["textDocument/codeAction"]?.(contextFor(uri, "x", "plaintext"), {
      textDocument: { uri },
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      context: { diagnostics: [] },
    });
    const offered = [];
    for await (const batch of batches ?? []) {
      offered.push(...batch);
    }

    expect(offered).toEqual([
      {
        title: "Echo the file",
        command: "efm.echo",
        arguments: [{ uri, path: expect.stringContaining("subject.txt") }],
      },
    ]);

    const advertised = await methods.initialize?.(
      {
        ...contextFor(uri, "x", "plaintext"),
        preparedResult: { capabilities: { executeCommandProvider: { commands: [] } } },
      },
      { processId: null, rootUri: null, capabilities: {} },
    );

    expect(advertised?.capabilities.executeCommandProvider?.commands).toEqual(["efm.echo"]);
  });

  /** And invoking it runs the command, with `${INPUT}` filled from the action. */
  test("executing an efm command runs it with the file the action carried", async () => {
    const { config, uri, file } = stage(
      `commands:\n  - command: 'echo'\n    arguments: ['\${INPUT}']\n`,
      "x",
    );
    const methods = loadEfmConfig({ path: config }).methods ?? {};

    const answered = (await methods["workspace/executeCommand"]?.(
      contextFor(uri, "x", "plaintext"),
      { command: "efm.echo", arguments: [{ uri, path: file }] },
    )) as { code: number; stdout: string };

    expect(answered.code).toBe(0);
    expect(answered.stdout.trim()).toBe(file);
  });

  /**
   * A COMMAND WHOSE `os` IS ANOTHER PLATFORM IS NOT OFFERED, and the platform is
   * injected rather than read, so the arm grades the filter on every machine
   * instead of only on one.
   */
  test("a command for another platform is not offered", async () => {
    const { config, uri } = stage(
      `commands:\n  - command: 'notepad'\n    os: 'win32'\n  - command: 'open'\n`,
      "x",
    );
    const methods = loadEfmConfig({ path: config, platform: "darwin" }).methods ?? {};

    const offered = [];
    for await (const batch of methods["textDocument/codeAction"]?.(
      contextFor(uri, "x", "plaintext"),
      {
        textDocument: { uri },
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        context: { diagnostics: [] },
      },
    ) ?? []) {
      offered.push(...batch);
    }

    expect(offered.map((action) => action.command)).toEqual(["efm.open"]);
  });

  /**
   * THE HOVER TYPE IS THE READER'S AND THE DEFAULT IS PLAINTEXT, which is efm's
   * own: a tool's output rendered as markdown when the author did not ask for it
   * silently eats their asterisks and underscores.
   */
  test("a hover tool's output is plaintext unless the config says markdown", async () => {
    const { config, uri } = stage(
      `languages:\n  plaintext:\n    - hover-command: "printf '%s' '*not emphasis*'"\n`,
      "x",
    );
    const handler = (loadEfmConfig({ path: config }).methods ?? {})["textDocument/hover"];

    expect(
      await handler?.(contextFor(uri, "x", "plaintext"), {
        textDocument: { uri },
        position: { line: 0, character: 0 },
      }),
    ).toEqual({ contents: { kind: "plaintext", value: "*not emphasis*" } });
  });
});
