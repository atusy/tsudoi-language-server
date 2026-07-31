import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";

/**
 * What a config author outside this repo writes: no relative path into src/.
 *
 * THE DOCUMENTED SHAPE, letter for letter -- the annotated const the README
 * quickstart teaches. This string is TYPE-CHECKED against the shipped package,
 * so writing it any other way would leave the route authors are actually told
 * to take unchecked here.
 */
const consumerConfig = [
  'import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";',
  "const config: TsudoiConfigFactory = () => Promise.resolve({});",
  "export default config;",
  "",
].join("\n");

test("a config importing @atusy/tsudoi-language-server/types type-checks against the shipped package.json", async () => {
  const result = await typeCheckProbe({ "tsudoi.config.ts": consumerConfig });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

// The permanent pair for the assertion above. Only tsc can ever fail here --
// `import type` is erased before either runtime resolves anything, so a RUNTIME
// test of this specifier passes with nothing implemented and proves nothing.
test("the same config fails with TS2307 once the exports entry is removed", async () => {
  const result = await typeCheckProbe({ "tsudoi.config.ts": consumerConfig }, (packageJson) => {
    delete packageJson.exports;
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2307");
  expect(result.output).toContain("@atusy/tsudoi-language-server/types");
  expect(result.output).toContain("tsudoi.config.ts");
});

// `./types` is the whole published surface, so the package name ALONE must not
// resolve. Without this, adding a `main` -- which this package deliberately
// omits, see the //exports key in package.json -- would go unnoticed.
test("the bare package name does not resolve, only the ./types subpath", async () => {
  const result = await typeCheckProbe({
    "tsudoi.config.ts":
      'import type { Tsudoi } from "@atusy/tsudoi-language-server";\nexport type T = Tsudoi;\n',
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2307");
});

// Proves the harness really type-checked the probe rather than compiling an
// empty program: a green from a tsc that saw no files is indistinguishable from
// a green from resolution succeeding, and every assertion above is a green.
test("a deliberate type error in the probe is reported, so the probe is really checked", async () => {
  const result = await typeCheckProbe({
    "tsudoi.config.ts": `${consumerConfig}export const wrong: number = "not a number";\n`,
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("tsudoi.config.ts");
  expect(result.output).toContain("error TS2322");
  // Resolution still succeeded; only the deliberate error is reported.
  expect(result.output).not.toContain("TS2307");
});
