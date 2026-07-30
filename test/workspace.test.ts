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
import { gateOpen, itemsFor } from "./fixtures/completion-workspace-gate.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture, repoRoot } from "./helpers/spawn.ts";
import { tree } from "./helpers/tree.ts";

const echoConfig = fixture("workspace-folders.ts");
const workspaceGate = fixture("completion-workspace-gate.ts");
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
 *
 * IT IS ALSO THE `removed` ENTRY IN BOTH PBI-20 TESTS, which is a second job
 * rather than a coincidence: a removal is matched BY URI AND NOT BY NAME, so an
 * entry whose name differs from the copies it takes is what stops those tests
 * passing under an implementation that compared whole folders.
 */
const addedAgain: WorkspaceFolder = { uri: addedFolder.uri, name: "added again" };

const plainFolder: WorkspaceFolder = { uri: "file:///home/me/plain", name: "plain" };
const plainSlashFolder: WorkspaceFolder = { uri: "file:///home/me/plain/", name: "plain-slash" };

/**
 * A ROOT THE CLIENT NAMES IN THE DEPRECATED FIELDS -- the case a client without
 * the workspace-folders capability produces: it sends no folders and may still
 * say which project the editor opened.
 *
 * NO FOLDER IS DERIVED FROM IT ANYWHERE, and there is no longer a constant here
 * that says what one would look like. There was: `rootedFolder` was the
 * expectation about the published reduction, and it went with the reduction when
 * the stakeholder ruled that tsudoi's TYPES module may not export a runtime
 * function. What is left is the URI itself, read back as the bytes the client
 * sent.
 */
const rootedUri = "file:///home/me/rooted";

/**
 * A SECOND, CONFLICTING root, so that a mirror which merely CONTAINED what the
 * client sent cannot pass: the two fields must not mix, and identical values
 * would let a folded-in root go unseen.
 */
const elsewhereUri = "file:///home/me/elsewhere";

/**
 * A rootUri THAT DOES NOT SURVIVE A ROUND TRIP through the URL parser: `%6A` is
 * `j`, an unreserved character no encoder is obliged to escape, so
 * `pathToFileURL(fileURLToPath(this))` hands back `…/project` -- DIFFERENT
 * BYTES from what the client sent.
 *
 * That is what makes `mirrored, not interpreted` sayable at all: for a clean URI
 * the round trip is the identity, so no test using one can tell `we kept the
 * client's bytes` from `we reparsed and got lucky`.
 */
const encodedRootUri = "file:///home/me/pro%6Aect";

/**
 * A rootUri NAMING NO LOCAL PATH -- `vscode-remote://` is one an editor really
 * sends. `fileURLToPath` THROWS on it, which is the hazard an author who
 * converts this field inherits: nothing in tsudoi calls that function on these
 * bytes any more, so the throw would land in a config's own handler, and
 * src/types.ts says so at `rootUri`.
 */
const remoteRootUri = "vscode-remote://ssh-remote%2Bexample/home/me/rooted";

/**
 * What the handler observed ON ITS OWN RequestContext, whole.
 *
 * EVERY KEY IS OPTIONAL AND NOTHING IS DEFAULTED AWAY: `undefined` is what a
 * field that never arrived looks like, and it is the state these criteria exist
 * to tell apart from an empty list.
 */
interface Observation {
  workspaceFolders?: unknown;
  rootUri?: unknown;
  rootPath?: unknown;
}

/** The fixture's whole report for the session as it now stands. */
async function observed(session: LspSession): Promise<Observation> {
  const hover = await session.request<Hover>("textDocument/hover", {
    textDocument: { uri },
    position: { line: 0, character: 0 },
  });
  const contents = hover.contents as { value?: string };
  return JSON.parse(contents.value ?? "{}") as Observation;
}

/** The folder list alone, which is what every change assertion below reads. */
async function observedFolders(session: LspSession): Promise<unknown> {
  return (await observed(session)).workspaceFolders;
}

/**
 * THE THREE MIRRORED FIELDS, WHOLE, which is now everything the fixture reports.
 * It used to be a deliberate subset -- a fourth key carried the published
 * reduction, and reading it here would have let a broken guard flip an assertion
 * about the mirror. That reduction no longer exists, so the omission has nothing
 * left to omit and this reader is kept for the assertions that spell all three.
 */
