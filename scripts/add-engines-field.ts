/**
 * Script to add missing engines field to all package.json files
 * Ensures all packages specify Node.js >= 24 requirement.
 *
 * Usage: npx tsx scripts/add-engines-field.ts
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const PACKAGES_DIR = join(ROOT, 'packages');

interface PackageJson {
  name?: string;
  engines?: { node?: string };
  [key: string]: unknown;
}

async function getPackageJsonPaths(dir: string): Promise<string[]> {
  const paths: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const packageJsonPath = join(dir, entry.name, 'package.json');
        try {
          await readFile(packageJsonPath, 'utf-8');
          paths.push(packageJsonPath);
        } catch {
          // No package.json in this directory
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return paths;
}

async function processPackageJson(filePath: string): Promise<{ modified: boolean; action: string }> {
  const content = await readFile(filePath, 'utf-8');
  const pkg: PackageJson = JSON.parse(content);

  // Check if engines field exists with node requirement
  if (pkg.engines?.node) {
    return { modified: false, action: 'already has engines.node' };
  }

  // Add engines field
  pkg.engines = { node: '>=24' };

  // Reorder keys to put engines after version (common convention)
  const ordered: PackageJson = {};
  for (const key of Object.keys(pkg)) {
    ordered[key] = pkg[key];
    if (key === 'version' && !('engines' in ordered)) {
      ordered.engines = pkg.engines;
    }
  }
  if (!('engines' in ordered)) {
    ordered.engines = pkg.engines;
  }

  await writeFile(filePath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8');

  return { modified: true, action: 'added engines: { node: ">=24" }' };
}

async function main() {
  console.log('🔧 Adding missing engines field to package.json files...\n');

  const packagePaths = await getPackageJsonPaths(PACKAGES_DIR);
  console.log(`Found ${packagePaths.length} packages\n`);

  let added = 0;
  let skipped = 0;

  for (const filePath of packagePaths) {
    const { modified, action } = await processPackageJson(filePath);
    const relativePath = filePath.replace(ROOT + '/', '').replace(ROOT + '\\', '');

    if (modified) {
      console.log(`✅ ${relativePath} - ${action}`);
      added++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n✅ Added engines field to ${added} packages`);
  console.log(`⏭️  Skipped ${skipped} packages (already have engines.node)`);
  console.log(`📦 Processed ${packagePaths.length} packages total`);
}

main().catch(console.error);
