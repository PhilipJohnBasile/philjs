#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "examples", "storefront", "dist", "client");
const MAX_ROUTE_JS = 70 * 1024; // 70 KB before first interaction

async function main() {
  const assetsDir = path.join(DIST_DIR, "assets");
  let total = 0;
  const files = await collectJSFiles(assetsDir);

  if (!files.length) {
    console.warn(`[budgets] No JS assets found in ${assetsDir}. Did you run pnpm build?`);
    process.exit(0);
  }

  const rows = [];

  for (const file of files) {
    const info = await stat(file);
    total += info.size;
    rows.push({ file: path.relative(DIST_DIR, file), size: info.size });
  }

  rows.sort((a, b) => b.size - a.size);

  const format = (size) => `${(size / 1024).toFixed(2)} KB`;

  console.log("\n=== PhilJS Performance Budget Report ===\n");
  rows.forEach(({ file, size }) => {
    console.log(`${file.padEnd(48)} ${format(size)}`);
  });
  console.log("\nTotal JS before interaction:", format(total));
  console.log(`Budget: ${format(MAX_ROUTE_JS)}`);

  if (total > MAX_ROUTE_JS) {
    console.error(`\n❌ Budget exceeded by ${format(total - MAX_ROUTE_JS)}`);
    process.exit(1);
  }

  console.log("\n✅ Budget check passed\n");
}

async function collectJSFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    return [];
  }

  const files = await Promise.all(
    entries.map((entry) => {
      const joined = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectJSFiles(joined);
      }
      if (entry.isFile() && entry.name.endsWith(".js")) {
        return [joined];
      }
      return [];
    })
  );

  return files.flat();
}

main().catch((error) => {
  console.error("Performance budget check failed:", error);
  process.exit(1);
});
