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
 * line by deep equality -- widening that line would move six tests that this
 * sprint's criterion says stay put.
 */
export const membersMarker = "TSUDOI_MEMBERS ";

/**
 * The JSON a fixture wrote to stderr under `marker`, parsed.
 *
 * Throws quoting the whole of stderr when the line is absent: a report that
 * never arrived means the fixture never ran, which is a different failure from
 * a fixture that ran and found nothing, and must not be reported as one.
 *
 * IT LEFT `readSnapshot` THE MOMENT A SECOND FIXTURE REPORTED THIS WAY, and the
 * move came BEFORE that fixture was written, so no copy of the absent-line
 * throw ever existed to drift from this one.
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
