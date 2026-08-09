// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * WHAT THE HANDLER SAW, REPORTED THROUGH THE WIRE -- the same shape and the same
 * reason as test/fixtures/handshake-state.ts's: the claim is that the AUTHOR'S
 * handler answered, and nothing tsudoi could have written on its behalf carries
 * the command the client sent back out.
 *
 * EXPORTED so the arm reading it and the handler building it cannot drift into
 * two shapes.
 */
export interface CommandEcho {
  readonly command: string;
  readonly arguments: unknown;
}

/**
 * A CONFIG THAT SERVES `workspace/executeCommand` AND DECLARES NO `initialize`
 * HANDLER, which is what makes it the fixture for BOTH halves of this row.
 *
 * The capability arm needs the second half: with no handler shaping the
 * handshake, `executeCommandProvider.commands` is whatever tsudoi's own
 * contributor wrote, and a config that set the list itself would tell that arm
 * nothing.
 *
 * AND IT ANSWERS A COMMAND IT NEVER ADVERTISED, which is not an oversight in
 * this file but its subject: the advertised list is empty here, tsudoi filters
 * on nothing, and what an unrecognised command means is the author's to decide.
 * This one decides to echo.
 */
export default (): Promise<TsudoiConfig> => {
  const executeCommand: MethodHandler<"workspace/executeCommand"> = (_context, params) => {
    const echo: CommandEcho = { command: params.command, arguments: params.arguments };
    return Promise.resolve(echo);
  };
  return Promise.resolve({ methods: { "workspace/executeCommand": executeCommand } });
};
