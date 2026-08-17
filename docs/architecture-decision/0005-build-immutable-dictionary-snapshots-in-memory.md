# Build Immutable Dictionary Snapshots in Memory

|                     |                                                       |
| ------------------- | ----------------------------------------------------- |
| **Status**          | accepted                                              |
| **Date**            | 2026-08-17                                            |
| **Decision-makers** | Project stakeholder and maintainers                   |
| **Consulted**       | ADR 0002, ADR 0004, and the words_alpha.txt benchmark |
| **Informed**        | Dictionary completion config authors                  |

## Context and Problem Statement

Dictionary completion used a persistent Worker-backed SQLite index. The representative dictionary
contains 370,105 entries in 4.23 MB, and anticipated matching strategies need to inspect candidates
more freely than a B-tree prefix range allows. Keeping SQLite would preserve restart-time entries,
but would also retain runtime adapters, WAL state, and a storage-specific query boundary.

## Decision Drivers

- Completion requests must not wait for file I/O, hashing, or decoding.
- A request during refresh must see one complete old-or-new snapshot.
- Content bytes, not timestamp or size, must decide whether a file changed.
- The default prefix matcher should remain indexed and response-bounded.
- Candidate matching should not depend on Bun- and Deno-specific SQLite APIs.
- The measured target dictionary is small enough to keep one expanded copy per tsudoi process.

## Considered Options

1. Retain the persistent Worker-backed SQLite index.
2. Read and mutate an in-memory array on the LSP request thread.
3. Build immutable per-file snapshots in a Worker and atomically replace the combined in-memory index.

## Decision Outcome

**Chosen option**: "Build immutable per-file snapshots in a Worker and atomically replace the
combined in-memory index", because it removes storage-specific coupling while preserving
non-blocking refresh and old-or-new request visibility.

The Worker reads each configured file once and derives a SHA-256 hash from the same bytes it decodes.
An unchanged hash returns no replacement. Changed files return complete line arrays; failed files
return errors and no replacement. The handler builds a sorted, deduplicated combined array before
switching the snapshot reference. Default prefix retrieval uses binary search over the lowercase
search key.

### Consequences

**Positive:**

- Completion performs no database query or native-adapter dispatch on a keystroke.
- Matching and ranking can evolve as TypeScript over an immutable candidate snapshot.
- Bun and Deno share one Worker implementation and protocol.
- No SQLite database, WAL, schema, generation rows, or contention handling remains.

**Negative:**

- A new process yields no dictionary candidates until its first Worker result arrives.
- Every tsudoi process holds its own expanded dictionary representation.
- Every refresh still reads all configured bytes to verify their hashes.
- Publishing a changed file pays structured-clone and combined-array sorting costs.

**Neutral:**

- A request immediately before publication may answer from the previous snapshot; completion has no
  `isIncomplete` flag with which to request an automatic retry.

### Confirmation

Tests must demonstrate whole-line UTF-8 loading, content-hash no-op, failed-decode preservation,
immutable replacement, binary prefix lookup, response bounds, old-snapshot reads during refresh,
and Worker publication under both Bun and Deno. Packed artifacts must contain no SQLite adapter or
storage module and runtime tests must observe no database file.

## Pros and Cons of the Options

### Persistent Worker-backed SQLite

- Good, because a restart can answer from persisted entries immediately.
- Good, because large dictionaries do not occupy JavaScript heap as strings.
- Bad, because general matching either materializes SQL rows or couples matching to SQL planning.
- Bad, because native adapters, WAL, schema, and generation state remain part of the package.

### Mutable in-memory array on the request thread

- Good, because implementation and lookup are direct.
- Bad, because file I/O, decoding, and sorting can stall LSP requests.
- Bad, because in-place mutation exposes partial refreshes.

### Worker-built immutable snapshots

- Good, because expensive loading stays off the request thread.
- Good, because one reference replacement provides old-or-new visibility without mutable shared state.
- Good, because matchers consume ordinary TypeScript data.
- Bad, because startup and per-process memory costs are unavoidable without persistence.

## More Information

This decision supersedes
[ADR 0002](_0002-index-dictionaries-with-worker-backed-sqlite.md). The configurable filter contract
in [ADR 0004](0004-apply-configurable-dictionary-filters-in-the-handler.md) remains in force.
