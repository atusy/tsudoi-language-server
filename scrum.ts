// ============================================================
// Dashboard Data (AI edits this section)
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
          criterion: "initialize / initialized / shutdown / exit complete over stdio",
          verification:
            "Integration test drives the server over stdio and asserts an InitializeResult, then a clean exit with code 0",
        },
        {
          criterion: "A config that fails to load reports to stderr and exits with code 1",
          verification:
            "Test spawns the CLI with a broken --config and asserts exit code 1 with non-empty stderr",
        },
        {
          criterion: "The CLI starts under both bun and deno",
          verification:
            "The initialize handshake completes for both `bun run src/cli.ts --config ...` and `deno run -A src/cli.ts --config ...`",
        },
      ],
      status: "draft",
      notes: [
        "--config has no default; omitting it is an error. The module default-exports (tsudoi: Tsudoi) => Promise<TsudoiConfig>.",
        "Cross-runtime support is carried by this PBI's criteria, deliberately not by the Definition of Done.",
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
          verification: "Test sends each notification and asserts documents.values() membership after each",
        },
        {
          criterion: "documents.get(uri) returns the text of the latest version",
          verification: "Test applies successive didChange edits and asserts getText() and version match",
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
          verification: "A test config omits the handler; assert the result is null and no error is raised",
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
      id: "PBI-6",
      story: {
        role: "tsudoi maintainer",
        capability: "detect Bun-specific APIs creeping into the source automatically",
        benefit: "Deno compatibility cannot regress unnoticed between releases",
      },
      acceptance_criteria: [
        {
          criterion: "The check flags Bun.* and bun: usage",
          verification: "Adding a Bun.file call makes the check fail; removing it makes it pass",
        },
      ],
      status: "draft",
      notes: ["Only Node-compatible APIs and standard Web APIs are permitted in src/."],
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
type SprintStatus =
  | "planning"
  | "in_progress"
  | "review"
  | "done"
  | "cancelled";

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
