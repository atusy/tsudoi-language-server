import { afterEach, beforeEach, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { isolatedCheckout, type IsolatedCheckout } from "./helpers/checkout.ts";
import { denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

await requireRuntime(denoRuntime);

// DENO ONLY, and that is a finding rather than an oversight. The same
// perturbation does not discriminate under bun: with node_modules renamed
// away, bun completed the handshake anyway (measured -- bun 1.3.13 satisfies a
// missing dependency from its own global cache), so there is no bun assertion
// that could fail here. The consequence is worth carrying: bun's greens
// elsewhere in this suite are weaker evidence about resolution than deno's,
// because bun will paper over a node_modules that is wrong or missing.
//
// Deliberately NOT pinned: bun's auto-install. Nothing in this project requires
// it, and a test asserting it would resist a legitimate change to bun rather
// than defend anything we promised.

/**
 * A deno.json carrying an npm import map -- the file most likely to flip npm
 * resolution to deno's global cache, which is the argument the tests below
 * MEASURE. It does not hold at deno 2.9.2.
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

// THE PROPERTY, pinned instead of the file. The guarantee is that deno resolves
// npm dependencies out of node_modules; a deno.json that
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
// cache and that guarantee has silently changed.
test("the same checkout starts once node_modules is present", async () => {
  checkout.linkNodeModules();

  const { result } = await handshake(checkout.dir);

  expect(result?.serverInfo?.name).toBe("tsudoi");
});

// MEASURED AT DENO 2.9.2, and it refutes the reason the guard was written for:
// a deno.json with an npm import map does NOT flip resolution to deno's global
// cache. The import map is consulted -- deno's diagnostic changes wording, from
// `found it in a package.json` to `could not find it in a node_modules folder`
// -- and the dependency is still demanded from node_modules. Both stderr
// assertions below are coupled to that release's wording.
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
