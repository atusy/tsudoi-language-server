# @atusy/tsudoi-adapter-efm-config

Runs the linters and formatters from your existing
[efm-langserver](https://github.com/mattn/efm-langserver) `config.yaml` under
[tsudoi](https://github.com/atusy/tsudoi-language-server), without restating one tool definition.

One call. It finds the config efm itself would find, reads it, and hands back the tsudoi handlers
it describes:

<!-- snippet -->

```ts
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { loadEfmConfig } from "@atusy/tsudoi-adapter-efm-config";

const config: TsudoiConfigFactory = () => {
  const { methods } = loadEfmConfig();
  return Promise.resolve({ methods });
};

export default config;
```

**It needs tsudoi at run time.** `@atusy/tsudoi-language-server` is a required **peer** at
`0.1.0-alpha.0`, the version this alpha set was tested against. This package does not install the
framework for you: the host chooses the copy its CLI runs, while this package supplies handlers to
that host.

## What it reads

| efm key                                                                      | becomes                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| `format-command`, `format-stdin`                                             | `textDocument/formatting`                              |
| `lint-command`, `lint-stdin`, `lint-formats`, `lint-severity`, `lint-source` | `textDocument/diagnostic`                              |
| `lint-offset`, `lint-offset-columns`, `lint-ignore-exit-code`, `prefix`      | the same                                               |
| `hover-command`, `hover-stdin`, `hover-type`                                 | `textDocument/hover`                                   |
| `commands` (global and per tool)                                             | `textDocument/codeAction` + `workspace/executeCommand` |
| `env`                                                                        | the environment every command above runs in            |

**A handler exists only where your config describes it.** tsudoi derives what your editor is told
from which handlers you declare, so a config with no `format-command` produces no formatting key
and your editor is never told this server formats.

**Commands need the `initialize` handler, and you get it for free.** tsudoi advertises
`executeCommandProvider` with an empty list, and a conforming editor sends no command it was not
told about — so a config with `commands` also gets an `initialize` handler that advertises their
names. Spread `methods` whole and it is there. If you write your own `initialize`, spread
`context.preparedResult.capabilities` into yours or the list is lost.

## What it does not read

- **Multi-line `lint-formats`** — `%E`, `%C`, `%A`, `%+P`, `%-O` and the rest of vim's multi-line
  machinery. efm delegates errorformats to a full Go implementation; this reads the single-line
  forms. **A format it cannot compile is refused when your config loads**, naming the format, so
  a linter never silently reports nothing.
- **`symbol-command`** — that is `textDocument/documentSymbol`, which tsudoi does not serve.
- **`log-file`, `log-level`, `provide-definition`, `root-markers`, `require-marker`,
  `lint-debounce`, `format-debounce`, `lint-after-open`, `lint-on-save`** — these describe efm's
  own process and scheduling. tsudoi serves **pull** diagnostics, so when a linter runs is your
  editor's decision rather than a setting here.
- **Range formatting** — tsudoi serves `textDocument/formatting` only, so `format-can-range` and
  the `charStart`/`charEnd`/`rowStart`/`rowEnd` keys have no values and any `${...}` naming them
  expands to nothing, which is efm's own behaviour for an absent key.

## Two things worth knowing before you rely on it

**`languages` is keyed by Vim filetype; your editor sends an LSP `languageId`.** They agree often
and not always. This package matches the key against the `languageId` **as sent**, plus efm's `=`
any-language key, and writes no translation table — a table here would be this package deciding
what your editor meant. Where they disagree, add the key your editor uses to your own config.

**Your commands run through a shell.** A `lint-command` is routinely a pipeline, so the text in
your config is executed by `sh -c` (or `cmd /c`). That is what efm does, the file is yours, and
this is no safer and no more dangerous than running efm itself.

## Installing it

Install the matching npm alphas together with
`bun add @atusy/tsudoi-language-server@alpha @atusy/tsudoi-adapter-efm-config@alpha`.

For testing a source checkout, the local tarball route below assumes you have already installed
tsudoi itself — the quickstart in the
[repository guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md#quickstart)
does that.

Packing compiles the package, and its build reaches tsudoi through a link inside the checkout
that `bun install` does not create. In a checkout where nothing else has run, the pack fails
with `error TS2307: Cannot find module '@atusy/tsudoi-language-server/types'`, naming this
package's own source for a fault that lives in `node_modules`. `bun test` in the checkout writes
the link and clears it; so does `bun run scripts/typecheck-workspaces.ts`.

Then, in `tsudoi-language-server/packages/tsudoi-adapter-efm-config/`:

<!-- handler-pack in=packages/tsudoi-adapter-efm-config -->

```sh
bun pm pack --filename tsudoi-adapter-efm-config.tgz
```

**With `--filename`, the tarball does not land in that directory.** `bun pm pack --filename` run inside a workspace member
writes to the workspace **root**, so what you just built is
`tsudoi-language-server/tsudoi-adapter-efm-config.tgz`, not something under `packages/`. Then, in
your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-adapter-efm-config.tgz
```

**Which of these the test suite runs**, so you know what the commands above are worth: the
**pack** command is extracted from this file and executed, and the file it writes is compared
against the path the install line names. The **install** command is read and never run — the
suite builds a consumer by a different route — so what is checked is the `../` checkout prefix it
starts with and the tarball name it ends with, and NOT the command that installs them nor
anything between: `bun frobnicate` that same path passes every check this repository has.

## What bounds it

It reads what efm's own `config.yaml` holds and runs what that file names, rather than knowing
anything about any particular linter. So its limits are the ones listed above — the single-line
errorformats, the methods tsudoi serves — and not a list of supported tools.

## License

MIT
