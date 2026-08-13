export default () => ({
  customMethods: {
    exit: (_context: unknown, _params: unknown) => Promise.resolve(),
  },
});
