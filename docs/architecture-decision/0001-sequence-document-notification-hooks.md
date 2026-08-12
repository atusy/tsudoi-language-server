# Sequence Built-in and Custom Document Notifications per Document

|                     |                                                                            |
| ------------------- | -------------------------------------------------------------------------- |
| **Status**          | accepted                                                                   |
| **Date**            | 2026-08-13                                                                 |
| **Decision-makers** | Project stakeholder and maintainers                                        |
| **Consulted**       | tsudoi-language-server implementation and vscode-jsonrpc dispatch behavior |
| **Informed**        | Config authors                                                             |

## Context and Problem Statement

`customMethod` registers every declared name as both a request and a notification. When a config
declares a built-in notification such as `textDocument/didOpen`, vscode-jsonrpc's method-keyed
handler map lets the later custom registration replace tsudoi's built-in handler. The custom
handler runs, but the document store is not updated.

Running both handlers also introduces an ordering problem. vscode-jsonrpc observes an asynchronous
notification handler's promise but does not wait for it before dispatching the next message. Slow
custom handlers can therefore let incremental document changes complete out of order unless tsudoi
serializes the lifecycle for each document.

## Decision Drivers

- A custom notification with a non-terminal built-in name must extend, not replace, tsudoi's
  behavior.
- A custom handler must observe the document store after the built-in operation represented by the
  same notification.
- `didOpen`, `didChange`, and `didClose` for one document must run in arrival order because
  incremental changes depend on preceding document state.
- A document-scoped request received after a lifecycle notification must not observe the document
  store before that notification's queued built-in update.
- Waiting work for one document should impose no promise dependency on another document.
- A rejected operation must not permanently block later operations for the same document.
- Completed document queues must not accumulate for the lifetime of the server.

## Considered Options

1. Keep registering the built-in and custom handlers separately.
2. Compose both handlers with `Promise.all`.
3. Compose the handlers as a built-in-to-custom promise chain and serialize document lifecycle
   notifications by URI.

## Decision Outcome

**Chosen option**: "Compose the handlers as a built-in-to-custom promise chain and serialize
document lifecycle notifications by URI", because it preserves tsudoi's state, gives custom code a
stable post-notification view, and preserves incremental edit order without serializing unrelated
documents.

Tsudoi registers exactly one wire handler for a non-terminal built-in notification name. That
handler invokes the built-in operation first and invokes the custom handler only after the built-in
operation has fulfilled. The handler's returned promise settles only after the custom handler
settles. The terminal `exit` notification is refused under `customMethod`, because its built-in
operation terminates the process and cannot fulfill before a hook starts.

For `textDocument/didOpen`, `textDocument/didChange`, and `textDocument/didClose`, this entire
built-in-to-custom chain is one task in a FIFO queue keyed by `textDocument.uri`. The next lifecycle
notification for that URI does not start until the preceding task settles. A different URI uses a
different queue and may run while the first hook is asynchronously waiting. CPU-bound work and
work before a hook first yields still block the shared JavaScript event loop.

Document-scoped requests such as hover and completion wait for the queue tail already admitted for
their URI before reading the document store. This prevents a request dispatched after `didChange`
from overtaking that queued change while an earlier hook is still pending. The queue is installed
only when the config declares at least one document-lifecycle hook; without such a hook, built-in
document updates retain their direct synchronous path.

The custom view of the document store is consequently defined as:

- `didOpen`: the opened document is present;
- `didChange`: the document contains the applied change;
- `didClose`: the closed document is absent.

If the built-in operation rejects, the custom handler is not invoked. A custom-handler failure is
reported according to the existing once-per-method notification policy. Whether an operation
succeeds or fails, its queue advances. A queue entry is removed after its current tail settles, but
only if no newer tail for the same URI has replaced it.

### Consequences

**Positive:**

- Declaring a built-in notification under `customMethod` no longer disables tsudoi's state update.
- Custom handlers always observe the post-operation document state.
- Incremental changes for a document cannot overtake one another.
- An asynchronously waiting handler for one document imposes no queue dependency on another.

**Negative:**

- A slow custom handler delays later lifecycle notifications for the same document.
- The server owns a small amount of mutable scheduler state keyed by active document URI.
- A custom handler that never settles prevents later lifecycle work for that document.
- While a handler remains pending, later lifecycle notifications and their parameters are retained
  without a fixed bound. Tsudoi defines no overflow or drop policy in this decision because either
  would weaken the required FIFO document history.
- CPU-bound custom work, or custom work before its first yield, can delay every document on the
  shared JavaScript event loop.

**Neutral:**

- Non-document notifications do not use a document queue, but a built-in handler still precedes a
  custom handler when both exist.
- The lifecycle gate remains tsudoi's decision and is checked before admitting a notification.

### Confirmation

Automated tests must demonstrate all of the following:

- a `didOpen` custom handler runs without displacing the built-in document-store update;
- the custom handler observes the built-in's post-operation state for open, change, and close;
- a slow custom handler prevents a later lifecycle operation for the same URI from starting;
- lifecycle operations for different URIs can proceed independently;
- a rejected lifecycle task does not poison its URI queue;
- a close followed by a reopen cannot have its newer queue removed by the older task's cleanup.
- a document-scoped request cannot overtake an earlier queued change for the same URI;
- document built-ins remain synchronous when no document-lifecycle hook is configured.

The implementation was confirmed on 2026-08-13 by the notification-router tests covering each
item above and by the Bun and Deno protocol suites covering the real connection path.

## Pros and Cons of the Options

### Separate registrations

Register the built-in and custom handlers independently under the same method name.

- Good, because it requires no scheduler or composition code.
- Bad, because vscode-jsonrpc stores one handler per name and the later registration evicts the
  earlier one.
- Bad, because there is no place to define ordering between the two handlers.

### `Promise.all` composition

Register one handler that starts the built-in and custom operations together and awaits both.

- Good, because both operations contribute to handler completion.
- Good, because independent asynchronous work may overlap.
- Bad, because a custom handler can observe the store before an asynchronous built-in operation has
  completed.
- Bad, because it does not by itself preserve order between successive incremental changes.

### Sequential composition with per-document queues

Run the built-in operation before the custom operation and enqueue the whole chain by document URI.

- Good, because custom code receives a deterministic post-operation view.
- Good, because one document's lifecycle remains ordered while other documents remain independent.
- Good, because one registered handler avoids method-map displacement.
- Bad, because custom-handler latency becomes backpressure for the same document.
- Bad, because queue cleanup and rejection recovery must be implemented carefully.

## More Information

The protocol connection currently uses vscode-jsonrpc's default unlimited message parallelism.
Returning and awaiting a notification-handler promise observes its completion but does not serialize
later notifications globally; the per-document queue supplies the narrower ordering this decision
requires.
