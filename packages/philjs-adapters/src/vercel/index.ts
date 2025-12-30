/**
 * PhilJS Vercel Adapter
 *
 * Zero-config deployment to Vercel with Edge and Serverless support
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types.js';

export interface VercelConfig extends AdapterConfig {
  /** Use Edge Runtime (default: false, uses Node.js) */
  edge?: boolean;
  /** Vercel regions to deploy to */
  regions?: string[];
  /** Memory limit in MB (default: 1024) */
  memory?: number;
  /** Max duration in seconds (default: 10 for edge, 60 for serverless) */
  maxDuration?: number;
  /** Enable Incremental Static Regeneration */
  isr?: {
    /** Revalidation time in seconds */
    revalidate?: number;
    /** Bypass token for on-demand revalidation */
    bypassToken?: string;
  };
  /** Enable Image Optimization */
  images?: {
    domains?: string[];
    formats?: ('image/avif' | 'image/webp')[];
    minimumCacheTTL?: number;
  };
  /** Cron jobs */
  crons?: Array<{
    path: string;
    schedule: string;
  }>;
}

export function vercelAdapter(config: VercelConfig = {}): Adapter & Partial<EdgeAdapter> {
  const {
    outDir = '.vercel/output',
    edge = false,
    regions = ['iad1'],
    memory = 1024,
    maxDuration = edge ? 30 : 60,
    isr,
    images,
    crons,
    sourceMaps = true,
  } = config;

  return {
    name: 'vercel',
    edge,

    async adapt() {
      console.log('Building for Vercel...');

      // Create output structure
      mkdirSync(join(outDir, 'functions'), { recursive: true });
      mkdirSync(join(outDir, 'static'), { recursive: true });

      // Generate config.json
      const vercelConfig = {
        version: 3,
        routes: [
          // Static assets
          {
            src: '/static/(.*)',
            headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          },
          // API routes
          {
            src: '/api/(.*)',
            dest: '/api/$1',
          },
          // All other routes go to the handler
          {
            src: '/(.*)',
            dest: edge ? '/' : '/index',
          },
        ],
        ...(images && { images }),
        ...(crons && { crons }),
      };

      writeFileSync(
        join(outDir, 'config.json'),
        JSON.stringify(vercelConfig, null, 2)
      );

      // Generate function config
      const functionConfig = {
        runtime: edge ? 'edge' : 'nodejs20.x',
        ...(regions.length > 0 && { regions }),
        ...(memory && !edge && { memory }),
        ...(maxDuration && { maxDuration }),
        ...(isr && {
          isr: {
            expiration: isr.revalidate || 60,
            ...(isr.bypassToken && { bypassToken: isr.bypassToken }),
          }
        }),
      };

      // Create main function
      const functionDir = edge
        ? join(outDir, 'functions', 'index.func')
        : join(outDir, 'functions', 'index.func');

      mkdirSync(functionDir, { recursive: true });

      writeFileSync(
        join(functionDir, '.vc-config.json'),
        JSON.stringify(functionConfig, null, 2)
      );

      // Generate handler code
      const handlerCode = edge
        ? generateEdgeHandler()
        : generateServerlessHandler();

      writeFileSync(join(functionDir, 'index.js'), handlerCode);

      // Copy static assets
      const staticDir = config.static?.assets || 'public';
      if (existsSync(staticDir)) {
        cpSync(staticDir, join(outDir, 'static'), { recursive: true });
      }

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, 'static'), { recursive: true });
      }

      console.log(`Vercel build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, context?: unknown): Promise<Response> => {
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
          },
        };

        // Import and call the app handler
        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };
}

function generateEdgeHandler(): string {
  return `
// PhilJS Vercel Edge Handler
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(request.url);

  const context = {
    url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    params: {},
    platform: { name: 'vercel', edge: true },
  };

  return handleRequest(context);
}
`;
}

function generateServerlessHandler(): string {
  return `
// PhilJS Vercel Serverless Handler
export default async function handler(req, res) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(req.url, \`https://\${req.headers.host}\`);

  const context = {
    url,
    method: req.method,
    headers: new Headers(req.headers),
    body: req.body,
    params: {},
    platform: { name: 'vercel', edge: false },
  };

  const response = await handleRequest(context);

  // Set response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.status(response.status);

  const body = await response.text();
  res.send(body);
}
`;
}

// Export utilities for Vercel-specific features
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

export function revalidatePath(path: string, options?: { type?: 'page' | 'layout' }) {
  // This would call Vercel's revalidation API
  return fetch(`/api/revalidate?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: options?.type || 'page' }),
  });
}

export function revalidateTag(tag: string) {
  return fetch(`/api/revalidate?tag=${encodeURIComponent(tag)}`, {
    method: 'POST',
  });
}

export default vercelAdapter;
