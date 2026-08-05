import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * A throwaway workspace: manifests, configs and sources written out as CONTENT,
 * for the scripts that read a workspace to be driven against a state this
 * repository must never be in.
 *
 * NOT test/helpers/tree.ts, WHICH IS THE OTHER THROWAWAY BUILDER IN THIS
 * DIRECTORY AND ANSWERS A DIFFERENT QUESTION. That one builds a tree of EMPTY
 * entries because its subject is the SHAPE OF A PATH -- what a directory, a
 * file, or a link resolves to. This one's subject is what a package DECLARES,
 * so every entry has to carry bytes somebody parses. Merging them would give
 * one helper two reasons to change, and the first caller wanting an empty file
 * with a manifest's name would settle it in whichever direction that caller
 * happened to need.
 *
 * THE CALLER DISPOSES, WHICH IS WHY THIS RETURNS A BARE PATH. Two callers pass
 * the root to a spawned command and one passes it to a script that mutates it,
 * and each already owns a `finally` for the temp directory it made -- a
 * disposer here would be a second lifetime for them to keep in step with the
 * first.
 *
 * EVERY THROWAWAY IS A CHECKOUT, AND THAT IS ONE KIND OF THROWAWAY RATHER THAN
 * TWO. The fifth check asks git which files this tree owns -- the index is how
 * it tells an installed stranger and a built artifact from a source somebody
 * wrote -- so a tree that is not a repository is a tree that check cannot be
 * measured on at all. Making it conditional would mean every future
 * caller choosing, and the arms that need a repository and the arms that do not
 * would drift apart with nothing saying which kind any given tree is.
 *
 * STAGED AND NOT ONLY INITIALISED, which is the half that is easy to leave out
 * and silently inverts every pair built here: PROGRAMS are enumerated from
 * TRACKED files, and a repository with nothing staged tracks nothing -- so an
 * unstaged throwaway has no programs, every file in it is covered by none of
 * them, and the unplanted half of every pair goes red. `add` is also as far as
 * this can go without an identity: a commit needs `user.email`, which is the
 * machine's and not this suite's to require.
 *
 * AND STAGED UNDER THE SAME OVERRIDE THE CHECK ITSELF USES, because a helper
 * honouring a PERSONAL ignore file makes every arm built here machine-dependent
 * in the one direction nobody would look: programs come from tracked files, so a
 * developer whose global ignore happens to match a fixture path loses a program
 * and reddens arms nobody else can reproduce. MEASURED on this machine, whose
 * global ignore names `node_modules`: a tree holding
 * `packages/declared/node_modules/stranger/{package.json,index.ts}` staged
 * NEITHER file without the override and both with it. That arm passes today only
 * because the check subtracts installed dependencies anyway, which is a second
 * mechanism standing in for this one.
 *
 * NOT `--force`, WHICH WOULD REACH TOO FAR: a fixture may plant a `.gitignore`
 * of its own -- one does, to make an emitted artifact ignored the way a real
 * checkout has it -- and that file is part of the state under test. The override
 * neutralises the machine's file and leaves the tree's own in effect; MEASURED,
 * a tree ignoring `dist/` still stages neither its `dist/` nor anything in it.
 *
 * A TEST THAT WANTS AN UNTRACKED FILE WRITES IT AFTER THIS RETURNS, and that is
 * the story the guard is about rather than an inconvenience -- a file just
 * added is untracked, and an arm staging its plant through this helper measures
 * the `--cached` half only.
 */
export function workspace(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-workspace-"));
  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  // PIPED RATHER THAN INHERITED: `git init` writes a hint about the default
  // branch name on a machine that has not chosen one, and a caller collecting a
  // spawned command's streams would find it in the bytes it is asserting on.
  execFileSync("git", ["init", "-q"], { cwd: root, stdio: "pipe" });
  execFileSync("git", ["-c", "core.excludesFile=/dev/null", "add", "-A"], {
    cwd: root,
    stdio: "pipe",
  });
  return root;
}
