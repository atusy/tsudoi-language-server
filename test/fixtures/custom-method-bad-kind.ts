/**
 * A KIND THAT IS NEITHER, AND THE MISTAKE IS INVISIBLE UNDER ITS TYPE: `"Request"`
 * is a string exactly as `"request"` is, so a message naming what arrived by type
 * alone would tell this author nothing.
 *
 * WHAT IT COSTS IF IT LOADS: the kind decides which of upstream's two
 * registration functions tsudoi calls, and it is decided BEFORE any message
 * arrives, so a kind tsudoi cannot read is a name registered nowhere.
 *
 * NO TYPE ANNOTATION, for the reason test/fixtures/custom-method-collides.ts
 * gives.
 */
export default () => ({
  customMethod: {
    "textDocument/didFocus": { kind: "Request", handler: () => Promise.resolve({ result: null }) },
  },
});
