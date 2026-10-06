import { expect, test } from "bun:test";
import { type ClientConnection, createTsudoi } from "./tsudoi.ts";

/** One request the fake connection was handed, and how a test settles it. */
interface Sent {
  readonly method: string;
  readonly params: object | undefined;
  cancelled: number;
  readonly resolve: (value: unknown) => void;
  readonly reject: (reason: unknown) => void;
}

/**
 * A runtime connected to a client that answers nothing until the test says so.
 *
 * NOTHING SETTLES ON ITS OWN, which is what lets the cancellation rows tell a
 * request that rejected BECAUSE of the abort from one that merely raced an
 * answer: every response here is the test's decision.
 */
function connected() {
  const runtime = createTsudoi();
  const sent: Sent[] = [];
  const connection: ClientConnection = {
    notify: () => Promise.reject(new Error("this client takes no notifications")),
    request(method, params) {
      const { promise, resolve, reject } = Promise.withResolvers<unknown>();
      const entry: Sent = { method, params, cancelled: 0, resolve, reject };
      sent.push(entry);
      return {
        response: promise,
        cancel: () => {
          entry.cancelled++;
        },
      };
    },
  };
  runtime.connect(connection);
  return { tsudoi: runtime.tsudoi, sent };
}

function only(sent: readonly Sent[]): Sent {
  expect(sent).toHaveLength(1);
  return sent[0]!;
}

test("a request before the server has a connection rejects, naming that state", async () => {
  const { tsudoi } = createTsudoi();

  await expect(tsudoi.request("client/ask", {})).rejects.toThrow(
    'tsudoi.request("client/ask") was called before this server had a connection to send on',
  );
});

test("a request hands the client its method and params, and resolves with the answer", async () => {
  const { tsudoi, sent } = connected();
  const params = { textDocument: { uri: "file:///a.ts" } };

  const answered = tsudoi.request("workspace/ask", params);
  const request = only(sent);
  request.resolve({ answer: 42 });

  expect(await answered).toEqual({ answer: 42 });
  expect(request.method).toBe("workspace/ask");
  expect(request.params).toBe(params);
});

/**
 * `null` IS AN ANSWER, and the row exists because a result read through a
 * truthiness check would turn it into a rejection or a default.
 */
test("a null answer resolves as null", async () => {
  const { tsudoi, sent } = connected();

  const answered = tsudoi.request("workspace/ask");
  only(sent).resolve(null);

  expect(await answered).toBeNull();
});

test("a request without params hands the client none", () => {
  const { tsudoi, sent } = connected();

  void tsudoi.request("workspace/ask");

  expect(only(sent).params).toBeUndefined();
});

/**
 * THE CLIENT'S OWN REJECTION, UNCHANGED: what it carries -- a code and data
 * the author branches on -- is the whole reason to catch it, and a rejection
 * re-wrapped here would make them reach through a second object for it.
 */
test("a client's error reaches the caller as the same value", async () => {
  const { tsudoi, sent } = connected();
  const failure = new Error("the client declined");

  const answered = tsudoi.request("workspace/ask", {});
  only(sent).reject(failure);

  await expect(answered).rejects.toBe(failure);
});

/**
 * NOTHING IS SENT FOR A CALLER THAT HAS ALREADY GIVEN UP, which is what an
 * aborted `fetch` does too: a request that went out anyway would put work on
 * the client whose answer nothing is left to read.
 */
test("an already-aborted signal rejects with its reason and sends nothing", async () => {
  const { tsudoi, sent } = connected();
  const controller = new AbortController();
  const reason = new Error("gave up");
  controller.abort(reason);

  await expect(tsudoi.request("workspace/ask", {}, { signal: controller.signal })).rejects.toBe(
    reason,
  );
  expect(sent).toEqual([]);
});

/**
 * AN ABORT REJECTS AT ONCE, AND DOES NOT WAIT FOR THE CLIENT TO CONFIRM IT. A
 * conforming client answers a cancelled request anyway, but a handler parked
 * until it does is a handler whose own request -- the one the abort came from
 * -- is not answered either; and a client that never answers would park it for
 * good.
 */
test("an abort in flight cancels the request and rejects with its reason", async () => {
  const { tsudoi, sent } = connected();
  const controller = new AbortController();
  const reason = new Error("gave up");

  const answered = tsudoi.request("workspace/ask", {}, { signal: controller.signal });
  controller.abort(reason);

  await expect(answered).rejects.toBe(reason);
  expect(only(sent).cancelled).toBe(1);
});

/**
 * A SETTLED REQUEST IS NOT CANCELLED LATER, which is the half that says the
 * abort listener is released: a signal outlives the request, the handler's
 * signal aborting whenever its own request is cancelled, so one left attached
 * would cancel an id the client has already finished with.
 */
test("an abort after the answer cancels nothing", async () => {
  const { tsudoi, sent } = connected();
  const controller = new AbortController();

  const answered = tsudoi.request("workspace/ask", {}, { signal: controller.signal });
  only(sent).resolve("done");
  await answered;
  controller.abort();

  expect(only(sent).cancelled).toBe(0);
});

/**
 * PARAMS ARE SENT BY NAME, AND ANYTHING THAT IS NOT AN OBJECT IS REFUSED
 * BEFORE IT GOES OUT rather than reshaped on the way: the connection would
 * wrap an array in a second one and turn `null` into `[null]`, so the client
 * would receive a message the author never wrote.
 */
test.each([
  ["an array", [1, 2]],
  ["null", null],
])("%s as params is refused, and nothing is sent", async (_name, params) => {
  const { tsudoi, sent } = connected();

  await expect(tsudoi.request("workspace/ask", params as object)).rejects.toThrow(TypeError);
  expect(sent).toEqual([]);
});
