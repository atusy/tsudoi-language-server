import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { opendir, readdir, stat } from "node:fs/promises";
import { loadavg, tmpdir } from "node:os";
import { join, sep } from "node:path";
import process from "node:process";

/**
 * The reading behind the shape one resolved directory is read in.
 *
 * Run it, unpiped, on both runtimes at one base and in one sitting:
 *
 *     bun run scripts/listing-shapes.ts
 *     deno run -A scripts/listing-shapes.ts
 *
 * WHY THIS IS A SCRIPT AND NOT A CHECK, AND THE ALTERNATIVE IS REFUSED BY NAME
 * RATHER THAN OVERLOOKED: a wall-clock assertion inside `bun test` reddens when
 * the machine is busy, so its red means `the runner was loaded` as often as it
 * means `the code is wrong`, and a red a reader must interpret is a defect this
 * backlog has an item of its own about. The opposite failure is a reading taken
 * by hand once and written up as prose, which nobody can re-take. A tracked
 * script is the middle: nothing gates on it, and a stranger runs the two lines
 * above to take the rows for themselves.
 *
 * IT CARRIES A COPY OF THE GATE AND THE COMPARATOR, AND THAT COPY IS WHAT MAKES
 * THE SHAPES COMPARABLE AT ALL. Two of the three shapes below do not exist in the
 * package -- one is the shape it replaced, one is the shape it never took -- so
 * they have to be written somewhere, and writing those two against an imported
 * third would time two spellings of one gate against each other. WHAT THE COPY
 * CANNOT CATCH, said rather than left for a reader to assume: the package's own
 * gate changing while this file does not, after which this times a shape the
 * package no longer has. The obvious fix is foreclosed -- importing
 * `packages/tsudoi-completion-path/src/resolve.ts` from here would put a member's
 * source into the ROOT type check, which excludes `packages/` precisely so that
 * the root check cannot green-light a member.
 *
 * WHAT IT REFUSES, each because it has already produced a wrong sentence about
 * this module:
 *
 * - ONE NUMBER PER CELL, OR A MEAN WITH NO SPREAD. Every cell reports median, min
 *   and max over a stated round count.
 * - SEQUENTIAL A-THEN-B. The shapes are interleaved WITHIN one process and one
 *   round, so machine drift hits all of them, and their differences are reported
 *   PAIRED per round rather than as two medians taken minutes apart. The order
 *   ROTATES by round, because a fixed order hands the first shape a different
 *   cache and allocator state than the last, and that bias is indistinguishable
 *   from a shape difference.
 * - A READING WITH NO NULL CELL. `streamingAgain` IS `streaming`: the same
 *   function under a second label, rotating with the others. Its paired
 *   difference from `streaming` has a true value of ZERO, so the spread of that
 *   difference is THIS INSTRUMENT'S OWN NOISE, measured rather than assumed. A
 *   shape whose paired difference sits inside it is one this instrument cannot
 *   separate, and a ruling read out of that would be a ruling about the
 *   instrument.
 * - A RULING FROM THE TAIL ALONE. The package's premise is that a few thousand
 *   entries is ORDINARY; the tail is where the shapes differ most and where the
 *   user is least, so it is one row of three rather than the row.
 * - AN UNSTATED ENTRY MIX, OR AN ARRIVAL ORDER INFERRED FROM CREATION ORDER. The
 *   mix is reported beside the rows. The arrival order is READ BACK off the
 *   filesystem and reported as the first names AS ENUMERATED, with the derived
 *   fact that matters: whether the first twenty to arrive are already the twenty
 *   that render, which is exactly the condition under which a gate weakened to
 *   `keep the first twenty` still answers correctly and an arm over it measures
 *   nothing.
 * - AN UNSTATED CACHE OR LOAD. Both are reported. WARM is what these rows are:
 *   this process writes the fixture and discards a whole round before any number
 *   is kept. A COLD cache, a network mount, a second machine, another filesystem
 *   and non-empty files are what this instrument CANNOT separate or speak about.
 *
 * A SHAPE THAT READS NOTHING IS THE FASTEST SHAPE THERE IS, so every timed call
 * asserts the total it counted AND the twenty it rendered against an answer
 * computed from the names this process wrote. A shape that silently returned
 * nothing cannot report a fast row: it throws. That check binds the three shapes
 * to one answer and does NOT bind them to the package's -- a comparator spelled
 * differently here would satisfy all three.
 *
 * NOTHING HERE TAKES A PATH FROM ITS CALLER, and there is no argument that could
 * supply one. The fixture directory is made by this process under the system
 * temporary directory and is the only path written to or removed, checked at both
 * ends by the guard `test/helpers/perturbation.ts` carries and for its reason: a
 * recursive delete at the far end of a configurable path removed a working tree
 * in this project once, and the destructive end had asked nothing about what it
 * was handed.
 */

