/**
 * THE ARROW-BLOCK TRAP, in the shortest form that produces it: the braces are a
 * BODY and not an object literal, so this factory returns `undefined`.
 *
 * Its realistic twin is `async () => { methods: { ... } }`, where `methods:` is
 * a LABEL and the object the author meant is a block statement. That spelling is
 * not the fixture because a label with no loop is an oxlint `no-unused-labels`
 * finding, and a fixture the linter refuses cannot be committed -- but it is the
 * shape a config author actually writes, and it returns exactly what this does.
 *
 * NO TYPE ANNOTATION, deliberately: annotating it `TsudoiConfigFactory` would
 * make tsc refuse the file, and this exists to be REFUSED AT RUNTIME by
 * src/config.ts, which reaches the factory through a cast from `unknown`.
 */
export default () => {};
