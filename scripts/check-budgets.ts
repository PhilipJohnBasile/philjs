#!/usr/bin/env node
import { readdir, stat, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";
import { createReadStream, existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const METRICS_DIR = path.join(ROOT, "metrics");
const DIST_DIR = path.join(ROOT, "examples", "storefront", "dist", "client");

// Budget configurations for different packages
const BUDGETS = {
  storefront: {
    maxTotal: 70 * 1024, // 70 KB total before interaction
    maxSingle: 50 * 1024 // 50 KB per file
  },
  "philjs-core": {
    signals: 2 * 1024, // 2 KB gzipped
    "jsx-runtime": 1 * 1024, // 1 KB gzipped
    "minimal-app": 2 * 1024, // 2 KB gzipped (signals + jsx)
    "full-bundle": 25 * 1024 // 25 KB gzipped
  }
};

// Threshold for regression alerts (percentage)
const REGRESSION_THRESHOLD = 5; // Alert if size increases by more than 5%

type BudgetFileEntry = {
  name?: string;
  file?: string;
  size: number;
  gzipSize: number;
  budget?: number;
  budgetPassed?: boolean;
  exceedsBudget?: boolean;
};

type PackageResult = {
  files?: BudgetFileEntry[];
  totalSize?: number;
  totalSizeGzip?: number;
  budget?: number;
  budgetPassed: boolean;
  error?: string;
};

type BudgetResults = {
  timestamp: string;
  packages: Record<string, PackageResult>;
  regressions: Array<{
    package: string;
    file: string;
    oldSize: number;
    newSize: number;
    change: number;
  }>;
  summary: {
    totalPackages: number;
    totalFiles: number;
    totalSize: number;
    totalSizeGzip: number;
    budgetsPassed: boolean;
  };
};

type Options = {
  saveHistory: boolean;
  compareBaseline: boolean;
  package: string;
  json: boolean;
  ci: boolean;
};

async function main() {
  const args = process.argv.slice(2);
  const options: Options = {
    saveHistory: args.includes("--save-history"),
    compareBaseline: args.includes("--compare"),
    package: args.find(a => a.startsWith("--package="))?.split("=")[1] || "all",
    json: args.includes("--json"),
    ci: args.includes("--ci")
  };

  console.log("\n=== PhilJS Bundle Size Monitor ===\n");

  const results: BudgetResults = {
    timestamp: new Date().toISOString(),
    packages: {},
    regressions: [],
    summary: {
      totalPackages: 0,
      totalFiles: 0,
      totalSize: 0,
      totalSizeGzip: 0,
      budgetsPassed: true
    }
  };

  // Check storefront example
  if (options.package === "all" || options.package === "storefront") {
    const storefrontResult = await checkStorefront();
    results.packages.storefront = storefrontResult;
  }

  // Check core packages
  if (options.package === "all" || options.package === "philjs-core") {
    const coreResult = await checkPhilJSCore();
    results.packages["philjs-core"] = coreResult;
  }

  // Calculate summary
  results.summary = {
    totalPackages: Object.keys(results.packages).length,
    totalFiles: Object.values(results.packages).reduce(
      (sum, pkg) => sum + (pkg.files?.length || 0), 0
    ),
    totalSize: Object.values(results.packages).reduce(
      (sum, pkg) => sum + (pkg.totalSize || 0), 0
    ),
    totalSizeGzip: Object.values(results.packages).reduce(
      (sum, pkg) => sum + (pkg.totalSizeGzip || 0), 0
    ),
    budgetsPassed: Object.values(results.packages).every(pkg => pkg.budgetPassed)
  };

  // Compare with baseline if requested
  if (options.compareBaseline) {
    const baseline = await loadBaseline();
    if (baseline) {
      const regressions = detectRegressions(results, baseline);
      results.regressions = regressions;

      if (regressions.length > 0) {
        console.log("\n⚠️  SIZE REGRESSIONS DETECTED:\n");
        regressions.forEach(reg => {
          const sign = reg.change > 0 ? "+" : "";
          console.log(`  ${reg.package}/${reg.file}: ${sign}${reg.change.toFixed(1)}% (${formatBytes(reg.oldSize)} → ${formatBytes(reg.newSize)})`);
        });
      }
    }
  }

  // Save history if requested
  if (options.saveHistory) {
    await saveHistory(results);
    await updateBaseline(results);
    console.log(`\n📊 History saved to ${METRICS_DIR}/bundle-size-history.json`);
  }

  // Output results
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printResults(results);
  }

  // Exit with error if budgets exceeded or regressions found in CI
  const hasFailures = !results.summary.budgetsPassed ||
    (options.ci && results.regressions.length > 0);

  if (hasFailures) {
    console.error("\n❌ Bundle size check failed");
    process.exit(1);
  }

  console.log("\n✅ Bundle size check passed\n");
}

async function checkStorefront(): Promise<PackageResult> {
  const assetsDir = path.join(DIST_DIR, "assets");
  const files = await collectJSFiles(assetsDir);

  if (!files.length) {
    console.warn(`[storefront] No JS assets found. Did you run pnpm build?`);
    return { error: "No files found", budgetPassed: true };
  }

  const fileData: BudgetFileEntry[] = [];
  let totalSize = 0;
  let totalSizeGzip = 0;

  for (const file of files) {
    const info = await stat(file);
    const gzipSize = await getGzipSize(file);
    const relativePath = path.relative(DIST_DIR, file);

    totalSize += info.size;
    totalSizeGzip += gzipSize;

    fileData.push({
      file: relativePath,
      size: info.size,
      gzipSize,
      exceedsBudget: info.size > BUDGETS.storefront.maxSingle
    });
  }

  fileData.sort((a, b) => b.size - a.size);

  const budgetPassed = totalSize <= BUDGETS.storefront.maxTotal &&
    fileData.every(f => !f.exceedsBudget);

  console.log("[storefront]");
  fileData.forEach(({ file, size, gzipSize, exceedsBudget }) => {
    const marker = exceedsBudget ? "⚠️ " : "  ";
    console.log(`${marker}${file.padEnd(48)} ${formatBytes(size)} (${formatBytes(gzipSize)} gzip)`);
  });
  console.log(`  Total: ${formatBytes(totalSize)} (${formatBytes(totalSizeGzip)} gzip)`);
  console.log(`  Budget: ${formatBytes(BUDGETS.storefront.maxTotal)}`);

  if (!budgetPassed) {
    console.log(`  ❌ EXCEEDED by ${formatBytes(totalSize - BUDGETS.storefront.maxTotal)}`);
  } else {
    console.log(`  ✅ ${formatBytes(BUDGETS.storefront.maxTotal - totalSize)} under budget`);
  }
  console.log();

  return {
    files: fileData,
    totalSize,
    totalSizeGzip,
    budget: BUDGETS.storefront.maxTotal,
    budgetPassed
  };
}

async function checkPhilJSCore(): Promise<PackageResult> {
  const coreDistDir = path.join(ROOT, "packages", "philjs-core", "dist");

  if (!existsSync(coreDistDir)) {
    console.warn(`[philjs-core] Dist directory not found. Run pnpm build first.`);
    return { error: "Dist not found", budgetPassed: true };
  }

  const filesToCheck = [
    { name: "signals", path: "signals.js", budget: BUDGETS["philjs-core"].signals },
    { name: "jsx-runtime", path: "jsx-runtime.js", budget: BUDGETS["philjs-core"]["jsx-runtime"] },
    { name: "full-bundle", path: "index.js", budget: BUDGETS["philjs-core"]["full-bundle"] }
  ];

  const fileData: BudgetFileEntry[] = [];
  let totalSize = 0;
  let totalSizeGzip = 0;
  let allBudgetsPassed = true;

  console.log("[philjs-core]");

  for (const { name, path: filePath, budget } of filesToCheck) {
    const fullPath = path.join(coreDistDir, filePath);

    if (!existsSync(fullPath)) {
      console.log(`  ⚠️  ${name}: File not found`);
      continue;
    }

    const info = await stat(fullPath);
    const gzipSize = await getGzipSize(fullPath);
    const budgetPassed = gzipSize <= budget;

    if (!budgetPassed) allBudgetsPassed = false;

    totalSize += info.size;
    totalSizeGzip += gzipSize;

    const marker = budgetPassed ? "  ✅" : "  ❌";
    const diff = gzipSize - budget;
    const diffStr = diff > 0 ? ` (+${formatBytes(diff)})` : ` (${formatBytes(Math.abs(diff))} under)`;

    console.log(`${marker} ${name.padEnd(20)} ${formatBytes(gzipSize)} / ${formatBytes(budget)}${diffStr}`);

    fileData.push({
      name,
      file: filePath,
      size: info.size,
      gzipSize,
      budget,
      budgetPassed
    });
  }

  console.log();

  return {
    files: fileData,
    totalSize,
    totalSizeGzip,
    budgetPassed: allBudgetsPassed
  };
}

async function getGzipSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const gzip = createGzip({ level: 9 });

    gzip.on("data", chunk => chunks.push(chunk));
    gzip.on("end", () => {
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      resolve(totalSize);
    });
    gzip.on("error", reject);

    createReadStream(filePath).pipe(gzip);
  });
}

