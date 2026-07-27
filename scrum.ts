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
        "That finding cannot be closed by assumption: vscode-jsonrpc turns a REQUEST-handler throw into an error response, while a NOTIFICATION-handler throw falls to the logger and is swallowed. Satisfying criterion 4 through the request path alone would leave the notification path exactly as swallowed as today. Rule explicitly on whether a notification handler's throw is surfaced, and pin it with a live test that tells ignore-by-design from throw-and-swallow. (PO states the asymmetry as the believed mechanism, not a measured one -- confirm it first.)",
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
            "completionProvider is advertised when the config supplies a completion handler, and not when it does not",
          verification:
            "Two configs, one with the handler and one without; assert InitializeResult advertises completionProvider for the first and omits it for the second",
        },
        {
          criterion:
            "Each yield reaches the client as exactly one $/progress, in order, while the handler is still running",
          verification:
            "A handler yields a distinguishable chunk, blocks on a gate the test releases, then yields a second; assert the first $/progress arrives while the handler is still blocked, then the second after release, one per yield, matching content and order",
        },
        {
          criterion:
            "With a partialResultToken the response result is the returned array alone, not a repeat of the yields",
          verification:
            "A handler yields two chunks and returns a third; assert the response result equals the third only, so a client concatenating progress plus response sees each item exactly once",
        },
        {
          criterion:
            "Without a partialResultToken the yields and the return are aggregated into one response, and no $/progress is sent",
          verification:
            "The same handler driven without the token; assert a single response containing every yielded item plus the returned items, and zero $/progress notifications",
        },
        {
          criterion:
            "A null return yields [] when partial results were already sent, and null when none were",
          verification:
            "Two configs, one yielding then returning null and one returning null immediately; assert [] and null respectively",
        },
        {
          criterion: "A handler that throws after yielding does not take the server down",
          verification:
            "A handler yields once then throws; assert the already-sent $/progress remains on stdout and is followed by an error response, a diagnosable message on stderr, no non-protocol bytes on stdout, and a subsequent completion answered normally",
        },
      ],
      status: "ready",
      notes: [
        "Aggregation has ONE observable trigger, not two: LSP has no client capability declaring partial-result support -- a client lacking it simply omits partialResultToken -- so the brief's second trigger collapses into the first by protocol design. window.workDoneProgress is not a proxy. This closes the gap flagged at init by decision, not by dropping it.",
        "In streaming mode the response result is the RETURNED array alone, not a concatenation: the yields already went as $/progress. The brief's own rule that a null return after partials produces [] has no reason to exist under the concatenation reading, so this is the reading under which the brief is coherent.",
        "completionProvider is advertised as an empty object. No triggerCharacters: the brief does not ask for them and TsudoiConfig has no surface to declare them; that is a config-schema change and its own PBI.",
        "Widen test/lifecycle.test.ts's capabilities assertion again for completionProvider, do not delete it.",
        "PO: six criteria is deliberate and each closes a distinct green-but-broken path. Do not cut one to make room.",
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
        "test/helpers/spawn.ts has the same per-chunk decode bug fixed in lsp.ts during Sprint 3. Consequence is narrow and was overstated on first reading: the CLI writes stderr directly and nothing in src/ decodes it, so a Japanese config author's error message is NOT mojibake -- what we cannot currently do is write a test asserting a non-ASCII config-failure message.",
        "The 360KB Japanese test's failure mode depends on OS pipe buffer sizes. Deterministic here (3/3 under both runtimes), but on a platform with much larger buffers it degrades to passing trivially rather than failing.",
        "ignorePackages defends npm subpath specifiers ONLY. node:url is unflagged with or without it, so the round-2 perturbation defends the npm half alone and the node: half of PBI-6's criterion was trivially true rather than guarded.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
    {
      number: 3,
      pbi_id: "PBI-2",
      goal: "Turn documents.get(uri) from a stub into the editor's live buffer -- the first line of the stakeholder's own example config, and the substrate every method after this one answers from.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 81ac35e, aa5b588, 1e434c5, 73b2677, e49cbb6, cc44ffe, 6c9b910, 5ce2823 across 7 subtasks. Per-subtask records compacted here; git retains them.",
        "The mandated perturbation FAILED to work and the cause was measured, not guessed: createProtocolConnection gets no logger, so vscode-jsonrpc falls back to NullLogger and CATCHES a notification-handler throw -- no stderr, no exit-code effect. No live test here distinguishes ignore-by-design from throw-and-swallow. Routed to PBI-3 rather than fixed in place, because a stderr logger belongs to PBI-3 criterion 4.",
        "stdout purity was BROKEN and only a perturbation found it: a stray write from didOpen failed ZERO tests, because an unanchored Content-Length search reads past stray bytes and frames the next message correctly anyway. Now counted by unframedStdoutBytes; the same perturbation fails 6 tests.",
        'The Japanese test found a latent defect in the TEST helper, not the server: per-chunk chunk.toString("utf8") turns any multi-byte character the pipe splits into U+FFFD. Silent at small payloads, deterministic RED at 360KB under both runtimes.',
        "STANDING, endorsed by the PO from inside the work: anything not perturbed in a sprint is assumed unproven. Two of three new assertion mechanisms here asserted nothing until perturbed.",
        "The mutation API stays off DocumentStore: createDocumentStore() returns { documents, open, change, close }, so `documents` keeps exactly the get/values shape the config sees and the Tsudoi interface is unchanged BY CONSTRUCTION rather than by discipline.",
        "Advertise-versus-respond is split across subtasks 1 and 6 -- the split the Developer committed to after the PBI-3 capabilities near-miss. Here it is load-bearing rather than ceremonial: subtask 6 passes without subtask 1, and that combination is the dead-product shape.",
        "PO Review checklist, issued at planning rather than Review so the plan can target it: (1) driven over stdio through the real server, not a directly-constructed store; (2) a document containing Japanese text, end to end, kept permanently -- no test in this suite has ever contained a non-ASCII byte, and the layer expected to break is deliberately not named; (3) didChange proven to REPLACE by a replacement that makes the document SHORTER, asserted by exact equality -- a concatenating store passes any toContain assertion; (4) values() does not leak closed documents -- open two, close one, assert exactly one member; (5) textDocumentSync shown literally, plus a perturbation removing openClose that must name a test going red; (6) the unopened-URI case live; (7) stdout purity across the notification sequence; (8) the capabilities assertion widened, not deleted, and still exact; (9) document behaviour under both runtimes or an explicit statement of why not.",
        "This sprint adds test/fixtures/snapshot-config.ts to a path import/extensions does not currently pin -- the exact gap PBI-9 closes. Known and deliberately not widened here.",
      ],
    },
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

  sprint: null,
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
