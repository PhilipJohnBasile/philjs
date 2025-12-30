/**
 * PhilJS Node.js Adapter
 *
 * Run PhilJS as a standalone Node.js server
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import type { Adapter, AdapterConfig, RequestContext } from '../types.js';

export interface NodeConfig extends AdapterConfig {
  /** Port to listen on */
  port?: number;
  /** Host to bind to */
  host?: string;
  /** Enable HTTPS */
  https?: {
    key: string;
    cert: string;
  };
  /** Compression */
  compression?: boolean;
  /** Request timeout in ms */
  timeout?: number;
  /** Trust proxy headers */
  trustProxy?: boolean;
  /** Enable clustering */
  cluster?: boolean | number;
  /** Static file serving */
  serveStatic?: boolean;
}

export function nodeAdapter(config: NodeConfig = {}): Adapter {
  const {
    port = 3000,
    host = '0.0.0.0',
    https: httpsConfig,
    compression = true,
    timeout = 30000,
    trustProxy = false,
    serveStatic = true,
  } = config;

  let server: ReturnType<typeof createServer> | ReturnType<typeof createHttpsServer>;

  return {
    name: 'node',

    async adapt() {
      console.log('Building for Node.js standalone server...');
      // Node adapter runs directly, no build step needed
    },

    getHandler() {
      return async (request: Request): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'node',
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  function start() {
    const handler = async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        // Try to serve static files first
        if (serveStatic) {
          const staticResult = await tryServeStatic(url.pathname, res);
          if (staticResult) return;
        }

        // Convert Node request to Web Request
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value) {
            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
        }

        // Read body
        const body = await readBody(req);

        const requestContext: RequestContext = {
          url,
          method: req.method || 'GET',
          headers,
          body: body ? new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(body));
              controller.close();
            }
          }) : null,
          params: {},
          platform: {
            name: 'node',
            trustProxy,
            req,
            res,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        const response = await handleRequest(requestContext);

        // Set response headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        res.statusCode = response.status;

        // Stream response body
        if (response.body) {
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
          const text = await response.text();
          res.end(text);
        }
      } catch (error) {
        console.error('Request error:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    };

    // Create server
    if (httpsConfig) {
      server = createHttpsServer(
        {
          key: readFileSync(httpsConfig.key),
          cert: readFileSync(httpsConfig.cert),
        },
        handler
      );
    } else {
      server = createServer(handler);
    }

    server.timeout = timeout;

    server.listen(port, host, () => {
      const protocol = httpsConfig ? 'https' : 'http';
      console.log(`PhilJS server running at ${protocol}://${host}:${port}`);
    });

    return server;
  }

  async function tryServeStatic(pathname: string, res: ServerResponse): Promise<boolean> {
    const staticDirs = [config.static?.assets || 'public', '.philjs/prerendered'];

    for (const dir of staticDirs) {
      const filePath = join(process.cwd(), dir, pathname);

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        const content = readFileSync(filePath);
        res.end(content);
        return true;
      }
    }

    return false;
  }
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(null);
      } else {
        resolve(Buffer.concat(chunks).toString());
      }
    });
    req.on('error', reject);
  });
}

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
};

// Start server function for direct use
export function startServer(config: NodeConfig = {}) {
  const adapter = nodeAdapter(config);
  return (adapter as any).start?.() || adapter;
}

export default nodeAdapter;
