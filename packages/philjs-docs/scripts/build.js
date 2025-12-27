#!/usr/bin/env node
/**
 * PhilJS Docs Static Site Generator
 * Pure TypeScript/JavaScript documentation builder
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const DOCS = path.join(SRC, 'docs');

/** HTML template for pages */
function template(content, meta = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'PhilJS Documentation'}</title>
  <meta name="description" content="${meta.description || 'PhilJS - The modern TypeScript framework'}">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <nav class="nav">
    <a href="/" class="logo">PhilJS</a>
    <div class="nav-links">
      <a href="/docs/getting-started">Getting Started</a>
      <a href="/docs/api">API Reference</a>
      <a href="/docs/examples">Examples</a>
      <a href="https://github.com/philjs/philjs" target="_blank">GitHub</a>
    </div>
  </nav>
  <main class="main">
    ${meta.sidebar ? '<aside class="sidebar" id="sidebar"></aside>' : ''}
    <article class="content">
      ${content}
    </article>
  </main>
  <footer class="footer">
    <p>PhilJS - Built with pure TypeScript</p>
  </footer>
  <script type="module" src="/scripts/main.js"></script>
</body>
</html>`;
}

/** Process markdown files */
async function processMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data, content: markdown } = matter(content);
  const html = await marked(markdown);
  return { meta: data, html };
}

/** Copy static assets */
async function copyAssets() {
  const assetsDir = path.join(SRC, 'assets');
  const distAssets = path.join(DIST, 'assets');

  try {
    await fs.cp(assetsDir, distAssets, { recursive: true });
    console.log('✓ Copied assets');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/** Build styles */
async function buildStyles() {
  const stylesDir = path.join(SRC, 'styles');
  const distStyles = path.join(DIST, 'styles');

  await fs.mkdir(distStyles, { recursive: true });

  try {
    const files = await fs.readdir(stylesDir);
    for (const file of files) {
      if (file.endsWith('.css')) {
        await fs.copyFile(
          path.join(stylesDir, file),
          path.join(distStyles, file)
        );
      }
    }
    console.log('✓ Built styles');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      // Create default styles if none exist
      await fs.writeFile(path.join(distStyles, 'main.css'), getDefaultStyles());
      console.log('✓ Created default styles');
    }
  }
}

/** Build scripts */
async function buildScripts() {
  const scriptsDir = path.join(SRC, 'scripts');
  const distScripts = path.join(DIST, 'scripts');

  await fs.mkdir(distScripts, { recursive: true });

  try {
    const files = await fs.readdir(scriptsDir);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const content = await fs.readFile(path.join(scriptsDir, file), 'utf-8');
        await fs.writeFile(
          path.join(distScripts, file.replace('.ts', '.js')),
          content
        );
      }
    }
    console.log('✓ Built scripts');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // Create default script
    await fs.writeFile(path.join(distScripts, 'main.js'), '// PhilJS Docs');
  }
}

/** Recursively find markdown files */
async function findMarkdownFiles(dir) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  return files;
}

/** Build documentation pages */
async function buildDocs() {
  const files = await findMarkdownFiles(DOCS);

  for (const file of files) {
    const relativePath = path.relative(DOCS, file);
    const { meta, html } = await processMarkdown(file);

    const outputPath = path.join(
      DIST,
      'docs',
      relativePath.replace('.md', '.html')
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, template(html, { ...meta, sidebar: true }));
  }

  console.log(`✓ Built ${files.length} documentation pages`);
}

/** Build index page */
async function buildIndex() {
  const indexPath = path.join(SRC, 'index.md');

  try {
    const { meta, html } = await processMarkdown(indexPath);
    await fs.writeFile(path.join(DIST, 'index.html'), template(html, meta));
    console.log('✓ Built index page');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create default index
      const defaultHtml = '<h1>PhilJS</h1><p>The modern TypeScript framework</p>';
      await fs.writeFile(path.join(DIST, 'index.html'), template(defaultHtml));
      console.log('✓ Created default index page');
    } else {
      throw err;
    }
  }
}

/** Default styles */
function getDefaultStyles() {
  return `
:root {
  --bg: #0a0a0a;
  --fg: #fafafa;
  --accent: #3b82f6;
  --muted: #71717a;
  --border: #27272a;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
}

.logo {
  font-weight: bold;
  font-size: 1.25rem;
  color: var(--fg);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: var(--muted);
  text-decoration: none;
}

.nav-links a:hover {
  color: var(--fg);
}

.main {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  max-width: 800px;
}

.content h1 { font-size: 2.5rem; margin-bottom: 1rem; }
.content h2 { font-size: 1.75rem; margin: 2rem 0 1rem; }
.content h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; }
.content p { margin-bottom: 1rem; }
.content code {
  background: var(--border);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875em;
}
.content pre {
  background: var(--border);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}
.content pre code {
  background: none;
  padding: 0;
}
.content a {
  color: var(--accent);
}

.footer {
  border-top: 1px solid var(--border);
  padding: 2rem;
  text-align: center;
  color: var(--muted);
}
`;
}

/** Main build function */
async function build() {
  console.log('Building PhilJS Documentation...\n');

  // Clean dist
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  // Build all parts
  await Promise.all([
    copyAssets(),
    buildStyles(),
    buildScripts(),
  ]);

  await buildDocs();
  await buildIndex();

  console.log('\n✓ Build complete!');
}

build().catch(console.error);
