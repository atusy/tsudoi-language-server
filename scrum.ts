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
      id: "PBI-1",
      story: {
        role: "config author",
        capability: "start the server with --config and complete the LSP lifecycle",
        benefit: "they get a working server process before writing any handler",
      },
      acceptance_criteria: [
        {
          criterion:
            "initialize / initialized / shutdown / exit complete over stdio, with LSP exit-code semantics",
          verification:
            "Integration test asserts an InitializeResult naming serverInfo 'tsudoi', then exit code 0 for exit after shutdown, and exit code 1 for exit without a prior shutdown",
        },
        {
          criterion:
            "Every config load failure reports to stderr and exits 1 before any LSP traffic is emitted",
          verification:
            "One case each for --config omitted, file missing, TS syntax error, module throws on import, no default export, default export not a function, factory rejects; each asserts exit code 1, non-empty stderr and no bytes on stdout",
        },
        {
          criterion: "The CLI starts under both bun and deno",
          verification:
            "The initialize handshake completes for both `bun run src/cli.ts --config ...` and `deno run -A src/cli.ts --config ...`",
        },
      ],
      status: "ready",
      notes: [
        "--config has no default; omitting it is an error. The module default-exports (tsudoi: Tsudoi) => Promise<TsudoiConfig>.",
        "Cross-runtime is carried by this PBI's criteria, not by a separate DoD check. It is enforced transitively: the integration test spawns both runtimes and runs under `bun test`, which IS a DoD check. `deno` is therefore a hard toolchain requirement and its absence must fail loudly, never skip.",
        "A missing `deno` must fail with an actionable message naming this PBI's cross-runtime criterion plus an install pointer, not a raw ENOENT from spawn. (PO value requirement, round 2.)",
        "Spiked round 2: `await import(pathToFileURL(abs).href)` of a user .ts config resolves bare npm specifiers identically under bun and deno. No deno.json is added, deliberately -- Deno 2 auto-detects package.json + node_modules, and a deno.json can flip npm resolution to the global cache and silently break the cross-runtime criterion.",
        "Passes a Tsudoi carrying an empty read-only DocumentStore; PBI-2 replaces the implementation, not the shape. InitializeResult.capabilities stays empty until PBI-2/3/4 declare their own.",
        "Fixtures import types by relative path; the published specifier @atusy/tsudoi/types is deferred to PBI-7.",
      ],
    },
    {
      id: "PBI-6",
      story: {
        role: "tsudoi maintainer",
        capability: "detect Deno-incompatible patterns in the source automatically",
        benefit: "Deno compatibility cannot regress unnoticed between releases",
      },
      acceptance_criteria: [
        {
          criterion: "The check flags the Bun global and bun: module imports",
          verification: "Adding a Bun.file call makes `oxlint` fail; removing it makes it pass",
        },
        {
          criterion:
            "The check flags relative imports lacking an explicit .ts extension, without flagging bare node: or npm specifiers",
          verification:
            "Changing ./lib.ts to ./lib makes `oxlint` fail; restoring the extension makes it pass, while node:url and vscode-languageserver-protocol/node stay unflagged throughout",
        },
      ],
      status: "ready",
      notes: [
        "Spiked round 2: this is .oxlintrc.json configuration only, zero custom code. Plain `oxlint` auto-discovers the config, so the guard lands INSIDE existing DoD check #2 -- the Definition of Done needs no amendment.",
        "Scope is default-deny: the Bun global ban and import/extensions apply everywhere; bun:* imports are exempted only in **/*.test.ts and test/helpers/**, the minimum surface `bun test` needs. Fixture configs execute under deno, so they must stay Bun-free.",
        "import/extensions requires ignorePackages: true, or it also flags bare node:/npm specifiers.",
        "A rot detector, not an airtight barrier: (globalThis as {...}).Bun and oxlint-disable comments both bypass it, and no static rule proves Deno actually runs the server. It does not replace PBI-1's live deno smoke test.",
        "Sprint boundary: Sprint 1 creates .oxlintrc.json with import/extensions ONLY (PBI-1 needs it for its own Deno correctness). This PBI adds the Bun rules, the override scoping and the flag/unflag tests.",
      ],
    },
    {
      id: "PBI-2",
      story: {
        role: "config author",
        capability: "read the current text of a document from inside a handler",
        benefit: "their handlers can answer based on what the editor actually shows",
      },
      acceptance_criteria: [
        {
          criterion: "DocumentStore follows didOpen / didChange / didClose",
          verification:
            "Test sends each notification and asserts documents.values() membership after each",
        },
        {
          criterion: "documents.get(uri) returns the text of the latest version",
          verification:
            "Test applies successive didChange edits and asserts getText() and version match",
        },
      ],
      status: "draft",
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
          criterion: "The hover handler's return value reaches the client unchanged",
          verification: "A test config returns a fixed Hover; assert the response equals it",
        },
        {
          criterion: "An undefined handler responds with null rather than an error",
          verification:
            "A test config omits the handler; assert the result is null and no error is raised",
        },
      ],
      status: "draft",
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
          criterion: "Each yield is delivered as a partial result",
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
        "Regression risk: the obvious fix is a deno.json import map, which is exactly what PBI-1 deliberately avoids. PBI-1's cross-runtime criterion must still pass on completion.",
      ],
    },
  ],

  sprint: null,

  definition_of_done: {
    checks: [
      { name: "Tests pass", run: "bun test" },
      { name: "Lint passes", run: "oxlint" },
      { name: "Format check passes", run: "oxfmt --check ." },
      { name: "Type check passes", run: "tsc --noEmit" },
    ],
  },

  completed: [],

  retrospectives: [],
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
