import { setDefaultTimeout } from "bun:test";

/**
 * THE SUITE'S OWN TIME LIMIT, SO A RED IN THE FIRST DEFINITION-OF-DONE CHECK IS
 * A STATEMENT ABOUT tsudoi RATHER THAN ABOUT THE MACHINE IT RAN ON.
 *
 * WHAT IT REPLACES, AND SAYING SO IS THE POINT: `bun test --timeout 30000` on
 * the command line, which this project used through four sprints to tell a
 * machine's red from the code's. THE FLAG IS INERT FOR EVERY SWEPT FILE --
 * MEASURED IN BOTH DIRECTIONS rather than assumed from the preload precedence
 * this project recorded before, because that one turned out narrower than it
 * read: a file calling this with 20_000 passes a 6000ms test under `--timeout
 * 3000`, and a file calling it with 2000 FAILS the same test at 2002ms under
 * `--timeout 30000`. The call wins either way. The knob that still works is the
 * variable below.
 *
 * A HANG-CATCHER, NOT A PERFORMANCE BUDGET, and it may not become somewhere
 * slow code hides. Both bounds were read from this tree before the number was
 * chosen:
 *
 * THE FLOOR IS 20_000, `handshakeTimeoutMs` in test/helpers/readme.ts, which is
 * the largest deadline a HELPER sets that is reachable from a test carrying no
 * explicit one -- `the README's quickstart brings up a server under bun|deno`.
 * Under bun's 5000ms default that helper deadline is UNREACHABLE: the test dies
 * first and names nothing, where the helper would have said which command never
 * answered. Which deadline arrives first is what decides whether the failure
 * names its cause.
 *
 * THE MARGIN OVER THE FLOOR IS DERIVED RATHER THAN ROUNDED. The quickstart test
 * writes files, packs and installs BEFORE it reaches that handshake -- MEASURED
 * at 142ms (bun) and 160ms (deno) for the whole test on a quiet machine, and
 * this tree has WITNESSED a 21x inflation under load, where two 185ms arms in
 * test/protocol.test.ts crossed 4000ms. So the work in front of the handshake
 * costs about 3.4s at the worst load anyone here has recorded, and a default
 * below about 23_500 would still kill the test before its helper spoke.
 *
 * AND IT IS DELIBERATELY NOT 30_000, which is the number the retired flag
 * carried and the one it would have been easiest to inherit. 30_000 is the
 * fake editor's own self-exit (test/helpers/fake-editor.ts), so the two
 * deadlines would coincide; that timer is reachable only from the two rig tests
 * in test/editor-death.test.ts, which set 20_000 for themselves and so fire
 * first -- but a coincidence nobody chose is how 5000ms got here.
 *
 * THE CEILING IS THE COST OF A GENUINE HANG AND IT IS NOT SMALL. bun runs this
 * suite in ONE process, file after file, so a subject that hangs parks every
 * test that waits on it, each for the full default. The largest single-subject
 * park in this tree is test/workspace.test.ts: 44 tests, every one of them
 * driving a live server, none carrying its own deadline -- 18m20s at this value
 * against 3m40s under bun's default; a count of one file's arms, re-read since,
 * and it is as perishable as the one below turned out to be. The whole-suite
 * bound is EVERY TEST IN THE SUITE parked for the full default, WHICH IS WHY THE
 * MULTIPLIER AND NOT THE PRODUCT IS THE THING TO WEIGH, AND IT IS 5x. It is
 * accepted because the alternative is a value below the floor, which leaves the
 * whole class this exists to remove.
 *
 * THE PRODUCT USED TO BE WRITTEN HERE AS A NUMBER AND IT WENT STALE INSIDE THE
 * COMMIT THAT WROTE IT: `792 x the default`, taken before this sprint's own arms
 * were added, landed on a tree that already ran more than that. This project
 * refuses counts for exactly that reason, and this one did not survive its own
 * increment.
 */
export const suiteDeadlineMs = 25_000;

/**
 * The one route to a different value that edits no tracked file.
 *
 * IT IS A SEAM AND NOT A KNOB. Without it the arms that verify this module must
 * either import a RE-IMPLEMENTATION -- no shared subject, so deleting the real
 * call below would redden nothing -- or spend half a minute per arm. With it, a
 * throwaway tree runs the REAL module at values small enough that the reading is
 * unambiguous.
 *
 * THE STANDING OBJECTION TO ENV KNOBS IS ANSWERED RATHER THAN IGNORED: a key
 * that stops matching stops applying, silently. A typo in the spelling HERE
 * makes the over-arms in test/suite-deadline.test.ts pass, so every run of the
 * suite exercises this string. What that does not cover is a malformed VALUE,
 * which is what the refusal below is for.
 */
