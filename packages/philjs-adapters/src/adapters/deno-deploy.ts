/**
 * PhilJS Deno Deploy Adapter
 *
 * Production-ready deployment adapter for Deno Deploy with:
 * - Edge functions support
 * - Fresh framework compatibility
 * - Deno KV integration
 * - deno.json generation
 * - Automatic region routing
 *
 * @module philjs-adapters/adapters/deno-deploy
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types';
import { createBuildManifest, copyStaticAssets } from '../utils/build';
import { loadEnvFile } from '../utils/env';

/**
 * Configuration options for the Deno Deploy adapter
 */
export interface DenoDeployAdapterConfig extends AdapterConfig {
  /** Deno Deploy project name */
  projectName?: string;

  /** Entry point file */
  entryPoint?: string;

  /** Enable Deno KV */
  kv?: boolean | DenoKVConfig;

  /** Fresh framework compatibility mode */
  fresh?: boolean | FreshConfig;

  /** Static file directory */
  staticDir?: string;

  /** Enable compression */
  compression?: boolean;

  /** Import map configuration */
  importMap?: string | ImportMapConfig;

  /** TypeScript configuration */
  compilerOptions?: DenoCompilerOptions;

  /** Lock file */
  lock?: string | boolean;

  /** Tasks configuration */
  tasks?: Record<string, string>;

  /** Lint configuration */
  lint?: DenoLintConfig;

  /** Format configuration */
  fmt?: DenoFmtConfig;

  /** Generate deno.json */
  generateConfig?: boolean;

  /** Deployment regions (Deno Deploy specific) */
  regions?: DenoDeployRegion[];

  /** Node.js compatibility */
  nodeModulesDir?: boolean;

  /** Unstable features to enable */
  unstable?: string[];
}

/**
 * Deno Deploy regions
 */
export type DenoDeployRegion =
  | 'gcp-asia-east1'
  | 'gcp-asia-east2'
  | 'gcp-asia-northeast1'
  | 'gcp-asia-northeast2'
  | 'gcp-asia-northeast3'
  | 'gcp-asia-south1'
  | 'gcp-asia-southeast1'
  | 'gcp-asia-southeast2'
  | 'gcp-australia-southeast1'
  | 'gcp-europe-north1'
  | 'gcp-europe-west1'
  | 'gcp-europe-west2'
  | 'gcp-europe-west3'
  | 'gcp-europe-west4'
  | 'gcp-europe-west6'
  | 'gcp-northamerica-northeast1'
  | 'gcp-southamerica-east1'
  | 'gcp-us-central1'
  | 'gcp-us-east1'
  | 'gcp-us-east4'
  | 'gcp-us-west1'
  | 'gcp-us-west2'
  | 'gcp-us-west3'
  | 'gcp-us-west4';

/**
 * Deno KV configuration
 */
export interface DenoKVConfig {
  /** Enable KV */
  enabled: boolean;
  /** KV database path (for local development) */
  path?: string;
  /** TTL for cache entries (ms) */
  defaultTtl?: number;
  /** Enable consistency checking */
  consistency?: 'strong' | 'eventual';
}

/**
 * Fresh framework configuration
 */
export interface FreshConfig {
  /** Enable Fresh mode */
  enabled: boolean;
  /** Fresh version */
  version?: string;
  /** Plugins to enable */
  plugins?: string[];
  /** Islands directory */
  islandsDir?: string;
  /** Routes directory */
  routesDir?: string;
}

/**
 * Import map configuration
 */
