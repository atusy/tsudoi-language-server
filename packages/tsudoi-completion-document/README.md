# @atusy/tsudoi-completion-document

Completes from the words **already written in the documents you have open** — the completion every
editor has had for thirty years, for a
[tsudoi](https://github.com/atusy/tsudoi-language-server) server that understands nothing about
the language it is serving.

| handler          | answers                   | reads                                                |
| ---------------- | ------------------------- | ---------------------------------------------------- |
| `completeAround` | `textDocument/completion` | a window of lines either side of the cursor          |
| `completeCorpus` | `textDocument/completion` | every document the client has opened, cursor ignored |

**One source, two amounts of it.** `completeAround` answers _what am I writing about here_;
`completeCorpus` answers _what do we call things in this project_. The second cannot be had from a
window and the first is drowned by a corpus, so they are two handlers rather than one with a wider
bound. They take the same arguments, so learning one is learning both.

`completeAround` is modelled on [ddc-source-around](https://github.com/Shougo/ddc-source-around),
and faithful to what that source's **code** does rather than to what its README says: the two
disagree about `maxSize`, and the code wins.

<!-- snippet -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { completeAround } from "@atusy/tsudoi-completion-document";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: { "textDocument/completion": completeAround },
  });

export default config;
```

**Both at once.** A completion handler is one row of the request table, so offering both means one
handler that delegates to each in turn. Yield `completeAround` first and its words are the ones
tsudoi sends first — what your editor then shows first is its own decision, as below:

<!-- snippet -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { completeAround, completeCorpus } from "@atusy/tsudoi-completion-document";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": async function* (context, params) {
        yield* completeAround(context, params);
        yield* completeCorpus(context, params);
      },
    },
  });

export default config;
```

**The overlap is yours to keep or drop.** `completeCorpus` reads every open document **including
the one under your cursor**, so a word near the cursor is offered by both — once as `around`, once
as `corpus`. Neither handler drops it: skipping the cursor's document would make `completeCorpus`
answer differently depending on what else you installed, and clients do not merge items by label.
If the duplicate bothers you, filter the second stream in the arrow above.

**It needs tsudoi at run time, whatever the manifest says.** `@atusy/tsudoi-language-server` is
declared an **optional** peer here, and that is knowingly false — this package imports from it and
its handlers are meaningful nowhere else. The flag buys installability while tsudoi is
**unpublished**; install this without it and the first thing you see is
`Cannot find module '@atusy/tsudoi-language-server/types'`. Nothing corrects the manifest anywhere
except this paragraph.

## What it offers

Every distinct word, in the order each was **first seen** — for `completeAround` that is the window
top-down, for `completeCorpus` it is the documents in the order your client opened them.

| option       | default          | `around` | `corpus` | what it decides                                                  |
| ------------ | ---------------- | -------- | -------- | ---------------------------------------------------------------- |
| `maxSize`    | `200`            | yes      | —        | lines read above **and** below the cursor, clamped to the buffer |
| `minLength`  | `2`              | yes      | yes      | the shortest match worth offering                                |
| `maxColumns` | `200`            | yes      | yes      | a line at or over this length is skipped **whole**               |
| `scanner`    | `defaultScanner` | yes      | yes      | where one line's words come from                                 |

Options are the **third argument**, so a handler goes in as it stands when the defaults suit you
and behind one arrow when they do not:
`(context, params) => completeAround(context, params, { maxSize: 50 })`. That is the same shape
`completePath` has in the sibling package, so installing both means learning one convention.

`wordsIn` and `windowAround` are exported too, so a handler of your own can take the words over
lines neither of these would choose — one function, a selection, a file nobody has opened —
without reimplementing the filters.

## Which words, and how to change your mind about it

`scanner` is a **function**, `(line: string) => Iterable<string>`, and it is the one thing here you
are most likely to replace. Two are shipped:

| scanner                    | finds words by                             | good for                                               |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| `regexScanner(pattern?)`   | matching a `RegExp` (`defaultWordPattern`) | code and any language that puts spaces between words   |
| `segmentScanner(locales?)` | asking `Intl.Segmenter`                    | Japanese, Thai, Khmer — languages that write no spaces |

**`segmentScanner` is how you get Japanese completion**, and it is why `scanner` is a callback
rather than a pattern: no character class can find a word boundary in text that writes none.

<!-- snippet -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { completeCorpus, segmentScanner } from "@atusy/tsudoi-completion-document";

// BUILT ONCE, OUTSIDE THE HANDLER. See below -- inside it, the memo never hits.
const scanner = segmentScanner("ja");

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": (context, params) =>
        completeCorpus(context, params, { scanner, minLength: 1 }),
    },
  });

