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
 */
const addedAgain: WorkspaceFolder = { uri: addedFolder.uri, name: "added again" };

const plainFolder: WorkspaceFolder = { uri: "file:///home/me/plain", name: "plain" };
const plainSlashFolder: WorkspaceFolder = { uri: "file:///home/me/plain/", name: "plain-slash" };

/**
 * A ROOT THE CLIENT NAMES IN THE DEPRECATED FIELDS -- the case PBI-19 exists
 * for: `workspaceFolders` is only available if the client supports workspace
 * folders, so a client without that capability sends none and may still say
 * which project the editor opened.
 *
 * THE TWO SPELLINGS ARE SEPARATE LITERALS, never one derived from the other by
 * fileURLToPath/pathToFileURL. Those are the very functions the implementation
 * uses, so an expectation computed with them would assert that a function
 * equals itself and would stop pinning the convention -- `name` is the PATH and
 * `uri` is the client's own bytes.
 */
const rootedUri = "file:///home/me/rooted";
const rootedPath = "/home/me/rooted";
const rootedFolder: WorkspaceFolder = { uri: rootedUri, name: rootedPath };

/**
 * THE CLIENT'S OWN STATEMENT ABOUT THE URI WE GUESSED, under a name it chose:
 * a client that later adds the folder synthesised for it is saying it holds
 * that folder, and this list holds what the client says.
 */
const rootedAgain: WorkspaceFolder = { uri: rootedUri, name: "rooted again" };

/**
 * A SECOND, CONFLICTING root, so each precedence rung is asserted against the
 * rung below it: a list that merely contains the winner cannot be told from one
 * that took the loser too, and identical values would let a rung pass by
 * accident.
 */
const elsewhereUri = "file:///home/me/elsewhere";
const elsewherePath = "/home/me/elsewhere";

/**
 * A rootUri THAT DOES NOT SURVIVE A ROUND TRIP through the URL parser: `%6A` is
 * `j`, an unreserved character no encoder is obliged to escape, so
 * `pathToFileURL(fileURLToPath(this))` hands back `…/project` -- DIFFERENT
 * BYTES from what the client sent.
 *
 * That is what makes it the discriminating case for two claims a clean URI
 * cannot test at all, because for a clean URI the round trip is the identity:
 * the synthesised `uri` is the client's OWN BYTES, and the synthesised `name`
 * is the path those bytes DECODE to.
 */
const encodedRootUri = "file:///home/me/pro%6Aect";
const encodedRootFolder: WorkspaceFolder = { uri: encodedRootUri, name: "/home/me/project" };

/**
 * A rootUri NAMING NO LOCAL PATH. `fileURLToPath` THROWS on it, which is the
 * hazard: thrown from inside the initialize handler it answers the handshake
 * with an error and leaves the config author no server at all.
 */
