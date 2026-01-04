import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/aws.ts", "src/vercel.ts", "src/cloudflare.ts", "src/netlify.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  minify: false,
  sourcemap: true,
  external: ["@philjs/core", "@philjs/adapters"],
});
