# @atusy/tsudoi-completion-around

Completes from the words already written **around the cursor** in the buffer being edited — the
completion every editor has had for thirty years, for a
[tsudoi](https://github.com/atusy/tsudoi-language-server) server that understands nothing about
the language it is serving.

Modelled on [ddc-source-around](https://github.com/Shougo/ddc-source-around), and faithful to what
that source's **code** does rather than to what its README says: the two disagree about `maxSize`,
and the code wins.

<!-- snippet -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { completionAround } from "@atusy/tsudoi-completion-around";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: { "textDocument/completion": completionAround() },
  });

export default config;
```

**It needs tsudoi at run time, whatever the manifest says.** `@atusy/tsudoi-language-server` is
declared an **optional** peer here, and that is knowingly false — this package imports from it and
its handler is meaningful nowhere else. The flag buys installability while tsudoi is
**unpublished**; install this without it and the first thing you see is
`Cannot find module '@atusy/tsudoi-language-server/types'`. Nothing corrects the manifest anywhere
except this paragraph.

## What it offers

Every distinct word in a window of lines around the cursor, in the order each was **first seen**.

| option        | default              | what it decides                                                  |
| ------------- | -------------------- | ---------------------------------------------------------------- |
| `maxSize`     | `200`                | lines read above **and** below the cursor, clamped to the buffer |
| `minLength`   | `2`                  | the shortest match worth offering                                |
| `maxColumns`  | `200`                | a line at or over this length is skipped **whole**               |
| `wordPattern` | `/[\p{L}\p{N}_]+/gu` | what counts as a word                                            |

`wordsIn` and `windowAround` are exported too, so a handler of your own can take the words with a
different window — the whole buffer, one function, a selection — without reimplementing the
filters.

## What bounds it

**The window is the point.** Reading `maxSize` lines either side rather than the whole buffer is
what makes this cheap enough to run on every keystroke of a file of any size, and it is why a word
far away is not offered even though it is in the same file.

**A long line is skipped, not truncated.** Minified output, a base64 blob and a generated table are
exactly the lines whose "words" nobody wants and whose scan costs the most, so a line at or over
`maxColumns` contributes nothing at all.

**Nothing is filtered against what you have typed.** ddc narrows candidates itself; LSP gives that
job to your editor, so this hands over the window's words and lets the editor match them. That is
also why the word under your cursor is among them — excluding it would be this package overruling a
decision your editor already makes, and would be wrong when you are retyping a word that appears
elsewhere.

**The default pattern is not ASCII-only**, which is this package's one departure from the
reference. ddc takes vim's `iskeyword`, so a buffer's own language is accounted for before its
source runs; tsudoi has no equivalent, and an ASCII default would offer nothing at all in a
Japanese, Greek or Cyrillic buffer — failing as an empty popup rather than as an error.

**It knows no language, and says so.** Every item is `CompletionItemKind.Text` and carries
`detail: "around"`, so a popup fed by several sources shows which suggestions are guesses from the
buffer and which came from a real analysis.

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

Then, in `tsudoi-language-server/packages/tsudoi-completion-around/`:

<!-- handler-pack in=packages/tsudoi-completion-around -->

```sh
bun pm pack --filename tsudoi-completion-around.tgz
```

**With `--filename`, the tarball does not land in that directory.** `bun pm pack --filename` run inside a workspace member
writes to the workspace **root**, so what you just built is
`tsudoi-language-server/tsudoi-completion-around.tgz`, not something under `packages/`. Then, in
your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-completion-around.tgz
```

**Which of these the test suite runs**, so you know what the commands above are worth: the **pack**
command is extracted from this file and executed, and the file it writes is compared against the
path the install line names. The **install** command is read and never run — the suite builds a
consumer by a different route — so what is checked is the `../` checkout prefix it starts with and
the tarball name it ends with, and NOT the command that installs them nor anything between:
`bun frobnicate` that same path passes every check this repository has.

## License

MIT
