#!/usr/bin/env node

/**
 * Script to add missing NPM metadata to all packages
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

const defaultMetadata = {
  license: 'MIT',
  author: 'PhilJS Team',
  repository: {
    type: 'git',
    url: 'https://github.com/yourusername/philjs.git'
  },
  bugs: {
    url: 'https://github.com/yourusername/philjs/issues'
  },
  homepage: 'https://github.com/yourusername/philjs#readme'
};

console.log('Adding missing NPM metadata to packages...\n');

let updated = 0;

for (const packageDir of packageDirs) {
  const packageJsonPath = path.join(packageDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (pkg.private) {
    console.log(`⏭️  Skipping private package: ${pkg.name}`);
    continue;
  }

  let changed = false;
  const changes = [];

  // Add missing fields
  if (!pkg.license) {
    pkg.license = defaultMetadata.license;
    changed = true;
    changes.push('license');
  }

  if (!pkg.author) {
    pkg.author = defaultMetadata.author;
    changed = true;
    changes.push('author');
  }

  if (!pkg.repository) {
    pkg.repository = {
      ...defaultMetadata.repository,
      directory: `packages/${path.basename(packageDir)}`
    };
    changed = true;
    changes.push('repository');
  }

  if (!pkg.bugs) {
    pkg.bugs = defaultMetadata.bugs;
    changed = true;
    changes.push('bugs');
  }

  if (!pkg.homepage) {
    pkg.homepage = defaultMetadata.homepage;
    changed = true;
    changes.push('homepage');
  }

  // Add keywords if missing and name suggests category
  if (!pkg.keywords || pkg.keywords.length === 0) {
    const keywords = ['philjs'];
    const name = pkg.name.toLowerCase();

    if (name.includes('router')) keywords.push('routing', 'navigation');
    if (name.includes('ssr')) keywords.push('server-side-rendering', 'streaming');
    if (name.includes('compiler')) keywords.push('optimization', 'compiler');
    if (name.includes('devtools')) keywords.push('developer-tools', 'debugging');
    if (name.includes('testing')) keywords.push('testing', 'vitest');
    if (name.includes('islands')) keywords.push('islands-architecture', 'hydration');
    if (name.includes('core')) keywords.push('signals', 'reactivity', 'framework');

    if (keywords.length > 1) {
      pkg.keywords = keywords;
      changed = true;
      changes.push('keywords');
    }
  }

  if (changed) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Updated ${pkg.name}: ${changes.join(', ')}`);
    updated++;
  } else {
    console.log(`✓ ${pkg.name} already has all metadata`);
  }
}

console.log(`\n✨ Updated ${updated} packages with missing metadata`);
