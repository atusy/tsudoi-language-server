import { expect, test } from "bun:test";
import type {
  DidOpenTextDocumentParams,
  Range,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
// THE TYPE FROM THE PUBLISHED SUBPATH AND THE CONSTRUCTOR FROM UPSTREAM, which
// is the pair a config author ends up writing: tsudoi publishes this name
// TYPE-ONLY, so a value has to come from the package that declares it.
import type { TextDocument as PublishedTextDocument } from "@atusy/tsudoi-language-server/deps/textdocument";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createDocumentStore } from "../packages/tsudoi-language-server/src/documents.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

const uri = "file:///workspace/a.txt";
const otherUri = "file:///workspace/b.txt";

function opened(documentUri: string, text: string): DidOpenTextDocumentParams {
  return { textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text } };
}

/** One line's worth of range, `to` exclusive, as an editor sends it. */
function on(line: number, from: number, to: number): Range {
  return { start: { line, character: from }, end: { line, character: to } };
}

const startText = "hello world\nsecond line";

/**
 * Opens `startText` and sends one `didChange` per entry, so a SEQUENCE is
 * measured rather than a single edit. The version rises with the index for the
 * same reason a client's does -- it is the client's number, not a counter.
 */
function replayed(sequence: readonly TextDocumentContentChangeEvent[][]): string {
  const store = createDocumentStore();
  store.open(opened(uri, startText));
  sequence.forEach((contentChanges, index) => {
    store.change({ textDocument: { uri, version: index + 2 }, contentChanges });
  });
  // ANNOTATED RATHER THAN INFERRED, and the annotation is the assertion: what
  // the store hands back must BE the type tsudoi PUBLISHES, not merely something
  // shaped like it. IT IS ALSO WHAT ASKS THE ROOT PROGRAM FOR THAT SUBPATH,
  // which the resolution probe in test/package-shape.test.ts then observes -- a
  // published arm no file here imports is answered by nothing and reddens there.
  const document: PublishedTextDocument | undefined = store.documents.get(uri);
  const text = document?.getText();
  if (text === undefined) {
    throw new Error("the replayed sequence left no document under the uri");
  }
  return text;
}

// THE SECOND NOTIFICATION CARRIES TWO CHANGES IN ONE ARRAY, ON ONE LINE, AND
// THAT IS THE WHOLE DISCRIMINATION: LSP applies each entry to the document as
// the entries before it left it, so `[0,5) -> hi` moves the text that `[3,8) ->
// world` then addresses. A store keeping only the last entry -- which is what
// full sync entitled it to do -- computes `[3,8)` against `hello world` and
// gets something else entirely. With one change per notification that store
// passes, and this test would record nothing.
const ranged: TextDocumentContentChangeEvent[][] = [
  [{ range: on(0, 6, 11), text: "there" }],
  [
    { range: on(0, 0, 5), text: "hi" },
    { range: on(0, 3, 8), text: "world" },
  ],
  [{ range: on(1, 0, 6), text: "2nd" }],
];

// The same sequence as a client without incremental sync sends it: one whole
// buffer per notification, each the state the ranged notification above leaves.
const full: TextDocumentContentChangeEvent[][] = [
  [{ text: "hello there\nsecond line" }],
  [{ text: "hi world\nsecond line" }],
  [{ text: "hi world\n2nd line" }],
];

const finalText = "hi world\n2nd line";

test("a ranged edit sequence and the same sequence as full replacements agree byte for byte", () => {
  const rangedText = replayed(ranged);

  // Byte-identity is the claim, and it is asserted FIRST because it is the one
  // this test is named for. The literal on the line after is what stops two
  // arms that are equally wrong from satisfying it -- both empty, both
  // truncated, both the opening text -- which byte-identity alone cannot see.
  expect(rangedText).toBe(replayed(full));
  expect(rangedText).toBe(finalText);
});

