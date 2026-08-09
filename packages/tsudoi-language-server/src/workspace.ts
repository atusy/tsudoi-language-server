import { isAbsolute } from "node:path";
import type {
  InitializeParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver-protocol";
import type { Tsudoi, WorkspaceFolderStore } from "./types.ts";

/**
 * The workspace folder list, plus the handle that writes it -- the same split
 * `DocumentStoreHandle` makes, and for the same reason: this is state a message
 * WRITES and a request READS, so the writers live on the handle and the store
 * everything downstream holds is read-only by construction.
 */
export interface WorkspaceFoldersHandle {
  /** The folders as of NOW, as the store `Tsudoi` publishes them. */
  readonly folders: WorkspaceFolderStore;
  /**
   * The two deprecated root fields, `rootUri` as the client spelled it and
   * `rootPath` only where it is absolute.
   *
   * A READER WHERE `folders` ABOVE IS A VALUE: a store answers WHEN ASKED, while
   * these two are read out on the spot, and they are both `null` UNTIL
   * `initialize` runs. Whoever wires this handle holds it before then, so
   * something read off here at construction would be that `null` for the life of
   * the session.
   *
   * TYPED AS THE SLICE OF `Tsudoi` IT ANSWERS FOR, so that a field added here
   * and forgotten on that surface, or the reverse, does not compile.
   */
  readonly roots: () => Pick<Tsudoi, "rootUri" | "rootPath">;
  /**
   * What the client sent at `initialize`, MIRRORED AND NOT INTERPRETED.
   *
   * `| null` IS THIS HANDLE STAYING TOTAL AND NOT A CLAIM ABOUT THE WIRE: a
   * `"params": null` is refused -32602 at the `initialize` boundary in
   * src/server.ts, so no client reaches here by sending it. What the arm buys is
   * that the refusal is that boundary's job alone, and a caller that named
   * nothing is mirrored as having named nothing.
   */
  initialize(
    params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath"> | null,
  ): void;
  /** What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is the notification table's business, decided once at the entry. */
  change(event: WorkspaceFoldersChangeEvent): void;
}

/**
 * THE LOCATION a uri names, as the one string BOTH SIDES of the lookup are put
 * into, or `undefined` where no parser accepts it. `unknown` rather than
 * `string` because both callers can be handed a non-uri: the mirror passes a
 * non-conforming entry through, and `get` takes whatever a config author passes.
 */
function locationOf(uri: unknown): string | undefined {
  if (typeof uri !== "string") {
    return undefined;
  }
  try {
    const parsed = new URL(uri);
    if (!parsed.pathname.endsWith("/")) {
      parsed.pathname = `${parsed.pathname}/`;
    }
    return parsed.href;
  } catch {
    return undefined;
  }
}

/**
 * THE TWO ENDS OF THE RANGE OF LOCATIONS ABOVE `uri`: the directory it sits in,
 * and the root of the authority that directory belongs to. `undefined` where no
 * parser accepts the uri, and where the uri names no hierarchy at all.
 *
 * THE RANGE IS EXACTLY A STRING INTERVAL, and that is the property `get` reads
 * it with: `innermost` is a canonical directory href, so the only `/` in it are
 * its path separators -- an encoded one arrives as `%2F` -- and it carries no
 * query and no fragment, since `new URL(".", …)` resolves against the base
 * without them. A location is an ancestor of `uri` EXACTLY WHEN it ends in `/`,
 * `innermost` starts with it, and it starts with `root`. Deeper is longer.
 */
function ancestryOf(
  uri: string,
): { readonly innermost: string; readonly root: string } | undefined {
  try {
    return { innermost: new URL(".", uri).href, root: new URL("/", uri).href };
  } catch {
    return undefined;
  }
}

/**
 * The folders the client holds, filed under the location each one names, in
 * mirror order within each entry.
 */
function locationIndex(
  folders: readonly WorkspaceFolder[],
): ReadonlyMap<string, readonly WorkspaceFolder[]> {
  const index = new Map<string, WorkspaceFolder[]>();
  for (const folder of folders) {
    const location = locationOf((folder as { readonly uri?: unknown } | null | undefined)?.uri);
    if (location === undefined) {
      continue;
    }
    const held = index.get(location);
    if (held === undefined) {
      index.set(location, [folder]);
    } else {
      held.push(folder);
    }
  }
  for (const held of index.values()) {
    Object.freeze(held);
  }
  return index;
}

/** The answer for a uri no folder covers, SHARED AND SEALED. */
const noFolders: readonly WorkspaceFolder[] = Object.freeze([]);

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = noFolders;
  let index: ReadonlyMap<string, readonly WorkspaceFolder[]> = new Map();
  let roots: Pick<Tsudoi, "rootUri" | "rootPath"> = { rootUri: null, rootPath: null };

  /**
   * THE ONE PLACE THE MIRROR IS WRITTEN, so that the index cannot be left
   * answering about a list that is gone, and the one place it is SEALED, so that
   * no later writer has a freeze of its own to forget.
   */
  function mirror(next: readonly WorkspaceFolder[]): void {
    for (const folder of next) {
      Object.freeze(folder);
    }
    folders = Object.freeze(next);
    index = locationIndex(next);
  }

  const store: WorkspaceFolderStore = Object.freeze({
    get: (uri: string): readonly Readonly<WorkspaceFolder>[] => {
      // THE DEEPEST LOCATION THAT ANSWERS, AND EVERY FOLDER AT IT. The uri's own
      // location is asked first and the ancestors are taken longest-first.
      //
      // `location.endsWith("/")` IS COMPENSATED BY THE PARSE AND IS WRITTEN
      // ANYWAY: drop it and no row of the table moves, since a location that is
      // not a directory cannot be a prefix of one -- an OPAQUE path never begins
      // with `/` where a hierarchical href always does, and a location carrying a
      // query or a fragment carries a literal `?` or `#` that no canonical
      // directory holds. It stays because the three clauses TOGETHER are what
      // `ancestor` MEANS here, and dropping one leaves the meaning resting on two
      // properties of the URL Standard a reader would have to reconstruct.
      const self = locationOf(uri);
      if (self !== undefined) {
        const held = index.get(self);
        if (held !== undefined) {
          return held;
        }
      }
      const ancestry = ancestryOf(uri);
      if (ancestry === undefined) {
        return noFolders;
      }
      let deepest: readonly WorkspaceFolder[] = noFolders;
      let depth = 0;
      for (const [location, held] of index) {
        if (
          location.length > depth &&
          location.endsWith("/") &&
          ancestry.innermost.startsWith(location) &&
          location.startsWith(ancestry.root)
        ) {
          deepest = held;
          depth = location.length;
        }
      }
      return deepest;
    },
    values: (): Iterable<Readonly<WorkspaceFolder>> => folders,
  });

  return {
    folders: store,

    roots: (): Pick<Tsudoi, "rootUri" | "rootPath"> => roots,

    initialize(
      params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath"> | null,
    ): void {
      // A NON-ABSOLUTE `rootPath` IS REFUSED HERE RATHER THAN FORWARDED, which is
      // the one place this handle declines to pass something on. Why a relative
      // path is not a root, and what the refusal costs an author, is at
      // `Tsudoi.rootPath`. NOT A BREACH OF THE MIRROR -- refusing to NORMALISE
      // what a client meant does not oblige us to forward a value the author
      // cannot correctly use, and `absence must never become a root` bounds the
      // dangerous direction while this turns a root into absence.
      //
      // NOT EXTENDED TO `rootUri`, and nothing reddens if you extend it: a
      // `vscode-remote://` or `ssh://` root is a VALID URI that merely names no
      // LOCAL path, so refusing it would hide a legitimate value from an author
      // who handles that scheme.
      mirror(Array.isArray(params?.workspaceFolders) ? params.workspaceFolders : []);
      const rootPath = params?.rootPath ?? null;
      roots = {
        rootUri: params?.rootUri ?? null,
        rootPath: typeof rootPath === "string" && isAbsolute(rootPath) ? rootPath : null,
      };
    },

    change(event: WorkspaceFoldersChangeEvent): void {
      // WHICH copy a `removed` entry takes is deliberately not pinned and
      // nothing may rely on it.
      const remaining = [...folders];
      for (const folder of event.removed) {
        const index = remaining.findIndex((held) => held.uri === folder.uri);
        if (index !== -1) {
          remaining.splice(index, 1);
        }
      }
      mirror([...remaining, ...event.added]);
    },
  };
}
