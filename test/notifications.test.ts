import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Disposable,
  NotificationType,
  type ProtocolConnection,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol/node";
import { createDocumentStore } from "../packages/tsudoi-language-server/src/documents.ts";
import { createLifecycle } from "../packages/tsudoi-language-server/src/lifecycle.ts";
import * as router from "../packages/tsudoi-language-server/src/notifications.ts";
import {
  type NotificationRegistrar,
  registerNotifications,
  type RequestOnlyConnection,
} from "../packages/tsudoi-language-server/src/notifications.ts";
import { notificationEntries } from "../packages/tsudoi-language-server/src/server.ts";
import { createWorkspaceFolders } from "../packages/tsudoi-language-server/src/workspace.ts";
import { frameworkRoot } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * A connection that only remembers what was registered, so a notification can
 * be delivered in a chosen lifecycle phase without a process, a pipe or a
 * client.
 *
 * WHAT THIS COVERS AND WHAT IT DOES NOT, stated because neither half is enough
 * alone: this proves the ROUTER's logic -- which handler runs in which phase --
 * and stubs registration itself, so it cannot see whether startServer wires the
 * real connection to it. protocol.test.ts drives a real server over stdio and
 * proves exactly that half, on the messages a client actually sends.
 */
function recordingConnection(): {
  connection: NotificationRegistrar;
  deliver: (method: string, params: unknown) => unknown;
} {
  const registered = new Map<string, (params: unknown) => void>();
  return {
    connection: {
      // BOTH REGISTRATION SHAPES THROUGH ONE MAP, keyed by the name either one
      // arrives under, so `deliver` cannot tell which was used -- which is what
      // makes it able to grade a router that mixed them up.
      onNotification(
        type: NotificationType<unknown> | string,
        handler: (params: unknown) => void,
      ): Disposable {
        // The one cast, and it is the stub's: the map holds handlers for
        // several params types at once, exactly as the real connection does.
        registered.set(typeof type === "string" ? type : type.method, handler);
        return { dispose: () => {} };
      },
    },
    deliver(method: string, params: unknown): unknown {
      const handler = registered.get(method);
      if (handler === undefined) {
        throw new Error(`nothing was registered for ${method}`);
      }
      return handler(params);
    },
  };
}

/** Two notifications of tsudoi's own invention: the router knows no names. */
const gatedType = new NotificationType<{ mark: string }>("test/gated");
const ungatedType = new NotificationType<{ mark: string }>("test/ungated");

// THE HANDLER BODIES ARE EMPTY OF ANY LIFECYCLE KNOWLEDGE ON PURPOSE: whoever
// writes a notification cannot make it run at a moment the entry did not allow,
// because nothing in the body decides that.
test("a handler whose body consults nothing is refused before initialize and after shutdown, and runs in between", () => {
  const lifecycle = createLifecycle();
  const { connection, deliver } = recordingConnection();
  const seen: string[] = [];
  registerNotifications(connection, lifecycle, [
    { type: gatedType, handler: (params) => seen.push(params.mark), gate: "lifecycle" },
  ]);

  deliver("test/gated", { mark: "before initialize" });
  expect(seen).toEqual([]);

  // THE PAIRED PRESENCE, permanent: the same delivery, observed by the same
  // array, inside the window. Without it `seen is empty` would also pass
  // against a router that registered nothing at all, or a stub that dropped
  // every delivery.
  lifecycle.initialize();
  deliver("test/gated", { mark: "serving" });
  expect(seen).toEqual(["serving"]);

  lifecycle.shutDown();
  deliver("test/gated", { mark: "after shutdown" });
  expect(seen).toEqual(["serving"]);
});

// THE END-TO-END EXIT CODES ARE PINNED ELSEWHERE AND ARE NOT DUPLICATED HERE:
// a second spawned exit test could never be the first thing to fail. What this
// one holds is the carve-out those codes depend on -- a gate that swallowed
// `exit` would turn both into a hang.
test("an entry gated always reaches its handler before initialize and after shutdown", () => {
  const lifecycle = createLifecycle();
  const { connection, deliver } = recordingConnection();
  const seen: string[] = [];
  registerNotifications(connection, lifecycle, [
    { type: ungatedType, handler: (params) => seen.push(params.mark), gate: "always" },
  ]);

  deliver("test/ungated", { mark: "before initialize" });
  lifecycle.initialize();
  deliver("test/ungated", { mark: "serving" });
  lifecycle.shutDown();
  deliver("test/ungated", { mark: "after shutdown" });

  expect(seen).toEqual(["before initialize", "serving", "after shutdown"]);
});

