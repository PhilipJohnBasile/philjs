import { fileURLToPath } from "node:url";
import path, { resolve } from "node:path";
import { defineConfig } from "vite";
import philjs from "../../packages/philjs-compiler/src/plugins/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    philjs({
      autoMemo: true,
      autoBatch: true,
      deadCodeElimination: true,
      optimizeEffects: true,
      optimizeComponents: true,
      verbose: true,
      development: process.env.NODE_ENV === "development",
    }),
  ],
  resolve: {
    alias: {
      "@philjs/core": resolve(__dirname, "../../packages/philjs-core/dist"),
      "@philjs/compiler": resolve(__dirname, "../../packages/philjs-compiler/src"),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@philjs/core",
  },
  server: {
    port: 3005,
  },
});
