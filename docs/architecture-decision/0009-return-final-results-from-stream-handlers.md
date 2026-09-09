# Return Final Results from Stream Handlers

|                     |                                              |
| ------------------- | -------------------------------------------- |
| **Status**          | accepted                                     |
| **Date**            | 2026-09-10                                   |
| **Decision-makers** | Project stakeholder and maintainers          |
| **Consulted**       | Completion and code-action handler contracts |
| **Informed**        | Config and handler package authors           |

## Context and Problem Statement

Completion and code-action handlers currently yield arrays and return nothing. A completion
provider may only know whether its search was truncated after producing its candidates, but
the current contract cannot express `CompletionList.isIncomplete` at all.

We want handlers to decide the final result when computation ends, whether or not the client
requested partial results. Client interpretation of a response after partial results remains
the client's responsibility; tsudoi must describe what it sends without promising that every
LSP client combines these messages in the same way.

## Decision Drivers

- Use LSP result types and names so config authors can apply their protocol knowledge.
- Keep one generator convention across completion and code action.
- Allow completeness to be decided after candidate enumeration.
- Preserve existing yield-only handlers and immediate partial-result delivery.
- Avoid mutable result settings on the request context.

## Considered Options

1. Yield partial arrays and return the method's final LSP result.
2. Yield a `CompletionList` first, followed by arrays.
3. Set final-result attributes through the request context.
4. Buffer all candidates before sending any response.

## Decision Outcome

**Chosen option**: "Yield partial arrays and return the method's final LSP result", because
`yield` expresses intermediate output and `return` expresses the result known at completion.

Completion becomes `AsyncGenerator<CompletionItem[], CompletionItem[] | CompletionList | null |
void, void>`. Code action becomes `AsyncGenerator<(Command | CodeAction)[], (Command | CodeAction)[]
| null | void, void>`. `void` preserves handlers that fall through or use a bare `return`.
The yielded types remain arrays; this decision does not add `CompletionList` yields or change
awaited-once methods.

### Delivery and aggregation

- With a valid `partialResultToken`, every yielded array is sent immediately as `$/progress`.
  The generator's return is sent as the response, with `undefined` normalized to `null`.
  Yielded items are never copied into the response, and returned items are not sent as progress.
- Without a valid token, yielded items are followed by returned items in one response. A returned
  `CompletionList` supplies the response's attributes, including `isIncomplete` and `itemDefaults`;
  its `items` follows the yielded items. The returned list and its items are not mutated.
- `null` and `void` add no items and do not retract prior yields. With neither a yield nor a
  non-null return the response is `null`. An explicit empty array remains an array, including when
  it is returned without any yields. A returned empty `CompletionList` remains a list.
- Cancellation, handler errors, and generator cleanup retain their existing behavior. Values
  produced during cleanup are discarded, including return values.
- Wrappers must use `return yield* inner(context, params)` to forward an inner generator's final
  result. A bare `yield*` or a `for await` loop forwards yielded values but does not forward the
  return value automatically. Combining several sources requires the outer handler to choose
  the final attributes and forward each source's returned items exactly once.

### Protocol compatibility

This is an intentional tsudoi contract, not a claim of portable LSP partial-result semantics.
LSP 3.17 says that once partial results are sent, the whole result must travel in progress
notifications and the final response must be empty in terms of result values. Completion also
defines a `CompletionList` as the first partial result, followed by arrays. It does not define
updating that list's attributes from a final response.

Tsudoi nevertheless allows the final response to carry the handler's chosen result, including
`isIncomplete` and remaining items, after progress. Clients decide how to interpret that response;
tsudoi does not claim they will append its items or apply its attributes to earlier candidates.
Authors needing a single unambiguous completion result can return a `CompletionList` without
yielding, even when the request carries a token. When a returned list has `itemDefaults`, authors
must also consider their effect on aggregated earlier items and the client's declared support;
streamed items that need those defaults should carry their values explicitly.

### Consequences

**Positive:**

- Completion handlers can report search truncation at the end of computation.
- Both stream methods share the same yield/return convention and use upstream result types.
- Existing array-yielding handlers keep their delivery behavior.

**Negative:**

- Applying final attributes or items after progress depends on the client, as described above.
- Wrappers that discard generator return values also discard the new final results.
- Consumers reading `.next().value` must distinguish `done` before assuming an item array;
  the final value can now be a completion list.
- Configs that accidentally returned a value previously ignored by tsudoi will now expose it.

**Neutral:**

- Handler packages are not automatically changed to return `isIncomplete`; each source still
  owns its completeness policy, like the response policy in ADR 0006.
- Result assembly must distinguish completion lists from code-action arrays.

### Confirmation

Exercise both methods over real Bun and Deno LSP sessions, with and without tokens. Check
return-only results, streamed final results, ordered aggregation without double delivery,
completion attributes, empty and absent results, cancellation, and cleanup. Check published
declarations accept the new results and reject malformed yields and returns. Run the repository's
Definition of Done and review the source comments and user documentation for the old contract.

## Pros and Cons of the Options

### Return the final LSP result

- Good, because the final decision can use all information discovered during computation.
- Good, because method-specific result objects retain their LSP names and shapes.
- Bad, because final results after progress exceed the portable protocol contract.

### Yield a completion list first

- Good, because it follows the specified completion partial-result sequence.
- Bad, because completeness must be chosen before later computation finishes.
- Bad, because simply concatenating sources that each yield a list violates that sequence.

### Set attributes through the context

- Good, because existing yielded arrays need no changes.
- Bad, because result state becomes mutable and separate from the returned value.
- Bad, because setting attributes later still does not solve the wire compatibility limitation.

### Buffer every candidate

- Good, because the final response can carry the full result with ordinary LSP semantics.
- Bad, because it removes immediate partial-result delivery even for clients that can use it.

## More Information

- [LSP partial results](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/partialResults.md)
- [LSP completion](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/language/completion.md)
- [ADR 0006: completion option lifetimes](0006-name-completion-options-by-invocation.md)
