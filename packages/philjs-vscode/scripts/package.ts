#!/usr/bin/env node

/**
 * Package script for PhilJS VS Code Extension
 */

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Packaging PhilJS VS Code Extension...\n');

// Build first
console.log('Building extension...');
try {
  execSync('tsx scripts/build.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.error('Build failed!');
  process.exit(1);
}

// Check for vsce
console.log('\nChecking for vsce...');
try {
  execSync('vsce --version', { stdio: 'pipe' });
} catch (error) {
  console.log('Installing @vscode/vsce...');
  execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
}

// Package extension
console.log('\nPackaging extension...');
try {
  execSync('vsce package', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\nPackage created successfully!');

  // Find the .vsix file
  const files = readdirSync(path.join(__dirname, '..'));
  const vsixFile = files.find(f => f.endsWith('.vsix'));

  if (vsixFile) {
    console.log(`\nPackage: ${vsixFile}`);
    console.log('\nTo install locally:');
    console.log(`  code --install-extension ${vsixFile}`);
  }
} catch (error) {
  console.error('Packaging failed!');
  process.exit(1);
}
