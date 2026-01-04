import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    resolveSnapshotPath: (testPath, snapExt) =>
      testPath.replace(/\.test\.([tj]s)x?$/, `.test${snapExt}`),
  },
  resolve: {
    alias: {
      "@philjs/adapters": resolve(repoRoot, "packages/philjs-adapters/src/index.ts"),
    },
  },
});
