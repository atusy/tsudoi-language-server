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
        completeDictionary(context, params, { maxItems: 1000, minQueryLength: 2 }),
    },
  });

export default config;
```

The factory does **not** wait for a dictionary file to be loaded. Loading begins immediately in a
Worker; completion during that work reads the previous published snapshot, or yields nothing before
the first snapshot has arrived.

Tsudoi is a required **peer** at `0.1.0-alpha.0`, the version this alpha set was tested against.
This package does not install it. Its JavaScript artifact can load without tsudoi because the
handler imports are type-only, but a TypeScript consumer needs the peer to resolve the public
handler types, and the returned handler is useful only inside a tsudoi host.

## Factory options

| option              | default                    | effect                                                       |
| ------------------- | -------------------------- | ------------------------------------------------------------ |
| `files`             | required                   | dictionary files, resolved against the factory's current cwd |
| `filters`           | `[dictionaryPrefixFilter]` | server-side candidate pipeline                               |
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

| option           | default | effect                                                   |
| ---------------- | ------- | -------------------------------------------------------- |
| `maxItems`       | `500`   | maximum distinct candidates after the configured filters |
| `minQueryLength` | `2`     | minimum trailing non-whitespace query that starts lookup |

Both options configure one completion call and must be non-negative safe integers. Set
`minQueryLength: 0` to allow the current dictionary snapshot to answer an empty query. The old
factory-level placement is rejected with migration guidance rather than silently ignored.

## What bounds it

The default prefix filter uses an in-memory binary search to narrow candidates, then applies the
same prefix rule in the LSP handler. `minQueryLength` prevents very broad queries, the invocation's
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

Install the matching npm alphas together with
`bun add @atusy/tsudoi-language-server@alpha @atusy/tsudoi-completion-dictionary@alpha`.

For testing a source checkout, first follow the
[repository guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md#quickstart)
so the checkout contains tsudoi's built package.

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