test("open registers a document whose uri, languageId, version and text all match", () => {
  const store = createDocumentStore();

  store.open({
    textDocument: { uri, languageId: "plaintext", version: 1, text: "hello" },
  });

  const document = store.documents.get(uri);
  if (document === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }
  expect(document.uri).toBe(uri);
  expect(document.languageId).toBe("plaintext");
  expect(document.version).toBe(1);
  expect(document.getText()).toBe("hello");
  const all = [...store.documents.values()];
  expect(all).toHaveLength(1);
  expect(all[0]).toBe(document);
});

// THE NEGATIVE CONTROL FOR THE TEST ABOVE, PERMANENT RATHER THAN A
// PERTURBATION, because what it holds is that the byte-identity MEASUREMENT can
// observe divergence at all: `agree byte for byte` reports sameness, and a
// harness that reported sameness whatever it was fed would satisfy it exactly as
// well. One range moved by one character, the rest of the sequence untouched, is
// what tells `applied AT THE RIGHT OFFSET` from `applied`.
//
// THE SHIFT IS IN BOUNDS ON PURPOSE. Upstream clamps a character beyond the end
// of its line SILENTLY, so a shift that ran off the end could be clamped back
// onto the correct effective range and observe nothing. After `[0,5) -> hi` the
// first line is `hi there`, eight characters, and [2,7) sits inside it.
//
// THE RESULT IS NAMED RATHER THAN ASSERTED MERELY UNEQUAL. `not.toBe(finalText)`
// passes just as well when the store threw and left the buffer alone, or emptied
// it -- states that are not `applied at the wrong offset` at all. It also
// differs from `finalText` by construction, which is the divergence; asserting
// that two different literals differ could never be the first thing to fail.
//
// WHAT IT DOES NOT CLAIM: it is not the first detector of a store that ignores
// ranges wholesale. The byte-identity test reddens on that too, and sooner.
const wrongOffset: TextDocumentContentChangeEvent[][] = [
  [{ range: on(0, 6, 11), text: "there" }],
  [
    { range: on(0, 0, 5), text: "hi" },
    { range: on(0, 2, 7), text: "world" },
  ],
  [{ range: on(1, 0, 6), text: "2nd" }],
];

test("one range of that sequence moved by a single character produces different text", () => {
  expect(replayed(wrongOffset)).toBe("hiworlde\n2nd line");
});

test("successive changes leave getText() and version matching the last one sent", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "hello world" }],
  });
  store.change({
    textDocument: { uri, version: 7 },
    contentChanges: [{ text: "bye" }],
  });

  // Exact equality, and the last text is SHORTER than the one before it: a
  // store that concatenated instead of replacing would still contain "bye", so
  // only shrinking distinguishes replace from append. THESE CHANGES CARRY NO
  // RANGE, which the protocol permits under either sync kind and which is what
  // this test is about -- the ranged case is measured by the byte-identity test
  // above.
  expect(store.documents.get(uri)?.getText()).toBe("bye");
  // The version is the client's, not a counter: two changes, but version 7.
  expect(store.documents.get(uri)?.version).toBe(7);
  expect(store.documents.get(uri)?.languageId).toBe("plaintext");
});

// THE DOCUMENT A CONFIG AUTHOR HOLDS IS LIVE, NOT A SNAPSHOT, and a paragraph
// alone cannot hold that in place. It is the SEMANTICS the store
// acquired when it moved onto upstream's TextDocument -- `update` returns the
// same instance it was passed -- so a handler that reads a document, awaits, and
// reads it again sees the buffer the user has NOW.
//
// WHY IT IS PINNED HERE AND NOT LEFT TO THE COMMENT AT THE SITE: the `update`
// call is exactly the line a later change rewrites, and a rewrite that rebuilt
// the entry instead would revert the semantics with nothing to say so.
// MEASURED: rebuilding it with `TextDocument.create` from the updated text
// reddens the first assertion below and NOTHING ELSE IN THE SUITE.
//
// IT IS BOUNDED BY THE OPEN/CLOSE CYCLE, which is the last test in this file
// rather than a caveat here: a reference carried across a close stops moving.
//
// THE MECHANISM IS DELIBERATELY NOT ASSERTED. `held === store.documents.get(uri)`
// is the spelling upstream happens to use; what a config author is owed is that
// their reference is current, and every way that could stop being true --
// including one this project does not control -- flips the assertion below.
test("a reference taken before a change reflects that change afterwards", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));
  const held = store.documents.get(uri);
  if (held === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "hello world" }],
  });

  expect(held.getText()).toBe("hello world");
  expect(held.version).toBe(2);
});

