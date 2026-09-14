/**
 * A factory that RESOLVES to null, which is a separate case from returning
 * nothing and not a spelling of it: `typeof null` is `"object"`, so a guard
 * written as `typeof returned !== "object"` alone admits this and hands
 * `null.methods` to the next reader.
 *
 * ASYNC, because that is where the value comes from in practice -- a lookup that
 * found nothing, forwarded by an author who did not check.
 */
export default () => Promise.resolve(null);
