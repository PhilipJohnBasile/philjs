import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    resolveSnapshotPath: (testPath: string, snapExt: string) =>
      testPath.replace(/\.test\.([tj]s)x?$/, `.test${snapExt}`),
  },
  resolve: {
    alias: {
      "@philjs/core": resolve(repoRoot, "packages/philjs-core/src/index.ts"),
      "./view-transitions": resolve(__dirname, "src/view-transitions.ts"),
    },
  },
});

