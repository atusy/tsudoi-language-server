/**
 * THE TWO WAYS A SESSION ENDS WITHOUT ANYBODY SAYING SO, and what tsudoi does
 * about each.
 *
 * WHY THIS EXISTS AT ALL, MEASURED RATHER THAN FEARED: a tsudoi server was found
 * on a developer's machine ORPHANED AT PPID 1, state R, at 99.4% OF A CORE, FIVE
 * DAYS after whatever started it had gone. Nineteen more were alive beside it.
 * The ordinary death was never the problem -- a server over pipes whose parent
 * exits is gone in seconds, because stdin reaches EOF and the event loop empties
 * -- so what is caught here are the two states in which that mechanism does not
 * fire.
 */
import process from "node:process";

/**
 * How often the parent is asked about. THREE SECONDS IS THE ECOSYSTEM'S NUMBER
 * rather than one chosen here: `vscode-languageserver`'s own watchdog polls at
 * that interval, so an editor's expectations about how long a server outlives it
 * are already calibrated to it. What the number costs is bounded by the `unref`
 * below; what a LONGER one costs is a zombie living that much longer.
 */
const pollMs = 3000;

/**
 * Whether a process id still names something alive.
 *
 * SIGNAL 0 IS THE QUESTION AND NOT AN ACTION: it runs the permission and
 * existence checks and delivers nothing. `EPERM` therefore means ALIVE AND NOT
 * OURS -- a real answer -- where `ESRCH` means gone, so a bare `catch` that
 * treated every throw as death would kill a server whose editor merely runs as
 * another user.
 */
function alive(processId: number): boolean {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

export interface EditorWatch {
  /** What the editor named, so a caller can say whether anything is watched. */
  readonly processId: number | null;
  /** Stops the poll. Safe to call when nothing was started. */
  readonly stop: () => void;
}

/**
 * Watches the process the editor named in `initialize`, and calls `gone` once it
 * is not there.
 *
 * WHAT THIS CATCHES THAT THE END OF STDIN DOES NOT: a stdin that never reaches
 * EOF because some OTHER surviving process still holds the write end of the
 * pipe. That is what a multiplexer produces -- one process spawns the server and
 * hands the pipe on -- and it is the likeliest way a server outlives its editor
 * by days rather than seconds.
 *
 * `null` IS NOT A FAILURE AND STARTS NOTHING. The protocol defines it as `the
 * server was not started by another process`, so there is nobody to outlive; a
 * poll invented for that case would be watching this process's own parent, which
 * is not what the client said.
 *
 * THE INTERVAL IS `unref`ed, AND THAT IS THE WHOLE POINT RATHER THAN A DETAIL.
 * src/notifications.ts records that the FRAMEWORK's own watchdog starts an
 * UN-`unref`ed interval on a numeric `processId` -- so the reference
 * implementation of this feature is itself an instance of the bug it fixes. A
 * timer that keeps the loop alive turns every clean exit into a hang.
 *
 * IT IS ALSO WHY THIS CANNOT BE THE ONLY NET: `unref`ed, it never fires on a
 * process that has nothing else to do, because there is no loop left for it to
 * fire in. It is the net for a session that is otherwise BUSY.
 */
export function watchEditor(
  processId: number | null,
  gone: () => void,
  isAlive: (processId: number) => boolean = alive,
): EditorWatch {
  if (processId === null || !Number.isInteger(processId) || processId <= 0) {
    return { processId: null, stop: () => undefined };
  }
  const timer = setInterval(() => {
    if (!isAlive(processId)) {
      gone();
    }
  }, pollMs);
  timer.unref();
  return { processId, stop: () => clearInterval(timer) };
}

/**
 * Calls `ended` once the client's end of the connection is closed for good.
 *
 * WHY THIS IS NOT ALREADY COVERED BY THE LOOP EMPTYING, which is what tsudoi
 * relied on before: emptying is a CONSEQUENCE and this is a DECISION. One
 * un-`unref`ed handle anywhere -- a timer a config author opened in a hover
 * handler, a watcher inside a document change -- keeps the process alive after
 * EOF, and src/server.ts already records that nothing in the suite observes a
 * handle opened outside the startup path. So the state this catches is exactly
 * the one nothing else can see.
 *
 * `end` AND NOT `close`, AND THE DIFFERENCE IS THE RUNTIME: src/server.ts
 * records that `reader.onClose` fires on bun and NEVER on deno, where
 * `process.stdin.on("end")` fires on both. This is that hook, taken at last.
 */
export function watchStdin(ended: () => void): void {
  process.stdin.on("end", ended);
  // A CLOSED-BY-ERROR STDIN IS AN ENDED ONE FOR THIS PURPOSE, and treating it as
  // anything else leaves the process in the state this module exists to prevent:
  // there is no client left to report the error to, and nothing to serve.
  process.stdin.on("error", ended);
}