// THE OTHER HALF OF THE PAIR ABOVE, and it defends a decision that would
// otherwise be held by prose alone: an empty change array is a notification
// saying nothing happened, and tsudoi returns before upstream sees it. Upstream
// WOULD raise the version -- measured -- so deleting that early return is a
// silent behaviour change, and the version assertion below is the only thing in
// the suite that notices. The text assertion is the presence half: whatever the
// version does, the buffer must not move.
test("an empty contentChanges moves neither the text nor the version", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));

  store.change({ textDocument: { uri, version: 9 }, contentChanges: [] });

  expect(store.documents.get(uri)?.version).toBe(1);
  expect(store.documents.get(uri)?.getText()).toBe("hello");
});

test("close removes the document, leaving get() undefined and values() empty", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));

  store.close({ textDocument: { uri } });

  expect(store.documents.get(uri)).toBeUndefined();
  expect([...store.documents.values()]).toEqual([]);
});

// A client may legitimately send these after a close it did not see us process,
// and a misbehaving one may send them for a document it never opened. Neither
// may throw: a throw here reaches vscode-jsonrpc's notification path, where
// nothing is waiting to report it to anyone.
test("change and close for a uri never opened are ignored, not fatal", () => {
  const store = createDocumentStore();

  store.change({ textDocument: { uri, version: 2 }, contentChanges: [{ text: "ghost" }] });

  // Asserted BEFORE any close: ignored has to mean ignored, and a change that
  // created the document implicitly would be hidden by a close that follows it.
  expect(store.documents.get(uri)).toBeUndefined();
  expect([...store.documents.values()]).toEqual([]);

  store.close({ textDocument: { uri } });

  expect(store.documents.get(uri)).toBeUndefined();
  expect([...store.documents.values()]).toEqual([]);
});

test("closing one of two open documents leaves exactly the other one", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "first"));
  store.open(opened(otherUri, "second"));

  store.close({ textDocument: { uri } });

  const remaining = [...store.documents.values()];
  expect(remaining).toHaveLength(1);
  expect(remaining[0]?.uri).toBe(otherUri);
  expect(remaining[0]?.getText()).toBe("second");
  expect(store.documents.get(uri)).toBeUndefined();
});

// WHAT A HANDLER IS HANDED CANNOT BE WRITTEN TO, AND THE STORE GOES ON
// SYNCHRONISING BEHIND IT. Those are one test because they are one design: the
// instance upstream's `update` writes is PRIVATE, and what leaves this store is
// a sealed view of it, so refusing the write costs synchronisation nothing.
//
// BOTH A SHADOWED MEMBER AND A NEW ONE, because they fail differently: a forged
// `getText` makes every later reader answer from a handler's string, and an
// added member makes the published document a shape no type declares. A seal
// that refused only the first would leave the second.
//
// THE READ AFTER THE CHANGE IS WHAT SEPARATES `sealed` FROM `frozen`: freezing
// upstream's own instance would refuse the forge just as well and BREAK the
// store -- `update` writes the content, the version and the line offsets -- so
// an assertion that stopped at the refusal would pass for the change that
// silently stops the buffer from moving at all.
test("a handler cannot forge a member of the document it is handed, and the buffer still moves", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "genuine"));
  const handed = store.documents.get(uri);
  if (handed === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }
  const forgeable = handed as unknown as { getText: () => string; forged?: unknown };

  expect(() => {
    forgeable.getText = () => "forged";
  }).toThrow(TypeError);
  expect(() => {
    forgeable.forged = 1;
  }).toThrow(TypeError);

  expect(store.documents.get(uri)?.getText()).toBe("genuine");

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "edited" }],
  });

  expect(store.documents.get(uri)?.getText()).toBe("edited");
  expect(store.documents.get(uri)?.version).toBe(2);
});

