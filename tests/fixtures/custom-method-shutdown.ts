export default () => ({
  customMethods: {
    shutdown: (_context: unknown, _params: unknown) => Promise.resolve({ result: null }),
  },
});
