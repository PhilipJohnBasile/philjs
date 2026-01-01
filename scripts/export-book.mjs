#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve('docs/philjs-book');
const srcDir = path.join(root, 'src');
const visualsDir = path.join(root, 'visuals');
const summaryPath = path.join(srcDir, 'SUMMARY.md');
const outDir = path.join(root, 'dist');

const fail = (message) => {
  throw new Error(message);
};

if (!fs.existsSync(summaryPath)) {
  fail(`Missing SUMMARY.md at ${summaryPath}`);
}

const summary = fs.readFileSync(summaryPath, 'utf8');
const matches = [...summary.matchAll(/\(([^)]+\.md)\)/g)];
const relativePaths = matches.map((match) => match[1].replace(/^\.\//, ''));

if (relativePaths.length === 0) {
  fail('No markdown files found in SUMMARY.md.');
}

fs.mkdirSync(outDir, { recursive: true });

let tempRoot = null;

try {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'philjs-book-'));
  const tempSrc = path.join(tempRoot, 'src');
  const tempVisuals = path.join(tempRoot, 'visuals');
  const sandboxEnv = createSandboxEnv(tempRoot);

  fs.mkdirSync(tempSrc, { recursive: true });
  fs.cpSync(visualsDir, tempVisuals, { recursive: true });

  const epubCssPath = path.join(srcDir, 'epub.css');
  const tempEpubCss = path.join(tempSrc, 'epub.css');
  if (fs.existsSync(epubCssPath)) {
    fs.copyFileSync(epubCssPath, tempEpubCss);
  }

  const pdfCssPath = path.join(srcDir, 'pdf.css');
  const tempPdfCss = path.join(tempSrc, 'pdf.css');
  if (fs.existsSync(pdfCssPath)) {
    fs.copyFileSync(pdfCssPath, tempPdfCss);
  }

  const pngAvailable = ensurePngVisuals(tempVisuals, sandboxEnv);

  const tempFiles = relativePaths.map((relativePath) => {
    const sourceFile = path.join(srcDir, relativePath);
    const destFile = path.join(tempSrc, relativePath);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });

    let content = fs.readFileSync(sourceFile, 'utf8');
    content = content
      .replace(/\.\.\/\.\.\/visuals\//g, 'visuals/')
      .replace(/\.\.\/visuals\//g, 'visuals/');
    content = content.replace(/\(visuals\/([^)\\s]+?)\.svg\)/g, (match, name) => {
      return pngAvailable.has(name) ? `(visuals/${name}.png)` : match;
    });

    fs.writeFileSync(destFile, content, 'utf8');
    return destFile;
  });

  const resourcePath = [tempRoot, tempSrc, tempVisuals].join(path.delimiter);

  const coverPng = path.join(tempVisuals, 'cover.png');
  const coverJpg = path.join(tempVisuals, 'cover.jpg');
  const epubCover = fs.existsSync(coverPng)
    ? coverPng
    : (fs.existsSync(coverJpg) ? coverJpg : null);

  const pandoc = resolvePandoc();
  const pdfEngine = resolvePdfEngine();

  const commonArgs = [
    '--toc',
    '--toc-depth=3',
    '--metadata',
    'title=PhilJS Book',
    '--metadata',
    'author=PhilJS Team',
    '--resource-path',
    resourcePath
  ];

  console.log(`Building EPUB and PDF from ${srcDir} ...`);

  const epubArgs = [
    '-s',
    '-o',
    path.join(outDir, 'philjs-book.epub'),
    ...tempFiles,
    ...commonArgs,
    '--css',
    fs.existsSync(tempEpubCss) ? tempEpubCss : epubCssPath
  ];

  if (epubCover) {
    epubArgs.push('--epub-cover-image', epubCover);
  }

  const pdfArgs = [
    '-s',
    '-o',
    path.join(outDir, 'philjs-book.pdf'),
    ...tempFiles,
    ...commonArgs,
    '--css',
    fs.existsSync(tempEpubCss) ? tempEpubCss : epubCssPath,
    '--pdf-engine',
    pdfEngine.engine,
    ...pdfEngine.options.flatMap((option) => ['--pdf-engine-opt', option])
  ];

  if (fs.existsSync(tempPdfCss)) {
    pdfArgs.push('--css', tempPdfCss);
  }

  if (pdfEngine.engine.toLowerCase().includes('wkhtmltopdf')) {
    pdfArgs.push('--embed-resources');
  }

  runPandoc(pandoc, epubArgs, sandboxEnv, tempRoot);
  runPandoc(pandoc, pdfArgs, sandboxEnv, tempRoot);

  console.log(`Exports written to ${outDir}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = error && typeof error.code === 'number' ? error.code : 1;
} finally {
  if (tempRoot) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runPandoc(binary, args, env, cwd) {
  const result = spawnSync(binary, args, { stdio: 'inherit', env, cwd });
  if (result.error) {
    throw new Error(`Failed to run pandoc: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const error = new Error('Pandoc failed.');
    error.code = result.status ?? 1;
    throw error;
  }
}

