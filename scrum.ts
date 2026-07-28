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
      id: "PBI-19",
      story: {
        role: "config author",
        capability: "see the root the editor named, however that client spelled it",
        benefit:
          "a project that IS open stops looking like no project at all, because the client used the field its LSP version had",
      },
      acceptance_criteria: [
        {
          criterion:
            "A client that sends rootUri but no workspaceFolders still reaches a handler with a folder",
          verification:
            "Drive initialize with rootUri set and workspaceFolders ABSENT; assert the handler observes one folder resolving to that root. VERIFIED SYNTHETICALLY, SAID PLAINLY ON THE PBI RATHER THAN AT REVIEW: MEASURED across all three capability declarations, nvim sends rootUri and workspaceFolders TOGETHER OR NEITHER, so NO MEASURED CLIENT PRODUCES THIS CASE -- the spec contemplates a rootUri-only client and such clients existed, which is why the item stands, but nobody should read it as this stakeholder's. NEGATIVE CONTROL: absence must still be absence -- a client sending NEITHER leaves the list EMPTY, never a folder synthesised from cwd or from anything else this process could invent",
        },
        {
          criterion: "The protocol's own precedence is what decides, not ours",
          verification:
            "workspaceFolders > rootUri > rootPath, each asserted against the pair below it: folders present WINS over a conflicting rootUri, and rootUri wins over a conflicting rootPath. MEASURED FROM THE INSTALLED TYPES, which state the second half outright -- `If both rootPath and rootUri are set rootUri wins`",
        },
        {
          criterion:
            "A synthesised entry is an ORDINARY MEMBER of the list, and deltas apply to it",
          verification:
            "With a folder synthesised from rootUri, send workspace/didChangeWorkspaceFolders adding another and assert BOTH are present; send one removing the synthesised URI and assert it goes like any other entry. NEGATIVE CONTROL: discarding the fallback on the first change leaves the list holding the DELTA ALONE -- a first event of `added: [Y]` yields [Y] where the client may well hold [root, Y]",
        },
        {
          criterion: "A client `added` naming the SYNTHESISED URI yields TWO entries",
          verification:
            "Synthesise from rootUri, then send added: [that same URI] and assert the list holds it TWICE. NEGATIVE CONTROL: any collapse reddens it -- and a well-meaning `do not duplicate our own entry` check passes EVERY OTHER criterion, the identical hazard shape to PBI-20's `includes` guard, which was measured passing everything else. APPEND RATHER THAN REPLACE, and the losing argument is recorded because it is strong: one folder guessed and once confirmed is arguably not two, and OUR entry is an estimate where the client's is a statement. It loses on MECHANISM COST -- replace reintroduces PROVENANCE one turn after the uniformity ruling removed the need for it, and an exception for our own entry makes the synthesised entry EXTRAORDINARY again",
        },
      ],
      status: "ready",
      notes: [
        "MEASURED FROM THE INSTALLED PROTOCOL TYPES, and this is the whole argument: workspaceFolders `is only available IF THE CLIENT SUPPORTS WORKSPACE FOLDERS`, while rootPath is deprecated in favour of rootUri and rootUri in favour of workspaceFolders. So a client without that capability sends NO folders and may still send a root -- and today tsudoi hands such an author an empty list, from which they conclude the editor opened no project when it opened one and said so in the deprecated field. The silent-absence class, through a door PBI-15 did not cover. A PREMISE THE PO FLAGGED AS UNCONFIRMED AND ASKED FOR BEFORE FILING, THEN FALSIFIED BY READING THE DECLARATIONS RATHER THAN THE PROSE: they reasoned that such a client could never send didChangeWorkspaceFolders, which would have made synthesis and tracking DISJOINT. It is not declared, AND THE STAKEHOLDER NAMED WHY, which is more useful than the absence: THE CLIENT CAPABILITY'S JOB IS THE REQUEST DIRECTION. CM<C, S> is { client, server }; the server-to-client REQUEST workspace/workspaceFolders declares CM<`workspace.workspaceFolders`, `workspace.workspaceFolders`>, while the client-to-server NOTIFICATION declares CM<undefined, `workspace.workspaceFolders.changeNotifications`> -- no client capability at all, and the only gate named is the SERVER's registration switch, which Sprint 14 measured nvim ignores anyway. So the capability says whether the server may ASK the client for folders; it says nothing about whether the client volunteers changes. Separateness therefore rests on DIFFERENT FAILURE MODES, which hold regardless: PBI-17 fixes a list going STALE, this fixes a list being EMPTY when the client did name a root.",
        "CRITERION 3'S PREMISE IS CONFIRMED BY MEASUREMENT rather than inherited, which the PO required: driving nvim 0.13 with workspace.workspaceFolders declared TRUE, FALSE and OMITTED, the notification ARRIVES IN ALL THREE -- including when the client declared FALSE. So its arrival does not depend on the declaration, which is the client-side confirmation of the stakeholder's reading that the capability governs the server-to-client REQUEST direction only.",
        "`name` IS SYNTHESISED AS THE FULL PATH -- `fileURLToPath(rootUri)`, and rootPath verbatim since it is already a path -- ON THE HONEST BASIS, the PO correcting the reason while KEEPING the choice: NOT because it matches the measured client, since the fallback only exists for clients that never send workspaceFolders and nvim ALWAYS does, so WE WOULD NEVER SYNTHESISE FOR THE CLIENT WHOSE CONVENTION WAS MEASURED. It stands because it is DERIVABLE FROM THE URI WITHOUT INVENTION.",
        "THE PO OVERTURNED THEIR OWN CRITERION 3 AT REFINEMENT, which is the REASONED label working exactly as designed -- marked so it could be corrected rather than inherited, and it was. The dropped rule was `a change notification proves the client can tell us folders, so discard the fallback`. TWO THINGS KILLED IT. (a) A CHANGE NOTIFICATION IS A DELTA, NOT A STATEMENT OF THE LIST: discarding replaces our only estimate of the pre-existing state with a delta-only view -- strictly less information, and the loss is SILENT. (b) THE MEASUREMENT UNDERCUT THE PREMISE: a client sends the notification while declaring the capability FALSE, so sending changes proves very little about what it declared or holds. CONSEQUENCE WORTH NAMING: the provenance flag the Developer designed to resolve the old tension is now UNNECESSARY -- an elegant answer to a problem the overturn removed, and better found before it was built than after. A LIMIT RECORDED SO NOBODY READS THIS AS THE STAKEHOLDER'S FIX: with the bare on_dir() their kakehashi uses, nvim sends rootUri: null, rootPath: null AND workspaceFolders: null -- ALL THREE EMPTY. There is nothing to convert. This helps clients that name a root without naming folders, a real but small population containing no known user, which is why it is ordered after PBI-17.",
        "THE NAME STAYS `workspaceFolders` -- a folder derived from rootUri genuinely IS a workspace folder expressed in an older field, and src/types.ts's own header says renaming an export breaks configs we cannot see. WHAT BECOMES FALSE IS THE COMMENT, which says the value is what the client SENT: it changes in the SAME COMMIT and must name the precedence chain, so an author meeting a synthesised `name` knows where it came from. A PROBE WORTH RUNNING DURING THE SPRINT, NOT AS A GATE ON IT: whether a client can be made to send didChangeWorkspaceFolders while declaring workspace.workspaceFolders false or omitting it. Its best outcome leaves the case REPRESENTABLE in the protocol, so this PBI must define behaviour either way -- a measurement that cannot change the deliverable does not block refinement.",
      ],
    },
    {
      id: "PBI-20",
      story: {
        role: "config author",
        capability: "have a folder removed once removed once, not have every copy of it vanish",
        benefit:
          "the list keeps saying exactly what the client said, on remove as it already does on add",
      },
      acceptance_criteria: [
        {
          criterion: "N `removed` entries for one URI remove N copies, no more",
          verification:
            "Add a URI twice, send ONE removed entry for it, assert ONE copy REMAINS; send a second and assert it is gone. NEGATIVE CONTROL: today's filter -- which matches every entry with that URI -- reddens the first assertion",
        },
      ],
      status: "draft",
      notes: [
        "FILED AT SPRINT 17'S REVIEW, where the PO OVERTURNED an unpinned ruling. The Developer had recorded remove-all as `equally defensible` under the Sprint 7 one-outcome rule; the method was right and the input wrong. REMOVE-ALL DISCARDS WHAT THE EVENT CARRIED: a client removing two copies sends TWO `removed` entries and one removing a single copy sends ONE, so N entries should remove N copies -- an exact mirror. PBI-17's duplicate criterion honours multiplicity on ADD; symmetry honours it on REMOVE. One outcome IS required.",
        "NOT DONE AT REVIEW, and the line is the one held since Sprint 1: it arrived at Review, no observed client produces the case, and forcing src/ behaviour changes there is retroactive scope. The SITE COMMENT was corrected before the tag instead -- src/workspace.ts now says which behaviour is correct and that this is not it -- because wrong reasoning sitting where someone reads it is the thing that propagates.",
        "CONTRIVED, and saying so is what keeps the ordering honest: nothing observed produces a duplicate URI in a real client. ORDERING BASIS REPLACED AT SPRINT 18 rather than repeated: PBI-19 was ordered first for serving a real population, and measurement showed NO CLIENT PRODUCES ITS CASE EITHER -- both are speculative now. It still leads on two narrower grounds: the HARM IS LARGER (no root at all versus losing a duplicate), and its case is CONTEMPLATED BY THE SPECIFICATION where this one is an interaction of two of our OWN criteria that nothing anticipates.",
      ],
    },
  ],

  completed: [
    {
      number: 17,
      pbi_id: "PBI-17",
      goal: "Answer from the workspace as it is now -- a folder the user adds mid-session changes what they are offered, and one they remove stops answering.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 5c3588d, 5bb6239, 4d3bc75, a4adbcd, 8fa78e3 and bd6e33a. 293 tests green (up from 284), each DoD command run separately with its exit read directly. src/workspace.ts is a HANDLE in the shape of DocumentStoreHandle -- the codebase's own answer to state that notifications write and requests read.",
        "THE DESIGNED-FOR RED WAS OBSERVED, NOT ASSUMED, which the PO's checklist required precisely because a designed-for RED arriving green is a finding: with `added` handled and `removed` deliberately not, the removal test failed on BOTH runtimes with the folder still present.",
        "THE PO'S OWN CRITERION MEASURED RATHER THAN REASONED, and re-run by the Scrum Master: a URI-comparing dedupe guard on `added` reddens `a URI added twice is held twice` on both runtimes and NOTHING ELSE. That is the exact hazard the Developer predicted -- the guard passes every OTHER criterion, which is why the rule was pinned rather than noted.",
        "THE PO OVERTURNED AN UNPINNED RULING OF THE DEVELOPER'S, and the method was right while the input was wrong. A URI held twice and removed once loses BOTH copies; that was recorded as `equally defensible` under the Sprint 7 one-outcome rule. But REMOVE-ALL DISCARDS WHAT THE EVENT CARRIED -- N `removed` entries should remove N copies, an exact mirror, and this list honours multiplicity on ADD. One outcome IS required. The site comment was corrected BEFORE THE TAG; the behaviour change is an INCREMENT, because forcing src/ changes at Review is the retroactive-scope line held since Sprint 1.",
        "REMOVED-BEFORE-ADDED STOPPED BEING DEFENSIBLE BY ACCIDENT: it is decided by the visible-over-silent principle, since a rename spelled as one event ends HOLDING the folder -- a phantom, visible if wrong -- where the other order ends holding nothing, which is silent.",
        "NOT CONSTRUCTED, with the residual named: criterion 5's before-initialize and after-shutdown halves are NOT observable end to end -- initialize REPLACES the list so an ungated write leaves no trace, and after shutdown every request is refused so no handler remains to read it back. The test sits at the router with the stub registrar, so `the real stdio connection drops this outside the serving window` is proven THERE ONLY. Criteria 1-3 carry the inside-the-window wiring, which is what makes the gap narrow rather than open.",
        "SINGLE-OBSERVER EXCEPT TWO, disclosed rather than presented as five: the executor wrote and ran all five perturbations. The Scrum Master re-ran the dedupe guard, and the wrong-params probe is a REPRODUCTION of Sprint 16's -- landing on the FIRST entry added since defineNotifications, which is the case most likely to have lost the contextual typing that extraction cost last sprint. That is also this Review's cross-sprint re-run.",
      ],
    },
    {
      number: 16,
      pbi_id: "PBI-18",
      goal: "Make the lifecycle gate impossible to forget -- a notification added without deciding when it may run should fail to compile, not ship ungated.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "CARRIED FORWARD FROM SPRINT 10 THROUGH EVERY COMPACTION SINCE, because it is the one open decision no sprint can close. The stated route's FIRST line -- how a user obtains the package -- is verified from a local tarball, not from npm. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package that has never been published, and publishing needs an account and is irreversible.",
          impact:
            "PBI-13's criteria are met for everything after the install: the same artifact, the same install command shape and the same entry point serve both runtimes. What is NOT verified is that the registry hands a user this tarball -- the metric says `from an installed package`, and installed-from-a-tarball is the closest a developer can get without a human decision.",
          request:
            "Decide whether to publish 0.0.x to npm so the obtain half can be verified, and provide the account if so. Until then nothing in this repo may claim the registry route works; test/installed-runtime.test.ts marks it NOT VERIFIED in the same comment that states it.",
          status: "waiting_human",
          notes: [],
        },
      ],
      decisions: [
        "COMPACTED AT SPRINT 17: this sprint's own prose-item catch is homed in the standing improvement it exercised, and its PBI-17 consequences are ON PBI-17 -- the opt-in note deleted, criterion 4's control moved to a wrong gate assignment. SPRINT 15'S RECORD DROPPED, homes checked: the published-arm controls ARE test/published-artifacts.test.ts and still run; the stays-green FORECLOSURE and the deleted inert control are comments in that file; the README install instruction and the drift sentence are the README's own bytes, extracted by the suite. Sprint 10's npm impediment rides here, still open. Shipped in e8c2a8c, 2d0afad and 5fcabcf. 284 tests green, each DoD command run separately with its exit read directly. src/notifications.ts routes every notification through one gate; `gate` is a REQUIRED field with no default, so an entry that decides nothing does not TYPE-CHECK -- asserted, not argued: a probe omitting it fails with TS2741.",
        "THE BASELINE CONTROL FALSIFIED THE PO'S OWN CRITERION, and the truth is a better argument than the claim it replaced. `deleting the check from ANY ONE handler body reddens nothing` was measured on all three: didChange NOTHING, didClose NOTHING, didOpen FOUR TESTS that never mention it. TWO OF THREE COPIES WERE PURE CONVENTION AND THE THIRD WAS DEFENDED ONLY INCIDENTALLY -- exactly the state a structural gate exists to end. The control is now FORECLOSED (no body check remains), so the measurement is homed at src/notifications.ts, which is the only place it survives. THE EXIT CARVE-OUT, and the ruling that Sprint 3's hang precedent DOES NOT REACH IT: that hang was BUFFERING-CONTINGENT, this one is a structural consequence of a dropped notification. So the timeout is a real control -- gating exit times out lifecycle.test.ts on both runtimes and takes a twelve-second suite past two minutes. A DETERMINISTIC assertion was added anyway, on the S15 sharpening READ IN THE OTHER DIRECTION: the hang can never be FIRST to fail, so it names nothing. exit's gate is asserted AS A VALUE off the entry table, paired with every other entry declaring `lifecycle` so a blanket table cannot satisfy it.",
        "SATISFYING ONE REQUIREMENT DISARMED ANOTHER CONTROL, AND THE DoD STAYED GREEN THROUGHOUT. Extracting the table so its gates could be read as values dropped the contextual typing each handler's params gets from the `type` beside it -- three fell to implicit `any`, and the wrong-params compile error stopped being one. Caught by re-running the Developer's perturbation after the Scrum Master's own edit; fixed with defineNotifications, an identity carrying the router's inference to wherever a table is built. Recorded as the re-run improvement's SECOND rationale. PROPERTY-NOT-MECHANISM PAYING OFF VISIBLY, which the PO noted is rare because it usually pays off invisibly: they asked for the gate asserted AS A VALUE and left HOW open. The obvious implementation -- a plain helper returning the table -- was the one that silently disarmed the typing. Had they specified the mechanism they would have shipped the regression themselves.",
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
    number: 18,
    pbi_id: "PBI-19",
    goal: "Let a config author see the root the editor named, whichever field that client's LSP version used to name it.",
    status: "in_progress",
    subtasks: [
      {
        test: "A client sending rootUri but no workspaceFolders reaches a handler with a folder",
        implementation:
          "SYNTHESISE INTO THE LIST AT INITIALIZE, never compute at read time. `name` is fileURLToPath(rootUri); for the rootPath rung `name` is rootPath VERBATIM and `uri` comes from pathToFileURL -- one convention covering both synthesis sites, so the second does not invent its own.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "ONE IMPLEMENTATION MOMENT WITH SUBTASK 4, and the reason is unusual: subtask 4 has NO implementation of its own -- it is true or false depending on HOW this one is written.",
          "THE NAME'S ONLY REAL JUSTIFICATION is that it is DERIVABLE FROM WHAT THE CLIENT SENT with nothing invented. The shape-consistency argument is deliberately NOT recorded beside it: the fallback fires only for clients that never send workspaceFolders, and nvim always does, so matching the measured client is not an argument available here. A non-argument beside a real one is worse than the real one alone, because a reader cannot tell which is load-bearing.",
        ],
      },
      {
        test: "Absence stays absence -- a client sending NEITHER leaves the list empty",
        implementation: "Born green. THE CRITERION CARRYING THIS PBI'S HONESTY.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE CONTROL THAT MUST BE RUN: synthesise from cwd and this must redden while subtask 1 stays green. MEASURED -- cwd is nvim's own launch directory when no root is found, so a cwd fallback LOOKS CORRECT IN EVERY SCENARIO except the one this criterion exists to make visible.",
        ],
      },
      {
        test: "Precedence: workspaceFolders > rootUri > rootPath",
        implementation:
          "Three assertions, each against the pair below it. MIXED: the top rung is born green (today's behaviour), the rootUri > rootPath rung is a genuine RED.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "REPORT WHICH RUNGS WERE BORN GREEN, so the chain's evidence is legible rather than implied.",
        ],
      },
      {
        test: "Deltas apply to the synthesised entry like any other, and a client `added` for its URI yields TWO entries",
        implementation:
          "BORN GREEN BY CONSTRUCTION, WITH NO IMPLEMENTATION OF ITS OWN -- a consequence of not special-casing, since an ordinary member of the list the notification writes through gets uniformity free.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE WHOLE VALUE IS THE CONTROL, and the wrong implementation is the TEMPTING one: a READ-TIME fallback, `folders.length > 0 ? folders : synthesise(rootUri)`, passes subtask 1 perfectly. REPORT BOTH DIRECTIONS FROM THAT ONE PERTURBATION: a first `added: [Y]` yields [Y] rather than [root, Y], AND a later `removed` that empties the list makes the fallback REAPPEAR. The second is the worse hazard -- a folder the client EXPLICITLY REMOVED coming back -- and reporting one while the other goes unnamed leaves half of it undefended.",
          "THE DUPLICATE HALF IS PINNED because a well-meaning `do not duplicate our own entry` check passes every OTHER criterion. RESIDUAL, named rather than glossed: the list can hold two entries for one folder, our estimate beside the client's statement. Mild in practice -- PBI-14's dedup-by-inserted-text collapses identical strings, so the example produces one item -- and visible only to a config author counting roots.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE PO'S CHECKLIST: (1) the read-time trap controlled IN BOTH DIRECTIONS from one perturbation; (2) subtask 2's cwd control RUN; (3) criterion 1's synthetic verification RESTATED at Review, so the result does not read as `this works for a client we have seen`; (4) the duplicate case pinned, both halves; (5) which precedence rungs were born green, reported.",
      "THE REVERSAL'S CLEAREST PAYOFF, named by the PO: subtask 4 became IMPLEMENTATION-FREE. Under the old rule dropping the fallback was work; under the new one uniformity is a consequence of not special-casing. Its entire value moved into its control.",
    ],
  },
  retrospectives: [
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
      sprint: 12,
      improvements: [],
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
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME, written into its `verification` TEXT: name the change that would make it fail, check that the verification can DISCRIMINATE the property claimed, and check that nothing else in the record contradicts it. If no change would make it fail, the criterion is VACUOUS and must be rewritten before it binds. SHARPENED AT SPRINT 15, and it does not over-delete useful redundancy: A CONTROL THAT CAN NEVER BE THE FIRST THING TO FAIL IS NOT A CONTROL -- ask whether something else would have failed first. Two tests reddening on one bug is fine; a test that reddens only after another already has adds nothing. IT READS IN BOTH DIRECTIONS, added at Sprint 16 with the guard that stops it becoming a licence: one that WOULD be first to fail is worth ADDING when the existing detection is real but ARRIVES WITHOUT NAMING ITS CAUSE. Gating exit cleared that bar -- a genuine detection that named nothing and cost two minutes of hang; most gaps will not.",
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
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies.",
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
    {
      sprint: 1,
      improvements: [],
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
