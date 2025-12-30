/**
 * PhilJS Vercel Adapter
 *
 * Full-featured Vercel deployment with:
 * - Edge Runtime support
 * - Serverless Functions
 * - Edge Config integration
 * - KV (Vercel KV) storage
 * - Blob storage
 * - Automatic ISR (Incremental Static Regeneration)
 * - Image Optimization
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, ServerlessAdapter, RequestContext } from '../types.js';

export interface VercelConfig extends AdapterConfig {
  /** Use Edge Runtime (default: false, uses Node.js serverless) */
  edge?: boolean;

  /** Vercel regions to deploy to */
  regions?: string[];

  /** Memory limit in MB (serverless only) */
  memory?: number;

  /** Max duration in seconds */
  maxDuration?: number;

  /** Enable Incremental Static Regeneration */
  isr?: {
    /** Revalidation time in seconds */
    expiration?: number;
    /** Allow manual revalidation */
    allowQuery?: boolean;
    /** Bypass token for on-demand revalidation */
    bypassToken?: string;
  };

  /** Enable Image Optimization */
  images?: {
    /** Allowed image domains */
    domains?: string[];
    /** Image formats to support */
    formats?: ('image/avif' | 'image/webp')[];
    /** Minimum cache TTL in seconds */
    minimumCacheTTL?: number;
    /** Device sizes for responsive images */
    deviceSizes?: number[];
    /** Image sizes for srcset */
    imageSizes?: number[];
  };

  /** Cron jobs */
  crons?: Array<{
    /** Path to invoke */
    path: string;
    /** Cron schedule expression */
    schedule: string;
  }>;

  /** Enable Vercel KV */
  kv?: {
    /** Database name */
    database?: string;
    /** Environment (production, preview, development) */
    env?: 'production' | 'preview' | 'development';
  };

  /** Enable Vercel Blob */
  blob?: {
    /** Enable read/write token */
    token?: string;
  };

  /** Enable Edge Config */
  edgeConfig?: {
    /** Config ID */
    id?: string;
  };

  /** Rewrites configuration */
  rewrites?: Array<{
    source: string;
    destination: string;
  }>;

  /** Redirects configuration */
  redirects?: Array<{
    source: string;
    destination: string;
    permanent?: boolean;
    statusCode?: number;
  }>;

  /** Headers configuration */
  headers?: Array<{
    source: string;
    headers: Array<{
      key: string;
      value: string;
    }>;
  }>;

  /** Split routes into separate functions */
  splitRoutes?: boolean;

  /** Node.js version (serverless only) */
  nodeVersion?: '18.x' | '20.x';
}