export interface ImportMapConfig {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/**
 * Deno compiler options
 */
export interface DenoCompilerOptions {
  allowJs?: boolean;
  checkJs?: boolean;
  strict?: boolean;
  jsx?: 'react' | 'react-jsx' | 'react-jsxdev' | 'preserve';
  jsxImportSource?: string;
  lib?: string[];
  types?: string[];
  experimentalDecorators?: boolean;
  emitDecoratorMetadata?: boolean;
}

/**
 * Deno lint configuration
 */
export interface DenoLintConfig {
  include?: string[];
  exclude?: string[];
  rules?: {
    tags?: string[];
    include?: string[];
    exclude?: string[];
  };
}

/**
 * Deno format configuration
 */
export interface DenoFmtConfig {
  useTabs?: boolean;
  lineWidth?: number;
  indentWidth?: number;
  singleQuote?: boolean;
  proseWrap?: 'always' | 'never' | 'preserve';
  semiColons?: boolean;
  include?: string[];
  exclude?: string[];
}

/**
 * Create a Deno Deploy adapter
 *
 * @example
 * ```typescript
 * import { denoDeployAdapter } from 'philjs-adapters/adapters/deno-deploy';
 *
 * export default defineConfig({
 *   adapter: denoDeployAdapter({
 *     projectName: 'my-app',
 *     kv: {
 *       enabled: true,
 *       defaultTtl: 60000,
 *     },
 *     fresh: true,
 *   }),
 * });
 * ```
 */
export function denoDeployAdapter(config: DenoDeployAdapterConfig = {}): Adapter & EdgeAdapter {
  const {
    outDir = '.deno',
    projectName = 'philjs-app',
    entryPoint = 'main.ts',
    kv = false,
    fresh = false,
    staticDir = 'public',
    compression = true,
    importMap,
    compilerOptions,
    lock = true,
    tasks,
    lint,
    fmt,
    generateConfig = true,
    regions = [],
    nodeModulesDir = false,
    unstable = [],
  } = config;

  const kvConfig: DenoKVConfig | null = kv
    ? typeof kv === 'boolean'
      ? { enabled: true }
      : kv
    : null;

  const freshConfig: FreshConfig | null = fresh
    ? typeof fresh === 'boolean'
      ? { enabled: true }
      : fresh
    : null;

  return {
    name: 'deno-deploy',
    edge: true,
    edgeConfig: {
      regions: regions.length > 0 ? regions : ['global'],
    },

    async adapt() {
      console.log('Building for Deno Deploy...');

      // Create output structure
      mkdirSync(outDir, { recursive: true });
      mkdirSync(join(outDir, 'static'), { recursive: true });

      // Generate main entry point
      writeFileSync(
        join(outDir, entryPoint),
        generateMainHandler()
      );

      // Generate Fresh files if enabled
      if (freshConfig?.enabled) {
        await generateFreshApp();
      }

      // Copy static assets
      await copyStaticAssets(staticDir, join(outDir, 'static'));

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, 'static'), { recursive: true });
      }

      // Generate deno.json
      if (generateConfig) {
        const denoJson = generateDenoJson();
        writeFileSync(
          join(outDir, 'deno.json'),
          JSON.stringify(denoJson, null, 2)
        );
      }

      // Generate import_map.json if configured
      if (importMap) {
        const importMapContent = typeof importMap === 'string'
          ? importMap
          : JSON.stringify(importMap, null, 2);
        writeFileSync(join(outDir, 'import_map.json'), importMapContent);
      }

      // Generate deploy script
      writeFileSync(
        join(outDir, 'deploy.sh'),
        generateDeployScript()
      );

      // Generate build manifest
      const manifest = await createBuildManifest({
        adapter: 'deno-deploy',
        outputDir: outDir,
        routes: [],
      });
      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`Deno Deploy build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, info?: unknown): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'deno-deploy',
            edge: true,
            info,
            kv: kvConfig?.enabled ? await getDenoKV() : undefined,
            regions,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  /**
   * Generate main server handler
   */
  function generateMainHandler(): string {
    const kvImport = kvConfig?.enabled
      ? `
// Deno KV instance
let kv: Deno.Kv | null = null;

async function getKV(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv(${kvConfig.path ? `"${kvConfig.path}"` : ''});
  }
  return kv;
}
`
      : '';

    return `/**
 * PhilJS Deno Deploy Handler
 * Generated by PhilJS Adapters
 */

/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { handleRequest } from '@philjs/ssr';

${kvImport}

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
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
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
};

/**
 * Try to serve a static file
 */