const overrideName = "TSUDOI_TEST_TIMEOUT_MS";

const raw = process.env[overrideName];
const deadlineMs = raw === undefined ? suiteDeadlineMs : Number(raw);

/**
 * REFUSING IS LOAD-BEARING RATHER THAN DEFENSIVE, AND THE MEASUREMENT IS WHY.
 * MEASURED on bun 1.3.13 against a test sleeping 6000ms -- one bun's own 5000ms
 * default fails -- `setDefaultTimeout` with NaN, with 0 and with a NEGATIVE
 * number DISABLES THE DEADLINE ENTIRELY rather than falling back: all three ran
 * 1 pass at exit 0. `Number("") === 0`, so a SET-BUT-EMPTY variable switches
 * every deadline in this suite off WHILE THE RUN REPORTS GREEN, which is the
 * silent-key class this project has met before.
 *
 * A FOURTH SHAPE THE RECORD DID NOT ANTICIPATE, and it fails the other way:
 * `1.5` truncates to 1ms, so a fractional value makes EVERYTHING fail rather
 * than nothing. Refusing anything but a positive integer is what covers both
 * directions with one rule.
 *
 * WRITTEN TO stderr AND exit 1 RATHER THAN THROWN, deliberately: a throw from a
 * module a test file imports is reported as `Unhandled error between tests` and
 * COUNTED AS A FAILING TEST, so the one thing a reader needs -- that no test ran
 * and why -- arrives dressed as a test result. The shape here is tsudoi's own
 * failure contract: exit 1, one line on stderr starting `tsudoi: `.
 *
 * AT MODULE SCOPE AND NOT INSIDE THE FUNCTION, because a malformed value is a
 * fact about the run and not about a file: the first swept file to be evaluated
 * refuses for all of them, MEASURED at exit 1 with three calling files in the
 * tree and no test executed.
 */
if (raw !== undefined && (!Number.isInteger(deadlineMs) || deadlineMs <= 0)) {
  process.stderr.write(
    `tsudoi: ${overrideName} must be a positive integer of milliseconds; got ${JSON.stringify(raw)}\n`,
  );
  process.exit(1);
}

/**
 * CALLED AT THE TOP OF EVERY ROOT TEST FILE, AND IT HAS TO BE A CALL RATHER
 * THAN AN IMPORT SIDE EFFECT.
 *
 * WHY NOT A PRELOAD, WHICH IS WHAT THIS SPRINT SET OUT TO BUILD: MEASURED on
 * bun 1.3.13, `setDefaultTimeout` from a preload REACHES THE FIRST TEST FILE AND
 * NOTHING AFTER IT -- three files, one 6000ms sleep each, preload setting
 * 20_000, nothing else in the tree, 1 pass / 2 fail with the later two at `timed
 * out after 5000ms`. Registered hooks cannot repair it: `beforeAll`,
 * `beforeEach` and `afterAll` in the preload all left that reading unchanged,
 * because a test captures its deadline when it is REGISTERED, which is
 * module-evaluation time for its own file.
 *
 * AND FOR THE SAME REASON A BARE `import` OF THIS MODULE WOULD NOT DO EITHER:
 * the module registry evaluates it ONCE, so the side effect would land in
 * whichever file imported first and leave every later file at bun's default --
 * the preload defect wearing different clothes. The call is per file because the
 * thing being set is per file.
 *
 * ITS OWN MODULE AND NOT test/helpers/build.ts, and this route STRENGTHENS that
 * reason rather than retiring it: the build throws on a failed compile, and a
 * policy welded to it would die with the build -- and every arm that verifies
 * this must run the REAL module in a throwaway tree, which is impossible if
 * importing it compiles the whole workspace.
 *
 * THE HOLE THIS OPENS IS A FILE THAT FORGETS TO CALL IT, and it is closed by
 * `every root test file sets the suite's deadline` in
 * test/suite-deadline.test.ts rather than by care. MEASURED that the hole is
 * real and silent: in a tree of three calling files plus one that does not call,
 * the fourth fails at 5000ms while the other three pass -- a calling file does
 * NOT leak its value into the next one.
 */
export function applySuiteDeadline(): void {
  setDefaultTimeout(deadlineMs);
}
