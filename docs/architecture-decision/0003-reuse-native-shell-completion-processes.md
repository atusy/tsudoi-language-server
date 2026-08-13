# Reuse Native Shell Completion Processes

|                     |                                                           |
| ------------------- | --------------------------------------------------------- |
| **Status**          | accepted                                                  |
| **Date**            | 2026-08-13                                                |
| **Decision-makers** | Project stakeholder and maintainers                       |
| **Consulted**       | ddc-source-shell_native and tsudoi handler package APIs   |
| **Informed**        | Config authors                                            |

## Context and Problem Statement

Shell completion should reuse the user's fish, zsh, or xonsh definitions instead of duplicating
their command-specific logic in TypeScript. Starting and initializing a shell for every LSP
request would make interactive latency depend on startup and configuration cost. A persistent
capture process, however, has mutable protocol state and must not mix concurrent responses or
outlive cancellation indefinitely.

## Decision Drivers

- Completion must reflect the selected shell's own functions, aliases, options, and configuration.
- Ordinary requests should not pay shell startup cost repeatedly.
- A cancelled, timed-out, or failed request must not leave protocol output for the next request.
- The same built package must work under Bun and Deno.
- Adapted third-party capture scripts and their licenses must remain identifiable in the tarball.

## Considered Options

1. Reimplement shell grammars and command completion in TypeScript.
2. Start a new native shell for every completion request.
3. Keep one serialized native shell process per completion handler.

## Decision Outcome

**Chosen option**: "Keep one serialized native shell process per completion handler", because it
delegates completion semantics to the shell while amortizing startup and configuration cost.

`useShellCompletion(shell, options)` creates the LSP handler and owns one lazy session. Requests to
that handler are serialized because the line-oriented capture protocol has one end marker and no
request identifiers. The process stops after an idle interval. Cancellation, timeout, input error,
or process failure discards the session so delayed output cannot be mistaken for a later answer;
the next request starts a new process.

The capture scripts are adapted from `Shougo/ddc-source-shell_native` at revision
`86686bd68cc7d26866ee5cf8cdfc1808f20c42a8`. The package ships the scripts together with
`THIRD_PARTY_NOTICES.md`, including the upstream MIT notice and the provenance of code derived by
that project.

### Consequences

**Positive:**

- Candidates use native shell completion rather than a partial grammar maintained here.
- Repeated requests reuse shell initialization and user configuration.
- A handler has explicit ownership of its process state without a module-global registry.
- The capture protocol and notices are included in the published artifact.

**Negative:**

- One slow request delays later requests to the same handler until timeout or cancellation.
- A configured shell can execute arbitrary user completion code.
- Capture scripts must remain compatible with three independent shells.
- xonsh runtime coverage requires an environment where xonsh is installed.

**Neutral:**

- Separate calls to `useShellCompletion` own separate processes, even for the same shell.
- The handler trims leading indentation and replaces the final non-whitespace token; it does not
  expose the source plugin's editor-specific matching controls.

### Confirmation

Unit tests must cover candidate mapping, deduplication, replacement ranges, cancellation, response
bounds, and invalid numeric options. Native integration tests must cover serialized requests with
fish and real command completion with zsh. A built-artifact smoke test must load the package and
its fish capture script under both Bun and Deno. Packed-artifact tests must enumerate all capture
scripts and `THIRD_PARTY_NOTICES.md`.

## Pros and Cons of the Options

### Reimplement completion in TypeScript

- Good, because no child process or capture protocol is needed.
- Bad, because shell grammar, quoting, functions, and command-specific definitions would diverge.
- Bad, because user shell configuration would need a second interpretation layer.

### Start a shell per request

- Good, because each request has isolated process state.
- Good, because cancellation can terminate exactly one process.
- Bad, because every keystroke pays startup and configuration cost.
- Bad, because rapid requests create many short-lived processes.

### Reuse a serialized shell process

- Good, because startup cost is amortized while semantics remain native.
- Good, because serialization makes the delimiter protocol unambiguous.
- Good, because killing on failure restores a known protocol state.
- Bad, because process lifecycle, queues, idle shutdown, and timeout behavior require integration
  tests.
