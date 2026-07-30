# tsudoi

tsudoi assembles a Language Server out of one TypeScript file. You write handlers for LSP
methods -- hover, completion, formatting, pull diagnostics and completion-item resolution -- and
tsudoi speaks the protocol, manages the document store and answers the lifecycle requests an
editor expects.

The server runs under [bun](https://bun.sh/docs/installation) and under
[deno](https://docs.deno.com/runtime/getting_started/installation/), from the same installed
artifact.

## The package is not published

`@atusy/tsudoi` is **not published** to npm or to any other registry.

Once it is, `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` are the intended way to get
it -- and both are **unverified**: nothing has ever run them, and installing a tarball and
resolving `npm:` through deno's own cache are different mechanisms, so one of them working says
little about the other.

Until then the working route is the one below: build a tarball out of a checkout and install
that. It is the route the test suite runs, and it runs it from this file's own bytes -- the
commands below are extracted from this README and executed, so an instruction here that no
longer works fails the suite.

## What you need first

- **bun**, to build the tarball and to install it -- including when you will run the server with
  deno. One artifact and one install serve both runtimes.
- **deno**, only if you want to run the server under deno.
- **a checkout of this repository**, with `bun install` already run in it. The tarball is built
  from that checkout, and building it compiles the sources.
- **a network connection**, the first time: installing the tarball fetches tsudoi's own
  dependencies -- `vscode-languageserver-protocol`, which brings `vscode-jsonrpc` and
  `vscode-languageserver-types` with it, and `vscode-languageserver-textdocument`, which brings
  nothing -- unless bun's cache already holds them.

Working on tsudoi itself rather than using it: `bun test` spawns `deno`, so **deno must be on
PATH or `bun test` fails**. It fails rather than skipping, on purpose -- "starts under both
runtimes" is a promise the suite must not be able to stop checking quietly.

A fresh checkout needs no build step of its own. `examples/` import `@atusy/tsudoi/types` and,
for the protocol's own names, the `deps/` subpaths beside it -- which from inside this repository
resolve to files under `dist/`, and `dist/` is not committed
-- so `bun test` builds it **automatically**, through a `bunfig.toml` that compiles `src/`
before any test file is loaded. An edit to `src/` cannot be tested against a `dist/` that
has moved on without it, because there is no build to forget.

Run it **from the repository root**. bun looks for `bunfig.toml` in the directory you are
standing in and never searches upward, so a `bun test` started anywhere else runs the whole
suite with no build -- the one route on which a stale `dist/` is still reachable, and the
reason `test/package-shape.test.ts` still compares `dist/` against what `src/types.ts`
re-exports.

## Quickstart

Two directories, side by side:

```text
parent/
  tsudoi-language-server/   this repository, checked out
  my-language-server/       your project
```

Every step says which of the two you are standing in. No command below mentions your own
project's name, so calling it something else changes nothing.

### 1. In `tsudoi-language-server/`, build the tarball

<!-- quickstart in=tsudoi-language-server -->

```sh
bun pm pack --filename tsudoi.tgz
```

`--filename` is not decoration: without it the tarball is named after the current version, and
the next command would go stale at the next release.

### 2. In `my-language-server/`, install it

<!-- quickstart in=my-language-server -->

```sh
bun install ../tsudoi-language-server/tsudoi.tgz
```

This works in an empty directory -- bun writes the `package.json` for you.

### 3. In `my-language-server/`, write a config

<!-- quickstart in=my-language-server write=tsudoi.config.ts -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi/types";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/hover": async (context, params) => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        const line = document?.getText().split("\n")[params.position.line] ?? "";
        return { contents: { kind: "markdown", value: `**${line.trim()}**` } };
      },
    },
  });

