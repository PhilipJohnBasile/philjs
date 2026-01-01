#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve('.');
const packagesDir = path.join(repoRoot, 'packages');
const outPath = path.join(repoRoot, 'docs/philjs-book/src/packages/atlas.md');
const readmeMarkerStart = '<!-- API_SNAPSHOT_START -->';
const readmeMarkerEnd = '<!-- API_SNAPSHOT_END -->';
const guideMarkerStart = '<!-- PACKAGE_GUIDE_START -->';
const guideMarkerEnd = '<!-- PACKAGE_GUIDE_END -->';

const coverageLinks = new Map([
  ['@philjs/adapters', ['adapters/platforms.md']],
  ['@philjs/api', ['api/edge-middleware.md', 'api/sessions.md', 'api/session-migration.md']],
  ['@philjs/auth', ['auth/guide.md']],
  ['@philjs/db', ['database/migrations.md']],
  ['@philjs/islands', ['islands/quick-start.md', 'islands/multi-framework.md']],
  ['@philjs/router', ['router/advanced-features.md']],
  ['@philjs/cli', ['../tooling/cli.md']],
  ['@philjs/devtools', ['../tooling/devtools.md']],
  ['@philjs/ssr', ['../ssr/overview.md']],
  ['@philjs/core', ['../core/components.md', '../core/signals.md', '../core/effects-memos.md']]
]);

