// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 500 lines (overrides the
// scrum-dashboard skill's default of 300).
// ============================================================

const userStoryRoles = [
  "config author", // writes tsudoi.config.ts to stand up an LSP for their own language
  "editor user", // consumes that LSP from an editor (Neovim, VS Code, ...)
  "tsudoi maintainer", // maintains tsudoi itself
] as const satisfies readonly string[]; // Must have at least one role. Avoid generic roles like "user" or "admin". Remove obsolete roles freely.

const scrum: ScrumDashboard = {
  product_goal: {
    statement:
      "tsudoi lets developers assemble a Language Server for any language by writing a single TypeScript config file, without implementing the LSP protocol themselves.",
    success_metrics: [
      {
        metric: "An LSP for a new language can be stood up with a config file alone",
        target: "0 lines changed in tsudoi itself",
      },
      {
        metric: "PoC-scope LSP methods respond per the specification",
        target: "10 of 10 methods",
      },
      {
        metric: "The CLI starts under both Bun and Deno",
        target: "Smoke start succeeds on both runtimes",
      },
    ],
  },

  product_backlog: [
    {
      id: "PBI-2",
      story: {
        role: "config author",
        capability: "read the current text of a document from inside a handler",
        benefit: "their handlers can answer based on what the editor actually shows",
      },
      acceptance_criteria: [
        {
          criterion:
            "DocumentStore follows didOpen / didChange / didClose, with textDocumentSync advertised in InitializeResult",
          verification:
            "InitializeResult advertises { openClose: true, change: TextDocumentSyncKind.Full }; test sends each notification and asserts documents.values() membership after each, and that get() returns undefined once didClose has arrived",
        },
        {
          criterion: "documents.get(uri) returns the text of the latest version",
          verification:
            "Test applies successive didChange edits and asserts getText() and version match the last one sent",
        },
        {
          criterion: "A notification for a document that was never opened is ignored, not fatal",
          verification:
            "Test sends didChange and didClose for a URI never opened, then asserts documents.get() is undefined and the server still completes shutdown/exit with code 0",
        },
      ],
      status: "ready",
      notes: [
        "Full sync, not Incremental (PO call): identical getText() at PoC scale, and it avoids position/offset machinery tsudoi otherwise never needs -- handlers do their own position math on params.position.",
        "openClose: true must be advertised explicitly. Advertising only `change` entitles a conforming client to withhold didOpen/didClose, which makes the first criterion unsatisfiable against a real editor while passing every hand-driven test.",
        "TextDocument keeps exactly the brief's shape -- uri, languageId, version, getText(). No positionAt/offsetAt. Revisit only if PBI-3 shows every config author reimplementing position math; then it is its own PBI.",
        "test/lifecycle.test.ts asserts capabilities equals {} exactly. Advertising textDocumentSync turns it red -- widen the assertion to the advertised shape, do not delete it. PBI-3 and PBI-4 widen it again.",
        "Replace the empty DocumentStore implementation Sprint 1 left behind; do not change the Tsudoi shape.",
      ],
    },
    {
      id: "PBI-3",
      story: {
        role: "editor user",
        capability: "receive hover information for the symbol under the cursor",
        benefit: "they can read documentation without leaving the editor",
      },
      acceptance_criteria: [
        {
          criterion:
            "hoverProvider is advertised when the config supplies a hover handler, and not when it does not",
          verification:
            "Two configs, one with the handler and one without; assert InitializeResult advertises hoverProvider for the first and omits it for the second",
        },
        {
          criterion: "The hover handler's return value reaches the client unchanged",
          verification: "A test config returns a fixed Hover; assert the response equals it",
        },
        {
          criterion: "A hover request with no handler configured answers null rather than an error",
          verification:
            "A config omitting the handler is driven with a hover request anyway; assert the result is null and a subsequent request is answered normally",
        },
        {
          criterion: "A handler that throws or rejects does not take the server down",
          verification:
            "A config whose handler throws, and one whose handler rejects; each yields an error response to that request, a diagnosable message on stderr, stdout carrying only the JSON-RPC response, and a subsequent hover answered normally",
        },
      ],
      status: "ready",
      notes: [
        "Conditional advertisement is per-method, not a generic derivation framework -- PBI-4 makes the same call for completionProvider. This is the decision PBI-1 deferred, landing where round 1 said it would.",
        "The third criterion covers non-conforming clients only: a conforming client never sends hover when hoverProvider is unadvertised. It survives because a server must not fail because a client misbehaves.",
        "Position math stays the config author's job -- params.position plus getText(). This is the PBI that decides whether TextDocument needs positionAt/offsetAt (PBI-2 note 3).",
        "Widen test/lifecycle.test.ts's capabilities assertion again, do not delete it.",
        "Measured in Sprint 3, addressed to the fourth criterion: createProtocolConnection is passed no logger, so vscode-jsonrpc defaults to NullLogger and a throwing handler is swallowed with no stderr and no effect on the exit path. The `diagnosable message on stderr` therefore needs a logger passed in (stderr only -- stdout purity), and that logger is also what would let Sprint 3's unopened-URI live test tell `ignored` from `threw`.",
      ],
    },
    {
      id: "PBI-4",
      story: {
        role: "editor user",
        capability: "receive completion candidates incrementally",
        benefit: "slow sources do not block the first candidates from appearing",
      },
      acceptance_criteria: [
        {
          criterion:
            "Each yield is delivered as a partial result, with completionProvider advertised in InitializeResult",
          verification:
            "Test passes a partialResultToken and asserts one $/progress notification per yield, in order",
        },
        {
          criterion: "Without a partialResultToken, every chunk is aggregated into one response",
          verification:
            "Test omits partialResultToken and asserts a single response containing every yielded item plus the returned items",
        },
        {
          criterion: "Returning null after partial results yields an empty CompletionItem[]",
          verification: "A test config yields then returns null; assert the final result is []",
        },
      ],
      status: "draft",
      notes: [
        "Refinement gap to close before this is ready: the brief gives TWO aggregation triggers -- no partialResultToken, OR the client not advertising partial-result support. The criteria cover only the first.",
        "Widen test/lifecycle.test.ts's capabilities assertion again for completionProvider, do not delete it.",
        "completionProvider is advertised conditionally, per-method, the same call PBI-3 makes for hoverProvider -- not a generic derivation framework.",
      ],
    },
    {
      id: "PBI-5",
      story: {
        role: "config author",
        capability: "abandon work for a request the client has cancelled",
        benefit: "their handlers stop burning time on results nobody will read",
      },
      acceptance_criteria: [
        {
          criterion: "$/cancelRequest aborts context.signal for the targeted request",
          verification:
            "A test config awaits the signal; send $/cancelRequest and assert signal.aborted becomes true and the request settles",
        },
      ],
      status: "draft",
    },
    {
      id: "PBI-7",
      story: {
        role: "config author",
        capability:
          "import tsudoi's types by the published package specifier from their own project",
        benefit: "their config type-checks without relative paths into tsudoi's source tree",
      },
      acceptance_criteria: [
        {
          criterion: 'A config importing from "@atusy/tsudoi/types" loads under both bun and deno',
          verification:
            "A fixture config imports types by the published specifier; the initialize handshake completes under `bun run` and `deno run -A`",
        },
        {
          criterion: "The published specifier resolves for type checking, not only at runtime",
          verification: "tsc --noEmit passes over that fixture config",
        },
      ],
      status: "draft",
      notes: [
        "Deferred out of PBI-1 in round 2. Needs package self-reference (name + exports in package.json), unverified under Deno. Not an impediment: self-reference is entirely local, needing no registry, npm account or publish.",
        "Type-only imports are erased at runtime, so no PoC method behavior depends on this; ordered last for that reason.",
        "Regression risk: the obvious fix is a deno.json import map, which is exactly what Sprint 1 deliberately avoided. The cross-runtime lifecycle tests must still pass on completion.",
      ],
    },
    {
      id: "PBI-8",
      story: {
        role: "config author",
        capability: "learn how to start tsudoi against their own config without reading its source",
        benefit:
          "they can stand up a server without reverse-engineering the CLI or its runtime flags",
      },
      acceptance_criteria: [
        {
          criterion: "The documented quickstart runs as written",
          verification:
            "Copy the README's quickstart command verbatim and run it from a clean checkout under both bun and deno; each returns an InitializeResult naming tsudoi",
        },
        {
          criterion: "The deno permission set is documented and matches what the suite spawns",
          verification:
            "The README names the permissions deno actually requires and why; test/helpers/lsp.ts spawns that same set, so docs and suite cannot drift",
        },
        {
          criterion: "The contract a reader cannot guess is stated",
          verification:
            "README states that --config has no default, that the config default-exports a factory, and that deno must be on PATH or `bun test` fails",
        },
      ],
      status: "draft",
      notes: [
        "Ordered after PBI-7 so the documented import is @atusy/tsudoi/types, not a relative path -- writing it earlier guarantees a rewrite.",
        "The permission criterion says 'the permissions deno actually requires' rather than promising to beat -A: vscode-jsonrpc may pull in more than --allow-env --allow-read, and a docs deliverable must not be held hostage by an open investigation. The anti-drift mechanism is the part that matters.",
      ],
    },
    {
      id: "PBI-9",
      story: {
        role: "tsudoi maintainer",
        capability: "keep the lifecycle and config-failure guarantees pinned by automated tests",
        benefit: "behaviour verified only by hand at Sprint 1 Review cannot regress unnoticed",
      },
      acceptance_criteria: [
        {
          criterion: "The shutdown response is pinned for spec-compliant pacing",
          verification:
            "Test awaits the shutdown response, asserts it arrives, then sends exit and asserts code 0",
        },
        {
          criterion: "The config-failure cases run under both runtimes",
          verification:
            "The seven cases are parameterised over bun and deno; each asserts exit 1, non-empty stderr and 0-byte stdout",
        },
        {
          criterion: "Every guard rule is pinned at every path shape a .ts file takes in this repo",
          verification:
            "One shared path-shape list covering src/, **/*.test.ts, test/helpers/, test/fixtures/ and examples/ drives the Bun-global, bun:* and import/extensions tests alike; each rule is asserted flagged or exempt at every shape",
        },
      ],
      status: "draft",
      notes: [
        "Both behaviours already pass, so each test must be proven to fail before it is trusted -- perturb the exit path and the deno args, confirm red, restore.",
        "Sprint 2 left the three guard rules pinned across three DIFFERENT incomplete path sets. import/extensions is pinned only at src/ and the two probe paths -- not at test/fixtures/ or examples/, which are exactly the files the cross-runtime suite executes under deno, and extensionless relative imports are the failure that bites there. Correct today by default-deny, and lifecycle.test.ts running examples/ under deno is a live backstop, so this is a missing pin rather than a hole.",
        "ignorePackages defends npm subpath specifiers ONLY. node:url is unflagged with or without it, so the round-2 perturbation defends the npm half alone and the node: half of PBI-6's criterion was trivially true rather than guarded.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
    {
      number: 2,
      pbi_id: "PBI-6",
      goal: "Make Deno support stop depending on anyone remembering it -- the codebase itself rejects the changes that would quietly break the second runtime, before the sprints that write most of the source.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 706c0d0, 1cd4137, 3ee8eed, e05e45d, d1687f1 across 4 subtasks. Per-subtask records compacted here; git retains them.",
        "PO invariant, settled at planning rather than Review: the guard's tests must be automated AND all four DoD checks must still exit 0 at HEAD with them present. Committed violation fixtures would make oxlint exit 1; the temp-dir probe harness is what reconciles this.",
      ],
    },
    {
      number: 1,
      pbi_id: "PBI-1",
      goal: "One config file brings up a real language server process under whichever runtime the user already has, with nothing repo-specific making it work and no failure mode that leaves them guessing.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in eb92147..f5f76a0 across 15 TDD subtasks, plus 4d553af (Review-driven fix) and 45c00ba (retrospective action). Per-subtask records compacted here; git retains them.",
        "No deno.json, deliberately -- Deno 2 auto-detects package.json + node_modules, and adding one can flip npm resolution to the global cache and silently break the cross-runtime criterion.",
      ],
    },
  ],

  definition_of_done: {
    checks: [
      { name: "Tests pass", run: "bun test" },
      { name: "Lint passes", run: "oxlint" },
      { name: "Format check passes", run: "oxfmt --check ." },
      { name: "Type check passes", run: "tsc --noEmit" },
    ],
  },

  sprint: {
    number: 3,
    pbi_id: "PBI-2",
    goal: "Turn documents.get(uri) from a stub into the editor's live buffer -- the first line of the stakeholder's own example config, and the substrate every method after this one answers from.",
    status: "in_progress",
    subtasks: [
      {
        test: "The initialize result's capabilities equals { textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Full } } exactly, under both runtimes.",
        implementation:
          "Return that object from src/server.ts's InitializeRequest handler; TextDocumentSyncKind comes from vscode-languageserver-protocol/node. WIDEN test/lifecycle.test.ts's expect(capabilities).toEqual({}) to the new exact shape -- do not delete it, do not weaken to toBeDefined(). openClose: true is not optional: advertising only `change` lets a conforming client withhold didOpen/didClose, making criterion 1 unsatisfiable against a real editor while every hand-driven test passes.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "81ac35e", message: "feat(server): advertise full-sync sync", phase: "green" },
        ],
        notes: [],
      },
      {
        test: "On a fresh store, an open registers a document whose uri, languageId, version and getText() all match, and values() contains exactly that one document.",
        implementation:
          "New src/documents.ts with createDocumentStore() returning { documents, open, change, close } -- the mutation API stays OFF DocumentStore so the Tsudoi shape is untouched by construction rather than by discipline. Fake it: one entry suffices here. TextDocument keeps exactly the brief's four members; no positionAt/offsetAt.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "aa5b588",
            message: "feat(documents): register an opened document",
            phase: "green",
          },
        ],
        notes: [],
      },
      {
        test: "Successive changes leave getText() and version matching the last one sent; after close, get() is undefined and values() is empty.",
        implementation:
          "Evolve to a Map<string, TextDocument>. Under Full sync take contentChanges.at(-1)!.text -- a conforming client sends exactly one full-text change, and taking the last is the defensive read -- and take the version from params.textDocument.version, never a counter. TextDocumentContentChangeEvent is a union but `text` is present on both members, so no narrowing is needed under strict.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "1e434c5",
            message: "feat(documents): follow changes and closes",
            phase: "green",
          },
        ],
        notes: [],
      },
      {
        test: "Applying change then close to a URI never opened throws nothing, leaves get() undefined and values() empty.",
        implementation:
          "Guard the map lookups: no throw, no implicit creation. Resist non-null assertions here -- they are exactly what would make this fatal.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "73b2677", message: "test(documents): pin the unopened uri", phase: "green" },
        ],
        notes: [
          "Born green -- the guard shipped inside the previous subtask's change/close. RED manufactured by replacing the lookup guard with `byUri.get(uri)!`: only `change and close for a uri never opened are ignored, not fatal` failed.",
        ],
      },
      {
        test: "N/A (structural) -- the whole Sprint 1 and Sprint 2 suite must stay green, unchanged.",
        implementation:
          "createTsudoi() builds on createDocumentStore() and returns { documents } while handing the mutation handle to the caller for startServer. Delete emptyDocuments and its 'PBI-2 replaces this implementation' comment. The Tsudoi interface in src/types.ts is NOT touched.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "e49cbb6",
            message: "refactor(tsudoi): back documents with the store",
            phase: "green",
          },
        ],
        notes: [],
      },
      {
        test: "Integration, both runtimes. A: didOpen then didChange, then shutdown/exit -- the snapshot reports one document with the latest text and version. B: didOpen then didClose -- the snapshot is empty.",
        implementation:
          "Register DidOpen/DidChange/DidCloseTextDocumentNotification, each delegating to the mutation handle. Add test/fixtures/snapshot-config.ts -- Bun-free (deno executes it), types imported by relative path with .ts. Observation seam, verified under both runtimes: the fixture's factory registers process.on('exit', ...) which writes `TSUDOI_SNAPSHOT <json>` to stderr from [...tsudoi.documents.values()]. The test parses that line after the exit-code promise settles. This proves notifications reach the store THE CONFIG AUTHOR SEES, not merely one the server holds.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "cc44ffe",
            message: "feat(server): feed the sync notifications in",
            phase: "green",
          },
          {
            hash: "6c9b910",
            message: "test(lsp): make stdout purity assert",
            phase: "refactoring",
          },
        ],
        notes: [],
      },
      {
        test: "didChange and didClose for a URI never opened, then initialize -> shutdown -> exit: exit code 0, an empty snapshot, and no stack trace in stderr.",
        implementation:
          "Expected to need no production change if the guard subtask was done properly. BORN GREEN -- manufactured RED is mandatory. Perturbation: in src/documents.ts make change dereference the missing entry (non-null assertion or an explicit throw). This subtask AND the unopened-URI unit subtask must both fail; the other unit subtasks and the wiring subtask must stay green. If this one stays green, it asserts nothing -- most likely the exit code is read before the child settles, or a handler throw is swallowed by vscode-jsonrpc without affecting the exit path. Record which tests flipped, then restore.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "5ce2823", message: "test(sync): pin the unopened uri live", phase: "green" },
        ],
        notes: [
          "P1, the mandated perturbation (`byUri.get(uri)!` in change): flipped ONLY the unit test `change and close for a uri never opened are ignored, not fatal`. It did NOT flip this subtask's live test. Measured cause: createProtocolConnection is given no logger, so vscode-jsonrpc defaults to NullLogger (connection.js:296, :85) and catches the handler throw at :688 -- no stderr, no effect on the exit path. UNDEFENDED: no live test distinguishes `ignored` from `threw and was swallowed`. Routed to PBI-3, which owns handler diagnosability.",
          "P2, added because P1 left the live test asserting nothing (implicit creation instead of a throw): flipped `expect(readSnapshot(session.stderr)).toEqual([])` in `didChange and didClose for a uri never opened are survivable, not fatal` under BOTH runtimes, plus the unit test. It only flips because both tests were first strengthened to observe the store before any close of the changed uri -- as originally written, the close hid the implicit creation and P2 flipped nothing.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "The mutation API stays off DocumentStore: createDocumentStore() returns { documents, open, change, close }, so `documents` keeps exactly the get/values shape the config sees and the Tsudoi interface is unchanged BY CONSTRUCTION rather than by discipline.",
      "Advertise-versus-respond is split across subtasks 1 and 6 -- the split the Developer committed to after the PBI-3 capabilities near-miss. Here it is load-bearing rather than ceremonial: subtask 6 passes without subtask 1, and that combination is the dead-product shape.",
      "PO Review checklist, issued at planning rather than Review so the plan can target it: (1) driven over stdio through the real server, not a directly-constructed store; (2) a document containing Japanese text, end to end, kept permanently -- no test in this suite has ever contained a non-ASCII byte, and the layer expected to break is deliberately not named; (3) didChange proven to REPLACE by a replacement that makes the document SHORTER, asserted by exact equality -- a concatenating store passes any toContain assertion; (4) values() does not leak closed documents -- open two, close one, assert exactly one member; (5) textDocumentSync shown literally, plus a perturbation removing openClose that must name a test going red; (6) the unopened-URI case live; (7) stdout purity across the notification sequence; (8) the capabilities assertion widened, not deleted, and still exact; (9) document behaviour under both runtimes or an explicit statement of why not.",
      "This sprint adds test/fixtures/snapshot-config.ts to a path import/extensions does not currently pin -- the exact gap PBI-9 closes. Known and deliberately not widened here.",
    ],
  },
  retrospectives: [
    {
      sprint: 2,
      improvements: [
        {
          action:
            "A note addressed to a PBI other than the one it sits on must be written onto THAT PBI when the note is created, not left to be rescued at compaction. This removes the compaction-time check rather than adding a second thing to remember.",
          timing: "sprint",
          status: "active",
          outcome:
            "First application found a real orphan immediately: PBI-2 said 'PBI-3 and PBI-4 widen it again', PBI-3 carried its copy, PBI-4 carried nothing. Written onto PBI-4.",
        },
        {
          action:
            "An attached spike must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask. A scratchpad path is a pointer, not an attachment -- it dies with the session, and a fresh executor would re-derive or guess.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "Amendment to the manufactured-RED rule: the perturbation must be confirmed to flip a SPECIFIC NAMED assertion, and if it flips only part of what it was claimed to defend, the undefended part must be stated.",
          timing: "immediate",
          status: "active",
          outcome:
            "Prompted by the round-2 perturbation claiming to defend `node: and npm specifiers stay unflagged` when ignorePackages moves the npm half only -- a defence asserted without being measured.",
        },
      ],
    },
    {
      sprint: 1,
      improvements: [
        {
          action:
            "Planning rule: when a subtask's test is created by parameterising or extending an already-green test rather than by driving new production code, it is born green -- its RED must be MANUFACTURED, and the subtask notes must record the exact perturbation used and which cases failed under it.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "Review measurements are reported item by item against the PO's acceptance checklist, using the checklist's own numbering, including items that pass trivially -- so an omission is visible as an omission.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "When a planning spike produces passing code, attach the code for the executor to start from; the plan then says what to change about it instead of re-deriving it in prose.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "Give runCli the Runtime parameter LspSession already takes and run the seven-case failure taxonomy under deno as well as bun.",
          timing: "sprint",
          status: "active",
          outcome:
            "Routed to PBI-9 rather than a Sprint 2 subtask, so Sprint 2 stays scoped to PBI-6's two oxlint rules.",
        },
      ],
    },
  ],
};

