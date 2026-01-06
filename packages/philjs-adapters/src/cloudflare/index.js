/**
 * PhilJS Cloudflare Adapter
 *
 * Deploy to Cloudflare Workers and Pages
 */
import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
export function cloudflareAdapter(config = {}) {
    const { outDir = '.cloudflare', mode = 'pages', sites = false, kv = [], durableObjects = [], r2 = [], d1 = [], vars = {}, compatibilityDate = '2024-01-01', compatibilityFlags = [], routes = [], } = config;
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
            }
            else {
                await adaptForWorkers();
            }
        },
        getHandler() {
            return async (request, env) => {
                const url = new URL(request.url);
                const requestContext = {
                    url,
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                    params: {},
                    platform: {
                        name: 'cloudflare',
                        edge: true,
                        env, // KV, R2, D1, etc. bindings
                        ctx: globalThis.ctx, // ExecutionContext
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
        writeFileSync(join(outDir, '_worker.js'), generatePagesWorker());
        // Generate _routes.json for static asset handling
        writeFileSync(join(outDir, '_routes.json'), JSON.stringify({
            version: 1,
            include: ['/*'],
            exclude: ['/static/*', '/assets/*', '/_philjs/*'],
        }, null, 2));
        // Generate wrangler.toml for local development
        writeFileSync(join(outDir, 'wrangler.toml'), generateWranglerToml({ mode: 'pages', kv, durableObjects, r2, d1, vars, compatibilityDate, compatibilityFlags }));
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
        writeFileSync(join(outDir, 'worker.js'), generateWorkerScript(sites));
        // Generate wrangler.toml
        writeFileSync(join(outDir, 'wrangler.toml'), generateWranglerToml({ mode: 'workers', kv, durableObjects, r2, d1, vars, compatibilityDate, compatibilityFlags, sites, routes }));
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
function generatePagesWorker() {
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
function generateWorkerScript(useSites) {
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
function generateWranglerToml(options) {
    const lines = [
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
export function getCloudflareEnv() {
    return globalThis.env;
}
export function getExecutionContext() {
    return globalThis.ctx;
}
export function waitUntil(promise) {
    const ctx = getExecutionContext();
    if (ctx?.waitUntil) {
        ctx.waitUntil(promise);
    }
}
// KV helpers
export function createKVHelper(namespace) {
    return {
        get: (key) => namespace.get(key),
        getJSON: (key) => namespace.get(key, 'json'),
        put: (key, value, options) => namespace.put(key, value, options),
        delete: (key) => namespace.delete(key),
        list: (options) => namespace.list(options),
    };
}
export default cloudflareAdapter;
//# sourceMappingURL=index.js.map