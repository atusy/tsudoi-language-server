// The languages the verification covers: for each, the real server(s) that
// answer for it, one piece of code, and where in that code each feature is
// asked. A language whose server is not installed is skipped, by name.
import { spawnSync } from "node:child_process";
import process from "node:process";
import type { GapSpec, Position } from "./embed.ts";
import { labelGap } from "../peer/placeholders.ts";
import type { DownstreamServer } from "./kakehashi.ts";

/** A place in the code: the `occurrence`th `text`, `offset` characters in. */
export interface Marker {
  readonly text: string;
  readonly occurrence?: number;
  readonly offset?: number;
}

export function locate(code: string, marker: Marker): Position {
  let at = -1;
  for (let seen = 0; seen < (marker.occurrence ?? 1); seen++) {
    at = code.indexOf(marker.text, at + 1);
    if (at < 0) throw new Error(`marker ${JSON.stringify(marker)} is not in the code`);
  }
  const offset = at + (marker.offset ?? 0);
  const before = code.slice(0, offset).split("\n");
  return { line: before.length - 1, character: before.at(-1)?.length ?? 0 };
}

export interface CompletionProbe {
  /** A line typed below the line that holds `below`. */
  readonly below: string;
  readonly typed: string;
  /** A label the answer must hold, so an empty list never passes as equal. */
  readonly expect: string;
}

/** A completion whose import the server adds only when the item is resolved. */
export interface ResolveProbe {
  /** A line typed below the line that holds `below`. */
  readonly below: string;
  readonly typed: string;
  /** The label of the item to resolve. */
  readonly label: string;
}

export interface LanguageSpec {
  /** The injection language: the Markdown info string, the Nix comment. */
  readonly id: string;
  /** What the language's cases are reported under; `id` unless two specs share one. */
  readonly name?: string;
  readonly servers: readonly DownstreamServer[];
  /** Commands that must be on PATH; the language is skipped without them. */
  readonly requires: readonly string[];
  readonly files?: Readonly<Record<string, string>>;
  readonly code: string;
  /** A line of a diagnostic the server must report, so "no diagnostics" never passes. */
  readonly diagnostic?: Marker;
  readonly hover?: Marker;
  /** Hover on a line whose text before the caret is outside ASCII. */
  readonly hoverAfterNonAscii?: Marker;
  readonly definition?: Marker;
  readonly references?: Marker;
  readonly highlight?: Marker;
  readonly signature?: Marker;
  readonly completions?: readonly CompletionProbe[];
  /**
   * Where the same code twice is an error of its own: across `documents`
   * (every open file of a Go package is one scope) or within one `document`
   * (two definitions of a C function). Scenarios that hold it so are skipped.
   */
  readonly oneScope?: "documents" | "document";
  /** An auto-import the server defers to `completionItem/resolve`. */
  readonly resolve?: ResolveProbe;
  readonly rename?: { readonly at: Marker; readonly newName: string };
  readonly formatting?: boolean;
  /** Lines `[from, to)` of the code a range formatting is asked for. */
  readonly rangeFormatting?: readonly [number, number];
  readonly codeAction?: {
    readonly at: Marker;
    readonly only?: readonly string[];
    readonly title: RegExp;
  };
  readonly inlayHints?: boolean;
  readonly documentSymbols?: boolean;
  /** Expressions the Nix gap embeddings write as interpolations. */
  readonly gaps?: readonly GapSpec[];
  /**
   * A line comment, for telling one edit's text from another's without
   * changing what the code means. Languages without one skip those scenarios.
   */
  readonly comment?: (text: string) => string;
}

export function missingRequirements(spec: LanguageSpec): string[] {
  return spec.requires.filter((command) => {
    const probe = spawnSync(process.platform === "win32" ? "where" : "which", [command], {
      stdio: "ignore",
    });
    return probe.status !== 0;
  });
}