async function serveStatic(pathname: string): Promise<Response | null> {
  const staticDirs = ['./static', './.philjs/prerendered'];

  for (const dir of staticDirs) {
    try {
      const filePath = \`\${dir}\${pathname}\`;
      const file = await Deno.open(filePath, { read: true });
      const stat = await file.stat();

      if (stat.isFile) {
        const ext = pathname.substring(pathname.lastIndexOf('.'));
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const headers = new Headers({
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Cache-Control': 'public, max-age=31536000, immutable',
        });

        // Add ETag
        if (stat.mtime) {
          headers.set('ETag', \`"\${stat.mtime.getTime().toString(16)}-\${stat.size.toString(16)}"\`);
        }

        return new Response(file.readable, { headers });
      }

      file.close();
    } catch {
      // File doesn't exist, continue
    }
  }

  return null;
}

${compression ? `
/**
 * Compress response if applicable
 */
async function maybeCompress(response: Response): Promise<Response> {
  const contentType = response.headers.get('Content-Type') || '';

  if (!contentType.includes('text/') && !contentType.includes('application/json')) {
    return response;
  }

  try {
    const body = await response.arrayBuffer();
    const stream = new Blob([body]).stream();
    const compressed = stream.pipeThrough(new CompressionStream('gzip'));

    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', 'gzip');
    headers.delete('Content-Length');

    return new Response(compressed, {
      status: response.status,
      headers,
    });
  } catch {
    return response;
  }
}
` : ''}

/**
 * Main request handler
 */
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Try to serve static files first
  const staticResponse = await serveStatic(url.pathname);
  if (staticResponse) {
    return staticResponse;
  }

  // Handle index.html for directory requests
  if (url.pathname.endsWith('/')) {
    const indexResponse = await serveStatic(url.pathname + 'index.html');
    if (indexResponse) {
      return indexResponse;
    }
  }

  try {
    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'deno-deploy',
        edge: true,
        version: Deno.version.deno,
        ${kvConfig?.enabled ? 'kv: await getKV(),' : ''}
        isDeploy: Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined,
        region: Deno.env.get('DENO_REGION'),
      },
    };

    const response = await handleRequest(context);

    ${compression ? 'return maybeCompress(response);' : 'return response;'}
  } catch (error) {
    console.error('Request error:', error);

    const isDev = !Deno.env.get('DENO_DEPLOYMENT_ID');

    if (isDev) {
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Internal Server Error', { status: 500 });
  }
}

// Start the server
const port = parseInt(Deno.env.get('PORT') || '8000');

console.log(\`PhilJS running on http://localhost:\${port}\`);

Deno.serve({ port }, handler);
`;
  }

  /**
   * Generate Fresh app structure
   */
  async function generateFreshApp(): Promise<void> {
    if (!freshConfig?.enabled) return;

    // Create Fresh directories
    mkdirSync(join(outDir, 'routes'), { recursive: true });
    mkdirSync(join(outDir, 'islands'), { recursive: true });
    mkdirSync(join(outDir, 'components'), { recursive: true });

    // Generate Fresh entry point
    writeFileSync(
      join(outDir, 'main.ts'),
      generateFreshMain()
    );

    // Generate dev.ts
    writeFileSync(
      join(outDir, 'dev.ts'),
      `#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

await dev(import.meta.url, "./main.ts", config);
`
    );

    // Generate fresh.config.ts
    writeFileSync(
      join(outDir, 'fresh.config.ts'),
      `import { defineConfig } from "$fresh/server.ts";
${freshConfig.plugins?.length ? `import twindPlugin from "$fresh/plugins/twind.ts";` : ''}

export default defineConfig({
  ${freshConfig.plugins?.length ? `plugins: [twindPlugin()],` : ''}
});
`
    );

    // Generate index route
    writeFileSync(
      join(outDir, 'routes', 'index.tsx'),
      `import { Handlers, PageProps } from "$fresh/server.ts";
import { handleRequest } from '@philjs/ssr';

export const handler: Handlers = {
  async GET(req, ctx) {
    const response = await handleRequest({
      url: new URL(req.url),
      method: req.method,
      headers: req.headers,
      body: null,
      params: ctx.params,
      platform: { name: 'fresh' },
    });

    return response;
  },
};

export default function Home() {
  return (
    <div>
      <h1>PhilJS + Fresh</h1>
    </div>
  );
}
`
    );

    // Generate _app.tsx
    writeFileSync(
      join(outDir, 'routes', '_app.tsx'),
      `import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PhilJS App</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
`
    );
  }

  /**
   * Generate Fresh main entry point
   */
  function generateFreshMain(): string {
    return `/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

await start(manifest, config);
`;
  }

  /**
   * Generate deno.json configuration
   */
  function generateDenoJson(): object {
    const config: Record<string, unknown> = {
      name: projectName,
    };

    // Tasks
    const defaultTasks: Record<string, string> = {
      start: `deno run -A ${entryPoint}`,
      dev: `deno run -A --watch ${entryPoint}`,
      deploy: 'deployctl deploy --prod',
    };

    if (freshConfig?.enabled) {
      defaultTasks.start = 'deno run -A main.ts';
      defaultTasks.dev = 'deno run -A --watch=static/,routes/ dev.ts';
      defaultTasks.build = 'deno run -A dev.ts build';
      defaultTasks.preview = 'deno run -A main.ts';
    }

    config.tasks = { ...defaultTasks, ...tasks };

    // Import map
    if (importMap) {
      config.importMap = typeof importMap === 'string' ? importMap : './import_map.json';
    }

    // Compiler options
    if (compilerOptions) {
      config.compilerOptions = compilerOptions;
    } else {
      config.compilerOptions = {
        allowJs: true,
        lib: ['deno.window'],
        strict: true,
      };

      if (freshConfig?.enabled) {
        (config.compilerOptions as Record<string, unknown>).jsx = 'react-jsx';
        (config.compilerOptions as Record<string, unknown>).jsxImportSource = 'preact';
      }
    }

    // Lock file
    if (lock) {
      config.lock = typeof lock === 'string' ? lock : './deno.lock';
    }

    // Lint configuration
    if (lint) {
      config.lint = lint;
    } else {
      config.lint = {
        include: ['src/', 'routes/', 'islands/'],
        exclude: ['static/', '_fresh/'],
      };
    }

    // Format configuration
    if (fmt) {
      config.fmt = fmt;
    } else {
      config.fmt = {
        useTabs: false,
        lineWidth: 100,
        indentWidth: 2,
        singleQuote: true,
        include: ['src/', 'routes/', 'islands/'],
        exclude: ['static/', '_fresh/'],
      };
    }

    // Node modules directory
    if (nodeModulesDir) {
      config.nodeModulesDir = true;
    }

    // Unstable features
    if (unstable.length > 0) {
      config.unstable = unstable;
    } else if (kvConfig?.enabled) {
      config.unstable = ['kv'];
    }

    // Fresh-specific imports
    if (freshConfig?.enabled) {
      config.imports = {
        '$fresh/': `https://deno.land/x/fresh@${freshConfig.version || '1.6.0'}/`,
        'preact': 'https://esm.sh/preact@10.19.2',
        'preact/': 'https://esm.sh/preact@10.19.2/',
        '$std/': 'https://deno.land/std@0.208.0/',
        '@philjs/ssr': 'npm:@philjs/ssr@latest',
        '@philjs/core': 'npm:@philjs/core@latest',
      };
    } else {
      config.imports = {
        '@philjs/ssr': 'npm:@philjs/ssr@latest',
        '@philjs/core': 'npm:@philjs/core@latest',
      };
    }

    return config;
  }

  /**
   * Generate deployment script
   */
  function generateDeployScript(): string {
    return `#!/bin/bash
# PhilJS Deno Deploy Script
# Generated by PhilJS Adapters

set -e

echo "Deploying to Deno Deploy..."

# Check if deployctl is installed
if ! command -v deployctl &> /dev/null; then
  echo "Installing deployctl..."
  deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts
fi

# Deploy to Deno Deploy
deployctl deploy \\
  --project="${projectName}" \\
  --prod \\
  ${entryPoint}

echo "Deployment complete!"
`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get or create Deno KV instance
 */
let kvInstance: unknown = null;

export async function getDenoKV(path?: string): Promise<DenoKVWrapper> {
  if (kvInstance) {
    return new DenoKVWrapper(kvInstance);
  }

  const Deno = (globalThis as any).Deno;
  if (!Deno?.openKv) {
    throw new Error('Deno KV is not available');
  }

  kvInstance = await Deno.openKv(path);
  return new DenoKVWrapper(kvInstance);
}

/**
 * Wrapper for Deno KV with helper methods
 */
export class DenoKVWrapper {
  constructor(private kv: any) {}

  /**
   * Get a value by key
   */
  async get<T = unknown>(key: string[]): Promise<T | null> {
    const result = await this.kv.get(key);
    return result.value;
  }

  /**
   * Set a value with optional TTL
   */
  async set(key: string[], value: unknown, options?: { expireIn?: number }): Promise<void> {
    await this.kv.set(key, value, options);
  }

  /**
   * Delete a value
   */
  async delete(key: string[]): Promise<void> {
    await this.kv.delete(key);
  }

  /**
   * List values by prefix
   */
  async list<T = unknown>(prefix: string[], options?: { limit?: number; reverse?: boolean }): Promise<Array<{ key: string[]; value: T }>> {
    const results: Array<{ key: string[]; value: T }> = [];
    const entries = this.kv.list({ prefix }, options);

    for await (const entry of entries) {
      results.push({ key: entry.key, value: entry.value });
    }

    return results;
  }

  /**
   * Atomic operation
   */
  atomic(): DenoKVAtomicWrapper {
    return new DenoKVAtomicWrapper(this.kv.atomic());
  }

  /**
   * Watch for changes
   */
  watch(keys: string[][]): AsyncIterable<Array<{ key: string[]; value: unknown; versionstamp: string }>> {
    return this.kv.watch(keys);
  }

  /**
   * Close the KV connection
   */
  close(): void {
    this.kv.close();
    kvInstance = null;
  }
}

/**
 * Wrapper for Deno KV atomic operations
 */
export class DenoKVAtomicWrapper {
  constructor(private atomic: any) {}

  check(...entries: Array<{ key: string[]; versionstamp: string | null }>): this {
    this.atomic.check(...entries);
    return this;
  }

  set(key: string[], value: unknown, options?: { expireIn?: number }): this {
    this.atomic.set(key, value, options);
    return this;
  }

  delete(key: string[]): this {
    this.atomic.delete(key);
    return this;
  }

  sum(key: string[], n: bigint): this {
    this.atomic.sum(key, n);
    return this;
  }

  min(key: string[], n: bigint): this {
    this.atomic.min(key, n);
    return this;
  }

  max(key: string[], n: bigint): this {
    this.atomic.max(key, n);
    return this;
  }

  async commit(): Promise<{ ok: boolean; versionstamp?: string }> {
    return this.atomic.commit();
  }
}

/**
 * Check if running on Deno Deploy
 */
export function isDenoDeply(): boolean {
  const Deno = (globalThis as any).Deno;
  return Deno?.env?.get('DENO_DEPLOYMENT_ID') !== undefined;
}

/**
 * Get Deno Deploy region
 */
export function getDenoDeployRegion(): string | undefined {
  const Deno = (globalThis as any).Deno;
  return Deno?.env?.get('DENO_REGION');
}

/**
 * Check Deno permissions
 */
export async function checkDenoPermissions(): Promise<{
  read: boolean;
  write: boolean;
  net: boolean;
  env: boolean;
  run: boolean;
}> {
  const Deno = (globalThis as any).Deno;
  if (!Deno?.permissions) {
    return { read: false, write: false, net: false, env: false, run: false };
  }

  const check = async (name: string): Promise<boolean> => {
    try {
      const status = await Deno.permissions.query({ name });
      return status.state === 'granted';
    } catch {
      return false;
    }
  };

  return {
    read: await check('read'),
    write: await check('write'),
    net: await check('net'),
    env: await check('env'),
    run: await check('run'),
  };
}

/**
 * Request a Deno permission
 */
export async function requestDenoPermission(
  name: 'read' | 'write' | 'net' | 'env' | 'run',
  path?: string
): Promise<boolean> {
  const Deno = (globalThis as any).Deno;
  if (!Deno?.permissions) return false;

  try {
    const descriptor: any = { name };
    if (path && (name === 'read' || name === 'write')) {
      descriptor.path = path;
    }

    const status = await Deno.permissions.request(descriptor);
    return status.state === 'granted';
  } catch {
    return false;
  }
}

export default denoDeployAdapter;
