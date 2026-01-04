/**
 * PhilJS Deno 2 Adapter
 *
 * Deploy PhilJS applications using Deno's native server
 *
 * Features:
 * - Deno.serve() integration
 * - Deno KV for caching
 * - Deno Deploy ready
 * - Permission-aware
 * - npm compatibility mode
 */
import { isDeno } from '../runtime-detect.js';
// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
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
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.wasm': 'application/wasm',
    '.ts': 'text/typescript',
    '.tsx': 'text/tsx',
};
// KV instance cache
let kvInstance = null;
/**
 * Get or create a Deno KV instance
 */
async function getKvInstance(path) {
    if (!isDeno())
        return null;
    if (kvInstance)
        return kvInstance;
    try {
        const Deno = globalThis.Deno;
        kvInstance = await Deno.openKv(path);
        return kvInstance;
    }
    catch (error) {
        console.warn('Deno KV is not available:', error);
        return null;
    }
}
/**
 * Create a Deno adapter handler for PhilJS
 *
 * @example
 * ```typescript
 * import { createDenoAdapter } from 'philjs-adapters/deno';
 *
 * const handler = createDenoAdapter({
 *   app: philJSApp,
 *   port: 8000,
 * });
 *
 * // Deno.serve compatible
 * Deno.serve(handler);
 * ```
 */
export function createDenoAdapter(config = {}) {
    const { port = 8000, hostname = '0.0.0.0', kv = false, staticDir = 'public', compression = true, deploy, onError, } = config;
    const development = globalThis.Deno?.env?.get('DENO_ENV') !== 'production';
    /**
     * Check if we have permission to read a file
     */
    async function hasReadPermission(path) {
        if (!isDeno())
            return false;
        const Deno = globalThis.Deno;
        try {
            const status = await Deno.permissions.query({ name: 'read', path });
            return status.state === 'granted';
        }
        catch {
            return true; // Assume permission if query fails (older Deno versions)
        }
    }
    /**
     * Try to serve a static file
     */
    async function tryServeStatic(pathname) {
        if (!isDeno())
            return null;
        const Deno = globalThis.Deno;
        const staticDirs = [staticDir, 'dist/client', '.philjs/prerendered'];
        for (const dir of staticDirs) {
            const filePath = `${Deno.cwd()}/${dir}${pathname}`;
            // Check permission first
            if (!(await hasReadPermission(filePath))) {
                continue;
            }
            try {
                const file = await Deno.open(filePath, { read: true });
                const stat = await file.stat();
                if (stat.isFile) {
                    const ext = pathname.substring(pathname.lastIndexOf('.'));
                    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                    const headers = {
                        'Content-Type': contentType,
                        'Content-Length': String(stat.size),
                        'Cache-Control': development
                            ? 'no-cache'
                            : 'public, max-age=31536000, immutable',
                    };
                    // Add ETag for caching
                    if (stat.mtime) {
                        headers['ETag'] = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
                    }
                    return new Response(file.readable, { headers });
                }
                file.close();
            }
            catch {
                // File doesn't exist or can't be read, continue to next directory
            }
        }
        return null;
    }
    /**
     * Compress response body if applicable
     */
    async function maybeCompress(response) {
        if (!compression)
            return response;
        if (!isDeno())
            return response;
        const contentType = response.headers.get('Content-Type') || '';
        if (!contentType.includes('text/') && !contentType.includes('application/json')) {
            return response;
        }
        try {
            const body = await response.text();
            const encoded = new TextEncoder().encode(body);
            // Use CompressionStream if available
            if (typeof CompressionStream !== 'undefined') {
                const stream = new Blob([encoded]).stream();
                const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
                const compressedBlob = await new Response(compressedStream).blob();
                const compressedArray = await compressedBlob.arrayBuffer();
                return new Response(compressedArray, {
                    status: response.status,
                    headers: {
                        ...Object.fromEntries(response.headers.entries()),
                        'Content-Encoding': 'gzip',
                        'Content-Length': String(compressedArray.byteLength),
                    },
                });
            }
        }
        catch {
            // Compression failed, return original
        }
        return response;
    }
    /**
     * Main request handler compatible with Deno.serve()
     */
    async function handler(request, info) {
        const url = new URL(request.url);
        // Try to serve static files first
        const staticResponse = await tryServeStatic(url.pathname);
        if (staticResponse) {
            return staticResponse;
        }
        // Handle index.html for directory requests
        if (url.pathname.endsWith('/')) {
            const indexResponse = await tryServeStatic(url.pathname + 'index.html');
            if (indexResponse) {
                return indexResponse;
            }
        }
        try {
            // Initialize KV if enabled
            const kvDb = kv ? await getKvInstance(typeof kv === 'string' ? kv : undefined) : null;
            // Create request context for PhilJS
            const requestContext = {
                url,
                method: request.method,
                headers: request.headers,
                body: request.body,
                params: {},
                platform: {
                    name: 'deno',
                    version: globalThis.Deno?.version?.deno || 'unknown',
                    kv: kvDb,
                    remoteAddr: info?.remoteAddr,
                    deploy: deploy,
                    development,
                },
            };
            // Handle the request with PhilJS SSR
            const { handleRequest } = await import('@philjs/ssr');
            const response = await handleRequest(requestContext);
            // Apply compression if enabled
            return maybeCompress(response);
        }
        catch (error) {
            console.error('PhilJS request error:', error);
            if (onError) {
                return onError(error instanceof Error ? error : new Error(String(error)));
            }
            if (development) {
                return new Response(`<html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 2rem;">
              <h1>Server Error</h1>
              <pre style="background: #f0f0f0; padding: 1rem; overflow: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
            </body>
          </html>`, {
                    status: 500,
                    headers: { 'Content-Type': 'text/html' },
                });
            }
            return new Response('Internal Server Error', { status: 500 });
        }
    }
    return handler;
}
/**
 * Start a Deno server with the PhilJS adapter
 *
 * @example
 * ```typescript
 * import { startDenoServer } from 'philjs-adapters/deno';
 *
 * startDenoServer({
 *   port: 8000,
 *   kv: true,
 * });
 * ```
 */
