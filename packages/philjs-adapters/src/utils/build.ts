/**
 * PhilJS Adapters - Build Utilities
 *
 * Provides utilities for building and deploying PhilJS applications:
 * - Output directory structure management
 * - Asset optimization
 * - Manifest generation
 * - Static file handling
 *
 * @module philjs-adapters/utils/build
 */

import { writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, extname, relative, basename, dirname } from 'path';
import { createHash } from 'crypto';

/**
 * MIME types for static file serving
 */
export const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.ts': 'text/typescript',
  '.tsx': 'text/tsx',
};

/**
 * Build manifest interface
 */
export interface BuildManifest {
  /** Adapter name */
  adapter: string;
  /** Build timestamp */
  timestamp: string;
  /** Build version */
  version: string;
  /** Output directory */
  outputDir: string;
  /** Routes */
  routes: RouteManifestEntry[];
  /** Static assets */
  assets: AssetManifestEntry[];
  /** Prerendered pages */
  prerendered: string[];
  /** Environment */
  environment: 'development' | 'production';
  /** Build metadata */
  metadata: Record<string, unknown>;
}

/**
 * Route manifest entry
 */
export interface RouteManifestEntry {
  /** Route pattern */
  pattern: string;
  /** Handler file */
  handler: string;
  /** HTTP methods */
  methods: string[];
  /** Is prerendered */
  prerender: boolean;
  /** Route parameters */
  params: string[];
}

/**
 * Asset manifest entry
 */
export interface AssetManifestEntry {
  /** Original path */
  src: string;
  /** Output path */
  dest: string;
  /** Content hash */
  hash: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Is immutable (can be cached forever) */
  immutable: boolean;
}

/**
 * Build manifest options
 */
export interface BuildManifestOptions {
  /** Adapter name */
  adapter: string;
  /** Output directory */
  outputDir: string;
  /** Routes */
  routes: RouteManifestEntry[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create a build manifest
 *
 * @example
 * ```typescript
 * const manifest = await createBuildManifest({
 *   adapter: 'vercel',
 *   outputDir: '.vercel/output',
 *   routes: [...],
 * });
 * ```
 */
export async function createBuildManifest(
  options: BuildManifestOptions
): Promise<BuildManifest> {
  const { adapter, outputDir, routes, metadata = {} } = options;

  // Collect assets
  const assets = await collectAssets(outputDir);

  // Find prerendered pages
  const prerendered = await findPrerenderedPages(outputDir);

  return {
    adapter,
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    outputDir,
    routes,
    assets,
    prerendered,
    environment: process.env['NODE_ENV'] === 'production' ? 'production' : 'development',
    metadata,
  };
}

/**
 * Collect all assets in a directory
 */
async function collectAssets(dir: string): Promise<AssetManifestEntry[]> {
  const assets: AssetManifestEntry[] = [];

  if (!existsSync(dir)) {
    return assets;
  }

  const staticDirs = ['static', 'public', 'assets'];

  for (const staticDir of staticDirs) {
    const fullPath = join(dir, staticDir);
    if (existsSync(fullPath)) {
      const files = walkDirectory(fullPath);
      for (const file of files) {
        const relativePath = relative(fullPath, file);
        const ext = extname(file);
        const content = readFileSync(file);
        const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);

        assets.push({
          src: relativePath,
          dest: join(staticDir, relativePath),
          hash,
          size: content.length,
          type: MIME_TYPES[ext] || 'application/octet-stream',
          immutable: /\.[a-f0-9]{8,}\./.test(file) || relativePath.includes('/immutable/'),
        });
      }
    }
  }

  return assets;
}

/**
 * Find all prerendered pages
 */
async function findPrerenderedPages(dir: string): Promise<string[]> {
  const prerendered: string[] = [];
  const prerenderedDir = join(dir, 'prerendered');

  if (!existsSync(prerenderedDir)) {
    // Check alternative locations
    const altDirs = ['.philjs/prerendered', 'static'];
    for (const altDir of altDirs) {
      const fullPath = join(dir, altDir);
      if (existsSync(fullPath)) {
        const htmlFiles = walkDirectory(fullPath).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
          const route = '/' + relative(fullPath, file).replace(/\.html$/, '').replace(/\/index$/, '');
          prerendered.push(route === '' ? '/' : route);
        }
      }
    }
  } else {
    const htmlFiles = walkDirectory(prerenderedDir).filter(f => f.endsWith('.html'));
    for (const file of htmlFiles) {
      const route = '/' + relative(prerenderedDir, file).replace(/\.html$/, '').replace(/\/index$/, '');
      prerendered.push(route === '' ? '/' : route);
    }
  }

  return prerendered;
}

/**
 * Walk a directory recursively
 */
