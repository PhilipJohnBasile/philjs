import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "philjs-core",
  },
  resolve: {
    alias: {
      "philjs-core/jsx-runtime": path.resolve(__dirname, "../../packages/philjs-core/dist/jsx-runtime.js"),
    },
  },
  server: {
    port: 3002,
  },
});
