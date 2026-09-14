# Stream Document Diagnostic Reports

|                     |                                   |
| ------------------- | --------------------------------- |
| **Status**          | accepted                          |
| **Date**            | 2026-09-14                        |
| **Decision-makers** | Project maintainers               |
| **Consulted**       | Diagnostic handler API discussion |
| **Informed**        | Config and adapter authors        |

## Context and Problem Statement

Document diagnostics currently await one report. LSP also permits sending the requested
report before related documents finish. Supporting this requires object partials and their
ordering rules, rather than the array concatenation used by completion and code action.

## Decision Drivers

- Deliver the requested document's report without waiting for related documents.
- Produce equivalent reports when a client does not request partial results.
- Follow LSP's diagnostic partial-result sequence and final-response rules.
- Accept a breaking handler migration to keep one diagnostic handler convention.

## Considered Options

1. Require async generators for diagnostic handlers.
2. Accept both promises and async generators.
3. Keep promises and require authors to send progress manually.

## Decision Outcome

**Chosen option**: "Require async generators", because this gives tsudoi ownership of
stream sequencing, aggregation, cancellation, and cleanup without two diagnostic contracts.

The handler yields `DocumentDiagnosticReport | DocumentDiagnosticReportPartialResult` and
returns `DocumentDiagnosticReport | void`. A return-only handler sends one report. A streaming
handler yields the requested document's report first, then related-document partials, and
finishes without a return value. Returning a report after yielding, finishing without any
report, and yielding a partial before the initial report are handler errors.

With a valid `partialResultToken`, yields are sent immediately as `$/progress` and completion
answers `null`. Without a valid token, tsudoi combines the first report's `relatedDocuments`
with subsequent partials and returns the combined report. Later entries for a related URI
replace earlier entries; they do not append diagnostics to that document's `items`.
Aggregation must not mutate handler-owned reports or maps. Token presence does not change
which sequences are accepted. Return-only handlers send a normal report even with a token.

The handler owns diagnostic contents, result IDs, and respecting the client's
`relatedDocumentSupport` capability. Runtime validation checks report envelopes and stream
order; it is not a complete validator for every diagnostic field. Cancellation and cleanup
use the same generator lifecycle as completion and code action; cleanup outputs are discarded.

This decision applies to diagnostics only. [ADR 0009](0009-return-final-results-from-stream-handlers.md)
continues to govern completion and code action, including their final results after progress.
Diagnostics instead keep the whole streamed result in progress notifications as LSP requires.

### Consequences

**Positive:**

- Related documents can arrive incrementally with standard LSP semantics.
- Clients without tokens receive one combined report.
- Existing return-only logic can be retained inside an `async function*`.

**Negative:**

- Promise-returning diagnostic handlers must migrate, including adapters and direct callers.
- TypeScript's generator union cannot enforce ordering; runtime checks are required.

### Confirmation

Test Bun and Deno wire sessions with and without tokens, full and unchanged initial reports,
related-document aggregation, invalid sequences, return-only reports, cancellation, and cleanup.
Check published declarations reject old promise handlers and malformed reports. Migrate the
bundled examples and EFM adapter and run `bun run check`.

## More Information

- [LSP document diagnostics](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/language/pullDiagnostics.md)
- [LSP partial results](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/partialResults.md)
