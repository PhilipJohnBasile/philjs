import { defineConfig } from "vitest/config";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const coreSrc = resolve(repoRoot, "packages/philjs-core/src");
const routerSrc = resolve(repoRoot, "packages/philjs-router/src");
const ssrSrc = resolve(repoRoot, "packages/philjs-ssr/src");

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@philjs\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@philjs\/core\/(.*)$/, replacement: `${coreSrc}/$1.ts` },
      { find: "@philjs/router", replacement: `${routerSrc}/index.ts` },
      { find: "@philjs/ssr", replacement: `${ssrSrc}/index.ts` },
    ],
  },
});