const packageInfos = collectPackages(packagesDir)
  .map((info) => {
    const apiSnapshot = buildApiSnapshot(info);
    const updatedReadme = updateReadme(info, apiSnapshot);
    return {
      ...info,
      apiSnapshot,
      readme: updatedReadme
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const nameByDir = new Map(packageInfos.map((info) => [info.dir, info.name]));

updateDocsPackageIndex(path.join(repoRoot, 'docs/README.md'), packageInfos);

const lines = [];
lines.push('# Package Atlas');
lines.push('');
lines.push('A complete catalog of every package in the PhilJS monorepo. Each entry is derived from the package manifests and source so the book stays aligned with the codebase.');
lines.push('');
lines.push('## How to read this catalog');
lines.push('');
lines.push('- Package names and versions come from `packages/*/package.json` or `packages/*/Cargo.toml`.');
lines.push('- Descriptions, keywords, and entry points mirror the manifests.');
lines.push('- Each package entry includes a generated API snapshot plus the package README content.');
lines.push('- Use the index below to jump directly to a package entry.');
lines.push('');
lines.push('## Package Index');
lines.push('');
for (const info of packageInfos) {
  const anchor = toAnchor(info.name);
  lines.push(`- [${info.name}](#${anchor})`);
}
lines.push('');
lines.push('## Package Entries');
lines.push('');
for (const info of packageInfos) {
  const anchor = toAnchor(info.name);
  lines.push(`<a id="${anchor}"></a>`);
  lines.push(`## ${info.name}`);
  lines.push(`- Type: ${info.kind === 'rust' ? 'Rust crate' : 'Node package'}`);
  lines.push(`- Purpose: ${info.description}`);
  lines.push(`- Version: ${info.version}`);
  lines.push(`- Location: packages/${info.dir}`);
  if (info.entryPoints.length > 0) {
    lines.push(`- Entry points: ${info.entryPoints.join(', ')}`);
  }
  if (info.keywords.length > 0) {
    lines.push(`- Keywords: ${info.keywords.join(', ')}`);
  }
  if (info.private) {
    lines.push('- Status: workspace-only (private package)');
  }
  if (info.kind === 'rust' && info.rustVersion) {
    lines.push(`- Rust version: ${info.rustVersion}`);
  }
  const coverage = coverageLinks.get(info.name);
  if (coverage && coverage.length > 0) {
    const links = coverage.map((href) => `[${href}](${href})`).join(', ');
    lines.push(`- Book coverage: ${links}`);
  }
  lines.push('');
  if (info.readme && info.readme.trim().length > 0) {
    lines.push(renderReadmeForBook(info.readme, info, nameByDir));
    lines.push('');
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

function collectPackages(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = entry.name;
      const packageDir = path.join(rootDir, dir);
      const packageJsonPath = path.join(packageDir, 'package.json');
      const cargoTomlPath = path.join(packageDir, 'Cargo.toml');
      const readmePath = path.join(packageDir, 'README.md');

      if (fs.existsSync(packageJsonPath)) {
        const data = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const entryPoints = extractEntryPoints(packageDir, data);
        return {
          dir,
          kind: 'node',
          name: data.name ?? dir,
          description: data.description ?? 'No description provided.',
          version: data.version ?? '0.0.0',
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          private: Boolean(data.private),
          entryPoints,
          readmePath,
          packageJson: data
        };
      }

      if (fs.existsSync(cargoTomlPath)) {
        const cargo = parseCargoToml(fs.readFileSync(cargoTomlPath, 'utf8'));
        return {
          dir,
          kind: 'rust',
          name: cargo.name ?? dir,
          description: cargo.description ?? 'No description provided.',
          version: cargo.version ?? '0.0.0',
          keywords: Array.isArray(cargo.keywords) ? cargo.keywords : [],
          private: cargo.publish === false,
          entryPoints: extractRustEntryPoints(packageDir),
          readmePath,
          rustVersion: cargo.rustVersion
        };
      }

      return null;
    })
    .filter(Boolean);
}

function updateDocsPackageIndex(readmePath, packageInfos) {
  if (!fs.existsSync(readmePath)) {
    return;
  }

  const markerStart = '<!-- PACKAGE_INDEX_START -->';
  const markerEnd = '<!-- PACKAGE_INDEX_END -->';
  let content = fs.readFileSync(readmePath, 'utf8');
  const startIndex = content.indexOf(markerStart);
  const endIndex = content.indexOf(markerEnd);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return;
  }

  const lines = packageInfos.map(
    (info) => `- [${info.name}](../packages/${info.dir}/README.md)`
  );
  const block = `\n${lines.join('\n')}\n`;
  content =
    content.slice(0, startIndex + markerStart.length) +
    block +
    content.slice(endIndex);
  fs.writeFileSync(readmePath, content, 'utf8');
}

function extractEntryPoints(packageDir, data) {
  const exportKeys = data && data.exports ? Object.keys(data.exports) : [];
  if (exportKeys.length === 0) {
    return [];
  }

  const entries = new Set();
  for (const key of exportKeys) {
    const source = resolveExportSource(packageDir, key);
    entries.add(source ?? key);
  }

  return Array.from(entries);
}

function resolveExportSource(packageDir, exportKey) {
  if (!exportKey || exportKey === '.') {
    return findFirstExisting(packageDir, [
      'src/index.ts',
      'src/index.tsx',
      'src/index.js',
      'src/index.mjs',
      'src/main.ts',
      'src/main.tsx',
      'src/main.js',
      'src/mod.ts'
    ]);
  }

  const cleaned = exportKey.replace(/^\.\//, '');
  return findFirstExisting(packageDir, [
    `src/${cleaned}.ts`,
    `src/${cleaned}.tsx`,
    `src/${cleaned}.js`,
    `src/${cleaned}/index.ts`,
    `src/${cleaned}/index.tsx`,
    `src/${cleaned}/index.js`
  ]);
}

function extractRustEntryPoints(packageDir) {
  const entry = findFirstExisting(packageDir, ['src/lib.rs', 'src/main.rs']);
  return entry ? [entry] : [];
}

function findFirstExisting(baseDir, candidates) {
  for (const candidate of candidates) {
    const absolute = path.join(baseDir, candidate);
    if (fs.existsSync(absolute)) {
      return toPosix(path.relative(repoRoot, absolute));
    }
  }
  return null;
}

function buildApiSnapshot(info) {
  if (info.kind === 'rust') {
    const entry = extractRustEntrySource(info);
    if (!entry) {
      return { entrySources: [], publicModules: [], publicItems: [], reexports: [] };
    }
    return extractRustApi(entry);
  }

  const entrySources = extractNodeEntrySources(info);
  return extractNodeApi(entrySources);
}

function extractNodeEntrySources(info) {
  const sources = new Set();
  const packageDir = path.join(packagesDir, info.dir);
  const primary = findFirstExisting(packageDir, [
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/index.mjs',
    'src/main.ts',
    'src/main.tsx',
    'src/main.js',
    'src/mod.ts'
  ]);
  if (primary) {
    sources.add(path.join(repoRoot, primary));
  }

  if (info.entryPoints) {
    for (const entry of info.entryPoints) {
      if (entry && entry.startsWith('packages/')) {
        sources.add(path.join(repoRoot, entry));
      }
    }
  }

  return Array.from(sources).filter((value) => fs.existsSync(value));
}

function extractNodeApi(entrySources) {
  const directExports = new Set();
  const reexportModules = new Set();
  const reexportNames = new Set();

  for (const source of entrySources) {
    const content = fs.readFileSync(source, 'utf8');
    const directRegex = /^\s*export\s+(?:async\s+)?(?:const|let|var|function|class|interface|type|enum|namespace)\s+([A-Za-z0-9_]+)/gm;
    for (const match of content.matchAll(directRegex)) {
      directExports.add(match[1]);
    }

    const exportListRegex = /^\s*export\s+(?:type\s+)?{\s*([^}]+)\s*}(?:\s*from\s*['"]([^'"]+)['"])?/gm;
    for (const match of content.matchAll(exportListRegex)) {
      const names = splitExportNames(match[1]);
      const fromModule = match[2];
      if (fromModule) {
        names.forEach((name) => reexportNames.add(name));
        reexportModules.add(fromModule);
      } else {
        names.forEach((name) => directExports.add(name));
      }
    }

    const exportAllRegex = /^\s*export\s+\*\s+from\s+['"]([^'"]+)['"]/gm;
    for (const match of content.matchAll(exportAllRegex)) {
      reexportModules.add(match[1]);
    }

    const exportAllAsRegex = /^\s*export\s+\*\s+as\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/gm;
    for (const match of content.matchAll(exportAllAsRegex)) {
      reexportNames.add(match[1]);
      reexportModules.add(match[2]);
    }
  }

  return {
    entrySources,
    directExports: Array.from(directExports).sort(),
    reexportNames: Array.from(reexportNames).sort(),
    reexportModules: Array.from(reexportModules).sort()
  };
}

function splitExportNames(list) {
  return list
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => name.replace(/^type\s+/, ''))
    .map((name) => {
      const parts = name.split(/\s+as\s+/);
      return (parts[1] ?? parts[0]).trim();
    });
}

function extractRustEntrySource(info) {
  const packageDir = path.join(packagesDir, info.dir);
  const entry = findFirstExisting(packageDir, ['src/lib.rs', 'src/main.rs']);
  return entry ? path.join(repoRoot, entry) : null;
}

function extractRustApi(entry) {
  const content = fs.readFileSync(entry, 'utf8');
  const publicModules = new Set();
  const publicItems = new Set();
  const reexports = new Set();

  const moduleRegex = /^\s*pub\s+mod\s+([A-Za-z0-9_]+)/gm;
  for (const match of content.matchAll(moduleRegex)) {
    publicModules.add(match[1]);
  }

  const reexportRegex = /^\s*pub\s+use\s+([^;]+);/gm;
  for (const match of content.matchAll(reexportRegex)) {
    reexports.add(match[1].trim());
  }

  const itemRegex = /^\s*pub\s+(?:async\s+)?(?:fn|struct|enum|trait|type|const|static)\s+([A-Za-z0-9_]+)/gm;
  for (const match of content.matchAll(itemRegex)) {
    publicItems.add(match[1]);
  }

  return {
    entrySources: [entry],
    publicModules: Array.from(publicModules).sort(),
    publicItems: Array.from(publicItems).sort(),
    reexports: Array.from(reexports).sort()
  };
}

function updateReadme(info, apiSnapshot) {
  const snapshotBlock = buildApiSnapshotBlock(info, apiSnapshot);
  const readmePath = info.readmePath;

  if (!fs.existsSync(readmePath)) {
    const stub = buildReadmeStub(info, snapshotBlock);
    fs.writeFileSync(readmePath, `${stub}\n`, 'utf8');
    return stub;
  }

  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = normalizeReadme(readme);
  readme = fillUsagePlaceholder(readme, info, apiSnapshot);
  readme = ensurePackageGuide(readme, info, apiSnapshot);

  if (readme.includes(readmeMarkerStart) && readme.includes(readmeMarkerEnd)) {
    const start = readme.indexOf(readmeMarkerStart) + readmeMarkerStart.length;
    const end = readme.indexOf(readmeMarkerEnd);
    readme =
      readme.slice(0, start) +
      '\n' +
      snapshotBlock +
      '\n' +
      readme.slice(end);
  } else {
    const apiMatch = readme.match(/^##\s+API\b/m);
    if (apiMatch && apiMatch.index !== undefined) {
      const apiIndex = apiMatch.index;
      const rest = readme.slice(apiIndex + apiMatch[0].length);
      const nextHeadingMatch = rest.match(/^##\s+/m);
      const endIndex = nextHeadingMatch && nextHeadingMatch.index !== undefined
        ? apiIndex + apiMatch[0].length + nextHeadingMatch.index
        : readme.length;
      readme =
        readme.slice(0, apiIndex) +
        `${readmeMarkerStart}\n${snapshotBlock}\n${readmeMarkerEnd}\n\n` +
        readme.slice(endIndex).trimStart();
    } else {
      const insertAt = readme.search(/^##\s+License\b/m);
      if (insertAt !== -1) {
        readme =
          readme.slice(0, insertAt) +
          `${readmeMarkerStart}\n${snapshotBlock}\n${readmeMarkerEnd}\n\n` +
          readme.slice(insertAt);
      } else {
        readme =
          readme.trimEnd() +
          `\n\n${readmeMarkerStart}\n${snapshotBlock}\n${readmeMarkerEnd}\n`;
      }
    }
  }

  readme = removePlaceholderApiSection(readme);

  fs.writeFileSync(readmePath, readme, 'utf8');
  return readme;
}

function buildReadmeStub(info, snapshotBlock) {
  const installLine =
    info.kind === 'rust'
      ? `cargo add ${info.name}`
      : `pnpm add ${info.name}`;
  return [
    `# ${info.name}`,
    '',
    info.description,
    '',
    '## Install',
    '',
    '```bash',
    installLine,
    '```',
    '',
    '## Usage',
    '',
    info.kind === 'rust'
      ? 'See the API snapshot below for the current public surface.'
      : `import { } from '${info.name}';`,
    '',
    readmeMarkerStart,
    snapshotBlock,
    readmeMarkerEnd,
    '',
    '## License',
    '',
    'MIT'
  ].join('\n');
}

function buildApiSnapshotBlock(info, snapshot) {
  const lines = [];
  lines.push('## API Snapshot');
  lines.push('');
  lines.push(
    'This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.'
  );
  lines.push('');
  lines.push('### Entry Points');

  if (info.kind === 'node') {
    const exportKeys = info.packageJson && info.packageJson.exports
      ? Object.keys(info.packageJson.exports)
      : [];
    lines.push(`- Export keys: ${formatList(exportKeys)}`);
  }

  const sourceList =
    snapshot.entrySources && snapshot.entrySources.length > 0
      ? snapshot.entrySources.map((source) => toPosix(path.relative(repoRoot, source)))
      : [];
  lines.push(`- Source files: ${formatList(sourceList)}`);

  lines.push('');
  lines.push('### Public API');

  if (info.kind === 'rust') {
    lines.push(`- Public modules: ${formatList(snapshot.publicModules)}`);
    lines.push(`- Public items: ${formatList(snapshot.publicItems)}`);
    lines.push(`- Re-exports: ${formatList(snapshot.reexports)}`);
  } else {
    lines.push(`- Direct exports: ${formatList(snapshot.directExports)}`);
    lines.push(`- Re-exported names: ${formatList(snapshot.reexportNames)}`);
    lines.push(`- Re-exported modules: ${formatList(snapshot.reexportModules)}`);
  }

  return lines.join('\n');
}

function formatList(values) {
  if (!values || values.length === 0) {
    return '(none detected)';
  }
  return values.join(', ');
}

function normalizeReadme(readme) {
  let normalized = readme.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\t/g, '  ');
  normalized = normalized
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  normalized = normalized.replace(/[^\x0A\x20-\x7E]/g, '');
  normalized = normalized.replace(/^`\s*([A-Za-z]+)\s*$/gm, (match, lang) => {
    return `\`\`\`${normalizeFenceLang(lang)}`;
  });
  normalized = normalized.replace(/^`\s*$/gm, '```');
  return normalized;
}

function normalizeFenceLang(lang) {
  const cleaned = String(lang).toLowerCase();
  if (cleaned === 'ash' || cleaned === 'sh' || cleaned === 'bash') {
    return 'bash';
  }
  if (cleaned === 's' || cleaned === 'ts' || cleaned === 'tsx') {
    return 'ts';
  }
  if (cleaned === 'js' || cleaned === 'jsx' || cleaned === 'javascript') {
    return 'js';
  }
  return cleaned || '';
}

function fillUsagePlaceholder(readme, info, apiSnapshot) {
  if (info.kind !== 'node') {
    return readme;
  }
  const candidates = Array.isArray(apiSnapshot.directExports) && apiSnapshot.directExports.length > 0
    ? apiSnapshot.directExports
    : apiSnapshot.reexportNames ?? [];
  if (!candidates || candidates.length === 0) {
    return readme;
  }
  const selection = candidates.slice(0, 3).join(', ');
  const importPattern = new RegExp(
    `import\\s*\\{\\s*\\}\\s*from\\s*['"]${escapeRegex(info.name)}['"];?`
  );
  return readme.replace(importPattern, `import { ${selection} } from '${info.name}';`);
}

function ensurePackageGuide(readme, info, apiSnapshot) {
  const guideBlock = buildPackageGuide(info, apiSnapshot);

  if (readme.includes(guideMarkerStart) && readme.includes(guideMarkerEnd)) {
    const start = readme.indexOf(guideMarkerStart) + guideMarkerStart.length;
    const end = readme.indexOf(guideMarkerEnd);
    return (
      readme.slice(0, start) +
      '\n' +
      guideBlock +
      '\n' +
      readme.slice(end)
    );
  }

  const snapshotIndex = readme.indexOf(readmeMarkerStart);
  const beforeSnapshot =
    snapshotIndex === -1 ? readme : readme.slice(0, snapshotIndex);
  const nonEmptyLines = beforeSnapshot
    .split('\n')
    .filter((line) => line.trim().length > 0).length;

  if (nonEmptyLines > 40) {
    return readme;
  }

  const insertIndex = readme.search(/^##\s+/m);
  if (insertIndex === -1) {
    return (
      readme.trimEnd() +
      `\n\n${guideMarkerStart}\n${guideBlock}\n${guideMarkerEnd}\n`
    );
  }

  return (
    readme.slice(0, insertIndex) +
    `${guideMarkerStart}\n${guideBlock}\n${guideMarkerEnd}\n\n` +
    readme.slice(insertIndex).trimStart()
  );
}

function buildPackageGuide(info, apiSnapshot) {
  const lines = [];
  const entryPoints = info.entryPoints ?? [];
  const exportList = info.kind === 'rust'
    ? apiSnapshot.publicItems ?? []
    : apiSnapshot.directExports ?? [];
  const reexportList = info.kind === 'rust'
    ? apiSnapshot.publicModules ?? []
    : apiSnapshot.reexportNames ?? [];
  const highlights = exportList.length > 0 ? exportList : reexportList;
  const topHighlights = highlights.slice(0, 12);

  lines.push('## Overview');
  lines.push('');
  lines.push(toAsciiText(info.description ?? 'No description provided.'));
  lines.push('');
  if (info.keywords && info.keywords.length > 0) {
    lines.push('## Focus Areas');
    lines.push('');
    lines.push(`- ${toAsciiText(info.keywords.join(', '))}`);
    lines.push('');
  }

  lines.push('## Entry Points');
  lines.push('');
  if (entryPoints.length > 0) {
    for (const entry of entryPoints) {
      lines.push(`- ${entry}`);
    }
  } else {
    lines.push('- (none detected)');
  }
  lines.push('');

  lines.push('## Quick Start');
  lines.push('');
  if (info.kind === 'rust') {
    lines.push('```toml');
    lines.push('[dependencies]');
    lines.push(`${info.name} = "${toAsciiText(info.version ?? '0.1.0')}"`);
    lines.push('```');
    lines.push('');
    if (topHighlights.length > 0) {
      lines.push('```rust');
      lines.push(`use ${info.name.replace(/-/g, '_')}::{${topHighlights.slice(0, 3).join(', ')}};`);
      lines.push('```');
      lines.push('');
    }
    lines.push('Use the exported items above as building blocks in your application.');
  } else {
    const importNames = topHighlights.slice(0, 3);
    lines.push('```ts');
    if (importNames.length > 0) {
      lines.push(`import { ${importNames.join(', ')} } from '${info.name}';`);
    } else {
      lines.push(`import * as ${toSafeNamespace(info.name)} from '${info.name}';`);
    }
    lines.push('```');
    lines.push('');
    lines.push('Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.');
  }
  lines.push('');

  lines.push('## Exports at a Glance');
  lines.push('');
  if (topHighlights.length > 0) {
    for (const entry of topHighlights) {
      lines.push(`- ${entry}`);
    }
  } else {
    lines.push('- (none detected)');
  }
  lines.push('');

  return lines.join('\n').trim();
}

function toSafeNamespace(name) {
  return name
    .replace(/^@/, '')
    .replace(/\//g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_');
}

function toAsciiText(value) {
  return String(value)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\x0A\x20-\x7E]/g, '');
}

function removePlaceholderApiSection(readme) {
  const markerIndex = readme.indexOf(readmeMarkerStart);
  if (markerIndex === -1) {
    return readme;
  }

  const beforeMarker = readme.slice(0, markerIndex);
  const apiMatch = beforeMarker.match(/^##\s+API\b/m);
  if (!apiMatch || apiMatch.index === undefined) {
    return readme;
  }

  const apiIndex = apiMatch.index;
  const afterApi = readme.slice(apiIndex + apiMatch[0].length);
  const nextHeading = afterApi.match(/^##\s+/m);
  const endIndex = nextHeading && nextHeading.index !== undefined
    ? apiIndex + apiMatch[0].length + nextHeading.index
    : markerIndex;
  const apiSection = readme.slice(apiIndex, endIndex);
  const placeholderPattern = /See docs\/README\.md and package source/i;
  if (!placeholderPattern.test(apiSection)) {
    return readme;
  }

  return (
    readme.slice(0, apiIndex).trimEnd() +
    '\n\n' +
    readme.slice(endIndex).trimStart()
  );
}

function renderReadmeForBook(readme, info, nameByDir) {
  const withoutMarkers = readme
    .replace(new RegExp(`^${escapeRegex(readmeMarkerStart)}\\s*$`, 'gm'), '')
    .replace(new RegExp(`^${escapeRegex(readmeMarkerEnd)}\\s*$`, 'gm'), '')
    .replace(new RegExp(`^${escapeRegex(guideMarkerStart)}\\s*$`, 'gm'), '')
    .replace(new RegExp(`^${escapeRegex(guideMarkerEnd)}\\s*$`, 'gm'), '');

  const definitions = new Map();
  const strippedLines = [];
  let inFence = false;
  for (const line of withoutMarkers.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      strippedLines.push(line);
      continue;
    }
    if (!inFence) {
      const defMatch = line.match(/^\s*\[([^\]]+)\]:\s*(\S+)\s*$/);
      if (defMatch) {
        definitions.set(defMatch[1].toLowerCase(), defMatch[2]);
        continue;
      }
    }
    strippedLines.push(line);
  }

  const processedLines = [];
  inFence = false;
  for (let line of strippedLines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      processedLines.push(line);
      continue;
    }

    if (!inFence) {
      line = line.replace(/!\[[^\]]*]\(([^)]+)\)/g, '');
      line = replaceReferenceLinks(line, definitions, info, nameByDir);
      line = rewriteInlineLinks(line, info, nameByDir);
      line = demoteHeading(line, 2);
      if (line.trim().length === 0) {
        processedLines.push('');
        continue;
      }
    }

    processedLines.push(line);
  }

  return processedLines.join('\n').trim();
}

