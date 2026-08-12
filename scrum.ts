// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). RAISED FROM 500 BY THE
// STAKEHOLDER, AND THE REASON THEY GAVE IS NO LONGER THE REASON IT
// HOLDS. It was raised because this dashboard carried the measured
// rulings and the reasons they were overturned. Those have LEFT for
// `.claude/skills/`, where they are delivered by the harness at the
// moment they apply instead of waiting to be remembered. What is left
// here is what only this file can hold: what is being built now, what
// was decided about it, and by whom.
//
// THE LIFETIME RULE, AND THE STAKEHOLDER HAS AMENDED IT. A decision may
// be compacted out of this file only into a home that OUTLIVES a
// context window: a permanent assertion, a comment at the site where
// the violating edit would be made, a PRODUCT BACKLOG ITEM, or a SKILL
// in `.claude/skills/`. `AN ACTIVE IMPROVEMENT` WAS ON THAT LIST AND IS
// STRUCK, and striking it is what made this compaction possible: while
// an improvement was itself a permanent home, keeping one active was a
// licence to compact something else INTO it, so nothing ever had a
// reason to leave and eighty-one accumulated across thirty-eight
// retrospectives with not one ever closed. THE STAKEHOLDER'S RULE THAT
// REPLACES IT: mechanise what will still be needed -- as a check if
// something can redden, as a SKILL if the discipline is applied while
// writing rather than while running -- and delete what can be kept
// without a mechanism, or whose breach is survivable and can be
// reconsidered when it next surfaces. WHY A SKILL COUNTS AS A
// MECHANISM, which is the half a reader will doubt: sprint 47 measured
// that attention pointed AT a class still missed an instance of it --
// but what failed there was MEMORY, a rule delivered once by having
// been discussed. A skill is delivered by the harness on description
// match. Sprint 47 refutes attention; it does not refute delivery.
//
// EVERY SPRINT RUNS THE `revise` SKILL AFTER THE DEVELOPER'S WORK, WITH
// NO PR. THE STAKEHOLDER'S STANDING INSTRUCTION, NOT A TEAM PREFERENCE,
// and it is attributed here because unattributed it reads as advice and
// is dropped in the next tidy-up. WHAT IT IS: multi-perspective review,
// then independent review, converged before acceptance. WHY IT IS
// WRITTEN HERE AND NOT IN `definition_of_done`: that field carries
// `{ name, run }` where `run` is A COMMAND LINE THE RUNNER SPAWNS
// DIRECTLY -- not a shell command, and the runner REFUSES one carrying
// shell syntax rather than misreading it -- so a skill name there would
// make this dashboard assert something no command verifies, and would
// now be refused outright. That is the exact failure this project keeps
// catching. Do
// not "fix" the gap by adding it as a check. THE LINE IT DRAWS: a
// criterion asserts a product property a perturbation can falsify;
// `revise` finds what nobody thought to assert. NO CRITERION MAY BE MET
// BY ARGUMENT AT REVIEW.
//
// THE FILING BAR FOR THAT ROUND, WHICH QUALIFIES THE INSTRUCTION ABOVE
// RATHER THAN STANDING ON ITS OWN. It is HERE and not in a skill --
// delivery by skill is the thing this project has measured failing under
// load -- and not in the round's own skill file, which lives outside this
// repository and would be invisible to this project's review of its own
// records. A FINDING RECORDED AS PRE-EXISTING NAMES BOTH COMMITS AND THE
// BYTE-IDENTITY RESULT AT THE SPRINT'S BASE, OR IT IS THIS SPRINT'S TO
// REPAIR. IT NAMES THE ITEM IT IS FILED INTO, OR IT IS NOT FILED. AND
// PREDATING IS NOT ITSELF A LICENCE: a finding inside the sprint's own
// subject is repaired here even when it predates.
//
// AND A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED. It stands
// beside the bar above and qualifies it the same way: a note reporting
// what reddened is a reading OF THE MOMENT IT WAS TAKEN and nothing
// more, so a perturbation whose result is going to be relied on later is
// written as a record THE SUITE RE-RUNS -- a weakening, a named arm and
// a required red -- or, when the weakening is a reading of something the
// arm already holds, as an assertion beside that arm. Prose may then say
// why; it may not be the whole of it.
//
// THE MEASURED FAILURE MODE IS NOT `NO PERTURBATION WAS RUN`: these
// records are full of them. It is that each was run ONCE and written up,
// in a file whose own header says a decision may be compacted only into
// a home that OUTLIVES A CONTEXT WINDOW -- and a note is not such a
// home. The compensator that was supposed to reach is the standing
// re-run, which carries its own measurement that nearly every earlier
// perturbation aimed at something that no longer existed.
//
// WHAT NOTHING CHECKS, SAID HERE SO THE BAR IS NOT MISREAD AS A GREEN: no
// check decides whether an arm HAS a record. That detector is refused by
// name -- its failure mode is a green certifying a class as watched --
// so the registry's silence about unrecorded arms is honest, and this bar
// binds the AUTHOR rather than the run. `The adjacent weaker reading` is
// a judgement nothing verifies either.
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
          "5 of 5. ENUMERATED IN THE METRIC ITSELF because `10 of 10` stood for thirty sprints with NOTHING ANYWHERE ENUMERATING THE TEN -- grepped, the only match was the metric. A fraction whose denominator nobody can name cannot be met, and the PO twice reported `2 of 10` as fact. The five were set by the stakeholder, not invented to make the metric satisfiable. AND TSUDOI NOW SERVES MORE THAN FIVE -- `workspace/executeCommand` since sprint 86 and `textDocument/codeAction` since sprint 87, with `initialize` a further key a config may declare though it is not a row of the request table. THE DENOMINATOR DOES NOT MOVE FOR THEM, deliberately: this metric asks whether what the STAKEHOLDER ASKED FOR responds, and a denominator that grew every time the product did would be a fraction nobody could fail. What the code serves is counted by the request table and by nothing here.",
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
      id: "PBI-91",
      story: {
        role: "editor user",
        capability:
          "see the diagnostics my efm linters already produce, under tsudoi, with the `lint-formats` errorformats from my own config.yaml doing the parsing",
        benefit:
          "the linter set is the value of efm, and an adapter that formats but does not lint has not adapted efm",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. The errorformat parser is the item and its scope is not settled.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THE COST IS THE ERRORFORMAT PARSER AND IT IS NOT SMALL. `lint-formats` is a list of VIM errorformats -- `%f:%l:%c: %m`, and also the multi-line stack forms efm's own README uses for eslint (`%+P%f`, `%-O`, `%*[ ]`). efm delegates it to reviewdog/errorformat, a Go implementation; nothing in this workspace parses one today. A slice honouring only the single-line forms is defensible and MUST REFUSE the rest rather than silently drop the lines it cannot match.",
        "AND THE SURROUNDING KEYS ARE EACH A DECISION: `lint-offset`, `lint-offset-columns`, `lint-severity`, `lint-category-map`, `lint-source`, `prefix`, `lint-ignore-exit-code`, `lint-stdin`, `lint-workspace`, `require-marker` and `root-markers`. tsudoi serves PULL diagnostics; efm's `lint-debounce`, `lint-after-open` and `lint-on-save` are about a PUSH schedule tsudoi does not have, and saying so is part of the item.",
      ],
    },
    {
      id: "PBI-92",
      story: {
        role: "editor user",
        capability: "invoke the `commands` from my efm config.yaml out of the code-action menu",
        benefit:
          "efm's commands are the half of it that DOES something, and this is also the first file in this repository where the initialize handler, the command row and the code-action row are shown working together",
      },
      acceptance_criteria: [
        {
          criterion: "PLACEHOLDER -- NOT REFINED, AND IT DEPENDS ON PBI-89 LANDING.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THIS IS THE SEAM SPRINT 86 LEFT UNWITNESSED, AND THE PRODUCT OWNER ALREADY RULED WHAT WOULD CLOSE IT: `an example config where the two increments are shown working together in a file a stranger reads`. A config declaring `initialize` (to fill `executeCommandProvider.commands`, which tsudoi advertises EMPTY), `workspace/executeCommand` (to run them) and `textDocument/codeAction` (to offer them) IS that file -- so this item discharges a refinement candidate rather than only adding a feature.",
        "THE CODE-ACTION ROW THIS NEEDS LANDED IN SPRINT 87, so what is left here is the adapter half.",
        "efm's command definition carries `command`, `arguments`, `title` and `os`, and `${INPUT}` appears in the ARGUMENTS. `os` filters by platform, and a command list that ignores it offers the user an action that cannot run.",
      ],
    },
    {
      id: "PBI-101",
      story: {
        role: "config author",
        capability:
          "register a handler for a method tsudoi does not define -- a real custom one like `textDocument/didFocus`, or a HOOK beside a built-in notification like `textDocument/didOpen` where tsudoi runs both",
        benefit:
          "the methods a config can answer stop being the ones tsudoi enumerated, and a hook no longer costs the author the document store by replacing the handler that fills it",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. The surface is nearly settled (see the notes, which carry four measurements) and the SEMANTICS are not: the ORDER of the built-in against the hook, where a rejecting notification hook reports, and who supplies the notification GATE are three open rulings, and none of the three is obviously right.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "MEASURED, AND IT REFUTES THE HANDLER TYPE AS FIRST DRAWN: `customMethodHandler<C> = C extends BaseNotificationContext ? Promise<void> : Promise<unknown>` TAKES THE NOTIFICATION ARM FOR BOTH KINDS. A notification context is the WIDER type -- it has fewer members -- so `BaseRequestContext` SATISFIES it and the conditional never reaches its second arm. Probe at `--strict`, exit 0 with `Eq<AsWritten<BaseRequestContext>, Promise<void>>` asserted TRUE, nothing objecting. THE DISCRIMINATION MUST NAME THE MEMBER THAT EXISTS ON ONLY ONE SIDE: `C extends BaseRequestContext ? Promise<unknown> : Promise<void>`, arms swapped, which the same probe confirms on both arms. THE SPELLING THAT READS CORRECTLY IS THE BROKEN ONE, which is why this is a note and not left to be discovered.",
        "MEASURED: A NOTIFICATION CONTEXT THAT ADDS NOTHING IS THE SUPERTYPE, not a sibling of it. The strictest identity instrument in the tree -- the invariance trick in test/initialize-handler-types.test.ts -- reports an empty extension IDENTICAL to `BaseMethodContext`, while reporting `BaseRequestContext` DISTINCT from it. That second reading is the negative control: the instrument does discriminate, so the first is not vacuous. CONSEQUENCE FOR THIS ITEM: no test can defend a `BaseNotificationContext` that adds nothing, so either it carries a member the request context lacks, or the notification side takes the supertype directly and the name is not published.",
        "THE RESULT WRAPPER IS ACCEPTED AND ITS ARMS WERE MEASURED INVERTED, the second time this conditional has been drawn the wrong way round and by the opposite mistake -- so the shape is recorded rather than the correction. THE MOTIVE IS SOUND AND IS THE TABLE'S OWN PROBLEM ONE DOOR ALONG: a typed row says `Hover | null`, so ANSWERING null is distinguishable from answering nothing BY THE ROW'S TYPE, while a custom method's result is `unknown` and cannot say it -- hence `Promise<{ result: unknown }>`, where returning `{ result: null }` IS an answer and falling off the end is not. THE ARMS GO REQUEST TO `{ result }` AND NOTIFICATION TO `void`: MEASURED, the sketched pairing binds a REQUEST handler to `Promise<void>` and a NOTIFICATION handler to `Promise<{ result: unknown }>`, both arms exactly backwards, with nothing objecting because the condition itself is now correct.",
        'AND PARAMETERISING BY THE CONTEXT TYPE CONTRADICTS THE RULING BELOW, which is why the handler type takes the KIND instead. `customMethodHandler<C extends … | BaseRequestContext>` requires an author to NAME the type argument, and under `neither base name is published` the notification one cannot be named -- so the surface would be writable for requests and unwritable for notifications. `customMethodHandler<K extends "request" | "notification">`, resolving both the context AND the return from `K`, is the same discrimination with nothing unpublished: MEASURED, both arms resolve correctly, and a handler of each kind compiles INLINE with the author naming no context type.',
        "AND THE CORE CAN WARN ON A NOTIFICATION HANDLER THAT ANSWERED, WHICH NARROWS THE NOTE BELOW RATHER THAN BEING ADDED BESIDE IT. That note says tsudoi cannot read the kind off the wire, and that is true AT THE HANDLER; it does not follow that the core does not know, and the core does -- IT REGISTERED THE THING. So the kind is available at dispatch by RECALL OF A DECLARATION rather than by inspection, which is one more thing the declared kind buys.",
        "AND THAT WARNING IS NOT BELT-AND-BRACES, IT IS THE ONLY ENFORCEMENT THERE IS, which is what makes it worth the code. `Promise<void>` constrains a real config NOWHERE: src/config.ts reaches the config through a cast from `unknown`, and types.ts already records that nothing type-checks an author's own config against these types -- so an author whose notification handler returns a value gets no diagnostic from anything today, and the runtime check is the first and last chance to say so.",
        "THE SHAPE AND THE CADENCE ARE ALREADY DECIDED IN THIS REPOSITORY, so this should be copied rather than designed: `reportInvalidToken` in src/methods.ts writes to STDERR with the `tsudoi: ` prefix, ONCE PER METHOD PER SESSION, keyed by a `Set` -- and its comment records why a single session-wide flag was refused, namely that the first report on any row permanently silences every other. STDERR IS NOT A CHOICE among channels: cli.ts owes zero bytes on stdout, which belongs to LSP. AND THE PER-METHOD KEYING BITES HARDER HERE THAN WHERE IT WAS WRITTEN: a hook on `textDocument/didChange` runs on every keystroke, so an unconditional warning is a flooded stderr rather than a louder one.",
        "AND IT COLLAPSES ONE OF THE TWO OPEN RULINGS INTO THE OTHER, which is the reason to record it now rather than at implementation: TSUDOI CANNOT SEE WHAT A NOTIFICATION HANDLER RESOLVED TO WITHOUT AWAITING IT, so the warning FORCES the await question. And once tsudoi awaits, a REJECTION has the same destination the stray return value just got -- stderr, once per method per session. So `does tsudoi await a notification handler` is ONE decision serving both, with one mechanism, and the rejection ruling is no longer independent. WHAT STAYS OPEN IS THE ORDER of the built-in against the hook, which this does not touch.",
        "THE RUNTIME HALF DOES NOT WORK THE WAY IT WAS DRAWN, AND THE CORRECTION STRENGTHENS THE CONFIG-SIDE CONCLUSION RATHER THAN COSTING ANYTHING. Deciding request-versus-notification FROM THE JSON-RPC `id` AT RUN TIME is not available at tsudoi's layer: upstream has already dispatched by the time a handler is reached, and MEASURED, it hands `onRequest` only `(params, cancellation)` with no id anywhere. What upstream offers for arbitrary names is a REGISTRATION-TIME CHOICE -- `onRequest(method: string, …)` and `onNotification(method: string, …)`, both taking a bare string, so custom names ARE registrable -- and tsudoi must know which of the two to call BEFORE any message arrives. So the kind is not detected, it is DECLARED, which is the entry shape this item already carries.",
        "THE STAKEHOLDER HAS RULED THE CONTEXT SURFACE, `FOR NOW` IN THEIR WORDS AND SO CARRIED WITH ITS REVERSAL CONDITION: NEITHER BASE NAME IS PUBLISHED. `BaseMethodContext` stays unexported and the notification context IS that type, so `customMethodHandler` RESOLVES what a handler receives exactly as `MethodHandler` already does -- the discipline `RequestContext`'s docblock states as `nothing an author writes selects the shape they are handed`. The two rejected options are recorded because each will look obvious again: exporting an empty `BaseNotificationContext` as a name for authors to write, and exporting the supertype instead. REVERSAL CONDITION: an author who factors a custom handler out into its own FILE has no name to annotate the parameter with -- contextual typing covers the inline case and not that one -- so the day that is reported, the name to publish is the notification context and this ruling is what to revisit.",
        "AND THAT RULING FORCES THE ENTRY SHAPE, which is why it is not merely a naming decision: A CUSTOM METHOD NAME CARRIES NO KIND. `MethodHandler<M>` can derive a context because `M` comes from a table that already knows what each row is, while `textDocument/didFocus` tells tsudoi NOTHING about whether it is a request or a notification -- so resolution needs the kind as an INPUT, and each `customMethod` entry must DECLARE it rather than being a bare name-to-function map. WHICH LANDS ON THE DISCIPLINE THIS REPOSITORY ALREADY CHOSE ONE DOOR ALONG: `NotificationEntry.gate` is required with no default so that an entry deciding nothing does not type-check, and a custom entry declaring its kind -- plus its gate, where the kind is notification -- is that same argument applied to the config side. The two open rulings on ORDER and REJECTION are unaffected by this and remain open.",
        "AND `requestId` AS A REQUIRED MEMBER OF `BaseRequestContext` HAS NOW BEEN COSTED, the stakeholder having drawn it there once the phantom was dropped. APPLIED TO THE TREE AND REVERTED, two readings: (1) TSUDOI ITSELF CANNOT FILL IT -- `tsc --noEmit` stops at src/methods.ts inside `requestContext`, TS2741, because upstream hands that function `(params, cancellation)` and no id, so the field needs a NEW MECHANISM and not a line. (2) WITH THAT ERROR STUBBED SO THE DOWNSTREAM BECOMES VISIBLE -- and it is masked until then, the root tsconfig excluding `packages/` -- EVERY HAND-BUILT CONTEXT LITERAL IN EVERY HANDLER PACKAGE BREAKS, across four of them, which are precisely the sites Definition of Done check 5 compiles. THE FIELD IS NOT REFUSED, only priced: it is a published surface change with its own mechanism, and `string` is still narrower than the `number | string` upstream declares.",
        "AND THE PHANTOM-FIELD ROUTE OUT OF THAT FORK IS MEASURED AND REFUSED, all three readings against it. A `requestId: never` on the notification context, as the stakeholder drew it: (1) REQUIRED `never` MAKES THE TYPE UNINHABITABLE -- TS2741, `requestId` missing but required, so TSUDOI ITSELF CAN NEVER CONSTRUCT ONE, no value of type `never` existing to supply. (2) It names a field THE DESIGN NO LONGER HAS: `requestId` was withdrawn once measured that upstream hands a request handler `(params, cancellation)` and no id at all, so the guard forbids reading something no context carries. (3) THE OPTIONAL IDIOM IS CONSTRUCTIBLE AND STILL WORSE, which is the reading that inverts the intuition: `signal?: never` DOES restore discrimination in the original direction and DOES type-check, but it TRADES A COMPILE ERROR FOR SILENCE -- MEASURED, reading `context.signal` in a notification handler is TS2339 `Property 'signal' does not exist` with the field ABSENT, and NO ERROR AT ALL with `signal?: never` present, the read simply typing as `undefined`. So the phantom field makes the exact mistake it appears to prevent go from loud to silent, and the discrimination it would buy is already free by naming `BaseRequestContext` in the conditional instead.",
        "MEASURED: THE TYPE-LEVEL COLLISION GUARD WORKS, AND IT DOES NOT COST THE HOOK CASE -- which is the reading that looks contradictory and is not. `Partial<Record<ConfigMethod, never>> & Record<string, Handler>` refuses `textDocument/hover` (exit 1) and accepts both `textDocument/didFocus` AND `textDocument/didOpen` (exit 0). The reason the hook survives is that `ConfigMethod` IS THE REQUEST TABLE PLUS `initialize`, and the built-in NOTIFICATIONS are not in it at all. SO THE STAKEHOLDER'S TWO OPTIONS ARE NOT A CHOICE: the type can forbid the colliding names outright, and the config-time warning is only needed for whatever the type is decided not to cover. RESIDUE, AND IT IS AUTHOR-FACING: the refusal arrives as TS2322 `not assignable to type 'undefined'`, which names neither the collision nor the rule -- a legible refusal is a criterion this item owes.",
        "THE PREREQUISITE TIDY IS SMALL AND MEASURED NON-BREAKING, and it is what makes the two kinds expressible: extract the session half of `BaseRequestContext` into a NON-EXPORTED `BaseMethodContext { readonly tsudoi }`, leaving `BaseRequestContext extends` it with `signal` alone. MEASURED WITH IT IN THE TREE: full Definition of Done green -- 1208 pass / 0 fail, `tsc --noEmit` 0, oxfmt clean, workspaces silent. The hand-built context literals in both handler packages satisfy it UNCHANGED (inherited members count), and the `Identical<RequestContext, BaseRequestContext>` pin holds. Declaration emit was the one hazard worth probing, since each `prepack` emits `.d.ts`: exit 0, the non-exported supertype emitted into the file, NO TS4020. NOT EXPORTED, the stakeholder's ruling -- no author writes the name, so publishing it would widen tsudoi's surface for a supertype nobody spells.",
        "WHAT THE TIDY PAYS FOR TODAY, so it is not carried as speculation: `BaseRequestContext`'s docblock ASSERTS the line between session and message in prose, and the extraction makes that line STRUCTURAL -- above it the session, below it the message. So the paragraph goes rather than being superseded, which is the direction this project's comment convention asks for.",
        "THREE OPEN RULINGS, AND EACH IS A DECISION RATHER THAN A THING TO IMPLEMENT. (1) ORDER: a `didOpen` hook that runs BEFORE the store update reads `tsudoi.documents` without the document in it, and AFTER reads it with -- both defensible, silently different, and the author cannot tell which they got. (2) REJECTION: a notification has NO RESPONSE, which src/notifications.ts already states as the reason its gate drops messages silently -- so a rejecting hook has nowhere to report, and stderr, session death and a silent drop are three different products. (3) GATE: `NotificationEntry.gate` is REQUIRED WITH NO DEFAULT BY DESIGN, its docblock arguing that an entry deciding nothing must not type-check; a config author registering a custom notification supplies no gate, so defaulting one silently re-creates the convention that docblock refused.",
        "AN ARCHITECTURAL CONSTRAINT THIS ITEM MUST ROUTE THROUGH RATHER THAN AROUND, named because the edit that breaks it is the obvious one: only src/notifications.ts may create a connection or register a notification -- `RequestOnlyConnection` removes `onNotification` from the type every other module sees, and .oxlintrc.json bans the connection factory by import name everywhere else. A `customMethod` surface that registers its own notifications from a new module UNDOES that foreclosure, and the lint entry's own comment records what was measured before it existed: an ungated `onNotification` beside the table ran green on every check with nothing objecting.",
        "A SEAM TO SPLIT ON IF THIS PROVES TOO BIG, recorded so the split is not invented under pressure: the REAL custom method (`textDocument/didFocus` -- nothing built-in to order against, no capability advertised, tsudoi is the only handler) carries none of the three open rulings, while the HOOK beside a built-in carries all of them. The surface is shared; the semantics are not.",
        "AND REGISTERING A CUSTOM METHOD ADVERTISES NOTHING, which is the expectation to set before an author reports it as a bug: `initialize` has no capability to claim for `textDocument/didFocus`, so no client sends one unless it already knew to.",
      ],
    },
    {
      id: "PBI-99",
      story: {
        role: "config author",
        capability:
          "have a handler package's EXPORTED NAMES graded through the route I actually take, so a rename that misses one reaches me as `has no exported member` rather than passing every check here",
        benefit: "the names a member's README tells me to import are the names its tarball carries",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether the path package's probes are generalised over members or each member owes its own file is the item.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY WALKING THROUGH IT IN SPRINT 93 AND PRE-EXISTING TO IT. `test/published-artifacts.test.ts` names `completePath` and `resolvePathStat` as literal strings and type-checks them from a staged consumer -- and NO SUCH ARM EXISTS FOR THE OTHER THREE MEMBERS. Renaming `aroundCompletion` reddened nothing on the published route; what caught the in-repo callers was `tsc` and the workspace check, which read `src/` and not a tarball.",
        'AND THE README SNIPPET IS NOT THE MISSING ARM, which is the reading a later reader will reach for. The `ts snippets` row\'s SUBJECT is the SPECIFIERS -- its own comment says a block whose imports resolve and whose body is wrong is accounted for and unchecked -- so `import { neverExported } from "@atusy/tsudoi-completion-around"` satisfies it. The row is not weak; it is about a different question.',
        "AND ITS SECOND INSTANCE ARRIVED IN SPRINT 95, MEASURED THE SAME WAY: with `export { completeCorpus }` deleted from `packages/tsudoi-completion-document/src/index.ts` and everything rebuilt, the suite read 1173 pass / 0 fail. A NEW published handler was reachable by nothing this repository runs. That member now owns an arm reddening on the deletion, which grades its `src/index.ts` and NOT its tarball -- so this item keeps its whole subject, and now has a member whose in-repo half is covered to contrast with.",
        "WHAT MAKES THIS MORE THAN SYMMETRY: a member's README is the ONLY instruction a stranger gets, and the name in its snippet is the one thing in it that must match the artifact exactly. `packed-members` already reads the tarball -- it grades the FILE LIST and the README's tokens, never a single exported name.",
      ],
    },
    {
      id: "PBI-94",
      story: {
        role: "config author",
        capability:
          "have the PARAMS my handler is handed be graded by something, so a row whose params type widened is caught before it reaches my editor",
        benefit:
          "the surface tsudoi publishes keeps saying what it says today, rather than only what any assignable type would let it say",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether one probe covers the table or each row owes its own is the item.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY THE INDEPENDENT REVIEW STAGE IN SPRINT 87 AND PRE-EXISTING TO IT: `MethodMap[M][\"params\"]` is graded by nothing for ANY row. Every fixture handler in this repository either ignores its params or is contextually typed, so a params type that widened -- `CodeActionParams` to something it is assignable to, losing `range` and `context` in a stranger's editor -- reddens no arm. NOT INTRODUCED BY THE CODE-ACTION ROW, which is why it is an item rather than that sprint's repair.",
        "THE SHAPE ALREADY EXISTS TWICE: test/execute-command-types.test.ts and test/initialize-handler-types.test.ts stage a consumer-shaped probe and read the COMPILER's own errors. What is unsettled is whether one probe reading every row from the table beats one file per row, and this repository has a rule about that -- a check whose green certifies a class as watched is refused by name here, so a probe iterating the table must fail loudly when it reaches a row it cannot construct params for.",
      ],
    },
    {
      id: "PBI-93",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a REFUSED verdict as a statement about the arm it names, rather than as the registry having run out of seconds",
        benefit:
          "a record that has genuinely stopped discriminating is told apart from a machine that was busy, instead of both arriving as the same red on alternate runs",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether the answer is a larger budget, a budget derived from a measured baseline, or a REFUSED that distinguishes `timed out` from `wrote no report` is the item, and none of the three is obviously right.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND IN SPRINT 87 AND MEASURED AS PRE-EXISTING TO IT, TO THIS PROJECT'S OWN FILING BAR. Two runs of test/perturbations.test.ts with sprint 87's own record STASHED OUT, at c004410: one reported the three `dodArms` records REFUSED with `the arm file did not run to a report`, the next reported every record HELD. AND c004410 GRADES THE BASE a6e699e FOR THIS: test/perturbations.test.ts, test/definition-of-done.test.ts, scripts/definition-of-done.ts and the registry's own reader are BYTE-IDENTICAL between the two, `git diff` empty over all four.",
        "THE MECHANISM, WHICH IS WHY THIS IS NOT A FLAKE TO SHRUG AT: those records re-run test/definition-of-done.test.ts, MEASURED at 14.17s alone, against a 25s ceiling. That is not a wide margin, and the file spawns real check runs, so the margin closes whenever the machine is busy -- which is precisely when a whole-suite run is happening.",
        "WHAT MAKES IT WORSE THAN AN ORDINARY TIMEOUT IS THE VERDICT IT PRODUCES. A record that times out reads REFUSED, which is the same word this instrument uses for a record whose arm no longer exists -- a real staleness. So the one reading that should send a maintainer to repair a record is also the one a busy machine emits, and the two are told apart today by re-running and seeing whether it goes away.",
      ],
    },
    {
      id: "PBI-86",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a perturbation record as the WHOLE outcome of one weakening -- every arm it reddens, WHERE each red falls, and every arm whose GREEN is what makes those reds mean anything -- rather than as one privileged arm with a site and a list of names without one",
        benefit:
          "a record stops reporting success after the arm its discrimination rests on has been deleted, and a collateral red that moved to another assertion stops being invisible",
      },
      acceptance_criteria: [
        {
          criterion:
            "ONE RECORD PER WEAKENING, AND ITS REDS ARE A LIST OF (ARM, SITE). The `arm` / `alsoReddens` / `redAt` split goes: it privileges one arm with a site and leaves every other red carrying a name alone, which is why a collateral red landing at a DIFFERENT assertion is unnoticed today. THE SPLIT IS THE DEFECT AND NOT ITS SYMPTOM -- a weakening has one outcome, and the record's shape should be that outcome.",
          verification:
            "The type in test/helpers/perturbation.ts and every record rewritten to it. PROBE: a throwaway whose collateral arm reddens at an assertion the record did not name must read REFUSED. It is a state no record in this repository is in, so the witness is built rather than found -- the instrument's own convention.",
        },
        {
          criterion:
            "`staysGreen` NAMES THE ARMS A RECORD'S DISCRIMINATION RESTS ON, AND EACH MUST EXIST AND PASS. Absence cannot tell a control that stayed green from one that no longer exists, and today deleting the single-segment arm leaves two records reporting HELD with nothing left to discriminate.",
          verification:
            "PROBE, BOTH DIRECTIONS: the control present and passing reads HELD; the control deleted from the arm file reads REFUSED, naming it. Against today's instrument the second reads HELD, which is the measurement that says the criterion is worth meeting.",
        },
        {
          criterion:
            "EVERY RECORD THAT HOLDS TODAY HOLDS AFTER, BY NAME. This item changes the instrument and no product behaviour, so a record whose verdict moves is a migration defect -- and a record whose verdict moves to HELD from something else is the worse direction.",
          verification:
            "The full registry read before and after, arm by arm, and the two readings compared as a LIST rather than as a count.",
        },
        {
          criterion:
            "THE PROSE THE OLD SHAPE FORCED IS DELETED, NOT SUPERSEDED. `THE CONTROL IS THE ARM THIS RECORD DOES NOT NAME`, and every sentence explaining which absence means what, exist only because the shape could not say it. With the shape saying it, they are noise.",
          verification:
            "Read: no record explains a control by absence, and none carries a hand reading of where a collateral red fell -- that being a field now.",
        },
      ],
      status: "ready",
      notes: [
        "SPRINT 84's RETROSPECTIVE PROPOSED THE PATCH AND THE STAKEHOLDER REFUSED IT, WHICH IS WHY THIS ITEM IS THE SHAPE IT IS. The proposal was to add `staysGreen` beside the existing fields and leave the rest -- a field bolted onto a record whose asymmetry is the actual defect. The ruling was to pursue the shape rather than fit the existing comments.",
        "WHAT THIS DOES NOT CLOSE, so its green is not over-read: nothing decides whether an arm HAS a record. That detector is refused BY NAME in this project -- its failure mode is a green certifying a class as watched -- so the registry stays a list, and a weakening nobody wrote down is still measured by nothing. And a control that exists, passes, and grades nothing is a judgement no matcher makes, one level down from the same limit `redAt` already carries.",
        "THE MIGRATION IS THE COST AND IT IS NOT SMALL: nineteen records, each re-measured rather than transcribed, since the reds a record names are what the rewrite is for. A transcribed record is the one shape this change cannot leave behind.",
      ],
    },
    {
      id: "PBI-84",
      story: {
        role: "editor user",
        capability:
          "have a superseded completion stop reading the disk, rather than have the request that superseded it wait behind a directory scan nobody is going to see",
        benefit:
          "typing quickly through a large directory does not queue one full scan per keystroke, and a cancelled request stops holding the directory handle it opened",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- FOUND BY REVIEW, NOT YET REFINED. The observation is in note 1 and the criteria are not written; this may not be planned until the cost is measured on a real directory and the release strategy is ruled.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY AN INDEPENDENT REVIEWER AGAINST SPRINT 82'S INCREMENT AND PRE-EXISTING TO IT, which is why it is a backlog item rather than that sprint's repair. THE FIRST STATEMENT OF THIS WAS FALSE AND A REVIEWER TOOK IT AGAINST THE DIFF: it said the range touches ONE line of that function's file region, an import, which is what a grep for four control-flow words returned rather than what the diff says -- `itemsFrom`'s ITEM CONSTRUCTION changed on several lines, this sprint's whole subject. WHAT IS ACTUALLY UNCHANGED, AND IT IS THE PART THAT CARRIES THE CLAIM: the `opendir`, the iteration and the yield are byte-identical to base 2ed9d43, and on the input that exhibits this -- a fragment matching nothing -- the changed construction is never reached at all.",
        "AND SPRINT 91 RETRACTED THE SLOWNESS HALF OUTRIGHT: the suite ran 1146 tests in 190s, over MORE tests than either reading below, so `five times slower between two greens` was TRANSIENT LOAD and is withdrawn. THE 25s CEILING IS NOT WITHDRAWN -- it still refuses arms on a busy machine, which is what remains of this item.",
        "SPRINT 90 SHARPENED THIS AND PARTLY REFUTED IT. With the five-day orphan killed, this machine's load fell from 15.7 to about 2.0 and the registry came back with only its two long-standing refusals where it had been throwing three to eight -- SO PART OF WHAT WAS FILED HERE WAS PBI-96 ALL ALONG. What survives is worse than a budget, and is the measurement this item now carries: THE SUITE TAKES 1328s WHERE SPRINT 88'S CLOSE TOOK 270s, and neither the increment (the three files added since were timed at about 24s together) nor the orphan (alive during that 270s run too) explains it. Something made this suite five times slower between two green readings and nothing here knows what.",
        "THE MECHANISM, AND THE PART THAT MAKES IT MORE THAN A MISSING CHECK. `itemsFrom` never reads `context.signal`; cancellation closes the OUTER generator, and a generator's `return()` cannot take effect while an outstanding `next()` is still running. A batch is yielded only when it FILLS, so a fragment matching nothing in a huge directory reaches no yield point at all: the scan runs to EOF, holding the handle, after the client has already been answered -32800 through tsudoi's own race. The user sees a prompt cancellation and the process goes on working.",
        "WHY IT IS NOT A ONE-LINE FIX, WHICH IS WHY THIS IS A DRAFT RATHER THAN A TASK -- and it said `REFINED` in an item whose own criterion says it is not. Abandoning a half-read directory LEAKS ITS DESCRIPTOR ON ONE OF THE TWO RUNTIMES -- the resolve half already carries that finding at its own cancellation seam and declines to honour a late cancellation for it. So the release strategy is the item, not the signal read: a signal-aware drain that stops classifying and batching while still exhausting or explicitly closing the iterator.",
        "AND ONE CHEAP HALF THAT MAY BE WORTH SPLITTING OUT: `entryKind` stats every entry a listing reports as neither file nor directory, so a directory of symlinks costs one syscall per entry per keystroke. That is disclosed at the site and is a separate trade from cancellation, but the same scan is where it is paid.",
      ],
    },
  ],
  completed: [
    {
      number: 95,
      pbi_id: "PBI-100",
      goal: "`completeCorpus` offers the words of EVERY document the client has opened, so the name a project uses everywhere except the screen the cursor is on is reachable -- and the package is renamed `tsudoi-completion-document` for the source both its handlers read.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON A CLEAN TREE THE INSTRUMENT NAMED -- `tree: 8ef0080`, with only this file's own commit after it. Definition of Done PASSED, all five checks exit 0: 1175 pass / 0 fail over 85 files, 246.31s, the one long-standing non-gating `eslint(require-yield)` warning. THE DURATION IS THE FIFTH READING IN THE SERIES AND BREAKS THE RUN OF THREE AT ~190s -- it is recorded WITHOUT AN EXPLANATION, because none was measured: this session ran the full suite and several perturbation sweeps back to back on the same machine, which is a candidate and not a finding.",
        "THE PACKAGE IS NAMED FOR ITS SOURCE AND NOT FOR ONE WINDOW. `around` named it after the only handler it had, so a handler reading every open document would have had to live in a second package -- splitting one question, `which words are already written`, across two installs an author makes together for no reason either could give. The stakeholder ruled the shape: one package, two verbs.",
        "THE MEMO'S KEY IS THE VIEW OBJECT AND NOT THE URI, WHICH IS CORRECTNESS AND NOT SPEED. tsudoi's own `DocumentStore` says a reopened document numbers from whatever the client sent at `didOpen`, so `close`, a rewrite on disk, `didOpen` AT VERSION 1 AGAIN is an ordinary sequence -- and a memo keyed on uri plus version would then serve the OLD file's words for the rest of the session with nothing to notice it. The store builds one frozen view per open and mutates the buffer UNDER it on every `didChange`, so identity is exactly `the same buffer, still open`. The filters are in the key too: nothing about a document changes between two requests passing different `minLength`s.",
        "MEASURED, FIVE DEGENERATE IMPLEMENTATIONS EACH REFUSED BY THE ARM NAMED FOR IT, run before the arms were believed: keyed on uri plus version reddens the reopen arm; the filters left out of the key reddens the two filter arms; nothing stored reddens the scan-count arm; reading only the asked document, and skipping it, each redden the first arm. AND THE PATTERN'S COMPARISON IS PINNED FROM BOTH SIDES -- looser reddens the correctness arms, stricter reddens the rebuilt-pattern arm, which exists because options reach a handler through an arrow that builds a fresh `RegExp` on every keystroke.",
        "THE URI-KEYED PERTURBATION REDDENED SIX WHERE ONE WAS PREDICTED, and the mechanism was read rather than the prediction widened: the five extra were each an arm opening a document at a uri another arm had already used, so a module-level uri-keyed table leaks ACROSS TESTS where an identity-keyed one cannot. That is this design's own rationale demonstrating itself, and it is now written at the table.",
        "PBI-99 HAS ITS SECOND INSTANCE AND IT WAS FOUND THE SAME WAY AS THE FIRST -- by walking through the hole. With `export { completeCorpus }` deleted from the member's `src/index.ts` and everything rebuilt, the suite read 1173 pass / 0 fail: a handler its own README instructs a stranger to import, unreachable by that bare specifier, with every check green. The member now owns an arm that reddens on that deletion, and it grades THE DECISION rather than THE ARTIFACT -- deliberately narrower than PBI-99, which is still the item and still unrefined.",
        "WHAT THE STAKEHOLDER ASKED FOR AND IS NOT BUILT, said here because the sketch was concrete: a `didOpen`/`didChange` handler to index in, a `tsudoi.schedule`, and a `lazy` stream yielding what is indexed so far. THE FIRST TWO DO NOT EXIST TO BE USED -- notifications are not a config's to handle, and the session object's write ends are closed by construction rather than by discipline. THE THIRD CANNOT BE EXPRESSED: a partial answer needs `isIncomplete`, and the completion row cannot say it, so a client would take the partial list as final. The memo is what buys what the sketch was after without touching any of that.",
        "A CATEGORY GAINED ITS SECOND MEMBER AND THE PROSE WRITTEN FOR THE FIRST WENT FALSE, swept before the code landed rather than found at review: `words.ts` said `what the handler adds is the WINDOW` and `the word nearest the top of the window`, both using the first member's name to mean the category. The package-level paragraph living inside `around.ts` moved to `index.ts`, which is where the package's identity belongs now that one handler is not the package.",
        "AND THE `unreachableClaims` ARM CAUGHT A COMMENT THIS SPRINT WROTE, which is the class this repository files most and the first time it was caught by a check rather than a reader: the measurement above cited a repository path, comments ship in `dist/` twice, and a stranger reading the tarball cannot resolve it. The citation is gone and the reading stayed.",
        "TWO PROSE CONTRADICTIONS WERE AUTHORED BY THIS INCREMENT AND FOUND BY REVIEW, not by any check. The member README told a reader that yielding `completeAround` first puts its words at the top of their list, and told them four paragraphs later that their editor ranks the list and nothing here sorts; the true claim is narrower and is the order tsudoi SENDS. And `scanned when its version changes and not otherwise` was contradicted by its own next sentence about the filters and silent about reopening.",
        "THE STAKEHOLDER'S OWN EDITOR IS THE ONE CONSUMER AND THIS SPRINT MOVES MORE THAN A NAME UNDER IT -- sprint 93 filed that their dotfiles pin every `@atusy/tsudoi-*` specifier to raw GitHub URLs and that the pins and the config must move together. A RENAME MAKES THAT SHARPER: the import map KEY changes, the URL PATH changes and the commit changes, so a partial bump is a resolution failure rather than a missing export. Neither this repository nor any check in it can see that file.",
      ],
    },
    {
      number: 94,
      pbi_id: "PBI-98",
      goal: "The mark a completed item carries names the package that wrote it -- `data.tsudoiCompletionPath` -- so `data` stops being a slot two bare words were dropped into.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON A CLEAN TREE THE INSTRUMENT NAMED -- `tree: 9057eb0`, with only this file's own commit after it. Definition of Done PASSED, all five checks exit 0: 1157 pass / 0 fail over 83 files, 191.00s, the one long-standing non-gating `eslint(require-yield)` warning.",
        "`source` MOVED TOO, WHICH THE STAKEHOLDER DID NOT ASK FOR AND THE REASON THEY GAVE REQUIRES. They named `data.tsudoiCompletionPath.path`; `source` was sitting beside it, equally bare, and is the more ordinary word of the two -- so qualifying half of the mark would have left the collision the change is about. WHAT IT CANNOT COLLIDE WITH is another server's `data`, since a client hands each item back to the server that made it. WHAT IT CAN is this package's own future and a config author adding a field to an item we produced.",
        "THE COST WAS ARGUED AGAINST THE CHANGE AND IS NOW DISCLOSED AT THE TYPE: an item offered by the version before this one comes back at resolve with the old spelling, reads as UNMARKED, and is answered unchanged -- no size, no date, no listing. Bounded by the restart that changed the code, which is what makes it a disclosure rather than a defect.",
        'WRITING THE ARMS MEASURED THE GUARD DEAD, and it is the finding this sprint would not have had without them. Nesting looked like it owed a `typeof mark === "object" && mark !== null` between the two levels; DELETING IT CHANGED NO ANSWER -- `?.` yields `undefined` for a null, a number and a string alike, and what decides is the `typeof` each reader applies to the value IT wants. A guard that cannot change an answer reads as a live safety net to the next person, so it is gone and the measurement is at the site.',
        "AND THE FIRST DRAFT OF THOSE ARMS WAS WRONG IN A WAY WORTH KEEPING: a row asserting BOTH readers `undefined` for a mark whose `path` is a number reddened, because a broken `path` says nothing about a sound `source`. The two feed different fields -- the path decides whether the item is enriched at all, the source only how the block attributes it -- so a reader that discarded the whole mark on one bad member would drop a stat line it could have produced. That is now its own arm.",
        "THE READERS' TOLERANCE HAD BEEN GRADED BY NOTHING, which the round-trip arms cannot fix by construction: they drive a real client, so every item they resolve carries a mark THIS CODE WROTE. Nothing there ever hands back a `data` that is a number or a mark that is a string. The new arms are measured to discriminate -- reading the mark unqualified reddens three of them.",
      ],
    },
    {
      number: 93,
      pbi_id: "PBI-98",
      goal: "The two completion handlers are named for what they DO -- `completeAround` and `completePath` -- so an author reads a verb where they register a verb.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON A CLEAN TREE THE INSTRUMENT NAMED -- `tree: 3ca6034`, with only this file's own commit after it. Definition of Done PASSED, all five checks exit 0: 1149 pass / 0 fail over 83 files, 190.47s, the one long-standing non-gating `eslint(require-yield)` warning. FOURTH ~190s READING IN A ROW.",
        "THE OPTION BAGS FOLLOWED AND THAT WAS NOT A CHOICE MADE HERE: `AroundCompletionOptions` carries a comment saying it is NAMED FOR THE HANDLER IT BELONGS TO. Leaving the two types behind would have left that sentence false at the site that states the rule.",
        "AND ONE `pathCompletion` DELIBERATELY DID NOT MOVE -- `item.data.pathCompletion`, which shares the old name and is not it. IT IS A KEY ON THE WIRE: the client hands the item's `data` back at `completionItem/resolve`, so a server that renamed the mark and then resolved an item OFFERED BY THE VERSION BEFORE IT would read `undefined` and answer an item with no path. A rename is invisible to a client; this is not. THE STAKEHOLDER OVERTURNED THIS THE SAME DAY -- `item.data.tsudoiCompletionPath.path` -- and the cost stands as stated rather than being talked down: one popup, bounded by the restart that changed the code, against a name that was wrong for as long as it lived. It is now disclosed at the type instead of refused there.",
        "THE RENAME WALKED THROUGH A HOLE AND THAT IS THE FINDING WORTH MORE THAN THE RENAME -- PBI-99. `test/published-artifacts.test.ts` names the PATH package's exports as literal strings from a staged consumer; NO MEMBER BUT THAT ONE HAS SUCH AN ARM. Renaming `aroundCompletion` reddened NOTHING on the published route. What caught the callers was `tsc` and the workspace check, and both read `src/`.",
        "AND THE README SNIPPET DOES NOT COVER IT, checked rather than assumed: the `ts snippets` account's SUBJECT is the SPECIFIERS, and its own comment says a block whose imports resolve and whose body is wrong is accounted for and unchecked. It would have been satisfied by a name the package never exported.",
        "THE ONE CONSUMER OF THE OLD NAMES IS THE STAKEHOLDER'S OWN EDITOR, and it is safe by accident rather than by design: their dotfiles pin every `@atusy/tsudoi-*` specifier to raw GitHub URLs at 30effd8, so they still resolve `aroundCompletion` from the commit that had it. THE PINS AND THE CONFIG MUST MOVE TOGETHER -- bumping one without the other is what breaks their editor, and neither this repository nor any check in it can see that file.",
      ],
    },
    {
      number: 92,
      pbi_id: "PBI-98",
      goal: "`aroundCompletion` offers WORDS. The stakeholder's own popup was offering `NeovimのLSPで誰にどうして怒られたのかを確認するための設定` as one candidate, and the two Latin words inside it as none.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON A CLEAN TREE THE INSTRUMENT NAMED -- `tree: 39f1f9d`, with only this file's own commit after it. Definition of Done PASSED, all five checks exit 0: 1149 pass / 0 fail over 83 files, 191.45s, the one long-standing non-gating `eslint(require-yield)` warning. THE FIRST SPELLING OF THIS SENTENCE NAMED A TREE NOBODY GRADED and is corrected here rather than quietly: it cited 0a4d6fb `plus this file's own change`, where the run had actually printed `WORKING TREE DIRTY, so this reading names no commit` over five modified files NOT INCLUDING THIS ONE. A reading whose own instrument refuses to name a commit cannot be written down as one.",
        "AND THAT IS THE THIRD ~191s READING IN A ROW, which is what makes sprint 91's retraction of the slowdown hold rather than have been one lucky run.",
        "THE DEFECT WAS THE DEFAULT PATTERN AND IT WAS MINE, not the reference's: `[\\p{L}\\p{N}_]+` treats every letter as word-forming, and JAPANESE PUTS NO SPACES BETWEEN ITS WORDS -- so a run of prose matched as ONE candidate, and swallowed the Latin words abutting it on the way. The stakeholder ruled the scope: `分かち書きが必要な言語は諦めていいよ`.",
        "SO THE UNSEGMENTED SCRIPTS ARE SUBTRACTED FROM `\\p{L}` -- Han, Hiragana, Katakana, Thai, Lao, Khmer, Myanmar -- and NOT `CJK` as a block, which is the mistake this arm exists to refuse: KOREAN SPACES ITS WORDS and would have gone with them. What decides membership is segmentation, so Greek, Cyrillic, Hebrew, Arabic and the Indic scripts all stay.",
        "`scx` AND NOT `sc`, MEASURED, and the difference is visible in a popup rather than theoretical: U+30FC `ー` is Script=COMMON, so `\\p{sc=Katakana}` drops the カタカナ around it and LEAVES THE PROLONGED SOUND MARK BEHIND as a candidate of its own. Script_Extensions carries it.",
        "AND `\\p{M}` IS LOAD-BEARING RATHER THAN THOROUGHNESS, measured on the way: without it `हिन्दी` breaks into `शब`, `और`, `वन`, `गर` -- a combining mark is not `\\p{L}`, so every mark splits the run it sits in. Devanagari and pointed Hebrew are where that is the ordinary case.",
        "AND GIVING UP ON A LANGUAGE WAS GRADED BY NOTHING UNTIL A REVIEWER ASKED. The README says this member now offers NOTHING from an unsegmented language, which is a bound a stranger cannot get anywhere else -- and `readmeCoverage` reaches FENCED BLOCKS, never prose, so a green Definition of Done detects a MISSING token and never an UNGRADED PARAGRAPH. The member's fact-token row grew a sixth entry, measured to discriminate: rewording that one sentence reddens the arm.",
        "THE DEFAULT IS EXPORTED, WHICH IS THE ANSWER TO GIVING UP ON A LANGUAGE RATHER THAN AN EXTRA: an author who wants Han back builds a `RegExp` from `defaultWordPattern.source` with their own alternative appended. Refusing by default and permitting by a line beats guessing at a segmenter this package cannot carry.",
        "AND THE `v` FLAG WAS REFUSED, which would have written the subtraction as `[\\p{L}--[\\p{scx=Han}...]]` and read far better. It is too new to spend a runtime floor on for legibility; the double negation `[^\\P{L}\\p{scx=Han}...]` says the same thing under `u`, and the comment at the site is what carries the reading.",
      ],
    },
    {
      number: 91,
      pbi_id: "PBI-97",
      goal: "`packages/tsudoi-completion-around` offers the words already around the cursor, modelled on ddc-source-around and faithful to what its SOURCE does rather than to what its README says.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON THE TREE THAT CLOSES -- 30effd8, and the ONLY commit after it is the one carrying this sentence. Definition of Done PASSED, all five checks exit 0: 1146 pass / 0 fail over 83 files, 190.11s, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts.",
        "AND 190s IS THE READING THAT PARTLY RETRACTS SPRINT 90'S. That sprint recorded the suite at 1328s against sprint 88's 270s and filed `something made this suite five times slower between two greens` into PBI-93. It is now 190s over MORE tests than either -- so the slowdown was TRANSIENT LOAD and not structural, and the sentence in PBI-93 is corrected there rather than left to be read as current. What is NOT retracted is the 25s ceiling itself, which still refuses arms on a busy machine.",
        "THE STAKEHOLDER RULED THE SHAPE MID-SPRINT AND THE FIRST SPELLING WAS REFUSED. It was `completionAround(options)` returning a handler; the sibling package has `pathCompletion(context, params, options)`. Neither the NAME nor the SHAPE agreed, and an author who installs both would be called two different ways for no reason either could give -- the options argument doing exactly what the closure did. IT IS NOW `aroundCompletion(context, params, options = {})`, and BOTH consumer spellings were type-checked from a throwaway that reaches the packages BY BARE SPECIFIER, which is the route a stranger takes and the one an in-repo import cannot stand for.",
        "AND MATCHING THE SIBLING CAUGHT A DEFECT THE RENAME WAS NOT ABOUT: it splits lines on `\\r?\\n` where this split on `\\n`. A CRLF document otherwise leaves a carriage return at the end of every line -- unmatched by the word pattern, and counted toward the 200-column bound, so a long line in a CRLF file was skipped one character early.",
        "THE COMPLETENESS RULING WAS OWED AND NOT WRITTEN, AND AN ARM THAT ALREADY EXISTED ASKED FOR IT. This repository requires every completion handler to state whether its candidate set is FINAL, because the specification reads a supplied `CompletionItem[]` as `do not re-query, filter what you were given` whether or not anyone chose that. THIS ONE IS COMPLETE AND THE REASON IS STRUCTURAL RATHER THAN A PREFERENCE: the handler never looks at what was typed, so a narrower prefix cannot produce a candidate the answer did not already carry. WHAT WOULD OVERTURN IT IS AN EDIT AND NOT A KEYSTROKE -- typing changes the buffer's words, and `didChange` plus a fresh request is how every source is refreshed.",
        "AND `around.ts` JOINED THE NAMES-WITHOUT-SERVING LIST, which was a list of ONE and whose comment said so. It holds the word scanner and names the method only to say which handler calls it, so a ruling there would be a sentence about a return value that does not exist in that file. The comment now says why its two members are prose FOR DIFFERENT REASONS -- the fixture's subject is the ABSENCE of a handler, this one's is a scanner one file along -- so neither stands for the other.",
        "WHAT A FIFTH MEMBER FIRED, AND IT IS THE SAME LIST SPRINT 88 ENUMERATED PLUS ONE NOBODY HAD MET: the build order, both per-member tables, `readmeCoverage`, the root `devDependencies` and the root README's package table. THE NEW ONE IS THE COMPLETENESS ENUMERATION, which is not about MEMBERSHIP at all -- it scans every handler directory for the method's NAME, so a package is caught by what its prose says rather than by being a package.",
        "AND A ROOT README SENTENCE HAD BEEN STALE SINCE SPRINT 88, found by this member rather than by the sweep that should have caught it: it enumerated the handler packages BY PATH and named two of what were already four. Rewritten to name one as an example and point at the table, which is the shape that does not stale with the next member.",
        "THE REFERENCE'S README AND ITS CODE DISAGREE, AND THE CODE WINS. `maxSize` is documented as 500 and defaults to 200 in `params()`. Taking the README's number would make this package's own default a claim nobody could check against the thing it was modelled on.",
        "IT DEPENDS ON NOTHING -- not a package, not a `node:` builtin. That is what sprint 88 measured the cost of: bun placed the efm adapter's own `yaml` in the member rather than hoisting, and this repository's staging arms borrow node_modules ENTRY BY ENTRY FROM THE ROOT, so a member's own runtime dependency living only under packages/ fails every staged build. A member with no dependency pays none of that.",
      ],
    },
    {
      number: 90,
      pbi_id: "PBI-96",
      goal: "A tsudoi server whose editor is gone EXITS -- by watching the `processId` the editor named, and by reading the end of stdin as the end of the session -- so a crash leaves no process behind and no core spinning.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON THE TREE THAT CLOSES -- 0cab02d, and the ONLY commit after it is the one carrying this sentence. Definition of Done FAILED and is recorded as failed: 1105 pass / 6 fail over 81 files in 1328.22s, with `Lint`, `Format check`, `Type check` and the workspace check all exit 0. EVERY ONE OF THE SIX IS A TIMEOUT -- four at the 25s ceiling, one at 34s, one at 55s -- and a DIFFERENT six than the previous run's five. THE EXIT-CODE REGRESSION IS GONE from that list, which is the half that says this run graded the repair.",
        "AND THE SUITE IS FIVE TIMES SLOWER THAN AT SPRINT 88'S CLOSE -- 1328s against 270s -- WHICH THIS SPRINT'S OWN WORK DOES NOT EXPLAIN, measured rather than assumed: the three files added across sprints 89 and 90 were timed individually and total about 24 SECONDS, most of it the deliberate waits in test/orphaned-server.test.ts. NOR IS IT THE ZOMBIE, which was alive during sprint 88's 270s run too. So the cause is neither the increment nor the defect this sprint fixed, and PBI-93 now has a measurement it did not have: the suite got slow between two greens and nobody knows why.",
        "THE FIX IS VERIFIED AGAINST THE ZOMBIE'S OWN SHAPE AND NOT ONLY AGAINST AN ARM, which matters because the arm and the reproduction were written from one idea and could have shared a mistake: a probe spawns a real parent, spawns a server naming it in `processId`, kills the parent with SIGKILL, and DELIBERATELY HOLDS THE PIPE OPEN so stdin never reaches EOF. Before, the server stays. After: `tsudoi: exiting because its editor's process is gone`, and it leaves.",
        "THE EXIT CODE WAS WRONG FIRST AND AN ARM THAT ALREADY EXISTED CAUGHT IT, which is the finding worth more than the fix. `endSession` reused `lifecycle.exitCode()`, reasoning that a session nobody ended is the ungraceful case that rule is about. IT IS NOT: that function grades the `exit` NOTIFICATION -- whether a client that ASKED to exit had shut down first -- and a client that vanished never sent `exit` at all. Borrowing it reported the CLIENT'S ABSENCE AS TSUDOI'S FAILURE. test/editor-death.test.ts states the contract in its own name, `stdin reaching EOF ends the session at code 0`, and reddened on both runtimes in 40ms.",
        "AND THE WEAKENING IS MEASURED BUT NOT REGISTERED, a departure from this project's rule recorded rather than slipped past. `watchEditor(null, ...)` -- the state tsudoi shipped in for its whole life -- reddens the parent-dies arm on BOTH runtimes and leaves the other four green. IT IS NOT IN THE REGISTRY BECAUSE THE REGISTRY CANNOT AFFORD IT: an arm file is re-run TWICE inside a 25s budget, and a WEAKENED run spends the whole `waitForExit` bound on each runtime BY CONSTRUCTION, the server it waits for never leaving. Registering it would put a timing arm into the instrument this project has already filed as timing out under load. WHAT THAT COSTS is written at the arm file: if these arms stop discriminating, nothing will say so.",
        "THE LOAD READING THAT REFRAMES PBI-93: with the orphan killed this machine's load average fell from 15.7 to about 2.0, and the perturbation registry -- which had been refusing three records at the 25s ceiling -- came back with only the two it has always had. SO PART OF WHAT WAS FILED AS A BUDGET WAS THIS DEFECT ALL ALONG, AND PART WAS NOT. The two survivors are still PBI-93's.",
        "THE ZOMBIE WAS REAL AND IS GONE: pid 26678, orphaned at PPID 1, state R, 99.4% CPU, FIVE DAYS, killed by SIGTERM on 2026-08-11, after which this machine's tsudoi servers went from 106% CPU to 0.9%. NINETEEN OTHERS SURVIVED AND WERE LEFT ALONE, measured rather than assumed: every one is a live child of the stakeholder's own `kakehashi` multiplexer, so `kill them` meant the ORPHAN and not the population.",
        "THE ORDINARY DEATH ALREADY WORKS, MEASURED BEFORE ANYTHING CHANGED, which is what makes this sprint about the OTHER cases rather than the obvious one: a server spawned over pipes whose parent exits without a `shutdown` is gone within seconds -- stdin reaches EOF, the reader's handle goes, the loop empties. The leak is NOT `tsudoi ignores its editor dying`.",
        "TWO NETS FOR THE TWO WAYS THAT MECHANISM FAILS, AND NEITHER IS THE OTHER'S DUPLICATE. ONE, THE `processId` WATCHDOG: LSP says a server SHOULD exit once the parent it was told about is no longer alive, and tsudoi reads `processId` NOWHERE today -- so a server whose stdin never reaches EOF, because some surviving process still holds the write end, waits for ever. That is the shape a multiplexer produces and the likeliest origin of a five-day orphan. TWO, THE END OF STDIN: the exit today depends on the event loop EMPTYING, so ONE un-`unref`ed handle anywhere -- including inside a config author's own handler, which src/server.ts records as checked by nothing -- strands the process even after EOF.",
        "THE WATCHDOG'S OWN TIMER IS `unref`ed, which is not a detail but the exact hazard already written down here: src/notifications.ts records that the FRAMEWORK's own `watchDog.initialize` starts an UN-`unref`ed three-second interval on a numeric `processId`. The reference implementation of this feature is itself an instance of the bug being fixed, and a watchdog that keeps the process alive is the thing it exists to prevent.",
      ],
    },
    {
      number: 89,
      pbi_id: "PBI-95",
      goal: "`context.tsudoi.notify(method, params)` sends a notification to the client, so a config author can say `window/showMessage` -- or anything else the protocol lets a server initiate -- from inside a handler.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON THE TREE THAT CLOSES -- 7bf4871. Definition of Done FAILED, and it is recorded as failed rather than smoothed: 1101 pass / 4 fail over 80 files in 1397s, with `Lint`, `Format check`, `Type check` and the workspace check all exit 0. EVERY ONE OF THE FOUR IS A TIMEOUT AT THE 25s CEILING and a DIFFERENT four each run -- PBI-93 -- over a suite that took 270s at sprint 88's close. WHAT WAS VERIFIED DIRECTLY INSTEAD: the notify arms 4/4, the type arms 5/5, the whole perturbation registry HELD.",
        "AND THE REASON THAT RUN TOOK FIVE TIMES AS LONG TURNED OUT TO BE A DEFECT RATHER THAN A BUDGET, which is PBI-96 and was found by `ps` rather than by any check: a tsudoi server orphaned at PPID 1 had been at 99.4% CPU FOR FIVE DAYS. Attributing the four reds to PBI-93 alone was incomplete, and this entry is where that is corrected.",
        "ADDING A MEMBER TO `Tsudoi` BREAKS EVERY HAND-BUILT LITERAL, and the FIFTH check is the only thing that says so -- `tsc --noEmit` excludes `packages/`. Four sites in the two handler packages and the adapter each take a stub that REJECTS rather than resolves, so a package cannot start notifying by accident.",
        "AND `oxlint` LEFT THE MACHINE MID-SPRINT, which cost a 31-minute run and 66 phantom failures before the tell was found -- `exec: oxlint: not found`, buried in one staged arm's expected-versus-received dump. The lint check's own colour does not report it, because the staged Definition-of-Done arms WRAP the binary. It is the same impediment sprint 87 filed for `oxfmt` and now names both.",
        "THIS OPENS A WRITE END ON `Tsudoi`, WHICH THAT TYPE'S OWN RUNTIME COMMENT SAYS IS DELIBERATELY CLOSED -- so the refusal is NARROWED rather than overturned. What `TsudoiRuntime` refuses to expose is the STORE, the FOLDER MIRROR and the HANDSHAKE: the writers of state tsudoi MIRRORS FROM THE CLIENT, where a second writer would make the mirror disagree with the thing it mirrors. A notification writes none of that. It is tsudoi SPEAKING to the client rather than rewriting what the client said, so the reason those three are closed says nothing about this one, and the comment is amended to say which it was about.",
        "THE METHOD IS A STRING AND THE PARAMS ARE `unknown`, WHICH IS THE `deps/` RULING APPLIED RATHER THAN A GAP. tsudoi could enumerate the server-initiated notifications and type each one's params -- and that would be tsudoi publishing a second name for a shape upstream owns, which the `deps/` split exists to prevent. An author who wants the protocol's own type imports it from `@atusy/tsudoi-language-server/deps/protocol` and annotates their own value. WHAT IT COSTS THEM is that a misspelled method name is not a compile error, and that is stated at the site.",
        "THE LIFECYCLE IS THE PROTOCOL'S AND TSUDOI APPLIES NONE OF IT. LSP forbids a server sending most notifications before it has answered `initialize`, with `window/showMessage`, `window/logMessage` and `telemetry/event` named as the exceptions -- so a rule enforced here would have to know that list, would go stale with the specification, and would refuse the one call an author most wants during a handshake. What tsudoi owes instead is that the failure is VISIBLE: a send on a connection that is gone rejects, and the rejection is the author's to see.",
      ],
    },
    {
      number: 88,
      pbi_id: "PBI-90",
      goal: "`loadEfmConfig()` finds the efm-langserver `config.yaml` already on this machine, reads it, and hands back the tsudoi handlers it describes -- so an efm user's own linters and formatters run under tsudoi with not one tool definition restated.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON THE TREE THAT CLOSES -- 3b383b1, and the ONLY commit after it is the one carrying this sentence. Definition of Done PASSED, all five checks exit 0: 1096 pass / 0 fail over 78 files, 3406 expect() calls, 296.51s, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. The base was sprint 87's close at 1049 / 3310 over 75 files.",
        "THE DEFECT THAT MATTERED WAS FOUND BY DRIVING A REAL SERVER AND BY NOTHING ELSE, which is the reading to carry out of this sprint. efm's schema documents `lint-stdin` DEFAULTING TO TRUE -- unlike `format-stdin`, which documents no default -- and this adapter read absence as false. A tool whose `lint-command` reads stdin and whose config omits the key was handed NOTHING, exited clean, and the editor showed a file with no problems. NO ARM HERE COULD HAVE NOTICED: a linter that found nothing and a linter never given the document are the same picture, and every arm written before it drove commands that ignore their input. The arm that holds it now drives a command reading ONLY stdin, so neither reading passes for the other.",
        "WHAT A FOURTH MEMBER FIRED, MEASURED AGAINST PBI-90'S OWN PREDICTION. Predicted and red: the build order, where the new member sorts between the framework and the two handlers by PATH -- a tie-break rather than a dependency; both per-member tables in test/packed-members.test.ts; and `readmeCoverage`, which the new README joined only when it was TRACKED and not when it was written. NOT PREDICTED: the two STAGING arms, and that is the finding. bun placed `yaml` in the member that declares it rather than hoisting, and test/unbuilt-checkout.test.ts and test/own-subpaths.test.ts borrow node_modules ENTRY BY ENTRY FROM THE ROOT -- so a member's own runtime dependency living only under packages/ makes every staged build fail TS2307 on it. Declared at the root with that reason, which is a fact about this repository's apparatus rather than about the package.",
        "`handlerMembers` TOOK THE NEW MEMBER SILENTLY AND EVERY SITE WAS RIGHT TO, which PBI-90's notes had flagged as needing a per-site ruling. Its `src/` holds handlers, it declares tsudoi as an optional peer, it ships a README a stranger acts on, and it is installable beside tsudoi -- so all four sites apply. THE PREDICTED MISMATCH DID NOT MATTER: those sites ask about the PACKAGE, not about where its handlers come from, so a package building them at run time from YAML is no exception.",
        "WHAT THIS INCREMENT DOES NOT DO, listed rather than left to be discovered: multi-line errorformats, refused BY NAME at load; `symbol-command`, which is a method tsudoi does not serve; efm's scheduling keys, which describe a PUSH model tsudoi has no equivalent of; and range formatting. Each is in the package's README, which is the document a stranger reads.",
        'THE YAML READER IS `yaml` AT `merge: true`, AND THE FLAG IS THE WHOLE RULING RATHER THAN A SETTING. MEASURED at yaml 2.9.0: with the default options, efm\'s own documented example parses a tool definition into `{ "<<": { ... } }` -- the merge key ARRIVES AS A LITERAL KEY and none of the merged tool\'s own keys are present. That is the silent mis-read PBI-90\'s notes predicted for a hand-rolled subset, and the library does it too unless told not to. A config using anchors would produce handlers for nothing, with no error anywhere. `merge: true` and `version: "1.1"` both fix it; the flag is chosen because it says what it does.',
        "efm's `languages` ARE KEYED BY VIM FILETYPE AND TSUDOI HANDS A CLIENT'S `languageId`, AND NO TRANSLATION TABLE IS INVENTED. The key is matched against `languageId` as the client sent it, plus efm's `=` any-language key, and where they disagree the author's own config is where it is repaired -- a table tsudoi wrote would be tsudoi deciding what an editor meant. The README is the authority on it.",
      ],
    },
    {
      number: 87,
      pbi_id: "PBI-89",
      goal: "`textDocument/codeAction` becomes a NEW ROW of the request table `textDocument/hover` and the rest are rows of -- and the FIRST row whose drive is a choice rather than one the protocol already made, so what ships is a RULING WITH ITS REASON AT THE SITE as much as it is a method.",
      status: "done",
      subtasks: [
        {
          test: "A NEW test/code-action.test.ts, THREE ARMS ON BOTH RUNTIMES, and the second is what the sprint is graded through. ONE: a fixture config declaring the handler, driven through a real server, and the answer read back WHOLE -- carrying BOTH a `CodeAction` and a `Command`, since the result type is a UNION and an arm reading one member cannot tell tsudoi passing an author's answer through from tsudoi rebuilding it. TWO: the capability read WHOLE off the handshake, `toEqual({ textDocumentSync, workspace, codeActionProvider: true })` -- WHOLE and not `toBeTruthy`, which is the property subtask 2's record needs and which nothing else in this file would give it. THREE: the ABSENCE half against a config declaring no codeAction handler; it adds no discrimination its neighbours lack, and is kept for WHERE IT IS READ, the criterion asking for both directions -- the same reasoning test/execute-command.test.ts already writes at its own absence arm.",
          implementation:
            '`MethodMap["textDocument/codeAction"]` in packages/tsudoi-language-server/src/types.ts carrying the drive ruling; `requestEntries["textDocument/codeAction"]` in src/methods.ts with `CodeActionRequest.type` and a contributor writing `codeActionProvider = true`; a fixture; and test/fixtures/all-methods.ts, which FORCES ITSELF -- a method in `MethodMap` and not in that literal is TS2741 naming it. `paramsForAnyMethod` gains the `range` and `context` `CodeActionParams` requires, AND THAT ADDITION IS GRADED BY NOTHING, on that function\'s own docblock: nothing on the wire validates a member it holds, MEASURED there by deleting `command` and finding the file green.',
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "c004410",
              message:
                "feat(methods): code actions reach a config author, and the drive is a decision",
              phase: "green",
            },
            {
              hash: "97d73dd",
              message:
                "feat(methods)!: the stakeholder overturned the drive, so partial results stay reachable",
              phase: "green",
            },
          ],
          notes: [
            "THE RED, MEASURED AND NOT PREDICTED. With all four arms written and `src/` untouched: 2 pass / 6 fail. THE TWO GREEN WERE THE ABSENCE ARMS, which is what makes them controls rather than duplicates -- they assert the capability is NOT advertised, and that was already true. The six red are three per runtime: the answer arm and the null arm both at `-32601 Unhandled method textDocument/codeAction`, and the capability arm at its whole-object equality, one key short.",
            "THE STAKEHOLDER OVERTURNED THE DRIVE MID-SUBTASK, WHICH IS WHY THIS ONE CARRIES TWO GREEN COMMITS. The first landed awaited-once with the argument at the site; the second replaced it with the generator. NOTHING A CLIENT RECEIVES MOVED BETWEEN THEM for a request carrying no `partialResultToken` -- which is a claim, so the subtask grew an arm per runtime rather than asserting it: the same handler driven WITH a token, the batch read off the wire as `$/progress` and the response `null`. THAT ARM SHOWS THE DELIVERY CHANGING AND THE CONTENT NOT, which is the precise reading and not `a client sees no difference`: under a token the actions arrive as a notification and the response is `null`, where the awaited drive would have put them in the response.",
            "AND THE ARM NAMES GAINED THEIR RUNTIME, WHICH THE PLAN DID NOT ASK FOR AND SUBTASK 2 COULD NOT DO WITHOUT. MEASURED at bun 1.3.13: a `<testcase>` carries the `describe` in `classname` and ONLY the `test()` string in `name`, and the registry's reader keys a run BY `name` -- so two arms differing only by their describe collapse to one result, last write winning, and a record on one of them would have graded whichever bun wrote last. EVERY SIBLING FILE IN THIS SHAPE HAS THE SAME COLLAPSE and is graded by no record, which is why it is closed here and not everywhere.",
          ],
        },
        {
          test: "ONE RECORD IN test/perturbations.test.ts, MEASURED against the landed source and not predicted: `codeActionProvider` written as `{ codeActionKinds: [] }` instead of `true`, which must redden the PRESENCE arm at its whole-object equality and leave the ABSENCE arm green. That is criterion 2's discriminator and this row's alone -- `claims no kinds` is the half the contrast with `executeCommandProvider.commands` rests on.",
          implementation:
            "The record only. AND THE SECOND RECORD A READER WILL EXPECT IS REFUSED WITH ITS REASON, rather than shipped to make a pair: emptying this row's contributor reddens the SAME arm at the SAME assertion, and what it would grade is the presence check in `contributeCapabilities`, which is one loop over every other row and which every other row's own arm already holds. A record naming this row for it would report a property of the loop under this row's name.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "391e17c",
              message: "test(perturbations): the options object that reads like a spelling of true",
              phase: "green",
            },
          ],
          notes: [
            "MEASURED BY HAND FIRST, THE FILE RESTORED FROM A COPY AFTER: the weakening reddens 2 arms, and they are the PRESENCE arm on each runtime, at `expect(result.capabilities).toEqual({`, receiving `codeActionKinds: []`. The answer arm, the null arm and both absence arms stayed GREEN, so `alsoReddens` is the deno twin and nothing else. AND THE READING WAS TAKEN ON EIGHT ARMS WHERE THE COMMITTED FILE HAS TEN, which a reviewer caught: the fifth arm -- the one under a `partialResultToken` -- landed between the measurement and the commit this subtask names, so the two progress arms are in neither the count nor the green enumeration. What carries them is the REGISTRY, which grades an unrecorded red as `disarmed`, and not this note.",
            "THE FIRST ATTEMPT WAS REFUSED BY A GUARD READING THIS SPRINT'S OWN PROSE, WHICH IS THE FINDING WORTH CARRYING. The registry refuses a record whose arm file `re-runs perturbations itself` -- it would spawn without bound -- and that refusal is a SUBSTRING TEST over the arm file's whole text. The arm file imports nothing of the sort; a COMMENT in it named the helper's path, and the record was refused. Reworded, and the trap is written down at the site. THE OVER-REFUSAL IS THE SAFE DIRECTION and is not repaired here.",
            "AND THE THREE `dodArms` RECORDS ARE INTERMITTENT, MEASURED AS NOT THIS SPRINT'S. Two runs of the registry with this record present: one reported those three REFUSED with `the arm file did not run to a report`, the next reported every record HELD. THE SAME TWO RUNS WITH THIS RECORD STASHED OUT gave the same two results at c004410, so the arm file this record adds is not the cause. AND c004410 GRADES THE BASE FOR THIS, WHICH IS WHAT MAKES IT PRE-EXISTING RATHER THAN MERELY OLDER: the four files the reading depends on -- test/perturbations.test.ts, test/definition-of-done.test.ts, scripts/definition-of-done.ts and the registry's own reader -- are BYTE-IDENTICAL between a6e699e and c004410, `git diff` empty over all four. THE MECHANISM IS A BUDGET: those records re-run a file measured at 14.17s alone against a 25s ceiling, and nothing in this sprint touched either number. Filed as PBI-93 rather than repaired.",
          ],
        },
        {
          test: "THE SWEEP, WHICH IS THE WHOLE OF THIS SUBTASK'S GRADING. `readmeCoverage` is untouched BY CONSTRUCTION and that is a ruling rather than an omission: the section carries NO FENCED BLOCK, following `Commands your editor can invoke`, which is prose-only for the reason that applies here too -- this row's handler shape is `textDocument/formatting`'s, already shown in the Quickstart block, so a block would need a marker AND a `consumers` row naming a SUBJECT and would buy a reader nothing they read forty lines up. Then a CASE-INSENSITIVE sweep for the arity words over README.md, packages/, examples/ and scrum.ts, every hit re-sited, deleted, or left green WITH the reason it still reads something.",
          implementation:
            "The README section, placed beside `Commands your editor can invoke` because for a user the two are ONE workflow -- an action offers a command and a command runs it. LAST, because it describes what landed rather than what was intended.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "76e2bed",
              message: "docs: the actions section says what the capability declines to claim",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE SWEEP FOUND ONE SENTENCE GOING FALSE AND THE REVIEW ROUND FOUND THREE MORE, WHICH IS THE READING TO CARRY ABOUT THE SWEEP RATHER THAN ABOUT THE SENTENCES. What it found: the metric's annotation naming `workspace/executeCommand` as the whole of what tsudoi serves beyond the five. WHAT IT MISSED, ALL OF IT INSIDE ITS OWN DECLARED SCOPE: `types.ts`'s ``Promise`, LIKE EVERY ROW OF THE TABLE``, false since completion and now doubly so; `methods-table.test.ts`'s guard claim passing `for textDocument/completion and reddening for every other row`, short one row; and `perturbations.test.ts`'s categorical `no record below spawns a server`, which this sprint's own record contradicts. THE SWEEP WAS OVER ARITY WORDS -- `five`, `six`, `seven` -- and not one of the three contains one. A SWEEP FINDS THE SENTENCES THAT COUNT; the ones that ENUMERATE without counting are found by reading. EVERY OTHER HIT WAS DISPOSITIONED AND LEFT: the README's `seven members` is `DocumentView`'s and its `five members` is `Tsudoi`'s, `notifications.ts` numbers a list, and every arity in a COMPLETED sprint's record is a quotation of what was true then.",
            "AND THE README REPAIR BROKE A FACT BY REWRAPPING IT, WHICH NO REVIEW WOULD HAVE SEEN. test/readme.test.ts requires `closes the generator` in the cleanup section, and the rewrap put a newline between `the` and `generator` -- so the token stopped matching while every word survived. Two arms red, repaired by moving the line break. A DOCUMENTATION EDIT THAT CHANGES NO WORD CAN STILL BREAK A TOKEN.",
          ],
        },
      ],
      impediments: [
        {
          description:
            "`oxfmt` IS NAMED BY THE DEFINITION OF DONE AND INSTALLED BY NOTHING IN THIS CHECKOUT. MEASURED at f34a76b: the third check came back UNRUNNABLE -- `Executable not found in $PATH` -- while the other four ran, so the run reported FAILED for a reason that was the ENVIRONMENT. It is not in the root `devDependencies` and not in node_modules/.bin, unlike `tsc`, which `bun run` puts on PATH from there. Installed globally at 0.62.0 to take this sprint's base, and THE VERSION WAS CHOSEN BY NOTHING.",
          impact:
            "None on this Sprint Goal -- the base at a6e699e is green under 0.62.0, all five checks. What it costs is that this project's whole-tree formatting is graded by whatever version whoever ran it last happened to have, and a default that moved between versions would reformat files a sprint never touched.",
          request:
            "Decide whether `oxfmt` is pinned in the root `devDependencies` -- and at which version -- or whether it stays an environment assumption a fresh checkout discovers as an UNRUNNABLE check.",
          status: "waiting_human",
          notes: [],
        },
      ],
      decisions: [
        "THE BASE, MEASURED BEFORE ANYTHING MOVED: HEAD a6e699e, Definition of Done PASSED, all five checks exit 0, 1029 pass / 0 fail over 74 files, 3264 expect() calls, 407.71s, TWENTY registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. Any red from here is this sprint's until measured otherwise against that.",
        "AND THAT BASE IS THE FIRST IN THIS PROJECT'S RECORD WHERE ALL FIVE CHECKS ACTUALLY RAN, which is why the impediment above is filed rather than mentioned: the format check had been UNRUNNABLE in this environment, and an UNRUNNABLE check reports non-green while measuring nothing.",
        "ONE ARM FAILED ONCE AND IS NOT CALLED A FLAKE, WITH THE EVIDENCE RATHER THAN THE WORD. At f34a76b, whole suite, `test/protocol.test.ts > a fallback for unknown methods shadows none of initialize, hover or shutdown` timed out at its 4000ms `hangTimeoutMs` in a run that took 464s. Re-run ALONE: 32 pass / 0 fail in 7.94s -- which is the WEAKER reading, a single file not reproducing whole-suite load. Re-run as the WHOLE SUITE at a6e699e: green. So what is recorded is what was seen -- named, failed once under load, did not reproduce in the same conditions -- and NOT `flake`, which would be a claim about a cause nothing here measured.",
        "THE STAKEHOLDER OVERTURNED THE DRIVE IN FLIGHT, AND THIS IS WHERE THAT LANDS. Their words: `codeAction result should be async generator like completion so that we can support partial result in the future`. The row is STREAM-DRIVEN. THE ARGUMENT BELOW IS KEPT RATHER THAN DELETED because it is still true and is still the reason an author should usually yield once -- but it argues about WHAT A SERVER SHOULD SEND, and the type decides only what it CAN, which is the distinction the sprint's own ruling missed. THE HALF THAT DECIDES IT: the two spellings are NOT symmetric in what they foreclose. Both are equally breaking to swap in every config declaring the key, so a wrong choice costs the same either way -- and only one of them can ever grow partial results without being swapped. THE SPRINT'S OWN PARAGRAPH HAD SAID `NEITHER IS THE SAFE DEFAULT` AND STOPPED THERE, having weighed reversibility and never asked which shape has a future the other has not.",
        "AND THE VETO COST ONE ARM RATHER THAN A SUBTASK, which is the reading that says the plan was sound even though its ruling was not. Everything the arms assert about the ROW -- fidelity, the capability, both directions, the null answer -- was untouched by the drive. What had to be ADDED is the arm showing what the drive DOES change: the same handler under a `partialResultToken`, the batch arriving as `$/progress` and the response `null` where the awaited drive would have put the actions in the response. THE CONTENT IS PRESERVED AND THE DELIVERY IS NOT, and `a client sees no difference` -- which this sentence first said -- is true only of a client reading its assembled result.",
        "THE SUPERSEDED RULING, KEPT FOR ITS ARGUMENT.",
        "THE SPRINT RULED THE DRIVE AWAITED-ONCE, AND EVERY SENTENCE FROM HERE TO THE END OF THIS ENTRY IS THAT SUPERSEDED RULING IN ITS OWN WORDS -- kept for its argument, which still stands, and not as a statement of what the row does. MEASURED in protocol.d.ts: `CodeActionParams extends WorkDoneProgressParams, PartialResultParams`, and `CodeActionRequest.type`'s partial-result slot is `(Command | CodeAction)[]` -- so both of `driveStream`'s stated conditions hold, which no OTHER row had while being free to decline them. THAT CLAUSE FIRST READ `TRUE OF NO ROW TSUDOI SERVES TODAY` AND WAS SIMPLY FALSE -- `textDocument/completion` satisfies both and is served, being the drive's original inhabitant -- and it is corrected in place rather than left standing inside a superseded ruling, because what is superseded is the RULING and not a statement of fact about the tree. WHAT THE STREAM DRIVE BUYS IS A PARTIAL ANSWER BEING USEFUL BEFORE THE REST ARRIVES, true of a completion popup and false of this menu: a completion list is FILTERED as the user keeps typing, so a late item lands where it belongs, while a code-action menu is opened, read, and chosen from as a whole -- an action appended after it is on screen moves the row under the user's cursor. AND THE COST IS ASYMMETRIC RATHER THAN A WASH: awaited-once lets an author with a fixed list write `Promise.resolve(actions)`, where the stream drive would force a generator on them to yield it once. BOTH RULINGS ARE BREAKING TO REVERSE -- `Promise` and `AsyncGenerator` are different things to write in every config declaring the key -- so neither is the safe default, which is exactly why the reason is written at the site instead of the decision alone.",
        "THE ORDER IS THE ROW, THEN THE RECORD, THEN THE PROSE, on this project's own rule that a prose repair written before the arm it cites is a claim about an arm that does not exist yet.",
        "THE READING BEFORE THE REVIEW ROUND, KEPT BECAUSE ITS DECOMPOSITION IS THE ONE THAT CHECKS -- 2aff727. Definition of Done PASSED, all five checks exit 0: 1041 pass / 0 fail over 75 files, 3288 expect() calls, 251.94s, TWENTY-ONE registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AND THE DELTA IS READ AGAINST THE ARITHMETIC RATHER THAN AGAINST THE COLOUR, every term MEASURED and none inferred as a residue: base 1029 / 3264 / 74 / twenty, plus ten arms and fourteen assertions and one file from test/code-action.test.ts, plus SEVEN assertions and NO arm from test/methods-table.test.ts -- whose per-entry loops grow with the table, measured 61 to 68 by running that file with the change stashed -- plus two arms, three assertions and one registry record from test/perturbations.test.ts, measured 40/99 to 42/102 the same way. That is 1041 / 3288 / 75 / twenty-one exactly, and nothing else moved.",
        "THE CLOSING READING, TAKEN AFTER THE REVIEW STAGES CONVERGED, ON THE TREE THAT CLOSES -- 4c9d9e6, and the ONLY commit after it is the one carrying this sentence, which no check but test/definition-of-done.test.ts reads. Definition of Done PASSED, all five checks exit 0: 1048 pass / 0 fail over 75 files, 3304 expect() calls, 242.17s, TWENTY-TWO registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. THE DELTA OVER THE BASE DECOMPOSES, and every term of it was measured by running a file with its own change stashed rather than inferred as a residue: base 1029 / 3264 / 74 files / twenty arms, plus the code-action arm file, plus the assertions test/methods-table.test.ts's per-entry loops gain from a row joining the table, plus the README fact and the `progressCount` guard the multi-perspective stage required, plus the cross-row token arm and the two registry records. 1048 / 3304 / 75 / twenty-two, and nothing else moved.",
        "THREE CLOSING READINGS WERE TAKEN AND TWO OF THEM WENT STALE BEFORE THEY WERE READ, which is the reading to carry rather than the number: each named a tree that the next round of repairs overtook. THE RULE THIS PROJECT ALREADY WROTE IS WHAT CAUGHT BOTH -- a closing reading is only one while it names HEAD, or names what stands between and why nothing there can move it -- and it caught them from a REVIEWER each time rather than from the author. What that says about the practice is that the reading must be the LAST thing taken and not the last thing planned.",
        "THE REVIEW ROUND'S YIELD, WITH THE DENOMINATOR THIS PROJECT REQUIRES. Eight independent reviewers over one increment. EVERY ACTIONABLE FINDING WAS IN THE INCREMENT rather than in a previous round's wake, which is what a first round should look like -- and TWO OF THEM WERE DEFECTS IN THE PRODUCT rather than in prose, which is what separates this round from sprint 84's. THE STDERR LINE TELLING AN AUTHOR THEIR ITEMS WERE AGGREGATED SAID `this completion` AND IS REACHED FROM EVERY STREAM-DRIVEN ROW, so a refused token on a code-action request reported a completion; and the once-per-session flag behind it was ONE BOOLEAN ACROSS ALL ROWS, so whichever row refused first silenced the other for the session. Both were harmless while completion was the only stream-driven row and became wrong at the moment this sprint made a second -- which no arm here noticed, and which the sprint's own criteria could not have asked for.",
        "AND THE PUBLISHED SURFACE WAS CARRYING SPRINT POLITICS, WHICH IS THE FINDING THIS PROJECT SHOULD HAVE PREDICTED AND DID NOT. `MethodMap` compiles to `dist/types.d.ts`, which `./types` publishes, so a config author hovering the new row in their editor read `THE RULING OVERTURNED THIS SPRINT'S OWN`. No sibling comment on a published subpath names a sprint; the veto record belongs in this file and in the commits, and the technical reason is what stays at the site.",
        "THE INDEPENDENT STAGE RAN FIVE TIMES, EACH A FRESH SESSION, AND IT WAS STOPPED ON THE MEASURED SHARE RATHER THAN ON A CLEAN ANSWER -- which is this project's own recorded stop condition and not a shortcut. THE FIRST TWO FOUND DEFECTS THE MULTI-PERSPECTIVE STAGE HAD MISSED: that both of that stage's own product fixes were UNGUARDED -- reverting either left the suite green, every invalid-token arm driving completion alone -- and that the new fixture yielded a `CodeAction` to a client sending `capabilities: {}`, which is the exact mistake the README section written two commits earlier tells an author to avoid. BY THE FIFTH, five of seven findings were against prose the ROUND BEFORE IT had written, and the last round's single HIGH was a record broken by the round before that. THE SHARE IS THE SIGNAL: a sixth session would mostly grade the fifth's wording.",
        "AND THE STAGE CAUGHT ONE THING NOTHING ELSE COULD HAVE, WORTH SEPARATING FROM THE PROSE: deriving the stream-driven rows from the table changed the assertion a registry record anchors to, and the record kept naming the literal it replaced. It would have read REFUSED -- a record reporting its arm as GONE when the arm was fine -- and the shape of that failure is the one this instrument exists to make loud rather than silent, so it would have been found. What review bought was finding it one commit later instead of at the next full run.",
        "ONE FINDING IS REFUSED WITH ITS REASON RATHER THAN FIXED. The capability arm pins `codeActionProvider: true` exactly, and `{}` is a conforming `CodeActionOptions` saying the same thing -- so an implementation spelling it that way reddens an arm while breaking nothing. THE WHOLE-OBJECT EQUALITY IS WHAT IS BEING BOUGHT: it is what refuses `{ codeActionKinds: [] }` and what refuses a key nobody expected, and an arm accepting either spelling would have to compare the object minus that key and lose both. The limitation is declared at the arm, which is this repository's own idiom for a pin that is narrower than the property.",
        "THREE OF THE ROUND'S FINDINGS WERE AGAINST THIS RECORD, AND THEY ARE REPAIRED ABOVE RATHER THAN LISTED HERE: a field named wrong (`CodeAction.data`, which is result-side and inert, for `Diagnostic.data`, which is the params-side leak), a past tense asserting a repair that had not happened (CLAUDE.md), and a hand count taken on eight arms where the file had ten. A FOURTH IS THE SWEEP'S OWN NOTE, which claimed exactly one sentence went false where four did.",
        "AND THE RUN BEFORE IT WAS RED ON PBI-93 AND ON NOTHING ELSE, recorded rather than quietly re-run away: at the same tree, the three `dodArms` records timed out at 25s in a run that took 441.84s where the green one took 251.94s. EVERY OTHER ARM, INCLUDING THIS SPRINT'S OWN RECORD, WAS GREEN IN BOTH. What a reader should take from the pair is the filed item and not a doubt about the increment.",
        "ACCEPTED, ALL FOUR CRITERIA MET, WITH NO FIX SUBTASKS. Criterion 1 by the row with its ruling at the site and the arms driving a real server on both runtimes -- AND THE RULING IS THE STAKEHOLDER'S, the sprint's own having been overturned, which the criterion was amended to record rather than quietly satisfied. Criterion 2 by the capability read WHOLE in both directions and by the record that reddens it under `{ codeActionKinds: [] }`. Criterion 3 by the row joining the whole-table arms the moment it was declared, TS2741 forcing the fixture, and the shared params object gaining what `CodeActionParams` requires. Criterion 4 by the README section, the case-insensitive arity sweep with every hit dispositioned, and the `facts` entry the review round found missing -- which is the criterion's own verification, `readmeCoverage`, turning out to be silent about prose.",
        'WHAT THE ACCEPTANCE DOES NOT CERTIFY. That a code action reaches a MENU in a real editor -- every arm here is graded over the wire-level answer, and no stakeholder confirmation was taken for this row. That an author who yields a `CodeAction` to a client which never announced `codeActionLiteralSupport` is stopped, or warned: tsudoi reads that capability nowhere, the obligation is documented and enforced by nothing. That `MethodMap[M]["params"]` is graded at all, for THIS row or any other -- PBI-94. That a cancelled code-action request has ever been driven; the drive is shared and completion\'s arms cover it, and no arm cancels this row. That the `edit`/`command` invariant, `disabled` or `isPreferred` are checked; they are not, and the README says so. And that any INDIVIDUAL commit here is green -- the readings are whole-tree.',
        "CLAUDE.md's OPENING WAS FALSE AND IS NOT THIS INCREMENT. It read `handlers for five LSP methods` and enumerated exactly five, was recorded as false at sprint 85, and that file is UNTRACKED here. IT NOW ENUMERATES THE TABLE AND WRITES NO COUNT, done in the working tree after the review round; nothing this sprint commits carries it, and no reader of this history can verify it. THE RECORD SAID `SO IT IS REPAIRED LOCALLY` BEFORE THE REPAIR EXISTED, which a reviewer caught -- a past tense asserting an accomplished edit that had not happened. The arity sweep in subtask 3 is over TRACKED prose, which is why CLAUDE.md was outside it and why the stale count sat exactly where the sweep could not reach.",
      ],
    },
    {
      number: 86,
      pbi_id: "PBI-88",
      goal: "`workspace/executeCommand` becomes a SIXTH ROW of the request table the other five are rows of, so a command reaches a handler the author wrote with the same lifecycle gate, the same cancellation and the same params refusal every other method already gets -- and none of it written a sixth time.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "ACCEPTED BY THE PRODUCT OWNER WITH TWO CONDITIONS ON THE RECORD AND NONE ON THE INCREMENT.",
        "CONDITION ONE, AND THE PRODUCT OWNER RULED IT RATHER THAN ASKED FOR IT: the success metric STAYS AT FIVE and the sentence at the site says why the five is not a denominator. The five are the ones the STAKEHOLDER NAMED; a sixth served method does not make the metric `5 of 6`, and adding one would be the Product Owner inventing a target nobody set. The annotation is required rather than optional because of this file's own history -- `10 of 10` stood for thirty sprints with nothing anywhere enumerating the ten, and the Product Owner twice reported `2 of 10` as fact.",
        "CONDITION TWO, AND IT IS A RULING AGAINST THE OBVIOUS ANSWER. A truncated capture destroyed a verdict for the SECOND consecutive sprint, and this instance was worse than the first in a specific way: the mechanism existed, the actor had written it, and it was in the very commit being closed -- a red `oxfmt --check` shipped as this sprint's baseline because the run was read through `tail` and the verdict prints ABOVE the summary. THAT IS EVIDENCE ABOUT DELIVERY AND NOT ABOUT ATTENTION, which is the distinction this file's header rests on when it argues a skill counts as a mechanism. SO IT IS NOT ANSWERED WITH A THIRD SKILL. The runner already reports whole; running a bare check by hand and piping it is the unsanctioned route, so the fix is runner-shaped -- make the sanctioned route cover the case that drove people off it.",
        "THE PRODUCT OWNER REFUSED A FINDING OF ITS OWN, WITH THE REASON, RATHER THAN FILING IT: the `unknown` ruling closed the RESULT and left `any` reaching authors through `ExecuteCommandParams.arguments`. Narrowing params would mean tsudoi declaring its own shape for a type upstream owns and publishing a second name for it -- which is what the `deps/` split exists to prevent. Pre-existing through `CompletionItem.data`, refused here, reason stated.",
        "WHAT REVIEW FOUND WAS NEVER BROKEN BEHAVIOUR, AND THAT IS THE READING TO CARRY. Three reviewers, thirteen findings, every one GREEN-PASSING: a params field that made the shared object invalid for a DIFFERENT row (`CompletionItem.command` is a Command OBJECT, so the intersection is uninhabitable and there was no make-it-compile fix); a FALSE why-not in the new row's own comment claiming an author's handler needs tsudoi's key to write into, which it does not; a README fact whose token was satisfied by prose asserting its own INVERSE; and a control faithful today with nothing keeping it faithful. The suite was green before review and green after.",
        "THE DEVELOPER CORRECTED TWO OF ITS OWN CLAIMS AND ONE OF A REVIEWER'S, WHICH IS WORTH MORE THAN THE RESIDUES COST. It wrote that an ill-formed `Command` reaches the fake editor, traced the arms, found it reaches no handler at all, and repaired the note. It claimed a probe answers from `dist/`, ran `--traceResolution`, found it falls through to `src/` ALWAYS because a probe stages no `dist/`, and repaired that. And a reviewer's premise -- that the five original rows prove `null` is the router's because their results declare no null arm -- is simply false: `hover` and `formatting` are `Promise<... | null>` and were already in that position.",
        "WHAT THE ACCEPTANCE DOES NOT CERTIFY. That any INDIVIDUAL COMMIT here is green -- four combined runs, then a split by file path, so a bisect across this sprint can land on a tree never claimed green. That `null` still tells the router from the handler for this row; it does not, and nothing replaces that control. That `any` is off the author's surface; it is off the RESULT. That the README's prose is compiled by anything. That the type probe reads what SHIPS. That a command reaches anything in a REAL EDITOR -- an author must set `commands` through the initialize handler and NO ARM DOES BOTH HALVES IN ONE SESSION, which is the seam between PBI-87 and PBI-88 and is unwitnessed.",
        "THAT LAST ONE IS A REFINEMENT CANDIDATE AND NOT A DEFECT, ruled by the Product Owner: an example config where the two increments are shown working together in a file a stranger reads.",
        "THE CLOSING READING, TAKEN BY THE SCRUM MASTER ON THE TREE THAT CLOSES: Definition of Done PASSED, all five checks exit 0, 1019 pass / 0 fail over 74 files. The base was 1005 / 72.",
      ],
    },
    {
      number: 85,
      pbi_id: "PBI-87",
      goal: "A config author decides what their server advertises: `config.methods.initialize` receives the InitializeResult tsudoi was about to send -- deep-frozen -- and whatever that handler returns is what the editor is told, including a capability tsudoi would have claimed and the author withdrew.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "ACCEPTED BY THE PRODUCT OWNER WITH THREE CONDITIONS ON THE RECORD AND NONE ON THE INCREMENT. All three are discharged below or at the code site named.",
        "AND THE STAKEHOLDER LATER OVERTURNED THE UNSERIALIZABLE RESIDUE, SO THE ENTRY BELOW SAYING THE ACCEPTANCE DOES NOT CERTIFY IT IS AMENDED HERE RATHER THAN LEFT TO READ AS CURRENT. What was recorded-and-not-caught is now CAUGHT: the answer is serialised before the phase moves, a failure is reported to the client as a `window/logMessage` at Error level -- where a config author actually reads it, unlike stderr -- the request is ANSWERED, a `tsudoi: ` line goes to stderr, and the process then terminates non-zero. THE THROW PATH TOOK THE SAME SHAPE when the backwards edge went, so there is now ONE disposition for a handshake that cannot complete and not two that resemble each other -- they differ only in what the client is answered: the author's own error where they threw, tsudoi's sentence where a serialisation failed, since the runtimes word that differently and the author's words would say nothing about what tsudoi was doing with their answer. ANSWERED RATHER THAN VANISHED IS A MEASURED CHOICE: `process.exit` takes the unflushed frame with it, so the exit is `process.exitCode` plus releasing the one handle holding the loop open, and the process ends of itself once the frame is gone -- no timer and no race. THE COST ARGUMENT THAT JUSTIFIED NOT CATCHING IT WAS OVERSTATED, which is why it fell: it is ONE `JSON.stringify` of one small object ONCE PER SESSION on the handshake path, not per request, and the record had framed it as a per-session tax without saying how small a session's one was.",
        "WHAT THAT CATCH STILL DOES NOT CLOSE, MEASURED WHEN IT LANDED: the check and vscode-jsonrpc's encoder are TWO READS OF THE SAME VALUE, so a getter that throws only on its SECOND read passes the check and wedges exactly as before -- -32603, retry -32600, stderr empty, no logMessage. Recorded at the check and deliberately UNARMED, because an arm there would pin the wedge as promised behaviour. `JSON.parse(JSON.stringify(answer))` closes it and is FORECLOSED: it puts a copy on the wire, changing what the client is served, which is not what was ruled.",
        "THE STAKEHOLDER'S RULING WAS OVERTURNED IN FLIGHT AND THIS IS WHERE A VETO LANDS. The design brief ruled `no rollback, no fourth phase, no break of the three-states-in-order invariant`. There is now a fourth phase, `initializing`. THERE WAS ALSO A BACKWARDS EDGE OUT OF IT AND THE STAKEHOLDER HAS SINCE REMOVED IT: `2回目以降のinitializeは即刻拒否すべき`, with no carve-out for a handshake that failed. `Phase` is strictly forward again. THE JUSTIFICATION THAT DIED WITH IT WAS ALREADY WEAK, which is why it is written down rather than merely deleted: the edge was argued from `InitializeError.retry` being unimplementable otherwise -- but MEASURED, tsudoi never produces an `InitializeError` at all, the error leaving as a bare -32603 with no `data` and no value route from the published surface to a `ResponseError`. No conforming client was ever going to retry on tsudoi's say-so, so the edge served only a client retrying on its own initiative, which `The initialize request may only be sent once` already forbids. WHAT FORCED IT, MEASURED: with the handshake awaiting an author's handler, a second `initialize` arriving in that window read `uninitialized` and was ACCEPTED -- both handshakes served, `handshake()` run twice from concurrent flows, the author's handler run twice, nothing on stderr. A no-handler session never yields, which is why nothing before this sprint could show it. THE RULING'S PREMISE WAS INCOMPLETE RATHER THAN ITS CONCLUSION WRONG: it reasoned about the THROW path, and the defect was CONCURRENCY. If the stakeholder vetoes, the answer is not three phases again -- it is serialising the handshake another way, and that is a new item.",
        "THE ARM THAT NOW CATCHES A TRANSPOSED TRANSITION IS NAMED, because criterion 3's own discriminator died with the repair and a criterion met by argument is forbidden here. MEASURED, three perturbations against the landed source: deleting `beginInitialize()` reddens the concurrency arm on both runtimes with the served entry count reading 2; deleting `abandonInitialize()` reddens the retry line of the throwing-handler arm; replacing `beginInitialize()` with `initialize()` -- the transposition criterion 3 used to catch -- reddens the concurrency arm on the refusal's MESSAGE, on both runtimes, while the throwing-handler arm stays ENTIRELY GREEN. So the property is pinned, and it is pinned somewhere other than where the criterion says to look; the criterion was amended in place rather than corrected below.",
        "THE DEFECT WAS FORESEEABLE FROM A RESIDUE ALREADY WRITTEN DOWN, WHICH IS THE FINDING WORTH CARRYING. The brief's own accepted-residue paragraph was about a window opened by the very `await` that opened this one -- a second `initialize` arriving in it is one door away. Review caught it, which is the system working; that nobody reached it from the residue they had already written is not.",
        "WHAT THE ACCEPTANCE DOES NOT CERTIFY, IN THE PRODUCT OWNER'S WORDS. That an author's initialize handler ever RUNS -- a TOP-LEVEL `initialize` key is read by nothing and refused by nothing, documented and not caught, the placement ruling having moved that risk rather than removed it. Anything about an unserializable return -- AMENDED TWICE SINCE, and it is now caught, answered, logged to the client and fatal. That the notification drop window is closed -- it is wider now by the handler's duration. That the capability trap is guarded -- nothing detects an author withdrawing `resolveProvider`, `textDocumentSync` or `workspace.workspaceFolders`. That `executeCommandProvider.commands` reaches anything, which is PBI-88. That `CLAUDE.md` is true; it still opens `handlers for five LSP methods` and is not committable here.",
        "AND IT DOES NOT CERTIFY SUITE DETERMINISM. One run reported `Tests pass -- exit 1` on content byte-identical to trees green immediately before and twice after, and the diagnostic was destroyed by piping through `tail`. NOT CALLED A FLAKE, because no test was named. It was one of the slow runs, as was a separate `test/completion.test.ts` red that cleared three ways and IS the known pre-existing stderr-flush race. THE CHEAP RULE THAT FALLS OUT: a Definition-of-Done run is captured WHOLE, never piped through anything that discards the head.",
        "THE CLOSING READING, TAKEN BY THE SCRUM MASTER ON THE TREE THAT CLOSES: Definition of Done PASSED, all five checks exit 0, 1005 pass / 0 fail over 72 files, one non-gating `require-yield` warning unchanged from base. The base was 970 / 70.",
      ],
    },
    {
      number: 84,
      pbi_id: "PBI-85",
      goal: "The popup names the ENTRY. `label` becomes the entry's own name, `filterText` takes over the filtering the label was doing for the clients that read it, and what is written into the buffer does not move a byte. The label stays RAW and keeps its refusal while LOSING its reason -- what replaces it is the client's containment check, asserted as an arm rather than argued in a docblock.",
      status: "done",
      subtasks: [
        {
          test: "A DESCRIBE OF TWO ARMS IN packages/tsudoi-completion-path/test/completion.test.ts, AND THE SECOND IS WHAT MAKES THE FIRST MEAN ANYTHING. The multi-segment arm drives a fragment carrying a directory part and compares the labels WHOLE against the entry names, then the pair `{ filterText, insertText }` and `textEdit.newText` whole -- three fields in one arm because a client reads whichever its own class names and a drift between them breaks one of them silently. The single-segment arm drives a fragment naming no directory and asserts the label and the inserted text are the SAME string, which is not a duplicate: it is the control that must stay GREEN under the perturbation that reddens the first, and without it `label: insertText` restored reddens an arm that was never about the directory part. AND THE INVARIANT AT `each item names the file it resolves to and the source that produced it` MIGRATES RATHER THAN BEING DELETED: `label.startsWith(insertText)` stands under a comment whose own precondition is `when the item carries no filterText`, which this subtask removes, so the assertion becomes `filterText === insertText` at the same site and the comment says which field the client now reads.",
          implementation:
            "`itemsFrom` in packages/tsudoi-completion-path/src/completion.ts writes `label: entry.name` and `filterText: insertText`, and `insertText`, `textEdit` and `detail` are untouched. THE COMMENT AT THE SITE CARRIES THE TWO REFUSALS AND NOT THE MECHANICS: not the whole inserted text in the label, which is the prefix every row of the popup was repeating; and not a narrower edit range, which would make the label the whole item and need no `filterText` at all -- refused because it moves what is written into the buffer and because the widening-fragment reading of a filename holding a space is built on the range beginning where the FRAGMENT begins.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "930ceb2",
              message:
                "feat(completion-path): the popup names the entry, the filter keeps the path",
              phase: "green",
            },
          ],
          notes: [
            "THE RED, MEASURED AND NOT PREDICTED. With both arms written and `src/` untouched, `bun test packages/tsudoi-completion-path/test/completion.test.ts`: 43 pass / 2 fail. The two are the multi-segment arm AT ITS LABEL ASSERTION (`Expected [deep.txt] / Received [notes/deep.txt]`) and the migrated invariant at `expect(item.filterText).toBe(item.insertText)`, receiving `undefined`. THE SINGLE-SEGMENT ARM WAS GREEN IN THAT SAME RUN, which is the reading that makes it a control rather than a duplicate -- it is green before the change and after it, and its job is the perturbation subtask 3 takes.",
            "GREEN AFTER, OVER THE WHOLE SUITE AND NOT THE ONE FILE: 966 pass / 0 fail over 70 files, 3014 expect() calls, 240.74s, sixteen registry arms HELD. Against the sprint base's 964 / 3008 the delta is the two new arms and their six assertions exactly -- the migrated invariant is a replacement and adds none, which is what says nothing else moved.",
          ],
        },
        {
          test: "THE ARM THAT FORECLOSES THE NEXT EDIT, over the fixture the forgery arm already builds -- a name holding a line break: the inserted text CONTAINS the label. It is green the moment it is written, which is why it is a subtask of its own rather than a line in the one above: what grades it is its perturbation, and a green arm shipped without one asserts nothing about the day someone flattens the label.",
          implementation:
            "Nothing in `src/`. The arm is the deliverable, and its reason is the client's: READ FROM ddc-source-lsp AND MEASURED NOWHERE HERE, an item whose inserted word does not contain its label is DROPPED rather than shown wrong, under an option that defaults off. The docblock over the forgery arm is where the reason goes, and it is the same docblock subtask 4 repairs -- so this arm is written and that sentence is left standing until then, deliberately, rather than half-edited twice.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "90bf97c",
              message: "test(completion-path): the label stays raw for a reason the client owns",
              phase: "green",
            },
          ],
          notes: [
            "THE ARM IS MULTI-SEGMENT AND THE PLAN DID NOT SAY SO, which is the one thing that would have made it worthless: for a fragment naming no directory the label and the inserted text are the SAME string, and `contains` over one string and itself grades nothing. The fixture is the forgery arm's name under a directory.",
            "THE RELATION IS ASSERTED BEFORE THE TWO WHOLE VALUES, on the ordering rule the forgery arm beside it already records: a runner stops at the first failing assertion, so with the values in front the relation could never BE the failure a reader is shown -- and the relation is what the client checks. MEASURED to matter, at subtask 3: under the flattening the red falls at the relation, and under the restored label it falls at the whole value.",
          ],
        },
        {
          test: "TWO RECORDS IN test/perturbations.test.ts, EACH WITH `redAt`, and each measured against the landed source rather than predicted. ONE: `label: insertText` restored, which must redden the multi-segment arm AT ITS LABEL ASSERTION -- a red at the `filterText` pair beside it would mean the record grades the field's presence and not the directory part -- and must leave the single-segment arm GREEN. TWO: the label flattened, which must redden the containment arm and leave the forgery arm on `detail` green, that pair being the whole of what tells the two fields apart. `alsoReddens` is MEASURED for both, never predicted.",
          implementation:
            "Records only. THE `from` OF EACH NAMES A LINE OF `itemsFrom` THAT THIS SPRINT JUST WROTE, which is the arity guard's whole value here: reshape the item construction again and the record throws with 0 occurrences rather than reporting a silent HELD.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "df03638",
              message: "test(perturbations): the two weakenings this sprint's arms are worth",
              phase: "green",
            },
          ],
          notes: [
            "BOTH MEASURED BY HAND FIRST, THE FILE RESTORED FROM A COPY AFTER EACH, and each red read at the assertion it fell on rather than at the arm. The restored label reddens the treatment arm at its LABEL assertion and the containment arm at a WHOLE VALUE, with the single-segment control green; the flattening reddens the containment arm alone, at its RELATION. So the two weakenings redden ONE SHARED ARM AT DIFFERENT ASSERTIONS -- and only the flattening's site is machine-checked, `redAt` reading the NAMED arm's failure while `alsoReddens` carries names with no site. THE FIRST SPELLING OF THIS SENTENCE SAID `THE SAME ARM`, which was false of the arms the records name.",
            "`alsoReddens` IS ASYMMETRIC AND THAT IS THE MEASUREMENT RATHER THAN AN OVERSIGHT. THE REASON FIRST GIVEN FOR THE FLATTENING'S EMPTY SET WAS FALSE AND A REVIEWER TOOK IT AT THE ARM ABOVE ITS OWN: it said no other fixture in that file holds a control character, and the forgery arm builds the SAME name -- the flattening moves that arm's label too, and it stays green because it reads `detail` alone. What is true is narrower: no other arm in that file reads a LABEL on a name the flattening rewrites.",
            "EVERY RECORD REPORTED HELD ON THE FIRST RUN OF THE REGISTRY AFTER LANDING, and the registry is nineteen arms where the sprint base had sixteen -- the third being the `filterText` record the review round found criterion 2 had asked for and this subtask had not shipped.",
          ],
        },
        {
          test: "THE SWEEP, under the skill arm sprint 82 left: `label`, `filterText` and `insertText` grepped across test/, packages/tsudoi-completion-path/test/, both READMEs and src/, every hit re-sited, deleted, or left green WITH the reason it still reads something. The known ones: the docblock over the forgery arm, whose `what a client filters on` half this sprint deletes; `test/installed-handler.test.ts`, which reads a label only for identity and stays as it is; and the helper whose last resort is `insertText ?? label` -- `applyAsClient`, NOT `inserted()`, which this plan named and which holds no label at all -- left as it is, since every item this package builds carries `insertText` and no arm reaches the fallback.",
          implementation:
            "The member README's `Which field carries what` paragraph gains the third field: the label names the entry, `filterText` carries what is typed so the item survives its own filter, and `detail` keeps the absolute path. LAST, because it describes what landed rather than what was intended, and because the docblock's replacement reason is the arm subtask 2 shipped rather than a claim.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "c2688e0",
              message:
                "docs(completion-path): the label's reason changed, and the prose says which",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE SWEEP WAS RUN TWICE AND THE FIRST RUN COULD NOT SEE THIS TREE. Case-sensitive, over `filters on|filter on|filtered on`, it returned EMPTY and would have carried `no sentence in the tree gives filtering as the LABEL's reason` -- while the comment written minutes earlier at the `filterText` site reads `WHAT A CLIENT FILTERS ON, WHICH THE LABEL STOPPED BEING`. This repository writes its reasons in capitals, so a case-sensitive sweep of its prose is blind by construction. Re-run with `-i` and widened to `filtering`, over packages/, test/, examples/, README.md AND scrum.ts.",
            "WHAT THE SECOND SWEEP FOUND, EACH DISPOSITIONED AND NO TALLY WRITTEN -- a count here was taken against a tree that has since moved, and a reviewer re-took it and got a different one. This sprint's own repaired prose, at the composer, the docblock, the registry records and the README: left. The word in another sense entirely, in test/published-artifacts.test.ts, test/helpers/snapshot.ts and test/helpers/lsp.ts: left. This file's own hits are QUOTATIONS of the sentence being deleted, except sprint 82's note, which was a standing assertion and was FALSE -- narrowed in place, since a correction several lines below the sentence it corrects is read second or not at all.",
            "AND TWO CLAUSES OF THIS SPRINT'S OWN PLANNING NAMED THE WRONG HELPER, corrected in the criterion and in the subtask above: the `insertText ?? label` fallback is `applyAsClient`'s, where `inserted()` reads `insertText ?? \"\"` and holds no label at all. Nothing was graded on it -- the fallback is unreachable, every item this package builds carrying `insertText` -- which is exactly why it could stand unnoticed in the field the product owner grades against.",
          ],
        },
        {
          test: "THE REVIEW ROUND'S REPAIRS, AND THEY ARE ALL IN THE INSTRUMENT AND THE PROSE: not one finding required a change to what the handler produces. THE THREE THAT MATTER, each measured before and after. A label cut at the FIRST separator rather than the last passed every label assertion in the tree, every fixture holding at most one separator -- the treatment fixture becomes `a/b/deep.txt` and that implementation reddens two arms. `insertText contains label` was satisfied by the EMPTY label, the one value the client discards outright -- the relation becomes an equality against the typed directory. And nothing read `filterText` on a name worth reading it on, both readers driving an ordinary name where flattening is a no-op, so `filterText: flattened(insertText)` was green everywhere -- the forged-name arm reads it now. Beside them: the per-source sweep gets its label reading back, the single-segment control reads the same four fields as its twin, and both new arms assert their premise.",
          implementation:
            "The third perturbation record, and the prose repairs. THE RECORD IS CRITERION 2'S, which subtask 3 did not ship: `filterText` narrowed to the entry name, red at the treatment arm with the control green. THE PROSE: the README sentence attaching `one is written into your buffer` to two fields that are not, found INDEPENDENTLY BY THREE REVIEWERS; the client claims hedged to what was read, including that the client matches against the word it reconstructs from the edit range rather than against the inserted text, so the arm's relation is a PROXY and narrower than the rule; the popup reading attributed at the source site; and this file's own false clauses -- the `SAME ARM` sentence, the flattening's `no other fixture holds a control character`, and a tally taken against a tree that had moved.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "41bd5ab",
              message: "test(completion-path): three ways the label arms were green about nothing",
              phase: "green",
            },
            {
              hash: "59babeb",
              message: "docs(completion-path): the reason was attached to the wrong pair of fields",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE ROUND'S YIELD, WITH THE DENOMINATOR THIS PROJECT REQUIRES. Ten independent reviewers over one increment, and EVERY actionable finding was in the increment rather than in a previous round's wake, which is what a first round should look like. THREE reviewers reported the README sentence independently. NOT ONE FINDING REQUIRED A CHANGE TO THE SOURCE'S BEHAVIOUR -- the two-line increment survived untouched, and everything repaired was an arm that graded less than it claimed or a sentence that said more than was read.",
            "AND THE STRONGEST FINDING IS THE ONE THE SPRINT COULD NOT HAVE FOUND FOR ITSELF, because it is a property of the FIXTURES rather than of any assertion: every fixture that PRODUCES AN ITEM carried at most one separator, so every label assertion was blind to the difference between the first separator and the last. The arms all said `the label is the entry's own name` and none of them could tell that from `the label is everything after the first slash`. NOT `EVERY PATH IN THE SUITE`, WHICH WAS THE FIRST SPELLING AND WHICH THE SECOND REVIEW STAGE REFUTED: the win32 arms carry `C:\\Users\\fo` and a UNC path, and they drive the fragment reader rather than item construction.",
            "THE ROUND ALSO SURVEYED ELEVEN EDITOR CLIENTS, AND WHAT IT FOUND THERE IS DELIBERATELY NOT RECORDED. THE STAKEHOLDER RULED IT: a defect in a client is the client's, and this dashboard is not where another project's bugs are tracked. What survives from that survey is only what is true of THIS package's own prose -- the range-derived filtering rule is a client's convention and not the specification's, which is why criteria 2 and 4 are qualified above.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE BASE, MEASURED BEFORE ANYTHING MOVED: HEAD c355132, Definition of Done PASSED, all five checks exit 0, 964 pass / 0 fail over 70 files, 3008 expect() calls, 263.60s, SIXTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. Any red from here is this sprint's until measured otherwise against that.",
        "NO CHECK IN THIS REPOSITORY CAN SEE THE THING THE STAKEHOLDER REPORTED, AND THE PLAN SAYS SO RATHER THAN PRETENDING OTHERWISE. What they saw is a popup, and what an editor renders from an item is the editor's. Every criterion here is graded over the WIRE-LEVEL item, and the reading that connects the two -- the popup renders `label` -- is READ FROM ddc-source-lsp's source and is not a measurement. The stakeholder's own confirmation in their editor is the acceptance evidence for the popup itself, and it is asked for at review rather than assumed here.",
        "THE ORDER IS BEHAVIOUR, THEN THE ARM THAT FORECLOSES, THEN THE RECORDS, THEN THE PROSE. The prose repair is last because its replacement reason IS subtask 2's arm: written earlier it would be a claim about an arm that does not exist yet, which is the shape this project keeps catching.",
        "THE CLOSING READING, RE-TAKEN AT THE END OF THE REVIEW STAGES ON THE TREE THAT CLOSES -- 28a2cc2, and the ONLY commit after it is the one carrying this sentence, which no check but test/definition-of-done.test.ts reads. Definition of Done PASSED, all five checks exit 0: 970 pass / 0 fail over 70 files, 3036 expect() calls, 322.53s, NINETEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AN EARLIER SPELLING OF THIS DECISION NAMED A COMMIT THAT THREE MORE HAD OVERTAKEN, WHICH THE FRESH REVIEW SESSION CAUGHT: a closing reading is only a closing reading while it names HEAD, or names what stands between and why nothing there can move it. THE ARM DELTA IS DECOMPOSED AND THE ASSERTION DELTA IS NOT, which is a limit of the count rather than a gap in the reading: the arms over the sprint base are the two of subtask 1, the one of subtask 2 and the three registry records, and the assertions land partly inside sweeps that run once per source and per item -- so `expect() calls` is a RUNTIME count and no source-side decomposition of it would be checkable.",
        "THE READING BEFORE THE REVIEW ROUND, KEPT BECAUSE ITS DECOMPOSITION IS THE ONE THAT CHECKS. Definition of Done PASSED at c2688e0, all five checks exit 0: 969 pass / 0 fail over 70 files, 3020 expect() calls, 242.63s, EIGHTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AND THE DELTA IS READ AGAINST THE ARITHMETIC RATHER THAN AGAINST THE COLOUR, which is this project's own rule about a green: base 964 / 3008 / sixteen, plus two arms and six assertions from subtask 1, one arm and four from subtask 2, two arms and two from subtask 3. That is 969 / 3020 / eighteen exactly, and nothing else moved.",
        "AND THE POPUP WAS CONFIRMED BY THE STAKEHOLDER IN THEIR OWN EDITOR, which is the only evidence that exists for the thing they reported: they ran the rebuilt server and said it works. It is recorded as their reading and not as a measurement of this repository -- nothing here can take it, and the sentence below says why.",
        "THE REVIEW STAGES WERE STOPPED ON THE MEASURED SHARE AND NOT ON A COLOUR, which is this project's own recorded stop condition rather than a shortcut. Findings caused by the PREVIOUS ROUND'S OWN REPAIRS: none of the multi-perspective stage's, since it read the increment; then two of the independent thread's last two; then the fresh session's stale-count finding, which was about a decision the round before it had written. THE SHARE ROSE, so a fourth session would mostly grade the wording of the third's repairs. The skill's convergence condition -- a FRESH session answering `no comments` first -- is therefore NOT met, and that is recorded rather than smoothed: what stopped the stages is the ratio.",
        "ACCEPTED, ALL FIVE CRITERIA MET, WITH NO FIX SUBTASKS. Criterion 1 by the label arm over two directory segments, red under the restored label with the single-segment control green; criterion 2 by the `filterText` pair and its own record, the narrowing rather than the drop and the reason written at both; criterion 3 by the equality over the forged name, red under the flattening at the relation; criterion 4 by the three arms under the apply describe, green at every commit, and by the narrowing the criterion itself needed; criterion 5 by a case-insensitive sweep with every hit dispositioned. THE ONE THING NO CRITERION COULD REACH -- the popup -- is the stakeholder's own confirmation, recorded above as theirs.",
        "WHAT NO CHECK HERE HAS SEEN: the popup itself. Every criterion above is graded over the wire-level item, and the sprint's own planning decision says the stakeholder's confirmation in their editor is the acceptance evidence for what they reported. It was asked for, and the decision above records the answer.",
      ],
    },
    {
      number: 83,
      pbi_id: "PBI-83",
      goal: "The popup becomes labelled facts and a headed list, IN TWO SPELLINGS -- the stakeholder's quoted block being the PLAINTEXT one, since three lines joined by a bare newline are one CommonMark paragraph and would render as a run-on.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "COMPACTED AFTER SPRINT 85, AND WHAT LEFT IS NAMED SO THE GAP IS NOT MISREAD AS `NOTHING HAPPENED`: the subtask records and their MEASURED counts went, being readings of moments this file's own header says a note cannot be a home for. What they measured lives in the tree -- the two spellings in the composer, the arms in both resolve suites, the member README's repaired sentences. Only rulings are kept below.",
        "THE MARKDOWN BREAK IS A BULLET LIST, AND THE ALTERNATIVES ARE REFUSED WITH REASONS THAT STILL BIND. A trailing-double-space hard break is invisible in the source AND in a diff, so one space stripped by any tool silently restores the run-on the ruling exists to prevent -- in a repository that formats its whole tree. A backslash break is the same invisibility inverted. Bold labels do not break a line at all. AND BULLETS BUY BACK what sprint 82 recorded as a loss: the one-fact completion block stops being byte-identical across formats.",
        "TRUNCATING WHOLE SECONDS IS A NO-OP OF THE VALUE AND NOT OF THE STRING, and conflating the two is what sent an increment back. The stakeholder was shown both and DECLINED the one that keeps the milliseconds.",
      ],
    },
    {
      number: 82,
      pbi_id: "PBI-82",
      goal: "The free fact goes to the eagerly-rendered field and the expensive one to the lazy field: `detail` names WHICH FILE from the completion list itself, `documentation` is the only property a late answer touches, and the block only ever GAINS.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "COMPACTED AFTER SPRINT 85 on the same terms as sprint 83 above.",
        "THE GOAL SAID `THE TWO` AND `BEFORE ANY RUN CAN BE READ AS PASSING`, AND THE INCREMENT REFUTED BOTH HALVES -- there were THREE claims turning silently green, the third named in the item's own criterion at refinement, and it was re-sited only after four full Definition-of-Done greens had been read. KEPT BECAUSE IT IS THE FAILURE MODE AND NOT THE FEATURE: a sprint goal describes an intention, and reading one back as a record of what happened is the mistake this line exists to make expensive.",
      ],
    },
  ],
  // THIS LIST IS DATA, AND `bun run scripts/definition-of-done.ts` IS THE ONE
  // FORM FOR TAKING IT. That runner EXECUTES this file and reads the checks
  // below out of the JSON it prints, so an entry added here runs with no edit
  // anywhere else -- which is the whole point, and the reason a copy of this
  // list may not be written into the runner. WHAT THIS FIELD MUST STAY: `run`
  // is A COMMAND LINE THE RUNNER SPAWNS -- a program and its space-separated
  // arguments -- so nothing a command cannot verify belongs in it, and the
  // runner is NOT added here as a sixth entry: a check that runs every check
  // would run itself, unbounded.
  //
  // AND IT IS NOT A SHELL COMMAND, WHICH THIS COMMENT CALLED IT UNTIL A
  // REVIEWER MEASURED THE DIFFERENCE: `run: "true && false"` spawned `true`
  // with the arguments `&&` and `false` and REPORTED PASSED. No shell is
  // involved, deliberately -- through one, a missing binary arrives as exit 127
  // and cannot be told from a check that ran and said no -- so a `run` carrying
  // a pipe, a redirection, a quoted argument, a glob or an operator is now
  // REFUSED and reported non-green rather than misread. A check needing any of
  // those goes in a script, and the script is what is named here.
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
      sprint: 87,
      improvements: [
        {
          action:
            "THE RUNNER PRINTS THE TREE IT GRADED, AND IT IS RUNNER-SHAPED FOR SPRINT 86'S REASON. A closing reading must name the commit it graded; THAT RULE FAILED TWICE IN THIS SPRINT and a REVIEWER caught it both times, which is evidence about DELIVERY and not about attention -- the rule was written down, in this file, and the hash simply was not to hand at the moment the sentence was written, so it was written from memory. A third rule would have the same delivery. What had no answer was `what did I just grade`, and now the report says. DIRTY IS PART OF THE READING RATHER THAN A WARNING ABOUT IT: a hash alone on a tree that does not match it reads as provenance for a green belonging to a state no commit holds, which is the harder error to notice afterwards. A directory outside git gets SILENCE, because this runner grades a directory.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective. One arm over all three states, written RED first. MEASURED against the real dashboard: a clean checkout prints `tree: <hash>` alone, and this tree mid-retrospective printed the DIRTY marker. THE STAGE HAD TO BE ISOLATED FROM THE MACHINE'S OWN GIT, measured rather than foreseen -- a bare `git init` there inherits the developer's GLOBAL hooks, and this repository's own commit hook refused the stage's commit over a file the stage does not contain.",
        },
        {
          action:
            "AN ARM IN `.claude/skills/writing-a-comment/SKILL.md`: the day a category gains its SECOND member, every sentence and every session-scoped flag written while it had one is suspect. THIS SPRINT'S TWO REAL DEFECTS ARE BOTH THAT SHAPE and both SHIPPED -- a stderr line reading `so this completion is answered` reached from every stream-driven row, and a `let reported = false` scoped to the session where the count is per method. Beside them, four sentences naming completion where a KIND was meant, and a MEASURED reading that had been true and became narrower than the property it sat under. THE ARM SAYS WHAT FINDS THEM: grep the FIRST member's NAME in the module that now serves both, and sweep every once-per-session flag, counter and cache there. AND IT SAYS WHAT DOES NOT -- this sprint ran a case-insensitive arity sweep over `five|six|seven` and not one of those sentences contains a number, because they ENUMERATE WITHOUT COUNTING.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
        {
          action:
            "WHAT IS NOT MECHANISED, NAMED SO ITS ABSENCE IS NOT READ AS COVERAGE. Nothing makes an author COPY the tree line into the record, and nothing compares a recorded hash against HEAD -- a check that parsed prose for a hash would be a green certifying that a sentence has provenance, which is the detector shape this project refuses by name. What is done is the smaller honest half: the hash is now in front of the reader at the moment they write the sentence. IF IT GOES STALE A THIRD TIME the answer is still not a rule -- it is that the record should quote the runner's own line rather than restate it.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Recorded rather than built, with the reason, per the header's mechanise-or-delete rule.",
        },
      ],
    },
    {
      sprint: 86,
      improvements: [
        {
          action:
            "`--only <substring>` ON `scripts/definition-of-done.ts`, AND IT IS DELIBERATELY NOT A THIRD SKILL. Sprint 85's retrospective answered a truncated capture with a skill arm; sprint 86 broke that arm IN THE COMMIT THAT ADDED IT, shipping a red `oxfmt --check` as the next sprint's baseline. The Product Owner ruled that as evidence about DELIVERY rather than attention -- the distinction this file's header rests on -- so the answer is runner-shaped. The runner already reports whole; what it had no answer for was `I only want to re-run one check`, so the route that loses verdicts was the only route there was. It reports exactly as a whole run does, and it MUST NOT pass for one: the declared order is load-bearing, the first check building what the fourth reads, so no subset's green is this Definition of Done's green. The marker is in the SUMMARY line as well as the header, because the reader it is built for is the one who took the LAST lines -- and it breaks the bytes `Definition of Done: PASSED`, so a habit built on grepping those finds nothing rather than a subset's answer. A substring matching no check is REFUSED for the reason an empty dashboard already is.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective. Five arms, each written RED first with the red observed; one weakening entered the perturbation registry and reads HELD. MEASURED against the real dashboard: `--only format` exits 0 running that check alone with both lines marked, and `--only nosuchcheck` exits 1 naming the substring and listing every declared check. The sprint's own failure is now servable by the sanctioned route.",
        },
        {
          action:
            "WHAT IS NOT MECHANISED, NAMED SO ITS ABSENCE IS NOT READ AS COVERAGE: nothing forces the sanctioned route. `--only` removes the REASON to run a bare check by hand; it cannot stop anyone. Per this file's header the alternative was to delete the improvement rather than write a rule nobody enforces -- the breach is survivable and was caught inside the sprint both times -- and what is done instead is the smaller, honest half: the cheap route now exists and is discoverable. If a third instance arrives, the next answer is not another rule either.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Recorded rather than built, with the reason, per the header's mechanise-or-delete rule.",
        },
      ],
    },
    {
      sprint: 85,
      improvements: [
        {
          action:
            "AN ARM IN `.claude/skills/recording-a-measurement/SKILL.md`: a run piped through `tail` is not a reading you took. MEASURED THIS SPRINT AND THE COST WAS TOTAL -- a Definition-of-Done run reported `Tests pass -- exit 1` on content byte-identical to trees green immediately before and twice after, and WHICH test failed is now unknowable, because `bun test` prints its named failures ABOVE the summary and the tail kept only the summary. There was nothing left to call a flake or a defect, so it could honestly be called neither. The arm says capture whole to a file and grep the file, and gives the reason specific to this suite: the tail is exactly the half that says HOW MANY and the head is exactly the half that says WHICH.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
        {
          action:
            "AN ARM IN `.claude/skills/writing-a-comment/SKILL.md`: a residue you accept is a question about a WINDOW, not about one message. This sprint's accepted-residue paragraph was true, argued, and named the one inhabitant its author had thought of -- a dropped notification. A second `initialize` in the same window was ACCEPTED and ran the whole handshake twice; an `exit` in it kills the in-flight handler with no response and no cleanup. Neither was reached from the paragraph already written about the window they arrive in. The arm asks for the enumeration -- every request, every notification, the lifecycle's answer for each -- and gives two tells that you are writing this shape: the sentence names a DURATION rather than a message, and it argues safety from what the SPEC forbids a client to do, which bounds WHO arrives and says nothing about what happens when a non-conforming one does.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
      ],
    },
    {
      sprint: 84,
      improvements: [
        {
          action:
            "TWO ARMS IN `.claude/skills/writing-a-test/SKILL.md`, both on the fixture rather than on the assertion, which is where this sprint's findings actually landed. ONE: an arm asserting a value CUT from a string at a delimiter must drive a fixture holding that delimiter at least TWICE, or a cut at the first and a cut at the last are the same string and the arm grades neither. IT WOULD HAVE CAUGHT THE SPRINT'S LARGEST FINDING at the commit that wrote the arm rather than two review stages later. TWO: the sprint-44 block asked in advance what would refute `author-caught is detection, not defect` -- an instance found by someone other than its runner -- and this sprint supplies two, so the block is amended rather than left standing having been told. WHAT NEITHER COVERS: any transformation that is not a cut, and the general case of a fixture too simple to exercise what its arm claims, which nothing here reduces to a rule.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective at 76b606f, being skill arms on non-production text.",
        },
        {
          action:
            "`PerturbationRecord` GAINS A REQUIRED GREEN in test/helpers/perturbation.ts: the arms a record's discrimination RESTS ON, which `read()` must find in the report AND find passing. Today a control is enforced only by ABSENCE from `alsoReddens`, and absence cannot tell a control that stayed green from one that no longer exists -- delete the single-segment arm and both label records still report HELD with the discrimination gone. Found by the review round, and the record's own comment currently confesses it in prose, which this dashboard's header says is not a record at all. WHAT IT WOULD NOT COVER: a control that exists, passes, and grades nothing -- the same judgement `redAt` cannot make one level down.",
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
