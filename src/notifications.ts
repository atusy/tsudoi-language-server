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
 * A connection with no `onNotification` ON ITS TYPE.
 *
 * `Omit`, not a hand-written interface: the remainder then tracks whatever
 * `ProtocolConnection` grows, and only the ONE member this narrowing is about
 * is named here.
 *
 * THE REMAINDER WAS MEASURED, not assumed, before this type existed --
 * `onRequest` with params and without, `sendProgress` and `listen` all compile
 * through it with no cast and no helper. `onRequest` has five overloads and
 * `Omit` is a mapped type; overload survival through one of those is exactly
 * the thing worth checking rather than reasoning about.
 */
export type RequestOnlyConnection = Omit<ProtocolConnection, "onNotification">;

/**
 * The connection tsudoi serves on, with its notification table ALREADY
 * REGISTERED and `onNotification` gone from what the caller holds.
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
 * A THIRD GAP, weaker and still real, AND NO ASSERTION BACKS THIS SENTENCE --
 * it is read off the remainder above, so what is at risk if it rots is only its
 * own accuracy: `onUnhandledNotification` SURVIVES the `Omit` and is an ungated
 * way to see notification traffic. It is weaker because it fires only for
 * messages nothing registered and carries no per-method dispatch. Deliberately
 * NOT added to the `Omit`: the accepted criterion is scoped to
 * `onNotification`, and widening it here would swap a reviewed boundary for an
 * unreviewed one. `sendNotification` survives too and is not a gap at all --
 * that is SENDING a notification, not installing a handler for one.
 *
 * ITS CLOSURE IS ONE TOKEN -- `Omit<..., "onNotification" | "onUnhandledNotification">`
 * -- AND THE OPEN QUESTION IS WHY IT IS NOT TAKEN YET: whether anything wants
 * that hook for DIAGNOSTICS. Removal is not obviously free, which is what keeps
 * this a question rather than an oversight.
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
