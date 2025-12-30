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

import type { Adapter, AdapterConfig, RequestContext } from '../types.js';
import { isDeno } from '../runtime-detect.js';

export interface DenoConfig extends AdapterConfig {
  /** Port to listen on */
  port?: number;
  /** Hostname to bind to */
  hostname?: string;
  /** Enable Deno KV for caching */
  kv?: boolean | string;
  /** Static file directory */
  staticDir?: string;
  /** Enable compression */
  compression?: boolean;
  /** Deno Deploy specific options */
  deploy?: DenoDeployConfig;
  /** TLS configuration */
  tls?: {
    key: string;
    cert: string;
  };
  /** Signal for graceful shutdown */
  signal?: AbortSignal;
  /** Callback when server starts listening */
  onListen?: (params: { hostname: string; port: number }) => void;
  /** Handler for errors */
  onError?: (error: Error) => Response | Promise<Response>;
}

export interface DenoDeployConfig {
  /** Project name for Deno Deploy */
  project?: string;
  /** Enable edge caching */
  edgeCache?: boolean;
  /** KV database name */
  kvDatabase?: string;
}

export interface DenoServeHandler {
  (request: Request, info?: DenoServeHandlerInfo): Promise<Response> | Response;
}

export interface DenoServeHandlerInfo {
  remoteAddr: {
    hostname: string;
    port: number;
    transport: 'tcp' | 'udp';
  };
}

export interface DenoKv {
  get: <T = unknown>(key: string[]) => Promise<{ value: T | null; versionstamp: string | null }>;
  set: (key: string[], value: unknown) => Promise<{ ok: boolean; versionstamp: string }>;
  delete: (key: string[]) => Promise<void>;
  list: <T = unknown>(selector: { prefix: string[] }) => AsyncIterable<{ key: string[]; value: T; versionstamp: string }>;
  atomic: () => DenoKvAtomic;
  close: () => void;
}

export interface DenoKvAtomic {
  check: (entry: { key: string[]; versionstamp: string | null }) => DenoKvAtomic;
  set: (key: string[], value: unknown) => DenoKvAtomic;
  delete: (key: string[]) => DenoKvAtomic;
  commit: () => Promise<{ ok: boolean; versionstamp?: string }>;
}

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
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
let kvInstance: DenoKv | null = null;

/**
 * Get or create a Deno KV instance
 */