export default config;
```

**Build your scanner once, outside the handler.** `completeCorpus` remembers each document's words
and keys that memory on your scanner **by identity** — a function is not comparable any other way.
A scanner built inside the arrow that calls the handler is therefore a new key on every keystroke,
and every open document is rescanned every time. The answers stay right; the memo is simply gone,
and nothing warns you.

**Name the locale.** With none, the default is resolved by the runtime — measured on one machine as
`en-US` under bun and `ja-JP` under deno, because each picks its own fallback.

**`minLength: 1` if you want single-character Japanese words.** The default of `2` is measured in
characters, and `誰`, `本`, `人` are ordinary words; the cost is that one-letter Latin candidates
come back too.

**A digit does not stop a segment being a word.** `Intl.Segmenter` reports an `isWordLike` flag and
this scanner ignores it, because the two runtimes disagree: measured at bun 1.3.13 and deno 2.9.4,
bun calls every segment containing a digit — `sha256`, `utf8`, `v2`, `123` — not word-like where
deno calls them all word-like. The **boundaries** agreed exactly, so this reads those and decides
admission itself, and `sha256` is offered under both.

## What bounds it

**The window is the point, for `completeAround`.** Reading `maxSize` lines either side rather than
the whole buffer is what makes it cheap enough to run on every keystroke of a file of any size, and
it is why a word far away is not offered even though it is in the same file. `completeCorpus` is
the handler for that word.

**`completeCorpus` bounds nothing and remembers instead.** There is no limit on how many documents
it reads, because every rule for choosing which to drop — most recently opened, nearest the
cursor's file, largest first — is a guess about your attention that this package cannot check.
What keeps it off the keystroke is a memo: a document is scanned again when its **version** moves,
so the files you are not typing in are not rescanned. Reopening a file rescans it too, even at the
same version number — a version counts within one `didOpen` and not across the session. So does
changing `minLength`, `maxColumns` or `scanner` between requests, since those change the answer
without the document moving at all — and a scanner counts as changed whenever it is a different
function, which is why you build it once.

**Neither says _ask me again_.** Both hand over a complete list, and there is no way for a tsudoi
handler to say otherwise — the protocol's `isIncomplete` is not something this framework's
completion row can express. So `completeCorpus` cannot offer a partial answer while it finishes
indexing: it scans, then answers. Everything it reads is already in memory, so there is no wait to
break up.

**A long line is skipped, not truncated.** Minified output, a base64 blob and a generated table are
exactly the lines whose "words" nobody wants and whose scan costs the most, so a line at or over
`maxColumns` contributes nothing at all.

**Nothing is filtered against what you have typed.** ddc narrows candidates itself; LSP gives that
job to your editor, so these hand over their words and let the editor match them. That is also why
the word under your cursor is among them — excluding it would be this package overruling a
decision your editor already makes, and would be wrong when you are retyping a word that appears
elsewhere. Nothing is sorted either, and no `sortText` is sent: your editor ranks the list, and an
order chosen here would compete with its own fuzzy score.

**A run of letters is a word only where the writing system puts spaces between them**, and the
default pattern knows that — which is the bound on `regexScanner`, not on this package: reach for
`segmentScanner` and these languages are segmented properly rather than skipped. Han, Hiragana,
Katakana, Thai, Lao, Khmer and Myanmar are left out of `defaultWordPattern`, so
`[NeovimのLSPで誰にどうして怒られたのかを確認するための設定]` offers `Neovim` and `LSP` instead of
thirty characters of prose as a single candidate — which is what the first version of this default
did, swallowing both Latin words in the process.

**That is about segmentation, not about being non-Latin.** Korean, Greek, Cyrillic, Hebrew, Arabic
and the Indic scripts all separate their words, so theirs survive. Combining marks count as part of
a word, which is what keeps `हिन्दी` and a pointed `שָׁלוֹם` whole rather than splitting them at
every mark.

`defaultWordPattern` is exported, so widening it is a line rather than a rewrite —
`regexScanner(new RegExp(`${defaultWordPattern.source}|\p{scx=Han}+`, "gu"))` puts Han characters
back as single candidates. That is worth knowing and is the lesser answer: `segmentScanner` finds
the actual words instead of longer runs of them.

**The pattern is this package's, not the reference's** — what is inherited is the `gu` flags.
ddc-source-around has no default of its own: it takes ddc's `keywordPattern` source option,
documented as `\k*`, and ddc rewrites `\k` into a class built from the buffer's `iskeyword`. tsudoi
has no such setting to read, so something had to be chosen.

**They know no language, and say so.** Every item is `CompletionItemKind.Text` and carries
`detail: "around"` or `detail: "corpus"`, so a popup fed by several sources shows which suggestions
are guesses from a buffer, which are guesses from the whole session, and which came from a real
analysis.

## Installing it

Neither this package nor tsudoi is published to any registry. The working route is a local tarball
built out of a checkout, and it assumes you have already installed tsudoi itself — the quickstart
in the [repository's README](https://github.com/atusy/tsudoi-language-server#readme) is what does
that.

Packing compiles the package, and its build reaches tsudoi through a link inside the checkout that
`bun install` does not create. In a checkout where nothing else has run, the pack fails with
`error TS2307: Cannot find module '@atusy/tsudoi-language-server/types'`, naming this package's own
source for a fault that lives in `node_modules`. `bun test` in the checkout writes the link and
clears it; so does `bun run scripts/typecheck-workspaces.ts`.

Then, in `tsudoi-language-server/packages/tsudoi-completion-document/`:

<!-- handler-pack in=packages/tsudoi-completion-document -->

```sh
bun pm pack --filename tsudoi-completion-document.tgz
```

**With `--filename`, the tarball does not land in that directory.** `bun pm pack --filename` run inside a workspace member
writes to the workspace **root**, so what you just built is
`tsudoi-language-server/tsudoi-completion-document.tgz`, not something under `packages/`. Then, in
your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-completion-document.tgz
```

**Which of these the test suite runs**, so you know what the commands above are worth: the **pack**
command is extracted from this file and executed, and the file it writes is compared against the
path the install line names. The **install** command is read and never run — the suite builds a
consumer by a different route — so what is checked is the `../` checkout prefix it starts with and
the tarball name it ends with, and NOT the command that installs them nor anything between:
`bun frobnicate` that same path passes every check this repository has.

## License

MIT
