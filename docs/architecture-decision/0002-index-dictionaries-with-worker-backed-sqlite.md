# Index Dictionaries with Worker-backed Native SQLite

|                     |                                                        |
| ------------------- | ------------------------------------------------------ |
| **Status**          | accepted                                               |
| **Date**            | 2026-08-13                                             |
| **Decision-makers** | Project stakeholder and maintainers                    |
| **Consulted**       | ddc-source-dictionary and current handler package APIs |
| **Informed**        | Config authors                                         |

The location of candidate filtering is refined by
[ADR 0004](0004-apply-configurable-dictionary-filters-in-the-handler.md). SQLite remains the
persistent index; arbitrary filter pipelines run in the LSP handler.

## Context and Problem Statement

Dictionary completion must persist one entry per file line, replace a file when its content hash
changes, and keep completion responsive while registration is in progress. The same installed
artifact must run under Bun and Deno, whose native SQLite modules have different names and whose
synchronous database APIs would block the LSP event loop if registration ran in the handler.

## Decision Drivers

- A completion request must never wait for file hashing or entry registration.
- A request during registration must see a complete previously committed file generation.
- Content bytes, not timestamp or size, must decide whether a file changed.
- Bun and Deno must use their native SQLite implementations from one built artifact.
- The persistent index should not be duplicated in memory without measured need.

## Considered Options

1. Keep a per-file in-memory trie and persist separate metadata in SQLite.
2. Query a SQLite B-tree index and register files on the main JavaScript thread.
3. Query a SQLite B-tree index and register files in a Worker using atomic generations.

## Decision Outcome

**Chosen option**: "Query a SQLite B-tree index and register files in a Worker using atomic
generations", because it gives requests a persistent indexed snapshot without duplicating every
entry in a trie or running hashing and synchronous writes on the LSP event loop.

Each file has one active generation. A Worker streams one pass to derive SHA-256, then, for changed
bytes, streams a second pass to decode and insert lines while verifying the same hash. It switches
the active pointer and deletes the old generation in the same transaction. SQLite runs in WAL mode
with separate reader and writer connections, so readers see the old generation until commit and
the new generation afterwards.

The runtime-neutral adapter dynamically loads a module containing a static `bun:sqlite` import
under Bun, or one containing a static `node:sqlite` import under Deno. Only the selected module is
resolved. The Bun-specific source is the sole reasoned exception to the repository's default ban
on `bun:*` imports.

### Consequences

**Positive:**

- Completion reads only committed rows and never waits for registration.
- A failed or interrupted update preserves the previous generation.
- Restarting the server can use persisted entries immediately.
- No second full dictionary representation consumes JavaScript heap.

**Negative:**

- Worker startup is paid when a refresh actually begins.
- Prefix queries still execute synchronously on the request thread.
- The two native SQLite adapters must remain behaviorally aligned.
- Rows belonging only to configurations no longer in use are not garbage-collected initially.

**Neutral:**

- A completion answered just before commit remains an answer from the old snapshot; the current
  tsudoi completion contract has no `isIncomplete` flag with which to request an automatic retry.

### Confirmation

Automated tests must demonstrate native parameterized queries under Bun and Deno, whole-line and
UTF-8 indexing, hash no-op and changed-byte replacement, old-snapshot reads while refresh remains
pending, atomic old-to-new visibility across commit, error rollback, refresh coalescing, and a
built-artifact Worker smoke test under both runtimes. Separate package-shape tests verify the files
included in the packed artifact. A benchmark must show a request exceeding the completion latency
budget before an in-memory trie is introduced.

## Pros and Cons of the Options

### In-memory trie plus SQLite metadata

- Good, because prefix traversal is proportional to the prefix and returned subtree.
- Good, because no database query runs on a keystroke after startup.
- Bad, because startup must rebuild the trie before it is useful.
- Bad, because every entry exists in both SQLite and JavaScript memory.
- Bad, because generation publication needs a second consistency mechanism for the trie.

### SQLite on the main thread

- Good, because SQLite already supplies a persistent B-tree prefix index.
- Good, because the implementation needs no Worker protocol.
- Bad, because reading, hashing, decoding, and synchronous inserts block every LSP request.

### Worker-backed SQLite generations

- Good, because the expensive update path runs outside the LSP event loop.
- Good, because SQLite transaction visibility directly supplies the old-snapshot requirement.
- Good, because the B-tree is both the persistent and searchable representation.
- Bad, because Worker lifecycle and cross-runtime module selection require integration tests.

## More Information

The initial design follows the prefix-search role of ddc-source-dictionary but differs from its
default in-memory trie: persistence is mandatory here, so SQLite is already present and should be
measured before another index is added.
