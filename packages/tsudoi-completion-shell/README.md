# `@atusy/tsudoi-completion-shell`

Provides native fish, zsh, and xonsh candidates through `textDocument/completion`. Each handler
keeps one shell completion process alive, so ordinary completion does not pay shell startup cost
on every keystroke.

<!-- snippet -->

```ts
import { useShellCompletion } from "@atusy/tsudoi-completion-shell";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const completeFish = useShellCompletion("fish", { timeoutMs: 2000 });

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      "textDocument/completion": (context, params) =>
        completeFish(context, params, { maxItems: 500, minQueryLength: 0 }),
    },
  });

export default config;
```

The selected shell must be installed and available on `PATH`. `useShellCompletion` also accepts
`"zsh"` and `"xonsh"`. The process starts lazily on the first request whose query reaches
`minQueryLength`, handles one request at a time, and is reused until it has been idle for
`idleTimeoutMs`. Cancellation of an active native request, a timeout, or a process failure stops it;
a later request starts a fresh process. A request cancelled before it sends input leaves the
existing process available for reuse.

Tsudoi is an `optional` **peer** only because tsudoi is **unpublished**. This package does not
install it. Its JavaScript artifact can load without tsudoi because the handler imports are
type-only, but a TypeScript consumer needs the peer to resolve the public handler types, and the
returned handler is useful only inside a tsudoi host. A missing peer is therefore a TypeScript
resolution error such as `TS2307`, not the runtime message `Cannot find module` that a value
import would produce.

## Factory options

| option          | default        | effect                                                    |
| --------------- | -------------- | --------------------------------------------------------- |
| `command`       | selected shell | executable name or path                                   |
| `cwd`           | server cwd     | working directory used for shell completion               |
| `env`           | server env     | variables overlaid onto the spawned process environment   |
| `idleTimeoutMs` | `30000`        | stop an unused completion process after this duration     |
| `timeoutMs`     | `2000`         | stop a process when one completion takes longer than this |

These options configure the native process owned by the long-lived handler.

## Completion options

| option           | default | effect                                                        |
| ---------------- | ------- | ------------------------------------------------------------- |
| `maxItems`       | `500`   | maximum distinct candidates in this response                  |
| `minQueryLength` | `1`     | minimum leading-trimmed shell query that starts native lookup |

Both options must be non-negative safe integers. `minQueryLength: 0` asks the shell for command
candidates even on an empty line. Length is measured in JavaScript code units over the whole input
sent to the shell, not only its final token; therefore argument completion after `git ` remains
eligible under the default even though that final token is empty.

The text before the cursor is sent to the shell after leading indentation is removed. Candidates
replace the final non-whitespace token. The handler does not parse a shell grammar itself; quoting,
escaping, aliases, functions, options, and command-specific completion therefore follow the
selected shell's own configuration.

## What bounds it

The invocation's `minQueryLength` decides whether native lookup starts, `maxItems` bounds the LSP
response, `timeoutMs` bounds one native request, and `idleTimeoutMs` bounds how long an unused
process remains alive. Requests to one handler are serialized because the capture protocol has one
response terminator and cannot safely multiplex answers. The shell computes candidates rather than
this package enumerating commands itself, so it may still perform arbitrary work; use completion
definitions and configuration you trust.

## Installing it

Neither this package nor tsudoi is published to a registry. First follow the
[repository guide](https://github.com/atusy/tsudoi-language-server/blob/main/docs/README.md#quickstart) so the checkout
contains tsudoi's built package.

Packing needs a workspace link that `bun install` does not create. In a fresh checkout,
`bun pm pack` can fail with `TS2307` naming the tsudoi type import. Running
`bun run scripts/typecheck-workspaces.ts` creates the required link and verifies the member before
packing.

Then, in `tsudoi-language-server/packages/tsudoi-completion-shell/`:

<!-- handler-pack in=packages/tsudoi-completion-shell -->

```sh
bun pm pack --filename tsudoi-completion-shell.tgz
```

The tarball is written at the workspace root. In your own project:

<!-- examples-install -->

```sh
bun install ../tsudoi-language-server/tsudoi-completion-shell.tgz
```

The pack command is extracted and **executed** by this repository's tests. The install command is
**never run** there; its path is checked, **not the command** or its package-manager behavior.

## License and credits

MIT. The capture scripts are adapted from
[`Shougo/ddc-source-shell_native`](https://github.com/Shougo/ddc-source-shell_native), which also
contains work derived from `zsh-capture-completion` and `deoplete-zsh`. The distributed
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) records the exact revision and copyright notice.
