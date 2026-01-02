/**
 * PhilJS Production Build
 */

import { build as viteBuild } from "vite";
import * as pc from "picocolors";
import { philJSPlugin, philJSSSRPlugin } from "./vite-plugin.js";
import { performanceBudgets } from "@philjs/core";
import { buildStaticSite } from "philjs-ssr";
import * as fs from "fs/promises";
import * as path from "path";

export type BuildOptions = {
  ssg: boolean;
  analyze: boolean;
  outDir: string;
};

export async function buildProduction(options: BuildOptions): Promise<void> {
  const startTime = Date.now();

  // Check for performance budgets
  const budgetFile = path.join(process.cwd(), "philjs.config.js");
  let budgets = null;

  try {
    const config = await import(budgetFile);
    budgets = config.default?.performanceBudgets;
  } catch {
    // No config file - use defaults
  }

  // Client build
  console.log(pc.cyan("📦 Building client bundle...\n"));

  await viteBuild({
    plugins: [philJSPlugin()],
    build: {
      outDir: options.outDir,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor splitting
            vendor: ["@philjs/core"],
            router: ["philjs-router"],
          },
        },
      },
    },
  });

  // Server build (SSR)
  console.log(pc.cyan("\n📦 Building server bundle...\n"));

  await viteBuild({
    plugins: [philJSPlugin(), philJSSSRPlugin()],
    build: {
      outDir: `${options.outDir}/server`,
      ssr: true,
      rollupOptions: {
        input: "./src/entry-server.ts",
      },
    },
  });

  // Static Site Generation (if enabled)
  if (options.ssg) {
    console.log(pc.cyan("\n🔨 Generating static pages...\n"));

    try {
      // This would require route manifest from the app
      // For now, show what it would do
      console.log(pc.dim("  SSG would generate:"));
      console.log(pc.dim("  • index.html"));
      console.log(pc.dim("  • about.html"));
      console.log(pc.dim("  • ...dynamic routes"));
    } catch (error) {
      console.error(pc.red("SSG failed:"), error);
    }
  }

  // Check performance budgets
  if (budgets) {
    console.log(pc.cyan("\n📊 Checking performance budgets...\n"));

    const stats = await getOutputStats(options.outDir);

    if (budgets.maxBundleSize && stats.totalSize > budgets.maxBundleSize) {
      console.error(
        pc.red(
          `❌ Bundle size exceeds budget: ${formatSize(stats.totalSize)} > ${formatSize(budgets.maxBundleSize)}`
        )
      );
      process.exit(1);
    }

    console.log(
      pc.green(
        `✓ Bundle size: ${formatSize(stats.totalSize)} / ${formatSize(budgets.maxBundleSize || Infinity)}`
      )
    );
  }

  // Bundle analysis
  if (options.analyze) {
    console.log(pc.cyan("\n📈 Generating bundle analysis...\n"));

    const stats = await getOutputStats(options.outDir);

    console.log(pc.bold("\nBundle Analysis:"));
    console.log(pc.dim("─".repeat(50)));

    for (const [file, size] of Object.entries(stats.files)) {
      const percent = ((size / stats.totalSize) * 100).toFixed(1);
      console.log(
        `  ${file.padEnd(30)} ${formatSize(size).padStart(10)} ${pc.dim(`(${percent}%)`)}`
      );
    }

    console.log(pc.dim("─".repeat(50)));
    console.log(
      pc.bold(`  Total:`) + `${formatSize(stats.totalSize).padStart(41)}`
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(pc.green(`\n✓ Build completed in ${duration}s\n`));
}

async function getOutputStats(outDir: string) {
  const files: Record<string, number> = {};
  let totalSize = 0;

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const relativePath = path.relative(outDir, fullPath);
        files[relativePath] = stats.size;
        totalSize += stats.size;
      }
    }
  }

  await scanDir(outDir);

  return { files, totalSize };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