function ensurePngVisuals(visualsPath, env) {
  const svgFiles = fs
    .readdirSync(visualsPath)
    .filter((file) => file.toLowerCase().endsWith('.svg'));
  const pngAvailable = new Set();
  const missing = [];

  for (const svgFile of svgFiles) {
    const baseName = path.basename(svgFile, '.svg');
    const pngPath = path.join(visualsPath, `${baseName}.png`);
    if (fs.existsSync(pngPath)) {
      pngAvailable.add(baseName);
    } else {
      missing.push({ svgFile, baseName, pngPath });
    }
  }

  if (missing.length === 0) {
    return pngAvailable;
  }

  const inkscape = resolveInkscape();
  if (!inkscape) {
    fail(
      'Inkscape not found. Install Inkscape or provide PNG versions for all SVG visuals.'
    );
  }

  for (const item of missing) {
    runInkscape(
      inkscape,
      path.join(visualsPath, item.svgFile),
      item.pngPath,
      env
    );
    if (fs.existsSync(item.pngPath)) {
      pngAvailable.add(item.baseName);
    }
  }

  return pngAvailable;
}

function runInkscape(binary, inputPath, outputPath, env) {
  const args = [
    inputPath,
    '--export-type=png',
    '--export-dpi=300',
    '--export-filename',
    outputPath
  ];
  const result = spawnSync(binary, args, { stdio: 'inherit', env });
  if (result.error) {
    throw new Error(`Failed to run inkscape: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const error = new Error('Inkscape failed.');
    error.code = result.status ?? 1;
    throw error;
  }
}

function createSandboxEnv(tempRoot) {
  const appData = path.join(tempRoot, 'appdata');
  const localAppData = path.join(tempRoot, 'localappdata');
  const miktexRoot = path.join(tempRoot, 'miktex');
  const env = {
    ...process.env,
    APPDATA: appData,
    LOCALAPPDATA: localAppData,
    HOME: tempRoot,
    USERPROFILE: tempRoot,
    XDG_CACHE_HOME: path.join(tempRoot, 'cache'),
    MIKTEX_USERCONFIG: path.join(miktexRoot, 'config'),
    MIKTEX_USERDATA: path.join(miktexRoot, 'data'),
    MIKTEX_USERINSTALL: path.join(miktexRoot, 'install')
  };

  const dirs = [
    appData,
    localAppData,
    env.XDG_CACHE_HOME,
    env.MIKTEX_USERCONFIG,
    env.MIKTEX_USERDATA,
    env.MIKTEX_USERINSTALL
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return env;
}

function resolvePandoc() {
  const envPath = process.env.PANDOC;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  if (isOnPath('pandoc')) {
    return 'pandoc';
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const candidates = [
      localAppData && path.join(localAppData, 'Pandoc', 'pandoc.exe'),
      'C:\\Program Files\\Pandoc\\pandoc.exe',
      'C:\\Program Files (x86)\\Pandoc\\pandoc.exe'
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  fail(
    'Pandoc not found. Install pandoc and ensure it is on PATH, or set PANDOC=/path/to/pandoc.'
  );
}

function resolveInkscape() {
  const envPath = process.env.INKSCAPE;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  if (isOnPath('inkscape')) {
    return 'inkscape';
  }

  if (process.platform === 'win32') {
    const candidate = 'C:\\Program Files\\Inkscape\\bin\\inkscape.exe';
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolvePdfEngine() {
  const envEngine = process.env.PDF_ENGINE;
  if (envEngine) {
    if (fs.existsSync(envEngine) || isOnPath(envEngine)) {
      return { engine: envEngine, options: [] };
    }
  }

  const wkhtmltopdf = resolveWkhtmltopdf();
  if (wkhtmltopdf) {
    return { engine: wkhtmltopdf, options: ['--enable-local-file-access'] };
  }

  if (isOnPath('weasyprint')) {
    return { engine: 'weasyprint', options: [] };
  }

  if (isOnPath('prince')) {
    return { engine: 'prince', options: [] };
  }

  if (isOnPath('pdflatex')) {
    return { engine: 'pdflatex', options: [] };
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const candidates = [
      localAppData &&
        path.join(
          localAppData,
          'Programs',
          'MiKTeX',
          'miktex',
          'bin',
          'x64',
          'pdflatex.exe'
        ),
      'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe'
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return { engine: candidate, options: [] };
      }
    }
  }

  fail(
    'No PDF engine found. Install wkhtmltopdf or MiKTeX/TeX Live, or set PDF_ENGINE=/path/to/engine.'
  );
}

function resolveWkhtmltopdf() {
  const envPath = process.env.WKHTMLTOPDF;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  if (isOnPath('wkhtmltopdf')) {
    return 'wkhtmltopdf';
  }

  if (process.platform === 'win32') {
    const candidate = 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe';
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isOnPath(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}
