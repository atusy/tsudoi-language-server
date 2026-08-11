# @atusy/tsudoi-completion-path

Filesystem path completion for a [tsudoi](https://github.com/atusy/tsudoi-language-server)
config, with the item-resolution half in the same package.

## What it answers

**Two methods, which the package name cannot say.**

| method                    | export            | what it does                                                                             |
| ------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `textDocument/completion` | `completePath`    | offers the entries of the one directory the fragment under the cursor names              |
| `completionItem/resolve`  | `resolvePathStat` | when you highlight an entry: a file's size and modification date, a directory's contents |

<!-- snippet -->

```ts
import { completePath, resolvePathStat } from "@atusy/tsudoi-completion-path";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": async function* (context, params) {
        yield* completePath(context, params);
      },
      "completionItem/resolve": resolvePathStat,
    },
  });

export default config;
```

**The dependence runs one way**, and that is why they ship together. `completePath` stands on its
own: register it, leave the resolve half out, and you get the listing — only with nothing added to
the item you highlight, neither a file's size and date nor a directory's contents. The resolve half
is the one that cannot. It recognises an item by a mark the completion handler wrote onto it, and
that mark is not published — it is an agreement between two modules, not a promise to you. tsudoi
refuses a config supplying the resolve method with no completion handler beside it, so that
arrangement is rejected when the config loads rather than left to disappoint you at the first
request.

The completion **streams**: it yields the listing in batches, so a client that sent a
`partialResultToken` sees the first entries while the rest is still being read. No entry's
**size, modification time or contents** is read here — that is exactly the work `resolvePathStat`
defers to the one item you highlight, and it is narrower than _no metadata_, which the next
sentence would contradict. Classifying an entry is cheaper but not free: an ordinary file or
directory is told apart from the directory listing alone, and a **symlink** costs one `stat`, to
report the kind of what it points at.

**Which field carries what**, because they are read at different moments, or by different
parts of an editor. The **label** is the entry's own name — `deep.txt`, never `notes/deep.txt`,
so a listing does not spend its width repeating the directory you have already typed — while
`filterText` and `insertText` both carry the whole thing, directory part and all. That is not
duplication: the item's edit range starts where the fragment does, and an editor that reads
`filterText` and derives the typed text from that range — which the specification does not
require and not every editor does — is matching against text that still includes `notes/`, so
an item filtering on the bare name would be dropped by the separator you just typed. None of
the three is sanitised — `insertText` is written into your buffer as it stands, `filterText`
must equal it, and a client can be configured to drop an item whose label it cannot find in the
word it completes.
`detail` carries the **absolute path** the item
completes to, on one line — a name holding a line break or a control character is rendered, not
reproduced — and it is there the moment the list appears, in the field a client can show inline
beside the label without opening anything. The documentation block carries **which root** offered
the item, which no reading of the path recovers: one file is reachable from your document's
directory, the process's own, a workspace folder and an absolute fragment at once. Every fact in
that block is **labelled** — `source:`, `size:`, `lastModified:` — so you find the one you want
by its name rather than by counting fields in a sentence. One caveat you may hit before we do:
inline is where clients **truncate**, and a path's discriminating part is its tail.

**What resolving one item costs**, since it is no longer a single `stat`: a directory is also
listed, in full, and the count you are shown is the whole of it. What resolve **changes** is the
block and nothing else — the item's own `detail` comes back byte for byte as you sent it — so
a client that honours only `documentation` from a late answer still gets everything that was
learned. The block **only grows**: what you were already reading stays where it was, and the
facts a `stat` found and the listing arrive after it. A file gains `size:` and `lastModified:`;
a directory gains `lastModified:` and **no byte count** — a directory's own size is its directory
entry's, 64 on one machine and 4096 on the next for the same children, so it would tell you
nothing about the files inside. Nothing in the block names the **kind**: the missing `size:` is
what says you are looking at a directory, and the entries below it are the other half. The
modification time is reported **to the second**.

The names **rendered** are bounded — a directory of thousands would otherwise put its whole
contents in one popup — and they arrive under a heading that says how many of how many you are
being shown: `Entries (first 20 of 3184)` when it had to stop, `Entries (12)` when it did not,
and `Entries (0)` for a directory holding nothing, which is otherwise the same bytes as a
directory nobody listed. Hidden entries are shown, unfiltered, because the completion half offers
them too —
**after the ordinary ones**, since `.` sorts before every letter and a directory holding as many
dotfiles as the bound would otherwise show you nothing else. The trade is stated rather than
hidden: in a directory with more ordinary entries than fit, the dotfiles are what you do not see.
Nothing recurses here either: one listing, one level, no walk.

## What bounds it

**Whitespace ends a path.** The fragment under the cursor is scanned back to the nearest
whitespace, so this serves documents where a path is a bare run of non-space characters. A
filename containing a space is still reachable — the scan produces widening candidates and the
first one that names something on disk wins — but a document that **quotes, escapes or
comma-separates** its paths is served by a handler of its own rather than by a setting on this
one. There is no option to change the rule, deliberately: an author who needs another writes a
handler, and this package stays a thing that works rather than a thing that is configured.

Two more limits worth knowing before you turn it on:

- **Nothing recurses.** One fragment is answered by ONE directory listing filtered by the
  fragment's trailing name. Unbounded walks, recursion depth and symlink cycles are not
  unhandled here but unrepresentable.
- **The answer is not marked incomplete, and it should be.** A completion handler yields
  `CompletionItem[]`, which the specification treats as `isIncomplete: false` — a positive claim
  that the set is final. It is not: the next keystroke changes the filter and often changes the
  directory. The wrongness is in tsudoi's published type, not in this package, and no value
  either could produce says otherwise.

Two things depend on **your editor** rather than on this package: items carry an
`InsertReplaceEdit` only where the client declared `insertReplaceSupport`, and the workspace
source contributes nothing unless the client sends `workspaceFolders` at `initialize`. Neither
absence produces an error — the completion is simply narrower — so check your client before
concluding this package is broken.

## It needs tsudoi at run time, and its manifest will not warn you

This package declares `@atusy/tsudoi-language-server` as a **peer**, because the framework is
yours to choose: a plain dependency would pin a range of its own and leave a second copy in your
`node_modules` that your server never runs.

It also marks that peer **`optional`**. That flag reads as _this works without tsudoi_ and is
**false** — the handlers are typed against tsudoi and one imports a value from it, so a project
that installed only this package fails at config load with
`Cannot find module '@atusy/tsudoi-language-server/deps/types'`. The flag buys one thing and
buys it only while tsudoi is **unpublished**: without it your installer goes looking in a
registry for a name nobody has put anywhere, and the install itself fails. Install this into a
project that already has tsudoi, and never into an empty one.

**Nothing else comes with it.** Everything these handlers reach for is a `node:` builtin, so
installing this package adds nothing to your tree but itself.

## Installing it

Neither this package nor tsudoi is published to any registry. The working route is a local
tarball built out of a checkout, and it assumes you have already installed tsudoi itself — the
quickstart in the [repository's README](https://github.com/atusy/tsudoi-language-server#readme) is
what does that.

Packing compiles the package, and its build reaches tsudoi through a link inside the checkout
that `bun install` does not create. In a checkout where nothing else has run, the pack fails
with `error TS2307: Cannot find module '@atusy/tsudoi-language-server/types'`, naming this
package's own source for a fault that lives in `node_modules`. `bun test` in the checkout writes
the link and clears it; so does `bun run scripts/typecheck-workspaces.ts`.

Then, in `tsudoi-language-server/packages/tsudoi-completion-path/`:

<!-- handler-pack in=packages/tsudoi-completion-path -->

```sh
bun pm pack --filename tsudoi-completion-path.tgz
```

**With `--filename`, the tarball does not land in that directory.** `bun pm pack --filename` run inside a workspace member
writes to the workspace **root**, so what you just built is
`tsudoi-language-server/tsudoi-completion-path.tgz`, not something under `packages/`. Then, in
your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-completion-path.tgz
```

**Which of these the test suite runs**, so you know what the commands above are worth: the
**pack** command is extracted from this file and executed, and the file it writes is compared
against the path the install line names. The **install** command is read and never run — the
suite builds a consumer by a different route — so what is checked is the `../` checkout prefix it
starts with and the tarball name it ends with, and NOT the command that installs them nor
anything between: `bun frobnicate` that same path passes every check this repository has.

## License

MIT.
