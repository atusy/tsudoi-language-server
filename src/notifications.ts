import {
  createProtocolConnection,
  type Disposable,
  type Logger,
  type MessageReader,
  type MessageWriter,
  type NotificationType,
  type NotificationType0,
  type ProtocolConnection,
} from "vscode-languageserver-protocol/node";
import type { Lifecycle } from "./lifecycle.ts";

/**
 * WHEN a notification may reach its handler.
 *
 * `lifecycle` is what LSP asks for: outside the initialized window the message
 * is dropped, SILENTLY, because a notification has no response through which a
 * client could be told anything. `always` is for the messages a client is
 * entitled to send at any moment -- `exit` is the only one today, and the
 * reason it is one lives at its entry rather than here.
 */
export type NotificationGate = "lifecycle" | "always";

/**
 * One notification tsudoi answers: what it is, what to do with it, and WHEN it
 * may run.
 *
 * `gate` is REQUIRED AND HAS NO DEFAULT, and that is the whole design. What
 * stood here before was three hand-written copies of
 *
 *     if (lifecycle.acceptsNotification() === false) { return; }
 *
 * at the top of the didOpen, didChange and didClose handlers -- a CONVENTION,
 * which a fourth handler joins only if whoever writes it remembers. Their
 * defence is re-homed HERE, since the checks themselves are gone:
 *
 * - what each check prevented: a document mutation applied BEFORE initialize
 *   (the server has no client state to apply it against) or AFTER shutdown (the
 *   session is over and the store is about to be discarded), so a client that
 *   mistimes a notification cannot leave the store holding a document the
 *   session never agreed to;
 * - and why a required field prevents it now: an entry that decides nothing
 *   does not TYPE-CHECK, so the realistic failure -- a new notification whose
 *   author never thought about the lifecycle -- became a compile error instead
 *   of a handler that silently runs in every state.
 *
 * HOW UNDEFENDED THE CONVENTION ACTUALLY WAS, measured on the shape this
 * replaced and homed here because it is the reason this file exists: deleting
 * didChange's check reddened NOTHING and deleting didClose's reddened NOTHING,
 * while deleting didOpen's reddened four tests that never mention it. TWO OF
 * THE THREE COPIES WERE PURE CONVENTION, and the third was defended only
 * INCIDENTALLY. That control cannot be re-run -- there is no body check left to
 * delete -- so this sentence is the evidence.
 *
 * WHAT THIS DOES NOT FORECLOSE, AND THE SENTENCE THAT USED TO STAND HERE WAS
 * WRONG: it said a future edit calling `connection.onNotification` directly
 * bypasses this file, that only a lint rule could stop it, and that NO TYPE
 * COULD. A type can, and `createGatedConnection` below is it -- src/server.ts
 * never holds a value that HAS an `onNotification` to call. What that does and
 * does not reach is named at that function rather than repeated here.
 */
export interface NotificationEntry<P> {
  /** The protocol message. `NotificationType0` is how `exit` is declared. */
  readonly type: NotificationType<P> | NotificationType0;
  /**
   * What to do with it. Deliberately NOT handed the lifecycle: a handler that
   * could consult the gate is a handler that could forget to.
   */
  readonly handler: (params: P) => void;
  readonly gate: NotificationGate;
}

/**
 * The half of `ProtocolConnection` this router uses.
 *
 * Narrowed to the one method so that a caller -- production or test -- is
 * checked against what registration actually needs, rather than having to be a
 * whole connection or a cast pretending to be one.
 */
export interface NotificationRegistrar {
  onNotification<P>(type: NotificationType<P>, handler: (params: P) => void): Disposable;
}

/**
 * The identity function that gives an entry LIST the same inference the router
 * gives it, so a table can be built somewhere and registered elsewhere without
 * losing what makes it safe.
 *
 * WITHOUT THIS, extracting the table costs the property this router exists
 * beside: each handler's `params` is contextually typed BY THE `type` NEXT TO
 * IT, and a plain `return [...]` from a helper drops that -- measured, three
 * handlers fell to implicit `any` -- so a handler typed against the wrong
 * notification's params would stop being a compile error.
 */
export function defineNotifications<P extends readonly unknown[]>(entries: {
  readonly [K in keyof P]: NotificationEntry<P[K]>;
}): { readonly [K in keyof P]: NotificationEntry<P[K]> } {
  return entries;
}

