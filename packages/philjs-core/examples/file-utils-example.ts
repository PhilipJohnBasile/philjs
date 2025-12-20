/**
 * @fileoverview Examples for file utilities
 */

import {
  readFile,
  writeFile,
  copyFile,
  readDir,
  matchFiles,
  readJSON,
  writeJSON,
  watchFile,
  watchDir,
  fileExists,
  dirExists,
  clearCaches,
  getCacheStats,
} from '../src/file-utils';

// ============================================
// Example 1: Reading Files with Caching
// ============================================

// Read file (cached by default)
const content1 = await readFile('./src/config.json');
console.log('Content:', content1);

// Second read will use cache
const content2 = await readFile('./src/config.json');
console.log('From cache:', content2);

// Disable cache for specific read
const content3 = await readFile('./src/config.json', { cache: false });

// Custom cache TTL (5 seconds)
const content4 = await readFile('./src/config.json', { cacheTTL: 5000 });

// ============================================
// Example 2: Writing Files
// ============================================

// Simple write
await writeFile('./output/result.txt', 'Hello, World!');

// Write with directory creation
await writeFile('./deeply/nested/path/file.txt', 'Content', {
  createDir: true,
});

// Write without cache invalidation
await writeFile('./temp/data.txt', 'Data', {
  invalidateCache: false,
});

// ============================================
// Example 3: JSON Operations
// ============================================

// Read JSON
interface Config {
  name: string;
  version: string;
  features: string[];
}

const config = await readJSON<Config>('./package.json');
console.log('Package name:', config.name);

// Write JSON
await writeJSON('./output/config.json', {
  name: 'my-app',
  version: '1.0.0',
  features: ['routing', 'ssr'],
}, {
  indent: 2,
  createDir: true,
});

// ============================================
// Example 4: Directory Operations
// ============================================

// Read directory
const files = await readDir('./src');
console.log('Files:', files);

// Read directory with pattern
const tsFiles = await readDir('./src', {
  pattern: '*.ts',
});
console.log('TypeScript files:', tsFiles);

// Recursive directory read
const allFiles = await readDir('./src', {
  recursive: true,
  pattern: /\.(ts|tsx)$/,
});
console.log('All TS files:', allFiles);

// Full paths
const fullPaths = await readDir('./src', {
  recursive: true,
  fullPaths: true,
});
console.log('Full paths:', fullPaths);

// ============================================
// Example 5: Pattern Matching (Glob)
// ============================================

// Match files with glob patterns
const components = await matchFiles('./src', '**/*.tsx');
console.log('Components:', components);

// Multiple patterns
const sourceFiles = await matchFiles('./src', [
  '**/*.ts',
  '**/*.tsx',
  '!**/*.test.*',
]);
console.log('Source files:', sourceFiles);

// ============================================
// Example 6: File Watching
// ============================================

// Watch single file
const stopWatching = watchFile('./src/config.json', (path) => {
  console.log('Config changed:', path);
  // Reload configuration
  readJSON(path).then(config => {
    console.log('New config:', config);
  });
});

// Stop watching after 10 seconds
setTimeout(() => {
  stopWatching();
  console.log('Stopped watching');
}, 10000);

// Watch directory
const stopWatchingDir = watchDir('./src', (path, event) => {
  console.log(`File ${event}:`, path);

  // Handle different events
  if (event === 'change') {
    console.log('File modified:', path);
  } else if (event === 'rename') {
    console.log('File renamed:', path);
  }
}, {
  debounce: 300, // Debounce for 300ms
});

// ============================================
// Example 7: Build-Time File Processing
// ============================================

// Process all markdown files
async function processMarkdownFiles() {
  const mdFiles = await matchFiles('./content', '**/*.md');

  for (const file of mdFiles) {
    const content = await readFile(`./content/${file}`);
    const processed = content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      // Replace template variables
      return process.env[key] || '';
    });

    await writeFile(`./dist/content/${file}`, processed, {
      createDir: true,
    });
  }
}

await processMarkdownFiles();

// ============================================
// Example 8: Copy Files with Processing
// ============================================

// Copy static assets
async function copyAssets() {
  const assets = await matchFiles('./src/assets', '**/*');

  for (const asset of assets) {
    await copyFile(
      `./src/assets/${asset}`,
      `./dist/assets/${asset}`,
      { createDir: true }
    );
  }
}

await copyAssets();

// ============================================
// Example 9: File Existence Checks
// ============================================

// Check if file exists
if (await fileExists('./src/config.json')) {
  const config = await readJSON('./src/config.json');
  console.log('Config loaded:', config);
} else {
  console.log('Config not found, using defaults');
}

// Check if directory exists
if (await dirExists('./dist')) {
  console.log('Dist directory exists');
} else {
  await createDir('./dist');
  console.log('Created dist directory');
}

// ============================================
// Example 10: Cache Management
// ============================================

// Get cache statistics
const stats = getCacheStats();
console.log('Cache stats:', stats);
/*
{
  readCache: { size: 5, ttl: 60000 },
  statCache: { size: 10, ttl: 60000 },
  patternCache: { size: 2, ttl: 60000 }
}
*/

