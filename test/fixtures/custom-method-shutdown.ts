export default () => ({
  customMethod: {
    shutdown: (_context: unknown, _params: unknown) => Promise.resolve({ result: null }),
  },
});
