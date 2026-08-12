/**
 * A CUSTOM METHOD WHOSE HANDLER IS NOT CALLABLE. Unlike a row of the request
 * table this advertises no capability, so no client is INVITED to send it --
 * what it breaks is the registration itself, for a name tsudoi would otherwise
 * have answered.
 *
 * NO TYPE ANNOTATION, for the reason test/fixtures/custom-method-collides.ts
 * gives.
 */
export default () => ({
  customMethod: {
    "textDocument/didFocus": 5,
  },
});
