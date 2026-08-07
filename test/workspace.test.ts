import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type CompletionItem,
  ErrorCodes,
  type Hover,
  type InitializeResult,
  type WorkspaceFolder,
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
import { fixture, frameworkRoot } from "./helpers/spawn.ts";
import { tree } from "./helpers/tree.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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
 * THE SAME URI AS `addedFolder` UNDER A DIFFERENT NAME, which is how a client
 * would spell a rename if LSP had a rename event. It has none: a client wanting
 * one sends `removed` then `added`, so this arriving as an `added` alone says
 * the client now holds that folder twice, and tsudoi reconciles by neither URI
 * nor name.
 *
 * IT IS ALSO THE `removed` ENTRY IN THE TWO REMOVAL TESTS, which is a second job
 * rather than a coincidence: a removal is matched BY URI AND NOT BY NAME, so an
 * entry whose name differs from the copies it takes is what stops those tests
 * passing under an implementation that compared whole folders.
 */
const addedAgain: WorkspaceFolder = { uri: addedFolder.uri, name: "added again" };

/**
 * ONE DIRECTORY, TWO SPELLINGS, and they are TWO FOLDERS here.
 *
 * MEASURED against Neovim: it accepts `…/plain` and `…/plain/` as different
 * folders, and every `removed` URI arrives BYTE-IDENTICAL to the `added` one it
 * refers to -- which is what makes a plain string filter correct for this
 * client. So this pair is the case an implementation that NORMALISES gets wrong,
 * by deleting a folder the client still holds. THE WORKSPACE FOLDER LIST IS
 * CLIENT STATE WE MIRROR, NOT FILESYSTEM STATE WE INTERPRET.
 */
const plainFolder: WorkspaceFolder = { uri: "file:///home/me/plain", name: "plain" };
const plainSlashFolder: WorkspaceFolder = { uri: "file:///home/me/plain/", name: "plain-slash" };

/**
 * A ROOT THE CLIENT NAMES IN THE DEPRECATED FIELDS -- the case a client without
 * the workspace-folders capability produces: it sends no folders and may still
 * say which project the editor opened.
 *
 * NO FOLDER IS DERIVED FROM IT ANYWHERE, AND NO CONSTANT HERE SAYS WHAT ONE
 * WOULD LOOK LIKE. What these are is the two spellings themselves, read back as
 * the bytes the client sent.
 *
 * `rootedPath` IS ABSOLUTE AND THAT IS ITS JOB, not an incidental property of a
 * plausible path: it is the PRESENCE ARM of the refusal below, so a value that
 * stopped being absolute would turn that pair into two assertions about nothing.
 */
const rootedUri = "file:///home/me/rooted";
const rootedPath = "/home/me/rooted";

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
 * packages/tsudoi-language-server/src/types.ts says so at `rootUri`.
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
 * THE THREE MIRRORED FIELDS, WHOLE, which is everything the fixture reports --
 * not a deliberate subset.
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
 * from the workspace is what attributes an item to one of them --
 * and it is a SYNTHETIC ISOLATION STATE, never an observed editor one, since
 * nvim spawns the server with cwd = root_dir whenever it found a root.
 */
