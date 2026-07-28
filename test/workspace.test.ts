import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  CompletionItem,
  Hover,
  InitializeResult,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import {
  bunRuntime,
  denoRuntime,
  initializeParams,
  LspSession,
  type Runtime,
} from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture, repoRoot } from "./helpers/spawn.ts";
import { tree } from "./helpers/tree.ts";

const echoConfig = fixture("workspace-folders.ts");
const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * The document every session here opens. Its directory DOES NOT EXIST, so the
 * example's document-relative source contributes nothing and an item can be
 * attributed to cwd or to the workspace without a third source in the way.
 */
const uri = "file:///workspace/a.txt";

/**
 * TWO folders, not one: the field is an array on the wire, so an
 * implementation keeping only the first satisfies a single-folder assertion
 * while losing everything a client sent after it.
 *
 * Paths that need not exist: what a folder MEANS is the config author's
 * business, and tsudoi's claim is only that it hands over what arrived.
 */
const sentFolders: WorkspaceFolder[] = [
  { uri: "file:///home/me/project", name: "project" },
  { uri: "file:///home/me/notes", name: "notes" },
];

/**
 * The folder a client adds mid-session -- a THIRD path, distinct from both
 * `sentFolders`, so that an implementation appending it cannot be confused with
 * one that never applied the change at all.
 */
const addedFolder: WorkspaceFolder = { uri: "file:///home/me/added", name: "added" };

/**
 * ONE DIRECTORY, TWO SPELLINGS, and they are TWO FOLDERS here.
 *
 * MEASURED against Neovim, adding four folders and removing three: it accepts
 * `…/plain` and `…/plain/` as different folders, and removing `…/plain` leaves
 * `…/plain/` in place. Also measured, and it is what makes a plain string
 * filter correct for this client: every `removed` URI arrives BYTE-IDENTICAL to
 * the `added` one it refers to.
 *
 * So this pair is not a curiosity -- it is the case an implementation that
 * NORMALISES gets wrong by deleting a folder the client still holds. THE
 * WORKSPACE FOLDER LIST IS CLIENT STATE WE MIRROR, NOT FILESYSTEM STATE WE
 * INTERPRET.
 */
/**
 * THE SAME URI AS `addedFolder` UNDER A DIFFERENT NAME, which is how a client
 * would spell a rename if LSP had a rename event. It has none: a client wanting
 * one sends `removed` then `added`, so this arriving as an `added` alone says
 * the client now holds that folder twice, and tsudoi reconciles by neither URI
 * nor name.
 */
const addedAgain: WorkspaceFolder = { uri: addedFolder.uri, name: "added again" };

const plainFolder: WorkspaceFolder = { uri: "file:///home/me/plain", name: "plain" };
const plainSlashFolder: WorkspaceFolder = { uri: "file:///home/me/plain/", name: "plain-slash" };

/**
 * What the handler observed ON ITS OWN RequestContext, read back through the
 * fixture's hover.
 *
 * `undefined` when the field was absent, which is the state the normalisation
 * criteria exist to rule out -- so this deliberately does NOT default it away.
 */
async function observedFolders(session: LspSession): Promise<unknown> {
  const hover = await session.request<Hover>("textDocument/hover", {
    textDocument: { uri },
    position: { line: 0, character: 0 },
  });
  const contents = hover.contents as { value?: string };
  const observation = JSON.parse(contents.value ?? "{}") as { workspaceFolders?: unknown };
  return observation.workspaceFolders;
}

/**
 * `workspace/didChangeWorkspaceFolders` as a client sends it.
 *
 * Both arms are always spelled, empty when nothing moved, because the protocol
 * declares them as arrays rather than optionals -- and a helper that omitted
 * one would be testing tsudoi against a client shape no client sends.
 *
 * DELIVERED BY ORDERING, never by a timing bound: this is a notification
 * written to the same stdin as the request that reads the result back, and the
 * server frames what it is sent in order. Nothing here sleeps.
 */
