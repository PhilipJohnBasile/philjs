import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "philjs-core",
  },
  resolve: {
    alias: {
      "philjs-core/jsx-runtime": "/Users/pjb/Git/philjs/packages/philjs-core/dist/jsx-runtime.js",
    },
  },
});
