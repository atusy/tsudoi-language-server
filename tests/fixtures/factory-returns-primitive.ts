/**
 * A factory returning a PRIMITIVE, and the reason this fixture exists is that
 * this arm BREAKS NOTHING BY ITSELF.
 *
 * `5` has no `methods` to read, so no dereference throws: an unguarded
 * `loadConfig` hands it straight back and the server comes up advertising no
 * capability at all -- a silently inert server, which is the worst of the three
 * arms precisely because it is the only one no assertion trips over on its own.
 */
export default () => 5;