// Clear all caches
clearCaches();
console.log('Caches cleared');

// ============================================
// Example 11: Content Generation
// ============================================

// Generate index file from components
async function generateComponentIndex() {
  const components = await matchFiles('./src/components', '*.tsx');

  const imports = components.map((file, i) => {
    const name = file.replace('.tsx', '');
    return `import ${name} from './${file}';`;
  });

  const exports = components.map(file => {
    const name = file.replace('.tsx', '');
    return `  ${name},`;
  });

  const indexContent = `${imports.join('\n')}

export {
${exports.join('\n')}
};
`;

  await writeFile('./src/components/index.ts', indexContent);
}

await generateComponentIndex();

// ============================================
// Example 12: Route Generation from Files
// ============================================

// Generate routes from file structure
async function generateRoutes() {
  const pages = await matchFiles('./src/pages', '**/*.tsx');

  const routes = pages.map(file => {
    const path = file
      .replace('.tsx', '')
      .replace(/\[([^\]]+)\]/g, ':$1')
      .replace(/\/index$/, '');

    return {
      path: `/${path}`,
      component: file.replace('.tsx', ''),
    };
  });

  await writeJSON('./src/routes.json', routes, { indent: 2 });
}

await generateRoutes();

// ============================================
// Example 13: Template Processing
// ============================================

// Process HTML templates
async function processTemplates() {
  const templates = await matchFiles('./templates', '*.html');

  for (const template of templates) {
    const content = await readFile(`./templates/${template}`);

    // Replace variables
    const processed = content
      .replace(/\{\{title\}\}/g, 'My App')
      .replace(/\{\{description\}\}/g, 'A PhilJS application')
      .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());

    const outputName = template.replace('.html', '.processed.html');
    await writeFile(`./dist/${outputName}`, processed, {
      createDir: true,
    });
  }
}

await processTemplates();

// ============================================
// Example 14: Documentation Generation
// ============================================

// Generate API docs from TypeScript files
async function generateDocs() {
  const sourceFiles = await matchFiles('./src', '**/*.ts');

  const docs = [];

  for (const file of sourceFiles) {
    const content = await readFile(`./src/${file}`);

    // Extract JSDoc comments
    const docComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];

    docs.push({
      file,
      comments: docComments.map(comment => {
        return comment
          .replace(/^\/\*\*|\*\/$/g, '')
          .replace(/^\s*\* ?/gm, '')
          .trim();
      }),
    });
  }

  await writeJSON('./docs/api.json', docs, { indent: 2 });
}

await generateDocs();

// ============================================
// Example 15: File-Based Configuration
// ============================================

// Load configuration from multiple files
async function loadConfig() {
  const configFiles = await matchFiles('./config', '*.json');

  const config = {};

  for (const file of configFiles) {
    const name = file.replace('.json', '');
    const data = await readJSON(`./config/${file}`);
    config[name] = data;
  }

  return config;
}

const appConfig = await loadConfig();
console.log('Loaded config:', appConfig);
/*
{
  database: { host: 'localhost', port: 5432 },
  cache: { ttl: 3600, max: 1000 },
  logging: { level: 'info', format: 'json' }
}
*/

// ============================================
// Example 16: Hot Reloading Development Server
// ============================================

// Development server with hot reloading
async function startDevServer() {
  console.log('Starting dev server...');

  // Watch source files
  const stopWatching = watchDir('./src', async (path, event) => {
    console.log(`File ${event}: ${path}`);

    // Clear caches to get fresh content
    clearCaches();

    // Rebuild affected modules
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      console.log('Rebuilding:', path);
      // Trigger rebuild
    }
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    stopWatching();
    process.exit();
  });
}

// Uncomment to run:
// await startDevServer();

// ============================================
// Example 17: Static Site Generation
// ============================================

// Generate static HTML from templates
async function generateStaticSite() {
  // Read template
  const template = await readFile('./templates/page.html');

  // Get all pages
  const pages = await readJSON('./content/pages.json');

  for (const page of pages) {
    // Process template
    const html = template
      .replace(/\{\{title\}\}/g, page.title)
      .replace(/\{\{content\}\}/g, page.content)
      .replace(/\{\{description\}\}/g, page.description);

    // Write output
    await writeFile(`./dist/${page.slug}.html`, html, {
      createDir: true,
    });

    console.log(`Generated: ${page.slug}.html`);
  }
}

await generateStaticSite();

// ============================================
// Example 18: Asset Optimization
// ============================================

// Optimize images (simplified example)
async function optimizeAssets() {
  const images = await matchFiles('./assets/images', '**/*.{jpg,png}');

  for (const image of images) {
    const originalPath = `./assets/images/${image}`;
    const optimizedPath = `./dist/images/${image}`;

    // In real implementation, use sharp or similar
    await copyFile(originalPath, optimizedPath, {
      createDir: true,
    });

    console.log(`Optimized: ${image}`);
  }
}

await optimizeAssets();