// THE HANDLE IS READ DIRECTLY BECAUSE NEITHER HALF CAN BE DRIVEN END-TO-END:
// before `initialize` the folder list is REPLACED by whatever initialize states,
// so an ungated write leaves no trace to find; after `shutdown` every request is
// refused, so no handler is left to read the list back through.
//
// NOT THE CLAIM THE ENTRY-TABLE TEST BELOW MAKES, though giving this entry
// `gate: "always"` reddens both: that one asserts what the entry DECLARES, this
// one what the declaration DOES. A table could declare correctly and a router
// could ignore it.
test("a folder change outside the initialized window does not mutate the list, and one inside does", () => {
  const lifecycle = createLifecycle();
  const workspaceFolders = createWorkspaceFolders();
  const { connection, deliver } = recordingConnection();
  registerNotifications(
    connection,
    lifecycle,
    notificationEntries(createDocumentStore(), lifecycle, workspaceFolders),
  );
  const early: WorkspaceFolder = { uri: "file:///too/early", name: "early" };
  const served: WorkspaceFolder = { uri: "file:///served", name: "served" };
  const late: WorkspaceFolder = { uri: "file:///too/late", name: "late" };

  deliver("workspace/didChangeWorkspaceFolders", { event: { added: [early], removed: [] } });
  expect([...workspaceFolders.folders.values()]).toEqual([]);

  // THE PAIRED PRESENCE: a normal change STILL APPLIES. Without it, `the list is
  // unchanged` would also hold for a router that registered nothing, for a stub
  // that dropped every delivery, and for a handle that ignores its own writer.
  lifecycle.initialize();
  deliver("workspace/didChangeWorkspaceFolders", { event: { added: [served], removed: [] } });
  expect([...workspaceFolders.folders.values()]).toEqual([served]);

  lifecycle.shutDown();
  deliver("workspace/didChangeWorkspaceFolders", { event: { added: [late], removed: [] } });
  expect([...workspaceFolders.folders.values()]).toEqual([served]);
});

test("a custom didOpen observes the document after the built-in opens it", async () => {
  const lifecycle = createLifecycle();
  lifecycle.initialize();
  const documents = createDocumentStore();
  const workspaceFolders = createWorkspaceFolders();
  const { connection, deliver } = recordingConnection();
  const uri = "file:///hooked.ts";
  let observed: string | undefined;
  registerNotifications(
    connection,
    lifecycle,
    notificationEntries(documents, lifecycle, workspaceFolders),
    [
      {
        method: "textDocument/didOpen",
        gate: "lifecycle",
        run: () => {
          observed = documents.documents.get(uri)?.getText();
          return Promise.resolve();
        },
      },
    ],
  );

  await deliver("textDocument/didOpen", {
    textDocument: { uri, languageId: "typescript", version: 1, text: "opened" },
  });

  expect(observed).toBe("opened");
});

/**
 * Source with its comments removed, so that a check QUOTED in a comment -- as
 * the deleted one is, in notifications.ts -- is not counted as a call. The `//`
 * arm also truncates a line at a `//` inside a string literal, which costs
 * nothing here: no such line calls the gate.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function gateCalls(source: string): string[] {
  return [...withoutComments(source).matchAll(/\bacceptsNotification\s*\(/g)].map(
    (match) => match[0],
  );
}

function readSource(name: string): string {
  return readFileSync(join(frameworkRoot, "src", name), "utf8");
}

// READ OFF THE FILE'S OWN BYTES, because the claim is about what
// packages/tsudoi-language-server/src/server.ts SAYS: checked any other way it
// would rot the moment someone put a check back.
test("no handler body in src/server.ts calls the notification gate", () => {
  expect(gateCalls(readSource("server.ts"))).toEqual([]);
});

// THE PAIR, and it is the real router rather than a synthetic string on
// purpose: it fails if `acceptsNotification` is renamed, which would otherwise
// leave the assertion above passing while measuring nothing.
test("the same scan finds the one call the router makes", () => {
  expect(gateCalls(readSource("notifications.ts"))).toHaveLength(1);
});

/** The anchor the why-not record is required to sit against. */
const RECORD_ANCHOR = "export function createGatedConnection";

/**
 * The doc block IMMEDIATELY PRECEDING `createGatedConnection`, or a throw.
 *
 * THE OPPOSITE OF `withoutComments` ABOVE, and the two are not in tension: that
 * one exists because a gate call QUOTED in prose is not a call, this one because
 * a decision recorded ANYWHERE ELSE IN THE FILE is not recorded at the site the
 * violating edit would be made. Each reads the half the other discards.
 *
 * `IMMEDIATELY` IS ENFORCED RATHER THAN ASSUMED: only whitespace may sit between
 * the block's closing delimiter and the anchor. Without that check a record that
 * drifted above some later-inserted declaration would still be found, and the
 * assertion below would keep passing for a file where the reader who needs it no
 * longer sees it.
 */