// WHICH DOCUMENT A CALLER IS HANDED IS A DECISION AND THIS IS WHERE IT IS
// RECORDED: ONE per open uri, handed back by every route and every call, and a
// DIFFERENT one after a close. A view built per call would answer every question
// in this file identically while making `get(uri) === get(uri)` false, and the
// liveness boundary below turns on exactly that identity.
//
// THE CROSS-CYCLE HALF IS NOT A RESTATEMENT OF THE BOUNDARY TEST BELOW: that one
// measures what the captured reference SAYS, and this one measures that it is
// not the object the store now holds -- a store that handed back one view per
// uri forever, reattached to the reopened buffer, would satisfy neither.
test("one document is handed back for the life of an open, and another after a reopen", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "first"));
  const captured = store.documents.get(uri);
  if (captured === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }

  expect(store.documents.get(uri)).toBe(captured);
  expect([...store.documents.values()][0]).toBe(captured);

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "edited while open" }],
  });
  expect(store.documents.get(uri)).toBe(captured);

  store.close({ textDocument: { uri } });
  store.open(opened(uri, "reopened"));

  expect(store.documents.get(uri)).not.toBe(captured);
});

// THE BOUNDARY OF THE LIVENESS PINNED ABOVE, and it is the half a reader gets
// wrong: a reference is live WITHIN ONE OPEN/CLOSE CYCLE AND NO FURTHER. `close`
// drops the entry, the `didOpen` that follows CONSTRUCTS A NEW DOCUMENT, and a
// handler still holding the old one holds a detached snapshot.
//
// THE VERSION ASSERTION RECORDS WHY THE DETACHMENT IS SILENT, and it is a
// record rather than the discriminator: the stale reference reports the SAME
// number as the live document while their texts differ, so a handler comparing
// versions to decide whether its reference is current is told everything is
// fine. What reddens when a reference DOES survive a close is the text
// assertion beside it.
//
// THE SAME-CYCLE ASSERTION IS A CONTROL, not coverage: a store that had stopped
// tracking edits at all would satisfy every cross-cycle assertion below for a
// reason that has nothing to do with the close, and that assertion is what
// separates the two.
//
// MEASURED: an `open` that reuses and updates a document it built for that URI
// earlier -- the store the liveness paragraph in src/documents.ts would describe
// if the reference did survive -- reddens this test and NOTHING ELSE in the
// suite, close's own removal tests included.
test("a reference captured before a close stops tracking the reopened document", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "first"));
  const captured = store.documents.get(uri);
  if (captured === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "edited while open" }],
  });
  expect(captured.getText()).toBe("edited while open");

  store.close({ textDocument: { uri } });
  store.open(opened(uri, "reopened"));
  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "edited after reopen" }],
  });

  const reopened = store.documents.get(uri);
  if (reopened === undefined) {
    throw new Error("the reopened uri registered nothing");
  }

  expect(reopened.getText()).toBe("edited after reopen");
  expect(captured.getText()).toBe("edited while open");
  expect(captured.version).toBe(reopened.version);
});

// WHICH UPSTREAM HELPERS ANSWER FROM A DOCUMENT THIS STORE HANDS OUT, and the
// line runs between READING and NEEDING THE INSTANCE rather than between
// documented and undocumented. `TextDocument.update` is the whole of the far
// side today: it opens with an `instanceof` against the class `create` builds,
// so the view -- a sealed forwarder, built by no constructor -- is refused
// before a single member is read.
//
// PINNED RATHER THAN LEFT TO BE DISCOVERED IN AN EDITOR, which is where a config
// author otherwise meets it: the call TYPE-CHECKS, per the probe below, so
// nothing warns them and the throw arrives inside a live handler.
//
// THE MESSAGE IS ASSERTED AND NOT ONLY THE THROW, because every other reason a
// call like this could fail -- a member missing, a range rejected -- also throws,
// and this test would then pass for a document that had stopped forwarding at
// all.
//
// THE READ AFTERWARDS IS THE OTHER HALF: the refusal must cost the buffer
// nothing, and an `update` that had written the version before checking would
// leave the store reporting a state no client sent.
test("an upstream update refuses a document the store hands out, and the buffer is untouched", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "genuine"));
  const handed = store.documents.get(uri);
  if (handed === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }

  expect(() => TextDocument.update(handed, [{ text: "forged" }], 9)).toThrow(
    "document must be created by TextDocument.create",
  );

  expect(store.documents.get(uri)?.getText()).toBe("genuine");
  expect(store.documents.get(uri)?.version).toBe(1);
});