async function collectJSFiles(dir: string): Promise<string[]> {
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

async function saveHistory(results: BudgetResults) {
  await mkdir(METRICS_DIR, { recursive: true });

  const historyPath = path.join(METRICS_DIR, "bundle-size-history.json");
  let history = [];

  if (existsSync(historyPath)) {
    try {
      const content = await readFile(historyPath, "utf-8");
      history = JSON.parse(content);
    } catch (e) {
      console.warn("Failed to read history, creating new file");
      history = [];
    }
  }

  // Add current result
  history.push(results);

  // Keep last 100 entries
  if (history.length > 100) {
    history = history.slice(-100);
  }

  await writeFile(historyPath, JSON.stringify(history, null, 2));
}

async function loadBaseline(): Promise<BudgetResults | null> {
  const baselinePath = path.join(METRICS_DIR, "bundle-size-baseline.json");

  if (!existsSync(baselinePath)) {
    return null;
  }

  try {
    const content = await readFile(baselinePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.warn("Failed to read baseline");
    return null;
  }
}

async function updateBaseline(results: BudgetResults) {
  const baselinePath = path.join(METRICS_DIR, "bundle-size-baseline.json");
  await writeFile(baselinePath, JSON.stringify(results, null, 2));
}

function detectRegressions(current: BudgetResults, baseline: BudgetResults) {
  const regressions = [];

  for (const [pkgName, pkgData] of Object.entries(current.packages)) {
    const baselinePkg = baseline.packages?.[pkgName];
    if (!baselinePkg) continue;

    const currentFiles = pkgData.files || [];
    const baselineFiles = baselinePkg.files || [];

    for (const currentFile of currentFiles) {
      const fileKey = currentFile.file || currentFile.name;
      const baselineFile = baselineFiles.find(
        f => (f.file || f.name) === fileKey
      );

      if (!baselineFile) continue;

      const currentSize = currentFile.gzipSize || currentFile.size;
      const baselineSize = baselineFile.gzipSize || baselineFile.size;

      const percentChange = ((currentSize - baselineSize) / baselineSize) * 100;

      if (percentChange > REGRESSION_THRESHOLD) {
        regressions.push({
          package: pkgName,
          file: fileKey,
          oldSize: baselineSize,
          newSize: currentSize,
          change: percentChange
        });
      }
    }
  }

  return regressions;
}

function printResults(results: BudgetResults) {
  console.log("\n=== Summary ===");
  console.log(`Total packages checked: ${results.summary.totalPackages}`);
  console.log(`Total files: ${results.summary.totalFiles}`);
  console.log(`Total size (raw): ${formatBytes(results.summary.totalSize)}`);
  console.log(`Total size (gzip): ${formatBytes(results.summary.totalSizeGzip)}`);
  console.log(`Budgets passed: ${results.summary.budgetsPassed ? "✅ Yes" : "❌ No"}`);

  if (results.regressions.length > 0) {
    console.log(`Regressions: ⚠️  ${results.regressions.length}`);
  }
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

main().catch((error) => {
  console.error("Performance budget check failed:", error);
  process.exit(1);
});
