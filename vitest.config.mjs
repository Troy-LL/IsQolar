export default {
  test: {
    include: ["src/guardian.test.ts"],
    alias: {
      "node:test": "vitest",
    },
  },
};
