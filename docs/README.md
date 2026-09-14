# tsudoi: complete guide

tsudoi assembles a Language Server out of one TypeScript file. You write handlers for LSP
methods -- hover, completion, formatting, pull diagnostics, completion-item resolution, command
execution and code actions -- and tsudoi speaks the protocol, manages the document store and
answers the lifecycle requests an editor expects.

The server runs under [bun](https://bun.sh/docs/installation) and under
[deno](https://docs.deno.com/runtime/getting_started/installation/), from the same installed
artifact.

If you want to try tsudoi before reading the full API and installation details, start with the
[GitHub-based Deno starter](../README.md#try-the-npm-alpha) in the project overview.

## Install the npm alpha

`@atusy/tsudoi-language-server` is published to npm under the opt-in `alpha` tag. Install the
framework with `bun add @atusy/tsudoi-language-server@alpha` or
`deno add --save-exact npm:@atusy/tsudoi-language-server@alpha`. Install handlers with the same tag
and keep the resolved `0.1.0-alpha.1` versions together. In a Deno-only project, start the server
through its exported CLI with
`deno run -A --frozen --node-modules-dir=none @atusy/tsudoi-language-server/cli --config ./tsudoi.config.ts`.
Handlers declare that exact framework version as a
required peer rather than bundling their own copy; Bun and npm may auto-install required peers, but
installing the matching framework explicitly keeps the chosen set visible.

The first release keeps the untagged `latest` channel untouched. The registry commands are
**unverified** until the first publication: nothing can run them before the package exists, and installing a tarball and
resolving `npm:` through deno's own cache are different mechanisms, so one of them working says
little about the other.

For developing tsudoi itself, the checkout route below builds a tarball and installs that exact
artifact. For a shorter Deno-only route, use the
[GitHub starter](../README.md#try-the-npm-alpha). The tarball route is the one the test suite
runs, and it runs it from this file's own bytes. **The
quickstart's commands are extracted from this README and executed**, under both runtimes, so an
instruction there that no longer works fails the suite. **Every fenced block in this document is
either executed or accounted for**, and one that is neither is refused by name -- over tracked
READMEs as a class rather than over a list of the blocks that exist today, so a block added here
without saying what reads it fails the suite instead of quietly withdrawing the promise.

**Accounted for is narrower than executed, and the difference is owed to you rather than
implied.** Two kinds of block here are **never run**: the layout drawing under _Quickstart_,
whose directories are held against the ones the quickstart's own steps stage, and the two blocks
marked `snippet` under _Documents_, whose import specifiers are held against what resolves. They
are named by the marker that routes them and NOT by their language, because a `ts` block here is
just as likely to be run -- the quickstart step that writes the config is one. What is checked in each case is
that named part and nothing else -- a snippet whose imports all resolve and whose body is wrong
is accounted for and unchecked.

**Neither is the handler packages under `packages/`.** The route for each of those lives in that
package's own README -- `../packages/tsudoi-completion-document/README.md` and one for every other
package under `packages/`, all of them linked from the table further down -- rather than here: one
copy of it, beside the code
it is about, and each of those documents says for itself which of its commands the suite runs and
which it only reads. What is true of all of them is the same and is stated once, further down:
they require the framework as an exact, versioned **peer** during alpha rather than bundling or
choosing a framework copy. Bun and npm may still auto-install a required peer.

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

Working on tsudoi itself rather than using it: **deno must be on PATH or `bun test` fails**.
The native-shell integration tests also need fish, xonsh, and zsh on PATH.

**To verify a change, run `bun run check` from the repository root.**
It runs unit tests, integration tests, E2E tests, lint, formatting, and type checks
in sequence, stopping at the first failure. Run individual checks with
`bun run test:unit`, `bun run test:integration`, `bun run test:e2e`, `bun run lint`,
`bun run fmt:check`, or `bun run typecheck`. The type check builds and checks
workspace members before checking the root project, so it also works on an unbuilt checkout.

- Unit tests live beside their implementations as `packages/<package>/src/*.test.ts`.
  Tooling library tests live under `scripts/src/` beside the library. Run
  `bun test packages scripts/src`, or target one file such as
  `bun test packages/tsudoi-language-server/src/documents.test.ts`.
- Integration tests live in `tests/integration`, with package-specific suites grouped in
  subdirectories. They exercise filesystem, compiler, packaging, and module interactions.
  Run `bun test tests/integration`.
- E2E tests live in `tests/e2e`. They start the server, exchange LSP messages, or exercise
  installed packages and documented command sequences. Run `bun test tests/e2e`.
- Shared fixtures and process helpers live in `tests/fixtures` and `tests/helpers`.
  Package-local unit-test helpers can live in `packages/<package>/tests/helpers`.

`bun test` still runs all categories. The `dist/` output is not committed and is built
automatically. Its test-only preload in `bunfig.toml` builds current
`dist/` artifacts before tests load: workspace imports resolve through each package's
exports map. **Run from the repository root**, where Bun reads that configuration. Running
from another directory changes both test discovery and whether the preload runs.

A bare `tsc --noEmit` on an unbuilt checkout fails with `TS2307` for missing workspace
artifacts, such as `@atusy/tsudoi-hover-wordnet`. Run `bun test` or `bun run scripts/typecheck-workspaces.ts` first. There is no
`paths` mapping substituting source for the published artifact. Development tsconfigs
include colocated tests; build tsconfigs exclude `src/**/*.test.ts` so tests and their
helpers are not emitted or published. Package tests assert the tarballs' exact file lists.

## Quickstart

Two directories, side by side:

<!-- layout -->

```text
parent/
  tsudoi-language-server/                          this repository, checked out
    packages/tsudoi-language-server/               the tsudoi package itself
  my-language-server/                              your project
```

Every step says which directory you are standing in. No command below mentions your own
project's name, so calling it something else changes nothing.

### 1. In `tsudoi-language-server/packages/tsudoi-language-server/`, build the tarball

<!-- quickstart in=tsudoi-language-server/packages/tsudoi-language-server -->

```sh
bun pm pack --filename tsudoi.tgz
```

`--filename` is not decoration: without it the tarball is named after the current version, and
the next command would go stale at the next release.

**With `--filename`, the tarball does not land in that directory.** tsudoi is a workspace member,
and `bun pm pack --filename` run inside a member writes to the workspace root -- so what you get is
`tsudoi-language-server/tsudoi.tgz`, one directory above `packages/`, which is exactly the path
the next step installs from. Running the same command at the checkout root instead packs the
_workspace_, not tsudoi: every tracked file, this repository's own tests included, because the
workspace root's manifest declares no `files`.

### 2. In `my-language-server/`, install it

<!-- quickstart in=my-language-server -->

```sh
bun install ../tsudoi-language-server/tsudoi.tgz
```

This works in an empty directory -- bun writes the `package.json` for you.

### 3. In `my-language-server/`, write a config

<!-- quickstart in=my-language-server write=tsudoi.config.ts -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

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
  `@atusy/tsudoi-language-server/types` is the only import a config needs.

### 4. In `my-language-server/`, start the server

<!-- quickstart in=my-language-server start=bun -->

```sh
bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts
```

or, under deno:

<!-- quickstart in=my-language-server start=deno -->

```sh
deno run -A node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts
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

`context.tsudoi.documents.get(uri)` gives you a `DocumentView` from `@atusy/tsudoi-language-server/types`: a
sealed facade over one open buffer, carrying the seven members
`vscode-languageserver-textdocument` declares for READING a document -- Microsoft's own package,
out of the same repository as the protocol types, and the one those types' own deprecation notice
points at. tsudoi keeps the store in step with the editor and every member forwards to it at the
moment you ask, so a reference you keep across an `await` answers about the buffer as it stands
then:

| member                         | what it answers                              |
| ------------------------------ | -------------------------------------------- |
| `uri`, `languageId`, `version` | what the editor said about the buffer        |
| `getText()`                    | the whole buffer                             |
| `getText(range)`               | only the text between two positions          |
| `positionAt(offset)`           | the `{ line, character }` at a string offset |
| `offsetAt(position)`           | the string offset of a `{ line, character }` |
| `lineCount`                    | how many lines it has                        |

The last four are the reason those members are not invented here. Anything that answers about the
word under the cursor needs offset arithmetic, and a shape carrying only `uri`, `languageId`,
`version` and `getText()` would leave every config writing that arithmetic again -- in code this
project cannot see and could never fix. The answers come from a package other people maintain;
what tsudoi owns is the declaration, and the paragraph after next says what that buys you.

**What you hold is a view over the buffer, not one of upstream's documents.** Upstream marks its
`TextDocument` interface "not to be implemented" and enforces it, so an upstream helper works on
what you are handed exactly when it only READS:

| upstream helper                                   | what it does                                             |
| ------------------------------------------------- | -------------------------------------------------------- |
| `TextDocument.applyEdits(document, edits)`        | works, and reads the buffer as it stands at the call     |
| `TextDocument.update(document, changes, version)` | throws `document must be created by TextDocument.create` |

**Neither call is a compile error**, and that is the half nothing warns you about: `DocumentView`
carries upstream's seven members with upstream's signatures, so both type-check and only one of
them runs. When you need a document you can update, take a copy that is yours --
`TextDocument.create(document.uri, document.languageId, document.version, document.getText())`
builds a real one, detached from the buffer, which nothing in tsudoi will move under you.

The exchange runs the other way too: a real upstream document SATISFIES `DocumentView`, so your
own helpers annotated with tsudoi's type accept the documents you build in your own tests.

**A hand-written mock has to implement all seven.** This is the one place the type asks anything of
you, and it comes up in your own tests rather than in your config. An object literal carrying the
four obvious members satisfies nothing:

<!-- snippet -->

```ts
import type { DocumentView } from "@atusy/tsudoi-language-server/types";

// not a document: positionAt, offsetAt and lineCount are missing
const document: DocumentView = { uri, languageId: "plaintext", version: 1, getText: () => "hello" };
```

Build one instead. `TextDocument.create` is the remedy, and what it builds satisfies both types:

<!-- snippet -->

```ts
import { TextDocument } from "vscode-languageserver-textdocument";

const document = TextDocument.create(uri, "plaintext", 1, "hello");
```

That import is where you name the package yourself, and a config that only reads the buffer never
writes it -- so the quickstart's "`@atusy/tsudoi-language-server/types` is the only import a config needs" holds
for the handlers you start with. The two exceptions are above: a mock in your own tests, and a
handler taking a copy it can update. `@atusy/tsudoi-language-server/types` exports the TYPE and deliberately not
the value: tsudoi builds the documents your handlers receive, and building one is the caller's
job on both of those routes rather than something tsudoi can do for you.

## The session your handlers receive

The store is one member of `context.tsudoi`, and everything else on it is the SESSION rather than
the request:

| member                | what it answers                                                      |
| --------------------- | -------------------------------------------------------------------- |
| `documents`           | the open buffers, as above                                           |
| `workspaceFolders`    | the folders the client holds, as a store like `documents`            |
| `rootUri`, `rootPath` | the deprecated roots, as the client spelled them, or `null`          |
| `clientCapabilities`  | what the client declared it can do, or `{}` when it declared nothing |
| `notify`              | sends a notification to the client -- the one member that WRITES     |

`workspaceFolders` answers two questions. `values()` yields every folder the client holds, in the
order it sent them; `get(uri)` answers with the folders at the INNERMOST location covering that
uri, as a list, empty where the client holds none. It is **never `undefined`**, so
`for (const folder of workspaceFolders.get(uri))` needs no guard in front of it.

`get` is not "every ancestor's folders". It walks up from the uri and stops at the first location
that holds anything, so a document inside `file:///w/inner` inside `file:///w` answers with the
inner folder alone -- nesting still resolves to one. The list is longer than one only when several
folders **name one location**: a uri the client sent twice, or `…/plain` beside `…/plain/`. tsudoi
hands you all of them rather than picking a winner on its own authority, and the client's order is
the order they are presented in rather than a ranking.

Both sides of the comparison go through the same URL parse, so spellings that name one location
meet: a `file://LOCALHOST/…` folder answers for a `file:///…` document, an upper-case scheme
answers for a lower-case one, `..` segments resolve, `%20` meets a literal space, and a folder held
with or without a trailing slash is found either way. That is not prefix matching --
`file:///home/me/proj` never answers for a document in `file:///home/me/project`. The path's case is
not reconciled, since the URL Standard does not reconcile it. Nothing you can pass throws, the
`untitled:` uri of an unsaved buffer included; a folder whose uri no parser accepts is simply
unreachable through `get`, while `values()` still hands it over.

**Everything reached through `context.tsudoi` is live.** It is one object for the whole session,
so a handler that reads a member, awaits, and reads it again may read two different things -- the
folder list moves when the user adds a folder, and a document answers from the buffer as it stands
when you ask it, which moves as the user types. A handler that needs the value it STARTED with takes it before its first `await`:
`Array.from(workspaceFolders.values())` is enough, because tsudoi replaces that list rather than
writing into it, while a document needs `getText()`, since a string does not move. The two
deprecated roots and the capabilities are written once at `initialize` and never move at all.

Building a context by hand in your own tests means supplying every member of that table -- the
compiler names the one you forgot. `clientCapabilities` is `{}` and never `null`, so reading
`capabilities.textDocument?.completion?...` needs no guard; `@atusy/tsudoi-completion-path` reads
exactly that chain to decide whether it may send an `InsertReplaceEdit`, which LSP permits only to
a client that declared `insertReplaceSupport`.

**`notify` is the one member that speaks rather than answers.**
`await context.tsudoi.notify("window/showMessage", { type: 1, message: "..." })` puts a
notification on the wire, which is the only way a handler can tell the user something its own
answer has no room for -- a request result cannot say _I declined, and here is why_. The method is
a plain string and the params are `unknown`: tsudoi neither validates nor reshapes them, so a
**misspelled method name is not an error anywhere** -- it goes out and a conforming editor ignores
it. Import the protocol's own params type from `@atusy/tsudoi-language-server/deps/protocol` and
annotate what you pass if you want the compiler's help.

**When you may send is the protocol's rule, not tsudoi's.** LSP forbids a server sending most
notifications before it has answered `initialize` -- `window/showMessage`, `window/logMessage` and
`telemetry/event` are the exceptions -- and tsudoi enforces none of that, because a list carried
here would go stale with the specification and would refuse the one call an author most wants from
inside a handshake handler. Await the promise when order matters: it resolves once the bytes are
handed to the connection, and dropping it lets your own answer overtake the notification.

## What your server advertises

tsudoi derives the server capabilities from the handlers you declared: a hover handler makes it
claim `hoverProvider`, a resolve handler beside a completion one makes it claim `resolveProvider`.
That is the whole of what handler presence can say. When you need to say more -- trigger
characters, a diagnostic identifier, the command names below -- declare a handler at
`config.methods.initialize`, beside the others. It goes inside `methods`; a top-level `initialize`
key is read by nothing and refused by nothing.

It takes two arguments and returns a **`Promise`**. There is no union with a bare result -- one
shape for every handler was the choice -- so `(context) => ({ ...context.preparedResult })` does
not type-check and `async (context) => ...` or `Promise.resolve(...)` is what you write.
`context.preparedResult` is the `InitializeResult` tsudoi was about to send. The second argument is
the whole `InitializeParams` your editor sent, unread by tsudoi past the four fields it mirrors.
And `context.tsudoi` is ALREADY LIVE by the time you are called: `clientCapabilities`, `rootUri`,
`rootPath` and `workspaceFolders` all answer here, which is usually the reason to write a handler
at all -- you can decide what to claim from what the editor said it can do.

What you return is what your editor is told. tsudoi does not merge its own answer back over yours
and does not put back a key you left out: withdrawing a capability tsudoi would otherwise have
claimed is the point of the handler, and there would be no way to do it if the two were merged.

Which is also the trap, so **spread what you were handed** rather than building a `capabilities`
of your own. Assigning your own `completionProvider` is the cheapest way to see it:
`completionItem/resolve` writes `resolveProvider` into the key `textDocument/completion` owns, so
your answer withdraws the resolve support your config still declares. `textDocumentSync` and
`workspace.workspaceFolders` cost more, because tsudoi writes those whatever your config says. An
answer that omits `textDocumentSync` is an editor that sends no `didOpen` and no `didChange`, so
`context.tsudoi.documents` stays empty for the whole session and every handler that reads a
document answers about nothing -- silently, with no error anywhere. Omitting
`workspace.workspaceFolders` is the same loss one door along: your editor stops sending
`workspace/didChangeWorkspaceFolders`, so `context.tsudoi.workspaceFolders` freezes at whatever the
handshake set and never moves again, just as quietly.

`positionEncoding` is a field to leave alone rather than one this handler unlocks. tsudoi's
documents are UTF-16 throughout -- every offset and every position, from the buffer implementation
underneath -- and nothing in tsudoi reads what you put in that key. Declaring `"utf-8"` changes no
computation; it tells your editor to send positions tsudoi will then read as if they were UTF-16,
for the whole session, with nothing to show for it. LSP also permits only `utf-16` back when the
editor named no encodings, and tsudoi does not read the list it named.

What you were handed is frozen at every depth, so editing it in place throws instead of
half-working -- spread it and change the copy. `structuredClone` is not the way out and reads like
it should be: the clone keeps the `readonly`, so assigning to its `capabilities` is a compile
error. And a handshake that does not complete takes the process down, with no second chance: LSP
permits one `initialize` per session, so tsudoi refuses every later one whatever became of the
first. A handler that throws, and a handler whose answer cannot be JSON, both end the same way --
your editor gets a `window/logMessage` at Error level saying what happened, the `initialize` it is
waiting on is answered as an error, and the server exits 1. The reason is also on stderr, as
`tsudoi: initialize handler failed: ...` carrying the stack that names the line in your file -- the
same `tsudoi: ` prefix every other message here is found by.

One last thing this handler owes, which every other handler owes too and is less likely to reach
for: anything you open -- a timer, a watcher, a socket, a subscription -- must be `unref()`'d.
Nothing else holds this process open, so a handle left referenced does not slow your server down,
it keeps one alive after your editor is gone.

## Commands your editor can invoke

tsudoi serves `workspace/executeCommand` as one more handler key, so a command your user invokes
-- from a code action, a keybinding, a palette -- reaches a handler you wrote. It gets the
treatment every other method gets and none of it written again: refused before the handshake,
answered `RequestCancelled` when the editor abandons it, refused by name when its params are not
an object, and answered `null` when you declared no handler at all.

**Declaring the handler is not the same as offering a command**, and that is the half worth
reading twice. Handler presence can say only that this server executes commands at all, so tsudoi
advertises `executeCommandProvider` with an **empty** list; any name it invented would be a
promise to your editor that no config of yours made. The list is yours to write, from an
`initialize` handler -- and spreading `context.preparedResult` at the top level does not reach it.
The key lives inside `capabilities`, so spread that too and put your `executeCommandProvider` in
the inner copy. Writing it beside the outer spread instead compiles and does nothing:
`InitializeResult` accepts any key you like, so there is no diagnostic anywhere and your editor
goes on reading the empty list tsudoi put where the key belongs. Until you do, a conforming editor
knows of no command and sends none, so the handler you declared can never run.

**tsudoi does not check an incoming name against that list either.** A request naming a command
you never advertised still reaches your handler, and what an unrecognised command means is yours
to decide -- tsudoi has no way to know. Nor can it help you with collisions: command names share
one **namespace** across every server your editor is talking to, so a name some other server
already answers is a hazard nothing here can see.

What your handler answers is typed `unknown` rather than the protocol's `any`, so you narrow it
where you read it back rather than losing the compiler in your own file. tsudoi applies none of
it: it never sends `workspace/applyEdit`, so a command of yours that has to change a buffer has no
route through tsudoi today. What your editor does with the answer after that is between it and the
protocol -- LSP contemplates a client applying a workspace edit a command returned, and tsudoi
neither arranges that nor prevents it.

## Streaming document diagnostics

`textDocument/diagnostic` handlers are async generators. To migrate a promise-returning
handler, use `async function* (context, params)` and keep its `return report`. Direct callers
must consume the generator, including its return value, instead of awaiting the handler call.

For partial results, yield a `DocumentDiagnosticReport` first, then yield
`DocumentDiagnosticReportPartialResult` objects containing `relatedDocuments`. Finish with a
bare return or fall through. A valid `partialResultToken` sends every yield immediately as
`$/progress`, followed by a `null` response. Without a valid token, tsudoi merges related-document
entries into the initial report and sends one response. Later entries for the same related URI
replace earlier ones; they do not append to the requested document's `items`.

A handler may instead return one report without yielding, even with a token. Returning a result
after yielding, yielding a partial before the initial report, yielding a second initial report,
or producing no report is a handler error. To report no diagnostics, produce
`{ kind: "full", items: [] }`. Both full and unchanged reports are supported; handlers own result
IDs and must respect `clientCapabilities.textDocument?.diagnostic?.relatedDocumentSupport` when
producing related reports. Tsudoi checks report envelopes and sequencing, not every diagnostic
field. See [ADR 0010](architecture-decision/0010-stream-document-diagnostic-reports.md).

## Actions your editor can offer

`textDocument/codeAction` is the menu your user opens on a diagnostic, a selection or a cursor
position, and tsudoi serves it as one more handler key. Declaring it claims `codeActionProvider`
and **claims no kinds**. `codeActionKinds` is optional, so tsudoi says this server produces code
actions and stays quiet about which categories -- unlike the command list above, which the
protocol makes required and which tsudoi therefore has to advertise empty. Naming kinds is a
promise about what you produce, so it stays yours to make from an `initialize` handler.

**The handler is an async generator**, like `textDocument/completion`. Yield arrays for partial
results and return an array for the final result. With a valid `partialResultToken`, each yield
leaves as `$/progress` and the return becomes the response; without one, yielded items precede
returned items in one array. Returned items are never sent as progress or repeated by tsudoi.
A fixed list can be returned without yielding, even when the request carries a token.

A bare `return` or `return null` adds no items and does not retract earlier yields. A handler
that neither yields nor returns a result answers `null`; an explicit empty array stays `[]`
when aggregated or returned. Existing yield-only handlers still answer `null` after streaming.
Clients decide how to interpret a final response after progress: LSP's partial-result contract
requires an empty final response and does not guarantee appending its items. See
[ADR 0009](architecture-decision/0009-return-final-results-from-stream-handlers.md) for the
intentional compatibility tradeoff. Cancellation still discards subsequent output.

Completion uses the same convention and additionally accepts a `CompletionList` as its return.
Return `{ isIncomplete: searchWasTruncated, items: remainingItems }` after yielding candidates to
choose completeness when computation finishes. Without a valid token, its attributes are retained
and its items follow the yielded candidates. With a token, the list becomes the response unchanged;
whether its attributes apply to earlier progress depends on the client. A list with empty `items`
can carry the final attributes without repeating candidates. Returning a list without yielding
provides an ordinary completion response even if the request contains a token.

A returned list's `itemDefaults` also apply to earlier items when aggregated. Ensure those defaults
are appropriate for the whole aggregate and supported by the client. For streamed items that need
default values, put the values on the items themselves. Tsudoi does not mutate the returned list.

When wrapping another generator, use `return yield* inner(context, params)` to forward both
its yields and its final result. A bare `yield*` forwards the yields but discards the return
value unless you use it; a `for await` loop only reads yields.

What you yield is `Command`s, `CodeAction`s, or both in one batch. tsudoi checks that the batch is
an array -- yield anything else and the request fails -- and looks at nothing inside it, so
nothing here reshapes an action or fills a field in. What crosses the wire is still JSON, so what
your editor receives is what you wrote **for anything JSON carries**; a value it does not, from a
cycle to a `BigInt` reached through `LSPAny`, is between you and the encoder. **Which leaves every rule about what an action may contain
to you.** The one most likely to catch you is a capability: a client announces whether it can read
code action _literals_, and one that has not may be sent `Command` literals only, so read
`context.tsudoi.clientCapabilities.textDocument?.codeAction?.codeActionLiteralSupport` before you
yield a `CodeAction`. It is not the only one -- the protocol wants a `CodeAction` to carry an
`edit`, a `command`, or both, where the type makes each optional, and `disabled`, `isPreferred`
and the richer `WorkspaceEdit` forms are each gated on a capability of their own.

A `CodeAction` carrying an `edit` is your editor's to apply. One carrying a `command` comes back
to you as the `workspace/executeCommand` above **only once you have declared that handler and
advertised the name** -- until then a conforming editor knows of no such command and will not send
it, for the reason the section above gives. **tsudoi does not resolve code actions.**
`codeAction/resolve` is not a handler key, so an action you offer has to arrive complete -- there
is no second call in which to fill in an edit you deferred.

**A method handler may answer an LSP error deliberately.** Import `ResponseError` and
`LSPErrorCodes` from `@atusy/tsudoi-language-server/deps/error`, then throw, for example,
`new ResponseError(LSPErrorCodes.RequestFailed, "why it failed")`. The editor receives that code
and message as its error response. Any other thrown value is a handler failure: tsudoi names it
on stderr and the JSON-RPC layer answers `InternalError`.

## Methods tsudoi never heard of

The keys above are the ones tsudoi enumerated. `customMethods`, beside `methods` rather than inside
it, is where you declare the rest: `textDocument/didFocus`, an extension your own client speaks,
anything with a name.

**Registering one advertises nothing**, which is the first thing to know rather than the last.
`initialize` has no capability to claim for a method the protocol never defined, so no editor sends
one unless it already knew to -- these are for a client you control or an extension you and it
have agreed on, not a way to make an editor ask you something new.

**One handler per name, and you annotate its context.** A method's name says nothing about whether
a client sends it as a request or as a notification -- `textDocument/didFocus` is a notification an
editor extension defines, and a name of your own could be either -- so the type you write on the
context is what says which one you meant:

<!-- snippet -->

```ts
import type {
  NotificationContext,
  RequestContext,
  TsudoiConfig,
} from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfig = {
  customMethods: {
    // A REQUEST is answered under `result`. `{ result: null }` IS an answer; returning nothing is not.
    "tsudoi/status": (context: RequestContext, params: unknown) =>
      Promise.resolve({ result: { rootUri: context.tsudoi.rootUri, params } }),
    // A NOTIFICATION has no response, so it returns nothing -- and has no `signal` to read.
    "textDocument/didFocus": (context: NotificationContext) =>
      Promise.resolve(void context.tsudoi.documents),
  },
};
```

**The annotation is not optional, and that is a cost taken deliberately.** A bare `(context,
params) =>` is `TS7006`: the two handler types disagree about what a context is, and TypeScript
will not infer a parameter from a union of signatures that disagree. What you buy is that neither
mistake is silent -- a notification handler cannot reach `signal` at all, and a handler that
answers cannot be passed off as one that does not.

**tsudoi never asks which kind a message is.** Every name you declare is registered on both sides,
and the JSON-RPC layer beneath decides by the presence of a request id -- so what you annotated
says what you MEANT, and a client can still send the other form. It is not undefined behaviour:
a request reaching a handler that answers nothing is a handler failure (below), and a notification
reaching one that answers is named on stderr with its value discarded.

**A request answers under `result`.** A typed row like hover says `Hover | null` and tells
answering `null` apart from answering nothing by its own type; a custom method's result is
`unknown` and cannot, so the wrapper carries the difference. `{ result: null }` reaches your editor
as a null result with no error. Falling off the end is a handler failure instead: the method is
named on stderr with the `tsudoi: ` prefix, and your editor is answered an error. Your handler is
handed `context.signal` exactly as every other request handler is.

**A notification declares no gate, and tsudoi applies the lifecycle itself.** Outside the
initialized window the message is dropped, silently, there being no response through which you
could be told -- exactly as a built-in notification is dropped. A request arriving there is
refused with `ServerNotInitialized` instead, because a request has a response to carry the
refusal.

**A notification handler that answers, or rejects, is named on stderr once per method per session.**
Once, and not per message: a handler on something your editor sends per keystroke would otherwise
write a line per keystroke into the one channel you read. That report is the only thing that will
ever tell you: tsudoi loads your config through a cast, so a config you never annotated is checked
by nothing else at all.

**A name tsudoi already serves is refused**, by the compiler if you annotated your config and by
the loader either way, naming the method and telling you to declare it under `methods`. That is
the request table plus `initialize`, and NOT the notifications tsudoi answers for itself.

**A non-terminal built-in notification's name is accepted as a hook.** `textDocument/didOpen`
passes both
refusals, but tsudoi registers one composed handler rather than letting the JSON-RPC layer's
method-keyed assignment displace either side. The built-in operation fulfills first and your
handler starts after it, so a `didOpen` hook sees the opened document, a `didChange` hook sees the
changed text, and a `didClose` hook sees the document absent.

The complete built-in-to-custom chain for `didOpen`, `didChange`, and `didClose` is queued by
document URI. A slow hook delays later lifecycle notifications for that document -- including
incremental changes -- while another document has its own queue and carries no promise dependency
on it. A hook that yields while waiting therefore lets another document continue, but CPU-bound
work or work before the first yield still blocks the shared JavaScript event loop. A hook that
never settles stops further lifecycle work for its document. While it is pending, later lifecycle
notifications and their parameters can accumulate without a fixed bound; tsudoi neither drops nor
coalesces them because doing so would change the document history.

A document-scoped request received after queued lifecycle work for its URI waits for the current
queue tail before its handler reads the store. Thus hover, completion, formatting, diagnostics, and
code actions cannot overtake an earlier `didChange`. Cancelling the request ends this wait with
`RequestCancelled`; it does not wait for the hook or enter the config handler. Tsudoi creates this
scheduler only when the config declares a `didOpen`, `didChange`, or `didClose` hook, so document
updates keep their direct synchronous path for configs without document-lifecycle hooks.

`exit` is the exception and is refused under `customMethods`: its built-in handler terminates the
process and cannot fulfill before any custom handler starts.
`shutdown` is also reserved: it is the lifecycle request owned by tsudoi and cannot be replaced by
a custom request handler.

## Cleanup in a handler

Tsudoi closes the generator after cancellation or a failure while consuming yields, running
the handler's `finally`. Completion, code-action, and diagnostic handlers are async generators;
their bodies can outlive the first result they yield. All three share the same generator
lifecycle. Values yielded or returned during cleanup are discarded.

**Closing is requested, not imposed**, and the difference is one your handler controls. If the
abandonment arrives while tsudoi is waiting on a batch from you, the close queues behind that
wait -- the language gives a generator's `return()` no way to interrupt a pull already running --
so your `finally` does not begin until the batch you were producing settles. A handler that
ignores `context.signal` and awaits something that never settles never reaches its own cleanup.

What tsudoi does not promise is that your cleanup **completes**. A `finally` that awaits
something which never settles never finishes, and no server can change that; the request is
already failed or been cancelled by then. Cleanup cannot change that response.

## Where to look next

- `examples/tsudoi.config.ts` in this repository is the fuller example. It chooses which methods
  the config answers and delegates the work to a module per method, which is the shape worth
  copying:

  | file                                         | what it does                                                                  |
  | -------------------------------------------- | ----------------------------------------------------------------------------- |
  | `examples/tsudoi.config.ts`                  | the config itself: which methods, and a `finally` that documents when it runs |
  | `examples/diagnostic-trailing-whitespace.ts` | warns about trailing whitespace, one warning per line                         |
  | `examples/formatting-trailing-whitespace.ts` | removes exactly what that diagnostic reports                                  |

  The **trailing-whitespace two are a matched pair**: run the demo, see the warnings, format,
  and watch them clear. The formatter imports its analysis from the diagnostic module, so the
  two can never disagree about what a problem is.

  **Copy the whole set**, or the imports fail. The config imports every handler module beside it
  by relative path, and the formatter imports the diagnostic module. The set is what the test
  suite type-checks and runs.

  **What that set teaches is one shape of handler out of two**, and it is the commoner one: it
  **computes its answer from the document it was given** and goes nowhere at all — reads the
  buffer, turns offsets into `Position`s with `positionAt`, and is done. A parser does not go
  anywhere else either. The other shape **goes somewhere else** for its answer and has to wait
  on it, and the two packages below are where that one is worked out.

- **Handlers are packages you install rather than files you copy**, which is the trade this
  repository makes deliberately: a fix reaches you by reinstalling instead of by diffing your
  copy against an example you have already edited, and the price is that the file is not yours
  to edit. Each carries **its own README** — what it answers, that it needs tsudoi at run time
  however its manifest reads, what bounds it, and the route for getting it — and that document,
  rather than this one, is what a registry page would show:

  | package                                                                                     | answers                                               |
  | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
  | [`@atusy/tsudoi-hover-wordnet`](../packages/tsudoi-hover-wordnet/README.md)                 | `textDocument/hover`                                  |
  | [`@atusy/tsudoi-completion-path`](../packages/tsudoi-completion-path/README.md)             | `textDocument/completion`, `completionItem/resolve`   |
  | [`@atusy/tsudoi-adapter-efm-config`](../packages/tsudoi-adapter-efm-config/README.md)       | whatever an efm `config.yaml` describes               |
  | [`@atusy/tsudoi-completion-dictionary`](../packages/tsudoi-completion-dictionary/README.md) | `textDocument/completion`, from dictionary files      |
  | [`@atusy/tsudoi-completion-document`](../packages/tsudoi-completion-document/README.md)     | `textDocument/completion`, from open documents' words |
  | [`@atusy/tsudoi-completion-shell`](../packages/tsudoi-completion-shell/README.md)           | `textDocument/completion`, from a native shell        |

  **Neither bundles its own tsudoi.** Both declare `@atusy/tsudoi-language-server` as a required,
  exact **peer** at `0.1.0-alpha.1` — the framework version is a host-level choice, not a handler's,
  and a plain dependency could leave a second copy in your `node_modules` that your CLI never runs.
  Install the matching framework alpha beside every handler explicitly; Bun and npm may otherwise
  auto-install the required peer.

  **The second one answers two methods and its name says one**, which is worth reading before
  you go looking for a third package: path completion offers a directory's entries without
  reading the size, the modification time or the contents of any of them — only a symlink costs
  a `stat`, to classify it — and the
  item resolution answers for the one item you highlight. **Not the same information fetched
  later**, which is the half the pairing is easy to misread as: a file's size and date are, but
  a directory comes back with the **names inside it**, and the completion never asked what was
  inside the entries it offered. They ship together because the resolution recognises an item by
  a mark the completion wrote onto it — unpublished, so that the two can keep changing how they
  agree.

- **No protocol package is named** by any of them, and that is what tsudoi re-exporting its own
  dependencies buys: the copied modules and the installed packages alike name protocol types
  freely and still depend on nothing but tsudoi. They take
  them from the `deps/` subpaths and not from tsudoi's own module -- `CompletionParams` from
  `@atusy/tsudoi-language-server/deps/protocol`, which carries the protocol's request and params types, and
  `CompletionItem`, `MarkupContent`, `Position`, `WorkspaceFolder` and `DiagnosticSeverity` from
  `@atusy/tsudoi-language-server/deps/types`, which carries the data types a handler reads or builds.
  `CompletionItemKind` comes from that second one as well, and it is why those are not all
  `import type`: it is a **value**, and an item's `kind` is one of its members. What
  `@atusy/tsudoi-language-server/types` carries is tsudoi's OWN names -- `MethodHandler`, `RequestContext`,
  `TsudoiConfigFactory` -- which is why the quickstart config above needs nothing beyond it and
  a handler module needs more: a config names no protocol type, and a handler does almost
  nothing else. The test suite runs the copied modules themselves and type-checks them as an
  installed consumer receives them; the packages are type-checked under their own configs,
  through the same resolution a stranger takes. Neither can drift from what tsudoi does or from
  what it publishes.

- **The published surface is five subpaths**, split by ORIGIN rather than by topic:
  `@atusy/tsudoi-language-server/types` is tsudoi's own names, written in `packages/tsudoi-language-server/src/types.ts`, and
  `@atusy/tsudoi-language-server/deps/protocol`, `@atusy/tsudoi-language-server/deps/types`,
  `@atusy/tsudoi-language-server/deps/textdocument` and `@atusy/tsudoi-language-server/deps/error`
  re-export the packages tsudoi depends on. The last one exposes the runtime `ResponseError` and
  `LSPErrorCodes` values a method handler uses to choose an LSP error response. The line tsudoi draws is OURS
  versus THEIRS; the line between the four `deps/` subpaths is upstream's own packaging, which
  you reach past rather than reason about.
