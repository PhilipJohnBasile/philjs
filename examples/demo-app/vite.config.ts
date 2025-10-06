import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "philjs-core": resolve(__dirname, "../../packages/philjs-core/dist"),
      "philjs-router": resolve(__dirname, "../../packages/philjs-router/dist"),
      "philjs-ssr": resolve(__dirname, "../../packages/philjs-ssr/dist"),
      "philjs-islands": resolve(__dirname, "../../packages/philjs-islands/dist"),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "philjs-core",
  },
  server: {
    port: 3000,
  },
});