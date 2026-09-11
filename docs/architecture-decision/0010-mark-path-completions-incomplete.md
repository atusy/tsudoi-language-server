# Mark Path Completions Incomplete

|                     |                                     |
| ------------------- | ----------------------------------- |
| **Status**          | accepted                            |
| **Date**            | 2026-09-11                          |
| **Decision-makers** | Project stakeholder and maintainers |

## Context and Problem Statement

`completePath` lists one directory at a time. Typing a separator can switch to a different
directory whose children were absent from the previous answer. An exhausted directory iterator
therefore does not mean that clients can answer further typing by filtering that answer.
ADR 0009 now allows the handler to express this through its final return.

## Decision Drivers

- Request fresh candidates when the path changes.
- Preserve immediate delivery of directory-entry batches.
- Keep the completeness policy in the source that knows what it enumerated.

## Considered Options

1. Return an incomplete completion list after yielding the entries.
2. Keep the implicit complete result and rely on client trigger settings.
3. Buffer entries and return an incomplete list without yielding.

## Decision Outcome

Choose option 1. For a document and line available to the handler, `completePath` yields
candidate arrays and returns `{ isIncomplete: true, items: [] }`. This also covers no matches,
empty directories, and queries below `minQueryLength`: later input may produce candidates.
Missing documents or lines still return no result. Invalid options still throw.

An empty final `items` avoids duplicating entries already yielded. ADR 0009 defines aggregation
without a token and delivery with a token; this decision does not change the framework's
protocol contract. Wrappers must forward the final return. Other completion sources retain
their own policies.

### Consequences

- Clients that honor the flag can obtain a new directory's children instead of retaining
  an obsolete listing.
- Clients may make more filesystem requests, even when further typing only narrows a name.
- Streaming stays available. Applying final attributes after progress remains client-dependent.
- Consumers expecting an array response must now read `CompletionList.items`; consumers
  iterating only yielded batches still receive the same items.

### Confirmation

Test the installed package under Bun and Deno, with and without partial-result tokens. Check
batch preservation, no duplicated final items, empty and unavailable inputs, and requests
that cross a directory separator. Exercise Neovim and ddc with the local plugin versions,
recording actual request contexts, results, and progress handling. Run the Definition of Done.

## Pros and Cons of the Options

### Return an incomplete list after yielding

Preserves streaming and makes the source's policy explicit. Final attributes after progress
require client support, as already accepted in ADR 0009.

### Rely on client triggers

Avoids additional requests for simple name extensions, but leaves clients free to reuse a
listing that cannot contain the next directory's children.

### Buffer all entries

Produces one unambiguous result for all clients, but delays the first entries and removes
this package's streaming behavior.

## More Information

- [ADR 0009: stream final results](0009-return-final-results-from-stream-handlers.md)
- [LSP completion](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_completion)