const remoteRootUri = "vscode-remote://ssh-remote%2Bexample/home/me/rooted";

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

    // PBI-19 CRITERION 1. The client named a root and sent NO workspaceFolders,
    // which is what a client without that capability does -- and the handler
    // must still be handed the project the editor opened.
    //
    // VERIFIED SYNTHETICALLY, AND SAYING SO IS PART OF THE RESULT: MEASURED
    // across all three capability declarations, nvim sends rootUri and
    // workspaceFolders TOGETHER OR NEITHER, so NO MEASURED CLIENT PRODUCES THIS
    // CASE. The specification contemplates a rootUri-only client and such
    // clients existed, which is why this stands -- but nobody should read a
    // green here as `this works for a client we have seen`.
    //
    // THE WHOLE FOLDER, not just its uri: `name` is the property that carries
    // the convention, and asserting the uri alone would leave the second
    // synthesis site free to invent its own.
    test("a client sending rootUri but no workspaceFolders reaches a handler with a folder", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: rootedUri,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([rootedFolder]);
      } finally {
        session.dispose();
      }
    });

    // THE THREE SPELLINGS OF `NO FOLDERS HERE` ARE TREATED ALIKE -- omitted,
    // null, and the EMPTY ARRAY all fall through to the rung below.
    //
    // PINNED AT SPRINT 18'S REVIEW, and the reason it had to be is measured:
    // making `[]` or null STOP the chain reddened NOTHING across 315 tests.
    // Correct behaviour with zero defence is what the first-to-fail rule was
    // sharpened to catch.
    //
    // THE COUNTER-ARGUMENT, recorded because it is grounded in the same chain
    // this feature is built on: the installed types say `null` means `supports
    // workspace folders but none are configured` -- a STATEMENT of emptiness,
    // where omission is the absence of one -- and workspaceFolders supersedes
    // rootUri. It loses on HARM ASYMMETRY, not on being wrong: a client that
    // supports folders, has none configured, and still sends rootUri is most
    // plausibly saying `I do not do multi-root` rather than `there is no
    // project`. Falling through hands that author the root; stopping hands them
    // SILENT ABSENCE of a root the editor did name.
    test("an empty workspaceFolders falls through to rootUri, as omitting it does", async () => {
      for (const spelling of [[], null]) {
        const session = LspSession.start(runtime, echoConfig);
        try {
          await session.request<InitializeResult>("initialize", {
            ...initializeParams,
            workspaceFolders: spelling,
            rootUri: rootedUri,
          });
          session.notify("initialized", {});

          expect(await observedFolders(session)).toEqual([rootedFolder]);
        } finally {
          session.dispose();
        }
      }
    });

    // PBI-19 CRITERION 2, TOP RUNG: workspaceFolders > rootUri.
    //
    // ONE TEST PER RUNG, never three assertions in one test: a bundled test
    // stops at its first failure, so which rungs were already satisfied and
    // which had to be built could not be reported at all.
    //
    // ASSERTED AGAINST A CONFLICTING rootUri, so a `folders win` claim cannot
    // be satisfied by an implementation that appends the root as well.
    test("workspace folders the client sent win over a conflicting rootUri", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: elsewhereUri,
          workspaceFolders: sentFolders,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual(sentFolders);
      } finally {
        session.dispose();
      }
    });

    // PBI-19 CRITERION 2, LOWER RUNG: rootUri > rootPath. MEASURED FROM THE
    // INSTALLED TYPES, which state it outright: `If both rootPath and rootUri
    // are set rootUri wins`.
    test("rootUri wins over a conflicting rootPath", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: rootedUri,
          rootPath: elsewherePath,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([rootedFolder]);
      } finally {
        session.dispose();
      }
    });

    // PBI-19 CRITERION 2, BOTTOM RUNG, and it is the test that pins the SECOND
    // synthesis site's convention: rootPath is already a path, so `name` is
    // that string VERBATIM and the uri is derived from it -- the mirror of the
    // rung above, where the uri arrived and the name was derived.
    test("a client naming only rootPath reaches a handler with a folder named by that path verbatim", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootPath: rootedPath,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([rootedFolder]);
      } finally {
        session.dispose();
      }
    });

    // THE TWO HALVES OF THE SYNTHESIS CONVENTION, ON A URI WHERE THEY CAN BE
    // TOLD APART: `uri` is what the CLIENT SPELLED, byte for byte, and `name`
    // is what those bytes DECODE to. On a clean URI the round trip is the
    // identity, so no test using one can distinguish `we kept the client's
    // bytes` from `we reparsed and got lucky`.
    test("a percent-encoded rootUri is held as the client spelled it and named by the path it decodes to", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: encodedRootUri,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([encodedRootFolder]);
      } finally {
        session.dispose();
      }
    });

    // WHY THE BYTES MATTER, as its own test rather than a second assertion on
    // the one above: `change` matches URIs as EXACT STRINGS, so a synthesised
    // entry holding a reparsed URI is one the client can never remove -- it
    // would send back the spelling it sent, and nothing would match.
    //
    // A SEPARATE TEST BECAUSE THE CONSEQUENCE IS THE POINT. Appended to the
    // test above it could never be observed: that one fails first under the
    // same perturbation and stops.
    //
    // Its permanent presence pair is the test above, where the same reader
    // observes the folder present.
    test("a removal spelling the rootUri exactly as the client did finds the synthesised folder", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: encodedRootUri,
        });
        session.notify("initialized", {});

        changeFolders(session, { removed: [{ uri: encodedRootUri, name: "whatever" }] });

        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    // THE HANDSHAKE SURVIVES A rootUri THAT NAMES NO LOCAL PATH, and that is
    // ALL this asserts. `fileURLToPath` throws on such a URI, and thrown from
    // the initialize handler it answers the handshake with an error: the author
    // gets no server at all, which is a strictly worse failure than any list.
    //
    // WHAT THE LIST SHOULD THEN HOLD IS DELIBERATELY NOT ASSERTED. More than
    // one outcome is defensible -- fall to the rung below, as tsudoi does, or
    // keep the URI under some invented name -- and no ruling exists. Pinning
    // the debatable half here would freeze a choice nobody made; pinning the
    // non-debatable half is what stops the catastrophic one.
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

    // PBI-19 CRITERION 1'S NEGATIVE CONTROL, THE BACK DOOR HALF: cwd must not
    // re-enter through the rootPath rung. `pathToFileURL` RESOLVES A RELATIVE
    // PATH AGAINST cwd, so a rootPath of "" or "." would synthesise a
    // cwd-derived root -- exactly the fabrication the criterion exists to keep
    // out, arriving by a route `?? []` does not cover because "" is neither
    // null nor undefined.
    //
    // REASONED, NOT MEASURED: no observed client sends this, and it is pinned
    // because the failure would be silent and indistinguishable from a correct
    // root.
    test("a rootPath that names no absolute path is not a root, and never becomes cwd", async () => {
      const fixture = tree(["notes/cwd-only.txt"]);
      const session = LspSession.startCommand(
        `${runtime.command} ${runtime.runArgs.join(" ")} ${join(repoRoot, "src", "cli.ts")} --config ${echoConfig}`,
        fixture.root,
      );
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootPath: "",
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    // PBI-19 CRITERION 3. BORN GREEN BY CONSTRUCTION and recorded as such: the
    // synthesised folder is an ORDINARY MEMBER of the list the notification
    // writes through, so uniformity is a consequence of not special-casing
    // rather than of any code written for it.
    //
    // THE WHOLE VALUE IS THE CONTROL, and the wrong implementation is the
    // TEMPTING one: a READ-TIME `folders.length > 0 ? folders :
    // synthesise(rootUri)` passes every assertion of criterion 1 perfectly and
    // reddens HERE, because the first `added` finds an empty stored list and
    // the read hands back the delta ALONE -- [added] where the client holds
    // [root, added].
    //
    // BOTH folders, in order, and never `toContain`: losing the root the
    // session opened with is exactly the failure this PBI exists against.
    test("a folder added after a root was synthesised joins it rather than replacing it", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: rootedUri,
        });
        session.notify("initialized", {});

        changeFolders(session, { added: [addedFolder] });

        expect(await observedFolders(session)).toEqual([rootedFolder, addedFolder]);
      } finally {
        session.dispose();
      }
    });

    // PBI-19 CRITERION 3, THE REMOVE HALF, AND THE WORSE HAZARD OF THE TWO: a
    // read-time fallback never stored the root, so removing it is a no-op on an
    // already-empty list and the next read SYNTHESISES IT AGAIN -- a folder the
    // client EXPLICITLY REMOVED coming back.
    //
    // ITS OWN TEST, AND THE REAPPEARANCE IS ITS FIRST ASSERTION. Bundled onto
    // the end of the test above it could never be observed: that test would
    // fail at its own first assertion under the same perturbation and stop,
    // leaving the hazard this one names unreported.
    //
    // ITS PERMANENT PRESENCE PAIR is the criterion 1 test above -- the same
    // fixture, the same hover, the same reader, observing [rootedFolder] when
    // the root IS there. An emptiness claim measured by a path that can never
    // observe anything is satisfied by a broken measurement.
    test("the synthesised folder is removed like any other, and does not come back", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: rootedUri,
        });
        session.notify("initialized", {});

        changeFolders(session, { removed: [rootedFolder] });

        expect(await observedFolders(session)).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    // PBI-19 CRITERION 4, PINNED BECAUSE A WELL-MEANING GUARD PASSES EVERY
    // OTHER ONE: a `do not duplicate our own entry` check would leave criteria
    // 1, 2 and 3 green while silently disagreeing with the client -- the
    // identical hazard shape to the `includes` guard pinned above.
    //
    // APPEND, NEVER REPLACE, and the losing argument is strong enough to
    // record: one folder guessed and then confirmed is arguably not two, and
    // OUR entry is an estimate where the client's is a statement. It loses on
    // MECHANISM COST -- replacing means knowing which entry is ours, which
    // reintroduces the provenance the uniformity ruling removed the need for,
    // and an exception for our own entry makes the synthesised entry
    // EXTRAORDINARY again.
    //
    // THE RESIDUAL, named rather than glossed: the list can then hold two
    // entries for one folder, our estimate beside the client's statement.
    test("an added folder naming the synthesised URI is held beside it, not merged into it", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: rootedUri,
        });
        session.notify("initialized", {});

        changeFolders(session, { added: [rootedAgain] });

        expect(await observedFolders(session)).toEqual([rootedFolder, rootedAgain]);
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
    // WHAT WOULD UN-BLIND IT is a removal naming the spelling that is NOT first
    // in the list; the case here names the first, because that is the direction
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

    // PBI-20 CRITERION 1, and it is the discriminating case for the whole PBI:
    // N `removed` entries take N copies, so ONE entry against TWO copies leaves
    // ONE. A filter that matches every entry with that URI wipes both and
    // reddens the FIRST assertion here -- observed, not argued, as
    // `[sentFolders[0]]` where the client holds `[sentFolders[0], addedFolder]`.
    //
    // THE SECOND HALF IS LOAD-BEARING and is not a repetition of the first: a
    // removal that took NOTHING would leave one copy standing too, and only a
    // second event proves the first one removed something rather than being
    // dropped.
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
    // assertion, in that same assertion: `the copies are gone` measured against
    // an empty list is also what a session that applied nothing produces.
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
    // sentFolders[0] IS THE PAIRED PRESENCE, in the same assertion rather than
    // in another test: `both copies are gone` measured against an empty list
    // would also be satisfied by a session that applied nothing at all.
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
