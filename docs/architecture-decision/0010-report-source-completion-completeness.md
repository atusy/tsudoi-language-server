# Report Completion Completeness from Each Source

|                     |                           |
| ------------------- | ------------------------- |
| **Status**          | accepted                  |
| **Date**            | 2026-09-22                |
| **Decision-makers** | Project maintainers       |
| **Consulted**       | Completion handlers       |
| **Informed**        | Completion config authors |

## Context and Problem Statement

ADR 0009 lets stream handlers return a final CompletionList, but completion packages still
implicitly claim complete results. A candidate bound can hide a match that becomes relevant after
further typing, while path and native shell completion can change the candidate universe itself.

## Decision Drivers

- Clients need to know when narrowing the previous response cannot reproduce a fresh query.
- Each source owns its query grammar and completeness policy (ADR 0007).
- Keep existing candidate batches and public filter function return types.
- Avoid persistent state tracking previous requests or guessing arbitrary callback behavior.

## Considered Options

1. Return source-specific completeness from each handler.
2. Mark every response incomplete.
3. Infer completeness in the framework or caller from item counts and shared query rules.

## Decision Outcome

**Chosen option**: "Return source-specific completeness from each handler", because sources know
both their bounds and the transformations applied to candidates. The framework cannot infer those
facts from the resulting arrays.

Shell returns `isIncomplete: true` for applicable requests, including empty and query-gated
answers. Further input can change the shell context instead of narrowing candidates.

Path returns `isIncomplete: true` wherever further input can reach a directory the answer did not
list: a query-gated fragment, a listed folder (or symlink to one), a name that may still become `.`
or `..`, `~` before its separator, a flavour with a backslash separator (drive and UNC roots are
spelled over several keystrokes), or a longer reading of the line left unlisted because a shorter
one answered. Otherwise every directory a longer query can list is a folder this answer would have
named, so the answer is complete, including an empty one. This refines the decision as first
accepted, which marked every applicable path answer incomplete: an ordinary word in prose reads as
a path fragment matching nothing, so any response combining path with other sources could never
finish a session.
Missing documents (and missing path lines) still produce no result. Cancellation remains governed
by the framework's cancellation response.

Document and dictionary handlers return incomplete results when a query is gated, a candidate is
omitted by `maxItems`, or a custom callback prevents establishing that further typing only narrows
candidates. Only the default document scanner and pipelines containing solely the built-in prefix
filter (or no filters) establish completeness. Custom scanners are conservative. `segmentScanner`
is conservative except for a non-empty ASCII query: in text written without spaces segmentation
can move where the typed word starts as input grows (`都庁` then `舎` reads `庁舎`), but an ASCII
query grows and ends exactly as under the default scanner. This refines the decision as first
accepted, which ruled every `segmentScanner` answer incomplete, so a config segmenting Japanese
could never finish a session even while typing English. An exact fit at the bound is complete;
probe for one extra distinct filtered candidate, including in the dictionary's indexed query.

An exhausted known prefix search can be complete and empty. `maxItems: 0` disables these bounded
sources and returns a complete empty list. Document scan bounds define the offered scope, and
background dictionary refreshes define future snapshots; neither alone makes a response incomplete.
The corpus handler retains its ability to answer from open documents when the requested document
is absent.

Yielded arrays keep their existing delivery and the final list carries metadata with empty `items`.
Single-source wrappers use `return yield*`. Multiple-source callers capture each final result
and OR the incomplete flags, returning empty `items` because these sources yield all candidates.
A source with no result does not make other sources incomplete.

### Consequences

**Positive:**

- A truncated response requests recomputation and an exact fit avoids unnecessary work.
- Query gates no longer silently finish a completion session before a source becomes eligible.
- Public filter helpers remain compatible and no cross-request mutable state is added.

**Negative:**

- Shell and custom callbacks can cause a request on every further keystroke; path can while a
  folder or an unsettled fragment is in play, and `segmentScanner` can while a non-ASCII word is
  typed or none has started.
- Detecting truncation needs an additional filtered candidate; callbacks may do extra work.
- Callers expecting an array or null on the wire must now handle CompletionList.
- As in ADR 0009, metadata returned after progress is client-dependent, not portable LSP partial
  result behavior. An empty incomplete list does not guarantee a client keeps the session active.

### Confirmation

Test exact fits, overflow, deduplication, filtering before limits, query gates, exhausted searches,
custom callbacks, missing documents, disabled sources and directory transitions. Exercise final
metadata with and without progress over Bun and Deno sessions, and retain installed-package,
resolver, README and type-check coverage. Verify consumer wrappers preserve return values.

## Pros and Cons of the Options

- Source-specific decisions avoid unnecessary dictionary and document queries, at the cost of
  keeping policy in each package.
- Always incomplete is simpler but repeats even exhaustive, safely reusable prefix queries.
- Framework or caller inference centralizes policy but cannot distinguish an exact fit from
  truncation or understand a source's query grammar.

## More Information

- [ADR 0007: query gates](0007-gate-completion-by-source-query.md)
- [ADR 0009: final stream results](0009-return-final-results-from-stream-handlers.md)