async function mirrored(session: LspSession): Promise<Observation> {
  const { workspaceFolders, rootUri, rootPath } = await observed(session);
  return { workspaceFolders, rootUri, rootPath };
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

/**
 * The same, for a client that names its project the way a client WITHOUT the
 * workspace-folders capability does: `rootUri` alone, with the field the newer
 * clients use omitted entirely.
 */
async function openWithRootUri(session: LspSession, rootUri: string, line: string): Promise<void> {
  await session.request<InitializeResult>("initialize", { ...initializeParams, rootUri });
  session.notify("initialized", {});
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text: line },
  });
}

/**
 * One completion at the end of `line`, aggregated as a client without a token
 * sees it. The example yields batches of items, so the response IS the whole
 * list; `null` is `no answer at all` and reads as an empty list here.
 */
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

    // PBI-49 CRITERION 1, AND THE ABSENCE IS PAIRED INSIDE ONE ASSERTION. A
    // test reading only the empty list cannot tell `nothing was synthesised`
    // from `the field was dropped on the floor`, so the rootUri the client sent
    // is read back through the SAME measurement: the empty list is then evidence
    // about synthesis rather than about plumbing.
    //
    // THE PERCENT-ENCODED SPELLING IS WHAT MAKES `MIRRORED` MEAN ANYTHING. `%6A`
    // is `j`, an unreserved character no encoder must escape, so a round trip
    // through the URL parser hands back DIFFERENT BYTES. On a clean URI that
    // round trip is the identity and this could not tell the two apart.
    //
    // ITS PERMANENT PRESENCE ARM IS THE TEST BELOW, through the same reader: a
    // session that sends folders observes them here, so `[]` is not what this
    // measurement says whatever it is given.
    //
    // WHAT WAS DELIBERATELY REMOVED HERE, since a reader will otherwise look for
    // it: this used to assert that a rootUri-only client REACHED A HANDLER WITH
    // A FOLDER. tsudoi cannot name a folder -- the protocol makes `name` a UI
    // label the client owns. A published reduction answered that need for one
    // sprint and was withdrawn with it, so what a rootUri-only client gets is
    // this and only this: the bytes, and an empty list beside them.
    test("a client sending only rootUri is handed no folders, and the rootUri it sent", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: encodedRootUri,
        });
        session.notify("initialized", {});

        expect(await mirrored(session)).toEqual({
          workspaceFolders: [],
          rootUri: encodedRootUri,
          rootPath: null,
        });
      } finally {
        session.dispose();
      }
    });

    // THE THREE SPELLINGS OF `NO FOLDERS HERE` ARE TREATED ALIKE -- omitted,
    // null and the EMPTY ARRAY are one state, an empty list. The omitted
    // spelling is two tests above; these are the other two.
    //
    // THE ROOT IS SENT AND IS NOT FOLDED IN, which is what makes this more than
    // a repetition: the client named a project, the list stays empty, and the
    // author can SEE the project in the field beside it. That visible absence is
    // the whole trade this PBI made -- the old failure was an author reading an
    // empty list with no way to know the editor had opened anything.
    //
    // THE COUNTER-ARGUMENT, kept because it is grounded in the same chain: the
    // installed types say `null` means `supports workspace folders but none are
    // configured` -- a STATEMENT of emptiness, where omission is the absence of
    // one. NOTHING IN tsudoi TURNS ON THE DIFFERENCE AND NOTHING IS LEFT THAT
    // COULD: neither spelling reaches a folder, and the reduction that once fell
    // through an empty list on that distinction has been withdrawn. An author
    // who reduces these fields themselves is the only reader the difference can
    // still reach, and both spellings arrive here as one empty list.
    test("an empty or null workspaceFolders is an empty list beside the rootUri, as omitting it is", async () => {
      for (const spelling of [[], null]) {
        const session = LspSession.start(runtime, echoConfig);
        try {
          await session.request<InitializeResult>("initialize", {
            ...initializeParams,
            workspaceFolders: spelling,
            rootUri: rootedUri,
          });
          session.notify("initialized", {});

          expect(await mirrored(session)).toEqual({
            workspaceFolders: [],
            rootUri: rootedUri,
            rootPath: null,
          });
        } finally {
          session.dispose();
        }
      }
    });

    // THE PRESENCE ARM OF THE PAIR ABOVE, through the same reader, and it is
    // ALSO what remains of `folders win over a conflicting rootUri`: with no
    // precedence left to apply, what that test defended is that the two fields
    // DO NOT MIX -- neither is folded into the other, neither replaces the
    // other, and both reach the author as sent.
    //
    // TWO FOLDERS AND A CONFLICTING ROOT, so a list that merely CONTAINS what
    // the client sent cannot pass: an implementation appending the root fails,
    // and so does one keeping only the first folder.
    test("the folders a client sent arrive beside the rootUri it also sent, neither folded into the other", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: elsewhereUri,
          workspaceFolders: sentFolders,
        });
        session.notify("initialized", {});

        expect(await mirrored(session)).toEqual({
          workspaceFolders: sentFolders,
          rootUri: elsewhereUri,
          rootPath: null,
        });
      } finally {
        session.dispose();
      }
    });

    // THE HANDSHAKE SURVIVES A rootUri THAT NAMES NO LOCAL PATH, and that is
    // ALL this asserts.
    //
    // ITS HAZARD MOVED TWICE AND THE TEST STAYED BOTH TIMES, which is worth
    // stating because it is now the weakest test in this file. `fileURLToPath`
    // throws on such a URI; it used to run INSIDE the initialize handler, where
    // a throw answers the handshake with an error and leaves the author no
    // server at all. Then it ran in a published reduction, whose own test owned
    // it. Now NOTHING IN tsudoi CALLS IT ON THESE BYTES AT ALL, so the throw
    // belongs to whatever a config author writes, and src/types.ts says so at
    // `rootUri`.
    //
    // WHAT WOULD MAKE THIS RED TODAY, asked because a green that measures
    // nothing is what this project's rules exist to catch: only a server that
    // fails the handshake outright, which every other test in this file would
    // fail first. IT CANNOT BE THE FIRST THING TO FAIL any more. It is kept
    // rather than deleted because retiring a defence of an accepted criterion is
    // a scope decision and not tidying -- and this comment is the record that
    // its evidential value is gone, so nobody reads its green as coverage.
    test("a rootUri naming no local path still completes the handshake", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: remoteRootUri,
        });

        expect(result.capabilities).toBeDefined();
      } finally {
        session.dispose();
      }
    });

    // PBI-49 CRITERION 2, AND IT IS NOW THE WHOLE OF IT: a relative rootPath
    // reaches the author EXACTLY AS SENT and becomes no folder on the way.
    //
    // BOTH SPELLINGS, because they are two values and not one: "" is what a
    // client that has a field to fill and nothing to put in it sends, and "." is
    // what a client that means `here` sends. Neither is absence, which is the
    // door `??` does not cover -- and an implementation reading these fields
    // with `||` instead of `??` reddens HERE, on the mirrored `""`.
    //
    // THE cwd HAZARD NO LONGER HAS A TEST, AND THAT IS A LOSS RATHER THAN A
    // TIDY-UP. A sibling test used to run the published reduction on this very
    // session and assert it answered NO folder -- with the session started
    // somewhere of the test's choosing, so a `pathToFileURL` on "." would have
    // named the launch directory out loud. That reduction was withdrawn, so
    // there is no code left in this repository that could manufacture the root,
    // and no artifact the suite drives that could be perturbed into it. WHAT
    // OWNS THE HAZARD NOW IS PROSE at `rootPath` in src/types.ts, addressed to
    // the author who writes the reduction themselves. Nothing here can fail if
    // that prose goes wrong.
    test("a relative rootPath reaches the handler exactly as sent, and becomes no folder", async () => {
      for (const spelling of ["", "."]) {
        const session = LspSession.start(runtime, echoConfig);
        try {
          await session.request<InitializeResult>("initialize", {
            ...initializeParams,
            rootPath: spelling,
          });
          session.notify("initialized", {});

          expect(await mirrored(session)).toEqual({
            workspaceFolders: [],
            rootUri: null,
            rootPath: spelling,
          });
        } finally {
          session.dispose();
        }
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
    // fails here.
    //
    // ITS NORMALISATION HALF WAS BLINDED BY PBI-20 AND IS ANNOTATED RATHER THAN
    // REPAIRED, because repairing it would rewrite a defence of an accepted
    // criterion, which is a scope decision. It used to catch a normalising
    // implementation because REMOVE-ALL deleted the survivor along with the
    // target. One copy per `removed` entry deletes exactly ONE folder, and
    // first-match lands on `…/plain` -- the intended target -- so the survivor
    // stands and this test passes. MEASURED both ways: stripping a trailing
    // slash before comparing reddens this test under the old filter and reddens
    // NOTHING in 321 tests under the current one.
    //
    // WHAT WOULD UN-BLIND IT, REASONED and not measured -- measuring it needs a
    // test that does not exist -- is a removal naming the spelling that is NOT
    // first in the list; the case here names the first, because that is the direction
    // MEASURED against nvim and a synthetic direction would not be. SO THE
    // RESIDUAL IS REAL: a normalising implementation now ships undetected in
    // the measured direction, and nobody should read this test as defending
    // exact-string matching any more.
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
        // THE NON-FIRST SPELLING, and the choice is what makes this test
        // discriminate. Removing `…/plain` -- the first entry -- leaves
        // `…/plain/` under exact matching AND under normalisation, because
        // one-copy-per-entry deletes one folder and first-match lands on the
        // intended target either way. MEASURED at Sprint 19: with the removal
        // naming the FIRST entry, a normalising matcher reddened NOTHING across
        // 321 tests. Naming the SECOND separates them -- exact matching leaves
        // `…/plain`, normalisation leaves `…/plain/`.
        changeFolders(session, { removed: [plainSlashFolder] });

        expect(await observedFolders(session)).toEqual([plainFolder]);
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
    // ONE EVENT, THE SAME URI IN BOTH ARMS -- the only shape that can tell the
    // two orders apart, and the reason `removed` before `added` had been
    // UNDEFENDED since it was decided at Sprint 17. MEASURED at Sprint 19:
    // applying `added` first reddened NOTHING across 321 tests, and equally
    // nothing across the 317 that predate that sprint.
    //
    // PINNED OPPORTUNISTICALLY, not as repair: this sprint did not break the
    // ordering, it REVEALED that nothing defended it. It earns a test because
    // the PO ruled it ONE REQUIRED OUTCOME -- a client spelling a rename as one
    // event ends HOLDING the folder, a phantom that is visible if wrong, where
    // the other order ends holding NOTHING, which is silent.
    test("one event removing and adding the same URI ends holding the folder", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // THE LIST MUST NOT ALREADY HOLD IT, and that is the whole
        // construction: with the folder already held, one-copy-per-entry makes
        // the two orders AGREE -- remove-then-add gives [X], and add-then-
        // remove gives [X, X] minus one, also [X]. MEASURED: a first attempt
        // that pre-added the folder reddened NOTHING under the flipped order.
        // Starting empty separates them -- remove-then-add ends HOLDING it,
        // add-then-remove ends with nothing.
        changeFolders(session, { removed: [plainFolder], added: [plainFolder] });

        expect(await observedFolders(session)).toEqual([plainFolder]);
      } finally {
        session.dispose();
      }
    });

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

    // PBI-20 CRITERION 1, and it is the discriminating case for the whole PBI:
    // N `removed` entries take N copies, so ONE entry against TWO copies leaves
    // ONE. A filter that matches every entry with that URI wipes both and
    // reddens the FIRST assertion here -- observed, not argued, as
    // `[sentFolders[0]]` where the client holds `[sentFolders[0], addedFolder]`.
    //
    // THE SECOND HALF PINS REPEATABILITY: N removals take N copies, so the
    // SECOND one drives the count to zero. It is not there to catch a removal
    // that took nothing -- the first assertion already does that, since a no-op
    // leaves THREE entries against a whole-array expectation of two.
    //
    // ITS OWN CONTROL, MEASURED, because a second assertion nothing can flip
    // alone is decoration: a guard that removes a copy only when the URI occurs
    // MORE THAN ONCE leaves the first assertion GREEN and reddens the second.
    //
    // THE TWO COPIES ARE BYTE-IDENTICAL, which is what makes the outcome
    // SINGLE-VALUED and therefore pinnable as a whole array. Which copy a
    // one-per-entry removal takes -- the first match or the last -- is a
    // question with more than one defensible answer, and identical copies
    // dissolve it instead of pinning it.
    //
    // THE REMOVED ENTRY CARRIES A DIFFERENT NAME than the copies it takes, so
    // this cannot pass by matching whole folders rather than URIs.
    //
    // sentFolders[0] IS THE PAIRED PRESENCE for the absence in the second
    // assertion, and it sits INSIDE that assertion: the same reader that must
    // no longer see `addedFolder` is seen observing a folder that is still
    // there, so `they are gone` cannot be satisfied by a measurement that
    // observes nothing at all.
    test("a URI held twice loses one copy per removal, not both to one", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: [sentFolders[0]],
        });
        session.notify("initialized", {});

        changeFolders(session, { added: [addedFolder] });
        changeFolders(session, { added: [addedFolder] });
        changeFolders(session, { removed: [addedAgain] });

        expect(await observedFolders(session)).toEqual([sentFolders[0], addedFolder]);

        changeFolders(session, { removed: [addedAgain] });

        expect(await observedFolders(session)).toEqual([sentFolders[0]]);
      } finally {
        session.dispose();
      }
    });

    // PBI-20 CRITERION 2, AND IT IS BORN GREEN AND SAYS SO: it was written
    // against UNCHANGED src/ and passed there, because the remove-all filter it
    // was written to outlive already gets this case right.
    //
    // ITS OWN TEST BECAUSE THE HAZARDS DIFFER, which is the whole reason a
    // born-green test is worth writing here. The remove-all filter PASSES this
    // and FAILS the sequential test below; deduping the `removed` array --
    // `new Set(event.removed.map(f => f.uri))` around a one-copy-per-entry
    // removal -- does the exact reverse. Neither control covers both, so
    // bundling the two claims into one test would leave whichever hazard is not
    // the first assertion permanently unobservable.
    //
    // TWO EVENTS TO ADD AND ONE TO REMOVE: the multiplicity has to arrive on
    // the REMOVED side within a SINGLE event, since that is the arm the dedupe
    // hazard lives on. That both adds are held at all is not asserted here --
    // `a URI added twice is held twice` above pins it, and repeating it would
    // put a second hazard's assertion ahead of this one's.
    //
    // THE REMOVED ENTRIES CARRY A DIFFERENT NAME than the copies they take, so
    // nothing here can pass by matching whole folders rather than URIs.
    //
    // sentFolders[0] IS THE PAIRED PRESENCE, inside the assertion rather than
    // in another test, so `both copies are gone` is not read off a measurement
    // that observes nothing at all.
    //
    // WHAT IT DOES NOT RULE OUT, stated because the opposite is the tempting
    // thing to write: a session that dropped EVERY notification also leaves
    // exactly `[sentFolders[0]]`. Nothing here catches that, deliberately --
    // the adds are pinned by `a URI added twice is held twice` above, and this
    // test carries ONE claim so that the dedupe hazard is what its only
    // assertion flips on.
    test("one event removing a URI twice takes both copies of it", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: [sentFolders[0]],
        });
        session.notify("initialized", {});

        changeFolders(session, { added: [addedFolder] });
        changeFolders(session, { added: [addedFolder] });
        changeFolders(session, { removed: [addedAgain, addedAgain] });

        expect(await observedFolders(session)).toEqual([sentFolders[0]]);
      } finally {
        session.dispose();
      }
    });

    // PBI-17 CRITERION 4, AND IT IS BORN GREEN AND SAYS SO: per-request capture
    // is ALREADY today's behaviour, because methods.ts calls the folders thunk
    // ONCE while building the RequestContext. It is pinned so that nobody
    // meeting this later mistakes correct code for a bug and `fixes` it into a
    // lazy read.
    //
    // PROVEN BY ORDERING, NEVER BY A TIMING BOUND. The change is written to the
    // same stdin as the release that follows it, and the server frames what it
    // is sent in order -- so by the time the gate opens the change has already
    // been applied. Nothing here says `within N milliseconds`.
    //
    // THE SECOND HALF IS LOAD-BEARING: without a NEW request seeing the change,
    // every assertion above is satisfied by a server that applied NOTHING.
    //
    // THE VALUE IS THE PERTURBATION: make RequestContext hold the thunk and
    // read lazily, and the in-flight assertion must redden.
    test("a completion in flight keeps the folders it started with, while the next one sees the change", async () => {
      const session = LspSession.start(runtime, workspaceGate);
      const parkedToken = "workspace-parked";
      const nextToken = "workspace-next";
      const before = [sentFolders[0]];
      const after = [sentFolders[0], addedFolder];
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: before,
        });
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: "hold" },
        });

        let settled = false;
        const parked = session
          .request<CompletionItem[] | null>("textDocument/completion", {
            textDocument: { uri },
            position: { line: 0, character: 0 },
            partialResultToken: parkedToken,
          })
          .then((result) => {
            settled = true;
            return result;
          });
        // Marks the rejection handled so that a failure before the await below
        // is not reported against whichever test runs next.
        parked.catch(() => undefined);

        await session.waitForProgress(1);
        expect(session.progress[0]).toEqual({ token: parkedToken, value: itemsFor(before) });

        // The pause establishes that the request really is PARKED rather than
        // merely not-yet-answered -- the same shape completion.test.ts uses. It
        // is not what the claim rests on; the ordering below is.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(settled).toBe(false);

        // THE CHANGE, WHILE THE REQUEST IS PARKED, and the RELEASE written
        // after it. This ordering is the proof: the second yield cannot happen
        // until the release is processed, and the release cannot be processed
        // before the change that was framed ahead of it.
        changeFolders(session, { added: [addedFolder] });
        session.notify("textDocument/didChange", {
          textDocument: { uri, version: 2 },
          contentChanges: [{ text: gateOpen }],
        });

        await session.waitForProgress(2);
        // ITS SECOND YIELD MATCHES ITS FIRST: the request finished on the list
        // it began with, though the workspace had already changed under it.
        expect(session.progress[1]).toEqual({ token: parkedToken, value: itemsFor(before) });
        await parked;

        // THE NEXT REQUEST SEES THE CHANGE. Its gate is already open, so both
        // its yields arrive at once -- and both carry the folder the parked one
        // never saw.
        await session.request<CompletionItem[] | null>("textDocument/completion", {
          textDocument: { uri },
          position: { line: 0, character: 0 },
          partialResultToken: nextToken,
        });

        expect(session.progress.slice(2)).toEqual([
          { token: nextToken, value: itemsFor(after) },
          { token: nextToken, value: itemsFor(after) },
        ]);
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
    //
    // WHAT THIS DOES NOT DEFEND, measured at Sprint 18 and recorded so nobody
    // reads two tests as two defences: it is BLIND TO THE cwd SUBSTITUTION its
    // sibling names. Under a cwd fallback this test stays GREEN, because
    // PBI-14's dedup-by-inserted-text collapses the identical item a cwd root
    // produces. THE CONTEXT-LEVEL TEST CARRIES THAT CRITERION ALONE -- one of
    // this project's own rules blinding one of its own controls.
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

    // THE HAZARD THIS SPRINT CREATED, NOW UNOWNED BY CODE AND ASSERTED AS THE
    // BEHAVIOUR IT IS: an author reading `workspaceFolders` alone is handed `[]`
    // where a root exists, and THIS REPOSITORY'S OWN STAKEHOLDER-FACING EXAMPLE
    // is such an author. It read the three fields through a published reduction
    // for one sprint; the stakeholder withdrew that function, and this test is
    // the inverse of the one that stood here.
    //
    // WHAT IT ASSERTS IS WHAT examples/completion-path.ts NOW CLAIMS IN PROSE at
    // its `sourcesFor` call -- that a rootUri-only client leaves the workspace
    // source contributing NOTHING while the other sources still answer. An
    // unasserted claim in the document that argues for adoption is exactly what
    // Sprint 14's standing prose item exists against, so the claim and the
    // assertion move together.
    //
    // THE ABSENCE IS FIRST AND ITS NON-VACUITY PAIR IS SECOND: cwd answering
    // proves the completion ran for this fragment at all, so the empty workspace
    // list is evidence rather than a request that never happened. ITS PERMANENT
    // PRESENCE PAIR is the folders-sent test below, where the same filter over
    // the same wire DOES find workspace items.
    //
    // WHAT WOULD MAKE IT RED: any reduction reappearing anywhere between the
    // deprecated fields and the example's roots -- which is the drift this
    // ruling forbids, and the one thing left in the repository that could still
    // manufacture a root out of `rootUri`.
    test("a rootUri-only session gets no workspace source, since nothing reduces the deprecated fields", async () => {
      const cwd = tree(["notes/cwd-only.txt"]);
      const rooted = tree(["notes/root-only.txt"]);
      const session = exampleSession(runtime, cwd.root);
      try {
        await openWithRootUri(session, pathToFileURL(rooted.root).href, "notes/");

        const items = await completeAt(session, "notes/");

        expect(workspaceItems(items)).toEqual([]);
        expect(inserted(items)).toEqual(["notes/cwd-only.txt"]);
      } finally {
        session.dispose();
        cwd.dispose();
        rooted.dispose();
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