/**
 * Registers every notification tsudoi answers, applying each entry's gate
 * around its handler.
 *
 * THE ROUTER KNOWS NOTHING ABOUT ANY PARTICULAR NOTIFICATION -- no name, no
 * carve-out, no set of exceptions. `exit` survives the gate because ITS ENTRY
 * says `always`, at one site, with the reason beside it. A second place that
 * knew which messages are special would be a second place to get it wrong.
 *
 * Registered with the notification TYPE rather than its method string:
 * vscode-jsonrpc dispatches both identically, but only the type carries the
 * arity and parameter-structure it logs a mismatch against.
 */
export function registerNotifications<P extends readonly unknown[]>(
  connection: NotificationRegistrar,
  lifecycle: Lifecycle,
  entries: { readonly [K in keyof P]: NotificationEntry<P[K]> },
): void {
  // THE ONE ERASURE, and it is confined to this loop. Each entry's own params
  // type is checked where the entry is WRITTEN, against the `type` beside it;
  // here they are a heterogeneous list, and no single element type describes
  // them without it. `gate` is deliberately outside it -- it is a string on
  // every entry, so the required-field check above survives this cast.
  const erased = entries as unknown as readonly NotificationEntry<unknown>[];
  for (const entry of erased) {
    connection.onNotification(entry.type as NotificationType<unknown>, (params: unknown) => {
      if (entry.gate === "lifecycle" && lifecycle.acceptsNotification() === false) {
        return;
      }
      entry.handler(params);
    });
  }
}

/**
 * A connection with NO MEMBER THAT OBSERVES INBOUND NOTIFICATION TRAFFIC on its
 * type. Which members those are is stated ONCE, in the `Omit` below, and each is
 * named rather than counted -- a count silently falsifies when the list grows,
 * and this list has grown twice:
 *
 * - `onNotification` installs a handler per method;
 * - `onUnhandledNotification` fires for everything nothing registered;
 * - `onProgress` installs a handler for `$/progress` under a token;
 * - `trace` hands a caller-supplied `Tracer` every notification a handler runs
 *   for, BEFORE that handler runs -- so before this module's gate, which lives
 *   inside the handler, decides anything.
 *
 * WHAT MAKES THAT SENTENCE SAYABLE IS AN ENUMERATION AND NOT A RECOLLECTION, and
 * the distinction is the whole point: `ProtocolConnection`'s member set is pinned
 * in test/notifications.test.ts, checked by `tsc --noEmit` against the
 * dependency's own connection.d.ts, so a member the dependency adds cannot arrive
 * silently. IT WAS RECALL THAT MISSED `onProgress` AND `trace` WHEN THE FIRST OF
 * THESE KEYS WENT IN; ENUMERATION IS WHAT FOUND THEM.
 *
 * AND THE PIN'S LIMITS, because the sentence above still outruns them, and they
 * are set out in full beside the pin rather than summarised away. The pin asserts
 * THE SET OF NAMES, never that no REMAINING member exposes traffic; it is a claim
 * about the INSTALLED dependency and not about the next release; and it pins the
 * TYPE, while the VALUE this module hands out is `createMessageConnection`'s
 * result unchanged and carries `onUnhandledProgress`, which sees every inbound
 * `$/progress` nothing claimed. THAT ONE IS REACHABLE ONLY BY A CAST, so it is
 * the deliberate-evasion class this module already accepts elsewhere -- but it is
 * why the opening sentence is bounded to what is ON THIS TYPE, and stops short of
 * saying nothing can observe traffic at all. Completeness remains a JUDGEMENT.
 * What changed is that it is now made against a list the compiler agrees is
 * complete.
 *
 * `onUnhandledNotification` is an EVENT PROPERTY holding a callable rather than
 * a method, which changes nothing here: `Omit` removes a property whatever its
 * type is, and calling it is what installs the listener.
 *
 * `Omit`, not a hand-written interface: the remainder then tracks whatever
 * `ProtocolConnection` grows, and only the members this narrowing is about are
 * named here.
 *
 * THE REMAINDER WAS MEASURED, not assumed, at each widening of this list, AND
 * THIS WIDENING IS NO EXCEPTION: EVERY surviving member was driven through the
 * narrowed type in one project at exit 0 -- `sendRequest` and `onRequest` each
 * in their with-params and without-params forms, `sendNotification`,
 * `sendProgress`, `hasPendingResponse`, `onError`, `onClose`, `onDispose`,
 * `listen`, `end` and `dispose`. `onRequest` has five overloads and `Omit` is a
 * mapped type; overload survival through one of those is exactly the thing worth
 * checking rather than reasoning about. THAT EXIT 0 WAS CHECKED FOR
 * DISCRIMINATION rather than trusted: appending an `onProgress` call to the same
 * project exits 1 on TS2551.
 *
 * WHAT BACKS THAT PARAGRAPH PERMANENTLY IS LESS THAN THE PARAGRAPH SAYS, and the
 * three tiers are worth separating. `onRequest` has a STANDING ASSERTION -- it is
 * the permitted half of every narrowed-connection probe in
 * test/notifications.test.ts. `sendProgress` and `listen` are reached only
 * because src/methods.ts and src/server.ts happen to call them, which is
 * INCIDENTAL COVERAGE and therefore not coverage: were those callers to stop, a
 * further key that broke them would pass unnoticed. AND `sendRequest`,
 * `sendNotification`, `hasPendingResponse`, `onError`, `onClose`, `onDispose`,
 * `end` and `dispose` ARE REACHED BY NOTHING EXECUTABLE AT ALL. The measurement
 * above is a one-off, and this sentence is what says so.
 *
 * A MISSPELLED KEY HERE IS A SILENT NO-OP, and it is why no probe defending
 * this type may DISCRIMINATE on a tsc exit code: `Omit<T, K>` accepts a key that
 * is not in `keyof T` and hands back T unchanged, so the misspelling compiles at
 * 0 with nothing objecting. MEASURED -- spelled `onUnhandledNotifcation`, the
 * probe's own type-check exits 0 and only assertions naming the SYMBOL redden.
 * test/notifications.test.ts matches each removed member BY NAME, and pins the
 * removed SET exactly.
 */