export function vercelAdapter(config: VercelConfig = {}): Adapter & Partial<EdgeAdapter & ServerlessAdapter> {
  const {
    outDir = '.vercel/output',
    edge = false,
    regions = edge ? ['iad1'] : [],
    memory = 1024,
    maxDuration = edge ? 30 : 60,
    isr,
    images,
    crons,
    kv,
    blob,
    edgeConfig,
    rewrites,
    redirects,
    headers,
    splitRoutes = false,
    nodeVersion = '20.x',
    sourceMaps = true,
  } = config;

  return {
    name: 'vercel',
    edge,
    ...(edge && {
      edgeConfig: {
        regions,
        maxDuration,
      },
    }),
    ...(!edge && {
      serverless: true as const,
      functionConfig: {
        memory,
        timeout: maxDuration,
        runtime: `nodejs${nodeVersion}`,
      },
    }),

    async adapt() {
      console.log(`Building for Vercel ${edge ? 'Edge' : 'Serverless'}...`);

      // Create Vercel Build Output API v3 structure
      mkdirSync(join(outDir, 'functions'), { recursive: true });
      mkdirSync(join(outDir, 'static'), { recursive: true });

      // Generate config.json
      const vercelConfig = generateConfig();
      writeFileSync(
        join(outDir, 'config.json'),
        JSON.stringify(vercelConfig, null, 2)
      );

      // Generate main function
      if (splitRoutes) {
        await generateSplitFunctions();
      } else {
        await generateMainFunction();
      }

      // Copy static assets
      const staticDir = config.static?.assets || 'public';
      if (existsSync(staticDir)) {
        cpSync(staticDir, join(outDir, 'static'), { recursive: true });
      }

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, 'static'), { recursive: true });
      }

      // Generate TypeScript types
      writeFileSync(
        join(outDir, 'types.d.ts'),
        generateTypeScriptTypes()
      );

      console.log(`Vercel build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, context?: any): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'vercel',
            edge,
            context,
            kv: kv ? createKVHelpers() : undefined,
            blob: blob ? createBlobHelpers() : undefined,
            edgeConfig: edgeConfig ? createEdgeConfigHelpers() : undefined,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  function generateConfig() {
    const routeConfig: any = {
      version: 3,
      routes: [],
    };

    // Add redirects
    if (redirects && redirects.length > 0) {
      routeConfig.routes.push(
        ...redirects.map(redirect => ({
          src: redirect.source,
          status: redirect.statusCode || (redirect.permanent ? 308 : 307),
          headers: { Location: redirect.destination },
        }))
      );
    }

    // Add headers
    if (headers && headers.length > 0) {
      routeConfig.routes.push(
        ...headers.map(header => ({
          src: header.source,
          headers: header.headers.reduce((acc, h) => {
            acc[h.key] = h.value;
            return acc;
          }, {} as Record<string, string>),
        }))
      );
    }

    // Static assets with cache headers
    routeConfig.routes.push({
      src: '/static/(.*)',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    routeConfig.routes.push({
      src: '/assets/(.*)',
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

    // Add rewrites
    if (rewrites && rewrites.length > 0) {
      routeConfig.routes.push(
        ...rewrites.map(rewrite => ({
          src: rewrite.source,
          dest: rewrite.destination,
        }))
      );
    }

    // All other routes go to the handler
    routeConfig.routes.push({
      src: '/(.*)',
      dest: edge ? '/' : '/index',
    });

    // Add images configuration
    if (images) {
      routeConfig.images = {
        domains: images.domains || [],
        formats: images.formats || ['image/webp'],
        minimumCacheTTL: images.minimumCacheTTL || 60,
        ...(images.deviceSizes && { deviceSizes: images.deviceSizes }),
        ...(images.imageSizes && { imageSizes: images.imageSizes }),
      };
    }

    // Add cron jobs
    if (crons && crons.length > 0) {
      routeConfig.crons = crons.map(cron => ({
        path: cron.path,
        schedule: cron.schedule,
      }));
    }

    return routeConfig;
  }

  async function generateMainFunction() {
    const functionDir = join(outDir, 'functions', edge ? 'index.func' : 'index.func');
    mkdirSync(functionDir, { recursive: true });

    // Generate function config
    const functionConfig: any = {
      runtime: edge ? 'edge' : `nodejs${nodeVersion}`,
      ...(regions.length > 0 && { regions }),
      ...(memory && !edge && { memory }),
      ...(maxDuration && { maxDuration }),
    };

    // Add ISR configuration
    if (isr) {
      functionConfig.isr = {
        expiration: isr.expiration || 60,
        ...(isr.allowQuery && { allowQuery: true }),
        ...(isr.bypassToken && { bypassToken: isr.bypassToken }),
      };
    }

    writeFileSync(
      join(functionDir, '.vc-config.json'),
      JSON.stringify(functionConfig, null, 2)
    );

    // Generate handler code
    const handlerCode = edge
      ? generateEdgeHandler()
      : generateServerlessHandler();

    writeFileSync(join(functionDir, 'index.js'), handlerCode);
  }

  async function generateSplitFunctions() {
    // Route splitting for better cold start performance is a planned enhancement.
    // Currently using a single function which works well for most use cases.
    // For large applications with many routes, consider manual route splitting.
    console.warn('Split routes not yet implemented, using single function');
    await generateMainFunction();
  }

  function generateEdgeHandler(): string {
    return `// PhilJS Vercel Edge Handler
// Generated by PhilJS Adapters

export const config = {
  runtime: 'edge',
  regions: ${JSON.stringify(regions)},
  ${maxDuration ? `maxDuration: ${maxDuration},` : ''}
};

export default async function handler(request, context) {
  const url = new URL(request.url);

  // Create request context
  const requestContext = {
    url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    params: {},
    platform: {
      name: 'vercel',
      edge: true,
      context,
      ${kv ? `kv: true,` : ''}
      ${blob ? `blob: true,` : ''}
      ${edgeConfig ? `edgeConfig: true,` : ''}
    },
  };

  try {
    const { handleRequest } = await import('@philjs/ssr');
    return await handleRequest(requestContext);
  } catch (error) {
    console.error('PhilJS request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
`;
  }

  function generateServerlessHandler(): string {
    return `// PhilJS Vercel Serverless Handler
// Generated by PhilJS Adapters

export default async function handler(req, res) {
  try {
    const url = new URL(req.url || '', \`https://\${req.headers.host}\`);

    // Convert Node.js request to Web API Request
    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body: ['GET', 'HEAD'].includes(req.method || '') ? null : req.body,
    });

    const requestContext = {
      url,
      method: req.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'vercel',
        edge: false,
        context: { req, res },
        ${kv ? `kv: true,` : ''}
        ${blob ? `blob: true,` : ''}
        ${edgeConfig ? `edgeConfig: true,` : ''}
      },
    };

    const { handleRequest } = await import('@philjs/ssr');
    const response = await handleRequest(requestContext);

    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Set status
    res.status(response.status);

    // Send response body
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      res.send(result);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('PhilJS request error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
`;
  }

  function generateTypeScriptTypes(): string {
    return `// PhilJS Vercel Types
// Generated by PhilJS Adapters

import type { RequestContext } from '@philjs/adapters';

declare module '@philjs/ssr' {
  interface Platform {
    name: 'vercel';
    edge: boolean;
    context?: any;
    ${kv ? 'kv?: VercelKV;' : ''}
    ${blob ? 'blob?: VercelBlob;' : ''}
    ${edgeConfig ? 'edgeConfig?: VercelEdgeConfig;' : ''}
  }
}

${kv ? `
export interface VercelKV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}
` : ''}

${blob ? `
export interface VercelBlob {
  put(pathname: string, body: ReadableStream | string, options?: BlobPutOptions): Promise<BlobObject>;
  del(url: string | string[]): Promise<void>;
  head(url: string): Promise<BlobObject | null>;
  list(options?: BlobListOptions): Promise<BlobListResult>;
}

export interface BlobPutOptions {
  access?: 'public' | 'private';
  contentType?: string;
  addRandomSuffix?: boolean;
}

export interface BlobObject {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
}

export interface BlobListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface BlobListResult {
  blobs: BlobObject[];
  cursor?: string;
  hasMore: boolean;
}
` : ''}

${edgeConfig ? `
export interface VercelEdgeConfig {
  get<T = any>(key: string): Promise<T | undefined>;
  has(key: string): Promise<boolean>;
  getAll<T = Record<string, any>>(): Promise<T>;
}
` : ''}

export {};
`;
  }

  function createKVHelpers() {
    return {
      async get(key: string) {
        const { get } = await import('@vercel/kv');
        return get(key);
      },
      async set(key: string, value: string, options?: { ex?: number; px?: number }) {
        const { set } = await import('@vercel/kv');
        return set(key, value, options);
      },
      async del(...keys: string[]) {
        const { del } = await import('@vercel/kv');
        return del(...keys);
      },
      async incr(key: string) {
        const { incr } = await import('@vercel/kv');
        return incr(key);
      },
    };
  }

  function createBlobHelpers() {
    return {
      async put(pathname: string, body: ReadableStream | string, options?: any) {
        const { put } = await import('@vercel/blob');
        return put(pathname, body, options);
      },
      async del(url: string | string[]) {
        const { del } = await import('@vercel/blob');
        return del(url);
      },
      async head(url: string) {
        const { head } = await import('@vercel/blob');
        return head(url);
      },
      async list(options?: any) {
        const { list } = await import('@vercel/blob');
        return list(options);
      },
    };
  }

  function createEdgeConfigHelpers() {
    return {
      async get<T = any>(key: string): Promise<T | undefined> {
        const { get } = await import('@vercel/edge-config');
        return get(key);
      },
      async has(key: string): Promise<boolean> {
        const { has } = await import('@vercel/edge-config');
        return has(key);
      },
      async getAll<T = Record<string, any>>(): Promise<T> {
        const { getAll } = await import('@vercel/edge-config');
        return getAll();
      },
    };
  }
}

// Vercel-specific utilities
export async function revalidatePath(path: string, type: 'page' | 'layout' = 'page') {
  const response = await fetch(`/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, type }),
  });

  if (!response.ok) {
    throw new Error(`Failed to revalidate path: ${path}`);
  }

  return response.json();
}

export async function revalidateTag(tag: string) {
  const response = await fetch(`/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag }),
  });

  if (!response.ok) {
    throw new Error(`Failed to revalidate tag: ${tag}`);
  }

  return response.json();
}

export function createVercelEdgeConfig(options: {
  regions?: string[];
  maxDuration?: number;
} = {}) {
  return {
    runtime: 'edge',
    regions: options.regions || ['iad1'],
    maxDuration: options.maxDuration || 30,
  };
}

export default vercelAdapter;
