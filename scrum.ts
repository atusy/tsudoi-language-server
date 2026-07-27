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
        target:
          "Smoke start succeeds on both runtimes, both from a repo checkout and from an installed package",
      },
    ],
  },

  product_backlog: [
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
          criterion:
            "The documented quickstart runs as written, EXTRACTED from the README rather than mirrored",
          verification:
            "The test reads the commands out of README.md and executes them verbatim under both bun and deno, FROM A STAGED ENVIRONMENT THAT SUPPLIES NOTHING THE README ASKS THE READER TO DO, each returning an InitializeResult naming tsudoi. Extraction asserts an EXPECTED NON-ZERO COMMAND COUNT before asserting anything about what it found. Omitting any single documented step must then make the quickstart fail, swept under ONE runtime -- licensed by Sprint 10's measurement that the route is one file path both runtimes take identically, NOT by cost. NEGATIVE CONTROLS: editing a command in the README reddens it, which a test holding its own copy would not; and a step whose omission STILL SUCCEEDS means either the README documents something unnecessary or THE HARNESS IS SUPPLYING IT, and either way the pass was not evidence",
        },
        {
          criterion:
            "The documented deno permissions are the ones the suite spawns, with the reason a reader needs to judge them",
          verification:
            "The flags are read out of README.md and compared to what test/helpers/lsp.ts spawns. The README states WHY -- vscode-jsonrpc reads XDG_RUNTIME_DIR at module load, so -A is a DEPENDENCY'S demand rather than tsudoi's -- and that narrower sets are untested. NEGATIVE CONTROL: narrowing either side alone reddens",
        },
        {
          criterion: "The contract a reader cannot guess is stated, TOLERANTLY asserted",
          verification:
            "README.md carries that --config has no default, that the config default-exports a factory, and that deno must be on PATH or `bun test` fails. BOTH halves: rewording a sentence must still PASS, and removing a fact must FAIL",
        },
        {
          criterion: "The documented failure behaviour happens as written",
          verification:
            "Break the documented quickstart config and run it under both runtimes; assert exit 1, a tsudoi:-prefixed reason on stderr and zero bytes on stdout, EACH COMPARED AGAINST WHAT README.md STATES. NEGATIVE CONTROL: changing the README's stated exit code reddens it",
        },
      ],
      status: "ready",
      notes: [
        "ALL FOUR CRITERIA ARE VACUOUS UNLESS THE TESTS READ THE README'S OWN BYTES. A plausible-but-wrong README -- right shape, stale command, wrong flag, wrong exit code -- passes every test holding its own copy and fails one that EXTRACTS. Standing item 6 applied to prose; it is the mechanism that has kept examples/tsudoi.config.ts from rotting for eleven sprints. Four criteria is the right COUNT; the discriminator is EXTRACTION, not enumeration.",
        "SHIPS DESPITE THE OPEN IMPEDIMENT: a README instructing a route nobody can take is useless, and blocking the last deliverable on a human publication decision leaves the project permanently without one. Document the TARBALL route as the working instruction, state the registry route as intended-and-unverified, and SAY PLAINLY THAT THE PACKAGE IS UNPUBLISHED -- otherwise a reader wonders why they are packing a tarball.",
        "The -A reason is OWED: a Deno user handing all permissions to a server that reads their source needs to know it is a third-party MODULE-LOAD ENV READ, not tsudoi wanting their network -- and that a narrower set is UNTESTED, since the minimum was never measured.",
        "If the README documents cleanup at all, the claim is that tsudoi CLOSES the generator, never that the author's cleanup COMPLETES. The reason is at src/methods.ts, where the measurement and the language semantics are recorded. A note rather than a criterion: a criterion satisfiable by SILENCE is one nothing would make fail.",
        "OPEN IMPEDIMENT, waiting_human: `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package never published, and publishing needs an account and is irreversible.",
        "RISK a post-publication check must look for, and NOT `npm will do npm things`: install-from-tarball and `deno add npm:` are DIFFERENT MECHANISMS -- the first populates node_modules, the second can resolve through Deno's OWN cache depending on whether the consumer has a package.json.",
      ],
    },
  ],

  completed: [
    {
      number: 11,
      pbi_id: "PBI-9",
      goal: "Make a green run mean exactly what we claim -- no less, by pinning what only hands have checked; no more, by unpinning what nobody promised.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 10,
      pbi_id: "PBI-13",
      goal: "Make the cross-runtime promise survive distribution: a Deno user obtains tsudoi the stated way and it starts, without Bun losing the route it already has.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "The stated route's FIRST line -- how a user obtains the package -- is verified from a local tarball, not from npm. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package that has never been published, and publishing needs an account and is irreversible.",
          impact:
            "PBI-13's criteria are met for everything after the install: the same artifact, the same install command shape and the same entry point serve both runtimes. What is NOT verified is that the registry hands a user this tarball -- the metric says `from an installed package`, and installed-from-a-tarball is the closest a developer can get without a human decision.",
          request:
            "Decide whether to publish 0.0.x to npm so the obtain half can be verified, and provide the account if so. Until then nothing in this repo may claim the registry route works; test/installed-runtime.test.ts marks it NOT VERIFIED in the same comment that states it.",
          status: "waiting_human",
          notes: [
            "Not raised as an impediment during the sprint because it blocked nothing: the remedy, the build and both runtimes were all verifiable without it. It is recorded now so the PO sees the one edge of the route the suite does not reach.",
          ],
        },
      ],
      decisions: [],
    },
    {
      number: 9,
      pbi_id: "PBI-7",
      goal: "Make the stakeholder's own example importable -- @atusy/tsudoi/types rather than a relative path into our source -- from outside this repo and under both runtimes.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 8,
      pbi_id: "PBI-11",
      goal: "Keep a promise JavaScript already makes -- a config author's finally runs when their completion is abandoned -- so cleanup they can never watch succeed is not silently skipped on every keystroke, and the last gate on releasing this thing comes down.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 7,
      pbi_id: "PBI-10",
      goal: "Make tsudoi safe to hand to a stranger -- when a client sends what the specification forbids, it gets an error or a correct fallback with a trace, never silently fewer items than the handler produced.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 6,
      pbi_id: "PBI-5",
      goal: "Make slow sources safe as well as first-class -- when the client cancels, context.signal aborts and a config author's handler can stop -- so the streaming API built last sprint never leaves abandoned work running.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 5,
      pbi_id: "PBI-4",
      goal: "Make yield and return the whole of a config author's streaming API -- tsudoi decides whether that reaches the client as $/progress chunks or one aggregated response -- so the most precisely specified thing in the brief is the thing they never have to think about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 4,
      pbi_id: "PBI-3",
      goal: "Complete the chain from a config author's file to a human's screen: the hover text they write is what an editor shows, with zero lines changed in tsudoi.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 3,
      pbi_id: "PBI-2",
      goal: "Turn documents.get(uri) from a stub into the editor's live buffer -- the first line of the stakeholder's own example config, and the substrate every method after this one answers from.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        'The Japanese test found a latent defect in the TEST helper, not the server: per-chunk chunk.toString("utf8") turns any multi-byte character the pipe splits into U+FFFD. Silent at small payloads, deterministic RED at 360KB under both runtimes.',
      ],
    },
    {
      number: 2,
      pbi_id: "PBI-6",
      goal: "Make Deno support stop depending on anyone remembering it -- the codebase itself rejects the changes that would quietly break the second runtime, before the sprints that write most of the source.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
    },
    {
      number: 1,
      pbi_id: "PBI-1",
      goal: "One config file brings up a real language server process under whichever runtime the user already has, with nothing repo-specific making it work and no failure mode that leaves them guessing.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
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
    number: 12,
    pbi_id: "PBI-8",
    goal: "Make eleven sprints reachable by someone who was not here -- a README whose own bytes are what the suite runs, so the instructions cannot drift from the product.",
    status: "in_progress",
    subtasks: [
      {
        test: "EXPECTED RED -- no README exists. The extractor reads README.md and yields the quickstart commands, asserting the EXPECTED COUNT. PAIRED POSITIVE CONTROL, permanent: a probe README missing them yields zero and fails.",
        implementation:
          "README.md quickstart documenting the TARBALL route as the working instruction, stating plainly that the package is unpublished and that bun add / deno add npm: are intended-and-unverified. test/helpers/readme.ts. Reuse installConsumer() -- the quickstart IS the route it already implements. PROSE CONSTRAINT settled before the first line: commands must be runnable VERBATIM from a STATED working directory, so the README says where the reader is standing and uses relative paths.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "f6cb1aa",
            message: "docs(readme): a quickstart whose own bytes the suite extracts",
            phase: "green",
          },
        ],
        notes: [
          "RED OBSERVED: `Cannot find module ./helpers/readme.ts` -- there was no README and no extractor.",
          "DEVIATION from the subtask's `reuse installConsumer()`: installConsumer PERFORMS the pack and the install, which are two of the documented steps. Reusing it would stage an environment supplying what the README asks the reader to do, which is precisely what the PO's bareness reframe forbids. The checkout staging is duplicated instead, at test/helpers/readme.ts, with the reason recorded there.",
          "MEASURED, and it is why the quickstart needs no `bun init`: `bun install <tarball>` in an EMPTY directory succeeds and writes the package.json itself (bun 1.3.13).",
          "The marker grammar carries the working directory, which the prose states too -- so the extractor REFUSES a directory no reader is shown. Without that the mechanism reintroduces the two-copy defect it exists to prevent.",
        ],
      },
      {
        test: "EXPECTED RED. Each extracted command executes verbatim under bun and deno from a staged environment supplying NOTHING the README asks the reader to do; the handshake returns an InitializeResult naming tsudoi. PERTURBATION: edit a command in README.md -- change a flag, stale a path. MUST redden. If it does not, the test is holding its own copy and the criterion is vacuous. RUN IT; do not infer it from the extractor's existence.",
        implementation:
          "Whatever the README's commands require to be runnable from the stated working directory.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "7b8b15e",
            message: "test(readme): run the documented commands from a bare environment",
            phase: "green",
          },
        ],
        notes: [
          "PERTURBATION RUN, not inferred. (a) STALED A PATH -- dist/cli.js -> dist/main.js in the BUN start command only. FLIPPED: `the README's quickstart brings up a server under bun` at `expect(outcome.serverName ?? outcome.diagnosis).toBe('tsudoi')`, reporting `Module not found dist/main.js`. STAYED GREEN: the deno half and all four extraction tests -- the discrimination is per-command, not per-file.",
          "PERTURBATION RUN. (b) CHANGED A FLAG'S VALUE -- `--filename tsudoi.tgz` -> `tsudoi-x.tgz` in step 1 alone. FLIPPED: BOTH quickstart assertions, at the install step (`../tsudoi-language-server/tsudoi.tgz failed to resolve`). A test holding its own copy of the commands would have stayed green through both.",
          "The staged environment is BARE and that is asserted structurally rather than promised: runQuickstart builds its own stage per call and exposes no way to pass one in, so the sweep cannot be `optimised` into sharing one.",
        ],
      },
      {
        test: "EXPECTED RED. For each step i in the extracted quickstart, run the sequence with step i omitted and assert it FAILS. Swept under ONE runtime -- licensed by Sprint 10's measured route-identity, not by cost.",
        implementation:
          "The sweep's real function is to prove THE ENVIRONMENT IS BARE: an omitted step that still succeeds means something other than the documented command is supplying it, which makes the intact run's pass a test of the harness rather than evidence. The property is `omitting any documented step makes the quickstart fail, from an environment supplying nothing documented`; N pack-and-install cycles is ONE mechanism, and a cheaper one establishing the same property is the Developer's to take.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "95fd3dd",
            message: "test(readme): sweep every documented step's omission",
            phase: "green",
          },
        ],
        notes: [
          "BORN GREEN BY CONSTRUCTION, not expected-RED: subtasks 2 and 3 share ONE implementation moment (runQuickstart), so only the first could claim RED. Sprint 5's rule, applied without being reminded of it.",
          "SWEEP RESULT PER STEP, each failing for its OWN reason rather than one generic failure. omit `bun pm pack --filename tsudoi.tgz` -> install has no tarball to resolve, start reports `Module not found dist/cli.js`. omit `bun install ../tsudoi-language-server/tsudoi.tgz` -> same symptom from the other cause, node_modules never exists. omit `write tsudoi.config.ts` -> `tsudoi: failed to load config ...` and exit 1. omit the start command -> `no step started a server`.",
          "THE CHEAPER MECHANISM the PO left open was taken, and it was not fewer cycles: it is that `bun install <tarball>` needs no package.json and `bun pm pack --filename` needs no version-dependent name, which cuts the documented sequence to four steps. MEASURED cost of a full cycle: pack 0.05s, install 0.16s -- five fresh stages run in 0.47s, so sharing a stage would have bought nothing and cost the omit-pack iteration its meaning.",
          "The last step's omission is DEGENERATE-LOOKING and kept deliberately: it is the strongest bareness assertion here, since anything other than the documented command starting a server would show up exactly there.",
        ],
      },
      {
        test: "EXPECTED RED. The flags extracted from README.md equal what the suite actually spawns. TWO PERTURBATIONS, BOTH REQUIRED: narrow the README's flags alone -> must redden; narrow denoRuntime.runArgs alone -> must redden. A one-sided test passes when both drift TOGETHER, which is the failure this criterion exists to catch.",
        implementation:
          "IMPORT denoRuntime from test/helpers/lsp.ts and read runArgs rather than parsing the helper's source -- the compared value then comes from the thing that really runs, and no second parsing mechanism enters needing its own vacuity guard. Separately, tolerantly assert the README states WHY: vscode-jsonrpc reads XDG_RUNTIME_DIR at module load, so -A is a DEPENDENCY'S demand rather than tsudoi's, and narrower sets are UNTESTED because the minimum was never measured.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "3397dda",
            message: "test(readme): compare the documented deno flags with what is spawned",
            phase: "green",
          },
        ],
        notes: [
          "PERTURBATION A RUN -- narrowed the README ALONE, `deno run -A` -> `deno run --allow-read`. FLIPPED: `the deno permissions the README documents are the ones the suite spawns`, run in ISOLATION with -t so the signal could not be an earlier test's corpse. Also flipped `the README's quickstart brings up a server under deno`; the bun half and every extraction test STAYED GREEN.",
          "PERTURBATION B RUN -- narrowed `denoRuntime.runArgs` ALONE, ['run','-A'] -> ['run']. FLIPPED IN ISOLATION: the same flags assertion, expecting '-A' and receiving a list without it. Across the whole suite it reddens 65 tests, which is why it was run isolated: a perturbation that only killed the file would not have defended THIS assertion.",
          "Perturbation B also RE-MEASURED the README's own claim: every one of those 65 failures is `NotCapable: Requires env access to XDG_RUNTIME_DIR` from vscode-jsonrpc/lib/node/main.js:191, at module load. The reason the README gives a reader is measured, not reasoned.",
          "The vacuity guard for this criterion lives in invocationOf, which THROWS when a command has no script path or nothing between the runtime and it -- an empty flag list would make `the documented flags are what is spawned` true of nothing.",
        ],
      },
      {
        test: "EXPECTED RED, BOTH HALVES perturbation-tested. README.md carries that --config has no default, that the config default-exports a factory, that deno must be on PATH or `bun test` fails, and that the package is unpublished. Rewording a sentence must still PASS; removing a fact must FAIL. Neither half is optional and they fail in OPPOSITE directions.",
        implementation:
          "Match on the DISCRIMINATING TOKENS of each fact, not on sentences. The reader is stipulated, so every assumed prerequisite is named -- an unnamed prerequisite cannot be perturbed and therefore is not defended.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "EXPECTED RED. Break the documented quickstart config; run it under both runtimes; assert exit code, tsudoi:-prefixed stderr reason and zero stdout bytes -- EACH COMPARED AGAINST THE VALUE EXTRACTED FROM README.md, never a constant the test holds. PERTURBATION: change the README's stated exit code to 2; MUST redden. That is the whole criterion -- the README is the source of the expectation.",
        implementation: "None beyond the assertions.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "N/A (structural).",
        implementation:
          "Record at test/helpers/readme.ts -- the site where someone would `simplify` by inlining an expected command -- that all four criteria are VACUOUS unless the tests read the README's own bytes, AND the zero-match vacuity mode, since that is the specific way a future edit would silently disable everything. A decision whose violation is a code edit lives at the edit site, and this PBI's note compacts.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "THE DEVELOPER FOUND A VACUITY MODE INSIDE THE PO'S OWN REMEDY, before building it: AN EXTRACTOR THAT FINDS NOTHING PASSES. If the fence markers move, extraction yields zero commands, `every extracted command succeeds` is VACUOUSLY TRUE, and the README rots exactly as if the tests held their own copy. Mechanism satisfied, property false -- the mod-3 residue shape, in a fourth place. Every extraction therefore asserts an expected non-zero count FIRST, permanently.",
      "THE PO REFRAMED THE COMPLETENESS AMENDMENT AND THE REFRAME IS THE POINT: the Developer proposed it as defending NECESSITY (no documented step is useless). SUFFICIENCY -- nothing undocumented is required -- is what criterion 1 delivers, but ONLY if the staged environment supplies nothing the README asks the reader to do. The sweep's real function is to PROVE THE ENVIRONMENT IS BARE; without it criterion 1 is a test of the harness.",
      "The one-runtime sweep is licensed by Sprint 10's MEASURED route-identity, not by cost, and that is recorded so the basis can be revisited if the route ever diverges.",
      "The PO applied the property-not-mechanism rule TO THEMSELVES one turn after handing it over: the property is `omitting any documented step makes the quickstart fail, from an environment supplying nothing documented`. N pack-and-install cycles is one mechanism, and a cheaper one is the Developer's to take unseen.",
      "COST OBJECTION OVERRULED ON AN ASYMMETRY: a README that omits a required step is WORSE THAN NO README -- a reader follows it, fails, and concludes the product is broken. It is the most likely defect in a document written by people who have internalised every step, and omission arrives at birth where staleness needs time. Extraction catches stale; only the sweep catches incomplete.",
    ],
  },
  retrospectives: [
    {
      sprint: 13,
      improvements: [
        {
          action:
            "A claim about WHAT THE SUITE COVERS is checked against the suite before it is recorded. Recalled coverage is not coverage.",
          timing: "sprint",
          status: "active",
          outcome:
            "The measured-or-reasoned label does not help here: the falsified note did not read as unlabelled, it read as CHECKED. Coverage claims are cheap to verify and expensive when wrong, and this one was the premise for a scheduling decision.",
        },
        {
          action:
            "A PLAN INSTRUCTION STATES THE PROPERTY TO ESTABLISH, NOT THE MECHANISM TO USE. Where it must name a mechanism, it says whether the mechanism was MEASURED to produce the property.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed by the Scrum Master against their own conduct, at the PO's ruling that `the Developer will catch it` fails the Sprint 2 standard -- it makes correctness depend on someone downstream remembering to look, and the piped-exit-code defect shows how slowly that works when they do not: nine sprints. Honest limit stated by the PO: this covers the chunk-boundary case and NOT the piped exit code, which is measurement hygiene rather than mechanism-specification and is already fixed by capturing each check unpiped.",
        },
      ],
    },
    {
      sprint: 12,
      improvements: [
        {
          action:
            "A PLAN MAY NOT SUBSTITUTE A PROXY FOR A CRITERION'S PROPERTY. Where a subtask offers a RECIPE, it must NAME the property that recipe is meant to achieve and REQUIRE THAT PROPERTY BE MEASURED -- so the executor can detect the recipe failing to deliver it.",
          timing: "immediate",
          status: "active",
          outcome:
            "One layer below the checklist-versus-criterion drift: there the reviewer's thinking runs ahead of the criterion; here the plan converts a criterion into an implementation recipe and the recipe silently becomes the real acceptance test. Sprint 11's criterion required a PROPERTY (reverting spawn.ts reddens the non-ASCII assertion); both the Scrum Master's instruction and the Developer's subtask replaced it with a PROXY (size the payload past the pipe buffer). The proxy was satisfied while the property was FALSE -- chunk boundaries at multiples of one size share one offset mod 3, so at 360KB deno's first run split nothing. Covers Scrum-Master-authored and Developer-authored plan text alike: the artifact is the plan, whoever wrote the sentence.",
        },
      ],
    },
    {
      sprint: 11,
      improvements: [
        {
          action:
            "When a perturbation CANNOT BE CONSTRUCTED, classify it. NOT CONSTRUCTED: the means were lacking -- the assertion is undefended, say what remains at risk. FORECLOSED: the design makes the failure UNREPRESENTABLE -- name the design property that forecloses it. These are OPPOSITE findings and must never share wording. Corollary, and the more useful half: FORECLOSING A FAILURE BEATS DETECTING IT -- a test that cannot be written because the bug cannot exist is a better outcome than a test that catches the bug.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed by the Developer against themselves: their vocabulary had three outcomes -- reddened, did not redden, could not build it -- and the third defaulted to the pessimistic reading, so they reported a DESIGN SUCCESS in the language of a coverage gap. Sprint 10's case was foreclosure: dist/ is gitignored and built by prepack, so a stale published build is not a failure the suite must catch, it is a state the design cannot enter.",
        },
      ],
    },
    {
      sprint: 10,
      improvements: [
        {
          action:
            "A criterion's NEGATIVE CONTROL belongs in its `verification` TEXT, not in the plan's perturbations. When refinement or planning discovers the discriminating change, hand back amended verification wording rather than recording a perturbation privately.",
          timing: "immediate",
          status: "active",
          outcome:
            "The lifetime argument applied to criteria: the verification field travels with the criterion through every compaction, a plan evaporates at Review. Diagnosed by the Developer as WHY the negative-control rule did not fire twice in Sprint 9 -- it did fire, and the answer landed in the plan rather than the criterion. It is also the Developer-side fix for the PO's checklist-versus-criteria drift: if the discriminating change is written into the verification, the checklist cannot drift ahead of the criterion.",
        },
        {
          action:
            "When a decision must live in a MACHINE-FORMATTED FILE that cannot carry comments, its durable home is a TEST THAT ASSERTS IT. The file carries the decision; the test carries the reason.",
          timing: "immediate",
          status: "active",
          outcome:
            "Closes the hole in the lifetime rule rather than patching it. package.json has no comments and oxfmt sorts unknown keys to the tail; a pointer header decays. test/resolution.test.ts already proved the pattern -- PBI-7's criterion 3 compacted unamended precisely because a TEST, not a note, was holding it. A test is executable documentation that cannot silently drift and fails when someone violates it.",
        },
      ],
    },
    {
      sprint: 10,
      improvements: [
        {
          action:
            "A criterion's VERIFICATION must be able to DISCRIMINATE the property it claims, and must not be contradicted by anything else in the record. When a note or a planning-time checklist item supersedes a criterion's verification, THE CRITERION IS AMENDED IN THAT TURN -- a checklist governs one Review; a criterion governs the work.",
          timing: "sprint",
          status: "active",
          outcome:
            "One rule, not two, because both instances share a root: PBI-7's criterion 1 was a runtime test for a compile-time property contradicted by its own note, and criterion 3's verification was contradicted by the PO's own planning instruction. The PO named the pattern -- the checklist is where their current thinking lands and the criterion is where it was. Splitting the rule would invite exactly the drift it is filed against. An AUDIT of unlabelled old notes was rejected as self-defeating: it would be the author labelling their own notes from memory, an unmeasured assertion about which assertions were unmeasured.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "SHARPENED ON LIFETIME, replacing the route-to-a-PBI rule: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; a decision that shapes WHAT TO BUILD NEXT belongs on the PBI. When it does both it goes in both -- and the SOURCE COMMENT IS THE DURABLE COPY, because a dashboard note has the lifetime of a PBI and every PBI eventually compacts. When in doubt, put it in the source.",
          timing: "immediate",
          status: "active",
          outcome:
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction. Evidence: the Sprint 7 shutdown ruling survives in src/methods.ts with its reasoning intact while the PBI carrying it compacted away.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME: name the change that would make it fail. If nothing would, the criterion is VACUOUS and must be rewritten before it binds.",
          timing: "immediate",
          status: "active",
          outcome:
            "The absence-pairing rule moved from assertions to criteria and from execution to refinement. PBI-7's runtime criterion would have consumed a sprint and produced a green test proving nothing -- and the fact that made it vacuous was already written in its own PBI's notes. It was caught only because the probe was ordered first.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "COMPACTION may not drop a recorded decision unless it has a DURABLE HOME elsewhere -- a comment at the code site it constrains, an acceptance criterion, or a note on an OPEN PBI -- and each compaction NAMES where every dropped decision went. A commit message is NOT a durable home. Improvements with status active are never compacted.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed after the Scrum Master raised it about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record. Nobody greps commit messages before editing a line; a comment at the site is read by whoever changes it. Naming the destination makes the editorial judgement auditable rather than trusted. AUDIT RUN AT FILING: 15 active improvements present, and every earlier drop traced to a named successor (three consolidated into the Sprint 4 rule) or a route to PBI-9. No unexplained losses.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "PREFER SPLITTING OVER DOCUMENTING: when a perturbation would flip at an earlier assertion than the sub-claim it targets, that is a signal the test BUNDLES independent sub-claims. Split the test so each sub-claim can fail alone, rather than recording that the headline claim is undefended.",
          timing: "immediate",
          status: "active",
          outcome:
            "Better than covered -- it DISSOLVES what the earlier-assertion clause only documents. Sprint 7's subtask 5 needed exactly this and it was discovered during execution rather than declared at planning; as a planning-time rule the fix moves earlier and the retro carries less.",
        },
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. DEFAULT for everything written before this rule: an UNLABELLED note is read as REASONED, not measured, until someone measures it.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed at the Developer's request after they named it at second occurrence. Sprint 2: a perturbation claimed to defend node: specifiers defended only the npm half. Sprint 7: rejecting an out-of-range token was said to lose the client's items when normalise-and-report delivers every one of them. Both times the DECISION was right and the stated REASON false -- the more dangerous failure, because a false premise is what someone acts on two sprints later. The consolidated rule disciplines assertions and perturbations; it said nothing about prose.",
        },
      ],
    },
    {
      sprint: 7,
      improvements: [
        {
          action:
            "A behaviour is pinned by a test where ONE outcome is required. Where TWO outcomes would both be acceptable, record the decision and leave it unpinned -- and the burden is to NAME THE ALTERNATIVE that would also be acceptable.",
          timing: "sprint",
          status: "active",
          outcome:
            "A bounding condition on seven sprints of pin-everything pressure, whose cost is already visible: PBI-9 carries three separate instances of hardcoded-response-id brittleness -- tests that resist legitimate change without defending a requirement. The name-the-alternative clause is what stops it becoming an escape hatch: `there is nothing to preserve` is easy to assert, `cancelling in-flight requests at shutdown would be equally acceptable` is falsifiable.",
        },
      ],
    },
    {
      sprint: 6,
      improvements: [
        {
          action:
            "Every assertion that something is ABSENT -- zero stderr, zero $/progress, a label not on stdout -- ships with a PAIRED assertion, permanent in the suite, that the same measurement observes it when present. A perturbation proves the apparatus once, on the day it was run; the pair proves it on every run, including after someone refactors the accumulator two sprints later.",
          timing: "immediate",
          status: "active",
          outcome:
            "Generalises what the PO had been imposing by hand criterion by criterion. Absence assertions are the ones least often perturbed, because `nothing happened` feels self-evident.",
        },
        {
          action:
            "A perturbation specified by the PRODUCT OWNER names the assertion it is required to flip, not just the mutation to make. If it flips an earlier assertion instead, it has not defended the claim it was written for and a different perturbation is required.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed separately from the perturbation-LABELLING rule on purpose: that one governs how the Scrum Master REPORTS (reproduction versus independent, expected versus observed), this one governs how the PO AUTHORS. Different owners, different phases; merging them would lose what makes each actionable.",
        },
      ],
    },
    {
      sprint: 5,
      improvements: [
        {
          action:
            "A plan must declare which subtasks share ONE IMPLEMENTATION MOMENT. Within such a group only the first can claim expected-RED; the rest are born-green-by-construction and carry perturbations, however distinct their criteria are.",
          timing: "immediate",
          status: "active",
          outcome:
            "Sprint 5's subtasks 5-7 were planned expected-RED and came out born green: one async generator cannot be dispatched twice. `Do not split a single dispatch` is the WRONG lesson -- the split is what produced six independently perturbable criteria. The plan simply bought sequencing it could not have.",
        },
        {
          action:
            "A helper that terminates a subprocess must settle every promise it owns before the process dies. Cross-test misattribution is a suite-integrity failure, not a single-test bug.",
          timing: "immediate",
          status: "active",
          outcome:
            "Fixed in Sprint 5; recorded so the shape is recognisable if PBI-9's helper work recurs it.",
        },
        {
          action:
            "Standing-list amendment (item 6 above): the stakeholder-facing example is the artifact under test with no fixture copy in existence. It is why the example cannot rot without the suite going red, and why Sprint 4's hover demo could be the stakeholder's own file, unmodified.",
          timing: "immediate",
          status: "active",
          outcome:
            "Today it survives only because test/lifecycle.test.ts happens to load that file; nothing stops a duplicate fixture appearing. Sprint 5 covered it by the Developer's initiative, not by structure.",
        },
      ],
    },
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
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new. Standing list: (1) driven over stdio through the real server, not against directly-constructed internals; (2) stdout carries only protocol, with non-protocol bytes COUNTED rather than eyeballed; (3) non-ASCII payloads on any new user-visible path, permanent in the suite; (4) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (5) both runtimes, and the Definition of Done at HEAD; (6) the stakeholder-facing example examples/tsudoi.config.ts is the ARTIFACT UNDER TEST, with no fixture copy of it in existence -- a PRODUCT property rather than a test property, which is why it belongs here rather than being rediscovered. Moving an item to the standing list removes it from the PO's authoring, NEVER from the Scrum Master's reporting -- if a standing item stops being reported, we have traded verification for convenience.",
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
