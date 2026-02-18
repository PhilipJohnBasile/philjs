/**
 * Script to remove `|| exit 0` patterns from all package.json files
 * These patterns silently hide build/test failures and must be removed.
 *
 * Usage: node scripts/fix-exit-zero.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');
const EXAMPLES_DIR = join(ROOT, 'examples');

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

function removeExitZeroPattern(script) {
  // Remove various forms of || exit 0 pattern
  return script
    .replace(/\s*\|\|\s*exit\s+0\s*$/g, '')  // || exit 0 at end
    .replace(/\s*\|\|\s*true\s*$/g, '')       // || true at end
    .replace(/\s*;\s*exit\s+0\s*$/g, '')      // ; exit 0 at end
    .trim();
}

async function processPackageJson(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const pkg = JSON.parse(content);
  const changes = [];

  if (!pkg.scripts) {
    return { modified: false, changes: [] };
  }

  let modified = false;

  for (const [scriptName, scriptValue] of Object.entries(pkg.scripts)) {
    if (typeof scriptValue === 'string' &&
        (scriptValue.includes('|| exit 0') ||
         scriptValue.includes('|| true') ||
         scriptValue.match(/;\s*exit\s+0\s*$/))) {
      const newValue = removeExitZeroPattern(scriptValue);
      if (newValue !== scriptValue) {
        pkg.scripts[scriptName] = newValue;
        changes.push(`  ${scriptName}: "${scriptValue}" -> "${newValue}"`);
        modified = true;
      }
    }
  }

  if (modified) {
    // Preserve original formatting by using 2-space indent
    await writeFile(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  }

  return { modified, changes };
}

async function main() {
  console.log('🔧 Removing || exit 0 patterns from package.json files...\n');

  // Get all package.json paths
  const packagePaths = await getPackageJsonPaths(PACKAGES_DIR);
  const examplePaths = await getPackageJsonPaths(EXAMPLES_DIR);
  const allPaths = [...packagePaths, ...examplePaths];

  console.log(`Found ${packagePaths.length} packages and ${examplePaths.length} examples\n`);

  let totalModified = 0;
  let totalChanges = 0;

  for (const filePath of allPaths) {
    const { modified, changes } = await processPackageJson(filePath);

    if (modified) {
      const relativePath = filePath.replace(ROOT + '/', '').replace(ROOT + '\\', '');
      console.log(`✏️  ${relativePath}`);
      changes.forEach(change => console.log(change));
      console.log('');
      totalModified++;
      totalChanges += changes.length;
    }
  }

  console.log('─'.repeat(60));
  console.log(`\n✅ Modified ${totalModified} files with ${totalChanges} script changes`);
  console.log(`📦 Processed ${allPaths.length} package.json files total`);

  if (totalModified > 0) {
    console.log('\n⚠️  Next steps:');
    console.log('   1. Run: pnpm -r build');
    console.log('   2. Fix any newly-exposed build errors');
    console.log('   3. Run: pnpm -r test');
    console.log('   4. Fix any newly-exposed test failures');
  }
}

main().catch(console.error);