async function getKvInstance(path?: string): Promise<DenoKv | null> {
  if (!isDeno()) return null;

  if (kvInstance) return kvInstance;

  try {
    const Deno = (globalThis as any).Deno;
    kvInstance = await Deno.openKv(path);
    return kvInstance;
  } catch (error) {
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
export function createDenoAdapter(config: DenoConfig = {}): DenoServeHandler {
  const {
    port = 8000,
    hostname = '0.0.0.0',
    kv = false,
    staticDir = 'public',
    compression = true,
    deploy,
    onError,
  } = config;

  const development = (globalThis as any).Deno?.env?.get('DENO_ENV') !== 'production';

  /**
   * Check if we have permission to read a file
   */
  async function hasReadPermission(path: string): Promise<boolean> {
    if (!isDeno()) return false;

    const Deno = (globalThis as any).Deno;
    try {
      const status = await Deno.permissions.query({ name: 'read', path });
      return status.state === 'granted';
    } catch {
      return true; // Assume permission if query fails (older Deno versions)
    }
  }

  /**
   * Try to serve a static file
   */
  async function tryServeStatic(pathname: string): Promise<Response | null> {
    if (!isDeno()) return null;

    const Deno = (globalThis as any).Deno;
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

          const headers: HeadersInit = {
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
      } catch {
        // File doesn't exist or can't be read, continue to next directory
      }
    }

    return null;
  }

  /**
   * Compress response body if applicable
   */
  async function maybeCompress(response: Response): Promise<Response> {
    if (!compression) return response;
    if (!isDeno()) return response;

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
    } catch {
      // Compression failed, return original
    }

    return response;
  }

  /**
   * Main request handler compatible with Deno.serve()
   */
  async function handler(
    request: Request,
    info?: DenoServeHandlerInfo
  ): Promise<Response> {
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
      const requestContext: RequestContext = {
        url,
        method: request.method,
        headers: request.headers,
        body: request.body,
        params: {},
        platform: {
          name: 'deno',
          version: (globalThis as any).Deno?.version?.deno || 'unknown',
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
    } catch (error) {
      console.error('PhilJS request error:', error);

      if (onError) {
        return onError(error instanceof Error ? error : new Error(String(error)));
      }

      if (development) {
        return new Response(
          `<html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 2rem;">
              <h1>Server Error</h1>
              <pre style="background: #f0f0f0; padding: 1rem; overflow: auto;">${
                error instanceof Error ? error.stack : String(error)
              }</pre>
            </body>
          </html>`,
          {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
          }
        );
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
export function startDenoServer(config: DenoConfig = {}): void {
  if (!isDeno()) {
    throw new Error('startDenoServer() can only be called in Deno runtime');
  }

  const Deno = (globalThis as any).Deno;
  const handler = createDenoAdapter(config);

  const {
    port = 8000,
    hostname = '0.0.0.0',
    tls,
    signal,
    onListen,
    onError,
  } = config;

  const serverConfig: any = {
    port,
    hostname,
    handler,
    signal,
    onError: onError || ((error: Error) => {
      console.error('Server error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }),
    onListen: onListen || (({ hostname, port }: { hostname: string; port: number }) => {
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
export async function createDenoKV(path?: string) {
  const kv = await getKvInstance(path);

  if (!kv) {
    throw new Error('Deno KV is not available');
  }

  return {
    kv,

    /**
     * Get a value by key
     */
    async get<T = unknown>(key: string[]): Promise<T | null> {
      const result = await kv.get<T>(key);
      return result.value;
    },

    /**
     * Set a value by key
     */
    async set(key: string[], value: unknown): Promise<void> {
      await kv.set(key, value);
    },

    /**
     * Set a value with TTL (time-to-live)
     */
    async setWithTTL(key: string[], value: unknown, ttlMs: number): Promise<void> {
      const expireAt = Date.now() + ttlMs;
      await kv.set(key, { value, expireAt });
    },

    /**
     * Get a value with TTL check
     */
    async getWithTTL<T = unknown>(key: string[]): Promise<T | null> {
      const result = await kv.get<{ value: T; expireAt: number }>(key);
      if (!result.value) return null;

      if (result.value.expireAt && Date.now() > result.value.expireAt) {
        await kv.delete(key);
        return null;
      }

      return result.value.value;
    },

    /**
     * Delete a value by key
     */
    async delete(key: string[]): Promise<void> {
      await kv.delete(key);
    },

    /**
     * List values by prefix
     * ES2024: Uses Array.fromAsync for cleaner async collection
     */
    async list<T = unknown>(prefix: string[]): Promise<Array<{ key: string[]; value: T }>> {
      return Array.fromAsync(
        kv.list<T>({ prefix }),
        (entry) => ({ key: entry.key, value: entry.value })
      );
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
export async function checkPermissions(): Promise<{
  read: boolean;
  write: boolean;
  net: boolean;
  env: boolean;
  run: boolean;
}> {
  if (!isDeno()) {
    return { read: false, write: false, net: false, env: false, run: false };
  }

  const Deno = (globalThis as any).Deno;

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
export async function requestPermission(
  name: 'read' | 'write' | 'net' | 'env' | 'run',
  path?: string
): Promise<boolean> {
  if (!isDeno()) return false;

  const Deno = (globalThis as any).Deno;

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

/**
 * Deno adapter factory for PhilJS build system
 */
export function denoAdapter(config: DenoConfig = {}): Adapter {
  return {
    name: 'deno',

    async adapt() {
      console.log('Building for Deno runtime...');
      // Deno can run TypeScript directly, minimal build needed
      // Generate deno.json if needed
    },

    getHandler() {
      const handler = createDenoAdapter(config);
      return (request: Request, context?: unknown): Response | Promise<Response> => {
        return handler(request, context as DenoServeHandlerInfo | undefined);
      };
    },
  };
}

/**
 * Helper to check if running on Deno Deploy
 */
export function isDenoDeply(): boolean {
  if (!isDeno()) return false;

  const Deno = (globalThis as any).Deno;
  return Deno.env.get('DENO_DEPLOYMENT_ID') !== undefined;
}

/**
 * Get Deno Deploy region
 */
export function getDenoDeployRegion(): string | undefined {
  if (!isDeno()) return undefined;

  const Deno = (globalThis as any).Deno;
  return Deno.env.get('DENO_REGION');
}

export default createDenoAdapter;
