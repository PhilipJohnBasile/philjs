#!/usr/bin/env node

/**
 * Script to verify NPM configurations in all packages
 * Checks: version, exports, files, scripts, keywords, license
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => path.join(packagesDir, dirent.name));

const issues = [];
const warnings = [];
let packagesChecked = 0;

console.log('🔍 Verifying NPM configurations...\n');

for (const packageDir of packageDirs) {
  const packageJsonPath = path.join(packageDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const pkgName = pkg.name;

  if (pkg.private) {
    console.log(`⏭️  Skipping private package: ${pkgName}`);
    continue;
  }

  packagesChecked++;
  console.log(`\n📦 Checking ${pkgName}...`);

  // Check version
  if (!pkg.version) {
    issues.push(`${pkgName}: Missing version field`);
  } else if (pkg.version !== '2.0.0') {
    issues.push(`${pkgName}: Version is ${pkg.version}, expected 2.0.0`);
  } else {
    console.log(`  ✓ Version: ${pkg.version}`);
  }

  // Check description
  if (!pkg.description) {
    warnings.push(`${pkgName}: Missing description`);
  } else {
    console.log(`  ✓ Description: "${pkg.description.substring(0, 50)}..."`);
  }

  // Check type module
  if (pkg.type !== 'module') {
    warnings.push(`${pkgName}: Should be type: "module"`);
  } else {
    console.log(`  ✓ Type: module`);
  }

  // Check exports
  if (!pkg.exports) {
    issues.push(`${pkgName}: Missing exports field`);
  } else {
    const exportCount = Object.keys(pkg.exports).length;
    console.log(`  ✓ Exports: ${exportCount} entry point(s)`);
  }

  // Check files array
  if (!pkg.files || pkg.files.length === 0) {
    issues.push(`${pkgName}: Missing or empty files array`);
  } else {
    console.log(`  ✓ Files: ${pkg.files.join(', ')}`);
  }

  // Check build script
  if (!pkg.scripts || !pkg.scripts.build) {
    warnings.push(`${pkgName}: Missing build script`);
  } else {
    console.log(`  ✓ Build script: ${pkg.scripts.build}`);
  }

  // Check test script
  if (!pkg.scripts || !pkg.scripts.test) {
    warnings.push(`${pkgName}: Missing test script`);
  } else {
    console.log(`  ✓ Test script: ${pkg.scripts.test}`);
  }

  // Check keywords (good for NPM discoverability)
  if (!pkg.keywords || pkg.keywords.length === 0) {
    warnings.push(`${pkgName}: Missing keywords for NPM discoverability`);
  } else {
    console.log(`  ✓ Keywords: ${pkg.keywords.length} keyword(s)`);
  }

  // Check license
  if (!pkg.license) {
    warnings.push(`${pkgName}: Missing license field`);
  } else {
    console.log(`  ✓ License: ${pkg.license}`);
  }

  // Check sideEffects
  if (pkg.sideEffects === undefined) {
    warnings.push(`${pkgName}: Missing sideEffects field (tree-shaking)`);
  } else {
    console.log(`  ✓ Side effects: ${pkg.sideEffects}`);
  }

  // Check main/types fields for backwards compatibility
  if (!pkg.main) {
    warnings.push(`${pkgName}: Missing main field (backwards compat)`);
  }
  if (!pkg.types) {
    warnings.push(`${pkgName}: Missing types field`);
  }

  // Check repository
  if (!pkg.repository) {
    warnings.push(`${pkgName}: Missing repository field`);
  }

  // Check author
  if (!pkg.author) {
    warnings.push(`${pkgName}: Missing author field`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Summary:`);
console.log(`   Packages checked: ${packagesChecked}`);
console.log(`   Issues found: ${issues.length}`);
console.log(`   Warnings: ${warnings.length}\n`);

if (issues.length > 0) {
  console.log('❌ Critical Issues (must fix before publishing):');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings (should fix for best practices):');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('');
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All packages are properly configured for NPM publishing!\n');
  process.exit(0);
} else if (issues.length === 0) {
  console.log('✅ No critical issues found. Packages can be published.\n');
  console.log('💡 Consider addressing warnings for better NPM presence.\n');
  process.exit(0);
} else {
  console.log('❌ Please fix critical issues before publishing.\n');
  process.exit(1);
}