function recordBlockOf(source: string): string {
  const at = source.indexOf(RECORD_ANCHOR);
  if (at === -1) {
    throw new Error(
      `packages/tsudoi-language-server/src/notifications.ts: no \`${RECORD_ANCHOR}\` to read a record from`,
    );
  }
  const before = source.slice(0, at);
  const closed = before.lastIndexOf("*/");
  const opened = before.lastIndexOf("/**");
  if (opened === -1 || closed < opened) {
    throw new Error(
      `packages/tsudoi-language-server/src/notifications.ts: no doc block precedes \`${RECORD_ANCHOR}\``,
    );
  }
  if (before.slice(closed + 2).trim() !== "") {
    throw new Error(
      `packages/tsudoi-language-server/src/notifications.ts: the doc block does not immediately precede the anchor`,
    );
  }
  return before.slice(opened, closed + 2);
}

/**
 * What the record must NAME, each token paired with the clause it defends.
 *
 * THE VERSION IS ASSERTED ADJACENT TO ITS PACKAGE, not as a second independent
 * substring: `vscode-languageserver` alone would also be matched by the
 * `vscode-languageserver-protocol 3.18.2` sentences ALREADY in that file, so the
 * bare name would assert nothing the file does not already satisfy.
 *
 * THE LAST TWO ARE THE FOR-DIRECTION: A RECORD THAT ONLY CARRIES THE CASE
 * AGAINST IS AN ADVOCACY DOCUMENT, NOT A DECISION RECORD. Delete either finding
 * and this reddens naming it.
 */
const RECORD_TOKENS: readonly { readonly defends: string; readonly token: RegExp }[] = [
  {
    defends: "the package WITH the version it was measured at",
    token: /vscode-languageserver 10\.1\.0/,
  },
  { defends: "a path inside that package", token: /lib\/common\/server\.d\.ts/ },
  {
    defends: "the FOR direction: capability filling adds nothing",
    token: /fillServerCapabilities/,
  },
  { defends: "the FOR direction: the shutdown hook coexists with -32600", token: /onShutdown/ },
];

// A LIST OF WHAT IS MISSING RATHER THAN INDEPENDENT `toContain`s, so the failure
// NAMES THE CLAUSE that went rather than only saying a substring was absent.
test("the record at createGatedConnection names what would let it be re-run, in both directions", () => {
  const block = recordBlockOf(readSource("notifications.ts"));

  expect(
    RECORD_TOKENS.filter(({ token }) => token.test(block) === false).map(({ defends }) => defends),
  ).toEqual([]);
});

// THE VACUITY CONTROL, permanent rather than a one-time perturbation: an
// extractor that returned "" for a file it could not parse would make every
// token assertion above VACUOUSLY FALSE -- or, had it returned the whole source,
// vacuously true against tokens sitting anywhere at all. The probe is THIS
// source with the anchor renamed, not a hand-written string, because that is how
// the mechanism actually breaks: someone renames the function.
test("the same extractor throws when the anchor is gone, rather than reporting nothing found", () => {
  const renamed = readSource("notifications.ts").replace(
    RECORD_ANCHOR,
    "export function createGated",
  );

  expect(() => recordBlockOf(renamed)).toThrow(`no \`${RECORD_ANCHOR}\``);
});

// A DIFFERENT HAZARD FROM THE ONE ABOVE, which is why it owns a test: the
// anchor is present, a doc block is present, and the two have come apart. The
// test above cannot observe it, since renaming the anchor flips at the first
// check and stops there.
test("the same extractor throws when the record no longer sits against the anchor", () => {
  const detached = readSource("notifications.ts").replace(
    RECORD_ANCHOR,
    `type Detached = never;\n${RECORD_ANCHOR}`,
  );

  expect(() => recordBlockOf(detached)).toThrow("does not immediately precede");
});

function entryProbe(entry: string): Record<string, string> {
  return {
    "probe.ts": [
      'import { NotificationType } from "vscode-languageserver-protocol/node";',
      'import type { Lifecycle } from "./src/lifecycle.ts";',
      'import { type NotificationRegistrar, registerNotifications } from "./src/notifications.ts";',
      "",
      "const connection = null as unknown as NotificationRegistrar;",
      "const lifecycle = null as unknown as Lifecycle;",
      'const probed = new NotificationType<{ mark: string }>("test/probed");',
      "",
      `registerNotifications(connection, lifecycle, [${entry}]);`,
      "",
    ].join("\n"),
  };
}