function replaceReferenceLinks(line, definitions, info, nameByDir) {
  return line.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (match, text, id) => {
    const key = (id || text).toLowerCase();
    const url = definitions.get(key);
    if (!url) {
      return text;
    }
    return rewriteInlineLinks(`[${text}](${url})`, info, nameByDir);
  });
}

function rewriteInlineLinks(line, info, nameByDir) {
  return line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, rawUrl) => {
    const url = rawUrl.trim().replace(/^<|>$/g, '');
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:')
    ) {
      return `[${text}](${url})`;
    }

    if (url.startsWith('#')) {
      return `[${text}](${url})`;
    }

    const { pathPart, fragment } = splitFragment(url);
    const resolved = resolveRepoPath(info, pathPart);
    if (resolved && resolved.anchor) {
      return `[${text}](${resolved.anchor}${fragment})`;
    }
    if (resolved && resolved.bookPath) {
      return `[${text}](${resolved.bookPath}${fragment})`;
    }

    return text;
  });
}

function resolveRepoPath(info, urlPath) {
  if (!urlPath) {
    return null;
  }
  const packageDir = path.join(packagesDir, info.dir);
  const absolute = urlPath.startsWith('/')
    ? path.join(repoRoot, urlPath.slice(1))
    : path.resolve(packageDir, urlPath);

  if (!absolute.startsWith(packagesDir)) {
    const bookTarget = path.resolve(repoRoot, 'docs/philjs-book/src', urlPath);
    if (fs.existsSync(bookTarget)) {
      return {
        bookPath: toPosix(path.relative(path.dirname(outPath), bookTarget))
      };
    }
    return null;
  }

  const parts = path.relative(packagesDir, absolute).split(path.sep);
  const targetDir = parts[0];
  if (targetDir) {
    const packageName = nameByDir.get(targetDir);
    if (packageName) {
      return { anchor: `#${toAnchor(packageName)}` };
    }
  }
  return null;
}

