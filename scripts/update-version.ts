#!/usr/bin/env node

/**
 * Script to update all package versions to a target version
 * Updates both version field and workspace dependencies
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const versionArg = args.find(arg => arg.startsWith('--version='));
const rootPackagePath = path.join(rootDir, 'package.json');
const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
const newVersion = versionArg ? versionArg.split('=')[1] : rootPackage.version;

// Find all package.json files in packages directory
const packagesDir = path.join(rootDir, 'packages');
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => path.join(packagesDir, dirent.name));

// Also include root package.json
const allPackagePaths = [
  path.join(rootDir, 'package.json'),
  ...packageDirs.map(dir => path.join(dir, 'package.json'))
];

console.log(`Updating ${allPackagePaths.length} package.json files to version ${newVersion}...\n`);

let updatedCount = 0;

for (const packagePath of allPackagePaths) {
  if (!existsSync(packagePath)) {
    continue;
  }

  const content = readFileSync(packagePath, 'utf-8');
  const pkg = JSON.parse(content);

  // Skip if private
  if (pkg.private) {
    console.log(`⏭️  Skipping private package: ${pkg.name || 'root'}`);
    continue;
  }

  // Update version
  const oldVersion = pkg.version;
  pkg.version = newVersion;

  // Update workspace dependencies
  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
  let depsUpdated = false;

  for (const depType of depTypes) {
    if (pkg[depType]) {
      for (const [depName, depVersion] of Object.entries(pkg[depType])) {
        if (depVersion === 'workspace:*' || depVersion.startsWith('workspace:')) {
          // Keep workspace protocol as is
          continue;
        }
        // Update version references to other philjs packages
        if (depName.startsWith('philjs-') || depName === 'create-philjs') {
          if (depVersion.startsWith('^') || depVersion.startsWith('~')) {
            const prefix = depVersion[0];
            pkg[depType][depName] = `${prefix}${newVersion}`;
            depsUpdated = true;
          } else if (depVersion.match(/^\d/)) {
            pkg[depType][depName] = `^${newVersion}`;
            depsUpdated = true;
          }
        }
      }
    }
  }

  // Write updated package.json
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`✅ Updated ${pkg.name || 'root'}: ${oldVersion} → ${newVersion}${depsUpdated ? ' (+ deps)' : ''}`);
  updatedCount++;
}

console.log(`\n✨ Successfully updated ${updatedCount} packages to version ${newVersion}`);
console.log('\nNext steps:');
console.log('  1. Run: pnpm install');
console.log('  2. Run: pnpm build');
console.log('  3. Run: pnpm test');
console.log('  4. Commit the changes');
