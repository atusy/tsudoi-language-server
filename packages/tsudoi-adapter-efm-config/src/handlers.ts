/**
 * THE efm CONFIG TURNED INTO tsudoi HANDLERS -- one per method, each built only
 * when the config actually describes it.
 *
 * BUILT ONLY WHEN DESCRIBED, WHICH IS THE HALF THAT DECIDES WHAT AN EDITOR IS
 * TOLD. tsudoi contributes a capability from HANDLER PRESENCE, so returning a
 * formatting handler for a config whose every tool declares only `lint-command`
 * would advertise a formatter that answers nothing. A `methods` object with the
 * key absent is what says "this config cannot format".
 */
import type {
  Command,
  Diagnostic,
  DiagnosticSeverity,
  DocumentDiagnosticReport,
  Hover,
  TextEdit,
} from "@atusy/tsudoi-language-server/deps/protocol";
import type { MethodHandler, TsudoiConfig } from "@atusy/tsudoi-language-server/types";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { EfmCommand, EfmConfig, EfmTool } from "./config.ts";
import { toolsFor } from "./config.ts";
import { compileFormats, violationsIn } from "./errorformat.ts";
import { interpolate, runCommand } from "./run.ts";

/**
 * A document's own path, or `undefined` for a uri that names no local file.
 *
 * UNDEFINED RATHER THAN THE URI, and the difference is a command line: efm's
 * `${INPUT}` is a PATH that a linter opens, so handing it `file:///a/b` produces
 * a tool that cannot find its input and an error the author reads as their
 * linter being broken. A document with no path is one this adapter cannot serve,
 * and saying so by absence is what lets the caller answer emptily.
 */
function pathOf(uri: string): string | undefined {
  if (!uri.startsWith("file:")) {
    return undefined;
  }
  try {
    return fileURLToPath(uri);
  } catch {
    return undefined;
  }
}

/** Whether a tool declares the key this method runs on. */
function declares(tool: EfmTool, key: keyof EfmTool): boolean {
  const value = tool[key];
  return typeof value === "string" && value !== "";
}

function anyDeclares(config: EfmConfig, key: keyof EfmTool): boolean {
  return Object.values(config.languages ?? {}).some((tools) =>
    tools.some((tool) => declares(tool, key)),
  );
}

/**
 * efm's severities are LSP's, ALREADY: `1` error through `4` hint, which is the
 * protocol's own numbering. So `lint-severity` passes through unread, and the
 * only translation is of `%t`.
 *
 * THE LETTERS ARE VIM'S QUICKFIX TYPES lowercased, and an UNRECOGNISED one falls
 * to the tool's own `lint-severity` rather than to a default written here: a
 * linter emitting `%t` values this does not know is exactly the case
 * `lint-severity` exists for.
 */
function severityOf(type: string | undefined, fallback: number | undefined): DiagnosticSeverity {
  const letter = type?.toLowerCase();
  if (letter === "e") {
    return 1;
  }
  if (letter === "w") {
    return 2;
  }
  if (letter === "i" || letter === "n") {
    return 3;
  }
  if (letter === "h") {
    return 4;
  }
  return (fallback ?? 1) as DiagnosticSeverity;
}

/**
 * Whether a command's `os` lets it run here.
 *
 * AN ABSENT `os` RUNS EVERYWHERE, and a present one is compared against
 * `process.platform` -- which is NOT the same vocabulary Go's `runtime.GOOS`
 * uses for every platform, though it agrees on the three that matter here.
 * WHERE IT DISAGREES THE COMMAND IS OFFERED RATHER THAN HIDDEN: an action the
 * user's editor shows and that fails loudly beats one that silently is not
 * there, since only the second leaves them with nothing to read.
 */
function runsHere(command: EfmCommand, platform: string): boolean {
  return command.os === undefined || command.os === "" || command.os === platform;
}

/** Every command the config offers, the language's own after the global ones. */
function commandsFor(config: EfmConfig, languageId: string): readonly EfmCommand[] {
  return [
    ...(config.commands ?? []),
    ...toolsFor(config, languageId).flatMap((tool) => [...(tool.commands ?? [])]),
  ];
}

/**
 * The name a code action invokes and `workspace/executeCommand` answers to.
 *
 * NAMESPACED, because command names share ONE namespace across every server a
 * client is talking to -- which tsudoi's own docs say it cannot help an author
 * with. A bare `notepad` from a reader's config would collide with anybody
 * else's.
 */
function commandId(command: EfmCommand): string {
  return `efm.${command.command ?? ""}`;
}

export interface EfmHandlerOptions {
  /** Where a tool runs. Defaults to the process's own directory. */
  readonly cwd?: string;
  /** Read once so a test can drive the other branch; defaults to this process's. */
  readonly platform?: string;
}

