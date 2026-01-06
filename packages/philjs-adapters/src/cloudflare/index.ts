/**
 * PhilJS Cloudflare Adapter
 *
 * Deploy to Cloudflare Workers and Pages
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types.js';

export interface CloudflareConfig extends AdapterConfig {
  /** Deploy as Pages (default) or Workers */
  mode?: 'pages' | 'workers';
  /** Use Workers Sites for static assets */
  sites?: boolean;
  /** KV namespace bindings */
  kv?: Array<{
    binding: string;
    id: string;
    preview_id?: string;
  }>;
  /** Durable Objects bindings */
  durableObjects?: Array<{
    binding: string;
    class_name: string;
    script_name?: string;
  }>;
  /** R2 bucket bindings */
  r2?: Array<{
    binding: string;
    bucket_name: string;
  }>;
  /** D1 database bindings */
  d1?: Array<{
    binding: string;
    database_id: string;
    database_name: string;
  }>;
  /** Environment variables */
  vars?: Record<string, string>;
  /** Compatibility date */
  compatibilityDate?: string;
  /** Compatibility flags */
  compatibilityFlags?: string[];
  /** Routes */
  routes?: string[];
}

export function cloudflareAdapter(config: CloudflareConfig = {}): Adapter & EdgeAdapter {
  const {
    outDir = '.cloudflare',
    mode = 'pages',
    sites = false,
    kv = [],
    durableObjects = [],
    r2 = [],
    d1 = [],
    vars = {},
    compatibilityDate = '2024-01-01',
    compatibilityFlags = [],
    routes = [],
  } = config;

  return {
    name: 'cloudflare',
    edge: true,
    edgeConfig: {
      regions: ['global'], // Cloudflare deploys globally by default
    },

    async adapt() {
      console.log(`Building for Cloudflare ${mode}...`);

      if (mode === 'pages') {
        await adaptForPages();
      } else {
        await adaptForWorkers();
      }

    },

    getHandler() {
      return async (request: Request, env?: unknown): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'cloudflare',
            edge: true,
            env, // KV, R2, D1, etc. bindings
            ctx: (globalThis as any).ctx, // ExecutionContext
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  async function adaptForPages() {
    // Create _worker.js for Cloudflare Pages
    mkdirSync(outDir, { recursive: true });
    mkdirSync(join(outDir, 'functions'), { recursive: true });

    // Generate _worker.js (main handler)
    writeFileSync(
      join(outDir, '_worker.js'),
      generatePagesWorker()
    );

    // Generate _routes.json for static asset handling
    writeFileSync(
      join(outDir, '_routes.json'),
      JSON.stringify({
        version: 1,
        include: ['/*'],
        exclude: ['/static/*', '/assets/*', '/_philjs/*'],
      }, null, 2)
    );

    // Generate wrangler.toml for local development
    writeFileSync(
      join(outDir, 'wrangler.toml'),
      generateWranglerToml({ mode: 'pages', kv, durableObjects, r2, d1, vars, compatibilityDate, compatibilityFlags })
    );

    // Copy static assets
    const staticDir = config.static?.assets || 'public';
    if (existsSync(staticDir)) {
      cpSync(staticDir, outDir, { recursive: true });
    }

    // Copy prerendered pages
    if (existsSync('.philjs/prerendered')) {
      cpSync('.philjs/prerendered', outDir, { recursive: true });
    }
  }

  async function adaptForWorkers() {
    mkdirSync(outDir, { recursive: true });

    // Generate worker script
    writeFileSync(
      join(outDir, 'worker.js'),
      generateWorkerScript(sites)
    );

    // Generate wrangler.toml
    writeFileSync(
      join(outDir, 'wrangler.toml'),
      generateWranglerToml({ mode: 'workers', kv, durableObjects, r2, d1, vars, compatibilityDate, compatibilityFlags, sites, routes })
    );

    // If using Workers Sites, copy static assets
    if (sites) {
      mkdirSync(join(outDir, 'public'), { recursive: true });
      const staticDir = config.static?.assets || 'public';
      if (existsSync(staticDir)) {
        cpSync(staticDir, join(outDir, 'public'), { recursive: true });
      }
    }
  }
}

function generatePagesWorker(): string {
  return `
// PhilJS Cloudflare Pages Worker
export default {
  async fetch(request, env, ctx) {
    const { handleRequest } = await import('@philjs/ssr');

    const url = new URL(request.url);

    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'cloudflare',
        edge: true,
        env, // Bindings (KV, D1, R2, etc.)
        ctx, // ExecutionContext
      },
    };

    try {
      return await handleRequest(context);
    } catch (error) {
      console.error('Request failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
`;
}

function generateWorkerScript(useSites: boolean): string {
  const sitesImport = useSites
    ? `import { getAssetFromKV } from '@cloudflare/kv-asset-handler';`
    : '';

  const sitesHandler = useSites
    ? `
    // Try to serve static asset first
    try {
      return await getAssetFromKV(event);
    } catch (e) {
      // Not a static asset, continue to SSR
    }
    `
    : '';

  return `
// PhilJS Cloudflare Workers Handler
${sitesImport}

export default {
  async fetch(request, env, ctx) {
    const event = { request, env, ctx };
    ${sitesHandler}

    const { handleRequest } = await import('@philjs/ssr');

    const url = new URL(request.url);

    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'cloudflare',
        edge: true,
        env,
        ctx,
      },
    };

    try {
      return await handleRequest(context);
    } catch (error) {
      console.error('Request failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
`;
}

function generateWranglerToml(options: {
  mode: 'pages' | 'workers';
  kv: CloudflareConfig['kv'];
  durableObjects: CloudflareConfig['durableObjects'];
  r2: CloudflareConfig['r2'];
  d1: CloudflareConfig['d1'];
  vars: Record<string, string>;
  compatibilityDate: string;
  compatibilityFlags: string[];
  sites?: boolean;
  routes?: string[];
}): string {
  const lines: string[] = [
    'name = "philjs-app"',
    `compatibility_date = "${options.compatibilityDate}"`,
  ];

  if (options.compatibilityFlags.length > 0) {
    lines.push(`compatibility_flags = [${options.compatibilityFlags.map(f => `"${f}"`).join(', ')}]`);
  }

  if (options.mode === 'workers') {
    lines.push('main = "worker.js"');

    if (options.sites) {
      lines.push('');
      lines.push('[site]');
      lines.push('bucket = "./public"');
    }

    if (options.routes && options.routes.length > 0) {
      lines.push('');
      lines.push(`routes = [${options.routes.map(r => `"${r}"`).join(', ')}]`);
    }
  }

  // KV Namespaces
  for (const binding of options.kv || []) {
    lines.push('');
    lines.push('[[kv_namespaces]]');
    lines.push(`binding = "${binding.binding}"`);
    lines.push(`id = "${binding.id}"`);
    if (binding.preview_id) {
      lines.push(`preview_id = "${binding.preview_id}"`);
    }
  }

  // Durable Objects
  if (options.durableObjects && options.durableObjects.length > 0) {
    lines.push('');
    lines.push('[durable_objects]');
    lines.push('bindings = [');
    for (const binding of options.durableObjects) {
      lines.push(`  { name = "${binding.binding}", class_name = "${binding.class_name}"${binding.script_name ? `, script_name = "${binding.script_name}"` : ''} },`);
    }
    lines.push(']');
  }

  // R2 Buckets
  for (const binding of options.r2 || []) {
    lines.push('');
    lines.push('[[r2_buckets]]');
    lines.push(`binding = "${binding.binding}"`);
    lines.push(`bucket_name = "${binding.bucket_name}"`);
  }

  // D1 Databases
  for (const binding of options.d1 || []) {
    lines.push('');
    lines.push('[[d1_databases]]');
    lines.push(`binding = "${binding.binding}"`);
    lines.push(`database_id = "${binding.database_id}"`);
    lines.push(`database_name = "${binding.database_name}"`);
  }

  // Environment variables
  if (Object.keys(options.vars).length > 0) {
    lines.push('');
    lines.push('[vars]');
    for (const [key, value] of Object.entries(options.vars)) {
      lines.push(`${key} = "${value}"`);
    }
  }

  return lines.join('\n');
}

// Cloudflare-specific utilities
export function getCloudflareEnv<T = unknown>(): T {
  return (globalThis as any).env as T;
}

export function getExecutionContext() {
  return (globalThis as any).ctx;
}

export function waitUntil(promise: Promise<unknown>) {
  const ctx = getExecutionContext();
  if (ctx?.waitUntil) {
    ctx.waitUntil(promise);
  }
}

// KV helpers
export function createKVHelper(namespace: KVNamespace) {
  return {
    get: (key: string) => namespace.get(key),
    getJSON: <T>(key: string) => namespace.get<T>(key, 'json'),
    put: (key: string, value: string, options?: KVNamespacePutOptions) =>
      namespace.put(key, value, options),
    delete: (key: string) => namespace.delete(key),
    list: (options?: KVNamespaceListOptions) => namespace.list(options),
  };
}

// Types for Cloudflare bindings
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  get<T>(key: string, type: 'json'): Promise<T | null>;
  put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<{ keys: { name: string }[] }>;
}

interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

interface KVNamespaceListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export default cloudflareAdapter;
