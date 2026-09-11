# Path completion in Neovim and ddc

Manual verification of ADR 0010 on 2026-09-11, using the source checkout and built
workspace packages. This is a compatibility observation for these versions, not a
claim that every LSP client combines final responses with partial results.

| Component           | Version / commit                           |
| ------------------- | ------------------------------------------ |
| Neovim              | `v0.13.0-nightly+050fa30`                  |
| Deno                | `2.9.5`                                    |
| ddc.vim             | `b035d309a402c5c2e89ad7b0e451e9d8c9d7b1aa` |
| ddc-source-nvim-lsp | `228f57010d8f8d467e125b05103f436dd165f298` |
| denops.vim          | `e82c5a94ca1154b05c9d74d6f6f58c9991b1424f` |

## Setup

Use an isolated headless Neovim instance with denops, ddc, ddc-source-nvim-lsp, ddc-ui-pum,
and pum on its runtime path. Build the workspace with
`bun run scripts/typecheck-workspaces.ts`. Start the built tsudoi CLI with
`examples/tsudoi.config.ts`, using a temporary directory as its cwd and LSP root.
Attach it to a buffer in that directory and use the capabilities from
`require('ddc_source_nvim_lsp').make_client_capabilities()`.

Create `parent/child.txt` under that root. Configure only the `nvim-lsp` source:

```lua
vim.fn['ddc#custom#patch_global']({
  ui = 'pum',
  sources = { 'nvim-lsp' },
  sourceOptions = { ['nvim-lsp'] = {
    isVolatile = false,
    minAutoCompleteLength = 0,
    keywordPattern = '\\S*',
    matchers = {}, sorters = {}, converters = {},
    timeout = 5000,
  } },
})
vim.fn['ddc#enable']()
```

`isVolatile: false` prevents unconditional gathering from concealing whether ddc
uses the incomplete flag. The keyword pattern keeps the completion start at column
zero across the separator, preventing a changed start position from invalidating
the cache instead.

## Observations

Type `par`, obtain the `parent` candidate, then append `ent/`. Capture completion
requests and callbacks by wrapping the attached client's `request` method. Read
`vim.g['ddc#_items']` after the response to inspect ddc's converted candidates.
This verifies the editor/plugin data path, not rendered popup pixels.

| Input / route                                                 | Request                                  | Response                                      | ddc words          |
| ------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------ |
| `par`, normal source                                          | No partial-result token                  | Incomplete list containing `parent`           | `parent`           |
| `parent/`, automatic follow-up                                | No token; `context.triggerKind: 3`       | Incomplete list containing `parent/child.txt` | `parent/child.txt` |
| `parent/`, source request with a token injected for the probe | `partialResultToken: "ddc-forced-token"` | `{ isIncomplete: true, items: [] }`           | Empty              |

The normal source does not request partial results. It propagates `isIncomplete`
into ddc's cached result, and the next input triggers a new request. The candidate
set is replaced with the new directory's entries.

As a negative control, a separate instance used the same settings but changed the
received list's `isIncomplete` to `false` before handing it to ddc. After typing
`par` then `ent/`, the request count stayed at one and ddc's items still contained
`parent`. This control changes the response flag, not the server implementation.

For the injected-token probe, wrap `client.handlers['$/progress']` to record the
notifications while still calling Neovim's default handler. One progress batch
contained `parent/child.txt`; the default handler completed without an error.
The completion callback received only the final empty list. ddc displayed no
candidates: this source does not merge progress items into that list. The token was
added solely for this probe and is not part of the source's normal behavior.

## Automated coverage

`test/completion-path.test.ts` checks both Bun and Deno servers, with and without
tokens: directory changes, empty directories, unmatched and gated queries, an
unavailable line, final attributes, and no duplicated entries. The large-directory
case additionally checks the existing 100-item batch boundaries. These tests cover
tsudoi's wire output; they do not launch an editor.
