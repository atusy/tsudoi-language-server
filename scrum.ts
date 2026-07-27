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
      id: "PBI-10",
      story: {
        role: "editor user",
        capability:
          "get a spec-correct response instead of a plausible but wrong one when their client sends something the specification does not allow",
        benefit:
          "a client bug surfaces as an error or a correct fallback, never as silently missing information",
      },
      acceptance_criteria: [
        {
          criterion: "A request arriving before initialize is answered -32002 ServerNotInitialized",
          verification:
            "Test sends hover before initialize; assert the error code and that the server still initializes afterwards",
        },
        {
          criterion: "A request arriving after shutdown is answered -32600 InvalidRequest",
          verification:
            "Test sends hover after shutdown; assert the error code and that exit still returns 0",
        },
        {
          criterion:
            "A partialResultToken that is not a valid ProgressToken does not cause silent item loss",
          verification:
            "A request sends partialResultToken as null; assert the client receives every item the handler produced, none stranded under an uncorrelatable token",
        },
      ],
      status: "draft",
      notes: [
        "Ordered after PBI-5: no conforming client triggers these, so they rank below the remaining PoC methods, but they are squarely inside success metric #2 -- answering a hover before initialize is not responding per the specification.",
        "MEASURED in Sprint 5: partialResultToken sent as null takes the streaming path (src/methods.ts branches on token === undefined), so items are streamed under an uncorrelatable token and the response carries only the return value. No error, no stderr, two items silently gone -- the worst failure class in this project.",
        "PO overruled the Developer's protocol reasoning while endorsing their process: ProgressToken is integer | string, so null is a MALFORMED value in a field that exists, not a token that is present. Normalising it is input validation, not the second aggregation trigger PBI-4 collapsed -- that trigger was a client capability with NO wire representation at all, which is why it collapsed.",
        'The third criterion is worded around VALIDITY, not around null, deliberately: 0 and "" are valid ProgressTokens while being falsy, so a fix written as `if (!token)` would break legitimate clients while fixing the null case. Refinement must not produce a truthiness check.',
        "The criterion states the value requirement, not the mechanism. Refinement settles normalise-to-absent versus -32602 versus normalise-plus-stderr.",
      ],
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
        "The example config's `if (!document) return null` branch is untested; the null path is covered only through the no-handler fixture.",
        "The completion arrivals assertion hardcodes response ids and demands the whole array; a vscode-jsonrpc bump emitting window/logMessage would break it at the array shape rather than at the ordering claim it defends.",
        "The 360KB Japanese test's failure mode depends on OS pipe buffer sizes. Deterministic here (3/3 under both runtimes), but on a platform with much larger buffers it degrades to passing trivially rather than failing.",
        "ignorePackages defends npm subpath specifiers ONLY. node:url is unflagged with or without it, so the round-2 perturbation defends the npm half alone and the node: half of PBI-6's criterion was trivially true rather than guarded.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
    {
      number: 5,
      pbi_id: "PBI-4",
      goal: "Make yield and return the whole of a config author's streaming API -- tsudoi decides whether that reaches the client as $/progress chunks or one aggregated response -- so the most precisely specified thing in the brief is the thing they never have to think about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 12fda1b, 2c4294b, e82e7ae, 1d0c0f2, 1a72d93, 38fe70b, e8af57a, 095cdf3 across 8 subtasks. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "The new earlier-assertion clause caught its first case IN THE ACT: perturbation A (buffer every yield) reddened at waitForProgress(1) and never reached expect(settled).toBe(false), so it proved the SERVER streams while leaving the headline claim undefended. Perturbation B (release the gate immediately) is what defends it -- without B a fast server passes A by accident.",
        "DECOMPOSITION FINDING, not an execution apology: subtasks 5, 6 and 7 were planned EXPECTED RED and came out BORN GREEN, because one async generator cannot be dispatched twice -- subtask 3's handler necessarily decided the no-token, null and failure branches at the same moment. A plan that splits one dispatch across four subtasks cannot buy the sequencing it assumes.",
        "Sprint 4's report-without-rethrow finding reproduced on the streaming path: an out-of-suite probe against the perturbed build returned RESULT [] with PROGRESS present and the stderr line present, so a stderr-only OR progress-only criterion would have passed while the client was handed a plausible empty answer.",
        "MEASURED under both runtimes: sendProgress emits exactly one $/progress per call in order; an awaited-polling handler stays interruptible so an in-band notification can gate it mid-request; and an error response still follows progress already written, with nothing retracting it.",
        "FOUND AT PLANNING, not in review: test/helpers/lsp.ts discards every server-initiated notification, so criterion 4's zero-$/progress assertion would have passed against a server streaming furiously. It is subtask 1, not a footnote.",
        "The stakeholder described nine methods loosely and then wrote a generic type signature plus three lines of protocol rules for this one. Whatever they were most worried about is in that type, and the worry reads clearly: a config author must never touch partialResultToken or $/progress. The async generator IS the protocol adapter. This sprint delivers that or delivers a leaky abstraction with the same signature.",
        "MEASURED, outside the six criteria and deliberately NOT fixed: a client sending `partialResultToken: null` instead of omitting it is streamed to under token null and then receives only the returned array, silently losing every yielded item. Both runtimes; the server does not fail and stdout stays clean. The remedy is one operator, but `null` is a token PRESENT, so treating it as absent invents the second aggregation trigger PBI-4's notes exist to collapse -- and shipping it untested would be an unperturbed branch. PO's call, not the executor's.",
        "EXECUTION DEVIATION, reported not smoothed: subtasks 5, 6 and 7 were planned EXPECTED RED and came out BORN GREEN. One async generator cannot be dispatched twice, so subtask 3's handler necessarily decided the no-token branch, the null branch and the failure branch at the same moment. Their evidence therefore rests entirely on perturbation, which is why every one of them carries two. A plan that splits one dispatch across four subtasks buys sequencing it cannot pay for.",
        "scrum.ts EXCEEDS its 600-line limit (655) with the mandatory perturbation records present. Reported rather than resolved by compacting another section, per the constraint. The obvious remedy is the one sprints 1-4 already used: compact this sprint's subtasks into decisions at Review, where git still retains them.",
        "PO checklist, per-sprint additions (the standing list applies unchanged): (1) streaming proven by ORDERING against the outstanding response, not by counting -- counting passes even if the server buffered every yield and flushed before responding; (2) the gate proven real by TWO labelled perturbations -- buffer all yields, the streaming test must redden (the server streams); release the gate immediately, the unsettled-response assertion must redden (the gate holds the response rather than the server merely being slow); (3) criterion 6 distinguishes `chunk arrived and stayed` from `chunk never arrived` by asserting distinguishable content and progress-then-error ordering, perturbed by suppressing progress on throw -- `clean up by not emitting chunks on failure` is a plausible thing to do deliberately; (4) criterion 5's two halves in the same run against the same build, neither satisfiable by a constant; (5) criterion 4's zero-progress assertion perturbed by emitting progress under an invented token.",
      ],
    },
    {
      number: 4,
      pbi_id: "PBI-3",
      goal: "Complete the chain from a config author's file to a human's screen: the hover text they write is what an editor shows, with zero lines changed in tsudoi.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in d0f172a, 4a49499, 31f169f, 0cecfec, e5c49cc, fe8f153, f5c612f across 7 subtasks. Per-subtask records compacted here; git retains them.",
        "PROVEN by an unrequested perturbation: report-without-rethrow reddens the -32603 assertions while the stderr assertions stay GREEN. A stderr-only criterion would have passed while the client silently received null. Conjunctive criteria earn their extra words -- PBI-4 and PBI-5 are written the same way.",
        "The Scrum Master ran two FAILED reproductions (a regex matching nothing reported 0 failures; a throw inserted in createDocumentStore rather than change reported 46). Under the previous practice the first would have reached the PO as `the advertisement test is vacuous` and drawn a rejection on false evidence. The expected-versus-observed rule caught both at the moment they happened.",
        "MEASURED, and it overturns what the plan would otherwise have assumed: a logger surfaces NOTIFICATION-handler throws only. A request-handler throw becomes a -32603 response with stderr EMPTY whether or not a logger is passed. Since hover is a request, criterion 4's `diagnosable message on stderr` CANNOT be satisfied by passing a logger -- tsudoi must catch, write its own stderr line, and rethrow.",
        "PO checklist item 1 (a real editor attaching) is FEASIBLE and settled at planning: nvim 0.13 attaches headlessly to `bun run src/cli.ts --config examples/tsudoi.config.ts`, reporting serverInfo tsudoi and capabilities { textDocumentSync: { openClose: true, change: 1 } }. It is therefore a live demonstration item this sprint, not a dropped one.",
        "positionAt/offsetAt deliberately NOT added and not taken to the PO yet: PBI-3 gives exactly one call site, and deciding an API from one call site is deciding from noise. Subtask 7 makes that call site real so PBI-4 inherits evidence -- if completion's author writes the same line-splitting again, that is two independent call sites converging and it becomes its own PBI with a measured justification.",
        "PO checklist, issued at planning: (1) a real editor attaching and displaying hover; (2) driven over stdio with examples/tsudoi.config.ts as the artifact under test, unmodified -- its handler has returned a fixed Hover into a void since Sprint 1 and now answers; (3) hover contents in Japanese, permanent; (4) perturb advertisement to unconditional and name the test that reddens -- the negative half is satisfiable by advertising nothing, which is what the code does today; (5) name the test that reddens when the undefined-handler path stops answering null; (6) criterion 4 on the request path; (7) criterion 4 on the NOTIFICATION path, accepted ONLY if perturbing the store to throw demonstrably produces stderr -- otherwise a zero-stderr assertion passes vacuously; (8) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (9) both runtimes and the DoD at HEAD.",
      ],
    },
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
      sprint: 4,
      improvements: [
        {
          action:
            "CONSOLIDATED, replacing the manufactured-RED rule and its three amendments: anything not perturbed is assumed unproven; every subtask declares expected-RED or born-green; every perturbation is named by the ASSERTION it flips, not by the subtask it belongs to -- and if it flips at an EARLIER assertion than the subtask's headline claim, that headline claim is still undefended and needs its own perturbation.",
          timing: "immediate",
          status: "active",
          outcome:
            "Amended three times already, which is its own signal: a rule list nobody can hold in their head stops being applied at exactly the moment it is needed. Prompted by Sprint 4's subtask-4 perturbation, which flipped the test entirely but at 'hover is answered at all', never reaching the null-versus-Hover claim its name promised.",
        },
        {
          action:
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new. Standing list: (1) driven over stdio through the real server, not against directly-constructed internals; (2) stdout carries only protocol, with non-protocol bytes COUNTED rather than eyeballed; (3) non-ASCII payloads on any new user-visible path, permanent in the suite; (4) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (5) both runtimes, and the Definition of Done at HEAD. Moving an item to the standing list removes it from the PO's authoring, NEVER from the Scrum Master's reporting -- if a standing item stops being reported, we have traded verification for convenience.",
          timing: "immediate",
          status: "active",
          outcome:
            "Nine items where three carried new information diluted the signal the item-by-item rule exists to protect. Counter-evidence weighed: Sprint 3's stdout-purity item LOOKED standing and found that sprint's largest defect, hence the still-reported clause.",
        },
      ],
    },
    {
      sprint: 3,
      improvements: [
        {
          action:
            "A Review perturbation states whether it REPRODUCES the Developer's recorded perturbation or is INDEPENDENT. Reproductions report expected versus observed failure counts, so a divergence surfaces when it occurs rather than at write-up.",
          timing: "sprint",
          status: "active",
          outcome:
            "Prompted by a Review perturbation reddening 6 tests where the Developer's reddened 2. The divergence was information; not noticing it until write-up was the defect. Mandating sameness would have cost Sprint 2's ignorePackages finding, which came from an independent probe.",
        },
      ],
    },
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
      ],
    },
    {
      sprint: 1,
      improvements: [
        {
          action:
            "The PO's acceptance checklist is issued at Sprint PLANNING, not at Review, so the plan can target it. Review measurements are then reported item by item against it, in the checklist's own numbering, including items that pass trivially -- so an omission is visible as an omission.",
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
