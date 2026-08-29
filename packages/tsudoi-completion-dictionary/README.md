# `@atusy/tsudoi-completion-dictionary`

Completes each line of one or more UTF-8 dictionary files through
`textDocument/completion`. A background Worker reads and hashes the files, then completion searches
the last immutable in-memory snapshot rather than waiting for a changed file to be loaded.

The default prefix filter uses a binary search over entries sorted by their case-insensitive search
key. No database or persistent cache is created.

<!-- snippet -->

```ts
import { useDictionaryCompletion } from "@atusy/tsudoi-completion-dictionary";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const completeDictionary = await useDictionaryCompletion({
  files: ["/usr/share/dict/words"],
});

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": (context, params) =>
        completeDictionary(context, params, { maxItems: 1000 }),
    },
  });

export default config;
```

The factory does **not** wait for a dictionary file to be loaded. Loading begins immediately in a
Worker; completion during that work reads the previous published snapshot, or yields nothing before
the first snapshot has arrived.

Tsudoi is an `optional` **peer** only because tsudoi is **unpublished**. This package does not
install it. Its JavaScript artifact can load without tsudoi because the handler imports are
type-only, but a TypeScript consumer needs the peer to resolve the public handler types, and the
returned handler is useful only inside a tsudoi host. The flag means the package manager must not
fetch an unavailable peer; it does not make the host relationship optional. Consequently, a
missing peer is a TypeScript resolution error such as `TS2307`, not the runtime message
`Cannot find module` that a value import would produce.

## Factory options

| option              | default                    | effect                                                       |
| ------------------- | -------------------------- | ------------------------------------------------------------ |
| `files`             | required                   | dictionary files, resolved against the factory's current cwd |
| `filters`           | `[dictionaryPrefixFilter]` | server-side candidate pipeline                               |
| `minPrefixLength`   | `2`                        | minimum non-whitespace text before the cursor                |
| `refreshIntervalMs` | `1000`                     | throttle while no refresh is already running                 |
| `onError`           | no callback                | observes background file, decode, hash, and Worker failures  |

Paths are deduplicated after they become absolute. Each non-empty line is one entry: CRLF loses
its `\r`, a final line needs no newline, and surrounding spaces are preserved. Matching ignores
case by storing a lowercase search key; the original line is returned unchanged.

Filters receive the candidate iterable and `{ typed }`, and may drop, reorder, or rewrite entries.
They run in the order supplied. The result is then deduplicated and bounded by the request's
`maxItems`. Passing `filters: []` disables server-side matching and leaves final filtering to the
LSP client.

    import type { DictionaryFilter } from "@atusy/tsudoi-completion-dictionary";

    const suffixFilter: DictionaryFilter = function* (words, { typed }) {
      for (const word of words) {
        if (word.toLowerCase().endsWith(typed.toLowerCase())) yield word;
      }
    };

    const completeDictionary = await useDictionaryCompletion({
      files: ["/usr/share/dict/words"],
      filters: [suffixFilter],
    });

## Completion options

`maxItems` belongs to one completion call, matching `completeCorpus`, rather than to the long-lived
dictionary factory. It defaults to `500` and must be a non-negative safe integer.

## What bounds it

The default prefix filter uses an in-memory binary search to narrow candidates, then applies the
same prefix rule in the LSP handler. `minPrefixLength` prevents very broad queries, the invocation's
`maxItems` bounds the response, and
`refreshIntervalMs` prevents every idle keystroke from starting another hash pass. Requests that
arrive during one refresh coalesce into one follow-up scheduled at that interval, so sustained
typing cannot create an uninterrupted chain of Workers. Registration still reads every byte of a
file whose refresh runs because the content hash, not mtime or size, is the authority for whether
its entries changed. Only changed files are decoded and transferred back to the handler.

These limits bound request output and refresh frequency rather than dictionary size, processing
time, or an individual line's size. Each tsudoi process keeps its own complete snapshot in memory.
A restart has no persisted snapshot and must load the configured files again before it can offer
candidates.

An arbitrary filter cannot use the prefix index without changing its semantics. A custom pipeline
therefore traverses all entries in the current snapshot before applying its filters and `maxItems`.
Put `dictionaryPrefixFilter` first when possible: that preserves binary-search narrowing while
allowing later stages to transform the matching subset. A pipeline containing only the default
prefix filter also bounds the narrowed input before constructing completion items.

## Failure and concurrency semantics

The Worker constructs complete per-file replacements and sends them in one result. The handler
builds the next combined snapshot before switching its reference, so a request sees either the
complete previous snapshot or the complete next one. A read or UTF-8 decode failure produces no
replacement for that file and leaves its previous entries active. `onError` receives the failure;
with no callback, background failures are deliberately silent and retried by a later refresh.

File I/O, hashing, decoding, and initial line collection stay in the Worker under both Bun and Deno.
Sorting a changed combined snapshot and the small indexed read run in the handler process.

## Installing it

Neither this package nor tsudoi is published to a registry. First follow the
[repository guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md#quickstart) so the checkout
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
