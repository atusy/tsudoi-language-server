/**
 * `methods` AS A PRIMITIVE -- the object-level twin of
 * factory-returns-primitive.ts, and inert for exactly the same reason.
 *
 * Nothing dereferences it: `contributeCapabilities` asks
 * `config.methods?.[method] !== undefined`, and reading a method name off `5`
 * answers `undefined` rather than throwing. So no capability is claimed, every
 * request is answered `null`, and the author has a server that came up cleanly
 * and says nothing at all.
 *
 * NO TYPE ANNOTATION, deliberately, and for the reason given in full at
 * factory-returns-nothing.ts: annotating this would make tsc refuse the file,
 * and it exists to be REFUSED AT RUNTIME by src/config.ts, which reaches the
 * factory through a cast from `unknown`.
 */
export default () => ({ methods: 5 });
