import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const resolvePath = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/vitest.ts"],
  },
  resolve: {
    alias: {
      "@philjs/testing": resolvePath("./src/index.ts"),
      "@philjs/testing/vitest": resolvePath("./src/vitest.ts"),
      "@philjs/testing/jest": resolvePath("./src/jest.ts"),
    },
  },
});
