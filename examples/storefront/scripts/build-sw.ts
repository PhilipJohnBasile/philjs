#!/usr/bin/env node

import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entry = resolve(root, "src", "sw.ts");
const output = resolve(root, "public", "sw.js");

mkdirSync(resolve(root, "public"), { recursive: true });

await build({
  entryPoints: [entry],
  outfile: output,
  bundle: false,
  format: "iife",
  target: "es2020",
  sourcemap: false
});

console.log("Built storefront service worker: public/sw.js");
