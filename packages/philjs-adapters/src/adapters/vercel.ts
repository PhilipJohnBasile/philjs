/**
 * PhilJS Vercel Adapter
 *
 * Production-ready deployment adapter for Vercel with:
 * - Edge Functions support
 * - Serverless Functions
 * - Incremental Static Regeneration (ISR)
 * - Image Optimization integration
 * - vercel.json generation
 * - Cron jobs support
 * - Middleware support
 *
 * @module philjs-adapters/adapters/vercel
 */

import { writeFileSync, mkdirSync, cpSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types';
import { createBuildManifest, copyStaticAssets, optimizeAssets } from '../utils/build';
import { injectEnvVariables, loadEnvFile } from '../utils/env';

/**
 * Configuration options for the Vercel adapter
 */
export interface VercelAdapterConfig extends AdapterConfig {
  /** Use Edge Runtime (default: false, uses Node.js serverless) */
  edge?: boolean;

  /** Vercel deployment regions */
  regions?: VercelRegion[];

  /** Memory limit in MB (128-3008, default: 1024) */
  memory?: number;

  /** Max duration in seconds (edge: 30s max, serverless: 60s max) */
  maxDuration?: number;

  /** Incremental Static Regeneration configuration */
  isr?: ISRConfig;

  /** Image Optimization configuration */
  images?: ImageOptimizationConfig;

  /** Cron jobs configuration */
  crons?: CronConfig[];

  /** Middleware configuration */
  middleware?: MiddlewareConfig;

  /** Custom headers */
  headers?: HeaderConfig[];

  /** Redirects configuration */
  redirects?: RedirectConfig[];

  /** Rewrites configuration */
  rewrites?: RewriteConfig[];

  /** Function configuration per route */
  functions?: FunctionRouteConfig[];

  /** Enable response streaming (Edge only) */
  streaming?: boolean;

  /** Build output mode */
  buildOutput?: 'serverless' | 'edge' | 'hybrid';

  /** Generate vercel.json */
  generateConfig?: boolean;

  /** Project settings */
  projectSettings?: {
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
    devCommand?: string;
  };
}

/**
 * Vercel deployment regions
 */
export type VercelRegion =
  | 'arn1'  // Stockholm
  | 'bom1'  // Mumbai
  | 'cdg1'  // Paris
  | 'cle1'  // Cleveland
  | 'cpt1'  // Cape Town
  | 'dub1'  // Dublin
  | 'fra1'  // Frankfurt
  | 'gru1'  // Sao Paulo
  | 'hkg1'  // Hong Kong
  | 'hnd1'  // Tokyo
  | 'iad1'  // Washington D.C.
  | 'icn1'  // Seoul
  | 'kix1'  // Osaka
  | 'lhr1'  // London
  | 'pdx1'  // Portland
  | 'sfo1'  // San Francisco
  | 'sin1'  // Singapore
  | 'syd1'  // Sydney
  | 'all';  // All regions

/**
 * ISR (Incremental Static Regeneration) configuration
 */
export interface ISRConfig {
  /** Revalidation time in seconds */
  revalidate?: number;
  /** Bypass token for on-demand revalidation */
  bypassToken?: string;
  /** Paths to prerender */
  paths?: string[];
  /** Fallback behavior: 'blocking' | 'true' | 'false' */
  fallback?: 'blocking' | boolean;
  /** Tags for cache invalidation */
  tags?: string[];
}

/**
 * Image Optimization configuration
 */
export interface ImageOptimizationConfig {
  /** Allowed image domains */
  domains?: string[];
  /** Remote patterns for images */
  remotePatterns?: Array<{
    protocol?: 'http' | 'https';
    hostname: string;
    port?: string;
    pathname?: string;
  }>;
  /** Supported image formats */
  formats?: ('image/avif' | 'image/webp')[];
  /** Minimum cache TTL in seconds */
  minimumCacheTTL?: number;
  /** Device sizes for responsive images */
  deviceSizes?: number[];
  /** Image sizes for srcset */
  imageSizes?: number[];
  /** Enable dangerous SVG allow */
  dangerouslyAllowSVG?: boolean;
  /** Content security policy for images */
  contentSecurityPolicy?: string;
}

/**
 * Cron job configuration
 */
export interface CronConfig {
  /** API route path */
  path: string;
  /** Cron schedule expression */
  schedule: string;
}

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  /** Matcher patterns for middleware */
  matcher?: string[];
  /** Skip patterns */
  skip?: string[];
  /** Enable geolocation */
  geo?: boolean;
  /** Enable request IP */
  ip?: boolean;
}

