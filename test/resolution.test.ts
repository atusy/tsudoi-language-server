import { afterEach, beforeEach, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { isolatedCheckout, type IsolatedCheckout } from "./helpers/checkout.ts";
import { denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

await requireRuntime(denoRuntime);

/**
 * A deno.json carrying an npm import map -- the file Sprint 1 argued would flip
 * npm resolution to deno's global cache. That argument was never measured; the
 * tests below measure it.
 */
const denoJsonWithNpmImports = `${JSON.stringify(
  {
    imports: {
      "vscode-languageserver-protocol": "npm:vscode-languageserver-protocol@^3.17.5",
      "vscode-languageserver-protocol/node": "npm:vscode-languageserver-protocol@^3.17.5/node",
    },
  },
  null,
  2,
)}\n`;

let checkout: IsolatedCheckout;

beforeEach(() => {
  checkout = isolatedCheckout();
});

afterEach(() => {
  checkout.dispose();
});

interface Handshake {
  /** The InitializeResult, or undefined if the server never answered. */
  readonly result: InitializeResult | undefined;
  readonly stderr: string;
}

/** One handshake against the real server, over stdio, in the given checkout. */
async function handshake(dir: string): Promise<Handshake> {
  const session = LspSession.start(denoRuntime, "examples/tsudoi.config.ts", dir);
  try {
    const result = await session.request<InitializeResult>("initialize", initializeParams).then(
      (value) => value,
      () => undefined,
    );
    return { result, stderr: session.stderr };
  } finally {
    session.dispose();
  }
}

// THE PROPERTY, pinned instead of the file. What Sprint 1 guaranteed is that
// deno resolves npm dependencies out of node_modules; a deno.json that
// preserved that would be equally acceptable, so asserting the file's absence
// would pin a spelling rather than the guarantee.
test("deno cannot start the server when node_modules is absent", async () => {
  const { result, stderr } = await handshake(checkout.dir);

  expect(result).toBeUndefined();
  // Named, not merely absent: any error at all would satisfy `it did not
  // start`, including one from a broken helper. This is deno saying where it
  // looked.
  expect(stderr).toContain("node_modules");
  expect(stderr).toContain("vscode-languageserver-protocol");
});

// The pair. Same checkout, same sources, only node_modules restored -- so the
// failure above is attributable to resolution and not to the copy being
// incomplete. If this ever fails to fail, resolution has moved to a global
// cache and Sprint 1's guarantee has silently changed.
test("the same checkout starts once node_modules is present", async () => {
  checkout.linkNodeModules();

  const { result } = await handshake(checkout.dir);

  expect(result?.serverInfo?.name).toBe("tsudoi");
});

// MEASURED, and it refutes the reason the guard was written for: a deno.json
// with an npm import map does NOT flip resolution to deno's global cache. The
// import map is consulted -- deno's diagnostic changes wording -- and the
// dependency is still demanded from node_modules.
test("a deno.json with an npm import map does not make node_modules dispensable", async () => {
  checkout.write("deno.json", denoJsonWithNpmImports);

  const { result, stderr } = await handshake(checkout.dir);

  expect(result).toBeUndefined();
  expect(stderr).toContain("node_modules");
});

test("a deno.json with an npm import map does not break a checkout that has node_modules", async () => {
  checkout.write("deno.json", denoJsonWithNpmImports);
  checkout.linkNodeModules();

  const { result } = await handshake(checkout.dir);

  expect(result?.serverInfo?.name).toBe("tsudoi");
});
