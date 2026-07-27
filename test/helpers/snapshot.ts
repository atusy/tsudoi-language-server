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
 * What the config author's document store held when the process exited.
 *
 * Throws quoting the whole of stderr when the line is absent: a snapshot that
 * never arrived means the fixture never ran, which is a different failure from
 * an empty store and must not be reported as one.
 */
export function readSnapshot(stderr: string): SnapshotDocument[] {
  const line = stderr.split("\n").find((candidate) => candidate.startsWith(snapshotMarker));
  if (line === undefined) {
    throw new Error(
      `no ${snapshotMarker.trim()} line on stderr; stderr was: ${JSON.stringify(stderr)}`,
    );
  }
  return JSON.parse(line.slice(snapshotMarker.length)) as SnapshotDocument[];
}