/**
 * Header configuration
 */
export interface HeaderConfig {
  /** Source path pattern */
  source: string;
  /** Headers to add */
  headers: Array<{ key: string; value: string }>;
  /** Has condition */
  has?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
  /** Missing condition */
  missing?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
}

/**
 * Redirect configuration
 */
export interface RedirectConfig {
  /** Source path pattern */
  source: string;
  /** Destination path */
  destination: string;
  /** HTTP status code (301, 302, 307, 308) */
  statusCode?: 301 | 302 | 307 | 308;
  /** Permanent redirect */
  permanent?: boolean;
  /** Has condition */
  has?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
}

/**
 * Rewrite configuration
 */
export interface RewriteConfig {
  /** Source path pattern */
  source: string;
  /** Destination path or URL */
  destination: string;
  /** Has condition */
  has?: Array<{
    type: 'header' | 'cookie' | 'host' | 'query';
    key: string;
    value?: string;
  }>;
}

/**
 * Per-route function configuration
 */
export interface FunctionRouteConfig {
  /** Route pattern */
  pattern: string;
  /** Runtime: 'edge' or 'nodejs' */
  runtime?: 'edge' | 'nodejs';
  /** Memory in MB */
  memory?: number;
  /** Max duration in seconds */
  maxDuration?: number;
  /** Regions */
  regions?: VercelRegion[];
}

/**
 * Vercel.json configuration structure
 */
interface VercelJsonConfig {
  version?: number;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  framework?: string;
  regions?: string[];
  images?: ImageOptimizationConfig;
  crons?: CronConfig[];
  headers?: HeaderConfig[];
  redirects?: RedirectConfig[];
  rewrites?: RewriteConfig[];
  functions?: Record<string, {
    runtime?: string;
    memory?: number;
    maxDuration?: number;
    regions?: string[];
  }>;
}

/**
 * Create a Vercel deployment adapter
 *
 * @example
 * ```typescript
 * import { vercelAdapter } from 'philjs-adapters/adapters/vercel';
 *
 * export default defineConfig({
 *   adapter: vercelAdapter({
 *     edge: true,
 *     regions: ['iad1', 'sfo1'],
 *     isr: {
 *       revalidate: 60,
 *       paths: ['/blog/*'],
 *     },
 *     images: {
 *       domains: ['images.example.com'],
 *       formats: ['image/avif', 'image/webp'],
 *     },
 *   }),
 * });
 * ```
 */
