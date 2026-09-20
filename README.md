# tsudoi-language-server

**Your editor features. One TypeScript config. Any LSP client.**

tsudoi (集い, “gathering”) brings the features you want into one language server.
Combine ready-made completion and hover, or write your own diagnostics, formatting, and more.
You write the handlers; tsudoi handles the LSP protocol.

Start with path completion and English definitions on hover:

<!-- overview -->

```ts
import { completePath, resolvePathStat } from "@atusy/tsudoi-completion-path";
import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = async () => ({
  methods: {
    "textDocument/completion": async function* (context, params) {
      return yield* completePath(context, params);
    },
    "completionItem/resolve": resolvePathStat,
    "textDocument/hover": hoverWordnet,
  },
});

export default config;
```

## Try the npm alpha

tsudoi runs on **Bun or Deno**. Follow the [npm alpha setup](docs/README.md#install-the-npm-alpha)
to install the framework and your chosen handlers. Keep all tsudoi packages on the same alpha version.

For a quick start with [Deno](https://docs.deno.com/runtime/getting_started/installation/),
download the [three-file starter](examples/github)—no clone or build needed:

    mkdir my-language-server && cd my-language-server
    base=https://raw.githubusercontent.com/atusy/tsudoi-language-server/main/examples/github; curl -fSLO "$base/deno.json" -O "$base/cli.js" -O "$base/tsudoi.config.ts"
    deno run -A cli.js --config ./tsudoi.config.ts

The server waits for LSP messages on stdin. Configure your editor's LSP client to run the last
command from this directory, then edit `tsudoi.config.ts` to make it yours.
The starter pins tsudoi to a specific Git commit.

## Make it yours

Pick the features your workflow needs:

| Package                                                                  | What it adds                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| [completion-path](packages/tsudoi-completion-path/README.md)             | filesystem and workspace-path completion          |
| [completion-document](packages/tsudoi-completion-document/README.md)     | words from the current buffer or open documents   |
| [completion-dictionary](packages/tsudoi-completion-dictionary/README.md) | indexed completion from your own dictionary files |
| [completion-shell](packages/tsudoi-completion-shell/README.md)           | native Fish, Zsh, or Xonsh completion             |
| [hover-wordnet](packages/tsudoi-hover-wordnet/README.md)                 | English definitions on hover                      |
| [adapter-efm-config](packages/tsudoi-adapter-efm-config/README.md)       | handlers derived from an efm config               |

Need something custom? Add your own handlers alongside these packages.
The [full example](examples/tsudoi.config.ts) shows how to combine them with diagnostics and formatting.

## Learn more

See the [complete guide](docs/README.md) for installation, handler APIs, and custom methods.

## License

MIT
