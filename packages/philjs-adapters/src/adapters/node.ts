/**
 * PhilJS Node.js Adapter
 *
 * Production-ready deployment adapter for Node.js with:
 * - Express/Fastify middleware
 * - Standalone server
 * - PM2 ecosystem file generation
 * - Clustering support
 * - Graceful shutdown
 *
 * @module philjs-adapters/adapters/node
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { createServer as createHttpsServer, Server as HttpsServer } from 'https';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import type { Adapter, AdapterConfig, RequestContext } from '../types.js';
import { createBuildManifest, copyStaticAssets, MIME_TYPES } from '../utils/build.js';
import { loadEnvFile, injectEnvVariables } from '../utils/env.js';

/**
 * Configuration options for the Node.js adapter
 */
export interface NodeAdapterConfig extends AdapterConfig {
  /** Port to listen on */
  port?: number;

  /** Host to bind to */
  host?: string;

  /** Enable HTTPS */
  https?: {
    key: string;
    cert: string;
    ca?: string;
  };

  /** Enable compression */
  compression?: boolean;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Keep-alive timeout in milliseconds */
  keepAliveTimeout?: number;

  /** Headers timeout in milliseconds */
  headersTimeout?: number;

  /** Trust proxy headers */
  trustProxy?: boolean | string | number;

  /** Enable clustering */
  cluster?: boolean | ClusterConfig;

  /** Static file serving */
  serveStatic?: boolean | StaticConfig;

  /** Graceful shutdown timeout in milliseconds */
  shutdownTimeout?: number;

  /** Generate PM2 ecosystem file */
  generatePM2?: boolean;

  /** Generate Dockerfile */
  generateDockerfile?: boolean;

  /** Express middleware mode */
  express?: boolean;

  /** Fastify mode */
  fastify?: boolean;

  /** Request logging */
  logging?: boolean | LoggingConfig;

  /** Health check endpoint */
  healthCheck?: string;

  /** Metrics endpoint */
  metrics?: string;
}

/**
 * Cluster configuration
 */
export interface ClusterConfig {
  /** Number of workers (default: CPU count) */
  workers?: number;
  /** Restart workers on crash */
  restartOnCrash?: boolean;
  /** Sticky sessions */
  sticky?: boolean;
}

/**
 * Static file serving configuration
 */
export interface StaticConfig {
  /** Static assets directory */
  dir?: string;
  /** Cache-Control header value */
  cacheControl?: string;
  /** Maximum age in seconds */
  maxAge?: number;
  /** Enable etag */
  etag?: boolean;
  /** Enable last-modified */
  lastModified?: boolean;
  /** Index files */
  index?: string[];
  /** Dotfiles handling */
  dotfiles?: 'allow' | 'deny' | 'ignore';
  /** Extensions to try */
  extensions?: string[];
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log format */
  format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
  /** Log level */
  level?: 'error' | 'warn' | 'info' | 'debug';
  /** Skip logging for paths */
  skip?: string[];
}

/**
 * Create a Node.js deployment adapter
 *
 * @example
 * ```typescript
 * import { nodeAdapter } from 'philjs-adapters/adapters/node';
 *
 * export default defineConfig({
 *   adapter: nodeAdapter({
 *     port: 3000,
 *     cluster: { workers: 4 },
 *     compression: true,
 *     serveStatic: {
 *       dir: 'public',
 *       maxAge: 31536000,
 *     },
 *     generatePM2: true,
 *   }),
 * });
 * ```
 */