// WHAT MAKES THIS FORECLOSURE RATHER THAN DETECTION: the DoD's own
// `tsc --noEmit` can only say that what IS written compiles. That a
// notification written WITHOUT deciding its gate does not
// compile is a claim about a source this repo must never contain, so it is
// asserted against a throwaway project instead.
test("an entry that decides no gate does not type-check, and the diagnostic names gate", async () => {
  const result = await typeCheckProbe(
    entryProbe("{ type: probed, handler: (params) => void params.mark }"),
  );

  expect(result.code).toBe(1);
  // The DIAGNOSTIC, not merely a non-zero exit: a probe that failed to resolve
  // an import would also exit 1.
  expect(result.output).toContain("gate");
});

// The pair: the same probe, the same project, one field added.
test("the same entry with a gate type-checks", async () => {
  const result = await typeCheckProbe(
    entryProbe('{ type: probed, handler: (params) => void params.mark, gate: "lifecycle" }'),
  );

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * WHY THIS EXISTS WHEN A HANG ALREADY CATCHES IT: gating `exit` times
 * `lifecycle.test.ts`'s shutdown-then-exit test out on both runtimes, so the
 * failure IS detected -- but that detection can never be the FIRST thing to
 * fail. It arrives as a suite that stopped finishing, with nothing naming the
 * cause. This one fails immediately, by name.
 *
 * A VALUE and not a regex over the file: in a table-driven router the entry's
 * `gate` IS the decision, declaratively, so asserting the value survives any
 * reformatting that a source scan would not.
 *
 * THE PAIR, so `always` is not read off a table that could be empty or
 * mis-keyed: every OTHER entry is asserted to be `lifecycle` in the same
 * measurement, which a table returning one blanket value could not satisfy.
 *
 * REMOVING THE LAST `always` ENTRY IS A SCOPE DECISION AND NOT A CLEANUP, and
 * this block is the site of that edit. Both assertions below redden if `exit`'s
 * entry goes, which is the loud half; the quiet half is what comes after --
 * with nothing left declaring `always`, the union in
 * packages/tsudoi-language-server/src/notifications.ts collapses to a single
 * member, and whatever is written in this test's place can then only restate
 * what the type already guarantees. THE KNOWN REASON ANYONE WOULD WANT TO is
 * recorded at `createGatedConnection` in
 * packages/tsudoi-language-server/src/notifications.ts: the framework's exit-0
 * path fires only if tsudoi stops registering `exit` itself, so that path and
 * this carve-out cannot both be had.
 */
test("exit's entry declares always, and every other entry declares lifecycle", () => {
  const entries = notificationEntries(
    createDocumentStore(),
    createLifecycle(),
    createWorkspaceFolders(),
  );
  const gates = entries.map((entry) => ({
    method: (entry.type as { method?: string }).method ?? String(entry.type),
    gate: entry.gate,
  }));

  expect(gates.filter((entry) => entry.gate === "always").map((entry) => entry.method)).toEqual([
    "exit",
  ]);
  expect(gates.filter((entry) => entry.gate === "lifecycle")).toHaveLength(gates.length - 1);
});

/**
 * A probe source binding the narrowed connection and doing `body` with it.
 *
 * The binding is called `connection` because that is the IDENTIFIER the
 * rejected `no-restricted-properties` rule matched on; the renamed pair below
 * is what shows the type does not care.
 *
 * EVERY NAME A PROBE BODY COULD NEED IS IMPORTED HERE, and the ones any single
 * body leaves unused cost nothing: this tsconfig sets no `noUnusedLocals`.
 */
function narrowedSource(body: string[]): string {
  return [
    'import { InitializedNotification, ProgressType, ShutdownRequest, Trace } from "vscode-languageserver-protocol/node";',
    'import type { Tracer } from "vscode-languageserver-protocol/node";',
    'import type { RequestOnlyConnection } from "./src/notifications.ts";',
    "",
    "const connection = null as unknown as RequestOnlyConnection;",
    ...body,
    "",
  ].join("\n");
}

/** The forbidden call and the permitted one, as ONE project tsc checks together. */
const forbidsAndPermits: Record<string, string> = {
  "forbids.ts": narrowedSource([
    "connection.onNotification(InitializedNotification.type, () => {});",
  ]),
  "permits.ts": narrowedSource(["connection.onRequest(ShutdownRequest.type, (): void => {});"]),
};

// BOTH HALVES IN ONE RUN -- one project, one tsconfig, one tsc invocation, so
// the pass and the failure are read off the SAME measurement and cannot differ
// by anything the probe set up.
//
// A FIRING-HALF-ONLY PROBE WOULD PASS A TYPE THAT FORBIDS EVERYTHING, which is
// why the permitted half is not optional: `Omit<ProtocolConnection, keyof
// ProtocolConnection>` satisfies the failing half perfectly and would leave
// packages/tsudoi-language-server/src/server.ts unable to register a request.
//
// THE DIAGNOSTIC IS BOUND TO THE FILE ON ONE LINE, not asserted as two
// independent `toContain`s: in a multi-file run a diagnostic in permits.ts
// mentioning onNotification would satisfy a bare substring check and record
// nothing.
test("the narrowed connection rejects onNotification and accepts onRequest, in one type-check", async () => {
  const result = await typeCheckProbe(forbidsAndPermits);

  expect(result.output).toMatch(
    /forbids\.ts\(\d+,\d+\): error TS\d+: Property 'onNotification' does not exist/,
  );
  // The permitted half: NOT `exit 0`, which the failing half already denies --
  // no diagnostic anywhere names this file.
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

// THE PRESENCE PAIR for the absence assertion above, permanent: the same
// measurement, the same file name, the same binding -- with one member that is
// genuinely not there. Without it, `no diagnostic names permits.ts` would also
// hold for a probe that never compiled permits.ts at all, or one whose tsconfig
// left it out of `files`.
//
// The error is put ON THE BINDING rather than in free-standing code so the pair
// shows tsc checked THE NARROWED CONNECTION in that file, not merely that it
// parsed the file.
test("the same run does name permits.ts when the narrowed connection there is misused", async () => {
  const result = await typeCheckProbe({
    "forbids.ts": forbidsAndPermits["forbids.ts"] as string,
    "permits.ts": narrowedSource(["connection.definitelyNotAMethod();"]),
  });

  expect(result.output).toMatch(
    /permits\.ts\(\d+,\d+\): error TS\d+: Property 'definitelyNotAMethod' does not exist/,
  );
});

/**
 * The same two halves reached through a SECOND binding under a different name.
 *
 * `const conn = connection` is not an arbitrary rename: it is the exact shape
 * MEASURED to walk straight past `no-restricted-properties`, the working lint
 * rule this route was chosen over. Driving it here is what makes
 * rename-independence ASSERTED rather than inferred from `types do not read
 * identifiers` -- and that property is the whole reason the type route was
 * preferred, so leaving it to inference would leave the route's justification
 * unpinned.
 */
const aliasedSource = (call: string): string =>
  narrowedSource(["const conn = connection;", `conn.${call}`]);

test("the same two outcomes hold through an alias under a different name", async () => {
  const result = await typeCheckProbe({
    "renamed.ts": aliasedSource("onNotification(InitializedNotification.type, () => {});"),
    "permits.ts": aliasedSource("onRequest(ShutdownRequest.type, (): void => {});"),
  });

  expect(result.output).toMatch(
    /renamed\.ts\(\d+,\d+\): error TS\d+: Property 'onNotification' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

/**
 * ITS OWN TEST RATHER THAN A SECOND CALL INSIDE `forbids.ts`: a hazard must own
 * a test whose FIRST assertion it is, and appended to the test above it could
 * only ever be the second.
 *
 * WHY IT IS WORTH A TOKEN WHEN `onNotification` ALREADY WENT: reaching this one
 * needs NO DELIBERATE ACT. It sits on the handle `createGatedConnection` hands
 * out, so `no longer reachable by accident` -- the argument that makes the
 * import ban adequate -- never covered it. That it is an EVENT PROPERTY holding
 * a callable rather than a method changes nothing, since `Omit` removes a
 * property whatever its type is.
 *
 * `permits.ts` IS THE SAME STRING the pair above uses, not a copy that could
 * drift.
 */
const forbidsUnhandledAndPermits: Record<string, string> = {
  "forbids.ts": narrowedSource(["connection.onUnhandledNotification(() => {});"]),
  "permits.ts": forbidsAndPermits["permits.ts"] as string,
};

test("the narrowed connection rejects onUnhandledNotification and accepts onRequest, in one type-check", async () => {
  const result = await typeCheckProbe(forbidsUnhandledAndPermits);

  // BOUND TO THE FILE AND TO THE SYMBOL. A bare non-zero exit goes GREEN against
  // a module with no narrowing whatsoever -- an unresolved
  // `RequestOnlyConnection` exits 1 on TS2305 alone. And a symbol MISSPELLED
  // inside the `Omit` is a silent no-op: `Omit<T, K>` accepts a key that is not
  // in `keyof T` and returns T unchanged, so nothing but a probe naming this
  // symbol can tell the two apart.
  expect(result.output).toMatch(
    /forbids\.ts\(\d+,\d+\): error TS\d+: Property 'onUnhandledNotification' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

/** `T` if the two unions have the same members, `false` otherwise. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Fails to type-check unless `T` is `true`. */
type Assert<T extends true> = T;

/**
 * THE `AND NOTHING ELSE` HALF OF THE BOUNDARY
 * packages/tsudoi-language-server/src/notifications.ts CLAIMS.
 *
 * Every probe above names a member the `Omit` REMOVES or one it KEEPS, so all of
 * them stay green when a FURTHER key is added to it -- appending
 * `| "sendNotification"` leaves the whole suite green with nothing objecting,
 * while the boundary sentence beside the type silently becomes false. This fails
 * first and by name in that case.
 *
 * A SET DIFFERENCE RATHER THAN A SAMPLE, which is what `and nothing else`
 * actually asserts, and both directions are load-bearing. An `Omit` short by one
 * key, a key MISSPELLED as `onUnhandledNotifcation` (which `Omit` accepts and
 * ignores, leaving the type unchanged) and the surplus key above each redden
 * THIS line with TS2344 while the rest of `tsc --noEmit` stays at zero
 * diagnostics -- the type itself compiles in all of them, which is the whole
 * reason an exit code proves nothing here.
 *
 * WHAT IT DOES NOT SEE, and the reason the pin below exists beside it: this is a
 * DIFFERENCE, so a member the DEPENDENCY adds lands on both sides of the
 * `Exclude` and cancels out. It moves only when the `Omit` moves.
 *
 * CHECKED BY `tsc --noEmit`, NOT BY bun test, so it is deliberately not dressed
 * as a test: a runtime `expect(true).toBe(true)` beside it would observe the
 * same thing whether the type held or not.
 */
export type BoundaryIsTheObservingMembers = Assert<
  Exact<
    Exclude<keyof ProtocolConnection, keyof RequestOnlyConnection>,
    "onNotification" | "onUnhandledNotification" | "onProgress" | "trace"
  >
>;

/**
 * THE COMPILER DOES THE ENUMERATING, WHICH IS THE ENTIRE POINT. The left side is
 * read out of vscode-languageserver-protocol's own connection.d.ts by tsc; only
 * the right side is written by hand. So the two can never quietly agree by
 * accident, and if the dependency ADDS, REMOVES or RENAMES a member, this line
 * reddens with TS2344 and names the file it lives in. A HAND-WRITTEN LIST IN A
 * COMMENT IS WHAT THIS REPLACES, and it is exactly the artefact that lets a
 * member like `onProgress` or `trace` sit unnoticed on the handle indefinitely.
 *
 * IT IS THE OTHER DIRECTION FROM THE PIN ABOVE, and neither substitutes for the
 * other: that one is a set DIFFERENCE, so a member the dependency adds appears
 * on both sides and cancels; this one has no `RequestOnlyConnection` in it, so
 * a key added to the `Omit` leaves it untouched. Between them, a member
 * arriving from the dependency and a key arriving in the `Omit` both redden
 * something.
 *
 * WHAT THIS DOES NOT ASSERT, IN THREE DIRECTIONS, stated in full because the
 * sentence it supports at packages/tsudoi-language-server/src/notifications.ts
 * outruns it in every one of them.
 *
 * FIRST, IT ASSERTS THE SET OF NAMES AND NOT WHAT THEY DO. A member still on the
 * list that GROWS a way to observe traffic reddens nothing: adding
 * `onRequest(handler: (method: string, ...params: any[]) => any)` to the
 * interface, which is a star handler and sees every request, leaves
 * `tsc --noEmit` AT EXIT 0. So `no remaining member exposes traffic` stays a
 * JUDGEMENT, now made against a list the compiler agrees is complete.
 *
 * SECOND, IT IS A CLAIM ABOUT THE INSTALLED DEPENDENCY. package.json asks only
 * for a range; `keyof` is read from whatever the lockfile put in node_modules.
 * This reddens when the lockfile moves and someone runs `tsc --noEmit`, which is
 * later than the release that moved it.
 *
 * THIRD, THIS PINS THE TYPE AND THE VALUE IS WIDER THAN THE TYPE.
 * `createProtocolConnection` returns `createMessageConnection`'s result
 * UNCHANGED, and `MessageConnection` declares two members `ProtocolConnection`
 * does not: `inspect`, and `onUnhandledProgress`. THE SECOND OBSERVES INBOUND
 * TRAFFIC -- vscode-jsonrpc's own `$/progress` handler fires
 * `unhandledProgressEmitter` for every progress notification whose token has no
 * handler registered, and tsudoi registers none, so that is EVERY ONE. It is
 * off the handle's TYPE and therefore off this pin, and reaching it needs a
 * CAST. That puts it in the deliberate-evasion class this module already
 * accepts for `await import(...)` and for a wrapper exported from
 * packages/tsudoi-language-server/src/notifications.ts -- a line whose author
 * had to mean it -- rather than in the by-accident class the `Omit` exists to
 * close. Recorded so it is not rediscovered as news.
 */
export type ProtocolConnectionHasTheseMembers = Assert<
  Exact<
    keyof ProtocolConnection,
    | "sendRequest"
    | "onRequest"
    | "hasPendingResponse"
    | "sendNotification"
    | "onNotification"
    | "onProgress"
    | "sendProgress"
    | "trace"
    | "onError"
    | "onClose"
    | "onUnhandledNotification"
    | "onDispose"
    | "end"
    | "dispose"
    | "listen"
  >
>;

test("the same two outcomes hold for onUnhandledNotification through an alias under a different name", async () => {
  const result = await typeCheckProbe({
    "renamed.ts": aliasedSource("onUnhandledNotification(() => {});"),
    "permits.ts": aliasedSource("onRequest(ShutdownRequest.type, (): void => {});"),
  });

  expect(result.output).toMatch(
    /renamed\.ts\(\d+,\d+\): error TS\d+: Property 'onUnhandledNotification' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

const onProgressCall = 'onProgress(new ProgressType<number>(), "token", () => {});';

const traceCall = "trace(Trace.Off, null as unknown as Tracer);";

/**
 * WHAT IT REACHES IS NARROWER THAN THE MEMBERS CLOSED BEFORE IT: `$/progress`
 * arrives as a notification like any other, and `onProgress` installs a handler
 * for it under a TOKEN, outside the table this module gates. Nothing in tsudoi
 * receives `$/progress` today -- packages/tsudoi-language-server/src/methods.ts
 * SENDS it, through `sendProgress`, which this narrowing deliberately leaves
 * alone.
 *
 * REACHABILITY IS WHY IT GOES, not breadth: it sits on the handle
 * `createGatedConnection` hands out, so reaching it needs NO DELIBERATE ACT, and
 * `no longer reachable by accident` -- the argument that makes the import ban in
 * .oxlintrc.json adequate -- never covered it.
 */
test("the narrowed connection rejects onProgress and accepts onRequest, in one type-check", async () => {
  const result = await typeCheckProbe({
    "forbids.ts": narrowedSource([`connection.${onProgressCall}`]),
    "permits.ts": forbidsAndPermits["permits.ts"] as string,
  });

  // BOUND TO THE FILE AND TO THE SYMBOL, for the two reasons recorded at the
  // onUnhandledNotification probe above.
  expect(result.output).toMatch(
    /forbids\.ts\(\d+,\d+\): error TS\d+: Property 'onProgress' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

test("the same two outcomes hold for onProgress through an alias under a different name", async () => {
  const result = await typeCheckProbe({
    "renamed.ts": aliasedSource(onProgressCall),
    "permits.ts": aliasedSource("onRequest(ShutdownRequest.type, (): void => {});"),
  });

  expect(result.output).toMatch(
    /renamed\.ts\(\d+,\d+\): error TS\d+: Property 'onProgress' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

/**
 * `trace`'s REACH IS EASIEST TO OVERSTATE, so what it actually sees is written
 * down: in vscode-jsonrpc's connection.js the notification-path call to
 * `traceReceivedNotification` sits INSIDE
 * `if (notificationHandler || starNotificationHandler)`, and the `else` branch
 * fires `unhandledNotificationEmitter` without tracing. So a Tracer sees every
 * notification tsudoi HANDLES, plus `$/cancelRequest` -- NOT every notification
 * received, which makes it COMPLEMENTARY to `onUnhandledNotification` rather
 * than broader.
 *
 * AND THE ORDERING IS WHY IT BELONGS WITH THE OTHERS: the tracer is handed the
 * message BEFORE the registered handler runs, and this module's gate lives
 * INSIDE that handler. So tracing observes a gated notification whatever the
 * gate then decides -- watching around the gate, which is the property this
 * narrowing exists to deny.
 */
test("the narrowed connection rejects trace and accepts onRequest, in one type-check", async () => {
  const result = await typeCheckProbe({
    "forbids.ts": narrowedSource([`connection.${traceCall}`]),
    "permits.ts": forbidsAndPermits["permits.ts"] as string,
  });

  expect(result.output).toMatch(
    /forbids\.ts\(\d+,\d+\): error TS\d+: Property 'trace' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

test("the same two outcomes hold for trace through an alias under a different name", async () => {
  const result = await typeCheckProbe({
    "renamed.ts": aliasedSource(traceCall),
    "permits.ts": aliasedSource("onRequest(ShutdownRequest.type, (): void => {});"),
  });

  expect(result.output).toMatch(
    /renamed\.ts\(\d+,\d+\): error TS\d+: Property 'trace' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});

/**
 * The same two halves reached through the FACTORY rather than through a bare
 * binding of the type alias.
 *
 * A DIFFERENT SEAM, and the probes above cannot see it: they bind
 * `RequestOnlyConnection` themselves, so they assert what the TYPE means and go
 * green whatever `createGatedConnection` hands back. Widen that function's
 * return annotation to `ProtocolConnection` and all of them stay green, the
 * whole suite with them, while an ungated `connection.onNotification` in
 * packages/tsudoi-language-server/src/server.ts compiles fine -- the
 * foreclosure entirely gone with nothing saying so. This reddens, and only
 * this.
 *
 * WHAT IT STILL DOES NOT REACH is packages/tsudoi-language-server/src/server.ts
 * choosing to call `createProtocolConnection` instead, which no type can catch:
 * that route is banned by .oxlintrc.json and asserted in test/guard.test.ts.
 * THE TWO ARE NOT INDEPENDENT -- widening this annotation also destroys the
 * argument that a mere lint suffices over there, and only this probe would say
 * so.
 */
function factorySource(body: string[]): string {
  return [
    'import { InitializedNotification, ShutdownRequest } from "vscode-languageserver-protocol/node";',
    'import type { Logger, MessageReader, MessageWriter } from "vscode-languageserver-protocol/node";',
    'import type { Lifecycle } from "./src/lifecycle.ts";',
    'import { createGatedConnection } from "./src/notifications.ts";',
    "",
    "const connection = createGatedConnection(",
    "  null as unknown as MessageReader,",
    "  null as unknown as MessageWriter,",
    "  null as unknown as Logger,",
    "  null as unknown as Lifecycle,",
    "  [],",
    ");",
    ...body,
    "",
  ].join("\n");
}

/**
 * THE EXEMPTION IN .oxlintrc.json IS A HOLE, AND THIS IS WHAT CLOSES IT. The
 * import ban has to exempt this module -- it is the one place a connection may
 * be created -- so the ban is blind to exactly one file, and a single line
 * inside it, `export { createProtocolConnection } from ...`, hands the factory
 * to every other module through a specifier the rule permits. THE GUARD WOULD
 * STAY SILENT: packages/tsudoi-language-server/src/server.ts would import from
 * ./notifications.ts, which is not the banned path. Not a second claim about
 * the ban, then, but the PRECONDITION that makes the ban's claim true at all.
 *
 * THE NEGATIVE ONLY, AND DELIBERATELY NOT AN EXPORT LIST: this module will grow,
 * and a test that fails when it does defends nothing.
 *
 * THE PAIR IS `createGatedConnection`, not an arbitrary export: without it,
 * `no key named createProtocolConnection` would hold just as well for a
 * namespace object this measurement never populated -- a renamed module, a
 * failed import, a type-only module with nothing at runtime.
 *
 * WHAT IT DOES NOT REACH, since the assertion names ONE key: a wrapper.
 * `export const makeConnection = () => createProtocolConnection(reader, writer,
 * logger)` hands out an ungated connection while this stays green. That is the
 * same deliberate-evasion class .oxlintrc.json already names for the Bun guard,
 * not the careless edit both guards exist to catch.
 */
test("the router does not export createProtocolConnection, and does export the gated factory", () => {
  const exported = Object.keys(router);

  expect(exported).not.toContain("createProtocolConnection");
  expect(exported).toContain("createGatedConnection");
});

test("what the factory hands back rejects onNotification and accepts onRequest", async () => {
  const result = await typeCheckProbe({
    "forbids.ts": factorySource([
      "connection.onNotification(InitializedNotification.type, () => {});",
    ]),
    "permits.ts": factorySource(["connection.onRequest(ShutdownRequest.type, (): void => {});"]),
  });

  expect(result.output).toMatch(
    /forbids\.ts\(\d+,\d+\): error TS\d+: Property 'onNotification' does not exist/,
  );
  expect(result.output).not.toContain("permits.ts");
  expect(result.code).toBe(1);
});
