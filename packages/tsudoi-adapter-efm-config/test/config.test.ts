import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EfmConfigError, parseConfig, toolsFor } from "../src/config.ts";

const staged: string[] = [];

afterEach(() => {
  for (const root of staged.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function stage(yaml: string): string {
  const root = mkdtempSync(join(tmpdir(), "efm-config-"));
  staged.push(root);
  const path = join(root, "config.yaml");
  writeFileSync(path, yaml);
  return path;
}

describe("reading an efm config", () => {
  /**
   * THE ARM THIS WHOLE PACKAGE'S DEPENDENCY RULING RESTS ON, and it is written
   * over efm's OWN DOCUMENTED SHAPE rather than a minimal one: its README leads
   * with a config built entirely out of `&anchor` and `<<: *anchor`, so this is
   * the common case and not an edge.
   *
   * WHAT IT REFUSES IS THE SILENT READING. At yaml's default options the merge
   * key arrives as a LITERAL `<<` and none of the merged tool's own keys are
   * present -- so the tool below would declare no `format-command`, this adapter
   * would build no formatting handler, and the author's editor would show a
   * server that simply does not format. No error, anywhere. THE ASSERTION IS ON
   * THE MERGED KEYS AND ALSO ON `<<` BEING GONE: reading `format-command` alone
   * would pass for a reader that merged AND left the literal behind.
   */
  test("a merge key brings the anchored tool's own keys, and leaves no `<<` behind", () => {
    const path = stage(`
version: 2
tools:
  lua-format: &lua-format
    format-command: 'lua-format -i'
    format-stdin: true
languages:
  lua:
    - <<: *lua-format
      lint-command: 'luacheck -'
`);

    const [tool] = toolsFor(parseConfig(path), "lua");

    expect(tool).toEqual({
      "format-command": "lua-format -i",
      "format-stdin": true,
      "lint-command": "luacheck -",
    });
    expect(Object.keys(tool ?? {})).not.toContain("<<");
  });

  /**
   * efm's ANY-LANGUAGE KEY, AND THE ORDER IS THE ASSERTION. A reader's own
   * language tools run before the catch-all, which is what the position of `=`
   * at the bottom of efm's own example leads them to expect -- and a set
   * comparison would pass for either order.
   */
  test("the `=` tools follow the language's own, in that order", () => {
    const path = stage(`
languages:
  lua:
    - hover-command: 'lua-hover'
  "=":
    - hover-command: 'any-hover'
`);

    expect(toolsFor(parseConfig(path), "lua").map((tool) => tool["hover-command"])).toEqual([
      "lua-hover",
      "any-hover",
    ]);
    // AND A LANGUAGE THE FILE NEVER MENTIONS still gets the catch-all, which is
    // the half that says `=` is not merely appended to lists that exist.
    expect(toolsFor(parseConfig(path), "ruby").map((tool) => tool["hover-command"])).toEqual([
      "any-hover",
    ]);
  });

  /**
   * AN EMPTY FILE IS A CONFIG THAT DECLARES NOTHING, not an error: an author who
   * created the file and has not filled it in is not in a broken state, and
   * every handler falls out absent.
   */
  test("an empty config parses to a config describing nothing", () => {
    expect(parseConfig(stage("\n"))).toEqual({});
  });

  /**
   * THE FILE IS NAMED IN THE MESSAGE, which the parser's own error cannot do --
   * and this package's whole premise is that the file was found somewhere the
   * author never named, so `bad indentation at line 3` alone sends them looking
   * in the wrong place.
   */
  test("a file that is not YAML is refused, naming the file", () => {
    const path = stage("languages:\n  lua:\n   - x\n  - y\n");

    expect(() => parseConfig(path)).toThrow(EfmConfigError);
    expect(() => parseConfig(path)).toThrow(path);
  });

  test("a config whose top level is not a mapping is refused, naming the file", () => {
    const path = stage("- one\n- two\n");

    expect(() => parseConfig(path)).toThrow("does not hold a mapping");
    expect(() => parseConfig(path)).toThrow(path);
  });

  test("a config that is not there is refused, naming the file", () => {
    const missing = join(mkdtempSync(join(tmpdir(), "efm-absent-")), "config.yaml");
    staged.push(missing);

    expect(() => parseConfig(missing)).toThrow("could not be read");
  });
});

describe("finding an efm config", () => {
  /**
   * `XDG_CONFIG_HOME` WINS, which is the order efm documents -- and the arm
   * drives BOTH being set, since only that tells precedence from a reader that
   * happens to look at one.
   */
  test("XDG_CONFIG_HOME is searched before HOME", async () => {
    const root = mkdtempSync(join(tmpdir(), "efm-search-"));
    staged.push(root);
    const xdg = join(root, "xdg");
    const home = join(root, "home");
    for (const [base, name] of [
      [join(xdg, "efm-langserver"), "xdg"],
      [join(home, ".config", "efm-langserver"), "home"],
    ]) {
      mkdirSync(base ?? "", { recursive: true });
      writeFileSync(join(base ?? "", "config.yaml"), `languages:\n  lua:\n    - prefix: ${name}\n`);
    }

    const { configPaths } = await import("../src/config.ts");
    const before = { xdg: process.env.XDG_CONFIG_HOME, home: process.env.HOME };
    try {
      process.env.XDG_CONFIG_HOME = xdg;
      process.env.HOME = home;
      expect(configPaths()[0]).toBe(join(xdg, "efm-langserver", "config.yaml"));
      expect(configPaths()[1]).toBe(join(home, ".config", "efm-langserver", "config.yaml"));
    } finally {
      process.env.XDG_CONFIG_HOME = before.xdg;
      process.env.HOME = before.home;
    }
  });

  /**
   * AN EMPTY `XDG_CONFIG_HOME` IS ABSENCE AND NOT A ROOT, which `??` would get
   * wrong: the failure that spelling produces is a config looked for at
   * `/efm-langserver/config.yaml`, a path that exists on no machine and explains
   * nothing when it is not found.
   */
  test("an empty XDG_CONFIG_HOME is not searched", async () => {
    const { configPaths } = await import("../src/config.ts");
    const before = process.env.XDG_CONFIG_HOME;
    try {
      process.env.XDG_CONFIG_HOME = "";
      expect(configPaths().some((path) => path.startsWith("/efm-langserver"))).toBe(false);
    } finally {
      process.env.XDG_CONFIG_HOME = before;
    }
  });
});
