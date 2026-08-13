# Apply Configurable Dictionary Filters in the Handler

|                     |                                            |
| ------------------- | ------------------------------------------ |
| **Status**          | accepted                                   |
| **Date**            | 2026-08-13                                 |
| **Decision-makers** | Project stakeholder and maintainers        |
| **Consulted**       | tsudoi-completion-document filter pipeline |
| **Informed**        | Dictionary completion config authors       |

## Context and Problem Statement

Dictionary completion originally hard-coded case-insensitive prefix matching into its SQLite
query. Config authors need to replace that rule with LSP-side pipelines that can drop, reorder, or
rewrite candidates while keeping prefix matching as the default.

## Decision Drivers

- `filters` must run before `maxItems`, so rejected entries do not consume the response budget.
- The default must retain indexed prefix performance for large dictionaries.
- Custom filter behavior must not be silently changed to fit SQL.
- Entries rewritten by filters must still be deduplicated before reaching the client.
- Per-request response policy should use the same call shape as `completeCorpus`.

## Considered Options

1. Expose only a fixed set of SQL-translatable matcher names.
2. Apply arbitrary filters after a bounded SQLite query.
3. Apply iterable filter functions in the handler, using SQL only for semantics-preserving
   narrowing.

## Decision Outcome

**Chosen option**: "Apply iterable filter functions in the handler, using SQL only for
semantics-preserving narrowing". A filter receives `Iterable<string>` and `{ typed }`, then returns
an iterable. Pipelines run in author order, followed by unconditional deduplication and
`maxItems`. Files, persistence, refresh policy, and filters configure the long-lived factory;
`maxItems` configures one completion invocation through its optional third argument. Its default is 500.

The default is `dictionaryPrefixFilter`. When it is the first stage, SQLite may use the same prefix
range to avoid materializing entries that the stage must reject. SQLite may apply `LIMIT` only
when no later stage can reorder, rewrite, or drop those entries. Otherwise all active entries in
the configured files are passed to the handler pipeline.

### Consequences

**Positive:**

- Config authors can implement fuzzy, suffix, ranking, and rewriting pipelines.
- The default keeps the existing indexed prefix query and bounded response.
- `maxItems` counts only distinct candidates that survived every filter.
- One initialized dictionary can serve callers with different response budgets.

**Negative:**

- A custom pipeline without an initial prefix filter can materialize the full active dictionary on
  each request.
- Filter code runs synchronously on the LSP request thread.
- The dictionary package owns a small filter API parallel to completion-document to avoid coupling
  two handler packages.
- Calling the returned function as a plain tsudoi method handler always uses the default response
  bound; a custom bound requires an explicit wrapper call.

### Confirmation

Tests must prove that a candidate beyond the response bound is still returned when an earlier
candidate is rejected, that the third argument selects the response bound for one request, that
default prefix matching remains case-insensitive and preserves entry values, and that packed
declarations export the filter API. Query-plan tests continue to protect the indexed default path.

## More Information

This decision refines [ADR 0002](0002-index-dictionaries-with-worker-backed-sqlite.md); it does not
replace SQLite as the persistent dictionary index or change atomic generation publication.
