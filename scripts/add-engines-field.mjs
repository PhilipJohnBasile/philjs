/**
 * Script to add missing engines field to all package.json files
 * Ensures all packages specify Node.js >= 24 requirement.
 *
 * Usage: node scripts/add-engines-field.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');

async function getPackageJsonPaths(dir) {
  const paths = [];

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

async function processPackageJson(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const pkg = JSON.parse(content);

  // Check if engines field exists with node requirement
  if (pkg.engines?.node) {
    return { modified: false, action: 'already has engines.node' };
  }

  // Add engines field after version
  const newPkg = {};
  let enginesAdded = false;

  for (const key of Object.keys(pkg)) {
    newPkg[key] = pkg[key];
    if (key === 'version' && !enginesAdded) {
      newPkg.engines = { node: '>=24' };
      enginesAdded = true;
    }
  }

  if (!enginesAdded) {
    newPkg.engines = { node: '>=24' };
  }

  await writeFile(filePath, JSON.stringify(newPkg, null, 2) + '\n', 'utf-8');

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
