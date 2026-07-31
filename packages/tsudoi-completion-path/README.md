# @atusy/tsudoi-completion-path

Filesystem path completion for a [tsudoi](https://github.com/atusy/tsudoi-language-server)
config, with the item-resolution half in the same package.

## What it answers

**Two methods, which the package name cannot say.**

| method                    | export            | what it does                                                                 |
| ------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `textDocument/completion` | `pathCompletion`  | offers the entries of the one directory the fragment under the cursor names  |
| `completionItem/resolve`  | `resolvePathStat` | fills in that entry's size and modification date when the user highlights it |

```ts
import { pathCompletion, resolvePathStat } from "@atusy/tsudoi-completion-path";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": async function* (context, params) {
        yield* pathCompletion(context, params);
      },
      "completionItem/resolve": resolvePathStat,
    },
  });

export default config;
```

**The dependence runs one way**, and that is why they ship together. `pathCompletion` stands on
its own: register it, leave the resolve half out, and you get the listing — only without the size
and date on the item you highlight. The resolve half is the one that cannot. It recognises an
item by a mark the completion handler wrote onto it, and that mark is not published — it is an
agreement between two modules, not a promise to you. tsudoi refuses a config supplying the
resolve method with no completion handler beside it, so that arrangement is rejected when the
config loads rather than left to disappoint you at the first request.

The completion **streams**: it yields the listing in batches, so a client that sent a
`partialResultToken` sees the first entries while the rest is still being read. No entry's
**detail** is read here — that is exactly the work `resolvePathStat` defers to the one item you
highlight. Classifying an entry is cheaper but not free: an ordinary file or directory is told
apart from the directory listing alone, and a **symlink** costs one `stat`, to report the kind of
what it points at.

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

**The tarball does not land in that directory.** `bun pm pack` run inside a workspace member
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
suite builds a consumer by a different route — so what is checked is its text.

## License

MIT.