export function nodeAdapter(config: NodeAdapterConfig = {}): Adapter {
  const {
    outDir = '.node',
    port = parseInt(process.env['PORT'] || '3000'),
    host = '0.0.0.0',
    https: httpsConfig,
    compression = true,
    timeout = 30000,
    keepAliveTimeout = 5000,
    headersTimeout = 60000,
    trustProxy = false,
    cluster,
    serveStatic = true,
    shutdownTimeout = 10000,
    generatePM2 = false,
    generateDockerfile = false,
    express = false,
    fastify = false,
    logging = true,
    healthCheck = '/health',
    metrics,
  } = config;

  const staticConfig: StaticConfig = typeof serveStatic === 'object'
    ? serveStatic
    : { dir: (config as AdapterConfig).static?.assets || 'public' };

  let server: Server | HttpsServer | null = null;

  return {
    name: 'node',

    async adapt() {
      console.log('Building for Node.js standalone server...');

      // Create output directory
      mkdirSync(outDir, { recursive: true });

      // Generate server entry point
      writeFileSync(
        join(outDir, 'server.mjs'),
        generateServerCode()
      );

      // Generate package.json
      writeFileSync(
        join(outDir, 'package.json'),
        JSON.stringify({
          name: 'philjs-server',
          version: '1.0.0',
          type: 'module',
          scripts: {
            start: 'node server.mjs',
            dev: 'node --watch server.mjs',
          },
          dependencies: {
            '@philjs/ssr': 'latest',
            ...(compression ? { 'compression': '^1.7.4' } : {}),
            ...(express ? { 'express': '^4.18.2' } : {}),
            ...(fastify ? { 'fastify': '^4.25.0' } : {}),
          },
        }, null, 2)
      );

      // Generate PM2 ecosystem file
      if (generatePM2) {
        writeFileSync(
          join(outDir, 'ecosystem.config.cjs'),
          generatePM2Config()
        );
      }

      // Generate Dockerfile
      if (generateDockerfile) {
        writeFileSync(
          join(outDir, 'Dockerfile'),
          generateDockerfileContent()
        );

        writeFileSync(
          join(outDir, '.dockerignore'),
          `node_modules
npm-debug.log
.git
.gitignore
.env*
!.env.production
`
        );
      }

      // Copy static assets
      if (serveStatic) {
        await copyStaticAssets(
          staticConfig.dir || 'public',
          join(outDir, 'public')
        );
      }

      // Generate build manifest
      const manifest = await createBuildManifest({
        adapter: 'node',
        outputDir: outDir,
        routes: [],
      });
      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`Node.js build complete: ${outDir}`);
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
            trustProxy,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  /**
   * Generate server code
   */
  function generateServerCode(): string {
    if (express) {
      return generateExpressServer();
    }
    if (fastify) {
      return generateFastifyServer();
    }
    return generateStandaloneServer();
  }

  /**
   * Generate standalone Node.js server
   */
  function generateStandaloneServer(): string {
    return `// PhilJS Node.js Standalone Server
// Generated by PhilJS Adapters

import { createServer${httpsConfig ? ', createServer as createHttpsServer' : ''} } from 'http';
${httpsConfig ? `import { readFileSync } from 'fs';` : ''}
import { handleRequest } from '@philjs/ssr';
${compression ? `import compression from 'compression';` : ''}
${cluster ? `import cluster from 'cluster';
import os from 'os';` : ''}

const PORT = parseInt(process.env.PORT || '${port}');
const HOST = process.env.HOST || '${host}';

// MIME types
const MIME_TYPES = ${JSON.stringify(MIME_TYPES, null, 2)};

${cluster ? `
// Cluster mode
if (cluster.isPrimary) {
  const numWorkers = ${typeof cluster === 'object' && cluster.workers ? cluster.workers : 'os.cpus().length'};
  console.log(\`Primary \${process.pid} starting \${numWorkers} workers...\`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(\`Worker \${worker.process.pid} died (\${signal || code})\`);
    ${typeof cluster === 'object' && cluster.restartOnCrash !== false ? 'cluster.fork();' : ''}
  });
} else {
  startServer();
}
` : 'startServer();'}

function startServer() {
  ${compression ? `
  // Compression middleware simulation
  function compressResponse(body, headers) {
    // In production, use proper compression
    return { body, headers };
  }
  ` : ''}

  async function requestHandler(req, res) {
    try {
      const url = new URL(req.url || '/', \`http://\${req.headers.host || 'localhost'}\`);

      ${healthCheck ? `
      // Health check endpoint
      if (url.pathname === '${healthCheck}') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        return;
      }
      ` : ''}

      ${metrics ? `
      // Metrics endpoint
      if (url.pathname === '${metrics}') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(\`# PhilJS Metrics
nodejs_version_info{version="\${process.version}"} 1
process_uptime_seconds \${process.uptime()}
process_memory_heap_used_bytes \${process.memoryUsage().heapUsed}
\`);
        return;
      }
      ` : ''}

      ${serveStatic ? `
      // Try to serve static files
      const staticResponse = await tryServeStatic(url.pathname, res);
      if (staticResponse) return;
      ` : ''}

      // Convert Node request to Web API Headers
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      // Read body
      const body = await readBody(req);

      const context = {
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
          trustProxy: ${JSON.stringify(trustProxy)},
          req,
          res,
        },
      };

      const response = await handleRequest(context);

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
  }

  ${serveStatic ? `
  async function tryServeStatic(pathname, res) {
    const { existsSync, statSync, createReadStream } = await import('fs');
    const { join, extname } = await import('path');

    const staticDirs = ['./public', './.philjs/prerendered'];

    for (const dir of staticDirs) {
      const filePath = join(process.cwd(), dir, pathname);

      try {
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = extname(filePath);
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';

          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', '${staticConfig.cacheControl || 'public, max-age=31536000, immutable'}');

          createReadStream(filePath).pipe(res);
          return true;
        }
      } catch (e) {
        // Continue to next directory
      }
    }

    return false;
  }
  ` : ''}

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
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

  // Create server
  ${httpsConfig ? `
  const server = createHttpsServer({
    key: readFileSync('${httpsConfig.key}'),
    cert: readFileSync('${httpsConfig.cert}'),
    ${httpsConfig.ca ? `ca: readFileSync('${httpsConfig.ca}'),` : ''}
  }, requestHandler);
  ` : `
  const server = createServer(requestHandler);
  `}

  server.timeout = ${timeout};
  server.keepAliveTimeout = ${keepAliveTimeout};
  server.headersTimeout = ${headersTimeout};

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, ${shutdownTimeout});
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.listen(PORT, HOST, () => {
    const protocol = ${httpsConfig ? "'https'" : "'http'"};
    console.log(\`PhilJS server running at \${protocol}://\${HOST}:\${PORT}\`);
  });
}
`;
  }

  /**
   * Generate Express server
   */
  function generateExpressServer(): string {
    return `// PhilJS Express Server
// Generated by PhilJS Adapters

import express from 'express';
${compression ? `import compression from 'compression';` : ''}
${httpsConfig ? `import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';` : ''}
import { handleRequest } from '@philjs/ssr';

const app = express();
const PORT = parseInt(process.env.PORT || '${port}');
const HOST = process.env.HOST || '${host}';

${compression ? `// Compression
app.use(compression());` : ''}

${trustProxy ? `// Trust proxy
app.set('trust proxy', ${JSON.stringify(trustProxy)});` : ''}

${serveStatic ? `// Static files
app.use('/static', express.static('public', {
  maxAge: '${staticConfig.maxAge || 31536000}s',
  etag: ${staticConfig.etag !== false},
  lastModified: ${staticConfig.lastModified !== false},
}));` : ''}

${healthCheck ? `// Health check
app.get('${healthCheck}', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});` : ''}

${metrics ? `// Metrics
app.get('${metrics}', (req, res) => {
  res.type('text/plain').send(\`# PhilJS Metrics
nodejs_version_info{version="\${process.version}"} 1
process_uptime_seconds \${process.uptime()}
process_memory_heap_used_bytes \${process.memoryUsage().heapUsed}
\`);
});` : ''}

// PhilJS handler
app.use(async (req, res, next) => {
  try {
    const url = new URL(req.url, \`\${req.protocol}://\${req.get('host')}\`);

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
          controller.enqueue(new TextEncoder().encode(
            typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
          ));
          controller.close();
        }
      }) : null,
      params: req.params,
      platform: {
        name: 'node',
        framework: 'express',
        req,
        res,
      },
    };

    const response = await handleRequest(context);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

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
      res.send(text);
    }
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
${httpsConfig ? `
const server = createHttpsServer({
  key: readFileSync('${httpsConfig.key}'),
  cert: readFileSync('${httpsConfig.cert}'),
}, app);

server.listen(PORT, HOST, () => {
  console.log(\`PhilJS Express server running at https://\${HOST}:\${PORT}\`);
});
` : `
app.listen(PORT, HOST, () => {
  console.log(\`PhilJS Express server running at http://\${HOST}:\${PORT}\`);
});
`}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});
`;
  }

  /**
   * Generate Fastify server
   */
  function generateFastifyServer(): string {
    return `// PhilJS Fastify Server
// Generated by PhilJS Adapters

import Fastify from 'fastify';
${compression ? `import compress from '@fastify/compress';` : ''}
${serveStatic ? `import fastifyStatic from '@fastify/static';` : ''}
import { handleRequest } from '@philjs/ssr';
import { join } from 'path';

const fastify = Fastify({
  logger: ${JSON.stringify(logging !== false)},
  ${trustProxy ? `trustProxy: ${JSON.stringify(trustProxy)},` : ''}
  ${httpsConfig ? `
  https: {
    key: readFileSync('${httpsConfig.key}'),
    cert: readFileSync('${httpsConfig.cert}'),
  },` : ''}
});

const PORT = parseInt(process.env.PORT || '${port}');
const HOST = process.env.HOST || '${host}';

${compression ? `// Compression
await fastify.register(compress, { global: true });` : ''}

${serveStatic ? `// Static files
await fastify.register(fastifyStatic, {
  root: join(process.cwd(), 'public'),
  prefix: '/static/',
  maxAge: ${(staticConfig.maxAge || 31536000) * 1000},
});` : ''}

${healthCheck ? `// Health check
fastify.get('${healthCheck}', async () => {
  return { status: 'ok', uptime: process.uptime() };
});` : ''}

// PhilJS handler
fastify.all('/*', async (request, reply) => {
  try {
    const url = new URL(request.url, \`\${request.protocol}://\${request.hostname}\`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const context = {
      url,
      method: request.method,
      headers,
      body: request.body ? new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            typeof request.body === 'string' ? request.body : JSON.stringify(request.body)
          ));
          controller.close();
        }
      }) : null,
      params: request.params,
      platform: {
        name: 'node',
        framework: 'fastify',
        request,
        reply,
      },
    };

    const response = await handleRequest(context);

    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);

    if (response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      return Buffer.concat(chunks);
    } else {
      return response.text();
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(\`PhilJS Fastify server running at http://\${HOST}:\${PORT}\`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
`;
  }

  /**
   * Generate PM2 ecosystem file
   */
  function generatePM2Config(): string {
    const clusterConfig = typeof cluster === 'object' ? cluster : {};

    return `// PM2 Ecosystem Configuration
// Generated by PhilJS Adapters

module.exports = {
  apps: [{
    name: 'philjs-app',
    script: 'server.mjs',
    instances: ${clusterConfig.workers || '"max"'},
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: ${port},
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: ${port},
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: ${shutdownTimeout},
    wait_ready: true,
    listen_timeout: 10000,
  }],
};
`;
  }

  /**
   * Generate Dockerfile
   */
  function generateDockerfileContent(): string {
    return `# PhilJS Node.js Dockerfile
# Generated by PhilJS Adapters

FROM node:24-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=${port}

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 philjs
USER philjs

# Copy built application
COPY --from=deps --chown=philjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=philjs:nodejs /app/server.mjs ./
COPY --from=build --chown=philjs:nodejs /app/public ./public

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}${healthCheck} || exit 1

CMD ["node", "server.mjs"]
`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create Express middleware
 */
export function createExpressMiddleware(config: NodeAdapterConfig = {}) {
  return async (req: any, res: any, next: any) => {
    try {
      const adapter = nodeAdapter({ ...config, express: false });
      const handler = adapter.getHandler();

      const url = new URL(req.url, `${req.protocol}://${req.get('host')}`);

      const requestInit: RequestInit = {
        method: req.method,
        headers: req.headers as HeadersInit,
      };
      if (req.body) {
        requestInit.body = JSON.stringify(req.body);
      }
      const request = new Request(url.toString(), requestInit);

      const response = await handler(request);

      response.headers.forEach((value: string, key: string) => {
        res.setHeader(key, value);
      });

      res.status(response.status);
      res.send(await response.text());
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create Fastify plugin
 */
export function createFastifyPlugin(config: NodeAdapterConfig = {}) {
  return async (fastify: any, options: any) => {
    const adapter = nodeAdapter({ ...config, fastify: false });
    const handler = adapter.getHandler();

    fastify.all('/*', async (request: any, reply: any) => {
      const url = new URL(request.url, `${request.protocol}://${request.hostname}`);

      const webRequestInit: RequestInit = {
        method: request.method,
        headers: request.headers as HeadersInit,
      };
      if (request.body) {
        webRequestInit.body = JSON.stringify(request.body);
      }
      const webRequest = new Request(url.toString(), webRequestInit);

      const response = await handler(webRequest);

      response.headers.forEach((value: string, key: string) => {
        reply.header(key, value);
      });

      reply.status(response.status);
      return response.text();
    });
  };
}

/**
 * Start a standalone server
 */
export async function startServer(config: NodeAdapterConfig = {}): Promise<Server | HttpsServer> {
  const adapter = nodeAdapter(config);
  await adapter.adapt();

  // The server is started in the generated code
  // This function is for programmatic usage
  const handler = adapter.getHandler();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const requestInit: RequestInit = {
      headers,
    };
    if (req.method) {
      requestInit.method = req.method;
    }
    const request = new Request(url.toString(), requestInit);

    const response = await handler(request);

    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    res.statusCode = response.status;
    res.end(await response.text());
  });

  const port = config.port || 3000;
  const host = config.host || '0.0.0.0';

  server.listen(port, host, () => {
    console.log(`PhilJS server running at http://${host}:${port}`);
  });

  return server;
}

export default nodeAdapter;