// THE NEAR SIDE OF THAT LINE, and it is what makes the refusal above a BOUNDARY
// rather than a blanket incompatibility: `applyEdits` only ever READS the seven
// members and returns a string, so it answers from the view exactly as it would
// from upstream's own instance.
//
// ASKED AFTER A CHANGE, because a helper reading a SNAPSHOT would answer this
// identically at version 1: what is measured is that upstream's reader reaches
// the buffer as it stands when it is called, which is the liveness the store
// publishes carried through a function that never heard of this project.
test("an upstream helper that only reads answers from the document the store hands out", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello world"));
  const handed = store.documents.get(uri);
  if (handed === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }

  expect(TextDocument.applyEdits(handed, [])).toBe("hello world");

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "hello there" }],
  });

  expect(TextDocument.applyEdits(handed, [{ range: on(0, 0, 5), newText: "bye" }])).toBe(
    "bye there",
  );
});

/**
 * THE ONE THING THE PUBLISHED TYPE CANNOT SAY, ASSERTED AS THE GREEN IT IS.
 *
 * `DocumentView` carries exactly upstream's seven members with exactly their
 * signatures, so the two interfaces are MUTUALLY ASSIGNABLE and tsc accepts a
 * view wherever upstream's `TextDocument` is asked for -- including the call the
 * test above watches THROW. A reader who assumes the rename closed that hole is
 * owed the measurement rather than the assurance.
 *
 * WHY IT IS NOT CLOSED, since the shape that would close it is one line: a
 * required brand member makes the view unassignable to upstream AND upstream
 * unassignable to the view, and the second direction is the one an author uses
 * -- a helper of theirs typed against `DocumentView`, handed a document they
 * built with `TextDocument.create` in their own tests. That direction is pinned
 * below. There is no member set that keeps it and refuses this.
 *
 * WHAT REDDENS IT is upstream branding its own interface, which would make the
 * runtime refusal a compile error at last -- and this is the test that would
 * report it, rather than the change being noticed by nobody.
 */
test("passing a handed-out document to an upstream update still type-checks, which is why the throw is pinned", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import { TextDocument } from "vscode-languageserver-textdocument";',
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      'const document = tsudoi.documents.get("file:///a.txt");',
      "if (document !== undefined) {",
      '  TextDocument.update(document, [{ text: "x" }], 2);',
      "}",
      "",
    ].join("\n"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE DIRECTION AN AUTHOR ACTUALLY WRITES, and the reason the view is declared
 * structurally rather than branded: `DocumentView` is SATISFIED BY a real
 * upstream document, so a helper typed against tsudoi's own type accepts the one
 * a config author builds with `TextDocument.create` for their own tests. Without
 * this they would have to keep two overloads, or annotate against a type tsudoi
 * does not hand them.
 *
 * `TextDocument.create` AND NOT A DECLARED BINDING, because the value is what an
 * author has: a probe over `declare const` would go on passing if `create` ever
 * returned something narrower than the interface it is declared to return.
 */
test("a document built by the upstream factory satisfies the published view", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import { TextDocument } from "vscode-languageserver-textdocument";',
      'import type { DocumentView } from "./src/types.ts";',
      'export const view: DocumentView = TextDocument.create("file:///a.txt", "plaintext", 1, "x");',
      "export const text = view.getText();",
      "",
    ].join("\n"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});
