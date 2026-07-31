// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). Raised from 500 by the
// stakeholder: this dashboard carries measured rulings and the reasons
// they were overturned, which is content git history cannot substitute
// for while the decision is still live.
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
        metric:
          "The five methods the stakeholder named respond per the specification: textDocument/completion, textDocument/hover, textDocument/diagnostic (pull), textDocument/formatting, completionItem/resolve",
        target:
          "5 of 5. ENUMERATED IN THE METRIC ITSELF because `10 of 10` stood for thirty sprints with NOTHING ANYWHERE ENUMERATING THE TEN -- grepped, the only match was the metric. A fraction whose denominator nobody can name cannot be met, and the PO twice reported `2 of 10` as fact. The five were set by the stakeholder, not invented to make the metric satisfiable.",
      },
      {
        metric: "The CLI starts under both Bun and Deno",
        target:
          "Smoke start succeeds on both runtimes, both from a repo checkout and from an installed package",
      },
    ],
  },
  product_backlog: [],
  completed: [
    {
      number: 49,
      pbi_id: "PBI-52",
      status: "done",
      goal: "A config author installs path completion and its item resolution as @atusy/tsudoi-completion-path, completing the three-module composition the stakeholder asked for.",
      impediments: [],
      decisions: [
        "THE THREE-MODULE COMPOSITION IS COMPLETE: @atusy/tsudoi-language-server, @atusy/tsudoi-hover-wordnet, @atusy/tsudoi-completion-path.",
        "THIRTEEN EXPORTS CLASSIFIED ONE BY ONE, TWO PUBLISHED. The only one that needed measuring rather than judging was `PathCompletionOptions`, the third parameter's type: measured that an object literal passes structurally, that a misspelled key is REFUSED (so it has not degraded to `any`), and that only the ability to NAME the type in an annotation is lost -- against publishing `flavour`, a seam that exists for tests. `batchSize` went one step further and is not exported from its module either: it decides items per `$/progress`, which the wire shows, and a test importing the number agrees only with itself.",
        "SPRINT 47'S CLASS-LEVEL CLAIM HELD: the deno-guard shape was written over MEMBERS AS A CLASS, and a second member needed no second shape. The prediction this sprint was asked to falsify did not falsify.",
        "A TEST WAS DELETED FOR BEING UNFALSIFIABLE, NOT MERELY REDUNDANT. It rewrote the tracked root tsconfig.json to prove a member ignores it -- and `tsc -p <member> --showConfig` shows the root config is not in the member's program at all, so removing a key from it CANNOT move the member's result. AN UNFALSIFIABLE TEST WAS MUTATING A VERSION-CONTROLLED FILE. Replaced by two readings that each fail independently: no `extends`, and no `paths` in the effective config.",
        "THE OPTIONAL-PEER PREMISE IS PINNED TO A MACHINE SENTINEL RATHER THAN TO PROSE. `peerDependenciesMeta.optional` says `works without tsudoi`, which is false; it buys silence on a 404 while tsudoi is unpublished. Binding it to README's `not published` section left publishing-without-editing-the-README green. `private: true` on the root manifest is on the publish path BY CONSTRUCTION -- measured, `bun publish` stops before `prepack` -- so the one edit that permits publication is the edit that reddens every member. NO REGISTRY IS CONSULTED.",
        "SPRINT 47'S OPEN ITEM WAS FOUND LIVE IN THE ARTIFACT: the packed hover handler shipped THREE REPOSITORY PATHS in its comments, filenames absent from any consumer's machine. The build keeps comments, and nothing read the tarball. A guard now reads it -- and its stated class was then measured WIDER THAN ITS IMPLEMENTATION and narrowed to what it actually catches rather than widened to a matcher that still misses.",
      ],
      subtasks: [
        {
          test: "A consumer installs the package and gets both completion and item resolution, with no byte of either source in their project.",
          implementation:
            "Extract examples/completion-path.ts and examples/resolve-path-stat.ts into packages/completion-path as @atusy/tsudoi-completion-path.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "fb435bb",
              message:
                "tidy(test): a consumer installs every declared member, not one named package",
              phase: "refactoring",
            },
            {
              hash: "b446c20",
              message:
                "feat(completion-path): path completion and its item resolution are installed, not copied",
              phase: "green",
            },
            {
              hash: "dd72677",
              message:
                "test(published): the path package's promise is read off the installed copy, both ways",
              phase: "green",
            },
          ],
          notes: [
            "completion-path.ts exports THIRTEEN names against hover-wordnet's three. An example's exports are incidental; a package's are a promise. CLASSIFY EACH ONE INDIVIDUALLY -- the PO named this the largest single cost in the whole request.",
            "`completedPath` stays internal: it is the marker the completion attaches and the resolution reads, so publishing it would make the marker a compatibility surface.",
            "loadConfig refuses a config supplying completionItem/resolve without textDocument/completion, so the two halves must arrive together.",
            "CLASSIFIED: TWO PUBLISHED, ELEVEN INTERNAL, ONE INTERNAL FURTHER IN. `pathCompletion` and `resolvePathStat` are index.ts's whole surface. `batchSize` is not exported by its own module at all, since what it decides is the SIZE OF EACH $/progress and a test importing the number would agree with itself. The other eleven are module-exported so the member's own tests reach them and index.ts omits them.",
            "THE MARK IS IN THE TARBALL AND STILL UNPUBLISHED, which is the distinction the probe had to be built for: dist/completion.d.ts DECLARES `completedPath` -- one module must export it for the other to import it -- so what makes it internal is the `exports` map naming `.` alone. Both routes are refused, and the deep-path arm is not redundant: drop the map and the entry-point arm stays red while the deep one goes GREEN.",
            "THE OPTION BAG COST WAS MEASURED BEFORE IT WAS ACCEPTED. A consumer passes `{ cwd }` through `Parameters<typeof pathCompletion>[2]` at exit 0, a misspelled member is refused naming it, and `import type { PathCompletionOptions }` fails. So withholding the name costs the annotation and nothing else -- and the excess-property arm is what separates that green from the one `any` produces.",
            "TWO APPARATUS FACTS THIS PACKAGE FORCED, neither of which hover-wordnet had exercised. (1) tsconfig.build.json's `types: []` gives TS2591 on every `node:` specifier, so this member's build config carries `types: [\"node\"]` and its manifest a devDependency; hover-wordnet imports no builtin and never met it. (2) The member resolves THREE tsudoi subpaths -- `/types`, `/deps/protocol`, `/deps/types` -- where hover-wordnet resolves two; the symlink apparatus covered all three with no change.",
            "AND ONE ROOT-PROGRAM ARM LOST ITS ONLY IMPORTER. `deps/textdocument` was asked for by test/completion-path.test.ts alone, which moved into the member, and test/package-shape.test.ts's resolution probe REDDENED naming the empty answer -- the colour its own doc block predicts for an arm nothing imports. Repaired by annotating the document store's read in test/documents.test.ts with the PUBLISHED type, which is the pair a config author writes anyway.",
          ],
        },
        {
          test: "The member resolves tsudoi through its own route, proven by breaking that route and nothing else.",
          implementation:
            "Apply the corrected perturbation: break the member's peer entry or the apparatus symlink and require TS2307 naming the subpath.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "b270197",
              message:
                "test(members): each member reaches tsudoi by its own route, broken one arm at a time",
              phase: "green",
            },
          ],
          notes: [
            "The mechanism Sprint 47's criterion asked for was refuted by this repository's own record -- root tsc stays green because `name` and `paths` are redundant covers. This reads ONLY the member.",
            "Sprint 48 measured that a wrong peerDependencies key leaves the fifth check exit 0 and silent, while packages/hover-wordnet's own package-shape test DOES redden on it. Know which instrument you are relying on.",
            "RE-MEASURED ON THIS MEMBER AND SPRINT 48 HOLDS, WIDER THAN IT WAS WRITTEN: with `peerDependencies` DELETED from packages/completion-path/package.json, the member's own `tsc --noEmit` is exit 0 AND the fifth check is exit 0, both silent -- so the load-bearing route is the apparatus SYMLINK and the manifest entry is a declaration nothing resolves through. What refuses it is the member's own package-shape test, watched failing at `+ undefined`.",
            "THE THIRD ARM'S MECHANISM WAS SUBSTITUTED ON A MEASUREMENT OF THE CLAIM ITSELF, not on an inference from a neighbouring one. `break a name in src/types.ts` DOES NOT REACH A MEMBER: renamed `MethodHandler` to `MethodHandlerRenamed` at both its occurrences in src/types.ts and ran each member's own `tsc -p tsconfig.json` with NO rebuild -- BOTH EXIT 0, because a member resolves through the `exports` map into dist/ and nothing it reads had changed. Rebuilding to make it visible is the Sprint-44 class, since a failed rebuild leaves dist/ fresh and wrong. The probe asks the subpath for a name it does not export instead: TS2305 with ZERO TS2307 separates `a real declaration` from `unresolved` and from `any`, with no build of anyone's.",
            "WHAT THE NEGATIVE ARM PERTURBS IS THE REPOSITORY'S OWN tsconfig.json, RESTORED IN A `finally` AND REPAIRED BY NOTHING ELSE -- unlike the symlink, which the shared builder rewrites. BOUNDED RATHER THAN WAVED AWAY: bun runs test files sequentially in one process and tests within a file sequentially, so the window is one test's own await chain; and no root file resolves a tsudoi subpath LAZILY -- the suite's two dynamic imports take an external package and an absolute file URL, neither of which a `paths` mapping answers. The residual is a future test that spawns during that window.",
          ],
        },
        {
          test: "Both members carry a README a stranger can act on, verified off the packed tarball.",
          implementation:
            "Per-member READMEs over BOTH packages, naming what it answers, that it requires tsudoi at run time, and the constraint that bounds it.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "68c4ee4",
              message:
                "docs(packages): each handler package carries the README a registry page shows",
              phase: "green",
            },
          ],
          notes: [
            "hover-wordnet's bounding constraint is that whitespace is its word rule. completion-path's must be found and stated, not invented.",
            "Nothing is published yet, so no registry page is blank today -- but tsudoi's README cannot be where every handler explains its own constraints.",
            "FOUND IN THE SOURCE, NOT INVENTED, AND THE REJECTED CANDIDATE IS NAMED: completion-path's bound is WHITESPACE ENDS A PATH -- `pathFragments` scans back from the cursor to the nearest whitespace, so a document that QUOTES, ESCAPES or COMMA-SEPARATES its paths is served by a handler of its own. The candidate declined as the headline is `nothing recurses; one directory listing per fragment`: it is true and it is stated, but it bounds WHAT IT COSTS rather than WHICH DOCUMENTS IT SERVES, and the criterion asks for the second. The two packages arriving at the same whitespace rule independently is a coincidence worth reading, not a shared implementation.",
            'MEASURED BEFORE THE TABLE WAS EDITED: `files: ["dist"]` names no README.md and `bun pm pack` COLLECTS IT ANYWAY, so a reading taken from the manifest would have concluded the registry page is blank. Both members\' READMEs are read out of the ARCHIVE, and the three subjects are pinned per member -- the bounding sentence differs by package, so a shared needle would be satisfied by whichever member carried it.',
            "THE ROUTE MOVED RATHER THAN BEING DUPLICATED. The `handler-pack` and `examples-install` markers are gone from the root README and live in each member's, extracted and executed PER MEMBER; a root test refuses either marker's return. The root document's own promise is narrowed to `every block HERE is executed`, and the read-only exception now sits in the documents that carry the read-only command.",
          ],
        },
        {
          test: "Something reddens the day tsudoi is published, so the optional-peer premise cannot die unnoticed.",
          implementation:
            "Pin the optional-peer reversal where the publishing edit passes, over BOTH members.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "dd15221",
              message:
                "test(premise): the optional-peer falsehood cannot outlive the reason it is carried",
              phase: "green",
            },
          ],
          notes: [
            "`peerDependenciesMeta.optional: true` says `works without tsudoi`, which is false; it buys silence on a 404 while tsudoi is unpublished. Measured: a project given the handler tarball alone installs with NO warning at all, then fails at load.",
            "The property is required; the instrument is Planning's to choose. README's `The package is not published` section is executed by the suite and is a candidate, not a requirement.",
            "THE INSTRUMENT CHOSEN, AND THE SHAPE MATTERS MORE THAN THE SITE: the premise is READ and never ASSERTED. An assertion that the README still says `not published` would demand the document keep lying after publication, which is the opposite of the property; what may not happen is the manifest and the document DISAGREEING, in either direction -- a member that dropped the flag early is named too, because installing it then 404s.",
            "WATCHED FAILING RATHER THAN ARGUED: with that section rewritten to say tsudoi is published, the reading names `packages/completion-path` and `packages/hover-wordnet` and what each of them says. The fact itself is shared with test/readme.test.ts as one exported constant, so the two cannot disagree about which section states the premise, and that file already requires it to have exactly ONE home.",
            "WHAT IT CANNOT SEE, BOUNDED HONESTLY: a publisher who publishes and never touches the README. Nothing in a suite observes a registry, and a probe that did would make this repository's green depend on somebody else's uptime. What is bought is that the one edit needed to stop the document lying is the edit that reddens this.",
          ],
        },
        {
          test: "Every prose site this falsifies is repaired, and the enumeration is committed before the sites are found.",
          implementation:
            "README and comment repair. The examples set shrinks again: what remains copied, what is installed.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "fa2d766",
              message: "fix(test): the route perturbation refuses an entry it did not put there",
              phase: "refactoring",
            },
            {
              hash: "4e5304b",
              message:
                "docs(comments): the path handlers are named as a package, not as a file that moved",
              phase: "refactoring",
            },
            {
              hash: "4b65698",
              message: "docs(build): the preload's reason is re-measured, not reworded",
              phase: "refactoring",
            },
            {
              hash: "2435df1",
              message:
                "test(packed): a shipped comment may not name a file the reader does not have",
              phase: "green",
            },
            {
              hash: "485060f",
              message:
                "docs(readme): the capability chain's reader is named as the package it is now",
              phase: "refactoring",
            },
          ],
          notes: [
            "A NON-EXECUTED README BLOCK IS INDISTINGUISHABLE FROM AN EXECUTED ONE TO A READER, so one such block silently withdraws the guarantee for the whole document. Sprint 47 found two defects behind one unexecuted block, including an install path naming a file that is never created -- `bun pm pack` inside a member writes to the WORKSPACE ROOT.",
            "The enumeration is a PREDICTION. Its SUFFICIENCY belongs to revise's reviewer, working without sight of the list.",
            "THE ENUMERATION, COMMITTED BEFORE THE SITES ARE REPAIRED. Twenty-one predicted sites in fourteen files, in three classes. CLASS ONE, A PATH THAT NO LONGER EXISTS: bunfig.toml's measured diagnosis naming `examples/completion-path.ts`; test/helpers/build.ts's `SYNCHRONOUS ON PURPOSE` reason, which rests on that example being STATICALLY imported by a root test; test/completion.test.ts x3; test/client-capabilities.test.ts; test/workspace.test.ts; test/package-shape.test.ts; test/helpers/checkout.ts; test/fixtures/capabilities-mutation.ts; test/resolve-path-stat.test.ts; packages/hover-wordnet/test/hover.test.ts; and src/types.ts x3, src/server.ts, src/tsudoi.ts -- the last five being tsudoi's OWN source citing an example that is now a package.",
            "CLASS TWO, A CLAIM WHOSE PREMISE THIS SPRINT REMOVED rather than a path that moved: test/helpers/build.ts's account of WHICH ARM NEEDS dist/, and the README's `examples/ import ...` sentence, both written when the path handlers were files in examples/.",
            "CLASS THREE, AND IT IS SPRINT 47'S OPEN ITEM MEASURED ON THE ARTIFACT: packages/hover-wordnet/dist/hover.js SHIPS three repository-path claims -- `scripts/workspaces.ts`, `test/package-shape.test.ts`, `src/wordnet.d.ts` -- read off the packed tarball. completion-path's packed files carry NONE by the same instrument. THE INSTRUMENT IS A MATCHER AND THEREFORE SUSPECT, so the sweep is turned into a test with a proven-positive control rather than left as a grep.",
            "ONE SITE THE ENUMERATION MISSED, REPORTED AS DRIFT RATHER THAN FOLDED INTO IT: README.md's handler-context paragraph, which names the reader of `clientCapabilities.textDocument.completion.completionItem.insertReplaceSupport`. It survived the section rewrite because it sits in prose about a handler's CONTEXT rather than in the install prose that moved, so the edit that fixed the rest never passed through it.",
            "CLASS TWO CAME BACK LARGER THAN PREDICTED, AND THE SURPLUS IS THE FINDING. test/helpers/build.ts's `SYNCHRONOUS ON PURPOSE` reason was not merely citing a moved file: it was ALREADY FALSE FOR BUN, and the same file said so two paragraphs down -- `paths` intercepts a self-referencing subpath before the exports map. MEASURED, from the repository root, with a probe in each place: under test/ that subpath resolves to ./src/deps/types.ts and inside a member's test directory to ./dist/deps/types.js, because bun applies the tsconfig NEAREST THE IMPORTING FILE and a member's carries no mapping. So the synchronicity now has a true reason it did not have before -- the members' own tests are the static importers that need the build finished.",
            "AND TWO MEASURED CLAIMS WERE RE-RUN RATHER THAN REWORDED. With dist/ removed from the root AND both members and bunfig.toml absent, the failures are LOAD failures mixed among assertion failures and the first one names the demo config failing on `@atusy/tsudoi-completion-path`. AND `cd test && bun test` NO LONGER RUNS THE SUITE AT ALL -- measured with a filter matching nothing, FEWER FILES from test/ than from the root -- because bun discovers test FILES relative to the working directory too and the members' tests are outside it. A count of how many others fail under a narrowed dist/ was DROPPED rather than re-measured: it is a size that moves whenever the suite grows, and what earns the comparison its keep is which failure names the cause.",
          ],
        },
        {
          test: "Review does not open until revise has converged.",
          implementation: "Run the revise skill without a PR.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "Three sprints of evidence that it finds what the gate and the criteria both miss.",
            "THE PACKED TARBALL'S SHIPPED COMMENTS ARE NEVER INSPECTED -- Sprint 47's open item. A claim in a shipped comment naming a repository path or test is the shape that has escaped three times.",
          ],
        },
      ],
    },
    {
      number: 48,
      pbi_id: "PBI-54",
      status: "done",
      goal: "A misspelled paths mapping is caught rather than falling through to dist/ at exit 0, so the stale-artifact hazard is foreclosed rather than foreclosed-plus-an-unwatched-precondition.",
      impediments: [],
      decisions: [],
      subtasks: [
        {
          test: "A misspelled paths key is caught, and the catch names the misspelling rather than a downstream symptom.",
          implementation:
            "Close the fall-through: with `paths` misspelled to any name that does not match, resolution reaches the exports map and lands in dist/ at exit 0, so the type check reads a built artifact instead of the source just edited.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [],
        },
        {
          test: "The guard is written over the property, not over this one spelling.",
          implementation:
            "Whatever catches the misspelling must also catch the next mapping key that stops matching, without naming today's key twice.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [],
        },
        {
          test: "Sprint 42's recorded foreclosure is corrected in place rather than left standing beside its own counterexample.",
          implementation:
            "Repair the record: the hazard is foreclosed only while the precondition holds, and the precondition is now watched.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [],
        },
        {
          test: "Review does not open until revise has converged.",
          implementation: "Run the revise skill without a PR.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [],
        },
      ],
    },
  ],
  definition_of_done: {
    checks: [
      {
        name: "Tests pass",
        run: "bun test",
      },
      {
        name: "Lint passes",
        run: "oxlint",
      },
      {
        name: "Format check passes",
        run: "oxfmt --check .",
      },
      {
        name: "Type check passes",
        run: "tsc --noEmit",
      },
      {
        name: "Workspace members type-check under their own configs",
        run: "bun run scripts/typecheck-workspaces.ts",
      },
    ],
  },
  sprint: null,
  retrospectives: [
    {
      sprint: 49,
      improvements: [
        {
          action:
            "AN UNFALSIFIABLE TEST IS WORSE THAN A MISSING ONE WHEN IT PAYS A COST TO EXIST. One rewrote the tracked root tsconfig.json to show a member ignores it; `tsc -p <member> --showConfig` proves the root config is never in the member's program, so that edit could not move the result. IT COULD NOT FAIL, AND IT WAS MUTATING A VERSION-CONTROLLED FILE TO NOT FAIL. THE DETECTOR IS CHEAP AND SHOULD BE ROUTINE: before writing a perturbation, ask whether the perturbed input is in the program the assertion reads.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "PIN A PREMISE TO SOMETHING ON THE PATH BY CONSTRUCTION, NOT TO PROSE THAT DESCRIBES IT. The optional-peer falsehood was bound to a README section, so publishing WITHOUT editing the README stayed green -- the pin sat beside the door rather than in it. `private: true` is on the publish path by construction: the one edit that permits publication is the edit that reddens. GENERALISES BEYOND THIS CASE: when a claim must die on an event, find the artifact the event CANNOT AVOID TOUCHING.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A GUARD'S STATED CLASS WAS MEASURED WIDER THAN ITS IMPLEMENTATION, AND THE HONEST FIX WAS TO NARROW THE NAME. Widening the matcher to bare filenames was measured NOT to catch the named escapee -- `.ts` reads back to `.d.ts`, which resolves -- and would add only words a consumer genuinely has. SO THE CHOICE WAS BETWEEN A TRUE NARROW NAME AND A WIDER MATCHER THAT STILL MISSES, and the name was narrowed. Pairs with the standing rule that a test name claiming more than its assertion verifies is a defect: THE REPAIR MAY BE THE NAME.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 48,
      improvements: [
        {
          action:
            "A CONFIG KEY THAT FAILS TO MATCH AND THEREFORE STOPS APPLYING IS A CLASS, AND IT WAS SWEPT RATHER THAN PATCHED. Eight tracked configuration files were enumerated, then each was searched for keys whose effect depends on MATCHING. The loud ones were measured, not assumed: a misspelled `types` gives TS5023 exit 2, an unknown oxlint rule name gives `Rule not found` exit 1, a bad `preload` path exits 1. The silent one was the root `paths` alone. `exclude`, oxlint override globs, `workspaces` and member `paths` are pinned BY EFFECT. THE INSTRUMENT WAS AN ENUMERATION OF FILES AND KEYS, NOT A NAME GREP -- which is the shape Sprint 46's retrospective requires when the defect being hunted is itself a property of matching.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "BUILDING THE PROBE A CRITERION ASKS FOR CAN REFUTE THE CRITERION, AND THAT IS THE PROBE EARNING ITS COST. The literal resolution probe against the build config resolves to ./src and not dist/, because `rootDir` with `outDir` makes tsc read a declaration back to its generating input -- with no dist/ on disk. THE CRITERION'S NAME WAS THE THING THAT WAS WRONG. Two sprints running, a criterion named a colour nobody had measured; here the executor measured it before satisfying it and the measurement changed the answer. PAIRS WITH SPRINT 47'S RULE -- a criterion naming a colour must cite the measurement that produced it -- by supplying the other half: WHEN NO CITATION EXISTS, MEASURE BEFORE BUILDING TO THE COLOUR.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 47,
      improvements: [
        {
          action:
            "THE PACKED TARBALL'S SHIPPED COMMENTS ARE NEVER INSPECTED, AND THAT IS A MECHANISM GAP RATHER THAN A DILIGENCE ONE. A commit titled `a false comment shipped` DID NOT FIX THE COMMENT ITS OWN BODY NAMED, and the build keeps comments, so it shipped TWICE -- dist/hover.js and dist/hover.d.ts, read off the packed tarball. THIRD CONSECUTIVE SPRINT WITH A FALSE-COMMENT FINDING, and this time the team's attention was pointed directly at the class and still missed an instance, so `be more careful` is refuted by the evidence. THE ARTIFACT IS WHERE IT MATTERS AND NOTHING READS IT. A check over claims in SHIPPED comments that name repository paths or tests would have caught this instance AND the earlier one citing a test that did not exist.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CRITERION MAY NOT CONTRADICT A RECORD THE SAME AUTHOR WROTE ONE ITEM BELOW IT. SECOND SPRINT RUNNING THAT A PO CRITERION CARRIED A FALSE MECHANISM, and this one is worse than Sprint 46's: the fact that refutes the prediction is written in PBI-54, by the same author, in the same file. THIS IS COMMENT-CONTRADICTS-COMMENT AT THE LEVEL OF CRITERIA -- the class Sprint 46's retrospective already names, committed by the author of both texts. THE REMEDY IS NOT `write fewer mechanisms`: it is that a criterion naming a colour must cite the measurement that produced it, so an uncited colour is visibly a guess.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A NON-EXECUTED BLOCK IS INDISTINGUISHABLE FROM AN EXECUTED ONE TO A READER, SO ONE SUCH BLOCK SILENTLY WITHDRAWS THE GUARANTEE FOR THE WHOLE DOCUMENT. README promises its commands are extracted and run; the handler's pack/install block was outside that extraction and only regex-checked. MEASURED WHEN IT WAS FINALLY RUN: the documented sequence DID NOT WORK, and the install path named a file that is never created -- `bun pm pack` inside a workspace member writes the tarball to the WORKSPACE ROOT. Two defects behind one unexecuted block, found by comparing what pack WROTE against what the install line NAMES.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 46,
      improvements: [
        {
          action:
            "A CRITERION THAT NAMES ITS OWN FIX HANDS THE EXECUTOR A WAY TO SATISFY THE LETTER WHILE MISSING THE PROPERTY. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN CONDUCT. Criterion 4's property is `no control is left disarmed`; the criterion also carried the remedy `tighten to the full new name`, AND THE REMEDY NAMED THE WRONG OPERATION -- a longer needle still prefix-matches, and the fix for a prefix matcher is a BOUNDARY. The executor followed the remedy and the property went unmet, with the record then claiming it met. THE DEEPER ERROR IS WRITING A REMEDY INTO A CRITERION AT ALL: Sprint 43's `a mechanism sitting where a property belonged`, landing on the same author again.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN THE DEFECT CLASS YOU ARE SWEEPING FOR IS A PROPERTY OF MATCHING, YOUR SWEEP IS AN INSTANCE OF THAT CLASS AND CANNOT BE TRUSTED UNTIL IT IS BOUNDED FIRST. The first sweep concluded `no other prefix matcher exists` using greps that were THEMSELVES prefix-matching, and said so in the same report without connecting the two. The boundary-aware re-sweep reached the same answer -- exactly two, both in one file -- SO THE CONCLUSION WAS RIGHT AND THE EVIDENCE DID NOT SUPPORT IT, which is the distinction worth keeping. Purest instance of the degenerate-probe class in this record: THE INSTRUMENT HAD THE EXACT DEFECT IT WAS HUNTING.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COMMENT CONTRADICTING ANOTHER COMMENT IN THE SAME REPOSITORY IS A DETECTABLE CONDITION NOBODY DETECTS. Four were found in one revise pass: one assigning root tsc's resolution to the exports map while another file correctly said the map is never consulted; three naming `/types` for values that come from `deps/types`; one calling two acquisition routes `the same route` against the README's correct statement that they are different mechanisms. EACH JUSTIFIES A LIVE CONTROL, so a wrong witness misdirects whoever maintains it next. Same class as PBI-54's finding -- an outcome recorded as foreclosure that is really foreclosure PLUS AN UNWATCHED PRECONDITION.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 45,
      improvements: [
        {
          action:
            "EVERY SPRINT RUNS THE `revise` SKILL AFTER THE DEVELOPER'S WORK, WITH NO PR. THE STAKEHOLDER'S STANDING INSTRUCTION, NOT A TEAM IMPROVEMENT, recorded here because a process rule that binds future sprints has no other honest home: `definition_of_done` carries `{ name, run }` where `run` is an executable shell command, so a skill name in that field would make the dashboard assert something no command verifies -- the exact failure this project keeps catching. WHAT `revise` IS: multi-perspective review, then independent review, converged before acceptance. THE LINE IT DRAWS, and this is worth more than the rule: A CRITERION ASSERTS A PRODUCT PROPERTY A PERTURBATION CAN FALSIFY; `revise` FINDS WHAT NOBODY THOUGHT TO ASSERT. The worked example is the PO's own: a criterion asking the executor to report prose sites ITS OWN LIST MISSED was on the wrong side of that line -- it asks the author to do a reviewer's job. The enumeration stays, because a prediction is worthless unless committed first; the LIST'S SUFFICIENCY belongs to revise's independent reviewer, working WITHOUT SIGHT OF THE LIST. NO CRITERION MAY BE MET BY ARGUMENT AT REVIEW.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "ASK OF EVERY SURVIVING TEST `WHAT WOULD MAKE THIS RED, NOW?` -- ONE TEST AT A TIME, AND NEVER AS A BATCH. THIRD SPRINT RUNNING THAT THIS FOUND SOMETHING A BATCH ANSWER CONCEALS. MEASURED HERE: of twelve tests classified individually, THREE WOULD HAVE STAYED GREEN WHILE MEASURING NOTHING, and they failed THREE DIFFERENT WAYS -- one removed with no re-home, one DISARMED (with precedence gone it asserted only that folders equal folders), one VACUOUS (reading an empty list that is empty for a reason unrelated to the guard). THE VACUOUS ONE IS WHY THE RULE MUST BE PER-TEST AND NOT PER-CLASS: a batch classification cannot catch it EVEN IN PRINCIPLE, because a vacuous test is green, its subject still exists, and its name still describes something real. Only the question reaches it. AND THE CLASSIFICATION'S OWN SUBJECT CAN BE UNDERCOUNTED: `the nine` were twelve, because three in the same block read the deprecated fields WITHOUT expecting a synthesised folder, so a criterion keyed on `tests that pin synthesis` underdescribed itself.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A ONE-RUNTIME MEASUREMENT IS NOT `THE ANSWER` IN A TWO-RUNTIME PROJECT, AND EVERY PRIOR HAND-RUN `MEASURED, EXIT 0` IN THIS RECORD IS NARROWER THAN ITS WORDING. MEASURED THIS SPRINT: `import { type MethodHandler }` is ELIDED BY BUN AND LOADED BY DENO, so deleting `dist/types.js` gives bun exit 0 and deno exit 1 naming that file -- and a checkout measurement taken on one runtime was reported as the answer, self-disclosed. THE SUITE RUNS BOTH RUNTIMES PRECISELY BECAUSE THEY DIFFER; A HAND-RUN PROBE DOES NOT. Same shape as the name-grep surface instrument two sprints ago: true of what it measured, narrower than what it said. THE PRACTICE: a probe whose result will be recorded as a measurement runs on both runtimes, or its record names the one it ran on.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A UNIQUENESS CLAIM ABOUT A PROBE IS MEASURED OR IT IS NOT WRITTEN. Extends Sprint 13's coverage rule to a shape it did not name: `this probe is the only thing that would notice X` IS A COVERAGE CLAIM, and Sprint 13 forbids taking one on recollection. MEASURED THIS SPRINT, ON A SENTENCE THE SPRINT ITSELF WROTE: deleting the `import` arm reddens FIVE tests, including the type-only assertion the SAME COMMIT added. Sprint 42 already recorded the disciplined version of this without generalising it -- `narrowly cleared rather than proven` -- and this is that finding earning its rule.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN A CRITERION'S PREMISE IS WITHDRAWN, RECORD BOTH THE UNMET RESULT AND THE WITHDRAWAL -- NEVER LET THE SECOND REWRITE THE FIRST. MEASURED HERE ON A CRITERION WHOSE FAILING CASE ACTUALLY HAPPENED: `nothing owns it` was named as the one failing outcome, the stakeholder removed the owner, and the PO refused to relabel it `met differently` or `waived`. THE VALUE OF WRITING CRITERIA AT ALL IS THAT `THIS ONE FAILED` CAN BE SAID. And the sprint still closed, on a stated discriminator rather than lenience: unmet BY A RULING THAT REMOVED THE SUBJECT is not unmet by shortfall, and THE TEST IS WHETHER CONCEALMENT WAS AVAILABLE -- here it was, and the executor refused it, which is the only reason the acceptance could be given.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 44,
      improvements: [
        {
          action:
            "A FRESHLY BUILT ARTIFACT CAN BE WRONG, WHICH IS A DIFFERENT CLASS FROM A STALE ONE AND HAS THE OPPOSITE REMEDY. FIFTH INSTANCE OF THE SPRINT-35 STALENESS CLASS AND THE FIRST WHERE THE ARTIFACT IS NOT STALE BUT POISONED. MEASURED: tsc WRITES dist/ AND THEN EXITS NON-ZERO, so a failed build leaves dist/ built from broken source -- new, newly written, and wrong. `REBUILD BEFORE BELIEVING IT` IS THE REMEDY FOR STALENESS AND IS USELESS HERE, BECAUSE THE REBUILD IS WHAT PRODUCED IT, and that inversion is what earns this its own entry rather than a line on the staleness one. WHERE THE EXPOSURE ACTUALLY IS, bounded honestly so the remedy is weighted right: every AUTOMATED route is covered -- the preload throws before any test loads, `tsc --noEmit` reads source since PBI-48, `bun pm pack` builds in its own stage, and the checkout helper copies a dist/ the preload just rebuilt. WHAT REMAINS EXPOSED IS HAND-RUN PROBE SEQUENCES: break src, run something, revert, read dist/. That is what this team does all day and it is what it bit.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "READING THE ARTIFACT IS NOT ENOUGH WHEN THE THING COUNTED CAN ARRIVE BY MORE THAN ONE MECHANISM: COUNT THE CLAIM'S SUBJECT, NOT ONE MECHANISM'S CALL SITES. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN CONDUCT and it is the second miscounted premise in two sprints, both theirs. Sprint 43's remedy was to mark counts inside criteria UNMEASURED so the shell-holder knows to measure them; THAT REMEDY DID NOT FIRE HERE BECAUSE THEY BELIEVED THEY HAD MEASURED IT -- they read test/helpers/install.ts and counted `cpSync` calls, and the fourth staged path arrived by `symlinkSync`. EXTENDS SPRINT 29'S `grep the claim's words, not the places comments live` FROM PROSE TO COUNTING: the claim's subject was `what the stage receives`, and one mechanism's call sites are not that subject.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "AN OPEN QUESTION MEASURED IS WORTH MORE THAN AN OPEN QUESTION CARRIED, AND THE LABEL IS WHAT MAKES IT SAFE TO ACT ON. The PO reasoned from three comments plus the mapping that the `default` exports arm now had NO consumer in this repository, LABELLED IT REASONED-NOT-MEASURED, and routed it rather than acting on it. Measured within the hour: removing every `default` arm leaves tsc at EXIT 0 -- so the tsc dependence really is gone -- and REDDENS FOUR TESTS, so the arm is still taken. THE REASONING WAS HALF RIGHT AND THE ACTION IT WOULD HAVE JUSTIFIED WAS WRONG. THE ENTRY IS NOT `label your claims`, which this project already has: it is that A LABELLED CLAIM SHOULD BE MEASURED WHILE IT IS STILL CHEAP, because a routed question with a one-command answer becomes a standing uncertainty the moment nobody runs the command.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "ASK AT THE NEXT RETROSPECTIVE WHETHER THE WEAK-PROBE RATE IS RISING OR THE DETECTION RATE IS. SIX PROBES IN ONE THREAD HAVE BEEN WEAKER THAN THEY LOOKED, each producing A CLEAN GREEN: an excess object member excess-property checking could not reach; an import that failed to resolve so every name was `any`; a perturbation of a symbol nothing imported; an arm the request never enters; a control that could not tell `resolves to source` from `examples are not in the program`; and a rename reaching only relative importers. RAISED BY THE PRODUCT OWNER AS A QUESTION RATHER THAN A FINDING, and that framing is the point: THE LAST THREE WERE EACH CAUGHT BY THE PERSON WHO RAN THEM, which is what a rising detection rate looks like and is indistinguishable from a rising defect rate on the count alone. ASKED OUT LOUD RATHER THAN RULED, exactly as Sprint 26's over-authoring question was.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 43,
      improvements: [
        {
          action:
            "A COUNT INSIDE A CRITERION IS MARKED UNMEASURED BY WHOEVER AUTHORS IT, so the shell-holder knows it is theirs to measure BEFORE IT BINDS. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN ROLE and it is the missing half of Sprint 41's entry, which established that a factual premise inside a criterion is a claim requiring measurement but left the PO -- who has no shell -- no way to discharge it. MEASURED THIS SPRINT: criterion 3's control was written as `the two NOT COMPLETE verdicts` when the tree held THREE, and the Scrum Master's Review summary repeated the count rather than the observable. THE OBSERVABLE WAS 3 TO 2 WITH THE THIRD ACCOUNTED FOR BY FILE, which is precisely the shape a quiet relabelling produces -- so the summary of a control read like the thing that control forbids. AND THE CRITERION WAS NOT AMENDED AT REVIEW TO A FORM THE RESULT SATISFIES: its PROPERTY was met and the count was the mechanism, and rewriting it would have been a fitted criterion however much stronger it read.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PERTURBATION RE-RUN STATES WHETHER ITS TARGET STILL EXISTS BEFORE IT STATES ITS COLOUR. Filed as the operative half of Sprint 14's standing re-run, which says to re-run ONE perturbation from the previous sprint and does not say WHICH -- and after a shape change most of them have no target left, so the default choice returns TARGET DELIBERATELY REMOVED and its green records NOTHING about the increment under review. MEASURED THIS SPRINT: nearly every Sprint-42 perturbation aimed at the tuple; the one whose target survived is the cancellation check between pulling a batch and sending it, and disabling it reddens TEN tests across both runtimes. THE DISCRIMINATING QUESTION IS `which perturbation still has a target in THIS tree`, and asking it is what turns the standing item from ceremony into a second observer.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            'BOUNDS THE SPRINT-36 `NONE WEAKENED IS DIFFED, NOT ASSERTED` ENTRY, WHICH CREATED THE INSTRUMENT THIS AMENDS RATHER THAN A SECOND ENTRY BESIDE IT. `grep "expect("` COUNTS AN ASSERTION QUOTED IN A COMMENT, so a sprint whose commentary quotes an assertion INFLATES ITS OWN DIFF -- measured here as 709 against a true 708, found and fixed twice by the executor. THE REMEDY IS ALREADY DEMONSTRATED IN THE TREE: DESCRIBE AN ASSERTION, DO NOT QUOTE IT. Filed as an amendment because a PBI is product capability and this is a defect in OUR OWN MEASUREMENT, and because the project\'s precedent at Sprints 35 and 39 is to extend the entry that owns the subject rather than scatter a second one.',
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A DESIGN WHOSE STATED REASON IS REPRODUCED BY ITS OWN TEST SUITE IS A STRONGER RECORD THAN ANY PROSE, AND THE SIGNAL ARRIVES AS AN UNPREDICTED BLAST RADIUS. MEASURED: P1 hit its named target exactly and reddened 22 where 4 were predicted, and the eighteen shared ONE mechanism READ FROM A FAILURE MESSAGE rather than assumed -- holding the first batch parks every fixture waiting behind a gate the test has not opened. THAT IS VERBATIM THE COST THE SPRINT GOAL CITES FOR REFUSING THE LOOK-AHEAD. THE GENERAL SHAPE, worth more than the instance: WHEN A PERTURBATION REDDENS FAR MORE THAN PREDICTED, READ THE MECHANISM BEFORE WIDENING THE PREDICTION -- the surplus is either the design's own rationale demonstrating itself or a coupling nobody had named, and both are findings where a corrected number is not.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 42,
      improvements: [
        {
          action:
            "A PROBE IS DEGENERATE WHEN ITS SUBJECT IS NOT REACHED BY WHAT IT PERTURBS, AND `EXIT 0 WITH ZERO ERRORS` IS THE SHAPE THAT HIDES IT. MEASURED, BY THE SCRUM MASTER, AGAINST THEMSELVES: renaming `Method` in dist/types.d.ts left tsc at exit 0 and was nearly read as `tsc does not consult dist/` -- when it meant only that NO EXAMPLE IMPORTS `Method`. The re-probe used a name they DO import and gave TS2305 at the example. THIS IS THE THIRD DEGENERATE PROBE THIS THREAD -- an excess object member that excess-property checking could not reach, an import that failed to resolve so every name was `any`, and now a perturbation of an unimported symbol -- AND ALL THREE PRODUCED A CLEAN GREEN. EXTENDS the Sprint-9 non-vacuity entry with the specific question that catches this class: BEFORE READING A GREEN, ASK WHETHER WHAT YOU PERTURBED IS REACHED BY WHAT YOU MEASURED. Not whether the control fired -- whether it COULD have.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A SHAPE THAT MOVES UNDER AN EXECUTOR COSTS MORE THAN THE EDITS IT INVALIDATES, AND THE COST IS PAID IN MISATTRIBUTED EVIDENCE. This sprint's completion type changed FOUR TIMES mid-execution -- AsyncIterable, then a tuple with a third element, then a generator returning a response, then that return narrowed by type -- and each move was individually right and stakeholder-directed. WHAT IT PRODUCED: a committed diff prediction describing a shape that no longer existed, superseded twice; an executor's `criterion 2 is dead` headline that was true of a superseded shape and had to be withdrawn; a preserved patch built across two of the shapes whose terminal handling could not be trusted; and a subtask whose premise a later ruling removed entirely. NONE OF THAT IS A REASON TO REFUSE A MID-SPRINT CHANGE -- the fourth shape is better than the first and the stakeholder was right each time. THE ACTIONABLE HALF: WHEN THE SHAPE MOVES, EVERY PREDICTION AND EVERY FINDING TAKEN AGAINST THE OLD ONE IS SUPERSEDED RATHER THAN INHERITED, AND SAYING SO IS THE FACILITATOR'S JOB AT THE MOMENT OF THE MOVE -- not the executor's when they trip over it. Both times it was caught, the executor caught it.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 41,
      improvements: [
        {
          action:
            "SPRINT 26'S QUESTION HAS AN ANSWER FOR THIS SPRINT AND IT IS NEITHER OF THE TWO IT OFFERED. That entry asks whether the rate of `not constructed` is honesty or over-authoring. THE MEASURED ANSWER HERE IS A THIRD THING: FOUR DEFECTS IN PO-AUTHORED CRITERIA, NONE CAUGHT BY THEIR AUTHOR -- three mechanisms sitting where a property belonged (`satisfies` in criterion 2, `rg -w` in criterion 5, and TS1360 before it was moved to the verification) and TWO FALSE FACTUAL PREMISES (criterion 5's `tsudoi: Tsudoi` list, which contradicted what criterion 4 required to survive, and the claim that a wrong-arity factory would pass an unwrapped `satisfies`). EVERY ONE WAS CAUGHT DOWNSTREAM -- by the Scrum Master, by the executor routing around it, or by measurement. SO THE RATE IS NOT OVER-AUTHORING AND NOT DISCIPLINED HONESTY: IT IS THAT CRITERIA ARE BEING AUTHORED FASTER THAN THEIR PREMISES ARE BEING CHECKED, and the downstream catch rate is what has been standing in for the check. THE ACTIONABLE HALF, because a rate is not a remedy: A FACTUAL PREMISE INSIDE A CRITERION IS MEASURED BEFORE THE CRITERION BINDS, BY WHOEVER HAS THE SHELL -- the PO has none, which is not an excuse but the mechanism, and it means the Scrum Master transcribing a criterion OWNS measuring its premises rather than transcribing them faithfully.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MEASUREMENT CAN GO STALE BECAUSE OF AN UNCOMMITTED EDIT NOBODY CLAIMS, AND NO EXISTING ENTRY REACHES THAT MECHANISM. Filed as a fourth way beside Sprint 38's three -- not an edit to the measurement, not an edit to the file it describes, not a later sprint changing the world it measured. MEASURED THIS SPRINT: a config count of 31/29 was taken while an uncommitted edit had already stripped examples/tsudoi.config.ts, SO THE FILE DID NOT MATCH ITS OWN PATTERN, and the number moved to 32/30 when the edit was reverted. IT WAS ONE STEP FROM ENTERING A SPRINT GOAL, and what stopped it was the PO refusing counts in a goal on the general Sprint-22 ground -- a generic rule catching a specific mechanism nobody had named. TWO UNROUTED EDITS APPEARED IN THIS SESSION AND NOBODY CLAIMS EITHER, which is a pattern rather than an incident. THE REMEDY IS THE CHEAP HALF AND IT IS ALREADY PROVEN: PRESERVE THE CONTENT OUTSIDE THE REPOSITORY BEFORE REVERTING. The second stray edit was backed up and then reverted, and it is what found the orphaned-import gap that criterion 5 now covers -- AN EDIT CAN TEACH SOMETHING AND STILL NOT BE A DELIVERABLE, and keeping both halves is more useful than resolving them.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "`LOUD BY LUCK` IS A DISTINCT CLASS FROM A DEGENERATE INSTRUMENT, AND FILING IT AS ONE WOULD HAVE BEEN A FALSE PROOF CLOSING A QUESTION. The PO proposed the `satisfies` subject-binding trap as a SIXTH degeneracy location under the Sprint-9 entry; MEASUREMENT REFUTED THE PREMISE -- an unwrapped expression-bodied `satisfies` errors in BOTH arities, so it never passes silently and is not degenerate at all. WHAT IT ACTUALLY IS: a check that VERIFIES THE WRONG SUBJECT while appearing to verify the right one, and that fails ANYWAY for an unrelated reason -- here, that a Promise can never satisfy a function type. THE DIAGNOSIS IS RIGHT AND THE MECHANISM IS WRONG, and a rule filed on the wrong mechanism generalises wrongly. THE GENERAL FORM, which is what earns the entry: A GUARD THAT FIRES FOR A REASON OTHER THAN THE ONE IT WAS BUILT FOR IS NOT EVIDENCE THAT IT GUARDS -- ask WHY it fired, not WHETHER. Recorded although the stakeholder ruled the trap itself out of scope, because the CLASS outlives the instance and the instance was proposed twice in one session, the second time by the stakeholder.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CONSTRAINT THAT SURVIVES THE REPLACEMENT OF THE MECHANISM IT WAS DERIVED FROM WAS A CONSTRAINT ON THE PROPERTY ALL ALONG -- SPRINT 26 SHOWING ITS VALUE IN THE DIRECTION NOBODY LOOKS. That entry is normally read as a rule about how to WRITE a criterion. MEASURED HERE IN THE OTHER DIRECTION: the requirement that the README say IN ONE CLAUSE what the binding buys was derived while the mechanism was `satisfies`, and it survived the stakeholder replacing that mechanism with an annotated const WITHOUT ONE WORD CHANGING. That survival is EVIDENCE about the requirement rather than a coincidence about the sprint, and it gives a cheap test available at any mechanism change: ASK WHICH CONSTRAINTS SURVIVE IT. The ones that do were about the property; the ones that do not were about the mechanism and should never have been criteria.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 40,
      improvements: [
        {
          action:
            "PREDICT THE DIFF *AND ITS COUNTERFACTUAL* IN THE COMMITTED PLAN. Recording `had the authorisation held: -1 source line, -4 tests` beside an observed 0/0/0 is what makes A CLEAN READING LEGIBLE RATHER THAN LUCKY, and a named falsifier firing as predicted is the check that the prediction was OF THE RIGHT THING. A SECOND RATIONALE, found at Sprint 44 and recorded because it is the answer if this practice's cost is ever questioned: IT IS WHAT CATCHES A POISONED MEASUREMENT. tsc writes dist/ and THEN exits non-zero, so a failed build leaves a FRESH, WRONG artifact -- and a probe read against it returned EXIT 0 where 1 was predicted. The mismatch was visible only because the prediction existed; without it the reading would have been taken as the remedy working.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN A GUARD CANNOT BE A BARRIER, RULE IT A ROT DETECTOR RATHER THAN WRITING AN UNMEETABLE CRITERION. `Staleness must be impossible` was unreachable because the working-directory set is unbounded; the achievable property is IMPOSSIBLE ON EVERY DOCUMENTED ROUTE, DETECTED ON THE REST. SECOND UNMEETABLE CRITERION IN THIS THREAD, BOTH THE PO'S: check a criterion against what an implementation COULD ACTUALLY SATISFY before accepting it.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHERE A DECISION LIVES DEPENDS ON WHETHER ITS FILE CAN CARRY COMMENTS. package.json cannot, which is why a TEST holds its reasons; bunfig.toml can, so a COMMENT satisfies the Lifetime Rule at the site the violating edit would be made -- and declining a test there is a DECISION rather than an oversight PROVIDED the comment says plainly that nothing asserts it and names the measured reason.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 39,
      improvements: [
        {
          action:
            "A ZERO-RESULT GREP IS AMBIGUOUS, AND THIS BOUNDS THE GREP ENTRY RATHER THAN EXTENDING IT. Zero means EITHER clean OR THE REFERENT WAS JUST DELETED AND LEFT A DANGLER. Measured this sprint: zero was read as clean and it was the second, and the grep run for SOMEONE ELSE'S staleness caught what this sprint had just broken. Filed beside the entry it qualifies, because `grep returned nothing` currently reads as reassurance.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "PREDICT THE expect( DIFF IN THE COMMITTED PLAN. 0/0/0 with the counts unchanged reads as CONFIRMATION rather than as a fitted report ONLY BECAUSE IT WAS WRITTEN DOWN FIRST. A one-line upgrade to the diff-not-assert standard.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A VOCABULARY ANSWERS ONE QUESTION, AND AN OBSERVATION THAT DOES NOT ANSWER THAT QUESTION DOES NOT JOIN IT, HOWEVER ADJACENT. The four standing-re-run outcomes answer WHY A RE-RUN WENT GREEN; a re-run that went as recorded but now costs a type check answers a different question and gets A NOTE AT THE SITE instead -- the S19 pattern, a comment stating what it does NOT rule out.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 38,
      improvements: [
        {
          action:
            "AMENDMENT TO THE FOUR-OUTCOME VOCABULARY: `TARGET DELIBERATELY REMOVED` IS NOT `UNCONSTRUCTIBLE`. The edit may remain perfectly writable and compile -- what was removed is THE HAZARD, not the perturbation. The four outcomes answer WHY A STANDING RE-RUN GOES GREEN, and conflating `the hazard is gone` with `I could not build the probe` is the confusion S11 exists to prevent.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PROBE'S SERIALISER IS AN INSTRUMENT AND CAN BE DEGENERATE. MEASURED: JSON.stringify with a KEY ARRAY filters NESTED keys, so two different capability objects serialised identically and a 120-order agreement probe would have reported success WHILE MEASURING NOTHING. S20 has been applied to assertions, controls and probes; extend it to the COMPARISON MECHANISM ITSELF -- and pair every such probe with a control proving it can see the thing it compares.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MEASUREMENT CAN GO STALE WITH NOBODY EDITING IT OR THE FILE IT DESCRIBES, BECAUSE A LATER SPRINT CHANGED THE WORLD IT MEASURED. NO GREP FINDS THIS -- the words are unchanged and still name real things. ONLY RE-RUNNING THE CONTROL DOES. Distinct from falsified-by-an-edit-elsewhere and from positional-falsifies-on-append, both of which a search can reach.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 36,
      improvements: [
        {
          action:
            "A COUNT CAN LIVE IN A FILENAME, AND A CONTENT GREP DOES NOT SEE ONE. Extension of the grep-the-claim's-words entry: search FILENAMES and TEST NAMES as well as file contents. Measured this sprint -- seven sites said `the eight` against a nine-name list, one in a test name and TWO IN PROBE FILENAMES.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "`NONE WEAKENED` IS DIFFED, NOT ASSERTED. It is a COVERAGE CLAIM and S13 forbids recalling one; diffing every `expect(` line across test/ and src/ is cheap and gives a direction, not an impression. MEASURED this sprint: seven added, zero removed, zero changed, and the pin's toEqual unchanged with only the object literal grown. The PO records having accepted that claim ON ASSERTION FOR A DOZEN SPRINTS.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COUNT THAT IS A MEASUREMENT RESULT CARRIES PROVENANCE AND IS NOT EDITED WITHOUT RE-MEASURING; A COUNT THAT IS A DESCRIPTION IS REPLACED BY NAMING. DIFFERENT OBJECTS THAT LOOK IDENTICAL IN PROSE, and the distinction bounds prefer-naming-to-counting so it is not over-applied to numbers that are evidence.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 35,
      improvements: [
        {
          action:
            "A STANDING RE-RUN THAT GOES GREEN MUST BE CLASSIFIED, NOT MERELY NOTED -- gone quiet, disarmed, edit-grew-a-second-half, or target-deliberately-removed. FOUR OUTCOMES, and the first two are DEFECTS while the other two are NOT. All four produce THE SAME OBSERVATION and are indistinguishable from it alone, which is the whole reason the vocabulary exists. FILED AS AN EXTENSION OF THE SPRINT-14 STANDING-RE-RUN ENTRY rather than as its own: that entry creates the practice and already carries its second rationale, and FOUR OUTCOMES ANSWERING ONE QUESTION ARE A VOCABULARY -- scattering a vocabulary defeats its purpose. Deliberately NOT filed under the cannot-be-constructed entry, which has a different trigger, actor and moment.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 30,
      improvements: [
        {
          action:
            "A HANDOFF CARRIES ITS PROVENANCE, AT BOTH ENDS. ONE RULE, THREE PAYLOADS -- wants, inherited measurements, counts. The bringer labels a want ASKED FOR or MENTIONED and a handed measurement with WHO TOOK IT, the same way a fact carries MEASURED or REASONED; the receiver DOES NOT RULE ON AN UNLABELLED ONE. Filed at both ends deliberately: the Scrum Master's first draft was a private habit, and S15 already records that A HABIT THAT LEAVES NO TRACE CANNOT BE AUDITED. The PO's half is symmetric -- they spent this whole thread demanding provenance for FACTS and never once for WANTS, and ruled on `10 of 10` and on a push fork without asking where either came from. The Sprint-25 entry does not reach this: `read the artifact` has NO REFERENT for a measurement someone else took.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 29,
      improvements: [
        {
          action:
            "GREP FOR THE CLAIM'S WORDS, NOT FOR THE PLACES COMMENTS LIVE. A falsified premise was carried by a TEST NAME -- a home nobody thinks to check and invisible to any search for comment syntax. Corollary, because it is the specific way the error survived Review: A git diff ANSWERS `did this change?`, NEVER `is this list complete?`. Those look like the same check at Review and are not.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 27,
      improvements: [
        {
          action:
            "AN EXECUTOR RE-MEASURES A NUMBER THEY WERE HANDED RATHER THAN COPYING IT. This has now caught a handed-down count in TWO CONSECUTIVE SPRINTS -- nine-not-eleven, then eleven-not-six -- and it works BECAUSE OUR RECORDS CARRY VERSION AND PATH, the S8 Sprint-24 amendment paying out. It generalises to a handback from anyone including the PO, and it reaches something no rule about the author can: A BRIEF IS THE ONE ARTIFACT WITH NO PERMANENT HOME, so an error in it is caught by the recipient re-measuring or not at all.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 26,
      improvements: [
        {
          action:
            "ASK, AT EACH RETROSPECTIVE, WHETHER THE RATE OF `NOT CONSTRUCTED` IS HONESTY OR OVER-AUTHORING. Two more this sprint -- the same-commit clause and the machine-checkable orphan rule -- and BOTH TRACE TO CLAUSES THE PO WROTE. Two readings compete: the team is being honest about what cannot be defended, or CRITERIA ARE BEING AUTHORED BEYOND WHAT CAN BE DEFENDED. The PO raised this against their own authoring and asked for it out loud rather than ruled.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CRITERION THAT NAMES A COMMIT SHAPE, A FILE LAYOUT OR ANY OTHER MECHANISM IS RESTATED AS THE PROPERTY IT PROTECTS. S13 applied to ACCEPTANCE CRITERIA rather than to plans: `same commit` was unconstructible against a git hook, while the property it meant -- no window in which a decision is deleted from custody but not yet written to its home -- was satisfiable, and was satisfied MORE VISIBLY by two commits than one would have been.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 25,
      improvements: [
        {
          action:
            "A PREMISE ABOUT AN ARTIFACT IS NOT STATED UNTIL THAT ARTIFACT HAS BEEN READ IN THE SAME SESSION. Three instances this refinement, all the PO's: the dependency graph (a hoisting that does not occur), the README extraction harness (which extracts nothing at line 180), and package-shape.test.ts's assertion strength (loosened at PBI-9 for exactly the case being ruled on). TWO OF THE THREE ARE CLAIMS ABOUT A TEST IN THIS REPOSITORY, MADE WHILE INVOKING THAT SAME TEST'S AUTHORITY. Distinct from the S13 entry, which covers premises about coverage and rule SETS; this one is about opening the file.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 22,
      improvements: [
        {
          action:
            "A CLAIM A COMMENT MAKES ABOUT ITS OWN FILE IS CHECKED AGAINST THAT FILE BEFORE THE EDIT LANDS. Editing a file FEELS LIKE verifying what its prose says about itself, and is not -- which is why these survive a first self-review. PREFER NAMING TO COUNTING: a count silently falsifies when the thing counted grows.",
          timing: "sprint",
          status: "active",
          outcome:
            "Three false sentences in one sprint, all found on a SECOND pass: `every rule below is exercised at this path`, `ONE list drives all three rules`, and a header filing a file under an argument it does not come from. FILED AS ITS OWN ENTRY ON THE PO'S OWN SPLIT TEST, against their lean and decided by measurement: the standing prose item is STRUCTURALLY BLIND here, because a Review reporting `yes, the guard prose was updated` satisfies it completely while all three stay false -- it catches prose that went stale by NOT being edited, and these were edited and left wrong. AND THE SUBJECT IS LOCATION, NOT TOPIC: the three share no subject -- one is a coverage claim, one structural, one a which-claim -- so no widening of the coverage rule reaches them. What they share is that each is a claim ABOUT THE FILE IT LIVES IN, which is why the coverage rule did not fire even on the one that WAS a coverage claim.",
        },
      ],
    },
    {
      sprint: 19,
      improvements: [
        {
          action:
            "A CLAIM IN A COMMENT IS CHECKED AGAINST WHAT IT CLAIMS, not merely against whether something backs it. A justification can be BACKED AND STILL WRONG.",
          timing: "immediate",
          status: "active",
          outcome:
            "Two false comments shipped and were caught on a SECOND self-review pass, in the sprint whose whole subject was prose correctness. One justified a test's second half by a property its FIRST assertion already covered; the other justified a presence pair with an INVERTED argument -- with the initialize folder present, a session dropping EVERY notification produces exactly the expected value. THE CLAUSE FILED ONE SPRINT EARLIER WOULD NOT HAVE CAUGHT EITHER: it catches UNBACKED claims, and both of these were backed and wrongly reasoned. AND THE FIX'S SHAPE IS THE BETTER PATTERN: a comment stating what it does NOT rule out, and why that is deliberate, beats one asserting only what it covers.",
        },
      ],
    },
    {
      sprint: 18,
      improvements: [
        {
          action:
            "A HAZARD MUST OWN A TEST WHOSE FIRST ASSERTION IT IS. Two hazards sharing one test means the second can never be OBSERVED: the same perturbation flips the first and the test stops there.",
          timing: "immediate",
          status: "active",
          outcome:
            "Found at Sprint 18, where a read-time fallback broke TWO ways -- the first delta replacing the root, and a later removal making the root REAPPEAR -- and the second was visible only because it owned its own test. A PRECONDITION FOR THE PERTURBATION-DISCIPLINE RULE RATHER THAN ITS MIRROR, which is why it is an entry rather than a clause: in the bundled counterfactual the perturbation flips AT the headline rather than earlier, so `flips earlier than the headline` never fires -- and in a two-claim test `the headline` has no single referent, so that rule cannot be applied reliably at all. Different trigger, different actor, different moment: the TEST AUTHOR before any perturbation is run, not the perturbation runner interpreting a flip.",
        },
      ],
    },
    {
      sprint: 16,
      improvements: [
        {
          action:
            "DELETING A TEST THAT DEFENDS AN ACCEPTED CRITERION IS A SCOPE DECISION, NOT A FIX, and it goes to the PO before it is re-homed. Applies to ANY change, not only sprint work.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed after three stakeholder-driven increments landed between sprints with tests green and perturbations run -- the fast loop working -- while one of them silently withdrew PBI-15's legibility criterion, accepted one sprint earlier, by deleting its two tests. The signal was there (eight tests reddened); what was missing was routing it back. FILED AS ITS OWN ENTRY rather than merged into Sprint 11's classification, which covers a perturbation that could not be CONSTRUCTED -- this covers a defence deliberately REMOVED, and collapsing them would lose the same kind of distinction that kept the justification standard and the coverage rule apart.",
        },
      ],
    },
    {
      sprint: 15,
      improvements: [
        {
          action:
            "A COMMAND WHOSE EXIT CODE IS BEING REPORTED IS RUN UNPIPED, and the report carries the COMMAND AS RUN rather than only its exit.",
          timing: "immediate",
          status: "active",
          outcome:
            "THIRD OCCURRENCE OF ONE CLASS, two people, one of them persisting nine sprints, and the consequence every time is a FALSE MEASUREMENT: the reported exit belongs to the LAST command in the pipe. The Developer read tail's status instead of bun test's; the Scrum Master lost an exit to ${PIPESTATUS[0]}, which is empty in zsh; and at Sprint 15's verification the Scrum Master reported oxlint exit 1 that was GREP FINDING NO MATCH. Caught in the same turn and re-run unpiped, so nothing false was recorded. The DoD instruction covers the four DoD commands; the gap is ANY exit being reported. THE SECOND CLAUSE IS LOAD-BEARING, and is why this is not the conscientiousness-dependent kind twice refused: a habit that leaves no trace cannot be audited, and a report carrying the command shows its own defect to any reader.",
        },
      ],
    },
    {
      sprint: 14,
      improvements: [
        {
          action:
            "WHEN EXECUTION CHANGES HANDS MID-SPRINT, the facilitator says so AT THE TIME and names who will verify -- rather than the gap surfacing at Review.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed by the Scrum Master against their own conduct: the execution agent was stopped, they continued the sprint themselves without weighing the alternative, and every perturbation from that point had ONE observer who was also its author. IT PROTECTS THE PERTURBATION-LABELLING RULE'S MEANING rather than merely being uncovered by it -- `INDEPENDENT` means `I ran my own probe rather than reproducing the recorded one`, and when the verifier IS the author that label is VACUOUS WHILE STILL READING AS REASSURANCE. Silent degradation inside one of the PO's own rules. Disclosure at the time is also the only thing that makes a replacement executor or an assigned verifier possible at all; an amendment to the labelling rule could only fix the report after the fact and cannot recover the observer.",
        },
        {
          action:
            "WHEN A SPRINT CHANGES OBSERVABLE BEHAVIOUR, the Review states whether any PROSE describing that behaviour changed. Standing-list item.",
          timing: "sprint",
          status: "active",
          outcome:
            "The PO's own trigger, fired and named as partly theirs: they required Sprint 13's mid-path criterion and never asked about the prose beside it, so the example spent a sprint telling this stakeholder their deliberately-set confirmBehavior did nothing -- in the document that argues for adoption, one sprint after the ruling made that setting theirs. A REPORTING item and deliberately NOT a mechanism: a claim-extraction check over example prose is the declined criterion-citation mechanism in a different coat.",
        },
        {
          action:
            "A REVIEW RE-RUNS ONE PERTURBATION from the previous sprint, verified by whoever is verifying then.",
          timing: "sprint",
          status: "active",
          outcome:
            "A SECOND RATIONALE, found at Sprint 16 and recorded because it is the answer if the cost is ever questioned: IT ALSO DETECTS DISARMED CONTROLS. Extracting a table to satisfy one requirement silently dropped the contextual typing that made a DIFFERENT control fire, and the DoD STAYED GREEN THROUGHOUT -- caught only by re-running someone else's perturbation after one's own edit, which no check in this project performs. The remedy for a single-observer sprint, and it works because the perturbations are REPRODUCIBLE even when they were not independently observed -- the record was auditable though unaudited, which is what item-by-item reporting was built to produce. Costs almost nothing and restores a second observer retroactively for at least one claim.",
        },
      ],
    },
    {
      sprint: 13,
      improvements: [
        {
          action:
            "A claim about WHAT THE SUITE COVERS is checked against the suite before it is recorded. Recalled coverage is not coverage. SUBJECT WIDENED TWICE AT SPRINT 16, neither a new rule: a claim about WHAT THE RULE SET CONTAINS is checked against the rule set, and a claim that the suite does NOT defend something is a coverage claim too. THE RECURRING SHAPE, named because it is where all five instances live: A FACTUAL PREMISE STATED INSIDE A CRITERION IS A CLAIM REQUIRING MEASUREMENT, NOT FRAMING -- premises go unchecked because reviewers read the REQUIREMENT. The PO asserted a filed improvement existed and it never had been -- the fourth catch by their own rule, and the first where the Scrum Master caught it by applying that rule TO the PO rather than taking their word.",
          timing: "sprint",
          status: "active",
          outcome:
            "SPLIT BACK OUT at the PO's ruling one turn after being merged into the S8 justification standard, on the same live-reason test that kept the perturbation pair apart: the justification standard PERMITS `reasoned`, and this rule FORBIDS it. A coverage claim may not be labelled reasoned and left there, because checking is cheap and the failure mode was asserting a measurement nobody had done. A strengthening that removes an option the parent rule allows is not a restatement of it. The measured-or-reasoned label does not help here: the falsified note did not read as unlabelled, it read as CHECKED.",
        },
        {
          action:
            "A PLAN CARRIES PROPERTIES, NOT MECHANISMS. It states the PROPERTY to establish rather than the mechanism to use, and it may not substitute a PROXY for a criterion's property. Where a plan must name a mechanism, it says whether that mechanism was MEASURED to produce the property.",
          timing: "sprint",
          status: "active",
          outcome:
            "MERGED AT SPRINT 14 from two statements of one rule, nothing dropped. S12: the plan converts a criterion into an implementation recipe and the recipe silently becomes the real acceptance test -- one layer below checklist-versus-criterion drift, where the reviewer's thinking runs ahead of the criterion. S13: filed by the Scrum Master against their own conduct, at the PO's ruling that `the Developer will catch it` fails the Sprint 2 standard, since it makes correctness depend on someone downstream remembering to look -- and the piped-exit-code defect shows how slowly that works when they do: nine sprints. MERGED AT SPRINT 17 from the S5 shared-moment rule, which is the same rule about a different axis: a plan that hides which subtasks are ONE EDIT produces a born-green RED, and declaring it in advance is the property-not-mechanism discipline applied to sequencing.",
        },
      ],
    },
    {
      sprint: 11,
      improvements: [
        {
          action:
            "When a perturbation CANNOT BE CONSTRUCTED, classify it. NOT CONSTRUCTED: the means were lacking -- the assertion is undefended, say what remains at risk.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed by the Developer against themselves: their vocabulary had three outcomes -- reddened, did not redden, could not build it -- and the third defaulted to the pessimistic reading, so they reported a DESIGN SUCCESS in the language of a coverage gap.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "THE LIFETIME RULE, three findings in one: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; one that shapes WHAT TO BUILD NEXT belongs on the PBI; one whose only home is a MACHINE-FORMATTED FILE that cannot carry comments belongs in a TEST THAT ASSERTS IT -- the file carries the decision, the test carries the reason. COMPACTION may drop a recorded decision ONLY when it has such a home, and each compaction NAMES where every dropped decision went -- in the commit message, which is the AUDIT TRAIL for the move and never itself a home. AMENDED AT SPRINT 13 on measurement, once `tighten the wording` was shown to name a lever that does not exist (oxfmt puts each string on one line, so an improvement costs the same whatever it says and the only lever is fewer objects): active improvements MAY BE MERGED when they state ONE RULE, content preserved and provenance named; none may be dropped. And what gets SURFACED to the PO rather than merely recorded is the short list that can still evaporate -- drops whose home is NOT a permanent assertion, a comment at the site it constrains, or an active improvement.",
          timing: "immediate",
          status: "active",
          outcome:
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction. Filed after the Scrum Master raised the compaction half about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record. MERGED AT SPRINT 13, nothing dropped: absorbs the route-to-a-PBI sharpening (S9) and the machine-formatted-file corollary (S10), which were three statements of one rule. MERGED AT SPRINT 17: the S2 orphan-note rule is this rule's second clause made specific -- a note addressed to ANOTHER PBI is written onto THAT PBI when created, never left to be rescued at compaction. First application found a real orphan immediately: PBI-2 said `PBI-3 and PBI-4 widen it again`, PBI-3 carried its copy, PBI-4 carried nothing.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME, written into its `verification` TEXT: name the change that would make it fail, check that the verification can DISCRIMINATE the property claimed, and check that nothing else in the record contradicts it. If no change would make it fail, the criterion is VACUOUS and must be rewritten before it binds. WIDENED AT SPRINT 20 rather than filed as a new entry, because it is a COVERAGE GAP IN THIS RULE'S SUBJECT and not a precondition for it -- the distinction that made the granularity finding its own entry: THIS REACHES ANY OBSERVATION INTENDED TO DISTINGUISH STATES, INCLUDING A PROBE DESIGNED BEFORE THE CODE EXISTS. IF TWO OUTCOMES PRODUCE THE SAME OBSERVATION, THE MEASUREMENT RECORDS NOTHING. Found when a probe's first design was rejected before it recorded anything: with a candidate equal to the line's own text, `the extended range was honoured` and `ddc inserted its truncated word and did nothing else` produce THE SAME LINE. SHARPENED AT SPRINT 15, and it does not over-delete useful redundancy: A CONTROL THAT CAN NEVER BE THE FIRST THING TO FAIL IS NOT A CONTROL -- ask whether something else would have failed first. Two tests reddening on one bug is fine; a test that reddens only after another already has adds nothing. IT READS IN BOTH DIRECTIONS, added at Sprint 16 with the guard that stops it becoming a licence: one that WOULD be first to fail is worth ADDING when the existing detection is real but ARRIVES WITHOUT NAMING ITS CAUSE. Gating exit cleared that bar -- a genuine detection that named nothing and cost two minutes of hang; most gaps will not.",
          timing: "immediate",
          status: "active",
          outcome:
            "MERGED AT SPRINT 13 from three statements of one rule, nothing dropped. S9: the absence-pairing rule moved from assertions to criteria and from execution to refinement. S10: the verification field travels with the criterion through every compaction, where a plan evaporates at Review -- so the control lives there, not in the plan's perturbations. S10: PBI-7's criterion 1 was a runtime test for a compile-time property contradicted by its own note. S15: a test calling runTsc(repoRoot) -- which IS the DoD's own tsc --noEmit -- was DELETED before the tag, since it could not fail unless the DoD had already failed. AND THE TRIGGER FOR SOMETHING STRUCTURAL, stated rather than left to be derived: a control has now twice been found to fire for the WRONG CAUSE -- skipLibCheck at S10, a dependency-removal control at S15 -- both caught by their author BEFORE the result was recorded. Twice caught in time is the rule set composing; ONCE RECORDED would be a false proof closing a question, which is the highest-cost error in this project's economy.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. ADDED AT SPRINT 24: A MEASURED CLAIM RECORDS WHAT WOULD LET IT BE RE-RUN, NOT ONLY ITS CONCLUSION. For a DEPENDENCY that means VERSION AND PATH; for THIS REPOSITORY it means an anchor that SURVIVES EDITS, since a line number moves when prose is added above it. THE ASYMMETRY IS NAMED because it tells a writer where to be careful when pressed: a path WITHOUT a version MISLEADS -- it looks precise, points at the wrong lines after a bump, and READS AS RE-CHECKABLE WHEN IT IS NOT -- where a version without a path merely COSTS A SEARCH. Filed after THE PROJECT'S FIRST FALSE `MEASURED` LABEL: `traceReceivedNotification fires at three sites whether or not a handler exists` could not be re-checked, while its correction -- vscode-jsonrpc 9.0.1, connection.js:646-648 -- could, AND THAT DIFFERENCE IS WHY THE ERROR SURVIVED A SPRINT. The internal case belongs here too: a record cited TWO different line numbers for the SAME assertion, because prose added between runs moved it. ADDED AT SPRINT 18: A COMMENT ASSERTING CURRENT BEHAVIOUR STATES WHETHER AN ASSERTION BACKS IT -- three site comments were found claiming things nothing checked, each reddening nothing on first attempt. It targets the BIRTH defect, prose that was never checked, where the standing prose item targets DRIFT, prose that became false; and it is bounded at write time rather than requiring perpetual re-perturbation, which would be claim-extraction wearing a review practice.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed at the Developer's request after they named it at second occurrence. Its S13 STRENGTHENING lives separately: a claim about what the suite covers may not take the `reasoned` option this rule allows.",
        },
      ],
    },
    {
      sprint: 7,
      improvements: [
        {
          action: "A behaviour is pinned by a test where ONE outcome is required.",
          timing: "sprint",
          status: "active",
          outcome:
            "A bounding condition on seven sprints of pin-everything pressure, whose cost is already visible: PBI-9 carries three separate instances of hardcoded-response-id brittleness -- tests that resist legitimate change without defending a requirement.",
        },
      ],
    },
    {
      sprint: 6,
      improvements: [
        {
          action:
            "Every assertion that something is ABSENT -- zero stderr, zero $/progress, a label not on stdout -- ships with a PAIRED assertion, permanent in the suite, that the same measurement observes it when present.",
          timing: "immediate",
          status: "active",
          outcome: "Generalises what the PO had been imposing by hand criterion by criterion.",
        },
        {
          action:
            "A perturbation specified by the PRODUCT OWNER names the assertion it is required to flip, not just the mutation to make.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed separately from the perturbation-LABELLING rule on purpose: that one governs how the Scrum Master REPORTS (reproduction versus independent, expected versus observed), this one governs how the PO AUTHORS.",
        },
      ],
    },
    {
      sprint: 5,
      improvements: [
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
            "Standing item 6, AMENDED at Sprint 13 (no exception carved -- exceptions rot): the stakeholder-facing example is EXECUTED by the suite -- the config is loaded and driven, and a change that breaks it must redden a named assertion. It need NOT be the config that carries every property assertion; purpose-built configs may.",
          timing: "immediate",
          status: "active",
          outcome:
            "TWO negative controls, named separately because they are different failures: breaking its IMPORT must redden (the Sprint 9 case), and breaking a HANDLER'S RETURN must redden. Supersedes the with-no-fixture-copy-in-existence wording, which forbade purpose-built fixtures rather than forbidding an unexecuted example.",
        },
      ],
    },
    {
      sprint: 4,
      improvements: [
        {
          action:
            "PERTURBATION DISCIPLINE, one rule: anything not perturbed is assumed UNPROVEN; every subtask declares expected-RED or born-green; every perturbation is named by the ASSERTION it flips, not by the subtask it belongs to. If it flips at an EARLIER assertion than the subtask's headline claim, PREFER SPLITTING OVER DOCUMENTING -- the earlier flip is a signal that the test BUNDLES independent sub-claims, and splitting DISSOLVES what a note would only describe.",
          timing: "immediate",
          status: "active",
          outcome:
            "MERGED AT SPRINT 14 from two statements of one rule, nothing dropped, and the second was always a corollary of the first's last clause. The base rule had ALREADY been amended three times, which is its own signal: a rule list nobody can hold in their head stops being applied at exactly the moment it is needed -- which is the argument for merging rather than against it.",
        },
        {
          action:
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new.",
          timing: "immediate",
          status: "active",
          outcome:
            "Nine items where three carried new information diluted the signal the item-by-item rule exists to protect. MERGED AT SPRINT 17 from the S1 timing rule, one rule about one artifact: the checklist is ISSUED AT PLANNING rather than at Review, so the plan can target it.",
        },
      ],
    },
    {
      sprint: 3,
      improvements: [
        {
          action:
            "A Review perturbation states whether it REPRODUCES the Developer's recorded perturbation or is INDEPENDENT.",
          timing: "sprint",
          status: "active",
          outcome:
            "Prompted by a Review perturbation reddening 6 tests where the Developer's reddened 2.",
        },
      ],
    },
    {
      sprint: 2,
      improvements: [
        {
          action:
            "When a planning spike produces passing code, ATTACH it for the executor to start from -- the plan then says what to change about it instead of re-deriving it in prose -- and the attachment must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask.",
          timing: "sprint",
          status: "active",
          outcome:
            "MERGED AT SPRINT 13 from the S1 attach rule and the S2 durability rule, nothing dropped.",
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
