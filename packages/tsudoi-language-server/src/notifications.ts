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
 * entitled to send at any moment -- `exit` is the only one today, and the reason
 * it is one lives at its entry rather than here.
 *
 * HERE AND NOT IN src/types.ts, WHICH IS WHERE IT LIVED WHILE A CONFIG AUTHOR
 * DECLARED ONE: a custom method's author declares no gate now, so publishing this
 * would be a name on tsudoi's surface that nobody outside src/ can write.
 */
export type NotificationGate = "lifecycle" | "always";

/**
 * One notification tsudoi answers: what it is, what to do with it, and WHEN it
 * may run.
 *
 * `gate` is REQUIRED AND HAS NO DEFAULT, and that is the whole design: the
 * alternative is a lifecycle check at the top of each handler body -- a
 * CONVENTION, which a new handler joins only if whoever writes it remembers.
 * An entry that decides nothing does not TYPE-CHECK, so the realistic failure --
 * a new notification whose author never thought about the lifecycle -- is a
 * compile error instead of a handler that silently runs in every state.
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
  /** Serializes the complete built-in-to-custom operation for one state key. */
  readonly queue?: (params: P) => string;
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
  /**
   * THE SAME DOOR, FOR A NAME TSUDOI DOES NOT KNOW. A config may declare a
   * notification tsudoi never enumerated; there is no `NotificationType` to
   * register it under, only the name the author wrote. It enters HERE rather
   * than through a connection of its own, because the gate is applied where
   * registration happens and a second registrar would be a second place to
   * forget it.
   */
  onNotification(method: string, handler: (params: unknown) => void): Disposable;
}

/**
 * The identity function that gives an entry LIST the same inference the router
 * gives it, so a table can be built somewhere and registered elsewhere without
 * losing what makes it safe: each handler's `params` is contextually typed BY
 * THE `type` NEXT TO IT, and a plain `return [...]` from a helper drops that.
 */
export function defineNotifications<P extends readonly unknown[]>(entries: {
  readonly [K in keyof P]: NotificationEntry<P[K]>;
}): { readonly [K in keyof P]: NotificationEntry<P[K]> } {
  return entries;
}

/**
 * ONE NOTIFICATION A CONFIG DECLARED, as the router needs it: a NAME, a gate,
 * and something to run.
 *
 * A NAME AND NOT A `NotificationType`, which is the shape that looks equivalent
 * and is not: upstream reads a request or notification type's declared arity
 * before dispatching, so a synthesized type would have tsudoi decide how many
 * params a method it never designed carries -- and refuse the client's message
 * when it decided wrong. A bare name leaves that to the author and their client,
 * who are the two parties that agreed on it.
 *
 * THE HANDLER IS ALREADY BOUND TO ITS CONTEXT by whoever built this, because
 * this module must not know what a config author receives -- it knows WHEN a
 * message may run, and nothing else.
 */
export interface CustomNotificationEntry {
  readonly method: string;
  readonly gate: NotificationGate;
  readonly run: (params: unknown) => Promise<void>;
}

/**
 * Registers every notification tsudoi answers -- its own table AND whatever the
 * config declared -- applying each entry's gate around its handler.
 *
 * THE ROUTER KNOWS NOTHING ABOUT ANY PARTICULAR NOTIFICATION -- no name, no
 * carve-out, no set of exceptions. `exit` survives the gate because ITS ENTRY
 * says `always`, at one site, with the reason beside it. A second place that
 * knew which messages are special would be a second place to get it wrong.
 *
 * ONE LOOP AND ONE GATE FOR BOTH SOURCES, which is the whole reason a config's
 * notifications arrive here rather than being registered wherever they were
 * read. A second registrar would be a second place to forget the gate, and the
 * lint entry banning the connection factory records what was MEASURED before it
 * existed: an ungated `onNotification` beside the table ran green on every check
 * with nothing objecting.
 */
