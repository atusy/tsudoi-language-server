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
        "Start from the Developer's verified spike at scratchpad/guard/.oxlintrc.json rather than prose -- the first application of the retrospective's spike-attachment rule. Delta to the repo config is two top-level rules plus one overrides entry.",
        "Manufactured RED is mandatory for subtask 1 because import/extensions already passes, so its test is born green. Perturbation A: delete the rule, the extension-less case must fail. Perturbation B: restore it but drop ignorePackages, the bare-specifier case must fail. Green under either perturbation means the test asserts nothing.",
        "PO invariant, settled at planning rather than Review: the guard's tests must be automated AND all four DoD checks must still exit 0 at HEAD with them present. Committed violation fixtures would make oxlint exit 1; the temp-dir probe harness is what reconciles this.",
        "Developer declined to automate the complementary `tsc accepts Bun.file` assertion: honest options were mutating the repo's own src/ mid-test or a slow temp dir with node_modules that still is not the real config. Recorded as a comment instead, and flagged rather than papered over.",
        "The runCli dual-runtime fix was routed to PBI-9, not smuggled into this sprint under PBI-6's benefit statement -- the Developer named that temptation and declined it.",
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
        "PBI-1 is not split: the ten PoC methods partition exactly across PBI-1..5, and PBI-1 is precisely one LSP lifecycle state machine with a legal ordering. Splitting it would put a state machine across a sprint boundary.",
        "Scrum Master enforced 1 Sprint = 1 PBI over the Developer's suggestion that PBI-6 might ride along. Sprint 1 therefore ships .oxlintrc.json with import/extensions only; the Bun rules are Sprint 2.",
        "Developer spike overrode the PO's assumption that PBI-6 would add a DoD check: plain oxlint auto-discovers .oxlintrc.json, so the guard lands inside an existing check. PO conceded, calling it strictly better.",
        "Guard scope is the Developer's default-deny rule, not the PO's src/-only proposal. PO conceded: fixture configs execute under deno, so src/-only would leave the highest-risk files unguarded.",
        "No deno.json, deliberately -- Deno 2 auto-detects package.json + node_modules, and adding one can flip npm resolution to the global cache and silently break the cross-runtime criterion.",
        "PO withdrew a proposed editor-attach demo: no LSP client is verified present in this environment, and with capabilities empty an attached editor would visibly do nothing.",
        "PO will not accept on a green suite alone, because the tests are written by the same agent that writes the implementation. Review requires live demonstration: a two-runtime boot of a stakeholder-shaped config, three PO-chosen failure cases each showing 0-byte stdout, the exit-without-shutdown code, the missing-deno message, and the import/extensions rule both failing and passing.",
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
          action: "Drop the unused export on cliPath in test/helpers/spawn.ts.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied at 45c00ba; all four DoD checks exit 0.",
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
