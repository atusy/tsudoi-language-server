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
          criterion: "The documented quickstart runs as written",
          verification:
            "Run the README's quickstart command verbatim, obtaining tsudoi exactly as the README instructs, under both bun and deno; each returns an InitializeResult naming tsudoi",
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
        {
          criterion: "The documented failure behaviour happens as written",
          verification:
            "Break the documented quickstart config and run it under both runtimes; assert exit code 1, a tsudoi:-prefixed reason on stderr and zero bytes on stdout, matching what the README states will happen",
        },
      ],
      status: "draft",
      notes: [
        "PBI-10 AND PBI-11 must both complete first: PBI-10 fixes a defect that silently loses user items, PBI-11 stops a streaming handler leaking on every superseded keystroke, and these two PBIs are what make the package installable. Both are named here because each is dropped on completion.",
        "Documents the failure CONTRACT -- exit 1, a tsudoi:-prefixed reason on stderr, zero bytes on stdout -- NOT the seven-case taxonomy. The contract is stable and unguessable; the catalogue is neither, and all three contract facts are already pinned by PBI-1's criteria in ASCII, so no PBI-9 work is a prerequisite. The fourth criterion breaks THE DOCUMENTED CONFIG ITSELF rather than shipping a second broken example that could drift.",
        "Deliberately does NOT claim a config author's own error message passes through verbatim. It does today -- the CLI writes stderr directly and nothing in src/ decodes it -- but it cannot be asserted for non-ASCII until PBI-9 fixes spawn.ts. Documenting a claim we cannot pin is the thing refused all project, applied here against a claim the PO would like to make.",
        "If the README documents the cleanup guarantee it must claim that TSUDOI CLOSES THE GENERATOR, not that the author's cleanup COMPLETES. That is precisely the overclaim dropping PBI-12 would otherwise licence, and PBI-8 is the last chance to record it before the backlog ends.",
        "OPEN IMPEDIMENT, waiting_human: the route's FIRST line -- how a user OBTAINS the package -- is verified for `install ./tarball` only. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package never published, and publishing needs an account and is irreversible. The README must not claim the registry route until that is unblocked.",
        "RISK the post-publication check must look for, and NOT `npm will do npm things`: `install ./tarball` and `deno add npm:` are DIFFERENT MECHANISMS -- the first populates node_modules, the second can resolve through Deno's OWN npm cache depending on whether the consumer has a package.json. Sprint 9 established Deno demands the dependency from node_modules, so the unverified first line could produce an on-disk shape the verified second line does not assume.",
        "Ordered after PBI-7 so the documented import is @atusy/tsudoi/types, not a relative path -- writing it earlier guarantees a rewrite.",
        "The permission criterion says 'the permissions deno actually requires' rather than promising to beat -A: vscode-jsonrpc may pull in more than --allow-env --allow-read, and a docs deliverable must not be held hostage by an open investigation. The anti-drift mechanism is the part that matters.",
      ],
    },
    {
      id: "PBI-9",
      story: {
        role: "tsudoi maintainer",
        capability: "trust what the suite says, and only what it says",
        benefit:
          "a green run is evidence for the claims made, and does not resist changes nobody promised not to make",
      },
      acceptance_criteria: [
        {
          criterion:
            "The config-failure cases run under both runtimes, including a non-ASCII message",
          verification:
            "The seven cases are parameterised over bun and deno, each asserting exit 1, tsudoi:-prefixed stderr and 0-byte stdout, with one case whose message is Japanese. NEGATIVE CONTROL: reverting spawn.ts to per-chunk decode reddens the non-ASCII assertion",
        },
        {
          criterion: "Content-Length is asserted as a byte count, deterministically",
          verification:
            "A multi-byte payload asserts the header equals Buffer.byteLength rather than string length, without depending on OS pipe buffer sizes. NEGATIVE CONTROL: string length reddens it by assertion rather than by timeout",
        },
        {
          criterion: "One shared path-shape list drives all three guard rules",
          verification:
            "src/, **/*.test.ts, test/helpers/, test/fixtures/ and examples/ drive the Bun-global, bun:* and import/extensions tests alike. NEGATIVE CONTROL: adding examples/** to the oxlint overrides reddens the examples shape",
        },
        {
          criterion: "The session helper settles every promise it owns and swallows nothing",
          verification:
            "A request issued to an already-dead session rejects naming the exit, and a failed stdin write surfaces. NEGATIVE CONTROL: restoring the close-only pending flush makes the first hang instead of rejecting",
        },
        {
          criterion:
            "Arrivals assertions defend ordering and content without pinning message shape",
          verification:
            "BOTH halves, or the rewrite only weakens the suite: injecting an extra window/logMessage-shaped notification must still PASS, and a genuinely wrong ordering must still FAIL",
        },
        {
          criterion: "Shape assertions require what is promised, not what happens to be there",
          verification:
            "package-shape.test.ts requires prepack present with the right value rather than scripts equalling exactly {prepack}. BOTH halves: adding an unrelated script must still PASS, and changing prepack's command must still FAIL",
        },
        {
          criterion:
            "The compiler that builds the published artifact is pinned by the repo, not by the machine",
          verification:
            "typescript resolves from the repo's own dependencies at a version the repo declares, and prepack uses that resolution. NEGATIVE CONTROL: removing the declaration reddens an assertion EVEN THOUGH an ambient tsc on PATH would still produce a working build",
        },
      ],
      status: "ready",
      notes: [
        "RE-PRICED at Sprint 10 refinement by applying the negative-control rule to criteria written seven sprints ago. Dropped the shutdown-pacing criterion: test/lifecycle.test.ts already awaits the shutdown response and asserts null under both runtimes, and the pipelined-exit half was ruled deliberately undefended at Sprint 3, so nothing remained to pin. RELOCATE THAT RULING TO src/lifecycle.ts BEFORE DROPPING IT.",
        "Dropped the example's `if (!document) return null` branch: its failure mode is already covered by PBI-2's unopened-URI criterion at the store level.",
        "The fourth and fifth criteria REMOVE test code. The fifth is trivially passable by DELETING assertions, which is why both halves are ONE criterion rather than a criterion plus a hope.",
        "Verbatim stderr passthrough of a config author's own message stays out of the README whether or not this lands first: it is GUESSABLE, so its absence is silence rather than a gap. The decode fix still lands here for the internal reason that it blocks asserting a non-ASCII failure message at all.",
        "Stays ONE PBI. The Sprint 5 reasoning (two PBIs both ordered last buy no scheduling benefit) rested on everything being last; the conclusion survives on different grounds -- all five criteria sit on one seam, the test suite and its helpers, and with the PBI-8 claim optional there is no scheduling cleavage to split along.",
        "prepack depends on an UNPINNED tsc -- typescript is not a devDependency, so nothing pins the compiler that builds the published artifact. The artifact under test and the artifact published must come from the same toolchain, and today that holds only because one machine did both.",
        "package-shape.test.ts asserts scripts equals EXACTLY {prepack} -- a fresh instance of exactly what the over-pinning criterion exists to remove. Two outcomes are acceptable since adding a script is legitimate, so it should require prepack PRESENT WITH THE RIGHT VALUE rather than exact equality.",
      ],
    },
    {
      id: "PBI-12",
      story: {
        role: "config author",
        capability: "be told when their cleanup did not finish",
        benefit: "a finally that never completes is visible instead of silently skipped",
      },
      acceptance_criteria: [
        {
          criterion: "A close that leaves the generator suspended is reported once",
          verification:
            "A fixture whose finally yields; assert chunks.return resolves done === false, that stderr names it once per session, and that a later completion answers normally",
        },
      ],
      status: "draft",
      notes: [
        "Ordered LAST: unlike the null token or a plain try/finally, YIELDING FROM CLEANUP is pathological rather than a plausible mistake. Same silent-cleanup harm, far lower probability -- it may reasonably never be reached, and saying so beats pretending otherwise.",
        "Remedy follows normalise-and-report and report-and-survive: report on done !== true, do NOT rethrow and do NOT keep calling next(), which a finally yielding in a loop would make unbounded.",
        "MEASURED on both runtimes: chunks.return(null) resolves {value, done:false}, leaving the generator suspended INSIDE its own finally. Unlike the parked-in-await limit this is INVISIBLE rather than documented, and unlike that one tsudoi CAN detect it -- done === false is in the result currently discarded.",
      ],
    },
  ],

  completed: [
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
      decisions: [
        "MEASURED, and it bounds the LIFETIME RULE this sprint adopted: a decision about package.json CANNOT be written at its site. JSON has no comments, and oxfmt -- a DoD gate -- sorts unknown keys to the tail of the file under every name tried. The rule needs a clause for machine-formatted data files: the comment goes as close as the formatter permits, and a SOURCE file that the data file points at carries a pointer to it. Here: `//exports` at the bottom of package.json, and a header on src/types.ts naming itself the published surface.",
        "MEASURED, and it weakens seven sprints of cross-runtime evidence: bun SATISFIES A MISSING DEPENDENCY FROM ITS GLOBAL CACHE. With node_modules renamed away, deno fails to start and bun completes the handshake. Every `both runtimes stay green` in this project is therefore strong evidence under deno and weak evidence under bun, wherever the claim concerns resolution. Recorded at test/resolution.test.ts, which is deno-only for exactly this reason.",
        "MEASURED AND REFUTED, the sprint's honesty item: a deno.json does NOT flip npm resolution to deno's global cache at 2.9.2. Present at the repo root the full 151-test suite stays green; present in a checkout with no node_modules the handshake still fails, naming node_modules. Sprint 1's REASONED justification for the no-deno.json guard does not survive measurement, so the guard was not built and PBI-7's third criterion needs the PO to amend it to the property.",
        "FOR THE PO, a correction rather than a question: PBI-7 note 4 -- `the example proves SELF-REFERENCE, not installed resolution` -- is now FALSE. The example's own bytes are type-checked inside a packed-and-installed consumer, and that is the only assertion in the repo that catches a reversion to the relative path.",
        "ONE ENVIRONMENTAL DEPENDENCY ADDED to the suite, disclosed: the installed-consumer probe runs `bun install`, which needs the network on a cold bun cache. It fails loudly rather than skipping.",
      ],
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
      decisions: [
        "ACCEPTED with its justification CORRECTED by the PO, because a note carrying a false premise is worse than no note: isProgressToken admits integers outside LSP's int32 (Number.isInteger(2**40) is true). Rejecting would NOT lose the client's items -- under normalise-and-report an invalid token aggregates, so every item still arrives in the response body. The real reason to honour it is that the CLIENT chose that token and can correlate it, so honouring delivers the streaming they asked for, whereas rejecting silently downgrades a working client to aggregation plus a stderr line it did not need.",
        "TWO WEAKNESSES FOUND BY READING THE CODE, neither built, both for the PO to rule on. (1) The lifecycle gate is consulted ONCE, at dispatch: a completion already streaming when `shutdown` arrives keeps calling sendProgress, so $/progress and then its response land AFTER the shutdown response. No test sends that sequence, so it is unproven in either direction; arguably correct, since LSP forbids accepting NEW requests, but this sprint closed the door only at dispatch. (2) isProgressToken accepts any JS integer, while LSP's `integer` is int32 -- a token of 2^40 passes. Rejecting it would LOSE the client's items, contrary to the harm-proportionality ruling, so accepting is probably right, but it is an undocumented deviation from the type the doc comment cites.",
      ],
    },
    {
      number: 6,
      pbi_id: "PBI-5",
      goal: "Make slow sources safe as well as first-class -- when the client cancels, context.signal aborts and a config author's handler can stop -- so the streaming API built last sprint never leaves abandoned work running.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "MEASURED at HEAD, after the extraction: removing the settle-time check reddens the four -32800 tests but NOT the cancelled-throw test, which the catch-side branch answers. The two branches of answerUnlessCancelled are independently defended.",
      ],
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
      decisions: [
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
    number: 11,
    pbi_id: "PBI-9",
    goal: "Make a green run mean exactly what we claim -- no less, by pinning what only hands have checked; no more, by unpinning what nobody promised.",
    status: "in_progress",
    subtasks: [],
    impediments: [],
    decisions: [
      "Shipped in 6d2ceba, dfdbcd4, ce0befa, 960e91a, 0992bb7, 201024b, 687ef2d, 36d280b, 2477ebc, dc4845b, e61da36 across 10 subtasks. Per-subtask records and 14 perturbation notes compacted here; git retains them.",
      "THE SPRINT FOUND ITS OWN DEFECT IN ITS OWN DELIVERY: the seven ASCII config-failure cases NEVER PINNED the `tsudoi:` prefix the criterion names -- built to the plan's wording rather than the criterion's. Stripping the prefix from src/cli.ts left 14 OF 16 CASES GREEN before the fix. It also FALSIFIES PBI-8's note that all three contract facts were already pinned in ASCII.",
      "THE PLAN'S CHUNK-BOUNDARY REMEDY WAS INSUFFICIENT, and the mechanism is the finding: stderr arrives in chunks at exact multiples of one size (192KiB/256KiB), so EVERY boundary shares one offset mod 3 -- all split or none do. At 360KB the deno case PASSED WITH THE DEFECT PRESENT on its first run. The fixture now uses three blocks separated by one and then two single-byte characters, covering all three residues: 15/15 runs split on both runtimes. Established twice -- by a residue probe, and PERMANENTLY by asserting the per-chunk decode differs from the whole, so a payload arriving whole fails loudly.",
      "REMOVED ASSERTIONS, each named with what it defended: two response-ordering assertions defended `initialize answered before the progress`, now carried by the test's own await; arrival-list EXHAUSTIVENESS defended `the server sends nothing else`, WHICH WAS NEVER PROMISED; two hardcoded ids defended NOTHING and are now the id the helper returns; scripts exact equality defended `no other script exists`, which nobody promised, and has NO new home by design.",
      "FORECLOSED, not NOT CONSTRUCTED, in the sprint the vocabulary was filed: an ordering inversion for cancellation.test.ts is UNREPRESENTABLE because the test waits for the chunk before cancelling. And one gap named honestly the other way -- the arrivals TOLERANCE half cannot be made permanent, since tsudoi sends no notification but $/progress, so reverting the delivery path would redden nothing; the injection to re-run is named.",
      "MEASURED, AND IT WOULD HAVE MADE THIS SPRINT'S HEADLINE TEST INTERMITTENTLY VACUOUS: a non-ASCII payload does NOT become more likely to straddle a pipe chunk boundary by being made BIGGER. Chunks arrive at exact multiples of one size, so every boundary shares one offset modulo the character width -- all split or none do. At 360KB the deno half passed WITH THE DEFECT PRESENT on the first run and on 7 of 15 probe runs. The fix is alignment, not size: single-byte separators covering all three residues. The general rule for the next such test -- ASSERT THE HARD CASE HAPPENED, do not size for it and hope.",
      "MEASURED, and it corrects a comment this project has been relying on: under bun 1.3.13 a write to a DEAD child's stdin returns TRUE and its callback is invoked with NO ERROR -- only `writable` reports the truth. node raises ERR_STREAM_DESTROYED. Any helper in any project here that trusts a stream to report its own failure is trusting something bun does not do.",
      "MEASURED, and it retires a seven-sprint-old assumption: the deno half of the config-failure contract was UNRUNNABLE, not broken. All seven cases passed under deno the first time they were allowed to run. `Never executed` and `would fail` had been treated as one thing.",
      "FORECLOSED rather than NOT CONSTRUCTED, using the vocabulary filed last retro: the wrong-ordering perturbation for cancellation.test.ts's arrivals assertion cannot be built, because the test waits for the chunk before it cancels -- the response CANNOT precede it. The design of the test forecloses the failure; the assertion's remaining job is content, and that half was perturbed and shown to flip alone.",
      "ONE PERTURBATION RAN INSIDE node_modules, disclosed: vscode-jsonrpc's message writer was edited to frame by character count and restored from a backup in the same step. It is the only way to perturb framing this project does not own, and it answered the criterion's own worry -- the failure arrives as a NAMED PARSE ERROR in ~32ms, not as a hang.",
    ],
  },
  retrospectives: [
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
