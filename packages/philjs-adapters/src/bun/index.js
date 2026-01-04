/**
 * PhilJS Bun Adapter
 *
 * Deploy PhilJS applications using Bun's native server
 *
 * Features:
 * - Native Bun.serve() integration
 * - Bun's fast file serving
 * - SQLite support via Bun
 * - WebSocket support
 * - Hot reload in dev
 */
import { isBun } from '../runtime-detect.js';
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
};
/**
 * Create a Bun adapter for PhilJS
 *
 * @example
 * ```typescript
 * import { createBunAdapter } from 'philjs-adapters/bun';
 *
 * const handler = createBunAdapter({
 *   app: philJSApp,
 *   port: 3000,
 * });
 *
 * // Bun.serve compatible
 * export default handler;
 *
 * // Or start directly
 * handler.start();
 * ```
 */
export function createBunAdapter(config = {}) {
    const { port = 3000, hostname = '0.0.0.0', development = process.env['NODE_ENV'] !== 'production', staticDir = 'public', compression = true, sqlite, websocket, tls, maxRequestBodySize = 1024 * 1024 * 128, // 128MB
    idleTimeout = 10, } = config;
    // WebSocket handlers storage
    const wsHandlers = new Map();
    /**
     * Try to serve a static file using Bun's native file serving
     */
    async function tryServeStatic(pathname) {
        if (!isBun())
            return null;
        const Bun = globalThis.Bun;
        const staticDirs = [staticDir, 'dist/client', '.philjs/prerendered'];
        for (const dir of staticDirs) {
            const filePath = `${process.cwd()}/${dir}${pathname}`;
            const file = Bun.file(filePath);
            if (await file.exists()) {
                const ext = pathname.substring(pathname.lastIndexOf('.'));
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                const headers = {
                    'Content-Type': contentType,
                    'Cache-Control': development
                        ? 'no-cache'
                        : 'public, max-age=31536000, immutable',
                };
                // Use Bun's native compression if enabled
                if (compression) {
                    headers['Content-Encoding'] = 'gzip';
                }
                return new Response(file, { headers });
            }
        }
        return null;
    }
    /**
     * Main fetch handler compatible with Bun.serve()
     */
    async function fetch(request, server) {
        const url = new URL(request.url);
        // Handle WebSocket upgrade
        if (websocket?.enabled && request.headers.get('upgrade') === 'websocket') {
            const success = server.upgrade(request, {
                data: { url: request.url },
            });
            if (success) {
                return new Response(null, { status: 101 });
            }
            return new Response('WebSocket upgrade failed', { status: 400 });
        }
        // Try to serve static files first using Bun's native file serving
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
            // Create request context for PhilJS
            const requestContext = {
                url,
                method: request.method,
                headers: request.headers,
                body: request.body,
                params: {},
                platform: {
                    name: 'bun',
                    server,
                    development,
                    sqlite: sqlite ? getSQLiteDatabase(sqlite) : undefined,
                },
            };
            // Handle the request with PhilJS SSR
            const { handleRequest } = await import('@philjs/ssr');
            const response = await handleRequest(requestContext);
            // Apply compression if enabled
            if (compression && response.headers.get('Content-Type')?.includes('text/')) {
                const Bun = globalThis.Bun;
                const body = await response.text();
                const compressed = Bun.gzipSync(new TextEncoder().encode(body));
                return new Response(compressed, {
                    status: response.status,
                    headers: {
                        ...Object.fromEntries(response.headers.entries()),
                        'Content-Encoding': 'gzip',
                    },
                });
            }
            return response;
        }
        catch (error) {
            console.error('PhilJS request error:', error);
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
    /**
     * Start the Bun server directly
     */
    function start() {
        if (!isBun()) {
            throw new Error('createBunAdapter.start() can only be called in Bun runtime');
        }
        const Bun = globalThis.Bun;
        const serverConfig = {
            port,
            hostname,
            development,
            fetch,
            maxRequestBodySize,
            idleTimeout,
        };
        // Add TLS if configured
        if (tls) {
            serverConfig.tls = {
                key: Bun.file(tls.key),
                cert: Bun.file(tls.cert),
            };
        }
        // Add WebSocket handlers if enabled
        if (websocket?.enabled) {
            serverConfig.websocket = {
                message: (ws, message) => {
                    // Route to registered handlers
                    const handler = wsHandlers.get('message');
                    if (handler) {
                        handler(ws, message);
                    }
                },
                open: (ws) => {
                    const handler = wsHandlers.get('open');
                    if (handler) {
                        handler(ws, null);
                    }
                },
                close: (ws, code, reason) => {
                    const handler = wsHandlers.get('close');
                    if (handler) {
                        handler(ws, { code, reason });
                    }
                },
                drain: (ws) => {
                    const handler = wsHandlers.get('drain');
                    if (handler) {
                        handler(ws, null);
                    }
                },
                maxPayloadLength: websocket.maxPayloadLength || 16 * 1024 * 1024, // 16MB
                idleTimeout: websocket.idleTimeout || 120,
                backpressureLimit: websocket.backpressureLimit || 1024 * 1024, // 1MB
                closeOnBackpressureLimit: websocket.closeOnBackpressureLimit ?? false,
            };
        }
        const server = Bun.serve(serverConfig);
        const protocol = tls ? 'https' : 'http';
        console.log(`🚀 PhilJS running on ${protocol}://${hostname}:${port}`);
        if (development) {
            console.log('🔥 Hot reload enabled');
        }
        return server;
    }
    if (websocket?.enabled) {
        return {
            fetch,
            port,
            hostname,
            start,
            websocket: {
                message: (ws, message) => {
                    const handler = wsHandlers.get('message');
                    if (handler)
                        handler(ws, message);
                },
                open: (ws) => {
                    const handler = wsHandlers.get('open');
                    if (handler)
                        handler(ws, null);
                },
                close: (ws, code, reason) => {
                    const handler = wsHandlers.get('close');
                    if (handler)
                        handler(ws, { code, reason });
                },
                drain: (ws) => {
                    const handler = wsHandlers.get('drain');
                    if (handler)
                        handler(ws, null);
                },
            },
        };
    }
    return {
        fetch,
        port,
        hostname,
        start,
    };
}
/**
 * Get or create a SQLite database connection using Bun's native SQLite
 */
function getSQLiteDatabase(path) {
    if (!isBun())
        return null;
    const Bun = globalThis.Bun;
    const Database = Bun.SQLiteDatabase || globalThis.Database;
    if (!Database) {
        console.warn('Bun SQLite is not available');
        return null;
    }
    return new Database(path);
}
/**
 * Create SQLite helpers for Bun
 */
export function createBunSQLite(path = ':memory:') {
    const db = getSQLiteDatabase(path);
    if (!db) {
        throw new Error('Bun SQLite is not available');
    }
    return {
        db,
        query: (sql, params) => {
            const stmt = db.prepare(sql);
            return params ? stmt.all(...params) : stmt.all();
        },
        run: (sql, params) => {
            const stmt = db.prepare(sql);
            params ? stmt.run(...params) : stmt.run();
        },
        get: (sql, params) => {
            const stmt = db.prepare(sql);
            return params ? stmt.get(...params) : stmt.get();
        },
        close: () => {
            db.close();
        },
    };
}
/**
 * Bun adapter factory for PhilJS build system
 */
export function bunAdapter(config = {}) {
    return {
        name: 'bun',
        async adapt() {
            console.log('Building for Bun runtime...');
            // Bun can run TypeScript directly, minimal build needed
        },
        getHandler() {
            const handler = createBunAdapter(config);
            return handler.fetch;
        },
    };
}
/**
 * Register a WebSocket message handler
 */
export function onWebSocketMessage(handler, callback) {
    if (handler.websocket) {
        handler.websocket.message = callback;
    }
}
/**
 * Register a WebSocket connection handler
 */
export function onWebSocketOpen(handler, callback) {
    if (handler.websocket) {
        handler.websocket.open = callback;
    }
}
/**
 * Register a WebSocket close handler
 */
export function onWebSocketClose(handler, callback) {
    if (handler.websocket) {
        handler.websocket.close = callback;
    }
}
export default createBunAdapter;
//# sourceMappingURL=index.js.map