/**
 * Builds the `methods` object for one parsed config.
 *
 * EVERY HANDLER RUNS EVERY MATCHING TOOL, which is efm's own behaviour and the
 * reason the answers are CONCATENATED rather than raced: a reader who lists
 * `black` and `isort` for python means both, in order. A formatter chain is
 * therefore sequential and each tool sees the last one's output.
 */
export function handlersFor(
  config: EfmConfig,
  options: EfmHandlerOptions = {},
): TsudoiConfig["methods"] {
  const platform = options.platform ?? process.platform;
  const methods: NonNullable<TsudoiConfig["methods"]> = {};

  if (anyDeclares(config, "format-command")) {
    const formatting: MethodHandler<"textDocument/formatting"> = async (context, params) => {
      const document = context.tsudoi.documents.get(params.textDocument.uri);
      const path = pathOf(params.textDocument.uri);
      if (document === undefined || path === undefined) {
        return null;
      }
      const original = document.getText();
      let text = original;
      for (const tool of toolsFor(config, document.languageId)) {
        const command = tool["format-command"];
        if (command === undefined || command === "") {
          continue;
        }
        const result = await runCommand({
          command: interpolate(command, path, { ...params.options }),
          cwd: options.cwd,
          stdin: tool["format-stdin"] === true ? text : undefined,
          env: tool.env,
          signal: context.signal,
        });
        // A FORMATTER THAT FAILED IS NOT AN ANSWER, and its stdout is routinely a
        // partial document -- so the chain stops and what earlier tools produced
        // is kept, rather than the buffer being replaced with wreckage.
        if (result.code !== 0) {
          break;
        }
        if (tool["format-stdin"] === true) {
          text = result.stdout;
        }
      }
      if (text === original) {
        return null;
      }
      // ONE EDIT OVER THE WHOLE DOCUMENT, which is what a formatter that rewrites
      // its input can honestly produce: computing a minimal diff here would be
      // this adapter inventing edits no tool described.
      return [
        {
          range: {
            start: { line: 0, character: 0 },
            end: document.positionAt(original.length),
          },
          newText: text,
        } satisfies TextEdit,
      ];
    };
    methods["textDocument/formatting"] = formatting;
  }

  if (anyDeclares(config, "hover-command")) {
    const hover: MethodHandler<"textDocument/hover"> = async (context, params) => {
      const document = context.tsudoi.documents.get(params.textDocument.uri);
      const path = pathOf(params.textDocument.uri);
      if (document === undefined || path === undefined) {
        return null;
      }
      for (const tool of toolsFor(config, document.languageId)) {
        const command = tool["hover-command"];
        if (command === undefined || command === "") {
          continue;
        }
        const result = await runCommand({
          command: interpolate(command, path, {}),
          cwd: options.cwd,
          stdin: tool["hover-stdin"] === true ? document.getText() : undefined,
          env: tool.env,
          signal: context.signal,
        });
        const value = result.stdout.trim();
        if (result.code !== 0 || value === "") {
          continue;
        }
        return {
          contents: { kind: tool["hover-type"] === "markdown" ? "markdown" : "plaintext", value },
        } satisfies Hover;
      }
      return null;
    };
    methods["textDocument/hover"] = hover;
  }

  if (anyDeclares(config, "lint-command")) {
    // COMPILED HERE AND NOT PER REQUEST, which is what makes a format this reader
    // cannot read a refusal at `loadEfmConfig()` rather than a silent clean file
    // at the author's first keystroke.
    const compiled = new Map<EfmTool, ReturnType<typeof compileFormats>>();
    for (const tools of Object.values(config.languages ?? {})) {
      for (const tool of tools) {
        if (declares(tool, "lint-command")) {
          compiled.set(tool, compileFormats([...(tool["lint-formats"] ?? ["%f:%l:%c: %m"])]));
        }
      }
    }
    const diagnostic: MethodHandler<"textDocument/diagnostic"> = async (context, params) => {
      const document = context.tsudoi.documents.get(params.textDocument.uri);
      const path = pathOf(params.textDocument.uri);
      const items: Diagnostic[] = [];
      if (document === undefined || path === undefined) {
        return { kind: "full", items } satisfies DocumentDiagnosticReport;
      }
      for (const tool of toolsFor(config, document.languageId)) {
        const command = tool["lint-command"];
        if (command === undefined || command === "") {
          continue;
        }
        const result = await runCommand({
          command: interpolate(command, path, {}),
          cwd: options.cwd,
          // `lint-stdin` DEFAULTS TO **TRUE** IN EFM'S SCHEMA, unlike
          // `format-stdin`, which documents no default at all. Reading absence as
          // false here is the defect this line exists to name: MEASURED against a
          // real server, a tool whose `lint-command` reads stdin and whose config
          // omits the key was handed NOTHING, exited clean, and the editor showed
          // a file with no problems. A linter reporting nothing and a linter never
          // given the document are the same picture.
          stdin: tool["lint-stdin"] === false ? undefined : document.getText(),
          env: tool.env,
          signal: context.signal,
        });
        // `lint-ignore-exit-code` DEFAULTS TRUE IN EFM'S SCHEMA, so a linter that
        // exits non-zero BECAUSE it found something is the ordinary case and its
        // output is read. Only an explicit `false` makes the exit code decide.
        if (tool["lint-ignore-exit-code"] === false && result.code !== 0) {
          continue;
        }
        const offset = tool["lint-offset"] ?? 0;
        const columnOffset = tool["lint-offset-columns"] ?? 0;
        for (const violation of violationsIn(
          `${result.stdout}\n${result.stderr}`,
          compiled.get(tool) ?? [],
        )) {
          // ONE-BASED ON THE WIRE, ZERO-BASED IN LSP, and the clamp is not
          // decoration: a linter reporting line 0 for a whole-file problem would
          // otherwise land at -1 and be dropped by the client with no error.
          const line = Math.max(0, violation.line - 1 + offset);
          const character = Math.max(0, (violation.column ?? 1) - 1 + columnOffset);
          items.push({
            range: {
              start: { line, character },
              end: { line, character },
            },
            severity: severityOf(violation.type, tool["lint-severity"]),
            source: tool["lint-source"],
            message:
              tool.prefix === undefined
                ? violation.message
                : `[${tool.prefix}] ${violation.message}`,
          });
        }
      }
      return { kind: "full", items } satisfies DocumentDiagnosticReport;
    };
    methods["textDocument/diagnostic"] = diagnostic;
  }

  const hasCommands =
    (config.commands ?? []).length > 0 ||
    Object.values(config.languages ?? {}).some((tools) =>
      tools.some((tool) => (tool.commands ?? []).length > 0),
    );
  if (hasCommands) {
    const codeAction: MethodHandler<"textDocument/codeAction"> = async function* (context, params) {
      const document = context.tsudoi.documents.get(params.textDocument.uri);
      if (document === undefined) {
        return;
      }
      const path = pathOf(params.textDocument.uri);
      const offered = commandsFor(config, document.languageId)
        .filter((command) => runsHere(command, platform))
        .map(
          (command) =>
            ({
              title: command.title ?? command.command ?? "",
              command: commandId(command),
              arguments: [{ uri: params.textDocument.uri, path }],
            }) satisfies Command,
        );
      if (offered.length > 0) {
        // YIELDED AS `Command`s AND NEVER AS `CodeAction` LITERALS, which is not
        // a simplification: LSP permits only Commands to a client that did not
        // announce `codeActionLiteralSupport`, and efm's commands carry no edit
        // for a CodeAction to hold anyway.
        yield offered;
      }
    };
    methods["textDocument/codeAction"] = codeAction;

    const executeCommand: MethodHandler<"workspace/executeCommand"> = async (context, params) => {
      const every = [
        ...(config.commands ?? []),
        ...Object.values(config.languages ?? {}).flatMap((tools) =>
          tools.flatMap((tool) => [...(tool.commands ?? [])]),
        ),
      ];
      const wanted = every.find((command) => commandId(command) === params.command);
      if (wanted === undefined || wanted.command === undefined) {
        return null;
      }
      const first = params.arguments?.[0] as { path?: string } | undefined;
      const input = first?.path ?? "";
      const line = [wanted.command, ...(wanted.arguments ?? [])]
        .map((piece) => interpolate(piece, input, {}))
        .join(" ");
      const result = await runCommand({ command: line, cwd: options.cwd, signal: context.signal });
      return { code: result.code, stdout: result.stdout, stderr: result.stderr };
    };
    methods["workspace/executeCommand"] = executeCommand;

    /**
     * THE COMMAND NAMES, WHICH NOTHING ELSE CAN ADVERTISE. tsudoi claims
     * `executeCommandProvider` from handler presence and can only write an EMPTY
     * list, so without this handler a conforming client is told of no command and
     * sends none -- and every action offered above would be dropped before it
     * reached the handler beside it. THE SPREAD IS OF `capabilities` AND NOT ONLY
     * OF THE RESULT: the key lives inside it, and writing it beside the outer
     * spread compiles and does nothing.
     */
    const initialize: MethodHandler<"initialize"> = (context) => {
      const names = [
        ...(config.commands ?? []),
        ...Object.values(config.languages ?? {}).flatMap((tools) =>
          tools.flatMap((tool) => [...(tool.commands ?? [])]),
        ),
      ]
        .filter((command) => runsHere(command, platform))
        .map(commandId);
      return Promise.resolve({
        ...context.preparedResult,
        capabilities: {
          ...context.preparedResult.capabilities,
          executeCommandProvider: { commands: [...new Set(names)] },
        },
      });
    };
    methods.initialize = initialize;
  }

  return methods;
}

/** Named so a caller can say what a config turned out to describe. */
export type EfmMethods = ReturnType<typeof handlersFor>;
