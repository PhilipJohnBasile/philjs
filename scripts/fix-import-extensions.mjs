/**
 * Script to fix missing .js extensions in TypeScript imports
 * Required for moduleResolution: nodenext
 *
 * Usage: node scripts/fix-import-extensions.mjs
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');

// Patterns to fix (relative imports without .js extension)
const importPatterns = [
  // export * from './foo'
  /export \* from '(\.\/[^']+)(?<!\.js)'/g,
  // export { x } from './foo'
  /export \{[^}]+\} from '(\.\/[^']+)(?<!\.js)'/g,
  // import * from './foo'
  /import \* from '(\.\/[^']+)(?<!\.js)'/g,
  // import { x } from './foo'
  /import \{[^}]+\} from '(\.\/[^']+)(?<!\.js)'/g,
  // import x from './foo'
  /import \w+ from '(\.\/[^']+)(?<!\.js)'/g,
];

async function findTsFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      await findTsFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixImportExtensions(content) {
  let modified = content;

  // Fix export * from './foo' -> export * from './foo.js'
  modified = modified.replace(
    /export \* from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, path) => {
      // Skip if already has .js or is a directory import
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `export * from '${path}.js'`;
    }
  );

  // Fix export { x } from './foo' -> export { x } from './foo.js'
  modified = modified.replace(
    /export \{([^}]+)\} from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, exports, path) => {
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `export {${exports}} from '${path}.js'`;
    }
  );

  // Fix import * as x from './foo' -> import * as x from './foo.js'
  modified = modified.replace(
    /import \* as (\w+) from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, name, path) => {
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `import * as ${name} from '${path}.js'`;
    }
  );

  // Fix import { x } from './foo' -> import { x } from './foo.js'
  modified = modified.replace(
    /import \{([^}]+)\} from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, imports, path) => {
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `import {${imports}} from '${path}.js'`;
    }
  );

  // Fix import x from './foo' -> import x from './foo.js'
  modified = modified.replace(
    /import (\w+) from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, name, path) => {
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `import ${name} from '${path}.js'`;
    }
  );

  // Fix import type { x } from './foo' -> import type { x } from './foo.js'
  modified = modified.replace(
    /import type \{([^}]+)\} from '(\.\.?\/[^']+)(?<!\.js)'/g,
    (match, imports, path) => {
      if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('.css')) {
        return match;
      }
      return `import type {${imports}} from '${path}.js'`;
    }
  );

  return modified;
}

async function processFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const fixed = fixImportExtensions(content);

  if (fixed !== content) {
    await writeFile(filePath, fixed, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log('🔧 Fixing missing .js extensions in imports...\n');

  const files = await findTsFiles(PACKAGES_DIR);
  console.log(`Found ${files.length} TypeScript files\n`);

  let fixed = 0;
  let skipped = 0;

  for (const filePath of files) {
    const wasFixed = await processFile(filePath);
    const relativePath = filePath.replace(ROOT + '/', '').replace(ROOT + '\\', '');

    if (wasFixed) {
      console.log(`✅ ${relativePath}`);
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n✅ Fixed ${fixed} files`);
  console.log(`⏭️  Skipped ${skipped} files (no changes needed)`);
  console.log(`📦 Processed ${files.length} files total`);
}

main().catch(console.error);
