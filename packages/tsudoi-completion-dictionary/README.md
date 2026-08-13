# `@atusy/tsudoi-completion-dictionary`

Completes each line of one or more UTF-8 dictionary files through
`textDocument/completion`. The files are indexed in a background Worker and persisted in SQLite,
so a request reads the last committed entries rather than waiting for a changed file to be hashed
and registered.

This package uses SQLite's indexed prefix range directly. It does not build a second in-memory
trie: the database is already the persistent search index, and a trie would duplicate its entries
and need another consistency boundary.

<!-- snippet -->

```ts
import { useDictionaryCompletion } from "@atusy/tsudoi-completion-dictionary";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const completeDictionary = await useDictionaryCompletion({
  files: ["/usr/share/dict/words"],
});

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: { "textDocument/completion": completeDictionary },
  });

export default config;
```

The factory waits for SQLite to open and for its schema to exist. It does **not** wait for any
dictionary file to be registered. Registration begins immediately in a Worker; completion during
that work reads the previous committed generation, or yields nothing when the database has never
held that file.

Tsudoi is an `optional` **peer** only because tsudoi is **unpublished**. This package does not
install it. Its JavaScript artifact can load without tsudoi because the handler imports are
type-only, but a TypeScript consumer needs the peer to resolve the public handler types, and the
returned handler is useful only inside a tsudoi host. The flag means the package manager must not
fetch an unavailable peer; it does not make the host relationship optional. Consequently, a
missing peer is a TypeScript resolution error such as `TS2307`, not the runtime message
`Cannot find module` that a value import would produce.

## Options

| option              | default                   | effect                                                       |
| ------------------- | ------------------------- | ------------------------------------------------------------ |
| `files`             | required                  | dictionary files, resolved against the factory's current cwd |
| `databasePath`      | the user's platform cache | a dedicated persistent SQLite database file                  |
| `minPrefixLength`   | `2`                       | minimum non-whitespace text before the cursor                |
| `maxItems`          | `500`                     | maximum distinct entries returned                            |
| `refreshIntervalMs` | `1000`                    | throttle while no refresh is already running                 |
| `onError`           | no callback               | observes background file, hash, Worker, and SQLite failures  |

Paths are deduplicated after they become absolute. Each non-empty line is one entry: CRLF loses
its `\r`, a final line needs no newline, and surrounding spaces are preserved. Matching ignores
case by storing a lowercase search key; the original line is returned unchanged.

`databasePath` is owned as a rebuildable cache by this package. Initialization refuses a database
that already contains unrelated application tables instead of migrating or deleting their schema.

## What bounds it

Prefix filtering happens in SQLite **rather than** loading the whole dictionary into JavaScript.
`minPrefixLength` prevents very broad queries, `maxItems` bounds the response, and
`refreshIntervalMs` prevents every idle keystroke from starting another hash pass. Requests that
arrive during one refresh coalesce into one follow-up scheduled at that interval, so sustained
typing cannot create an uninterrupted chain of Workers. Registration still reads every byte of a
file whose refresh runs because the content hash, not mtime or size, is the authority for whether
its entries changed. Changed files are streamed a second time to decode and insert their lines;
peak JavaScript memory is bounded by stream buffers and the longest individual line rather than
the whole dictionary.

The limits bound a request and refresh frequency, not database size, processing time, or an
individual line's size. Old generations are removed in the transaction that publishes a new
generation. Rows for paths no factory currently names may remain in a shared database, but queries
include only the factory's own normalized `files`.

## Failure and concurrency semantics

The reader and background writer use separate SQLite connections in WAL mode. A file update writes
a new generation and switches the active generation in one transaction. Before commit a request
sees the complete old generation; after commit it sees the complete new one. A read, UTF-8 decode,
hash, or write failure rolls back and leaves the old generation active. `onError` receives the
failure; with no callback, background failures are deliberately silent and retried by a later
refresh.

Bun and Deno name their native SQLite modules differently. The built artifact selects
`bun:sqlite` under Bun and `node:sqlite` under Deno only after detecting the runtime, so neither
runtime resolves the other's module. CPU and synchronous SQLite work for registration stays in the
Worker; the small indexed read remains in the completion request.

## Installing it

Neither this package nor tsudoi is published to a registry. First follow the
[repository quickstart](https://github.com/atusy/tsudoi-language-server#quickstart) so the checkout
contains tsudoi's built package.

Packing needs a workspace link that `bun install` does not create. In a fresh checkout,
`bun pm pack` can fail with `TS2307` naming the tsudoi type import. Running
`bun run scripts/typecheck-workspaces.ts` creates the required link and verifies the member before
packing.

Then, in `tsudoi-language-server/packages/tsudoi-completion-dictionary/`:

<!-- handler-pack in=packages/tsudoi-completion-dictionary -->

```sh
bun pm pack --filename tsudoi-completion-dictionary.tgz
```

The tarball is written at the workspace root. In your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-completion-dictionary.tgz
```

The pack command is extracted and **executed** by this repository's tests. The install command is
**never run** there; its path is checked, **not the command** or its package-manager behavior.

## License

MIT
