import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    exclude: ["node_modules"],
    include: ["./**/*.{test,spec}.{js,ts}"],
    testTimeout: 100_000,
  },
});