const python: LanguageSpec = {
  id: "python",
  comment: (text) => `# ${text}`,
  requires: ["basedpyright-langserver", "ruff"],
  servers: [
    {
      name: "basedpyright",
      command: ["basedpyright-langserver", "--stdio"],
      languages: ["python"],
    },
    {
      name: "ruff",
      command: ["ruff", "server"],
      languages: ["python"],
      only: ["textDocument/formatting", "textDocument/rangeFormatting", "textDocument/codeAction"],
    },
  ],
  code: `import sys
import os


def greet(name: str, times: int = 1) -> str:
    """Return a greeting."""
    return ("hello " + name) * times


retries = None
message = greet( "world", 2 )
label = "héllo 日本語 𝒳"; shout = greet(label)
count: int = "three"
print(message, shout, os.sep, sys.argv, retries)
`,
  diagnostic: { text: '"three"' },
  hover: { text: "greet(", occurrence: 2, offset: 1 },
  hoverAfterNonAscii: { text: "greet(label", offset: 1 },
  definition: { text: "greet(", occurrence: 2, offset: 1 },
  references: { text: "message", offset: 1 },
  highlight: { text: "message", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  completions: [{ below: "count: int", typed: "os.pa", expect: "path" }],
  rename: { at: { text: "greet(", occurrence: 2, offset: 1 }, newName: "salute" },
  formatting: true,
  rangeFormatting: [10, 12],
  codeAction: {
    at: { text: "import sys" },
    only: ["source.organizeImports"],
    title: /organize imports/i,
  },
  inlayHints: true,
  documentSymbols: true,
  gaps: [
    { after: "retries = ", code: "None", host: "${toString cfg.retries}" },
    { after: "label = ", ...labelGap },
  ],
};

const lua: LanguageSpec = {
  id: "lua",
  comment: (text) => `-- ${text}`,
  requires: ["lua-language-server"],
  servers: [{ name: "lua_ls", command: ["lua-language-server"], languages: ["lua"] }],
  code: `local M = {}

---Return a greeting.
---@param name string
---@param times? integer
---@return string
function M.greet(name, times)
  return string.rep("hello " .. name, times or 1)
end

local retries = nil
local message = M.greet( "world", 2 )
local label = "héllo 日本語 𝒳" .. M.greet("x")
local count = message .. undefinedGlobal
print(message, label, count, retries)
return M
`,
  diagnostic: { text: "undefinedGlobal" },
  hover: { text: "M.greet(", occurrence: 2, offset: 3 },
  hoverAfterNonAscii: { text: 'M.greet("x")', offset: 3 },
  definition: { text: "M.greet(", occurrence: 2, offset: 3 },
  references: { text: "message", offset: 1 },
  highlight: { text: "message", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  completions: [
    { below: "local count", typed: "string.re", expect: "rep" },
    // Keyword snippets: `for .. in pairs` and friends break lines.
    { below: "local count", typed: "fo", expect: "for" },
  ],
  rename: { at: { text: "message", offset: 1 }, newName: "greeting" },
  formatting: true,
  rangeFormatting: [10, 12],
  codeAction: { at: { text: "undefinedGlobal", offset: 1 }, title: /disable.*line/i },
  documentSymbols: true,
  gaps: [
    { after: "local retries = ", code: "nil", host: "${toString cfg.retries}" },
    { after: "local label = ", ...labelGap },
  ],
};

const bash: LanguageSpec = {
  id: "bash",
  comment: (text) => `# ${text}`,
  requires: ["bash-language-server", "shellcheck", "shfmt"],
  servers: [{ name: "bashls", command: ["bash-language-server", "start"], languages: ["bash"] }],
  code: `#!/bin/sh
# Print a greeting.
greet() {
  echo "hello $1"
}

retries=0
message=$(greet   "world")
label="héllo 日本語 𝒳"; greet "$label"
echo $message "$retries"
`,
  diagnostic: { text: "echo $message" },
  hover: { text: 'greet   "world"', offset: 1 },
  hoverAfterNonAscii: { text: 'greet "$label"', offset: 1 },
  definition: { text: 'greet   "world"', offset: 1 },
  references: { text: 'greet   "world"', offset: 1 },
  highlight: { text: 'greet   "world"', offset: 1 },
  completions: [
    { below: "retries=0", typed: "gre", expect: "greet" },
    // bash-language-server's snippets (`if`, `for`, ...) break lines.
    { below: "retries=0", typed: "if", expect: "if" },
  ],
  rename: { at: { text: 'greet   "world"', offset: 1 }, newName: "salute" },
  formatting: true,
  codeAction: { at: { text: "$message", occurrence: 1, offset: 1 }, title: /SC2086/ },
  documentSymbols: true,
  gaps: [
    { after: "retries=", code: "0", host: "${toString cfg.retries}" },
    { after: "label=", ...labelGap },
  ],
};

const c: LanguageSpec = {
  id: "c",
  oneScope: "document",
  comment: (text) => `// ${text}`,
  requires: ["clangd"],
  servers: [{ name: "clangd", command: ["clangd"], languages: ["c"] }],
  code: `#include <stdio.h>

/* Print a greeting, return its length. */
static int greet(const char *name, int times) {
  return printf("hello %s\\n", name) * times;
}

int main(void) {
  int retries = 0;
  int count = greet( "world", 2 );
  const char *label = "héllo 日本語 𝒳"; count += greet(label, 1);
  int unused = "three";
  return count + retries + unused;
}
`,
  diagnostic: { text: '"three"' },
  hover: { text: "greet( ", offset: 1 },
  hoverAfterNonAscii: { text: "greet(label", offset: 1 },
  definition: { text: "greet( ", offset: 1 },
  references: { text: "count", offset: 1 },
  highlight: { text: "count", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  // clangd answers a call with a snippet: `greet(${1:const char *name}, ${2:int times})`.
  completions: [{ below: "int retries", typed: "  gre", expect: "greet" }],
  rename: { at: { text: "greet( ", offset: 1 }, newName: "salute" },
  formatting: true,
  rangeFormatting: [9, 11],
  inlayHints: true,
  documentSymbols: true,
  gaps: [
    { after: "int retries = ", code: "0", host: "${toString cfg.retries}" },
    { after: "const char *label = ", ...labelGap },
  ],
};

const go: LanguageSpec = {
  id: "go",
  oneScope: "documents",
  comment: (text) => `// ${text}`,
  requires: ["gopls", "go"],
  servers: [{ name: "gopls", command: ["gopls"], languages: ["go"] }],
  files: { "go.mod": "module example.com/verify\n\ngo 1.21\n" },
  // Tab-indented, as gofmt writes it: tabs inside whatever the host indents with.
  code: `package main

import (
	"fmt"
	"os"
)

// greet returns a greeting.
func greet(name string, times int) string {
	return fmt.Sprint("hello ", name, times)
}

func main() {
	retries := 0
	message := greet( "world", 2 )
	label := "héllo 日本語 𝒳"; fmt.Println(greet(label, 1))
	var count int = "three"
	fmt.Println(message, count, retries, os.Args)
}
`,
  diagnostic: { text: '"three"' },
  hover: { text: "greet( ", offset: 1 },
  hoverAfterNonAscii: { text: "greet(label", offset: 1 },
  definition: { text: "greet( ", offset: 1 },
  references: { text: "message", offset: 1 },
  highlight: { text: "message", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  completions: [{ below: "retries := 0", typed: "\tgre", expect: "greet" }],
  rename: { at: { text: "greet( ", offset: 1 }, newName: "salute" },
  formatting: true,
  documentSymbols: true,
  gaps: [
    { after: "retries := ", code: "0", host: "${toString cfg.retries}" },
    { after: "label := ", ...labelGap },
  ],
};

const json: LanguageSpec = {
  id: "json",
  requires: ["vscode-json-language-server"],
  servers: [
    {
      name: "jsonls",
      command: ["vscode-json-language-server", "--stdio"],
      languages: ["json"],
      initializationOptions: { provideFormatter: true },
    },
  ],
  code: `{
  "name": "verify",
  "retries": 0,
  "label": "héllo 日本語 𝒳", "tags": ["a",   "b"],
  "name": "duplicate"
}
`,
  diagnostic: { text: '"name": "duplicate"' },
  formatting: true,
  documentSymbols: true,
  gaps: [
    { after: '"retries": ', code: "0", host: "${toString cfg.retries}" },
    { after: '"label": ', ...labelGap },
  ],
};

const yaml: LanguageSpec = {
  id: "yaml",
  comment: (text) => `# ${text}`,
  requires: ["yaml-language-server"],
  servers: [{ name: "yamlls", command: ["yaml-language-server", "--stdio"], languages: ["yaml"] }],
  // Indentation is syntax here: a dedent that is off by one changes the tree.
  code: `name: verify
retries: 0
server:
  label: "héllo 日本語 𝒳"
  tags:   [a,   b]
name: duplicate
`,
  diagnostic: { text: "name: duplicate" },
  formatting: true,
  documentSymbols: true,
  gaps: [
    { after: "retries: ", code: "0", host: "${toString cfg.retries}" },
    { after: "label: ", ...labelGap },
  ],
};

const css: LanguageSpec = {
  id: "css",
  comment: (text) => `/* ${text} */`,
  requires: ["vscode-css-language-server"],
  servers: [
    { name: "cssls", command: ["vscode-css-language-server", "--stdio"], languages: ["css"] },
  ],
  code: `:root {
  --accent: #336699;
}

.title {
  color: var(--accent);
  colour: red;
  margin: 0   auto
}
`,
  diagnostic: { text: "colour" },
  hover: { text: "color: var", offset: 1 },
  definition: { text: "var(--accent)", offset: 6 },
  references: { text: "var(--accent)", offset: 6 },
  highlight: { text: "var(--accent)", offset: 6 },
  completions: [{ below: "colour: red", typed: "  marg", expect: "margin" }],
  rename: { at: { text: "var(--accent)", offset: 6 }, newName: "--brand" },
  formatting: true,
  documentSymbols: true,
};

const r: LanguageSpec = {
  id: "r",
  comment: (text) => `# ${text}`,
  requires: ["R"],
  servers: [
    {
      name: "r_language_server",
      command: ["R", "--no-echo", "-e", "languageserver::run()"],
      languages: ["r"],
    },
  ],
  code: `greet <- function(name, times = 1) {
  paste(rep(paste("hello", name), times), collapse = " ")
}

retries <- 0
message <- greet( "world", 2 )
label <- "héllo 日本語 𝒳"; shout <- greet(label)
print(c(message, shout, retries))
`,
  hover: { text: "greet( ", offset: 1 },
  hoverAfterNonAscii: { text: "greet(label", offset: 1 },
  definition: { text: "greet( ", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  completions: [{ below: "retries <- 0", typed: "gre", expect: "greet" }],
  formatting: true,
  documentSymbols: true,
  gaps: [
    { after: "retries <- ", code: "0", host: "${toString cfg.retries}" },
    { after: "label <- ", ...labelGap },
  ],
};

const typescriptCode = `export {};

/** Return a greeting. */
function greet(name: string, times = 1): string {
  return ("hello " + name).repeat(times);
}

const retries = 0;
const message = greet( "world", 2 );
const label = "héllo 日本語 𝒳"; const shout = greet(label);
const count: number = "three";
console.log(message, shout, count, retries);
`;

const typescriptProbes = {
  // `export {}` and each declaration may stand once in a module.
  oneScope: "document",
  comment: (text: string) => `// ${text}`,
  code: typescriptCode,
  diagnostic: { text: '"three"' },
  hover: { text: "greet( ", offset: 1 },
  hoverAfterNonAscii: { text: "greet(label", offset: 1 },
  definition: { text: "greet( ", offset: 1 },
  references: { text: "message", offset: 1 },
  highlight: { text: "message", offset: 1 },
  signature: { text: '"world", ', offset: 9 },
  completions: [{ below: "const retries", typed: "gre", expect: "greet" }],
  rename: { at: { text: "greet( ", offset: 1 }, newName: "salute" },
  formatting: true,
  documentSymbols: true,
  gaps: [
    { after: "const retries = ", code: "0", host: "${toString cfg.retries}" },
    { after: "const label = ", ...labelGap },
  ],
} satisfies Partial<LanguageSpec>;

// typescript-language-server defers an auto-import to resolve, and its items
// carry their own edit. The package it imports from lives in the workspace.
const typescript: LanguageSpec = {
  id: "typescript",
  requires: ["typescript-language-server"],
  servers: [
    {
      name: "tsls",
      command: ["typescript-language-server", "--stdio"],
      languages: ["typescript"],
    },
  ],
  files: {
    "package.json": JSON.stringify({ name: "workspace", dependencies: { greeter: "1.0.0" } }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: { module: "esnext", moduleResolution: "bundler", strict: true },
    }),
    "node_modules/greeter/package.json": JSON.stringify({
      name: "greeter",
      version: "1.0.0",
      main: "index.js",
      types: "index.d.ts",
    }),
    "node_modules/greeter/index.js": "exports.greetWorld = (name) => `hello ${name}`;\n",
    "node_modules/greeter/index.d.ts":
      "export declare function greetWorld(name: string): string;\n",
  },
  ...typescriptProbes,
  resolve: { below: "const retries", typed: "greetW", label: "greetWorld" },
};

// deno lsp defers it too, but its items carry no edit of their own: the
// editor inserts the label where the caret is.
const typescriptDeno: LanguageSpec = {
  id: "typescript",
  name: "typescript (deno)",
  oneScope: "document",
  requires: ["deno"],
  servers: [
    {
      name: "denols",
      command: ["deno", "lsp"],
      languages: ["typescript"],
      initializationOptions: { enable: true, suggest: { autoImports: true } },
    },
  ],
  files: {
    "deno.json": "{}\n",
    "lib.ts": "export function greetWorld(name: string): string {\n  return `hello ${name}`;\n}\n",
  },
  code: typescriptCode,
  comment: typescriptProbes.comment,
  hover: typescriptProbes.hover,
  definition: typescriptProbes.definition,
  resolve: { below: "const retries", typed: "greetW", label: "greetWorld" },
};

export const languages: readonly LanguageSpec[] = [
  python,
  lua,
  bash,
  c,
  go,
  json,
  yaml,
  css,
  r,
  typescript,
  typescriptDeno,
];

/** The name a language's cases are reported under. */
export const nameOf = (spec: LanguageSpec): string => spec.name ?? spec.id;