export default config;
```

Three things you cannot guess from the outside:

- The config's **default export is a factory** -- a function tsudoi calls with no arguments,
  returning the config. A file that exports the config object itself is rejected, by name.
- **Annotating the const `TsudoiConfigFactory`** is what makes tsudoi tell you, in your own file,
  when the config shape changes -- without it nothing type-checks your config against tsudoi at
  all, and a factory written to an older shape fails silently instead.
- Handlers are typed by the method key. `context` and `params` above need no annotations, and
  neither does the return type, because that one annotation supplies them all;
  `@atusy/tsudoi/types` is the only import a config needs.

### 4. In `my-language-server/`, start the server

<!-- quickstart in=my-language-server start=bun -->

```sh
bun run node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts
```

or, under deno:

<!-- quickstart in=my-language-server start=deno -->

```sh
deno run -A node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts
```

Nothing appears to happen, and that is correct: the server reads LSP messages on stdin and
answers on stdout. It is meant to be spawned by an editor, so what you do with the command line
above is hand it to your editor's LSP client, from your project directory.

There is **no default config path**: `--config <path>` is required, and tsudoi refuses to start
without it.

### Why `deno run -A`

`-A` grants every permission, which is a lot to hand a server that reads your source. The reason
is not tsudoi's: `vscode-jsonrpc`, the JSON-RPC library underneath, reads the `XDG_RUNTIME_DIR`
environment variable **at module load**, before any of tsudoi's own code runs -- measured, as
`Requires env access to "XDG_RUNTIME_DIR"` from `vscode-jsonrpc/lib/node/main.js` on a run
without `--allow-env`.

A narrower set can work: measured once, under deno 2.9.2, `deno run --allow-read --allow-env`
completed the handshake and served a real path completion from the example config, with empty
stderr. It is **untested** all the same -- `deno run -A` is what the suite
spawns, so nothing keeps a narrower set working from one release to the next, and the
permissions your own handlers need (a network call, a subprocess, a file to write) are yours to
work out rather than tsudoi's to promise.

## When the config is wrong

If `--config` is missing, if the file does not exist, if it exports nothing by default, or if
what it does export throws when called, tsudoi never starts the protocol. It reports the problem
and stops:

<!-- failure-contract -->

| what an editor sees | value      |
| ------------------- | ---------- |
| exit code           | `1`        |
| stderr starts with  | `tsudoi: ` |
| bytes on stdout     | `0`        |

The last row is the one that matters to an editor: a server that printed a diagnostic to stdout
would desynchronise its client instead of failing.

## The documents your handlers receive

`context.tsudoi.documents.get(uri)` gives you a `TextDocument` from
`vscode-languageserver-textdocument` -- Microsoft's own package, out of the same repository as
the protocol types, and the one those types' own deprecation notice points at. tsudoi keeps the
store in step with the editor and hands you the real thing:

| member                         | what it answers                              |
| ------------------------------ | -------------------------------------------- |
| `uri`, `languageId`, `version` | what the editor said about the buffer        |
| `getText()`                    | the whole buffer                             |
| `getText(range)`               | only the text between two positions          |
| `positionAt(offset)`           | the `{ line, character }` at a string offset |
| `offsetAt(position)`           | the string offset of a `{ line, character }` |
| `lineCount`                    | how many lines it has                        |

The last four are the reason this type is not tsudoi's own. Anything that answers about the word
under the cursor needs offset arithmetic, and while tsudoi handed out a four-member shape every
config had to write that arithmetic again -- in code this project cannot see and could never fix.
Now it comes from a package other people maintain.

**Adopting it broke one thing, and it is worth knowing which.** Nothing that RECEIVES a document:
`uri`, `languageId`, `version` and `getText()` mean exactly what they meant before, and the new
type has strictly more members than the one it replaced, so every handler that compiled still
compiles. What breaks is code that IMPLEMENTS the type -- in practice a hand-written mock in your
own tests, which used to be an object literal with four members and no longer satisfies anything:

```ts
// no longer a TextDocument: positionAt, offsetAt and lineCount are missing
const document = { uri, languageId: "plaintext", version: 1, getText: () => "hello" };
```

Build one instead. `TextDocument.create` is the remedy and the only supported way to make a
document at all:

```ts
import { TextDocument } from "vscode-languageserver-textdocument";

