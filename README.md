# tsudoi-language-server

The language server for **gathering** (tsudoi; 集い) the features you wish for.

tsudoi turns one TypeScript config into a Language Server. Pick the features you want,
write the handlers only your workflow needs, and tsudoi takes care of the protocol,
document lifecycle, capability advertisement, cancellation, and streaming.

It is a good fit when a full compiler-backed language server would be too much, but an
editor-specific script would be too limiting:

- combine path, document-word, dictionary, and native-shell completion
- add hover from WordNet or another data source
- reuse an existing efm configuration
- plug in your own diagnostics, formatting, commands, code actions, or custom methods
- share the same server across Neovim, Helix, Emacs, VS Code, and other LSP clients

In one everyday setup, a single config combines native-shell, Git, path, open-document, and
dictionary completion with WordNet hover, dprint formatting, and custom kakehashi routing. The
config decides the order, filters, and fallbacks; each feature keeps its own implementation.

Your server stays ordinary TypeScript. A minimal config is just a typed factory and the
methods it answers:

<!-- overview -->

```ts
import { completePath, resolvePathStat } from "@atusy/tsudoi-completion-path";
import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = async () => ({
  methods: {
    "textDocument/completion": async function* (context, params) {
      yield* completePath(context, params);
    },
    "completionItem/resolve": resolvePathStat,
    "textDocument/hover": hoverWordnet,
  },
});

export default config;
```

## Try the npm alpha

The first npm release is an opt-in alpha. Install the framework and whichever handlers you want
with `bun add @atusy/tsudoi-language-server@alpha`, or use
`deno add npm:@atusy/tsudoi-language-server@alpha` in a Deno project. All tsudoi packages in one
project should use the same alpha version.

You can also try a pinned repository snapshot without cloning or building this repository. With
[Deno](https://docs.deno.com/runtime/getting_started/installation/) installed, download the
[three-file starter](examples/github) and run it:

    mkdir my-language-server && cd my-language-server
    base=https://raw.githubusercontent.com/atusy/tsudoi-language-server/main/examples/github; curl -fSLO "$base/deno.json" -O "$base/cli.js" -O "$base/tsudoi.config.ts"
    deno run -A cli.js --config ./tsudoi.config.ts

The command waits for LSP messages on stdin, so silence means it started successfully. Point
your editor's LSP client at the last command, then edit `tsudoi.config.ts` to make the server
yours. The starter pins tsudoi to a known Git commit; updating is an explicit change rather
than something that happens behind your back.

## Make it yours

The starter gives you filesystem completion and English WordNet hover. The repository also
contains composable handlers for:

| Package                                                                  | What it adds                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| [completion-path](packages/tsudoi-completion-path/README.md)             | filesystem and workspace-path completion          |
| [completion-document](packages/tsudoi-completion-document/README.md)     | words from the current buffer or open documents   |
| [completion-dictionary](packages/tsudoi-completion-dictionary/README.md) | indexed completion from your own dictionary files |
| [completion-shell](packages/tsudoi-completion-shell/README.md)           | native Fish, Zsh, or Xonsh completion             |
| [hover-wordnet](packages/tsudoi-hover-wordnet/README.md)                 | English definitions on hover                      |
| [adapter-efm-config](packages/tsudoi-adapter-efm-config/README.md)       | handlers derived from an efm config               |

For a more involved real-world shape, see the
[full example](examples/tsudoi.config.ts). It combines packaged handlers with local
diagnostics and formatting in the same config.

## Learn more

The [complete guide](docs/README.md) covers npm and checkout installation, configuring Bun or Deno,
handler and context APIs, initialization, custom methods, cancellation, and cleanup. Maintainers use
the [npm alpha release runbook](docs/releasing.md) for bootstrap and later OIDC releases.

## License

MIT