/** The bound the package renders under, copied with the gate it belongs to. */
const entriesShown = 20;

/**
 * The three sizes, and none is a round number for its own sake: 5000 is the
 * ORDINARY case the package's premise names; 100000 is the tail nobody
 * highlights, kept so that no ruling is taken from a size the user never meets;
 * 200 brackets the ordinary one from below, so a ruling read off it is a ruling
 * about an interval rather than about a point.
 */
const sizes = [200, 5000, 100000] as const;

/** Fewer rounds at the tail because it costs seconds a round, not because it deserves less. */
function roundsFor(entries: number): number {
  return entries >= 100000 ? 7 : 15;
}

/** One entry in this many is hidden, so the (hidden, name) key is exercised rather than present. */
const hiddenEveryNth = 37;

function entryName(index: number): string {
  const stem = `${index.toString().padStart(6, "0")}-entry`;
  return index % hiddenEveryNth === 0 ? `.${stem}` : stem;
}

/**
 * A shuffle that is the same on every machine and every run, so two runtimes' rows
 * are rows about one directory. `Math.random` would make the arrival order a thing
 * the reader has to take on trust.
 */
function shuffledOrder(count: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  let state = 0x2f6e2b1;
  for (let index = order.length - 1; index > 0; index--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const swap = state % (index + 1);
    [order[index], order[swap]] = [order[swap] as number, order[index] as number];
  }
  return order;
}

