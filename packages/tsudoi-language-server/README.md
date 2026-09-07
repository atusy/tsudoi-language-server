# @atusy/tsudoi-language-server

The framework for assembling a Language Server from one TypeScript config. Tsudoi owns the LSP
transport, lifecycle, documents, capability advertisement, cancellation, and streaming; your
config supplies only the handlers it needs.

This is an alpha package. Install it explicitly with
`bun add @atusy/tsudoi-language-server@alpha` or
`deno add --save-exact npm:@atusy/tsudoi-language-server@alpha`. Start the installed server with
`bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts` or,
from a Deno-only project, with
`deno run -A --frozen --node-modules-dir=none @atusy/tsudoi-language-server/cli --config ./tsudoi.config.ts`.

There is deliberately no package-root export or `bin`. The `./cli` export is only the executable
entry point. Config authors import tsudoi's own types
from `@atusy/tsudoi-language-server/types` and protocol types from its `deps/` subpaths. See the
[complete guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md) for the
configuration contract, handler packages, runtime permissions, and working examples.

## License

MIT
