/**
 * What the getter throws, exported so the test asserts the AUTHOR'S OWN words
 * reached stderr rather than merely that something failed.
 */
export const initializeGetterFailure = "the initialize handler could not be built";

/**
 * THE `initialize` KEY AS AN ACCESSOR, AND IT IS WHAT SAYS THE NEW READ GOES
 * THROUGH `readOrRefuse` RATHER THAN A BARE PROPERTY ACCESS. A getter is a legal
 * way to spell the key, and an author building the handler lazily -- from a file
 * read, a compiled grammar -- writes exactly this.
 *
 * WHAT A BARE READ WOULD COST IS THE FAILURE CONTRACT AND NOT THE MESSAGE: the
 * author's Error leaves `loadConfig` as something that is not a ConfigError, and
 * packages/tsudoi-language-server/src/cli.ts RETHROWS those -- so the author gets
 * a runtime stack with no `tsudoi: ` in front of it and an exit code the runtime
 * chose.
 *
 * NO TYPE ANNOTATION, for the reason its neighbour gives.
 */
export default () => ({
  methods: {
    get initialize(): never {
      throw new Error(initializeGetterFailure);
    },
  },
});