function splitFragment(url) {
  const index = url.indexOf('#');
  if (index === -1) {
    return { pathPart: url, fragment: '' };
  }
  return {
    pathPart: url.slice(0, index),
    fragment: url.slice(index)
  };
}

function demoteHeading(line, offset) {
  const match = line.match(/^(#{1,6})\s+/);
  if (!match) {
    return line;
  }
  const level = match[1].length;
  const newLevel = Math.min(level + offset, 6);
  return `${'#'.repeat(newLevel)} ${line.slice(match[0].length)}`;
}

function parseCargoToml(content) {
  const result = {};
  let currentSection = '';
  for (const rawLine of content.split('\n')) {
    const line = rawLine.split('#')[0].trim();
    if (!line) {
      continue;
    }
    const sectionMatch = line.match(/^\[([^\]]+)]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }
    if (currentSection !== 'package') {
      continue;
    }
    const entryMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!entryMatch) {
      continue;
    }
    const key = entryMatch[1];
    const value = parseTomlValue(entryMatch[2]);
    result[key] = value;
  }
  return {
    name: result.name,
    version: result.version,
    description: result.description,
    keywords: result.keywords,
    rustVersion: result['rust-version'],
    publish: result.publish
  };
}

function parseTomlValue(raw) {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return inner
      .split(',')
      .map((item) => item.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAnchor(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `pkg-${cleaned}`;
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}