export function registerNotifications<P extends readonly unknown[]>(
  connection: NotificationRegistrar,
  lifecycle: Lifecycle,
  entries: { readonly [K in keyof P]: NotificationEntry<P[K]> },
  custom: readonly CustomNotificationEntry[] = [],
): void {
  // THE ONE ERASURE, and it is confined to this loop. `gate` is deliberately
  // outside it -- it is a string on every entry, so the required-field check
  // above survives this cast.
  const erased = entries as unknown as readonly NotificationEntry<unknown>[];
  const customByMethod = new Map(custom.map((entry) => [entry.method, entry]));
  const queueTails = new Map<string, Promise<void>>();
  const merged: readonly {
    readonly key: NotificationType<unknown> | string;
    readonly gate: NotificationGate;
    readonly run: (params: unknown) => unknown;
    readonly queue?: (params: unknown) => string;
  }[] = [
    ...erased.map((entry) => {
      const key = entry.type as NotificationType<unknown>;
      const hook = customByMethod.get(key.method);
      if (hook === undefined) {
        return { key, gate: entry.gate, run: entry.handler, queue: entry.queue };
      }
      customByMethod.delete(key.method);
      return {
        key,
        gate: entry.gate,
        run: (params: unknown) =>
          Promise.resolve()
            .then(() => entry.handler(params))
            .then(() => hook.run(params)),
        queue: entry.queue,
      };
    }),
    ...[...customByMethod.values()].map((entry) => ({
      key: entry.method,
      gate: entry.gate,
      run: entry.run,
    })),
  ];

  const enqueue = (key: string, run: () => unknown): Promise<unknown> => {
    const preceding = queueTails.get(key) ?? Promise.resolve();
    const operation = preceding.then(run);
    const tail = operation.then(
      () => undefined,
      () => undefined,
    );
    queueTails.set(key, tail);

    const release = (): void => {
      if (queueTails.get(key) === tail) {
        queueTails.delete(key);
      }
    };
    return operation.then(
      (value) => {
        release();
        return value;
      },
      (error: unknown) => {
        release();
        throw error;
      },
    );
  };

  for (const entry of merged) {
    // RETURNED RATHER THAN DROPPED, and it is the one thing this wrapper does
    // besides gating: upstream AWAITS what a notification handler hands back, so
    // a config's promise returned here is observed and a promise dropped here
    // rejects with nobody listening. tsudoi's own table entries return nothing,
    // and returning nothing is what upstream then awaits.
    const gated = (params: unknown): unknown => {
      if (entry.gate === "lifecycle" && lifecycle.acceptsNotification() === false) {
        return undefined;
      }
      if (entry.queue !== undefined) {
        return enqueue(entry.queue(params), () => entry.run(params));
      }
      return entry.run(params);
    };
    // BRANCHED ON THE KEY AND NOT ON THE ENTRY'S ORIGIN, because the two calls
    // differ only in which OVERLOAD they reach: a union satisfies neither, and
    // resolving it here is what keeps the gate above written once.
    if (typeof entry.key === "string") {
      connection.onNotification(entry.key, gated);
    } else {
      connection.onNotification(entry.key, gated);
    }
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
 *   AND NOT BREADTH.
 *
 * The claim is bounded to what is ON THIS TYPE; what the VALUE carries beyond it
 * is at `ProtocolConnectionHasTheseMembers` in test/notifications.test.ts.
 *
 * A MISSPELLED KEY HERE IS A SILENT NO-OP: `Omit<T, K>` tolerates a key outside
 * `keyof T` where `Pick`'s `K extends keyof T` refuses one. SO `Pick` IS THE
 * BETTER INSTRUMENT FOR THIS BOUNDARY -- a PREFERENCE AND NOT A MANDATE,
 * because a change with no defect to fix is churn and THIS hazard is already
 * caught: MEASURED, the spawned probes in test/notifications.test.ts redden on
 * a misspelled key with `BoundaryIsTheObservingMembers` deleted, and
 * `ProtocolConnectionHasTheseMembers` is silent under one. THOSE TWO PINS EARN
 * THEIR PLACE ELSEWHERE -- a SURPLUS key, and a member NAME arriving, going or
 * being renamed upstream. That second one is narrower than `the dependency
 * moved`: growth under an EXISTING name reddens neither pin, which that pin's
 * own docblock says. WHICH IS WHY THE REVERSAL CONDITION NAMES THEM AND NOT
 * THIS PARAGRAPH'S HAZARD: IF EITHER PIN IS REMOVED OR WEAKENED, CONVERSION
 * BECOMES REQUIRED. `Pick` needs neither of them.
 */
export type RequestOnlyConnection = Omit<
  ProtocolConnection,
  "onNotification" | "onUnhandledNotification" | "onProgress" | "trace"
>;

/**
 * The connection tsudoi serves on, with its notification table ALREADY
 * REGISTERED and every notification-observing member gone from what the caller
 * holds.
 *
 * THE MODULE THAT OWNS THE GATE OWNS THE THING BEING GATED, and that is what
 * makes this the whole mechanism rather than a tidy-up: the caller cannot
 * NARROW A CONNECTION AFTER CREATING ONE, because the wide value would still be
 * in scope beside the narrow one. The only way the narrow handle is the only
 * handle is for the wide one never to be bound, so creation moves here.
 *
 * THE RESIDUAL IS DETECTED RATHER THAN FORECLOSED, AND THE DETECTOR LEANS ON
 * THIS FUNCTION. An `import { createProtocolConnection }` added to src/server.ts
 * puts a wide value back and no type notices, so .oxlintrc.json bans that import
 * in every file but this one. THAT LINT IS A ROT DETECTOR, NOT A BARRIER, and it
 * is adequate ONLY BECAUSE NO WIDE CONNECTION IS BOUND IN startServer's SCOPE:
 * what would be conspicuous there is a factory import nothing needs. It is NOT
 * that the narrow handle is the sole connection-shaped value -- `withFallback`
 * is a second binding of this function's return, re-typed. WIDEN THE RETURN
 * ANNOTATION, OR LET startServer BIND A WIDE CONNECTION AGAIN, AND THAT
 * SUFFICIENCY ARGUMENT GOES WITH IT while the lint still passes and still reads
 * like a guard. NOTHING REDDENS ON THE ARGUMENT.
 *
 * WHAT NEITHER THE TYPE NOR THE LINT REACHES: `await import(...)`, and a WRAPPER
 * exported from this module. Both are the deliberate-evasion class, not slips.
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
 * WHILE MEASURING NOTHING.
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
 * `onRequest` REPLACES rather than chains, so `watchDog.initialize(params)`, the
 * `remote.initialize(capabilities)` loop and the `fillServerCapabilities` loop
 * are all skipped. THE TRADE IS NOT PARTIAL: keep the gate and the framework
 * goes largely inert; take its typed registrations and the ungated registrars
 * come with them.
 *
 * FOUR. `createConnection` TAKES NO LOGGER ARGUMENT; it constructs a
 * `RemoteConsoleImpl` and passes THAT as the connection's logger, whose
 * `error`/`warn`/`info`/`log` send `window/logMessage`. A notification handler's
 * failure would leave as a FRAMED PROTOCOL MESSAGE rather than on stderr, which
 * falsifies the first sentence of the logger block in src/server.ts.
 * `Features.console` restores it BUT MAKES STDOUT PURITY OPT-IN: omit the
 * `features` argument and the failure goes quiet AND onto the wire. THAT IS THE
 * SAME SHAPE AS AN UNGATED REGISTRAR, safe behaviour resting on memory rather
 * than on structure, which is why the remedy counts against rather than
 * cancelling out.
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
 * client capabilities, and `textDocumentSync` is filled only when it is
 * undefined/null or its `.change` is not numeric -- tsudoi clears both guards. SO
 * src/server.ts's PER-METHOD CAPABILITY DERIVATION WOULD SURVIVE ADOPTION INTACT.
 * RESERVATION, self-reported at the measurement: that is a property of 10.1.0's
 * default remote set and NOT an invariant, so a later release adding a remote
 * that WRITES would pass unnoticed.
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
  custom: readonly CustomNotificationEntry[] = [],
): RequestOnlyConnection {
  const connection = createProtocolConnection(reader, writer, logger);
  registerNotifications(connection, lifecycle, entries, custom);
  return connection;
}