export type RequestOnlyConnection = Omit<
  ProtocolConnection,
  "onNotification" | "onUnhandledNotification" | "onProgress" | "trace"
>;

/**
 * The connection tsudoi serves on, with its notification table ALREADY
 * REGISTERED and every notification-observing member gone from what the caller
 * holds. Which members those are is named at `RequestOnlyConnection` above and
 * deliberately not repeated here, so this sentence cannot fall out of step with
 * that list the way its predecessor did.
 *
 * THE MODULE THAT OWNS THE GATE OWNS THE THING BEING GATED, and that is what
 * makes this the whole mechanism rather than a tidy-up: the caller cannot
 * NARROW A CONNECTION AFTER CREATING ONE, because the wide value would still be
 * in scope beside the narrow one. The only way the narrow handle is the only
 * handle is for the wide one never to be bound, so creation moves here.
 *
 * WHY A TYPE RATHER THAN A LINT, MEASURED AT REFINEMENT: oxlint 1.73.0 does not
 * merely fail to match on `no-restricted-syntax`, it FAILS TO PARSE that
 * config. `no-restricted-properties` does work, and matches the IDENTIFIER
 * `connection` -- so `const conn = connection` walks straight past it, and a
 * guard a rename evades forecloses nothing. A type cannot be renamed away, and
 * test/notifications.test.ts drives that exact alias rather than inferring it.
 *
 * THE RESIDUAL IS NOW DETECTED, AND THE DETECTOR LEANS ON THIS FUNCTION. This
 * type forecloses the call only while NO WIDE VALUE IS IN SCOPE: an
 * `import { createProtocolConnection }` added to src/server.ts puts one back,
 * and nothing here notices. MEASURED before any remedy existed, and the number
 * was the point -- src/server.ts rewritten to import it, register the table on
 * the WIDE value and call an ungated `onNotification` beside it ran at 331 tests
 * green, `tsc --noEmit` 0, `oxlint` 0. .oxlintrc.json now bans that import in
 * every file but this one: the lint route at a target where it works, since a
 * specifier cannot be renamed the way a variable can. A SECOND GAP rather than a
 * second guard on this one, which is what allowed closing it at all.
 *
 * AND THE DEBT THAT CREATES IS OWED BY THIS FUNCTION, which is why it is
 * recorded here rather than only beside the rule. That lint is a ROT DETECTOR,
 * NOT A BARRIER -- no rule can stop a module importing a third party's export --
 * and it is adequate ONLY BECAUSE WHAT THIS FUNCTION RETURNS IS THE SOLE
 * CONNECTION-SHAPED VALUE IN startServer's SCOPE, so importing a factory nothing
 * there needs is a conspicuous act rather than a slip. WIDEN THE RETURN
 * ANNOTATION, OR LET startServer BIND A WIDE CONNECTION AGAIN, AND THAT
 * SUFFICIENCY ARGUMENT GOES WITH IT while the lint still passes and still reads
 * like a guard. The probes in test/notifications.test.ts redden on the
 * annotation; NOTHING REDDENS ON THE ARGUMENT, so this paragraph is the only
 * thing that carries it.
 *
 * THE RETURN ANNOTATION BELOW IS A SEPARATE SEAM, and it was briefly written
 * off as part of the same residual before being measured: it is not. Widening
 * it to `ProtocolConnection` while leaving `RequestOnlyConnection` alone once
 * left EVERY probe green, tsc at 0 and 331 tests passing, with an ungated
 * `connection.onNotification` in src/server.ts compiling fine -- the
 * foreclosure entirely gone and nothing saying so. It is now asserted: a probe
 * takes its connection FROM THIS FUNCTION rather than binding the alias, and
 * that perturbation reddens it and it alone.
 *
 * SO NOTHING HERE IS UNGUARDED BY ACCIDENT ANY MORE: the type carries the
 * handle, the lint carries the import. What neither reaches is named at the
 * rule -- `await import(...)`, MEASURED to walk past it, and a WRAPPER exported
 * from this module, which is why test/notifications.test.ts asserts this module
 * exports no factory. Both are the deliberate-evasion class, not slips.
 *
 * THE THIRD GAP IS NOW CLOSED, AND IT WAS THE STRONGEST OF THE RESIDUALS THEN
 * KNOWN: `onUnhandledNotification` used to survive the `Omit`, and
 * reaching it needed NO DELIBERATE ACT -- it sat on the handle THIS FUNCTION
 * HANDS OUT, so `no longer reachable by accident`, the argument that made the
 * import ban adequate, never covered it. It was held open on ONE QUESTION,
 * whether anything wants that hook for DIAGNOSTICS, and that question was
 * already answered three sprints before it was asked: at Sprint 15 unregistered
 * notifications were MEASURED to produce ZERO BYTES, and that silence was
 * endorsed deliberately, so nothing wants it. The foreclosure is
 * reversible at the same one token it cost, so the diagnostic capability is
 * DEFERRED rather than surrendered.
 *
 * THE BOUNDARY THAT NARROWING CLAIMS: the members named in the `Omit` above are
 * foreclosed AND NOTHING ELSE IS. MEASURED as a SET DIFFERENCE rather than
 * sampled, and pinned by test/notifications.test.ts so that adding a key here
 * reddens rather than quietly widening this sentence's claim. `sendNotification`
 * survives and is not a gap at all -- that is SENDING a notification, not
 * installing a handler for one. NEITHER HALF OF THAT SENTENCE IS COUNTED, and
 * that is deliberate: `EXACTLY TWO MEMBERS` stood here and was falsified by the
 * very next widening.
 *
 * WHAT IT DOES NOT CLOSE, named so it is not read as closing more than it does.
 * The deliberate-evasion routes above are UNCHANGED -- `await import(...)`, and
 * a wrapper exported from this module -- as is the exemption in .oxlintrc.json
 * that switches the factory ban off in test files and test/helpers/. All remain
 * accepted residuals. THE ADEQUACY ARGUMENT RECORDED AT THAT RULE IS LIKEWISE
 * UNAFFECTED, checked rather than assumed: it rests on what this function
 * returns being the sole connection-shaped value in startServer's scope, and a
 * wider `Omit` widens that narrowing rather than moving it.
 *
 * THE TWO ROUTES ENUMERATION FOUND ARE NOW CLOSED, AND THE ENUMERATION IS THE
 * DURABLE PART. `ProtocolConnection`'s members are `sendRequest`, `onRequest`,
 * `sendNotification`, `onNotification`, `onProgress`, `sendProgress`, `trace`,
 * `onError`, `onClose`, `onUnhandledNotification`, `onDispose`, `end`,
 * `dispose`, `hasPendingResponse` and `listen` -- READ OFF
 * vscode-languageserver-protocol 3.18.2's connection.d.ts rather than recalled.
 * THAT LIST IS NO LONGER PROSE ALONE: test/notifications.test.ts asserts it as a
 * TYPE, so should it and the dependency ever disagree, `tsc --noEmit` fails at
 * that file and line. IT DOES NOT SAY WHICH NAME MOVED -- the diagnostic is
 * TS2344 on a boolean, and reading the two lists against each other is left to
 * whoever it stops. The version is still named, because the pin is a claim about
 * the INSTALLED version: package.json asks only for `^3.17.5`, and what `keyof`
 * is read from is whatever the lockfile put in node_modules.
 *
 * WHAT `trace` ACTUALLY SEES, CORRECTED AGAINST THE DEPENDENCY'S OWN SOURCE. The
 * sentence that stood here said `every received notification` and carried the
 * MEASURED label, and it is FALSE. At vscode-jsonrpc 9.0.1's
 * lib/common/connection.js `traceReceivedNotification` runs at three sites, and
 * the one on the ordinary notification path sits INSIDE
 * `if (notificationHandler || starNotificationHandler)`; the `else` branch fires
 * `unhandledNotificationEmitter` WITHOUT tracing. So a `Tracer` sees every
 * notification that HAS a handler, plus `$/cancelRequest` at the two cancel
 * sites -- COMPLEMENTARY to `onUnhandledNotification` rather than broader than
 * it. WHAT PUTS IT IN THE `Omit` IS ORDER AND NOT BREADTH: the trace call
 * precedes the handler, and this module's gate lives inside that handler, so a
 * tracer observes a gated notification whatever the gate then decides.
 *
 * WHY BOTH WENT, in the terms the earlier closures were argued in. Each sat on
 * the handle THIS FUNCTION HANDS OUT and needed NO DELIBERATE ACT, so
 * `no longer reachable by accident` never covered them. Neither is free the way
 * `onUnhandledNotification` was -- `$/progress` is how work-done reporting
 * arrives, and tracing is how a client asks to see the wire -- but neither is
 * REACHABLE BY THE PARTY WHO MIGHT WANT THEM: this type never leaves src/, and
 * src/types.ts -- the one path package.json exports, and so the whole of what a
 * config author is handed -- does not export it. The only party that could ask
 * is src/ ITSELF, which receives no `$/progress` at all and which at Sprint 15
 * measured `$/setTrace` inert and endorsed that silence deliberately -- recorded
 * at the logger in src/server.ts. Each foreclosure is reversible at the one
 * token it cost, so both capabilities are DEFERRED rather than surrendered.
 *
 * ============================================================================
 *
 * WHY TSUDOI DOES NOT SERVE ON `vscode-languageserver`'s `Connection`, AND IT IS
 * RECORDED HERE BECAUSE THIS IS THE LINE THE VIOLATING EDIT WOULD CHANGE: the
 * framework's `createConnection` would replace the `createProtocolConnection`
 * call below, and that one substitution is the whole of the adoption. GitHub
 * issue #1 holds the investigation; what follows is the DECISION, IN BOTH
 * COLUMNS, because a record that only carries the case against is an advocacy
 * document and not a decision record.
 *
 * HOW TO RE-RUN IT, and the first clause is what a reader would otherwise trip
 * over: `vscode-languageserver` IS NOT A DEPENDENCY OF THIS REPOSITORY, so
 * grepping node_modules for `Connection` finds nothing and proves nothing.
 * Install it OUT OF TREE and enumerate against that. MEASURED AT
 * vscode-languageserver 10.1.0, which pins vscode-languageserver-protocol
 * 3.18.2, with the TypeScript 5.9.3 compiler API's `getPropertiesOfType` rather
 * than by reading a list. ONE THROUGH FOUR BELOW WERE RE-RUN THAT WAY WHEN THIS
 * RECORD WAS WRITTEN. FIVE AND SIX WERE NOT -- they need a spawned server and a
 * live wire where these need only a type-check -- and they carry issue #1's
 * measurement, with the paths that make them re-runnable rather than repeated.
 *
 * ONE. `Connection` HAS 58 MEMBERS AND `onUnhandledNotification` AND `trace` ARE
 * NOT AMONG THEM (`Connection extends _Connection` at
 * lib/common/server.d.ts:767, the body at :359-766). Rebasing the `Omit` above
 * onto it would therefore hand back a type UNCHANGED IN TWO OF ITS FOUR KEYS --
 * the silent no-op this file already documents as a misspelling hazard, arriving
 * STRUCTURALLY rather than by typo. And it would arrive unseen: the two probes
 * in test/notifications.test.ts that name those members assert
 * `Property 'X' does not exist`, and that diagnostic STILL APPEARS under
 * `Connection` -- not because the `Omit` removed anything but because the member
 * was never there. TWO OF THE FOUR PROBES DEFENDING THIS BOUNDARY WOULD GO GREEN
 * WHILE MEASURING NOTHING. TypeScript even offers `Did you mean 'tracer'?`, and
 * `tracer` IS on the handle.
 *
 * TWO. NINE UNGATED NOTIFICATION REGISTRARS WOULD SURVIVE THAT `Omit` AT TOP
 * LEVEL, named rather than counted: `onInitialized`, `onDidOpenTextDocument`,
 * `onDidChangeTextDocument`, `onDidCloseTextDocument`, `onDidSaveTextDocument`,
 * `onWillSaveTextDocument`, `onDidChangeConfiguration`, `onDidChangeWatchedFiles`
 * and `onExit` -- each taking a `NotificationHandler` at
 * lib/common/server.d.ts:470-572, none consulting this module's gate. AND THE
 * NAMESPACES CARRY MORE: `workspace` has `onDidCreateFiles`, `onDidRenameFiles`
 * and `onDidDeleteFiles` (lib/common/fileOperations.d.ts:9-11) plus the
 * `onDidChangeWorkspaceFolders` event (lib/common/workspaceFolder.d.ts:5), and
 * `notebooks.synchronization` has four more (lib/common/notebook.d.ts:10).
 * `languages` carries registrars too but they are REQUESTS; `client`, `window`,
 * `console`, `telemetry` and `tracer` carry none. REACHING ANY OF THEM TAKES NO
 * DELIBERATE ACT, which is the very criterion this module uses to decide what to
 * foreclose.
 *
 * ISSUE #1'S ELEVEN IS CORRECTED HERE RATHER THAN REPEATED, since this is the
 * durable copy: that list named `onNotification`, which the `Omit` DOES remove
 * (lib/common/server.d.ts:411), and `onShutdown`, which takes a `RequestHandler0`
 * (:476) and registers a REQUEST. `onProgress` (:451) is likewise removed by the
 * `Omit`. Nine survive, and each of the nine is named above so that the sentence
 * cannot be falsified by the list growing.
 *
 * THREE. KEEPING THE GATE MEANS NOT USING THE FRAMEWORK'S LIFECYCLE HOOKS, AND
 * THAT TURNS OFF MOST OF WHAT THE FRAMEWORK IS FOR. src/server.ts must override
 * `InitializeRequest` -- the -32002 refusal lives there -- and vscode-jsonrpc's
 * `onRequest` REPLACES rather than chains. Overriding it skips
 * `watchDog.initialize(params)`, the `remote.initialize(capabilities)` loop and
 * the `fillServerCapabilities` loop (lib/common/server.js:724-775), so `console`,
 * `window`, `client` and `workspace` never receive the client's capabilities at
 * all. THE TRADE IS NOT PARTIAL: keep the gate and the framework goes largely
 * inert; take its forty-odd typed registrations and the ungated registrars come
 * with them.
 *
 * FOUR. `createConnection` TAKES NO LOGGER ARGUMENT. Every overload's trailing
 * parameter is `options?: ConnectionStrategy | ConnectionOptions`
 * (lib/node/main.d.ts:19, 28, 36, 43, 52, 60); the framework constructs a
 * `RemoteConsoleImpl` and passes THAT as the connection's logger
 * (lib/common/server.js:554), and its `error`/`warn`/`info`/`log` send
 * `window/logMessage` (lib/common/server.js:136-149). A notification handler's
 * failure would leave as a FRAMED PROTOCOL MESSAGE rather than on stderr, which
 * falsifies the first sentence of the logger block in src/server.ts.
 * `Features.console` restores it -- measured in issue #1, no cast, strict
 * type-check at 0 -- BUT IT MAKES STDOUT PURITY OPT-IN: omit the `features`
 * argument and the failure goes quiet AND onto the wire. THAT IS THE SAME SHAPE
 * AS AN UNGATED REGISTRAR, safe behaviour resting on memory rather than on
 * structure, which is why the remedy counts against rather than cancelling out.
 *
 * AND NOW THE OTHER COLUMN, WHICH IS NOT OPTIONAL: two rulings that stood
 * AGAINST adoption were measured FALSE, and they are recorded at the same weight
 * as the four above.
 *
 * FIVE. `fillServerCapabilities` ADDS NOTHING. On a bare
 * `createConnection(reader, writer)` -- no `Features`, no `ProposedFeatures` --
 * the `InitializeResult` on the wire was byte-identical to what the handler
 * returned, measured at EMPTY client capabilities AND at rich ones
 * (workspace/fileOperations, notebooks, semanticTokens, diagnostic, inlayHint,
 * callHierarchy, foldingRange, workspaceFolders); the rich arm is load-bearing
 * because `remote.initialize(capabilities)` runs BEFORE the fill loop. STRUCTURAL
 * RATHER THAN SAMPLED: every base remote's `fillServerCapabilities` is empty, the
 * single override in lib/common (workspaceFolder.js:28-31) only READS client
 * capabilities to set an internal flag and writes nothing, and `textDocumentSync`
 * is filled only when it is undefined/null or its `.change` is not numeric --
 * tsudoi clears both guards. SO src/server.ts's PER-METHOD CAPABILITY DERIVATION
 * WOULD SURVIVE ADOPTION INTACT. RESERVATION, self-reported at the measurement:
 * that is a property of 10.1.0's default remote set and NOT an invariant, so a
 * later release adding a remote that WRITES would pass unnoticed.
 *
 * SIX. `onShutdown` COEXISTS WITH THE -32600 REFUSAL. `watchDog.shutdownReceived
 * = true` is the FIRST STATEMENT of the framework's shutdown handler and runs
 * before the handler does (lib/common/server.js:767-775), so a handler that
 * throws cannot break the flag. Measured with tsudoi's own refusal logic on that
 * hook and no `exit` registered: initialize/shutdown/exit exits 0; a SECOND
 * shutdown is answered -32600 and exit is still 0; a hover after shutdown is
 * answered -32600 and exit is still 0. The earlier ruling that the framework's
 * exit path is unreachable behind tsudoi's refusal is FALSE.
 *
 * WHAT THE OTHER COLUMN COSTS, so it is not read as an unpriced win. Taking that
 * exit path requires DELETING the `exit` entry from the gated table, and that
 * entry is the only inhabitant of the `always` arm -- what follows from that is
 * written at the test which asserts it, in test/notifications.test.ts, rather
 * than here. Two further findings arrived with the same measurement and are
 * FILED RATHER THAN SETTLED: shutdown-before-initialize-then-exit is 1 today and
 * 0 through the framework, which no assertion in this suite catches; and
 * `watchDog.initialize(params)` starts an un-`unref`ed three-second interval when
 * `processId` is numeric, which the suite cannot observe because
 * test/helpers/lsp.ts sends `processId: null`.
 *
 * THE RULING, AND IT IS A CHOICE RATHER THAN A DEDUCTION: the gate is kept, so
 * the framework's server layer is not taken. Five and six say the price is real
 * -- capability derivation and the exit path would both have worked, and neither
 * is the blocker it was recorded as. What decides it is one and two: adoption
 * puts registrars nobody had to reach for back onto the handle THIS FUNCTION
 * HANDS OUT, and converts two of the four probes defending that handle into
 * assertions that pass while measuring nothing. REVERSE IT ON A MEASUREMENT AND
 * NOT ON A PREFERENCE -- if the framework grows a hook the gate can sit in, or if
 * the boundary here becomes a `Pick`, which forecloses by what is LISTED rather
 * than by what the base type happens to contain and so answers one and two
 * together. THREE AND FOUR WOULD SURVIVE A `Pick` UNCHANGED, so a `Pick` alone
 * does not reopen this.
 */
export function createGatedConnection<P extends readonly unknown[]>(
  reader: MessageReader,
  writer: MessageWriter,
  logger: Logger,
  lifecycle: Lifecycle,
  entries: { readonly [K in keyof P]: NotificationEntry<P[K]> },
): RequestOnlyConnection {
  // The one place the wide type is ever bound, and it does not escape this
  // function: the return annotation is what the caller gets.
  const connection = createProtocolConnection(reader, writer, logger);
  registerNotifications(connection, lifecycle, entries);
  return connection;
}