function exampleSession(runtime: Runtime, cwd: string): LspSession {
  return LspSession.startCommand(
    `${runtime.command} ${runtime.runArgs.join(" ")} ${join(frameworkRoot, "src", "cli.ts")} --config ${demoConfig}`,
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
    // THE PERMANENT PAIR FOR EVERY ABSENCE ASSERTION BELOW: the same fixture,
    // the same hover, the same reader. A `the handler observed an empty list`
    // claim measured by a path that can never observe anything is satisfied by a
    // broken measurement.
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

    // SPLIT FROM THE ARM ABOVE RATHER THAN BUNDLED WITH IT: `workspaceFolders`
    // is declared `WorkspaceFolder[] | null` AND optional, so a client may spell
    // `no workspace` either way, and a normalisation covering one of them passes
    // a test that only sends the other.
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

    // THE ABSENCE IS PAIRED INSIDE ONE ASSERTION. A test reading only the empty
    // list cannot tell `nothing was synthesised` from `the field was dropped on
    // the floor`, so the rootUri the client sent is read back through the SAME
    // measurement: the empty list is then evidence about synthesis rather than
    // about plumbing. Its permanent presence arm is the test below, through the
    // same reader.
    //
    // WHAT IS DELIBERATELY NOT ASSERTED HERE, since a reader will otherwise
    // look for it: that a rootUri-only client REACHES A HANDLER WITH A FOLDER.
    // tsudoi cannot name a folder -- the protocol makes `name` a UI label the
    // client owns -- and no published reduction exists to synthesise one. What
    // a rootUri-only client gets is this and only this: the bytes, and an empty
    // list beside them.
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

    // THE ROOT IS SENT AND IS NOT FOLDED IN, which is what makes this more than
    // a repetition of the omitted spelling two tests above: the client named a
    // project, the list stays empty, and the author can SEE the project in the
    // field beside it.
    //
    // THE COUNTER-ARGUMENT, kept because it is grounded in the same chain: the
    // installed types say `null` means `supports workspace folders but none are
    // configured` -- a STATEMENT of emptiness, where omission is the absence of
    // one. NOTHING IN tsudoi TURNS ON THE DIFFERENCE AND NOTHING IS LEFT THAT
    // COULD: neither spelling reaches a folder, and the reduction that once fell
    // through an empty list on that distinction has been withdrawn.
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

    // THE PRESENCE ARM OF THE PAIR ABOVE, through the same reader.
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

    // IT IS THE WEAKEST TEST IN THIS FILE, AND SAYING SO IS THE POINT OF THIS
    // BLOCK. `fileURLToPath` throws on such a URI, and NOTHING IN tsudoi CALLS
    // IT ON THESE BYTES AT ALL -- so the throw belongs to whatever a config
    // author writes, and packages/tsudoi-language-server/src/types.ts says so
    // at `rootUri`.
    //
    // WHAT WOULD MAKE THIS RED TODAY: only a server that fails the handshake
    // outright, which every other test in this file would fail first. IT CANNOT
    // BE THE FIRST THING TO FAIL any more, and nobody should read its green as
    // coverage.
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

    // A RELATIVE rootPath RESOLVES ONLY AGAINST A WORKING DIRECTORY THE CLIENT
    // DOES NOT SHARE, so nothing downstream can turn it into `file://` plus this
    // process's launch directory -- because nothing downstream ever sees it.
    //
    // BOTH RELATIVE SPELLINGS, because they are two values and not one: "" is
    // what a client with a field to fill and nothing to put in it sends, and "."
    // is what a client that means `here` sends. Neither is absence, which is the
    // door `??` does not cover.
    //
    // THE PRESENCE ARM IS IN THIS TABLE AND NOT IN A TEST OF ITS OWN: an
    // absolute path travels THROUGH THE SAME READER and must arrive VERBATIM, so
    // `null` here is evidence about the refusal rather than about a field that
    // was dropped, a handle that never stored it, or a fixture that stopped
    // reporting it. Read as a pair, the table also says the refusal is NARROW.
    //
    // ITS NEGATIVE CONTROL IS WHY `isAbsolute` IS NAMED RATHER THAN IMPLIED:
    // replace it with a truthiness test and the "." row reddens, reporting "."
    // where null was expected, while "" and the absolute row stay green. A guard
    // written the obvious way passes two thirds of this table.
    test("a relative rootPath is refused and arrives as null, where an absolute one arrives verbatim", async () => {
      for (const [sent, expected] of [
        ["", null],
        [".", null],
        [rootedPath, rootedPath],
      ] as const) {
        const session = LspSession.start(runtime, echoConfig);
        try {
          await session.request<InitializeResult>("initialize", {
            ...initializeParams,
            rootPath: sent,
          });
          session.notify("initialized", {});

          expect(await mirrored(session)).toEqual({
            workspaceFolders: [],
            rootUri: null,
            rootPath: expected,
          });
        } finally {
          session.dispose();
        }
      }
    });

    // `node:path`'s `isAbsolute` RAISES `ERR_INVALID_ARG_TYPE` on a number, and
    // that throw lands in the `initialize` handler -- so a client sending
    // `"rootPath": 5` gets its handshake answered -32603, with nothing on stderr
    // and nothing in the LSP log, and the author has no server at all.
    // `rootPath !== null` passes a number straight into the throw.
    //
    // THE HANDSHAKE IS ASSERTED FIRST AND SEPARATELY from what arrived: the
    // failure this defends is a DEAD SESSION, and reading the mirror alone would
    // report it as `expected null, got undefined` -- a message about the fixture
    // rather than about the server that never answered.
    //
    // A NUMBER AND NOT A `{}`: a JSON-RPC client can put any JSON value here,
    // and 5 is the shortest one `typeof x === "string"` refuses while `x !==
    // null` admits. What it must arrive as is `null` -- the same answer a
    // relative path gets, because it is the same statement: not a root.
    test("a rootPath of the wrong type does not fail the handshake, and arrives as null", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootPath: 5,
        });
        expect(result.capabilities).toBeDefined();

        session.notify("initialized", {});

        expect(await mirrored(session)).toEqual({
          workspaceFolders: [],
          rootUri: null,
          rootPath: null,
        });
      } finally {
        session.dispose();
      }
    });

    // `"params": null` IS NOT A CONFORMING REQUEST: JSON-RPC 2.0 requires that
    // `If present, parameters for the rpc call MUST be provided as a Structured
    // value. Either by-position through an Array or by-name through an Object`,
    // and `null` is neither -- LSP requires an `InitializeParams` object
    // besides.
    //
    // THE RETRY IS ASSERTED THROUGH THE MIRROR AND NOT THROUGH THE RESPONSE,
    // which is what keeps this row this file's business rather than a second
    // copy of the lifecycle one: a refusal that MOVED THE PHASE would leave the
    // client's corrected `initialize` answered InvalidRequest and the folders it
    // named unreachable, so reading `sentFolders` back out through a hover
    // asserts both halves at once -- refused, and the session still owed.
    //
    // WHAT THIS DOES NOT PIN, stated rather than glossed: the mirror cannot be
    // OBSERVED between the refusal and the retry, since the hover that reads it
    // needs a handshake, and the retry writes the mirror whole. `nothing was
    // published by the refused message` is therefore carried by the entry
    // refusing before any handler runs, not by this assertion.
    //
    // WHAT WAS SWEPT AND FOUND NOT TO BE THIS CLASS, so that a later reader does
    // not take these tests as covering the field set: `"rootUri": 5` is refused
    // at the same entry, while `"workspaceFolders": 5` is NOT -- it is a list
    // this mirror reads as empty, and the test below owns it.
    test("a refused handshake leaves the session owed, and the retry is what the mirror answers from", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        const refusal = await session.requestError("initialize", null);
        expect(refusal.code).toBe(ErrorCodes.InvalidParams);

        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: sentFolders,
        });

        session.notify("initialized", {});

        expect(await mirrored(session)).toEqual({
          workspaceFolders: sentFolders,
          rootUri: null,
          rootPath: null,
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE LATER CHANGE IS THE HALF A HANDSHAKE-ONLY ARM CANNOT SEE, and it is
     * why this test sends one: reading the mirror straight back through a hover
     * shows nothing threw, while `change()` opens with `[...folders]` and
     * `[...5]` is a TypeError in the `workspace/didChangeWorkspaceFolders`
     * handler.
     *
     * WHY THAT IS WORSE THAN THE HANDSHAKE ONE RATHER THAN MILDER, though the
     * session survives it: a notification has NO RESPONSE, so the client is
     * never told its change failed. The folder the user added is silently
     * missing from every handler for the rest of the session, and the only trace
     * is one line on stderr.
     *
     * WHAT IS STILL PROPAGATED, so that this is not read as a validating mirror:
     * `[5]` -- an ARRAY of things that are not folders -- passes here and
     * reaches a handler as it arrived. `held.uri` on a number is `undefined`,
     * not a throw, so no exit is closed by inspecting elements, and inspecting
     * them would be tsudoi deciding what a client meant.
     */
    test("a workspaceFolders that is not a list is an empty one, and a later change still applies", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: 5,
        });
        session.notify("initialized", {});
        expect(await observedFolders(session)).toEqual([]);

        changeFolders(session, { added: [addedFolder] });

        expect(await observedFolders(session)).toEqual([addedFolder]);
      } finally {
        session.dispose();
      }
    });

    // BOTH FOLDERS, IN ORDER, AND NEVER `toContain`: a list that lost what the
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

    // THE DISCRIMINATING CASE FOR REMOVAL: an implementation that only appends
    // passes the added arm above and fails here.
    //
    // AN ECHOING ORACLE CANNOT PASS THIS. A server that answered with whatever
    // the last event mentioned, or that compared paths rather than strings,
    // produces something other than exactly `…/plain/` -- and the assertion is
    // the whole array, so `the survivor is in there somewhere` is not what is
    // being claimed.
    //
    // The session opens with NO folders on purpose, so the survivor is ALONE in
    // the list rather than sitting beside something initialize put there.
    test("a folder removed stops being observable, and the other spelling of it remains", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        changeFolders(session, { added: [plainFolder, plainSlashFolder] });
        // THE NON-FIRST SPELLING, and the choice is what makes this test
        // discriminate. Removing `…/plain` -- the FIRST entry -- leaves
        // `…/plain/` under exact matching AND under normalisation, because
        // one-copy-per-entry deletes one folder and first-match lands on the
        // intended target either way; with the removal named that way a
        // normalising matcher PASSES THIS ARM. Naming the
        // SECOND separates them -- exact matching leaves `…/plain`,
        // normalisation leaves `…/plain/`.
        changeFolders(session, { removed: [plainSlashFolder] });

        expect(await observedFolders(session)).toEqual([plainFolder]);
      } finally {
        session.dispose();
      }
    });

    // ONE EVENT, THE SAME URI IN BOTH ARMS -- the shape that can tell the two
    // orders apart.
    //
    // THE ORDERING HAS ONE REQUIRED OUTCOME, which is why it earns a test: a
    // client spelling a rename as one event ends HOLDING the folder, a phantom
    // that is visible if wrong, where the other order ends holding NOTHING,
    // which is silent.
    test("one event removing and adding the same URI ends holding the folder", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // THE LIST MUST NOT ALREADY HOLD IT, and that is the whole
        // construction: with the folder already held, one-copy-per-entry makes
        // the two orders AGREE -- remove-then-add gives [X], and add-then-remove
        // gives [X, X] minus one, also [X], so a fixture that pre-added the
        // folder reddens nothing under the flipped order. Starting empty
        // separates them.
        changeFolders(session, { removed: [plainFolder], added: [plainFolder] });

        expect(await observedFolders(session)).toEqual([plainFolder]);
      } finally {
        session.dispose();
      }
    });

    // AN `includes` GUARD PASSES EVERY OTHER ARM IN THIS FILE: deduplicating
    // would leave every one of them green while quietly disagreeing with the
    // client about what it holds. DECIDED ON OBSERVABILITY, NOT ON PRINCIPLE --
    // mirroring a duplicate can be wrong too, and the tiebreak is that a PHANTOM
    // entry shows up as visibly wrong items a user can report, while a MISSING
    // one is silent absence.
    //
    // TWO EVENTS, not one `added` array of two, because the guard this pins
    // against is written against the list AS IT STANDS: a filter comparing the
    // incoming array to the previous list admits both copies when they arrive
    // together, and would leave this passing while doing the wrong thing.
    //
    // The second entry carries a DIFFERENT NAME, so nothing here reconciles by
    // name either.
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

    // A FILTER THAT MATCHES EVERY ENTRY WITH THAT URI wipes both copies and
    // reddens the FIRST assertion, as `[sentFolders[0]]` where the client holds
    // `[sentFolders[0], addedFolder]`.
    //
    // THE SECOND ASSERTION HAS ITS OWN CONTROL, without which a second assertion
    // nothing can flip alone is decoration: a guard that removes a copy only
    // when the URI occurs MORE THAN ONCE leaves the first GREEN and reddens it.
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
    // assertion, and it sits INSIDE that assertion, so `they are gone` cannot be
    // satisfied by a measurement that observes nothing at all.
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

    // BORN GREEN AND SAYING SO: it passes against a remove-all filter just as
    // readily as against one-copy-per-entry removal, because that filter gets
    // this particular case right.
    //
    // ITS OWN TEST BECAUSE THE HAZARDS DIFFER, which is the whole reason a
    // born-green test is worth writing here. The remove-all filter PASSES this
    // and FAILS the sequential test above; deduping the `removed` array --
    // `new Set(event.removed.map(f => f.uri))` around a one-copy-per-entry
    // removal -- does the exact reverse. Neither control covers both, so
    // bundling the two claims into one test would leave whichever hazard is not
    // the first assertion permanently unobservable.
    //
    // TWO EVENTS TO ADD AND ONE TO REMOVE: the multiplicity has to arrive on
    // the REMOVED side within a SINGLE event, since that is the arm the dedupe
    // hazard lives on.
    //
    // THE REMOVED ENTRIES CARRY A DIFFERENT NAME than the copies they take, so
    // nothing here can pass by matching whole folders rather than URIs.
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

    // BOTH HALVES IN ONE REQUEST, AND NEITHER STANDS ALONE.
    // Live-without-copy-on-write is a surface on which a handler cannot answer
    // about the moment it started; copy-on-write without liveness is the frozen
    // snapshot this surface deliberately no longer takes. THE TWO PERTURBATIONS
    // ARE DIFFERENT AND EACH REDDENS ONE ASSERTION: making the handler capture
    // the folders once flips the second batch, and making `change()` push into
    // the live array flips the third.
    //
    // PROVEN BY ORDERING, NEVER BY A TIMING BOUND. The change is written to the
    // same stdin as the release that follows it, and the server frames what it
    // is sent in order -- so by the time the gate opens the change has already
    // been applied. Nothing here says `within N milliseconds`.
    //
    // THE LAST ASSERTION IS STILL LOAD-BEARING: a server that applied the change
    // to NOTHING would be caught by the in-flight batch alone only if that batch
    // is read as the change arriving, so the next request is what says the
    // mirror really moved rather than that one read happened to differ.
    test("a completion in flight sees a folder change, and the folders it already took do not move", async () => {
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

        await session.waitForProgress(3);
        // ITS SECOND YIELD CARRIES THE FOLDER ADDED WHILE IT WAS PARKED: the
        // read went to the server, and the server had already changed.
        expect(session.progress[1]).toEqual({ token: parkedToken, value: itemsFor(after) });
        // AND ITS THIRD YIELD IS THE ARRAY IT TOOK BEFORE PARKING, UNCHANGED --
        // the copy-on-write, which is what makes `take it before your first
        // await` an answer rather than advice.
        expect(session.progress[2]).toEqual({ token: parkedToken, value: itemsFor(before) });
        await parked;

        // THE NEXT REQUEST SEES THE CHANGE FROM ITS FIRST BATCH ON. Its gate is
        // already open, so all three yields arrive at once, and the third one --
        // the array that request took before it never had to park -- carries the
        // new folder too, which is what says the mirror moved rather than that
        // one read was late.
        await session.request<CompletionItem[] | null>("textDocument/completion", {
          textDocument: { uri },
          position: { line: 0, character: 0 },
          partialResultToken: nextToken,
        });

        expect(session.progress.slice(3)).toEqual([
          { token: nextToken, value: itemsFor(after) },
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
        `${runtime.command} ${runtime.runArgs.join(" ")} ${join(frameworkRoot, "src", "cli.ts")} --config ${echoConfig}`,
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
    // WHAT THIS DOES NOT DEFEND, MEASURED and recorded so nobody reads two
    // tests as two defences: it is BLIND TO THE cwd SUBSTITUTION its
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

    // THE HAZARD IS UNOWNED BY CODE AND IS ASSERTED HERE AS THE BEHAVIOUR IT
    // IS: an author reading `workspaceFolders` alone is handed `[]` where a
    // root exists, and THIS REPOSITORY'S OWN STAKEHOLDER-FACING EXAMPLE is such
    // an author.
    //
    // IT ASSERTS WHAT `@atusy/tsudoi-completion-path` CLAIMS IN PROSE at its
    // `sourcesFor` call, so the claim and the assertion move together.
    //
    // THE ABSENCE IS FIRST AND ITS NON-VACUITY PAIR IS SECOND: cwd answering
    // proves the completion ran for this fragment at all, so the empty workspace
    // list is evidence rather than a request that never happened. ITS PERMANENT
    // PRESENCE PAIR is the folders-sent test below, where the same filter over
    // the same wire DOES find workspace items.
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
    // which is what tells which root produced an item. It is a
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
        // folders legible rather than one indistinguishable pile -- AND `detail`
        // IS WHERE THAT NOW LIVES. The block says which CLASS of root offered
        // the item, so both folders' items carry the identical string
        // `source: workspace`: read there, this assertion degenerates to `two
        // items exist` while staying green, and `insertText` does not save it
        // either, both folders spelling the same relative text.
        expect(
          workspaceItems(items)
            .map((item) => item.detail)
            .sort(),
        ).toEqual(
          [
            join(first.root, "notes/first-only.txt"),
            join(second.root, "notes/second-only.txt"),
          ].sort(),
        );
        // AND THE BLOCK IS STILL THE ATTRIBUTION, asserted whole so that a
        // discriminator arriving back there is not read as this arm passing.
        //
        // PLAINTEXT BECAUSE THIS CLIENT DECLARED NOTHING: `initializeParams`
        // sends `capabilities: {}`, and the example answers markdown only to a
        // client that named it.
        expect(workspaceItems(items).map(documentationOf)).toEqual([
          "source: workspace",
          "source: workspace",
        ]);
      } finally {
        session.dispose();
        cwd.dispose();
        first.dispose();
        second.dispose();
      }
    });
  });
}