const document = TextDocument.create(uri, "plaintext", 1, "hello");
```

That import is the one place you name the package yourself, and it is in your TESTS rather than
in your config -- the quickstart's "`@atusy/tsudoi/types` is the only import a config needs"
still holds, because a config never builds a document. `@atusy/tsudoi/types` exports the TYPE and
deliberately not the value for that reason: tsudoi builds the documents and your handlers only
receive them. A mock in your own tests is the exception, and it is the only one.

## Cleanup in a handler

A `finally` inside a **completion handler** runs when the editor abandons the request -- which it
does on every keystroke that supersedes the last one. A completion handler IS an async generator,
so its body outlives the first batch it yields; tsudoi **closes the generator** then, so the
cleanup written there happens.

What tsudoi does not promise is that your cleanup **completes**. A `finally` that awaits
something which never settles never finishes, and no server can change that; the request is
already answered `RequestCancelled` by then, and nothing there can be watched succeeding.

## Where to look next

- `examples/tsudoi.config.ts` in this repository is the fuller example. It chooses which methods
  the config answers and delegates the work to a module per method, which is the shape worth
  copying:

  | file                                         | what it does                                                                  |
  | -------------------------------------------- | ----------------------------------------------------------------------------- |
  | `examples/tsudoi.config.ts`                  | the config itself: which methods, and a `finally` that documents when it runs |
  | `examples/completion-path.ts`                | streaming completion of filesystem paths                                      |
  | `examples/hover-wordnet.ts`                  | hover that looks a word up in a dictionary                                    |
  | `examples/wordnet.d.ts`                      | types for `wordnet`, which ships none                                         |
  | `examples/diagnostic-trailing-whitespace.ts` | warns about trailing whitespace, one warning per line                         |
  | `examples/formatting-trailing-whitespace.ts` | removes exactly what that diagnostic reports                                  |
  | `examples/resolve-path-stat.ts`              | fills in a path item's size and date when the user highlights it              |

  The **trailing-whitespace two are a matched pair**: run the demo, see the warnings, format,
  and watch them clear. The formatter imports its analysis from the diagnostic module, so the
  two can never disagree about what a problem is. **The path two are the other pair**, and it
  runs the other way round: completion offers a directory's entries without asking the disk
  about any of them, and resolve fetches the detail for the one item you highlight — so the
  resolve module imports from the completion module the mark it recognises its own items by.
  Neither pairing is namable by row position, which is why both are named by file.

  **The set teaches two shapes of handler, and both are worth reading.** One **goes somewhere
  else** for its answer — completion and resolve to the filesystem, hover to a dictionary — and shows what a
  handler that waits on something outside itself has to look like. The other **computes its
  answer from the document it was given** and goes nowhere at all: the trailing-whitespace pair
  reads the buffer, turns offsets into `Position`s with `positionAt`, and is done. The second is
  the commoner shape in a real language server — a parser does not go anywhere else either — so
  do not read the first as the one to copy.

  **Copy the whole set**, or the imports fail. The config imports every handler module, the
  formatter imports the diagnostic module, the resolve module imports the completion module,
  and `wordnet.d.ts` is imported by nobody and needed
  all the same — it is what makes `hover-wordnet.ts`'s `wordnet` import type-check. The set is
  what the test suite type-checks and runs. They also need `wordnet` in your own project:

  <!-- examples-install -->

  ```sh
  bun install wordnet
  ```

  The hover module reads its definitions from it (~27MB, MIT, and loaded on the first hover
  rather than at startup). Without it the example fails to load, naming the missing module.
  Note that it fails to LOAD rather than to type-check: `examples/wordnet.d.ts` declares the
  module, so `tsc` is satisfied by the declaration whether or not the package is there.

  **No protocol package is named here**, and that is what tsudoi re-exporting its own dependencies
  buys: these files name protocol types freely and still depend on nothing but tsudoi. They take
  them from the `deps/` subpaths and not from tsudoi's own module -- `CompletionParams` from
  `@atusy/tsudoi/deps/protocol`, which carries the protocol's request and params types, and
  `CompletionItem`, `MarkupContent`, `Position`, `WorkspaceFolder` and `DiagnosticSeverity` from
  `@atusy/tsudoi/deps/types`, which carries the data types a handler reads or builds.
  `CompletionItemKind` comes from that second one as well, and it is why those are not all
  `import type`: it is a **value**, and an item's `kind` is one of its members. What
  `@atusy/tsudoi/types` carries is tsudoi's OWN names -- `MethodHandler`, `RequestContext`,
  `TsudoiConfigFactory` -- which is why the quickstart config above needs nothing beyond it and
  these handler files need more: a config names no protocol type, and a handler does almost
  nothing else. The test suite runs these files themselves and type-checks them as an
  installed consumer receives them, so they cannot drift from what tsudoi does or from what it
  publishes.

- **The published type surface is four subpaths**, split by ORIGIN rather than by topic:
  `@atusy/tsudoi/types` is tsudoi's own names, written in `src/types.ts`, and
  `@atusy/tsudoi/deps/protocol`, `@atusy/tsudoi/deps/types` and `@atusy/tsudoi/deps/textdocument`
  re-export the three packages tsudoi depends on, one subpath each. The line tsudoi draws is OURS
  versus THEIRS; the line between the three `deps/` subpaths is upstream's own packaging, which
  you reach past rather than reason about.