// ============================================================
// Type Definitions (DO NOT MODIFY - request human review for schema changes)
// ============================================================

// PBI lifecycle: draft (idea) -> refining (gathering info) -> ready (can start) -> done
type PBIStatus = "draft" | "refining" | "ready" | "done";

// Sprint lifecycle
type SprintStatus = "planning" | "in_progress" | "review" | "done" | "cancelled";

// TDD cycle: pending -> red (test written) -> green (impl done) -> refactoring -> completed
type SubtaskStatus = "pending" | "red" | "green" | "refactoring" | "completed";

// behavioral = changes observable behavior, structural = refactoring only
type SubtaskType = "behavioral" | "structural";

// Commits happen only after tests pass (green/refactoring), never on red
type CommitPhase = "green" | "refactoring";

// When to execute retrospective actions:
//   immediate: Apply within Retrospective (non-production code, single logical change)
//   sprint: Add as subtask to next sprint (process improvements)
//   product: Add as new PBI to Product Backlog (feature additions)
type ImprovementTiming = "immediate" | "sprint" | "product";

type ImprovementStatus = "active" | "completed" | "abandoned";

// An impediment is a blocker ONLY a human can resolve (credentials, external
// accounts, irreversible decisions, denied permissions). Agent-solvable
// obstacles are just work; PBI gaps go back to refinement instead.
type ImpedimentStatus = "waiting_human" | "resolved";

