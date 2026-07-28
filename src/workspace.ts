import type { WorkspaceFolder } from "vscode-languageserver-protocol";

/**
 * The workspace folder list, plus the handle that writes it.
 *
 * THE SAME SHAPE documents.ts USES, and for the same reason: this is state a
 * message WRITES and a request READS, so the writers live on the handle while
 * everything downstream holds only the value. A `let` in startServer served the
 * one writer it had; a second writer arriving from a notification is what this
 * shape is the answer to -- an entry in the notification table can be handed
 * this handle instead of reaching back into startServer's locals.
 *
 * The folders this session was opened with are EMPTY until `initialize`
 * arrives, which is the only moment a client states them -- and the reason they
 * are read there rather than handed to the config factory, which has already
 * run by then.
 */
export interface WorkspaceFoldersHandle {
  /**
   * The folders as of NOW.
   *
   * A function rather than a value because registration happens before
   * `initialize` does: whoever wires a handler holds nothing yet, and a value
   * captured at that moment would be the pre-initialize one forever.
   */
  readonly current: () => readonly WorkspaceFolder[];
  /**
   * What the client stated at `initialize`, already normalised to a list by the
   * caller -- which is where the protocol's two absent states are read, since
   * that is where `InitializeParams` is in hand.
   */
  initialize(folders: readonly WorkspaceFolder[]): void;
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];

  return {
    current: (): readonly WorkspaceFolder[] => folders,

    initialize(next: readonly WorkspaceFolder[]): void {
      folders = next;
    },
  };
}
