# `@atusy/tsudoi-kakehashi-prepare-virtual-document`

Makes a [tsudoi](https://github.com/atusy/tsudoi-language-server) server the peer
[kakehashi](https://github.com/atusy/kakehashi) asks before it sends embedded code to a language
server. It answers the custom request `kakehashi/virtualDocument/prepare`.

Embedded code is often not valid as written. The bash inside a Nix `''…''` string is indented by
the Nix file, starts after a line break, and has `${…}` interpolations where a shell expects
words. kakehashi sends each such _virtual document_ to a peer as segments — `content` it found
injected, and `gap`s of host text between them — and the peer answers how to present it. This
package answers with three rules:

| rule        | default | what it does                                                             |
| ----------- | ------- | ------------------------------------------------------------------------ |
| `dedent`    | `true`  | removes the indentation every line of text shares                        |
| `trimEdges` | `true`  | drops the blank lines that open and end the document                     |
| `gap`       | unset   | replaces a gap with text you choose; unset keeps what kakehashi presents |

kakehashi keeps every coordinate: hovers, diagnostics, completions and formatting edits land in
the host file where they belong, with the indentation this package removed put back.

<!-- snippet -->

```ts
import {
  advertiseVirtualDocumentPrepare,
  prepareVirtualDocument,
} from "@atusy/tsudoi-kakehashi-prepare-virtual-document";
import type { RequestContext, TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

// Fill an interpolation, keep everything else between two pieces of content.
const interpolation = (placeholder: string) => (gap: { content: string }) =>
  gap.content.startsWith("${") ? placeholder : undefined;

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      initialize: (context) =>
        Promise.resolve(advertiseVirtualDocumentPrepare(context.preparedResult)),
    },
    customMethods: {
      "kakehashi/virtualDocument/prepare": (context: RequestContext, params: unknown) =>
        prepareVirtualDocument(context, params, {
          gap: interpolation("0"),
          languages: {
            python: { gap: interpolation("None") },
            sql: { gap: interpolation("$1") },
          },
        }),
    },
  });

export default config;
```

**Both halves are needed.** kakehashi asks only a server whose `initialize` result carries
`capabilities.experimental.kakehashi.virtualDocumentPrepare`, and tsudoi advertises nothing for a
custom method on its own. `advertiseVirtualDocumentPrepare` adds that one capability to the result
tsudoi prepared and keeps the rest.

On the kakehashi side the feature is experimental (`KAKEHASHI_EXPERIMENTAL=true`), and the peer is
chosen among the servers bridged for the injected language. Three entries of `kakehashi.toml` make
this server that peer for the injections of one host language, Nix here:

- `[languageServers.tsudoi]` with a `cmd` that starts tsudoi on this config, and
  `languages = ["*"]` (or the languages it prepares);
- `[languages.nix.bridge._.aggregation."kakehashi/virtualDocument/prepare"]` with
  `priorities = ["tsudoi"]`. Name the peer at the prepare key itself: an `_` entry written to keep
  it out of the other methods may otherwise decide this one too;
- `[languages.nix.bridge._.aggregation._]` with `priorities` naming the language servers, which
  keeps the peer out of every other method of the languages it prepares.

kakehashi's own documentation, under _Preparing Virtual Documents_, has the configuration in full.

**Name the peer only where it is needed.** kakehashi treats every document of a pair that has a
peer as prepared, one this package answers `null` for included, and a prepared document has
limits a plain one has not: completion snippets that break a line are refused, and a document
with gaps takes no edit at all (see _What bounds it_).

## Options

Options are the **third argument**, so the handler can be registered as it is when the defaults
suit you: `"kakehashi/virtualDocument/prepare": prepareVirtualDocument`.

| option      | default | effect                                                                         |
| ----------- | ------- | ------------------------------------------------------------------------------ |
| `dedent`    | `true`  | remove the common indentation                                                  |
| `trimEdges` | `true`  | drop blank lines at the document's edges                                       |
| `gap`       | unset   | a string for every gap, or a function of the gap returning text or `undefined` |
| `languages` | `{}`    | the same three, by the virtual document's `languageId`                         |

A language's rule overrides the shared one **field by field**, so
`{ gap: "0", languages: { python: { gap: "None" } } }` still dedents Python.

**`dedent`** removes the longest run of spaces and tabs that every line of text starts with — a
common _prefix_, so a tab is never traded for spaces. Whitespace-only lines lose what they share of
it and never decide it. A line that opens with a gap counts, with the indentation before the gap,
when the gap is filled or text follows it on the line; the indentation before a closing delimiter
does not.

**`trimEdges`** deletes the blank lines before the first line of text and after the last, and the
indentation of an indentation-only last line (the one before a closing `''`). A shebang after the
line break that follows `''` becomes line 1. A document of whitespace alone is left as it is: its
lines are where you are about to type.

**`gap`** decides what a server sees in place of host text. A function receives
`{ content, languageId, hostLanguageId }` — the host text of the gap, on as many lines as it has,
and both languages — and returns the replacement, of any length and on as many lines as you like,
or `undefined` to keep the gap. A kept gap is what kakehashi presents without a peer: whitespace as
wide as the host text, with its line breaks.

Not every gap is an interpolation. When one query combines several host strings into one
document, the host code between two strings is a gap too, and it holds a line break. Fill only
what you recognise — the snippet above fills gaps starting with `${` — and keep the rest: **a
kept gap that holds a line break separates the content before it from the content after it, and
each side is dedented on its own**, as each host string is. A filled gap joins its sides into one
text.

## What bounds it

The answer is **a function of the request and the options alone**. Nothing is remembered between
requests, and the handler never reads its context, so kakehashi may ask in any order and cache what
it is told; a `gap` function should be as pure.

kakehashi accepts only changes it can map back, and refuses the whole answer otherwise — leaving
the document unsent, never sent unprepared. This package therefore emits nothing it is unsure of:

- **Only spaces and tabs are indentation**, and only at the start of a line. Text after a gap on
  the same line is never dedented.
- **Blank lines beside a gap stay**: only the edges of the whole document are trimmed, so the
  line break opening the _second_ of two combined strings remains.
- **A fill that would join a lone CR and an LF into one line break is not used** (the gap is
  kept), and a whitespace-only line between a lone CR and an LF keeps its whitespace.
- **A request it cannot read is refused** with an error rather than answered: an error tells
  kakehashi the peer failed, where `null` would say "send it as it is".

Two limits come from the protocol rather than from this package. The request carries a gap's host
text but not what the virtual document holds for it, and what may be deleted depends on where that
document's lines start. This package reads it off how kakehashi builds one: content after a gap
starts a line exactly when the gap's host text holds a line break. And kakehashi closes
edit-producing methods (completion, formatting, rename, code actions) on a prepared document that
has gaps.

## It needs tsudoi at run time

Tsudoi is a required **peer** at `0.1.0-alpha.2`, the version this alpha set was tested against.
This package does not bundle or choose it, though Bun and npm may auto-install the required peer.
Its imports from tsudoi are type-only and nothing else comes with it: installing this package adds
nothing to your tree but itself.

## Installing it

Install the matching npm alphas together with
`bun add @atusy/tsudoi-language-server@alpha @atusy/tsudoi-kakehashi-prepare-virtual-document@alpha`.

For testing a source checkout, first follow the
[repository guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md#quickstart)
so the checkout contains tsudoi's built package.

Packing needs a workspace link that `bun install` does not create. In a fresh checkout,
`bun pm pack` can fail with `TS2307` naming the tsudoi type import. Running
`bun run scripts/typecheck-workspaces.ts` creates the required link and verifies the member before
packing.

Then, in `tsudoi-language-server/packages/tsudoi-kakehashi-prepare-virtual-document/`:

<!-- handler-pack in=packages/tsudoi-kakehashi-prepare-virtual-document -->

```sh
bun pm pack --filename tsudoi-kakehashi-prepare-virtual-document.tgz
```

The tarball is written at the workspace root. In your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-kakehashi-prepare-virtual-document.tgz
```

The pack command is extracted and **executed** by this repository's tests. The install command is
**never run** there; its path is checked, **not the command** or its package-manager behavior.

## License

MIT.