interface SuccessMetric {
  metric: string;
  target: string;
}

interface ProductGoal {
  statement: string;
  success_metrics: SuccessMetric[];
}

interface AcceptanceCriterion {
  criterion: string;
  verification: string;
}

interface UserStory {
  role: (typeof userStoryRoles)[number];
  capability: string;
  benefit: string;
}

interface PBI {
  id: string;
  story: UserStory;
  acceptance_criteria: AcceptanceCriterion[];
  status: PBIStatus;
  notes?: string[]; // refinement decisions, dissent, open questions
}

interface Commit {
  hash: string;
  message: string;
  phase: CommitPhase;
}

interface Subtask {
  test: string;
  implementation: string;
  type: SubtaskType;
  status: SubtaskStatus;
  commits: Commit[];
  notes: string[];
}

interface Impediment {
  description: string;
  impact: string; // how it affects the Sprint Goal
  request: string; // what exactly the human should do or decide
  status: ImpedimentStatus;
  notes: string[]; // workarounds attempted, resolution outcome
}

interface Sprint {
  number: number;
  pbi_id: string;
  goal: string;
  status: SprintStatus;
  subtasks: Subtask[];
  impediments: Impediment[];
  decisions: string[]; // key decisions from event conversations, incl. dissent
}

interface DoDCheck {
  name: string;
  run: string;
}

interface DefinitionOfDone {
  checks: DoDCheck[];
}

interface Improvement {
  action: string;
  timing: ImprovementTiming;
  status: ImprovementStatus;
  outcome: string | null;
}

interface Retrospective {
  sprint: number;
  improvements: Improvement[];
}

interface ScrumDashboard {
  product_goal: ProductGoal;
  product_backlog: PBI[];
  sprint: Sprint | null;
  definition_of_done: DefinitionOfDone;
  completed: Sprint[];
  retrospectives: Retrospective[];
}

// JSON output (deno run scrum.ts | jq for queries)
console.log(JSON.stringify(scrum, null, 2));
