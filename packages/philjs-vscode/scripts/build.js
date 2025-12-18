#!/usr/bin/env node

/**
 * Build script for PhilJS VS Code Extension
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building PhilJS VS Code Extension...\n');

// Clean dist directory
console.log('Cleaning dist directory...');
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Compile TypeScript
console.log('Compiling TypeScript...');
try {
  execSync('tsc -p ./', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('Compilation successful!\n');
} catch (error) {
  console.error('Compilation failed!');
  process.exit(1);
}

// Verify output
console.log('Verifying output...');
const extensionJs = path.join(distDir, 'extension.js');
if (!fs.existsSync(extensionJs)) {
  console.error('Error: extension.js not found in dist directory');
  process.exit(1);
}

console.log('Build completed successfully!');
console.log('\nNext steps:');
console.log('  1. Test the extension: Press F5 in VS Code');
console.log('  2. Package: npm run package');
console.log('  3. Publish: npm run publish');
