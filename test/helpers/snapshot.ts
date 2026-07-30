/** One entry of what the config author's own `tsudoi.documents` held at exit. */
export interface SnapshotDocument {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

/**
 * How test/fixtures/snapshot-config.ts labels its one line on stderr. Exported
 * so a test filtering stderr for server noise can exclude the fixture's own
 * report without repeating the string.
 */
export const snapshotMarker = "TSUDOI_SNAPSHOT ";

/**
 * How test/fixtures/document-members-config.ts labels ITS one line on stderr.
 *
 * A SECOND marker rather than a second field on the first, because the two
 * fixtures answer different questions and sync.test.ts asserts the snapshot
 * line by deep equality -- widening that line would move six tests that have no
 * stake in the second question at all.
 */
export const membersMarker = "TSUDOI_MEMBERS ";

/**
 * What EITHER fixture writes instead of a report when no request ever handed it
 * a `RequestContext`, and therefore no store.
 *
 * A PRECONDITION THAT IS REACHABLE RATHER THAN THEORETICAL: the store arrives
 * on a REQUEST and not from the factory, so a session that makes none leaves
 * both fixtures unprimed -- and such a session must not be reportable as one
 * that looked and found nothing, because most of what these fixtures serve is
 * an ABSENCE assertion and two outcomes that serialise alike record nothing.
 *
 * ONLY THE SNAPSHOT FIXTURE'S SPELLING IS EXPORTED, and the asymmetry is a
 * ruling rather than an omission. The vacuity this guards is a `toEqual([])`
 * that stops discriminating, and EVERY SUCH ASSERTION BELONGS TO
 * snapshot-config.ts; document-members-config.ts is asserted against a
 * NON-EMPTY report, which an unprimed fixture cannot produce however it
 * serialises. That fixture carries the same sentinel anyway -- naming its own
 * string, with a comment saying nothing asserts it -- because the honest
 * instrument is the same in both, but exporting a constant no test can use
 * would be a name this suite does not need.
 */
export const unprimedSnapshotMarker = `${snapshotMarker.trim()}_UNPRIMED`;

/**
 * The JSON a fixture wrote to stderr under `marker`, parsed.
 *
 * Throws quoting the whole of stderr when the line is absent: a report that
 * never arrived means the fixture never ran, which is a different failure from
 * a fixture that ran and found nothing, and must not be reported as one.
 *
 * IT SITS HERE RATHER THAN INSIDE `readSnapshot` BECAUSE A SECOND FIXTURE
 * REPORTS THIS WAY, and one absent-line throw shared by both is a throw that
 * cannot drift from itself.
 */
export function readMarkedLine(stderr: string, marker: string): unknown {
  const line = stderr.split("\n").find((candidate) => candidate.startsWith(marker));
  if (line === undefined) {
    throw new Error(`no ${marker.trim()} line on stderr; stderr was: ${JSON.stringify(stderr)}`);
  }
  return JSON.parse(line.slice(marker.length));
}

/** What the config author's document store held when the process exited. */
export function readSnapshot(stderr: string): SnapshotDocument[] {
  return readMarkedLine(stderr, snapshotMarker) as SnapshotDocument[];
}
