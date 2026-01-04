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
import { createBuildManifest, copyStaticAssets, optimizeAssets } from '../utils/build.js';
import { injectEnvVariables, loadEnvFile } from '../utils/env.js';
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
export function vercelAdapter(config = {}) {
    const { outDir = '.vercel/output', edge = false, regions = ['iad1'], memory = 1024, maxDuration = edge ? 30 : 60, isr, images, crons, middleware, headers = [], redirects = [], rewrites = [], functions = [], streaming = true, buildOutput = edge ? 'edge' : 'serverless', generateConfig = true, projectSettings, sourceMaps = true, } = config;
    const edgeConfig = edge ? {
        regions: regions,
        maxDuration,
    } : undefined;
    return {
        name: 'vercel',
        edge,
        ...(edgeConfig !== undefined ? { edgeConfig } : {}),
        async adapt() {
            console.log(`Building for Vercel (${buildOutput})...`);
            // Create output structure following Vercel Build Output API v3
            mkdirSync(join(outDir, 'functions'), { recursive: true });
            mkdirSync(join(outDir, 'static'), { recursive: true });
            // Load environment variables
            const envVars = loadEnvFile('.env.production') || loadEnvFile('.env') || {};
            // Generate config.json (Build Output API)
            const outputConfig = generateOutputConfig();
            writeFileSync(join(outDir, 'config.json'), JSON.stringify(outputConfig, null, 2));
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
            writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
            console.log(`Vercel build complete: ${outDir}`);
        },
        getHandler() {
            return async (request, context) => {
                const url = new URL(request.url);
                const requestContext = {
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
    function generateOutputConfig() {
        const routes = [];
        // Static asset routes
        routes.push({
            src: '/static/(.*)',
            headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
        });
        // Apply custom headers
        for (const header of headers) {
            routes.push({
                src: header.source,
                headers: Object.fromEntries(header.headers.map(h => [h.key, h.value])),
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
    async function generateMainFunction() {
        const functionDir = join(outDir, 'functions', 'index.func');
        mkdirSync(functionDir, { recursive: true });
        // Function configuration
        const functionConfig = {
            runtime: edge ? 'edge' : 'nodejs20.x',
            handler: 'index.handler',
            launcherType: 'Nodejs',
        };
        if (regions.length > 0 && !regions.includes('all')) {
            functionConfig['regions'] = regions;
        }
        if (!edge && memory) {
            functionConfig['memory'] = memory;
        }
        if (maxDuration) {
            functionConfig['maxDuration'] = maxDuration;
        }
        // ISR configuration
        if (isr) {
            functionConfig['supportsResponseStreaming'] = streaming;
        }
        writeFileSync(join(functionDir, '.vc-config.json'), JSON.stringify(functionConfig, null, 2));
        // Generate handler code
        const handlerCode = edge
            ? generateEdgeHandler()
            : generateServerlessHandler();
        writeFileSync(join(functionDir, 'index.js'), handlerCode);
    }
    /**
     * Generate API route functions
     */
    async function generateAPIRoutes() {
        const apiDir = 'src/api';
        if (!existsSync(apiDir))
            return;
        // Scan API routes and generate functions
        // This would be expanded in a full implementation
    }
    /**
     * Generate middleware function
     */
    async function generateMiddleware() {
        if (!middleware)
            return;
        const middlewareDir = join(outDir, 'functions', '_middleware.func');
        mkdirSync(middlewareDir, { recursive: true });
        const middlewareConfig = {
            runtime: 'edge',
            entrypoint: 'index.js',
        };
        writeFileSync(join(middlewareDir, '.vc-config.json'), JSON.stringify(middlewareConfig, null, 2));
        const middlewareCode = generateMiddlewareHandler();
        writeFileSync(join(middlewareDir, 'index.js'), middlewareCode);
    }
    /**
     * Generate ISR prerendered pages
     */
    async function generateISRPages() {
        if (!isr?.paths)
            return;
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
    function generateVercelJson() {
        const config = {
            version: 2,
        };
        // Project settings
        if (projectSettings) {
            if (projectSettings.buildCommand)
                config.buildCommand = projectSettings.buildCommand;
            if (projectSettings.outputDirectory)
                config.outputDirectory = projectSettings.outputDirectory;
            if (projectSettings.installCommand)
                config.installCommand = projectSettings.installCommand;
            if (projectSettings.devCommand)
                config.devCommand = projectSettings.devCommand;
            if (projectSettings.framework)
                config.framework = projectSettings.framework;
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
                const fnConfig = {
                    runtime: fn.runtime === 'edge' ? 'edge' : 'nodejs20.x',
                };
                if (fn.memory !== undefined) {
                    fnConfig.memory = fn.memory;
                }
                if (fn.maxDuration !== undefined) {
                    fnConfig.maxDuration = fn.maxDuration;
                }
                if (fn.regions !== undefined) {
                    fnConfig.regions = fn.regions;
                }
                config.functions[fn.pattern] = fnConfig;
            }
        }
        return config;
    }
    /**
     * Generate Edge Runtime handler code
     */
    function generateEdgeHandler() {
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
    function generateServerlessHandler() {
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
    function generateMiddlewareHandler() {
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
export function createVercelEdgeConfig(options = {}) {
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
export async function revalidatePath(path, options) {
    const params = new URLSearchParams({
        path,
        ...(options?.type && { type: options.type }),
    });
    const headers = {
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
export async function revalidateTag(tag, options) {
    const headers = {
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
export function getVercelContext() {
    return {
        geo: globalThis.__VERCEL_GEO__,
        ip: globalThis.__VERCEL_IP__,
        isEdge: typeof globalThis.EdgeRuntime !== 'undefined',
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
export function vercelImageUrl(src, options = {}) {
    const params = new URLSearchParams({
        url: src,
        ...(options.width && { w: String(options.width) }),
        ...(options.height && { h: String(options.height) }),
        ...(options.quality && { q: String(options.quality) }),
    });
    return `/_vercel/image?${params}`;
}
export default vercelAdapter;
//# sourceMappingURL=vercel.js.map