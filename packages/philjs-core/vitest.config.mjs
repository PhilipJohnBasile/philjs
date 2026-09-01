import { configDefaults, defineConfig } from "vitest/config";

const performanceTests = [
  "src/benchmarks.test.ts",
  "src/performance.test.ts",
];

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    exclude:
      process.env.PHILJS_RUN_PERFORMANCE_TESTS === "1"
        ? configDefaults.exclude
        : [...configDefaults.exclude, ...performanceTests],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    },
  },
});
