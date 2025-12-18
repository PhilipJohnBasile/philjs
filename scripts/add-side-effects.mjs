#!/usr/bin/env node
/**
 * Add or update "sideEffects" field in all package.json files
 * This enables better tree-shaking in bundlers
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Packages that have side effects (CSS imports, global polyfills, etc.)
const packagesWithSideEffects = {
  'philjs-styles': ['**/*.css'],
  'philjs-ui': ['**/*.css'],
  'philjs-tailwind': ['**/*.css'],
  'philjs-devtools-extension': true, // Browser extension has side effects
  'philjs-cli': true, // CLI has global side effects
};

function findPackageJsonFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip node_modules and hidden directories
    if (entry === 'node_modules' || entry.startsWith('.')) {
      continue;
    }

    try {
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findPackageJsonFiles(fullPath, files);
      } else if (entry === 'package.json' && !fullPath.includes('node_modules')) {
        files.push(fullPath);
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  return files;
}

function updatePackageJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    // Skip if not a PhilJS package
    if (!pkg.name || !pkg.name.includes('philjs')) {
      return { updated: false, reason: 'not a PhilJS package' };
    }

    // Check if package has specific side effects configuration
    const packageName = pkg.name;
    let sideEffects = false;

    if (packagesWithSideEffects[packageName]) {
      sideEffects = packagesWithSideEffects[packageName];
    }

    // Check if sideEffects field needs updating
    if (pkg.sideEffects === sideEffects) {
      return { updated: false, reason: 'already correct' };
    }

    // Update sideEffects field
    pkg.sideEffects = sideEffects;

    // Write back to file with same formatting
    const updatedContent = JSON.stringify(pkg, null, 2) + '\n';
    writeFileSync(filePath, updatedContent, 'utf-8');

    return {
      updated: true,
      packageName,
      sideEffects,
    };
  } catch (error) {
    return {
      updated: false,
      error: error.message,
    };
  }
}

function main() {
  console.log('Updating package.json files with sideEffects field...\n');

  const packagesDir = join(projectRoot, 'packages');
  const packageJsonFiles = findPackageJsonFiles(packagesDir);

  console.log(`Found ${packageJsonFiles.length} package.json files\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const filePath of packageJsonFiles) {
    const result = updatePackageJson(filePath);

    if (result.updated) {
      updatedCount++;
      const sideEffectsValue = Array.isArray(result.sideEffects)
        ? `[${result.sideEffects.join(', ')}]`
        : result.sideEffects;
      console.log(`✓ Updated ${result.packageName}: sideEffects = ${sideEffectsValue}`);
    } else if (result.error) {
      errorCount++;
      console.log(`✗ Error updating ${filePath}: ${result.error}`);
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${packageJsonFiles.length} packages`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (updatedCount > 0) {
    console.log('\n✓ All packages now have proper sideEffects configuration');
  }
}

main();
