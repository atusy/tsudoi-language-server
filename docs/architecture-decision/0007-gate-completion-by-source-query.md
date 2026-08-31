# Gate Completion by Each Source's Query

|                     |                                      |
| ------------------- | ------------------------------------ |
| **Status**          | accepted                             |
| **Date**            | 2026-08-31                           |
| **Decision-makers** | Project stakeholder and maintainers  |
| **Consulted**       | Completion package request pipelines |
| **Informed**        | Completion config authors            |

## Context and Problem Statement

Completion sources can do broad work before the user has typed enough to make their answers useful.
The minimum was either fixed, absent, or attached to long-lived factory state, while shell command
completion specifically needs to be configurable down to an empty input.

## Decision Drivers

- Start policy must be selectable per completion invocation, like `maxItems`.
- A zero threshold must let shell completion ask the native shell for command candidates.
- Sources must measure the query they actually understand rather than share a false lexer.
- Existing behavior must remain the default unless a caller supplies the new option.
- Invalid runtime JavaScript values must fail before source work begins.

## Considered Options

1. Add request-scoped `minQueryLength` with source-specific query extraction.
2. Define one shared lexical query rule for every completion package.
3. Keep start policy in factories or leave it entirely to the LSP client.

## Decision Outcome

**Chosen option**: "Add request-scoped `minQueryLength` with source-specific query extraction",
because invocation policy can vary without duplicating long-lived state, while each source keeps the
grammar required to answer correctly.

The source-specific queries and compatibility defaults are:

| source     | measured query                                        | default |
| ---------- | ----------------------------------------------------- | ------- |
| shell      | leading-trimmed command line sent to the native shell | `1`     |
| dictionary | trailing non-whitespace run before the cursor         | `2`     |
| document   | typed word produced by the selected scanner           | `0`     |
| path       | complete path token under the cursor                  | `1`     |

All thresholds are measured in JavaScript code units and must be non-negative safe integers. Only
`undefined` selects a default; `null` is invalid. A zero path threshold synthesizes an empty
fragment at the cursor, and a zero shell threshold sends empty input to the native shell.

### Consequences

**Positive:**

- One handler can serve clients or language contexts with different start thresholds.
- Expensive shell, corpus, window, dictionary, and directory work can be skipped early.
- Empty-input shell command completion is an explicit supported path.

**Negative:**

- The same option name measures a source-specific query rather than one universal token.
- A zero threshold can produce broad answers and initiate comparatively expensive work.
- Moving dictionary `minQueryLength` from its factory is a breaking API change.

**Neutral:**

- Defaults differ by source because they preserve the behavior each source already exposed.

### Confirmation

Unit tests must cover zero, compatibility defaults, positive thresholds, invalid numbers, and work
skipped before the threshold. Native fish integration must prove that an empty prefix returns a
configured command candidate. Package documentation must state what each source measures.

## Pros and Cons of the Options

### Request-scoped source-specific prefixes

- Good, because policy varies without rebuilding stateful handlers.
- Good, because shell, document scanners, and path fragments retain their real grammars.
- Bad, because config authors must read what each source treats as its query.

### One shared lexical query

- Good, because the option would have one literal measurement everywhere.
- Bad, because a final empty shell argument and a path ending in a separator are valid queries that
  a generic word rule would reject.
- Bad, because document completion must use its configured scanner to agree with its candidates.

### Factory or client-only policy

- Good, because handlers would have fewer request options.
- Bad, because changing thresholds would duplicate shell sessions and dictionary snapshots or rely
  on client keyword rules the server cannot observe.

## More Information

[ADR 0003](0003-reuse-native-shell-completion-processes.md) owns native shell process lifetime,
[ADR 0004](0004-apply-configurable-dictionary-filters-in-the-handler.md) owns dictionary request
policy, and [ADR 0006](0006-name-completion-options-by-invocation.md) names request option types.
