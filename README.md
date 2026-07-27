# tsudoi

tsudoi assembles a Language Server out of one TypeScript file. You write handlers for LSP
methods -- hover, completion -- and tsudoi speaks the protocol, manages the document store and
answers the lifecycle requests an editor expects.

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
  dependency `vscode-languageserver-protocol` unless bun's cache already holds it.

Working on tsudoi itself rather than using it: `bun test` spawns `deno`, so **deno must be on
PATH or `bun test` fails**. It fails rather than skipping, on purpose -- "starts under both
runtimes" is a promise the suite must not be able to stop checking quietly.

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
import type { Tsudoi, TsudoiConfig } from "@atusy/tsudoi/types";

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> =>
  Promise.resolve({
    methods: {
      "textDocument/hover": async (context, params) => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        const line = document?.getText().split("\n")[params.position.line] ?? "";
        return { contents: { kind: "markdown", value: `**${line.trim()}**` } };
      },
    },
  });
```

Two things you cannot guess from the outside:

- The config's **default export is a factory** -- a function tsudoi calls with a `Tsudoi`,
  returning the config. A file that exports the config object itself is rejected, by name.
- Handlers are typed by the method key. `context` and `params` above need no annotations because
  `TsudoiConfig` supplies them; `@atusy/tsudoi/types` is the only import a config needs.

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
completed the handshake. It is **untested** all the same -- `deno run -A` is what the suite
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

## Cleanup in a handler

A `finally` inside a completion handler runs when the editor abandons the request -- which it
does on every keystroke that supersedes the last one. tsudoi **closes the generator** then, so
the cleanup written there happens.

What tsudoi does not promise is that your cleanup **completes**. A `finally` that awaits
something which never settles never finishes, and no server can change that; the request is
already answered `RequestCancelled` by then, and nothing there can be watched succeeding.

## Where to look next

- `examples/tsudoi.config.ts` in this repository is the fuller example: streaming completion,
  hover, and a `finally` that documents when it runs. The test suite runs that file itself, so
  it cannot drift from what tsudoi does.
- `src/types.ts` is the whole published type surface, reachable as `@atusy/tsudoi/types`.
