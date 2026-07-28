import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { type Disposable, NotificationType } from "vscode-languageserver-protocol/node";
import { createDocumentStore } from "../src/documents.ts";
import { createLifecycle } from "../src/lifecycle.ts";
import { type NotificationRegistrar, registerNotifications } from "../src/notifications.ts";
import { notificationEntries } from "../src/server.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

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
  deliver: (method: string, params: unknown) => void;
} {
  const registered = new Map<string, (params: unknown) => void>();
  return {
    connection: {
      onNotification<P>(type: NotificationType<P>, handler: (params: P) => void): Disposable {
        // The one cast, and it is the stub's: the map holds handlers for
        // several params types at once, exactly as the real connection does.
        registered.set(type.method, handler as (params: unknown) => void);
        return { dispose: () => {} };
      },
    },
    deliver(method: string, params: unknown): void {
      const handler = registered.get(method);
      if (handler === undefined) {
        throw new Error(`nothing was registered for ${method}`);
      }
      handler(params);
    },
  };
}

/** Two notifications of tsudoi's own invention: the router knows no names. */
const gatedType = new NotificationType<{ mark: string }>("test/gated");
const ungatedType = new NotificationType<{ mark: string }>("test/ungated");

// CRITERION 1, and the handler bodies are EMPTY of any lifecycle knowledge on
// purpose: whoever writes a notification cannot make it run at a moment the
// entry did not allow, because nothing in the body decides that. This is what
// the three deleted hand-written checks used to do by convention, three times
// over, for whoever remembered.
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

// CRITERION 2 AT THE ROUTER, both halves rather than the one PBI-10 covers.
// The end-to-end codes are pinned elsewhere and are NOT duplicated here -- a
// second spawned exit test could never be the first thing to fail:
// protocol.test.ts's "exit as the very first message, with no initialize, exits
// 1 rather than hanging" pins the uninitialized half, and its "hover after
// shutdown is answered -32600, and exit still returns 0" plus
// lifecycle.test.ts's "initialize, initialized, shutdown, exit yields a null
// shutdown result and exit code 0" pin the other. What is NEW here is the
// carve-out those codes now depend on: a gate that swallowed `exit` would turn
// both into a hang.
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

/**
 * Source with its comments removed, so that a check QUOTED in a comment -- as
 * the deleted one is, in notifications.ts -- is not counted as a call. The `//`
 * arm also truncates a line at a `//` inside a string literal, which costs
 * nothing here: no such line calls the gate.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/** Every call of the notification gate in `source`. */
function gateCalls(source: string): string[] {
  return [...withoutComments(source).matchAll(/\bacceptsNotification\s*\(/g)].map(
    (match) => match[0],
  );
}

function readSource(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../src/${name}`, import.meta.url)), "utf8");
}

// CRITERION 3, read off the file's own bytes the way readme.test.ts reads the
// README: the claim is about what src/server.ts SAYS, so a claim checked any
// other way would rot the moment someone put a check back.
test("no handler body in src/server.ts calls the notification gate", () => {
  expect(gateCalls(readSource("server.ts"))).toEqual([]);
});

// THE PAIR, and it is the real router rather than a synthetic string on
// purpose: it fails if `acceptsNotification` is renamed, which would otherwise
// leave the assertion above passing while measuring nothing.
test("the same scan finds the one call the router makes", () => {
  expect(gateCalls(readSource("notifications.ts"))).toHaveLength(1);
});

/** A probe project's source, with `entry` spliced in as the only entry. */
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

// WHAT MAKES THIS FORECLOSURE RATHER THAN DETECTION, and the only durable home
// for it: the DoD's own `tsc --noEmit` can only say that what IS written
// compiles. That a notification written WITHOUT deciding its gate does not
// compile is a claim about a source this repo must never contain, so it is
// asserted against a throwaway project instead.
test("an entry that decides no gate does not type-check, and the diagnostic names gate", async () => {
  const result = await typeCheckProbe(
    entryProbe("{ type: probed, handler: (params) => void params.mark }"),
  );

  expect(result.code).toBe(1);
  // The DIAGNOSTIC, not merely a non-zero exit: a probe that failed to resolve
  // an import would also exit 1, and this project has twice caught a control
  // firing for the wrong cause.
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
 * `exit`'s carve-out, asserted AS A VALUE rather than as source text.
 *
 * WHY THIS EXISTS WHEN A HANG ALREADY CATCHES IT. Gating `exit` is measured to
 * break the suite -- `lifecycle.test.ts`'s shutdown-then-exit test times out on
 * both runtimes and a full run goes from twelve seconds to over two minutes --
 * so the failure IS detected. But that detection can never be the FIRST thing
 * to fail: it arrives as a suite that stopped finishing, with nothing naming
 * the cause. This one fails immediately, by name.
 *
 * A VALUE and not a regex over the file: in a table-driven router the entry's
 * `gate` IS the decision, declaratively, so asserting the value survives any
 * reformatting that a source scan would not.
 *
 * THE PAIR, so `always` is not read off a table that could be empty or
 * mis-keyed: every OTHER entry is asserted to be `lifecycle` in the same
 * measurement, which a table returning one blanket value could not satisfy.
 */
test("exit's entry declares always, and every other entry declares lifecycle", () => {
  const entries = notificationEntries(createDocumentStore(), createLifecycle());
  const gates = entries.map((entry) => ({
    method: (entry.type as { method?: string }).method ?? String(entry.type),
    gate: entry.gate,
  }));

  expect(gates.filter((entry) => entry.gate === "always").map((entry) => entry.method)).toEqual([
    "exit",
  ]);
  expect(gates.filter((entry) => entry.gate === "lifecycle")).toHaveLength(gates.length - 1);
});
