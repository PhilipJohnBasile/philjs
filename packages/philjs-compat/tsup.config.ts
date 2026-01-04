import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/signals.ts", "src/dom.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  clean: true,
  treeshake: true,
  minify: false,
  sourcemap: true,
  external: ["@philjs/core"],
});
