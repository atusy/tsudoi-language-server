import type {
  Disposable,
  NotificationType,
  NotificationType0,
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
 * WHAT THIS DOES NOT FORECLOSE, so nobody reads it as wider than it is: a
 * future edit that calls `connection.onNotification` directly bypasses this
 * file entirely. Foreclosing THAT needs a lint rule of the shape .oxlintrc.json
 * already carries, and no type can do it.
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
