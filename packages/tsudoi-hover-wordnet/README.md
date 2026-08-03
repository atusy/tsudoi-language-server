# @atusy/tsudoi-hover-wordnet

Dictionary hover for a [tsudoi](https://github.com/atusy/tsudoi-language-server) config.

## What it answers

| method               | export         | what it does                                                                                        |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `textDocument/hover` | `hoverWordnet` | every WordNet sense of the word under the cursor, or `null` for a word the dictionary does not have |

<!-- snippet -->

```ts
import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = () =>
  Promise.resolve({ methods: { "textDocument/hover": hoverWordnet } });

export default config;
```

The dictionary is loaded **on the first hover** and never twice, rather than at startup: it
costs ~130ms to read, and paying that during the handshake would delay every session including
the ones that never hover. A first load that fails is retried on the next hover instead of being
remembered forever.

Markdown or plaintext, whichever your client said it can render, chosen out of the
`contentFormat` list it declared — a client that declares nothing gets plaintext, since markdown
sent there arrives as its own punctuation.

## What bounds it

**Whitespace is its word rule.** The word under the cursor is the run of non-space characters
around it, full stop. That serves English prose and it does not serve a language whose words are
not whitespace-delimited — Japanese, Chinese and Thai among them — and there is no option to
change it, deliberately: publishing the word rule would not help, since you cannot make this
handler call your version of it. An author who needs another rule writes a handler rather than
configuring this one.

The dictionary is WordNet, so it answers about **English words**. A word it does not hold is
answered `null`, which an editor shows as no hover at all — indistinguishable, from the outside,
from a hover that failed.

## It needs tsudoi at run time, and its manifest will not warn you

This package declares `@atusy/tsudoi-language-server` as a **peer**, because the framework is
yours to choose: a plain dependency would pin a range of its own and leave a second copy in your
`node_modules` that your server never runs.

It also marks that peer **`optional`**. That flag reads as _this works without tsudoi_ and is
**false** — the handler imports a value from tsudoi, so a project that installed only this
package fails at config load with
`Cannot find module '@atusy/tsudoi-language-server/deps/types'`. The flag buys one thing and
buys it only while tsudoi is **unpublished**: without it your installer goes looking in a
registry for a name nobody has put anywhere, and the install itself fails. Install this into a
project that already has tsudoi, and never into an empty one.

**The dictionary comes with it.** This package declares `wordnet` itself (~27MB, MIT), so there
is nothing else for you to add. `wordnet` ships no types, and the declaration that fixes that
lives inside this package and is deliberately **not published** — an ambient `declare module` in
a published package would declare a third party's module on behalf of everyone who installs it.

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

Then, in `tsudoi-language-server/packages/tsudoi-hover-wordnet/`:

<!-- handler-pack in=packages/tsudoi-hover-wordnet -->

```sh
bun pm pack --filename tsudoi-hover-wordnet.tgz
```

**The tarball does not land in that directory.** `bun pm pack` run inside a workspace member
writes to the workspace **root**, so what you just built is
`tsudoi-language-server/tsudoi-hover-wordnet.tgz`, not something under `packages/`. Then, in
your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-hover-wordnet.tgz
```

**Which of these the test suite runs**, so you know what the commands above are worth: the
**pack** command is extracted from this file and executed, and the file it writes is compared
against the path the install line names. The **install** command is read and never run — the
suite builds a consumer by a different route — so what is checked is its text.

## License

MIT.
