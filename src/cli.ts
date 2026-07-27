import process from "node:process";

const args = process.argv.slice(2);
const flagIndex = args.indexOf("--config");
const configPath = flagIndex === -1 ? undefined : args[flagIndex + 1];

if (configPath === undefined) {
  // Setting exitCode rather than calling process.exit lets the stderr pipe
  // drain; process.exit can truncate it. Nothing holds the event loop yet.
  process.stderr.write("tsudoi: --config <path> is required\n");
  process.exitCode = 1;
}
