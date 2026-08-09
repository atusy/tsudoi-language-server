/**
 * AN `initialize` KEY THAT IS PRESENT AND NOT CALLABLE, AND WHAT IT TAKES DOWN
 * IS THE HANDSHAKE ITSELF. tsudoi hands this key the InitializeResult it would
 * otherwise have sent and answers `initialize` with whatever comes back, so `5`
 * fails the one request a session cannot do without.
 *
 * THE CAPABILITY SENTENCE THE FIVE METHOD KEYS ARE REFUSED WITH IS FALSE OF THIS
 * ONE, which is why the message it earns is a sibling rather than a reuse: this
 * key contributes no capability, and no client sends `initialize` because it was
 * invited to.
 *
 * NO TYPE ANNOTATION, deliberately and for the reason
 * test/fixtures/handler-not-a-function.ts gives: `TsudoiConfig` would make tsc
 * refuse the file, and this is refused at run time by
 * packages/tsudoi-language-server/src/config.ts instead.
 */
export default () => ({ methods: { initialize: 5 } });
