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
 * `gate` is REQUIRED AND HAS NO DEFAULT, and that is the whole design. What it
 * replaced was a lifecycle check at the top of each handler body -- a
 * CONVENTION, which a fourth handler joins only if whoever writes it remembers.
 * That defence is re-homed HERE, since the checks themselves are gone:
 *
 * - what each check prevented: a document mutation applied BEFORE initialize
 *   (the server has no client state to apply it against) or AFTER shutdown (the
 *   session is over and the store is about to be discarded), so a client that
 *   mistimes a notification cannot leave the store holding a document the
 *   session never agreed to;
 * - and why a required field prevents it now: an entry that decides nothing
 *   does not TYPE-CHECK, so the realistic failure -- a new notification whose
 *   author never thought about the lifecycle -- is a compile error instead of a
 *   handler that silently runs in every state.
 *
 * A future edit calling `connection.onNotification` directly does not bypass
 * this file, and it takes no lint rule to say so: `createGatedConnection` below
 * is what stops it, since src/server.ts never holds a value that HAS an
 * `onNotification` to call. What that does and does not reach is named at that
 * function rather than repeated here.
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
 * IT, and a plain `return [...]` from a helper drops that -- handlers fall to
 * implicit `any` -- so a handler typed against the wrong notification's params
 * would stop being a compile error.
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
 * NAMED RATHER THAN COUNTED -- a count silently falsifies when the list grows:
 *
 * - `onNotification` installs a handler per method;
 * - `onUnhandledNotification` fires for everything nothing registered;
 * - `onProgress` installs a handler for `$/progress` under a token;
 * - `trace` hands a caller-supplied `Tracer` every notification a handler runs
 *   for, BEFORE that handler runs -- so before this module's gate, which lives
 *   inside the handler, decides anything. WHAT PUTS IT IN THE `Omit` IS ORDER
 *   AND NOT BREADTH: a `Tracer` sees every notification that HAS a handler, plus
 *   `$/cancelRequest`, which is COMPLEMENTARY to `onUnhandledNotification`
 *   rather than broader than it.
 *
 * THAT LIST IS AN ENUMERATION AND NOT A RECOLLECTION: `ProtocolConnection`'s
 * member set is pinned in test/notifications.test.ts, checked by `tsc --noEmit`
 * against the dependency's own connection.d.ts, so a member the dependency adds
 * cannot arrive silently.
 *
 * AND THE PIN'S LIMITS, because the sentence above still outruns them. The pin
 * asserts THE SET OF NAMES, never that no REMAINING member exposes traffic; it is
 * a claim about the INSTALLED dependency and not about the next release; and it
 * pins the TYPE, while the VALUE this module hands out is
 * `createMessageConnection`'s result unchanged and carries `onUnhandledProgress`,
 * which sees every inbound `$/progress` nothing claimed. THAT ONE IS REACHABLE
 * ONLY BY A CAST, so it is the deliberate-evasion class this module already
 * accepts elsewhere -- but it is why the opening sentence is bounded to what is
 * ON THIS TYPE, and stops short of saying nothing can observe traffic at all.
 * Completeness remains a JUDGEMENT, made against a list the compiler agrees is
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
 * A MISSPELLED KEY HERE IS A SILENT NO-OP, and it is why no probe defending
 * this type may DISCRIMINATE on a tsc exit code: `Omit<T, K>` accepts a key that
 * is not in `keyof T` and hands back T unchanged, so the misspelling compiles at
 * 0 with nothing objecting. test/notifications.test.ts matches each removed
 * member BY NAME, and pins the removed SET exactly.
 *
 * AND THAT IS WHY `Pick` IS THE BETTER INSTRUMENT FOR THIS BOUNDARY -- stated as
 * a PREFERENCE AND NOT A MANDATE. `Omit` names what must GO and trusts the base
 * type to contain it; `Pick` names what may STAY, so a name the base type does
 * not have is a compile error rather than a no-op. The failure becomes
 * UNREPRESENTABLE instead of merely detected. And it is not hypothetical: the
 * one base type anyone has proposed moving to is measured at
 * `createGatedConnection` below, and two of these four keys are not its members
 * at all.
 *
 * NOT A MANDATE TO CONVERT WHAT IS WRITTEN HERE, because today's `Omit` IS
 * DEFENDED and a change with no defect to fix is churn. TWO pins in
 * test/notifications.test.ts carry it and they carry DIFFERENT halves:
 * `ProtocolConnectionHasTheseMembers` reddens when the DEPENDENCY's member set
 * moves, `BoundaryIsTheObservingMembers` when the key set below moves.
 *
 * THE REVERSAL CONDITION, so this is a decision and not an opinion: IF EITHER
 * PIN IS REMOVED OR WEAKENED, CONVERSION BECOMES REQUIRED. They do not overlap
 * on the cases that matter here. A key naming something the base type does not
 * have -- the silent no-op, whether by typo or by rebasing onto a wider
 * connection -- moves only `BoundaryIsTheObservingMembers`, because the other
 * never mentions this type at all. A member the DEPENDENCY ADDS moves only
 * `ProtocolConnectionHasTheseMembers`, because the set difference the first
 * computes puts it on both sides and cancels it out. Between them the `Omit` has
 * a defence; with one of them gone it has half of one; and `Pick` needs neither,
 * which is the whole of its advantage.
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
 * WHY A TYPE RATHER THAN A LINT: oxlint 1.73.0 does not merely fail to match on
 * `no-restricted-syntax`, it FAILS TO PARSE that config.
 * `no-restricted-properties` does work, and matches the IDENTIFIER `connection`
 * -- so `const conn = connection` walks straight past it, and a guard a rename
 * evades forecloses nothing. A type cannot be renamed away, and
 * test/notifications.test.ts drives that exact alias rather than inferring it.
 *
 * THE RESIDUAL IS DETECTED RATHER THAN FORECLOSED, AND THE DETECTOR LEANS ON
 * THIS FUNCTION. This type forecloses the call only while NO WIDE VALUE IS IN
 * SCOPE: an `import { createProtocolConnection }` added to src/server.ts puts
 * one back, and nothing here notices -- src/server.ts rewritten to import it,
 * register the table on the WIDE value and call an ungated `onNotification`
 * beside it passes the suite, `tsc --noEmit` and `oxlint` alike, with nothing
 * objecting. .oxlintrc.json now bans that import in every file but this one: the
 * lint route at a target where it works, since a specifier cannot be renamed the
 * way a variable can. A SECOND GAP rather than a second guard on this one, which
 * is what allowed closing it at all.
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
 * THE RETURN ANNOTATION BELOW IS A SEPARATE SEAM, and it is asserted rather than
 * assumed: widening it to `ProtocolConnection` while leaving
 * `RequestOnlyConnection` alone leaves the foreclosure entirely gone with an
 * ungated `connection.onNotification` in src/server.ts compiling fine, so a
 * probe takes its connection FROM THIS FUNCTION rather than binding the alias,
 * and that perturbation reddens it and it alone.
 *
 * WHAT NEITHER THE TYPE NOR THE LINT REACHES: `await import(...)`, MEASURED to
 * walk past the rule, and a WRAPPER exported from this module, which is why
 * test/notifications.test.ts asserts this module exports no factory -- as is the
 * exemption in .oxlintrc.json that switches the factory ban off in test files
 * and test/helpers/. All are the deliberate-evasion class, not slips.
 *
 * THE BOUNDARY THAT NARROWING CLAIMS: the members named in the `Omit` above are
 * foreclosed AND NOTHING ELSE IS, pinned by test/notifications.test.ts so that
 * adding a key here reddens rather than quietly widening this sentence's claim.
 * `sendNotification` survives and is not a gap at all -- that is SENDING a
 * notification, not installing a handler for one. NEITHER HALF OF THAT SENTENCE
 * IS COUNTED, and that is deliberate: `EXACTLY TWO MEMBERS` stood here and was
 * falsified by the very next widening.
 *
 * NONE OF THOSE FOUR IS REACHABLE BY THE PARTY WHO MIGHT WANT IT: this type
 * never leaves src/, and src/types.ts -- the one path package.json exports, and
 * so the whole of what a config author is handed -- does not export it. Each
 * foreclosure is reversible at the one token it cost, so the capabilities behind
 * them -- diagnostics on unhandled notifications, `$/progress`, tracing -- are
 * DEFERRED rather than surrendered.
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
 * 3.18.2, with the TypeScript compiler API's `getPropertiesOfType` rather than
 * by reading a list.
 *
 * ONE. `Connection` HAS 58 MEMBERS AND `onUnhandledNotification` AND `trace` ARE
 * NOT AMONG THEM (`Connection extends _Connection` at
 * lib/common/server.d.ts:767, the body at :359-766). Rebasing the `Omit` above
 * onto it would therefore hand back a type UNCHANGED IN TWO OF ITS FOUR KEYS --
 * the silent no-op that type already documents as a misspelling hazard, arriving
 * STRUCTURALLY rather than by typo. And it would arrive unseen: the two probes
 * in test/notifications.test.ts that name those members assert
 * `Property 'X' does not exist`, and that diagnostic STILL APPEARS under
 * `Connection` -- not because the `Omit` removed anything but because the member
 * was never there. TWO OF THE FOUR PROBES DEFENDING THIS BOUNDARY WOULD GO GREEN
 * WHILE MEASURING NOTHING. TypeScript even offers `Did you mean 'tracer'?`, and
 * `tracer` IS on the handle.
 *
 * TWO. NINE UNGATED NOTIFICATION REGISTRARS WOULD SURVIVE THAT `Omit` AT TOP
 * LEVEL, each taking a `NotificationHandler` at lib/common/server.d.ts:470-572
 * and none consulting this module's gate. AND THE NAMESPACES CARRY MORE:
 * `workspace` takes a `NotificationHandler` at three file-operation hooks and
 * `notebooks.synchronization` at four more, while
 * `workspace.onDidChangeWorkspaceFolders` is an
 * `Event<WorkspaceFoldersChangeEvent>` PROPERTY whose subscription still
 * installs a listener this gate never sees. `languages` carries registrars too
 * and EVERY ONE OF THEM IS A REQUEST, measured across its nested namespaces
 * rather than inferred from its top level. REACHING ANY OF THE NOTIFICATION ONES
 * TAKES NO DELIBERATE ACT, which is the very criterion this module uses to
 * decide what to foreclose.
 *
 * THREE. KEEPING THE GATE MEANS NOT USING THE FRAMEWORK'S LIFECYCLE HOOKS, AND
 * THAT TURNS OFF MOST OF WHAT THE FRAMEWORK IS FOR. src/server.ts must override
 * `InitializeRequest` -- the -32002 refusal lives there -- and vscode-jsonrpc's
 * `onRequest` REPLACES rather than chains. Overriding it skips
 * `watchDog.initialize(params)`, the `remote.initialize(capabilities)` loop and
 * the `fillServerCapabilities` loop, so `console`, `window`, `client` and
 * `workspace` never receive the client's capabilities at all. THE TRADE IS NOT
 * PARTIAL: keep the gate and the framework goes largely inert; take its
 * forty-odd typed registrations and the ungated registrars come with them.
 *
 * FOUR. `createConnection` TAKES NO LOGGER ARGUMENT. Every overload's trailing
 * parameter is `options?: ConnectionStrategy | ConnectionOptions`; the framework
 * constructs a `RemoteConsoleImpl` and passes THAT as the connection's logger,
 * and its `error`/`warn`/`info`/`log` send `window/logMessage`. A notification
 * handler's failure would leave as a FRAMED PROTOCOL MESSAGE rather than on
 * stderr, which falsifies the first sentence of the logger block in
 * src/server.ts. `Features.console` restores it -- no cast, strict type-check at
 * 0 -- BUT IT MAKES STDOUT PURITY OPT-IN: omit the `features` argument and the
 * failure goes quiet AND onto the wire. THAT IS THE SAME SHAPE AS AN UNGATED
 * REGISTRAR, safe behaviour resting on memory rather than on structure, which is
 * why the remedy counts against rather than cancelling out.
 *
 * AND NOW THE OTHER COLUMN, WHICH IS NOT OPTIONAL: two rulings that stood
 * AGAINST adoption were measured FALSE, and they are recorded at the same weight
 * as the four above.
 *
 * FIVE. `fillServerCapabilities` ADDS NOTHING. On a bare
 * `createConnection(reader, writer)` -- no `Features`, no `ProposedFeatures` --
 * the `InitializeResult` on the wire was byte-identical to what the handler
 * returned, measured at EMPTY client capabilities AND at rich ones; the rich arm
 * is load-bearing because `remote.initialize(capabilities)` runs BEFORE the fill
 * loop. STRUCTURAL RATHER THAN SAMPLED: every base remote's
 * `fillServerCapabilities` is empty, the single override in lib/common only READS
 * client capabilities to set an internal flag and writes nothing, and
 * `textDocumentSync` is filled only when it is undefined/null or its `.change` is
 * not numeric -- tsudoi clears both guards. SO src/server.ts's PER-METHOD
 * CAPABILITY DERIVATION WOULD SURVIVE ADOPTION INTACT. RESERVATION,
 * self-reported at the measurement: that is a property of 10.1.0's default remote
 * set and NOT an invariant, so a later release adding a remote that WRITES would
 * pass unnoticed.
 *
 * SIX. `onShutdown` COEXISTS WITH THE -32600 REFUSAL. `watchDog.shutdownReceived
 * = true` is the FIRST STATEMENT of the framework's shutdown handler and runs
 * before the handler does, so a handler that throws cannot break the flag.
 * Measured with tsudoi's own refusal logic on that hook and no `exit`
 * registered: initialize/shutdown/exit exits 0; a SECOND shutdown is answered
 * -32600 and exit is still 0; a hover after shutdown is answered -32600 and exit
 * is still 0.
 *
 * WHAT THE OTHER COLUMN COSTS, so it is not read as an unpriced win. Taking that
 * exit path requires DELETING the `exit` entry from the gated table, and that
 * entry is the only inhabitant of the `always` arm -- what follows from that is
 * written at the test which asserts it, in test/notifications.test.ts. AND ONE
 * FINDING IS STILL FILED: `watchDog.initialize(params)` starts an un-`unref`ed
 * three-second interval when `processId` is numeric -- exactly the hazard
 * src/server.ts's unref requirement is about -- which the suite cannot observe
 * because test/helpers/lsp.ts sends `processId: null`.
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