function changeFolders(
  session: LspSession,
  event: { added?: readonly WorkspaceFolder[]; removed?: readonly WorkspaceFolder[] },
): void {
  session.notify("workspace/didChangeWorkspaceFolders", {
    event: { added: event.added ?? [], removed: event.removed ?? [] },
  });
}

/**
 * A session running the EXAMPLE config from a cwd of the test's choosing.
 *
 * startCommand, not start: `start` spells the CLI path relative to the repo,
 * and every session below needs a cwd that is NOT the repo. Forcing cwd apart
 * from the workspace is the only way to attribute an item to one of them --
 * and it is a SYNTHETIC ISOLATION STATE, never an observed editor one, since
 * nvim spawns the server with cwd = root_dir whenever it found a root.
 */
function exampleSession(runtime: Runtime, cwd: string): LspSession {
  return LspSession.startCommand(
    `${runtime.command} ${runtime.runArgs.join(" ")} ${join(repoRoot, "src", "cli.ts")} --config ${demoConfig}`,
    cwd,
  );
}

/**
 * Initialises with `folders` -- omitting the field entirely when they are
 * undefined, which is what a client that opened no workspace sends -- and
 * opens `line` as the session's one document.
 */
async function openWith(
  session: LspSession,
  folders: readonly WorkspaceFolder[] | undefined,
  line: string,
): Promise<void> {
  await session.request<InitializeResult>(
    "initialize",
    folders === undefined ? initializeParams : { ...initializeParams, workspaceFolders: folders },
  );
  session.notify("initialized", {});
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text: line },
  });
}

/** One completion at the end of `line`, aggregated as a client without a token sees it. */
async function completeAt(session: LspSession, line: string): Promise<CompletionItem[]> {
  const result = await session.request<CompletionItem[] | null>("textDocument/completion", {
    textDocument: { uri },
    position: { line: 0, character: line.length },
  });
  return result ?? [];
}

/** What each item puts in the buffer. */
function inserted(items: readonly CompletionItem[]): string[] {
  return items.map((item) => item.insertText ?? "").sort();
}

/** An item's documentation as markdown text, or "" when it carries none. */
function documentationOf(item: CompletionItem): string {
  const documentation = item.documentation;
  return typeof documentation === "string" ? documentation : (documentation?.value ?? "");
}

/**
 * The items attributed to a WORKSPACE root, read off `documentation`.
 *
 * Used for the absence half AND the presence half, deliberately the same
 * function: a `nothing came from a workspace` assertion measured by a filter
 * that can never match anything is satisfied by a broken measurement.
 */