function walkDirectory(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkDirectory(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Copy static assets to output directory
 *
 * @example
 * ```typescript
 * await copyStaticAssets('public', '.vercel/output/static');
 * ```
 */
export async function copyStaticAssets(
  source: string,
  destination: string,
  options: {
    /** Patterns to exclude */
    exclude?: string[];
    /** Transform file content */
    transform?: (content: Buffer, path: string) => Buffer;
  } = {}
): Promise<void> {
  if (!existsSync(source)) {
    console.warn(`Static assets directory not found: ${source}`);
    return;
  }

  const { exclude = [], transform } = options;

  mkdirSync(destination, { recursive: true });

  const files = walkDirectory(source);

  for (const file of files) {
    const relativePath = relative(source, file);

    // Check exclusions
    if (exclude.some(pattern => {
      if (pattern.startsWith('*.')) {
        return file.endsWith(pattern.slice(1));
      }
      return relativePath.includes(pattern);
    })) {
      continue;
    }

    const destPath = join(destination, relativePath);
    const destDir = dirname(destPath);

    mkdirSync(destDir, { recursive: true });

    if (transform) {
      const content = readFileSync(file);
      const transformed = transform(content, relativePath);
      writeFileSync(destPath, transformed);
    } else {
      cpSync(file, destPath);
    }
  }
}

/**
 * Asset optimization options
 */
export interface OptimizeAssetsOptions {
  /** Minify HTML */
  minifyHtml?: boolean;
  /** Minify CSS */
  minifyCss?: boolean;
  /** Minify JavaScript */
  minifyJs?: boolean;
  /** Compress images */
  compressImages?: boolean;
  /** Generate hashed filenames */
  hashFilenames?: boolean;
  /** Inline small assets */
  inlineAssets?: boolean;
  /** Asset size threshold for inlining (bytes) */
  inlineThreshold?: number;
  /** Generate source maps */
  sourceMaps?: boolean;
}

/**
 * Optimize assets in a directory
 *
 * @example
 * ```typescript
 * await optimizeAssets('.vercel/output/static', {
 *   minifyHtml: true,
 *   minifyCss: true,
 *   compressImages: true,
 * });
 * ```
 */
export async function optimizeAssets(
  dir: string,
  options: OptimizeAssetsOptions = {}
): Promise<{ optimized: number; savedBytes: number }> {
  const {
    minifyHtml = true,
    minifyCss = true,
    minifyJs = true,
    compressImages = false,
    hashFilenames = false,
    inlineAssets = false,
    inlineThreshold = 4096,
    sourceMaps = false,
  } = options;

  let optimized = 0;
  let savedBytes = 0;

  if (!existsSync(dir)) {
    return { optimized, savedBytes };
  }

  const files = walkDirectory(dir);

  for (const file of files) {
    const ext = extname(file);
    const originalSize = statSync(file).size;
    let content = readFileSync(file);
    let modified = false;

    // HTML minification (basic)
    if (minifyHtml && ext === '.html') {
      const html = content.toString();
      const minified = html
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/<!--(?!<!)[^\[>].*?-->/g, '')
        .trim();

      if (minified.length < html.length) {
        content = Buffer.from(minified);
        modified = true;
      }
    }

    // CSS minification (basic)
    if (minifyCss && ext === '.css') {
      const css = content.toString();
      const minified = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .replace(/;\}/g, '}')
        .trim();

      if (minified.length < css.length) {
        content = Buffer.from(minified);
        modified = true;
      }
    }

    // JavaScript minification (basic - just removes comments and whitespace)
    if (minifyJs && (ext === '.js' || ext === '.mjs')) {
      const js = content.toString();
      // Very basic minification - in production use a proper minifier
      const minified = js
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (minified.length < js.length * 0.9) {
        content = Buffer.from(minified);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(file, content);
      const newSize = content.length;
      savedBytes += originalSize - newSize;
      optimized++;
    }
  }

  return { optimized, savedBytes };
}

/**
 * Generate hashed filename for cache busting
 */
export function generateHashedFilename(
  filename: string,
  content: Buffer | string
): string {
  const hash = createHash('sha256')
    .update(typeof content === 'string' ? content : content.toString())
    .digest('hex')
    .slice(0, 8);

  const ext = extname(filename);
  const base = basename(filename, ext);
  const dir = dirname(filename);

  return join(dir, `${base}.${hash}${ext}`);
}

/**
 * Create output directory structure
 */
export function createOutputStructure(
  baseDir: string,
  structure: {
    functions?: boolean;
    static?: boolean;
    prerendered?: boolean;
    edge?: boolean;
  } = {}
): void {
  const {
    functions = true,
    static: staticDir = true,
    prerendered = true,
    edge = false,
  } = structure;

  mkdirSync(baseDir, { recursive: true });

  if (functions) {
    mkdirSync(join(baseDir, 'functions'), { recursive: true });
  }

  if (staticDir) {
    mkdirSync(join(baseDir, 'static'), { recursive: true });
  }

  if (prerendered) {
    mkdirSync(join(baseDir, 'prerendered'), { recursive: true });
  }

  if (edge) {
    mkdirSync(join(baseDir, 'edge'), { recursive: true });
  }
}

/**
 * Get file hash for cache busting
 */
export function getFileHash(filePath: string): string {
  if (!existsSync(filePath)) {
    return '';
  }

  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

/**
 * Check if a file should be cached immutably
 */
export function isImmutableAsset(filePath: string): boolean {
  // Files with hash in name
  if (/\.[a-f0-9]{8,}\./.test(filePath)) {
    return true;
  }

  // Files in immutable directories
  if (filePath.includes('/immutable/') || filePath.includes('/_next/static/')) {
    return true;
  }

  // Font files
  const ext = extname(filePath);
  if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
    return true;
  }

  return false;
}

/**
 * Generate cache control header for an asset
 */
export function getCacheControl(filePath: string, options: {
  development?: boolean;
  maxAge?: number;
} = {}): string {
  const { development = false, maxAge = 31536000 } = options;

  if (development) {
    return 'no-cache, no-store, must-revalidate';
  }

  if (isImmutableAsset(filePath)) {
    return `public, max-age=${maxAge}, immutable`;
  }

  // HTML files should be revalidated
  if (filePath.endsWith('.html')) {
    return 'public, max-age=0, must-revalidate';
  }

  // Default caching
  return `public, max-age=${maxAge}`;
}

export default {
  MIME_TYPES,
  createBuildManifest,
  copyStaticAssets,
  optimizeAssets,
  generateHashedFilename,
  createOutputStructure,
  getFileHash,
  isImmutableAsset,
  getCacheControl,
};
