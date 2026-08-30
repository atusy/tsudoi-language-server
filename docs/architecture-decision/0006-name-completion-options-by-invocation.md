# Name Completion Options by Invocation

|                     |                                         |
| ------------------- | --------------------------------------- |
| **Status**          | accepted                                |
| **Date**            | 2026-08-30                              |
| **Decision-makers** | Project stakeholder and maintainers     |
| **Consulted**       | Existing completion package public APIs |
| **Informed**        | Completion handler package authors      |

## Context and Problem Statement

Completion packages expose both long-lived factory options and options resolved for one handler
invocation. The request option types mixed verb-first names such as `CompleteCorpusOptions` with
noun-first names such as `ShellCompletionOptions`, obscuring their common lifetime and their
relationship to the functions they configure.

## Decision Drivers

- A type name should reveal whether it configures a factory or one completion invocation.
- Options passed to `completeCorpus`, `completeAround`, and `completePath` should follow the same
  convention as options passed to handlers returned by completion factories.
- Function and option names should be discoverable together in editor completion and text search.
- Shared lower-level options should not be forced into a handler-specific name.

## Considered Options

1. Name invocation options `CompleteXOptions` and factory options `UseXCompletionOptions`.
2. Name invocation options `XCompletionOptions` and retain `UseXCompletionOptions` for factories.
3. Add `Request` or `Factory` to every option type name.

## Decision Outcome

**Chosen option**: "Name invocation options `CompleteXOptions` and factory options
`UseXCompletionOptions`", because the verb identifies the configured call and preserves the
existing `CompleteCorpusOptions`, `CompleteAroundOptions`, and `CompletePathOptions` convention.
Returned callable types remain noun phrases such as `ShellCompletion` and `DictionaryCompletion`.
Shared primitives such as `WordOptions` remain named for their own abstraction.

### Consequences

**Positive:**

- Factory and invocation lifetimes are visible in their type names.
- `completeX` and `CompleteXOptions` sort and search together.
- All public completion invocation option types use one convention.

**Negative:**

- `ShellCompletionOptions` and `DictionaryCompletionOptions` are breaking renames.
- A returned handler does not itself have an exported `completeShell` or `completeDictionary`
  function bearing the verb used by its option type.

**Neutral:**

- Handler types retain names such as `ShellCompletion`; this decision applies to option objects,
  not callable type aliases.

### Confirmation

Source and declaration tests must expose `CompleteShellOptions` and `CompleteDictionaryOptions`,
must not refer to their noun-first predecessors, and all workspace type checks must pass.

## Pros and Cons of the Options

### Use `CompleteXOptions` for invocations

- Good, because it matches the configured action and the existing direct handler APIs.
- Good, because it distinguishes invocation options from `UseXCompletionOptions` factory state.
- Bad, because factory-produced handlers have callable noun types rather than exported verb-named
  functions.

### Use `XCompletionOptions` for invocations

- Good, because it reads naturally beside callable types such as `ShellCompletion`.
- Bad, because it can describe either the handler, its factory, or one invocation.
- Bad, because it would require renaming the three established direct-handler option types.

### Qualify every name with `Request` or `Factory`

- Good, because the lifetime is fully explicit without relying on verbs.
- Bad, because names become longer and diverge from the exported `completeX` and `useXCompletion`
  entry points.

## More Information

[ADR 0003](0003-reuse-native-shell-completion-processes.md) and
[ADR 0004](0004-apply-configurable-dictionary-filters-in-the-handler.md) establish why shell and
dictionary settings are split between long-lived factories and individual invocations.
