#!/usr/bin/env node

/**
 * Build script for PhilJS VS Code Extension
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Building PhilJS VS Code Extension...\n');

// Clean dist directory
console.log('Cleaning dist directory...');
const distDir = path.join(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
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
if (!existsSync(extensionJs)) {
  console.error('Error: extension.js not found in dist directory');
  process.exit(1);
}

console.log('Build completed successfully!');
console.log('\nNext steps:');
console.log('  1. Test the extension: Press F5 in VS Code');
console.log('  2. Package: npm run package');
console.log('  3. Publish: npm run publish');
