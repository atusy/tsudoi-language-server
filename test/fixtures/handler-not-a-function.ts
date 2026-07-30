/**
 * A METHOD KEY THAT IS PRESENT AND NOT CALLABLE, which is WORSE THAN INERT.
 *
 * `contributeCapabilities` claims a capability on `!== undefined`, so this
 * config makes tsudoi advertise `hoverProvider: true` -- and a conforming client
 * is then entitled to send hovers that the drive answers by CALLING `5`. Every
 * one of them is a TypeError, answered -32603, for the whole life of the
 * session. tsudoi claiming what it cannot answer is the exact state the
 * resolve/completion rule beside it exists to prevent.
 *
 * NO TYPE ANNOTATION, deliberately: `MethodHandler` would make tsc refuse the
 * file, and this is refused at runtime by src/config.ts instead.
 */
export default () => ({ methods: { "textDocument/hover": 5 } });