function workspaceItems(items: readonly CompletionItem[]): CompletionItem[] {
  return items.filter((item) => documentationOf(item).includes("source: workspace"));
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // CRITERION 1's positive half, and the PERMANENT PAIR for every absence
    // assertion below: the same fixture, the same hover, the same reader. A
    // `the handler observed an empty list` claim measured by a path that can
    // never observe anything is satisfied by a broken measurement.
    test("a handler observes the workspace folders the client sent at initialize", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: sentFolders,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual(sentFolders);
      } finally {
        session.dispose();
      }
    });

    // CRITERION 1's NEGATIVE CONTROL and criterion 2's first absent state. The
    // client omits the field entirely, which is what `initializeParams` -- the
    // smallest conforming client this suite has -- already sends.
    //
    // toEqual([]) and never a truthiness check: `undefined` is what arrives
    // unnormalised, and every `for` a config author writes over it throws
    // rather than looping zero times.
    test("a client sending no workspaceFolders leaves the handler observing an empty array", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    // THE SECOND ABSENT STATE, split from the first rather than bundled with
    // it: `workspaceFolders` is declared `WorkspaceFolder[] | null` AND
    // optional, so a client may spell `no workspace` either way, and a
    // normalisation covering one of them passes a test that only sends the
    // other. One test per spelling is what lets a perturbation aimed at null
    // be seen to leave the omitted case green.
    test("a client sending a null workspaceFolders leaves the handler observing an empty array", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: null,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    // PBI-17 CRITERION 1. The client opened with one folder and added a second
    // WHILE THE SESSION WAS RUNNING, which is what `add_workspace_folder()`
    // sends. The handler must see the workspace as it is NOW.
    //
    // ITS NEGATIVE CONTROL IS THE STATE THIS REPLACED, and it was observed
    // rather than argued: before the entry existed the notification was
    // unregistered and inert, the hover observed `[sentFolders[0]]` alone, and
    // this assertion failed on the missing second entry.
    //
    // BOTH folders, in order, and never `toContain`: a list that lost what the
    // session started with is exactly as wrong as one that never gained what
    // the user added.
    test("a folder added after initialize is observable by a config handler", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: [sentFolders[0]],
        });
        session.notify("initialized", {});

        changeFolders(session, { added: [addedFolder] });

        expect(await observedFolders(session)).toEqual([sentFolders[0], addedFolder]);
      } finally {
        session.dispose();
      }
    });

    // PBI-17 CRITERION 2, and it is THE DISCRIMINATING CASE for it: an
    // implementation that only appends passes the added criterion above and
    // fails here, and one that NORMALISES URIs passes a naive removal test and
    // fails here too, because it would treat these two folders as one and
    // delete the survivor along with the target.
    //
    // AN ECHOING ORACLE CANNOT PASS THIS. A server that answered with whatever
    // the last event mentioned, or that compared paths rather than strings,
    // produces something other than exactly `…/plain/` -- and the assertion is
    // the whole array, so `the survivor is in there somewhere` is not what is
    // being claimed.
    //
    // The session opens with NO folders on purpose: the survivor is then ALONE
    // in the list, which is what the criterion asks for, rather than sitting
    // beside something initialize put there.
    test("a folder removed stops being observable, and the other spelling of it remains", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        changeFolders(session, { added: [plainFolder, plainSlashFolder] });
        changeFolders(session, { removed: [plainFolder] });

        expect(await observedFolders(session)).toEqual([plainSlashFolder]);
      } finally {
        session.dispose();
      }
    });

    // PBI-17 CRITERION 3, and it is a criterion rather than a note because AN
    // `includes` GUARD PASSES EVERY OTHER ONE. Deduplicating here would leave
    // the added, removed and gate criteria green while quietly disagreeing with
    // the client about what it holds.
    //
    // DECIDED ON OBSERVABILITY, NOT ON PRINCIPLE -- mirroring a duplicate can
    // be wrong too. The tiebreak is that a PHANTOM entry shows up as visibly
    // wrong items a user can see and report, while a MISSING one is silent
    // absence, which is the failure class this whole PBI exists against.
    //
    // TWO EVENTS, not one `added` array of two, because the guard this pins
    // against is written against the list AS IT STANDS: a filter comparing the
    // incoming array to the previous list admits both copies when they arrive
    // together, and would leave this passing while doing the wrong thing.
    //
    // The second entry carries a DIFFERENT NAME, which is where the `name`
    // question folds in: both survive, so nothing here reconciles by name
    // either.
    test("a URI added twice is held twice", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        changeFolders(session, { added: [addedFolder] });
        changeFolders(session, { added: [addedAgain] });

        expect(await observedFolders(session)).toEqual([addedFolder, addedAgain]);
      } finally {
        session.dispose();
      }
    });

    // ABSENCE IS NOT COERCED, with cwd forced apart from anything a workspace
    // could be. THE THREE SUBSTITUTIONS THIS ASSERTION EXISTS TO REDDEN, each
    // a plausible implementation and each defaulting absence to a root:
    // process.cwd(), `/`, and an empty list treated as a root.
    //
    // The cwd one is the dangerous one, and the reason the session is started
    // somewhere of this test's choosing: nvim's cwd IS its own launch
    // directory when no root was found, so a cwd default looks correct in
    // every test that lets the two coincide.
    test("with no workspace sent, a handler observes an empty list and never cwd", async () => {
      const fixture = tree(["notes/cwd-only.txt"]);
      const session = LspSession.startCommand(
        `${runtime.command} ${runtime.runArgs.join(" ")} ${join(repoRoot, "src", "cli.ts")} --config ${echoConfig}`,
        fixture.root,
      );
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // EXACTLY [], not `falsy` and not `length === 0`: a fabricated root is
        // a list of length one, and each substitution above produces one.
        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    // THE SAME PROPERTY WHERE A CONFIG AUTHOR MEETS IT: not what the context
    // carries, but what the user is offered. `treat an empty list as a root`
    // is a mistake a config author makes DOWNSTREAM of the normalisation
    // above, so it cannot be caught by reading the context back -- it shows up
    // as an item attributed to a workspace nobody opened.
    //
    // Its permanent pair is the workspace-source test below, where the same
    // filter over the same wire DOES find items.
    test("with no workspace sent, no item is attributed to a workspace root", async () => {
      const fixture = tree(["notes/cwd-only.txt"]);
      const session = exampleSession(runtime, fixture.root);
      try {
        await openWith(session, undefined, "notes/");

        const items = await completeAt(session, "notes/");

        // NOT VACUOUS, and this is what makes the emptiness below evidence:
        // cwd answered, so the source really did run for this fragment.
        expect(inserted(items)).toEqual(["notes/cwd-only.txt"]);
        expect(workspaceItems(items)).toEqual([]);
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    // THE FOURTH SOURCE, and the PERMANENT PRESENCE PAIR for the absence
    // assertion above: the same `source: workspace` filter over the same wire
    // finds items here, so an empty result there is evidence rather than a
    // filter that could never match.
    //
    // cwd and the workspace are DIFFERENT DIRECTORIES holding DIFFERENT files,
    // which is the only way to tell which root produced an item. It is a
    // SYNTHETIC ISOLATION STATE and no editor produces it -- nvim spawns the
    // server with cwd = root_dir whenever it found a root -- and nobody should
    // later read it as an observed one.
    test("every workspace folder is answered from, and its items name their root", async () => {
      const cwd = tree(["notes/cwd-only.txt"]);
      const first = tree(["notes/first-only.txt"]);
      const second = tree(["notes/second-only.txt"]);
      const session = exampleSession(runtime, cwd.root);
      try {
        // TWO FOLDERS, because the field is an array on the wire: an
        // implementation keeping only the first answers from whichever root
        // the editor happened to list first, which is not a rule anyone chose.
        await openWith(
          session,
          [
            { uri: pathToFileURL(first.root).href, name: "first" },
            { uri: pathToFileURL(second.root).href, name: "second" },
          ],
          "notes/",
        );

        const items = await completeAt(session, "notes/");

        // ALL THREE ROOTS ANSWER. The cwd entry is not decoration: if the
        // workspace sources had REPLACED the relative ones rather than joining
        // them, every workspace assertion below would still pass.
        expect(inserted(items)).toEqual([
          "notes/cwd-only.txt",
          "notes/first-only.txt",
          "notes/second-only.txt",
        ]);
        expect(
          workspaceItems(items)
            .map((item) => item.insertText)
            .sort(),
        ).toEqual(["notes/first-only.txt", "notes/second-only.txt"]);
        // EACH ITEM NAMES ITS OWN ROOT, which is what makes two workspace
        // folders legible rather than one indistinguishable pile: the
        // documentation carries the absolute path it resolves to, so the two
        // are told apart by the item itself and not only by which file it is.
        expect(workspaceItems(items).map(documentationOf).sort()).toEqual(
          [
            `${join(first.root, "notes/first-only.txt")}\n\n---\n\nsource: workspace`,
            `${join(second.root, "notes/second-only.txt")}\n\n---\n\nsource: workspace`,
          ].sort(),
        );
      } finally {
        session.dispose();
        cwd.dispose();
        first.dispose();
        second.dispose();
      }
    });
  });
}
