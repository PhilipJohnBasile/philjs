import { defineConfig } from "vite";
import { resolve } from "path";
import philjs from "../../packages/philjs-compiler/src/plugins/vite";

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
      "philjs-core": resolve(__dirname, "../../packages/philjs-core/dist"),
      "philjs-router": resolve(__dirname, "../../packages/philjs-router/dist"),
      "philjs-ssr": resolve(__dirname, "../../packages/philjs-ssr/dist"),
      "philjs-islands": resolve(__dirname, "../../packages/philjs-islands/dist"),
      "philjs-compiler": resolve(__dirname, "../../packages/philjs-compiler/src"),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "philjs-core",
  },
  server: {
    port: 3004,
  },
});
