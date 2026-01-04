import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/csp.ts", "src/csrf.ts", "src/headers.ts", "src/sanitize.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  minify: false,
  sourcemap: true,
  external: ["@philjs/core"],
});