export function vercelAdapter(config: VercelAdapterConfig = {}): Adapter & Partial<EdgeAdapter> {
  const {
    outDir = '.vercel/output',
    edge = false,
    regions = ['iad1'],
    memory = 1024,
    maxDuration = edge ? 30 : 60,
    isr,
    images,
    crons,
    middleware,
    headers = [],
    redirects = [],
    rewrites = [],
    functions = [],
    streaming = true,
    buildOutput = edge ? 'edge' : 'serverless',
    generateConfig = true,
    projectSettings,
    sourceMaps = true,
  } = config;

  return {
    name: 'vercel',
    edge,
    edgeConfig: edge ? {
      regions: regions as string[],
      maxDuration,
    } : undefined,

    async adapt() {
      console.log(`Building for Vercel (${buildOutput})...`);

      // Create output structure following Vercel Build Output API v3
      mkdirSync(join(outDir, 'functions'), { recursive: true });
      mkdirSync(join(outDir, 'static'), { recursive: true });

      // Load environment variables
      const envVars = loadEnvFile('.env.production') || loadEnvFile('.env') || {};

      // Generate config.json (Build Output API)
      const outputConfig = generateOutputConfig();
      writeFileSync(
        join(outDir, 'config.json'),
        JSON.stringify(outputConfig, null, 2)
      );

      // Generate main function
      await generateMainFunction();

      // Generate API routes
      await generateAPIRoutes();

      // Generate middleware if configured
      if (middleware) {
        await generateMiddleware();
      }

      // Copy static assets
      await copyStaticAssets(config.static?.assets || 'public', join(outDir, 'static'));

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, 'static'), { recursive: true });
      }

      // Generate ISR pages if configured
      if (isr?.paths) {
        await generateISRPages();
      }

      // Generate vercel.json for the project root
      if (generateConfig) {
        const vercelJson = generateVercelJson();
        writeFileSync('vercel.json', JSON.stringify(vercelJson, null, 2));
      }

      // Generate build manifest
      const manifest = await createBuildManifest({
        adapter: 'vercel',
        outputDir: outDir,
        routes: [],
      });
      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

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
            regions,
            streaming,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  /**
   * Generate Build Output API config.json
   */
  function generateOutputConfig(): object {
    const routes: object[] = [];

    // Static asset routes
    routes.push({
      src: '/static/(.*)',
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });

    // Apply custom headers
    for (const header of headers) {
      routes.push({
        src: header.source,
        headers: Object.fromEntries(
          header.headers.map(h => [h.key, h.value])
        ),
        has: header.has,
        missing: header.missing,
      });
    }

    // Apply redirects
    for (const redirect of redirects) {
      routes.push({
        src: redirect.source,
        status: redirect.statusCode || (redirect.permanent ? 308 : 307),
        headers: { Location: redirect.destination },
        has: redirect.has,
      });
    }

    // Apply rewrites
    for (const rewrite of rewrites) {
      routes.push({
        src: rewrite.source,
        dest: rewrite.destination,
        has: rewrite.has,
      });
    }

    // API routes
    routes.push({
      src: '/api/(.*)',
      dest: '/api/$1',
    });

    // Catch-all route to main handler
    routes.push({
      src: '/(.*)',
      dest: edge ? '/' : '/index',
    });

    return {
      version: 3,
      routes,
      ...(images && { images }),
      ...(crons && { crons }),
    };
  }

  /**
   * Generate main function handler
   */
  async function generateMainFunction(): Promise<void> {
    const functionDir = join(outDir, 'functions', 'index.func');
    mkdirSync(functionDir, { recursive: true });

    // Function configuration
    const functionConfig: Record<string, unknown> = {
      runtime: edge ? 'edge' : 'nodejs20.x',
      handler: 'index.handler',
      launcherType: 'Nodejs',
    };

    if (regions.length > 0 && !regions.includes('all')) {
      functionConfig.regions = regions;
    }

    if (!edge && memory) {
      functionConfig.memory = memory;
    }

    if (maxDuration) {
      functionConfig.maxDuration = maxDuration;
    }

    // ISR configuration
    if (isr) {
      (functionConfig as Record<string, unknown>).supportsResponseStreaming = streaming;
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

  /**
   * Generate API route functions
   */
  async function generateAPIRoutes(): Promise<void> {
    const apiDir = 'src/api';
    if (!existsSync(apiDir)) return;

    // Scan API routes and generate functions
    // This would be expanded in a full implementation
  }

  /**
   * Generate middleware function
   */
  async function generateMiddleware(): Promise<void> {
    if (!middleware) return;

    const middlewareDir = join(outDir, 'functions', '_middleware.func');
    mkdirSync(middlewareDir, { recursive: true });

    const middlewareConfig = {
      runtime: 'edge',
      entrypoint: 'index.js',
    };

    writeFileSync(
      join(middlewareDir, '.vc-config.json'),
      JSON.stringify(middlewareConfig, null, 2)
    );

    const middlewareCode = generateMiddlewareHandler();
    writeFileSync(join(middlewareDir, 'index.js'), middlewareCode);
  }

  /**
   * Generate ISR prerendered pages
   */
  async function generateISRPages(): Promise<void> {
    if (!isr?.paths) return;

    for (const pathPattern of isr.paths) {
      // Generate prerender config for each ISR path
      const prerenderConfig = {
        expiration: isr.revalidate || 60,
        bypassToken: isr.bypassToken,
        allowQuery: ['slug', 'id'],
      };

      // This would be expanded to handle dynamic paths
    }
  }

  /**
   * Generate vercel.json configuration
   */
  function generateVercelJson(): VercelJsonConfig {
    const config: VercelJsonConfig = {
      version: 2,
    };

    // Project settings
    if (projectSettings) {
      if (projectSettings.buildCommand) config.buildCommand = projectSettings.buildCommand;
      if (projectSettings.outputDirectory) config.outputDirectory = projectSettings.outputDirectory;
      if (projectSettings.installCommand) config.installCommand = projectSettings.installCommand;
      if (projectSettings.devCommand) config.devCommand = projectSettings.devCommand;
      if (projectSettings.framework) config.framework = projectSettings.framework;
    }

    // Regions
    if (regions.length > 0 && !regions.includes('all')) {
      config.regions = regions;
    }

    // Images
    if (images) {
      config.images = images;
    }

    // Crons
    if (crons && crons.length > 0) {
      config.crons = crons;
    }

    // Headers
    if (headers.length > 0) {
      config.headers = headers;
    }

    // Redirects
    if (redirects.length > 0) {
      config.redirects = redirects;
    }

    // Rewrites
    if (rewrites.length > 0) {
      config.rewrites = rewrites;
    }

    // Per-route function configuration
    if (functions.length > 0) {
      config.functions = {};
      for (const fn of functions) {
        config.functions[fn.pattern] = {
          runtime: fn.runtime === 'edge' ? 'edge' : 'nodejs20.x',
          memory: fn.memory,
          maxDuration: fn.maxDuration,
          regions: fn.regions,
        };
      }
    }

    return config;
  }

  /**
   * Generate Edge Runtime handler code
   */
  function generateEdgeHandler(): string {
    return `// PhilJS Vercel Edge Handler
// Generated by PhilJS Adapters

export const config = {
  runtime: 'edge',
  regions: ${JSON.stringify(regions)},
  ${streaming ? 'supportsResponseStreaming: true,' : ''}
};

export default async function handler(request, event) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(request.url);

  const context = {
    url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    params: {},
    platform: {
      name: 'vercel',
      edge: true,
      event,
      waitUntil: event?.waitUntil?.bind(event),
      ${isr ? `isr: { revalidate: ${isr.revalidate || 60} },` : ''}
    },
  };

  try {
    const response = await handleRequest(context);
    ${streaming ? `
    // Stream the response if body is a ReadableStream
    if (response.body instanceof ReadableStream) {
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }
    ` : ''}
    return response;
  } catch (error) {
    console.error('PhilJS request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
`;
  }

  /**
   * Generate Serverless handler code
   */
  function generateServerlessHandler(): string {
    return `// PhilJS Vercel Serverless Handler
// Generated by PhilJS Adapters

export default async function handler(req, res) {
  const { handleRequest } = await import('@philjs/ssr');

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = new URL(req.url, \`\${protocol}://\${host}\`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  const context = {
    url,
    method: req.method,
    headers,
    body: req.body ? new ReadableStream({
      start(controller) {
        controller.enqueue(
          typeof req.body === 'string'
            ? new TextEncoder().encode(req.body)
            : req.body
        );
        controller.close();
      }
    }) : null,
    params: {},
    platform: {
      name: 'vercel',
      edge: false,
      req,
      res,
      ${isr ? `isr: { revalidate: ${isr.revalidate || 60} },` : ''}
    },
  };

  try {
    const response = await handleRequest(context);

    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // Handle streaming response
    if (response.body instanceof ReadableStream) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      const body = await response.text();
      res.send(body);
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

  /**
   * Generate middleware handler code
   */
  function generateMiddlewareHandler(): string {
    return `// PhilJS Vercel Middleware
// Generated by PhilJS Adapters

import { NextResponse } from 'next/server';

export const config = {
  matcher: ${JSON.stringify(middleware?.matcher || ['/((?!api|_next/static|_next/image|favicon.ico).*)'])},
};

export default async function middleware(request) {
  const url = new URL(request.url);
  ${middleware?.geo ? `
  // Geolocation data
  const geo = {
    country: request.geo?.country,
    region: request.geo?.region,
    city: request.geo?.city,
    latitude: request.geo?.latitude,
    longitude: request.geo?.longitude,
  };
  ` : ''}
  ${middleware?.ip ? `
  // Client IP
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0];
  ` : ''}

  // Continue to the next handler
  return NextResponse.next();
}
`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create Vercel Edge config export for API routes
 *
 * @example
 * ```typescript
 * // In your API route
 * export const config = createVercelEdgeConfig({
 *   regions: ['iad1', 'sfo1'],
 *   maxDuration: 30,
 * });
 * ```
 */
export function createVercelEdgeConfig(options: {
  regions?: VercelRegion[];
  maxDuration?: number;
  streaming?: boolean;
} = {}): object {
  return {
    runtime: 'edge',
    regions: options.regions || ['iad1'],
    maxDuration: options.maxDuration || 30,
    ...(options.streaming !== false && { supportsResponseStreaming: true }),
  };
}

/**
 * Trigger on-demand revalidation for a path
 *
 * @example
 * ```typescript
 * // In an API route
 * await revalidatePath('/blog/my-post');
 * ```
 */
export async function revalidatePath(
  path: string,
  options?: {
    type?: 'page' | 'layout';
    secret?: string;
  }
): Promise<Response> {
  const params = new URLSearchParams({
    path,
    ...(options?.type && { type: options.type }),
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options?.secret) {
    headers['x-vercel-revalidate'] = options.secret;
  }

  return fetch(`/api/revalidate?${params}`, {
    method: 'POST',
    headers,
  });
}

/**
 * Trigger revalidation by cache tag
 *
 * @example
 * ```typescript
 * // In an API route
 * await revalidateTag('blog-posts');
 * ```
 */
export async function revalidateTag(
  tag: string,
  options?: { secret?: string }
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options?.secret) {
    headers['x-vercel-revalidate'] = options.secret;
  }

  return fetch(`/api/revalidate?tag=${encodeURIComponent(tag)}`, {
    method: 'POST',
    headers,
  });
}

/**
 * Get Vercel-specific request context
 */
export function getVercelContext(): {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
  ip?: string;
  isEdge: boolean;
} {
  const headers = typeof Headers !== 'undefined' ? new Headers() : null;

  return {
    geo: (globalThis as any).__VERCEL_GEO__,
    ip: (globalThis as any).__VERCEL_IP__,
    isEdge: typeof EdgeRuntime !== 'undefined',
  };
}

/**
 * Create an image URL using Vercel's Image Optimization
 *
 * @example
 * ```typescript
 * const optimizedUrl = vercelImageUrl('https://example.com/image.jpg', {
 *   width: 800,
 *   quality: 80,
 * });
 * ```
 */
export function vercelImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  const params = new URLSearchParams({
    url: src,
    ...(options.width && { w: String(options.width) }),
    ...(options.height && { h: String(options.height) }),
    ...(options.quality && { q: String(options.quality) }),
  });

  return `/_vercel/image?${params}`;
}

export default vercelAdapter;
