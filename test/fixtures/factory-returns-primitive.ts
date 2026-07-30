/**
 * A factory returning a PRIMITIVE, and the reason this fixture exists is that it
 * used to fail NOTHING.
 *
 * `5` has no `methods` to read, so no dereference threw, `loadConfig` returned
 * it, and the server came up advertising no capability at all -- a silently
 * inert server, which is the worst of the three arms even though it is the only
 * one that broke no assertion.
 */
export default () => 5;