export function startDenoServer(config = {}) {
    if (!isDeno()) {
        throw new Error('startDenoServer() can only be called in Deno runtime');
    }
    const Deno = globalThis.Deno;
    const handler = createDenoAdapter(config);
    const { port = 8000, hostname = '0.0.0.0', tls, signal, onListen, onError, } = config;
    const serverConfig = {
        port,
        hostname,
        handler,
        signal,
        onError: onError || ((error) => {
            console.error('Server error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }),
        onListen: onListen || (({ hostname, port }) => {
            const protocol = tls ? 'https' : 'http';
            console.log(`🦕 PhilJS running on ${protocol}://${hostname}:${port}`);
        }),
    };
    if (tls) {
        serverConfig.cert = Deno.readTextFileSync(tls.cert);
        serverConfig.key = Deno.readTextFileSync(tls.key);
    }
    Deno.serve(serverConfig, handler);
}
/**
 * Create Deno KV helpers for caching and state management
 *
 * @example
 * ```typescript
 * import { createDenoKV } from 'philjs-adapters/deno';
 *
 * const kv = await createDenoKV();
 *
 * // Set a value
 * await kv.set(['users', 'user-1'], { name: 'John' });
 *
 * // Get a value
 * const user = await kv.get(['users', 'user-1']);
 *
 * // Cache with TTL
 * await kv.setWithTTL(['cache', 'api-response'], data, 60000); // 60 seconds
 * ```
 */
export async function createDenoKV(path) {
    const kv = await getKvInstance(path);
    if (!kv) {
        throw new Error('Deno KV is not available');
    }
    return {
        kv,
        /**
         * Get a value by key
         */
        async get(key) {
            const result = await kv.get(key);
            return result.value;
        },
        /**
         * Set a value by key
         */
        async set(key, value) {
            await kv.set(key, value);
        },
        /**
         * Set a value with TTL (time-to-live)
         */
        async setWithTTL(key, value, ttlMs) {
            const expireAt = Date.now() + ttlMs;
            await kv.set(key, { value, expireAt });
        },
        /**
         * Get a value with TTL check
         */
        async getWithTTL(key) {
            const result = await kv.get(key);
            if (!result.value)
                return null;
            if (result.value.expireAt && Date.now() > result.value.expireAt) {
                await kv.delete(key);
                return null;
            }
            return result.value.value;
        },
        /**
         * Delete a value by key
         */
        async delete(key) {
            await kv.delete(key);
        },
        /**
         * List values by prefix
         * ES2024: Uses Array.fromAsync for cleaner async collection
         */
        async list(prefix) {
            return Array.fromAsync(kv.list({ prefix }), (entry) => ({ key: entry.key, value: entry.value }));
        },
        /**
         * Atomic transaction
         */
        atomic() {
            return kv.atomic();
        },
        /**
         * Close the KV connection
         */
        close() {
            kv.close();
            kvInstance = null;
        },
    };
}
/**
 * Check Deno permissions
 *
 * @example
 * ```typescript
 * import { checkPermissions } from 'philjs-adapters/deno';
 *
 * const perms = await checkPermissions();
 * if (!perms.net) {
 *   console.log('Network permission required');
 * }
 * ```
 */
export async function checkPermissions() {
    if (!isDeno()) {
        return { read: false, write: false, net: false, env: false, run: false };
    }
    const Deno = globalThis.Deno;
    const check = async (name) => {
        try {
            const status = await Deno.permissions.query({ name });
            return status.state === 'granted';
        }
        catch {
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
export async function requestPermission(name, path) {
    if (!isDeno())
        return false;
    const Deno = globalThis.Deno;
    try {
        const descriptor = { name };
        if (path && (name === 'read' || name === 'write')) {
            descriptor.path = path;
        }
        const status = await Deno.permissions.request(descriptor);
        return status.state === 'granted';
    }
    catch {
        return false;
    }
}
/**
 * Deno adapter factory for PhilJS build system
 */
export function denoAdapter(config = {}) {
    return {
        name: 'deno',
        async adapt() {
            console.log('Building for Deno runtime...');
            // Deno can run TypeScript directly, minimal build needed
            // Generate deno.json if needed
        },
        getHandler() {
            const handler = createDenoAdapter(config);
            return (request, context) => {
                return handler(request, context);
            };
        },
    };
}
/**
 * Helper to check if running on Deno Deploy
 */
export function isDenoDeply() {
    if (!isDeno())
        return false;
    const Deno = globalThis.Deno;
    return Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;
}
/**
 * Get Deno Deploy region
 */
export function getDenoDeployRegion() {
    if (!isDeno())
        return undefined;
    const Deno = globalThis.Deno;
    return Deno.env.get('DENO_REGION');
}
export default createDenoAdapter;
//# sourceMappingURL=index.js.map