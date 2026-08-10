import { afterAll, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { handlerMembers } from "../scripts/workspaces.ts";
import { packPackage } from "./helpers/install.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT A WORKSPACE MEMBER ACTUALLY SHIPS, READ OFF ITS TARBALL.
 *
 * WHY THE MANIFEST IS NOT THE SUBJECT, and this file exists because it was: a
 * member's `files` field is an INSTRUCTION, and the tarball is what the
 * instruction produced. The two part company the moment anything writes a file
 * the instruction happens to admit, and a `tsc` that removes nothing writes one
 * every time a source file is renamed or deleted. A test reading `files` reports
 * the intent of an edit nobody made.
 *
 * MEASURED, WHICH IS WHY THIS IS A FILE AND NOT A SCRUPLE: with prepack's clear
 * removed and a `dist/wordnet.d.ts` copied in by hand, the tarball grows the file,
 * the packed declarations carry `declare module "wordnet"`, and `files` toEqual
 * `["dist"]` in the member's own package-shape test STAYS GREEN. That green is
 * what this file was written against.
 *
 * WHAT A SHIPPED AMBIENT DECLARATION COSTS, stated at its measured size rather
 * than at the size it is usually given. `declare module "wordnet"` is a statement
 * about a name in the GLOBAL type space, but tsc reads only the files in the
 * PROGRAM -- so a consumer who installs a package carrying an unreferenced
 * `.d.ts` is told nothing by it. MEASURED both ways in
 * test/published-artifacts.test.ts, which stays green through the leak. The
 * exposure is real and CONDITIONAL: it costs one `types` entry, one triple-slash
 * reference, or one consumer whose `include` reaches the file. So this reads the
 * artifact, and the consumer-side reading over there says what it does and does
 * not discriminate.
 *
 * THE OTHER HALF OF THE ANSWER IS IN THE MANIFEST rather than here: `prepack`
 * clears dist/ before it compiles, so a stray has to appear between the clear and
 * the collection to survive at all. That is the fix; this is what says so when it
 * fails, and the member's package-shape test carries the reason for the clear.
 */

/**
 * Every handler package, packed ONCE for the whole file.
 *
 * A pack per test would run the member's build three times over for one reading,
 * and each run rewrites the dist/ the rest of this repository resolves through.
 *
 * HANDLERS AND NOT MEMBERS, AND THE DECIDING ARM IS THE README ONE BELOW: it
 * asks what a member's own document owes THE ONE READER WHO CANNOT GET IT
 * ANYWHERE ELSE, and two of the things it demands -- that the package needs
 * tsudoi at run time, that the optional flag is not what it reads as -- are
 * unstatable by the framework about itself. The framework's own tarball is not
 * left unread: test/published-artifacts.test.ts packs it and installs it into a
 * consumer, which is where every claim about what IT ships is made.
 */
const packed = await Promise.all(
  handlerMembers(repoRoot).map(async (member) => await packPackage(member)),
);

afterAll(() => {
  for (const one of packed) {
    one.dispose();
  }
});

/**
 * What each member publishes, WRITTEN DOWN, keyed by the name in its manifest.
 *
 * A LIST AND NOT A DERIVATION, which is the whole instrument: an expectation
 * computed from the member's dist/ agrees with a stray sitting in it, and would
 * be green in exactly the state this file exists to redden. It costs an edit
 * whenever the published surface changes on purpose, and that is the price of
 * noticing when it changes by accident.
 */
const publishedFiles: Record<string, readonly string[]> = {
  "@atusy/tsudoi-completion-path": [
    "LICENSE",
    "README.md",
    "dist/completion.d.ts",
    "dist/completion.js",
    "dist/index.d.ts",
    "dist/index.js",
    "dist/resolve.d.ts",
    "dist/resolve.js",
    "package.json",
  ],
  "@atusy/tsudoi-hover-wordnet": [
    "LICENSE",
    "README.md",
    "dist/hover.d.ts",
    "dist/hover.js",
    "dist/index.d.ts",
    "dist/index.js",
    "package.json",
  ],
  "@atusy/tsudoi-adapter-efm-config": [
    "LICENSE",
    "README.md",
    "dist/config.d.ts",
    "dist/config.js",
    "dist/errorformat.d.ts",
    "dist/errorformat.js",
    "dist/handlers.d.ts",
    "dist/handlers.js",
    "dist/index.d.ts",
    "dist/index.js",
    "dist/load.d.ts",
    "dist/load.js",
    "dist/run.d.ts",
    "dist/run.js",
    "package.json",
  ],
};

// The pair for the table, and without it the per-member assertions below are a
// claim about whichever members someone remembered. A member with no entry is
// not silently skipped: it fails here, naming itself.
test("every workspace member's published file list is written down", () => {
  expect(packed.length).toBeGreaterThan(0);
  expect(
    packed.map((one) => one.name).filter((name) => publishedFiles[name] === undefined),
  ).toEqual([]);
});

for (const one of packed) {
  test(`${one.name} packs exactly the files this repository says it does`, () => {
    expect(one.entries).toEqual([...(publishedFiles[one.name] ?? ["NOT WRITTEN DOWN"])]);
  });
}

/**
 * WHAT A MEMBER'S README OWES THE ONE READER WHO CANNOT GET IT ANYWHERE ELSE,
 * AND IT IS READ OFF THE TARBALL.
 *
 * A REGISTRY PAGE IS THE README IN THE ARCHIVE, not the file in this repository,
 * and the two part company the moment `files` or a pack step touches one --
 * MEASURED, and the measurement is why the list above grew a row rather than
 * this test trusting the tree: `files: ["dist"]` does NOT name README.md and the
 * tarball carries it anyway, because npm's collection adds it unconditionally.
 * A member that renamed it to `readme.txt` would still satisfy a reader of this
 * repository and hand a stranger a blank page.
 *
 * THREE THINGS, AND EACH IS SOMETHING A STRANGER CANNOT GET ELSEWHERE. WHAT IT
 * ANSWERS: the method names, since the package name says one at best and this
 * repository has one member whose name says neither. THAT IT NEEDS TSUDOI AT RUN
 * TIME: the manifest says the opposite -- `peerDependenciesMeta.optional` reads
 * as `this works alone` -- and the account of why that flag is there lives in a
 * test `files` keeps out of the tarball, so without this the flag reaches a
 * consumer with no correction anywhere. WHAT BOUNDS IT: every handler decides
 * something that limits which documents it serves, and a decision that lives
 * only in a maintainer's source file is not one an installing stranger can act
 * on.
 *
 * OVER MEMBERS AS A CLASS, with the tokens per member because the third thing is
 * a DIFFERENT sentence in each: whitespace as a word rule bounds one, whitespace
 * as a path terminator bounds the other, and a token shared between them would
 * be satisfied by whichever member happened to carry it.
 */
const readmeTokens: Record<string, readonly RegExp[]> = {
  "@atusy/tsudoi-completion-path": [
    /textDocument\/completion/,
    /completionItem\/resolve/,
    /peer/i,
    /optional/,
    /Cannot find module/,
    /Whitespace ends a path/i,
  ],
  "@atusy/tsudoi-hover-wordnet": [
    /textDocument\/hover/,
    /peer/i,
    /optional/,
    /Cannot find module/,
    /Whitespace is its word rule/i,
  ],
  // THE THIRD THING THIS MEMBER MUST SAY IS NOT A DOCUMENT RULE BUT A TRUST ONE,
  // which is what `WHAT BOUNDS IT` comes to for an adapter: the others decide
  // which documents they serve, and this one decides to EXECUTE TEXT OUT OF A
  // FILE IT FOUND ITSELF. A stranger installing it cannot act on that unless the
  // README says so, and no maintainer's source comment reaches them.
  "@atusy/tsudoi-adapter-efm-config": [
    /textDocument\/diagnostic/,
    /peer/i,
    /optional/,
    /Cannot find module/,
    /through a shell/i,
  ],
};

test("every workspace member's README tokens are written down", () => {
  expect(packed.map((one) => one.name).filter((name) => readmeTokens[name] === undefined)).toEqual(
    [],
  );
});

for (const one of packed) {
  test(`${one.name} ships a README a stranger can act on`, () => {
    const readme = readFileSync(join(one.dir, "README.md"), "utf8");

    // NAMED rather than counted, so a missing subject appears in the failure
    // text instead of a number that moved.
    expect(
      (readmeTokens[one.name] ?? [/THIS MEMBER HAS NO TOKENS WRITTEN DOWN/])
        .filter((token) => !token.test(readme))
        .map(String),
    ).toEqual([]);
  });
}

/**
 * EVERY LINK IN A PACKED README MUST BE FOLLOWABLE FROM WHERE IT IS READ, AND
 * THAT PLACE IS A REGISTRY PAGE OR node_modules -- NEVER THIS CHECKOUT.
 *
 * WHY A RELATIVE LINK IS THE WHOLE CLASS. A member sits two directories under
 * the root here, so `../../README.md` reaches the repository README for anybody
 * standing in the checkout and is the natural thing to write. Installed, that
 * same target climbs out of the package and lands on `node_modules/README.md`,
 * which nothing writes. IT FAILS SILENTLY AND ONLY FOR THE STRANGER: the author
 * who wrote it, and every reviewer reading the file in place, follow it
 * successfully.
 *
 * AND NO REGISTRY REWRITES IT FOR THEM. npm rewrites relative links against
 * `repository` metadata, and neither member manifest carries that key -- so the
 * one mechanism that would paper over this is absent, which is what makes the
 * absolute URL the fix rather than a preference.
 *
 * A SEPARATE READING FROM THE SHIPPED-PATH GUARD BELOW, deliberately: that one is
 * scoped to dist/ because a member's README names checkout paths ON PURPOSE, for
 * a reader packing the tarball. This is not about naming a path in prose. It is
 * about a LINK, which promises to resolve, and a link out of the package is
 * broken however true the sentence around it.
 *
 * THE ESCAPE IS DECIDED STRUCTURALLY AND NOT BY ASKING THE DISK, which matters
 * because the alternative reads as equivalent and is not. Looking for
 * `../../README.md` above the extraction directory answers `absent` only because
 * of where the tarball happened to be unpacked -- unpack it two levels under a
 * checkout and the same broken link resolves, turning this green on a defect it
 * exists to catch. Whether a target climbs out of the package root is a property
 * of the LINK, so it is computed from the link.
 *
 * INLINE LINKS ONLY, and the bound is stated because it is invisible otherwise:
 * a reference-style `[text][ref]` with its definition elsewhere is not read here.
 * Neither member uses that form, and widening a matcher for a case nothing in the
 * tree exhibits is how a pattern nobody can check gets written.
 */
function unfollowableLinks(root: string, markdown: string): string[] {
  const broken: string[] = [];
  for (const [, text, target] of markdown.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (target === undefined || /^(?:https?:|mailto:|#)/.test(target)) {
      continue;
    }
    const path = (target.split("#")[0] ?? "").trim();
    if (path === "") {
      continue;
    }
    const destination = resolve(root, path);
    // The separator on the prefix is what stops a sibling directory whose name
    // merely STARTS with the root's from counting as inside it.
    if (!destination.startsWith(root + sep) || !existsSync(destination)) {
      broken.push(`[${text ?? ""}](${target})`);
    }
  }
  return broken;
}

test("no member's packed README links somewhere its reader cannot follow", () => {
  const offenders: string[] = [];
  let read = 0;
  for (const one of packed) {
    if (!one.entries.includes("README.md")) {
      throw new Error(`${one.name} packs no README.md, so this reading has no subject`);
    }
    read += 1;
    for (const link of unfollowableLinks(
      one.dir,
      readFileSync(join(one.dir, "README.md"), "utf8"),
    )) {
      offenders.push(`${one.name}: ${link}`);
    }
  }

  // NAMED rather than counted, so the failure quotes the link to edit.
  expect(offenders).toEqual([]);
  // The pair for the absence: a reading over no READMEs passes on any repository.
  expect(read).toBeGreaterThan(0);
});

test("the link reading catches an escape and clears what a reader can follow", () => {
  const root = packed[0]?.dir ?? repoRoot;

  expect(unfollowableLinks(root, "the [quickstart](../../README.md) does that")).toEqual([
    "[quickstart](../../README.md)",
  ]);
  expect(
    unfollowableLinks(
      root,
      "the [quickstart](https://github.com/atusy/tsudoi-language-server#readme) does that",
    ),
  ).toEqual([]);
  expect(unfollowableLinks(root, "this [package](./package.json) declares it")).toEqual([]);
  // THE ESCAPE IS CAUGHT EVEN WHEN THE TARGET EXISTS, which is the half that
  // separates this reading from `does the file happen to be there`: the parent
  // of the extraction directory is real, and a link reaching it is still one no
  // installed reader can follow.
  expect(unfollowableLinks(root, "up [one](..) level")).toEqual(["[one](..)"]);
});

/**
 * NO SHIPPED MODULE MAY NAME A REPOSITORY FILE THE READER DOES NOT HAVE.
 *
 * THIS IS A MECHANISM GAP RATHER THAN A DILIGENCE ONE, and the record refutes
 * `be more careful`: a false claim in a shipped comment was found again AFTER
 * the team's attention had been pointed at the class. THE ARTIFACT IS WHERE IT
 * MATTERS AND NOTHING READ IT. The build keeps comments, so a sentence citing
 * `test/package-shape.test.ts` compiles straight into dist/ and lands in a
 * consumer's node_modules, where that path names nothing.
 *
 * WHAT MAKES A CLAIM RATHER THAN A SPECIFIER, and it is the discrimination this
 * check turns on: a path-shaped token whose file IS in the tarball is the
 * package talking about itself, and `export { x } from "./y.ts"` in a
 * declaration is CODE -- tsc emits the source extension and resolves it to the
 * sibling `.d.ts`, so the `.d.ts` spelling is accepted for exactly that reason.
 * What is left is a token naming a file the reader does not have.
 *
 * SCOPED TO WHAT `exports` MAKES CODE. A member's README names
 * `scripts/typecheck-workspaces.ts` DELIBERATELY -- it is addressed to somebody
 * standing in a checkout, packing the tarball -- so a rule over the whole
 * archive would force that document to stop saying the one thing it is there to
 * say. dist/ is addressed to nobody but a consumer.
 *
 * THE SEPARATOR IS IN THE TEST'S NAME BECAUSE A BARE FILENAME IS OUTSIDE THE
 * CLASS, and dropping it is MEASURED rather than argued -- a name claiming more
 * than its assertion reads is this repository's definition of a defect, so the
 * bound is stated instead of implied. Run over both tarballs, a pattern that
 * also admitted bare filenames added exactly two tokens and NEITHER is a
 * repository file a reader lacks: `package.json`, which a consumer has at the
 * package root and this reading misses only because it is rooted at dist/, and
 * `completion.lua`, which is nvim's file rather than this repository's.
 *
 * AND IT WOULD NOT HAVE CAUGHT THE CASE THAT PROMPTED THE QUESTION, which is the
 * measurement that settles the shape: a bare `index.ts` RESOLVES here, because
 * the `.d.ts` acceptance above answers it with dist/index.d.ts. So widening the
 * separator buys none of the bare-filename claims a shipped comment can make
 * about its own source, and those are corrected by reading rather than by this.
 */
const pathClaim =
  /(?:\.\/)?[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.(?:ts|js|mjs|cjs|json|toml|md)\b/g;

function unreachableClaims(root: string, text: string): string[] {
  const missing: string[] = [];
  for (const [token] of text.matchAll(pathClaim)) {
    const bare = token.replace(/^\.\//, "");
    const candidates = [bare, bare.replace(/\.ts$/, ".d.ts")];
    if (!candidates.some((name) => existsSync(join(root, name)))) {
      missing.push(token);
    }
  }
  return missing;
}

test("no member ships a module naming a directory-qualified repository file its reader does not have", () => {
  const offenders: string[] = [];
  let read = 0;
  for (const one of packed) {
    for (const entry of one.entries) {
      const path = join(one.dir, entry);
      if (!entry.startsWith("dist/") || !statSync(path).isFile()) {
        continue;
      }
      read += 1;
      for (const token of unreachableClaims(join(one.dir, "dist"), readFileSync(path, "utf8"))) {
        offenders.push(`${one.name}: ${entry} names ${token}`);
      }
    }
  }

  // NAMED rather than counted, so the offending sentence is findable.
  expect(offenders).toEqual([]);
  // The pair for the absence: a reader that opened nothing satisfies the line
  // above on every repository ever written.
  expect(read).toBeGreaterThan(0);
});

/**
 * THE INSTRUMENT, PROVED ON PROSE THAT REALLY MAKES THE CLAIM.
 *
 * REAL PROSE AND A SYNTHETIC TOKEN, both, because they fail differently. The
 * synthetic half pins the PATTERN -- what shape counts as a claim and what does
 * not -- and would pass on a matcher that could never reach a real comment. The
 * real half is scripts/workspaces.ts, a file of this repository whose comments
 * cite repository paths on purpose: run against a tarball's dist/, its sentences
 * name files that are not there, which is exactly the condition above.
 *
 * A TOKEN AND NOT A COUNT IS WHAT IS ASSERTED: `it found something` is satisfied
 * by a matcher that fires on any word with a slash in it, which is the degenerate
 * this half exists to refuse.
 */
test("the pattern that found nothing in the tarballs finds the claims in real prose", () => {
  const root = join(packed[0]?.dir ?? repoRoot, "dist");
  const source = readFileSync(join(repoRoot, "scripts", "workspaces.ts"), "utf8");

  expect(unreachableClaims(root, source)).toContain("test/build-order.test.ts");
  expect(unreachableClaims(root, "see test/package-shape.test.ts for the reason")).toEqual([
    "test/package-shape.test.ts",
  ]);
  expect(unreachableClaims(root, "a fragment like src/fo names no file")).toEqual([]);
});

/**
 * NO MEMBER MAY SHIP AN AMBIENT MODULE DECLARATION, over members as a class
 * rather than over the one package that has an ambient declaration to leak.
 *
 * A claim naming packages/tsudoi-hover-wordnet would go quietly narrow at the second
 * member, on the same reasoning the fifth Definition-of-Done check reads
 * `workspaces` rather than a list. The hazard is not this package's: any member
 * that types an untyped dependency writes the same `declare module`, and the day
 * it does, nothing here needs editing.
 */
const ambient = /declare\s+module\s+["']/;

test("no member ships a declaration that names a module in the global type space", () => {
  const offenders: string[] = [];
  let read = 0;
  for (const one of packed) {
    for (const entry of one.entries) {
      const path = join(one.dir, entry);
      if (!statSync(path).isFile()) {
        continue;
      }
      read += 1;
      if (ambient.test(readFileSync(path, "utf8"))) {
        offenders.push(`${one.name}: ${entry}`);
      }
    }
  }

  // NAMED rather than counted, so a violating file appears in the failure text.
  expect(offenders).toEqual([]);
  // The pair for the absence: an empty tarball, or a reader that opened nothing,
  // satisfies the line above on every repository ever written.
  expect(read).toBeGreaterThan(0);
});

/**
 * THE INSTRUMENT, PROVED ON THE FILE IT IS LOOKING FOR.
 *
 * The absence above is worth nothing unless this pattern finds the statement
 * when it IS there, and the one place it is there is the unshipped source
 * declaration the whole arrangement exists to keep unshipped.
 */
test("the pattern that found nothing in the tarballs finds the declaration in source", () => {
  const source = readFileSync(
    join(repoRoot, "packages", "tsudoi-hover-wordnet", "src", "wordnet.d.ts"),
    "utf8",
  );

  expect(ambient.test(source)).toBe(true);
});