function byGroupThenName(left: string, right: string): number {
  const leftHidden = left.startsWith(".");
  if (leftHidden !== right.startsWith(".")) {
    return leftHidden ? 1 : -1;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

function retain(names: string[], name: string): void {
  const worstKept = names[entriesShown - 1];
  if (worstKept !== undefined && byGroupThenName(name, worstKept) >= 0) {
    return;
  }
  const at = names.findIndex((kept) => byGroupThenName(name, kept) < 0);
  names.splice(at === -1 ? names.length : at, 0, name);
  if (names.length > entriesShown) {
    names.pop();
  }
}

interface Listing {
  names: string[];
  total: number;
}

/** SHAPE B, the one the package ships: a handle, iterated, twenty kept. */
async function streaming(path: string): Promise<Listing> {
  const names: string[] = [];
  let total = 0;
  const handle = await opendir(path);
  for await (const entry of handle) {
    total += 1;
    retain(names, entry.name);
  }
  return { names, total };
}

/** SHAPE A, the one it replaced: every name into one array, sorted, sliced. */
async function arraySort(path: string): Promise<Listing> {
  const all = await readdir(path);
  return { names: [...all].sort(byGroupThenName).slice(0, entriesShown), total: all.length };
}

/** SHAPE C, the one never taken: the same array, the same gate, no sort and no handle. */
async function arrayRetain(path: string): Promise<Listing> {
  const all = await readdir(path);
  const names: string[] = [];
  for (const name of all) {
    retain(names, name);
  }
  return { names, total: all.length };
}

const shapes: readonly (readonly [string, (path: string) => Promise<Listing>])[] = [
  ["streaming", streaming],
  // THE NULL CELL: the same function under a second label, for the reason in the
  // docstring. It rotates with the others or it would measure its position.
  ["streamingAgain", streaming],
  ["arraySort", arraySort],
  ["arrayRetain", arrayRetain],
];

/**
 * The only path anything here writes to or removes, refused unless this process
 * made it under the system temporary directory.
 *
 * A REFUSAL RATHER THAN A SKIP, and asked again at the delete rather than trusted
 * from the creation, for the reason `test/helpers/perturbation.ts` gives: the
 * guard that matters is the one standing at the MUTATION.
 */
function throwawayOnly(path: string): string {
  const resolved = realpathSync(path);
  const checkout = realpathSync(process.cwd());
  if (resolved === checkout || resolved.startsWith(checkout + sep)) {
    throw new Error(`${resolved} is inside ${checkout}, so nothing here will write to it`);
  }
  const throwaway = realpathSync(tmpdir());
  if (resolved !== throwaway && !resolved.startsWith(throwaway + sep)) {
    throw new Error(`${resolved} is not under ${throwaway}, so nothing here will write to it`);
  }
  return path;
}

interface Fixture {
  readonly path: string;
  readonly entries: number;
  /** The order the names were WRITTEN in, which the probe below shows is not the order they arrive in. */
  readonly creationOrder: "ascending" | "shuffled";
  /** The order the filesystem hands the names back in, READ rather than inferred. */
  readonly arrivalPrefix: readonly string[];
  /** Whether the first twenty to arrive are already the twenty that render. */
  readonly arrivalIsRenderOrder: boolean;
  readonly rendered: readonly string[];
  /**
   * READ OFF THE DIRECTORY THIS PROCESS JUST WROTE, and it exists so that a cell
   * with nothing to render still has something to be WRONG about: a stat is
   * checked against this rather than against its own answer.
   */
  readonly ino: number;
}

async function buildFixture(
  root: string,
  entries: number,
  creationOrder: "ascending" | "shuffled",
  label: string = creationOrder,
): Promise<Fixture> {
  // GUARDED ONCE, HERE, AND NOT PER ENTRY: the guard resolves the real path, and
  // asking it a hundred thousand times would be timing the guard.
  const path = join(throwawayOnly(root), `${label}-${String(entries)}`);
  mkdirSync(path);
  const creation =
    creationOrder === "ascending"
      ? Array.from({ length: entries }, (_, index) => index)
      : shuffledOrder(entries);
  for (const index of creation) {
    writeFileSync(join(path, entryName(index)), "");
  }
  const rendered = Array.from({ length: entries }, (_, index) => entryName(index))
    .sort(byGroupThenName)
    .slice(0, entriesShown);
  const enumerated = await readdir(path);
  return {
    path,
    entries,
    creationOrder,
    arrivalPrefix: enumerated.slice(0, 25),
    arrivalIsRenderOrder: enumerated.slice(0, entriesShown).join(" ") === rendered.join(" "),
    rendered,
    ino: (await stat(path)).ino,
  };
}

interface Spread {
  median: number;
  min: number;
  max: number;
}

function spreadOf(values: readonly number[]): Spread {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
      : (sorted[middle] as number);
  return {
    median: Number(median.toFixed(3)),
    min: Number((sorted[0] as number).toFixed(3)),
    max: Number((sorted[sorted.length - 1] as number).toFixed(3)),
  };
}

async function timeShape(
  run: (path: string) => Promise<Listing>,
  fixture: Fixture,
  label: string,
): Promise<number> {
  const started = performance.now();
  const listing = await run(fixture.path);
  const elapsed = performance.now() - started;
  if (listing.total !== fixture.entries) {
    throw new Error(
      `${label} counted ${String(listing.total)} of ${String(fixture.entries)} in ${fixture.path}`,
    );
  }
  if (listing.names.join(" ") !== fixture.rendered.join(" ")) {
    throw new Error(`${label} rendered ${listing.names.join(" ")} in ${fixture.path}`);
  }
  return elapsed;
}

async function runCell(fixture: Fixture) {
  const rounds = roundsFor(fixture.entries);
  const loadBefore = loadavg();
  // One whole round discarded, so no shape alone pays for the first read of a
  // directory this process has just written.
  for (const [label, run] of shapes) {
    await timeShape(run, fixture, label);
  }
  const samples = new Map<string, number[]>(shapes.map(([label]) => [label, []]));
  for (let round = 0; round < rounds; round++) {
    for (let position = 0; position < shapes.length; position++) {
      const entry = shapes[(round + position) % shapes.length] as (typeof shapes)[number];
      (samples.get(entry[0]) as number[]).push(await timeShape(entry[1], fixture, entry[0]));
    }
  }
  const streamingSamples = samples.get("streaming") as number[];
  return {
    entries: fixture.entries,
    creationOrder: fixture.creationOrder,
    arrivalIsRenderOrder: fixture.arrivalIsRenderOrder,
    arrivalPrefix: fixture.arrivalPrefix,
    rendered: fixture.rendered,
    rounds,
    loadBefore,
    loadAfter: loadavg(),
    ms: Object.fromEntries([...samples].map(([label, values]) => [label, spreadOf(values)])),
    // PAIRED, ROUND BY ROUND, against the shape the package ships. The row for
    // `streamingAgain` is the null: its true value is zero.
    pairedDeltaVsStreaming: Object.fromEntries(
      [...samples].map(([label, values]) => [
        label,
        spreadOf(values.map((value, round) => value - (streamingSamples[round] as number))),
      ]),
    ),
  };
}

/**
 * The open alone against the stat alone, at the ordinary size and in this same
 * session, because the module's header rests an argument on THAT PAIR: what it
 * spends per highlight is a stat, and for a directory one listing. It states no
 * number for either of them, so this cell is where one is taken.
 *
 * GUARDED LIKE THE SHAPE CELLS, AND IT WAS NOT WHEN THE ROWS THE MODULE CITES
 * WERE TAKEN. What stood here observed that neither call RENDERS anything -- so
 * there is no total and no twenty to assert -- and stopped, which left two timed
 * calls asserting nothing at all. MEASURED, with the open replaced by a no-op
 * handing back an empty handle: this cell reported a median of 0.000 ms and the
 * process exited 0 with a complete, publishable reading. What binds these two
 * rows now is THE FIXTURE rather than the call's own shape -- the handle is
 * DRAINED after the timing window and its entries counted, and the stat's `ino`
 * must be the one this process read off the directory it wrote. THE ROWS THE
 * MODULE CITES PREDATE THIS GUARD and are not retro-validated by it: what it
 * buys is the next reading.
 */
async function runOpenAndStat(fixture: Fixture) {
  const rounds = roundsFor(fixture.entries);
  const opens: number[] = [];
  const stats: number[] = [];
  const loadBefore = loadavg();
  for (let round = 0; round < rounds + 1; round++) {
    const openStarted = performance.now();
    const handle = await opendir(fixture.path);
    const openElapsed = performance.now() - openStarted;
    // DRAINED RATHER THAN CLOSED, OUTSIDE THE TIMING WINDOW, and the drain is
    // the guard: counting the entries is what ties this row to the directory
    // the shape rows are read over. Exhausting the iteration is also the
    // release this handle needs on the runtime whose PARTIAL reads never give a
    // descriptor back, so the guard costs no `close()` either.
    const drained: string[] = [];
    for await (const entry of handle) {
      drained.push(entry.name);
    }
    if (drained.length !== fixture.entries) {
      throw new Error(
        `openAlone drained ${String(drained.length)} of ${String(fixture.entries)} in ${fixture.path}`,
      );
    }
    const statStarted = performance.now();
    const seen = await stat(fixture.path);
    const statElapsed = performance.now() - statStarted;
    if (!seen.isDirectory() || seen.ino !== fixture.ino) {
      throw new Error(
        `statAlone read ino ${String(seen.ino)} of ${String(fixture.ino)} in ${fixture.path}`,
      );
    }
    // The first round is the discarded warm-up, as in every other cell.
    if (round > 0) {
      opens.push(openElapsed);
      stats.push(statElapsed);
    }
  }
  return {
    entries: fixture.entries,
    rounds,
    loadBefore,
    loadAfter: loadavg(),
    ms: { openAlone: spreadOf(opens), statAlone: spreadOf(stats) },
  };
}

/**
 * A STAT PER ENTRY, at the ordinary size and in this same session, because the
 * module REFUSES that shape -- reading hidden as a platform ATTRIBUTE rather than
 * as a leading dot is a stat per entry, and that is the cost it names -- and the
 * refusal stands on no figure at all. This cell is where one is taken, so a
 * refusal that is still being made is one somebody can re-take.
 *
 * BOTH CALL PATTERNS, AND THE REASON IS THAT THE RETIRED FIGURE RECORDED
 * NEITHER: SEQUENTIAL awaits each stat before issuing the next, CONCURRENT
 * issues all of them and awaits `Promise.all`. They differ here by more than an
 * order of magnitude on one runtime, so ONE number for `a stat per entry` names
 * whichever pattern its author happened to write and says so to nobody.
 *
 * THE NAMES ARE READ BEFORE THE TIMING WINDOW, so what is timed is the stats
 * ALONE. What the refusal is about is the cost ADDED to a listing that is being
 * paid for anyway, not a listing plus its stats.
 *
 * GUARDED LIKE THE SHAPE CELLS: every result is counted and each must be a FILE
 * of zero bytes, which is what this process wrote -- so a pattern that skipped
 * the calls cannot report the fast row it would otherwise have earned.
 */
async function statsSequential(path: string, names: readonly string[]): Promise<number> {
  let counted = 0;
  for (const name of names) {
    const seen = await stat(join(path, name));
    counted += seen.isFile() && seen.size === 0 ? 1 : 0;
  }
  return counted;
}

async function statsConcurrent(path: string, names: readonly string[]): Promise<number> {
  const seen = await Promise.all(names.map((name) => stat(join(path, name))));
  return seen.filter((one) => one.isFile() && one.size === 0).length;
}

const statPatterns = [
  ["sequential", statsSequential],
  ["concurrent", statsConcurrent],
] as const;

async function runStatPerEntry(fixture: Fixture) {
  const rounds = roundsFor(fixture.entries);
  // OUTSIDE THE TIMING WINDOW, and read once: the subject is the stats.
  const names = await readdir(fixture.path);
  const samples = new Map<string, number[]>(statPatterns.map(([label]) => [label, []]));
  const loadBefore = loadavg();
  for (let round = 0; round < rounds + 1; round++) {
    for (let position = 0; position < statPatterns.length; position++) {
      const pattern = statPatterns[
        (round + position) % statPatterns.length
      ] as (typeof statPatterns)[number];
      const started = performance.now();
      const counted = await pattern[1](fixture.path, names);
      const elapsed = performance.now() - started;
      if (counted !== fixture.entries) {
        throw new Error(
          `${pattern[0]} statted ${String(counted)} of ${String(fixture.entries)} in ${fixture.path}`,
        );
      }
      // The first round is the discarded warm-up, as in every other cell.
      if (round > 0) {
        (samples.get(pattern[0]) as number[]).push(elapsed);
      }
    }
  }
  return {
    entries: fixture.entries,
    rounds,
    loadBefore,
    loadAfter: loadavg(),
    ms: Object.fromEntries([...samples].map(([label, values]) => [label, spreadOf(values)])),
  };
}

const root = throwawayOnly(realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-listing-shapes-"))));
try {
  const cells: Awaited<ReturnType<typeof runCell>>[] = [];
  let ordinary: Fixture | undefined;
  for (const entries of sizes) {
    const fixture = await buildFixture(root, entries, "shuffled");
    if (entries === 5000) {
      ordinary = fixture;
    }
    cells.push(await runCell(fixture));
  }
  // WHY ONE ARRIVAL ORDER AND NOT TWO, AND IT IS A FINDING RATHER THAN A
  // SIMPLIFICATION: the cells above are read in the order the FILESYSTEM hands
  // the names back, and this probe is what says that order is not the order they
  // were written in. Two directories holding the SAME names, one written in
  // ascending order and one shuffled, enumerate identically here -- so a second
  // creation order buys a second cell and not a second arrival order, and a
  // reading that claimed two would be claiming a variation it never made. The
  // arrival order that CAN be chosen is the one the package already made a
  // parameter, and its arm drives that sequence directly.
  const probeSize = sizes[0];
  const writtenAscending = await buildFixture(root, probeSize, "ascending");
  const writtenShuffled = await buildFixture(root, probeSize, "shuffled", "shuffled-again");
  console.log(
    JSON.stringify(
      {
        instrument: "scripts/listing-shapes.ts",
        runtime: "Deno" in globalThis ? "deno" : "bun",
        // READ OFF THE RUNNING BINARY rather than off a note beside the numbers.
        runtimeVersion: process.versions.deno ?? process.versions.bun ?? process.version,
        platform: `${process.platform} ${process.arch}`,
        cache: "warm: this process wrote the fixture and discarded one whole round per cell",
        entryMix: `names are 12 characters (13 hidden), \`NNNNNN-entry\`, one in ${String(hiddenEveryNth)} carrying a leading dot`,
        fixtureRoot: root,
        cells,
        openAndStat: ordinary === undefined ? null : await runOpenAndStat(ordinary),
        statPerEntry: ordinary === undefined ? null : await runStatPerEntry(ordinary),
        creationOrderProbe: {
          entries: probeSize,
          enumerationFollowsCreationOrder:
            writtenAscending.arrivalPrefix.join(" ") ===
            Array.from({ length: 25 }, (_, index) => entryName(index)).join(" "),
          identicalAcrossCreationOrders:
            writtenAscending.arrivalPrefix.join(" ") === writtenShuffled.arrivalPrefix.join(" "),
          ascendingPrefix: writtenAscending.arrivalPrefix,
          shuffledPrefix: writtenShuffled.arrivalPrefix,
        },
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(throwawayOnly(root), { recursive: true, force: true });
}
