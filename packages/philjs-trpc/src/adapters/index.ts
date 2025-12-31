/**
 * @philjs/trpc - Platform adapters
 * Adapters for various server frameworks - no external dependencies
 */

import type { AdapterConfig, BaseContext, TRPCClientErrorLike, AnyRouter } from '../types.js';

/**
 * Helper type for router with handle method
 */
type RouterWithHandle = { handle: (r: unknown, c: unknown) => Promise<unknown> };

/**
 * Convert an Error to TRPCClientErrorLike for the error handler
 */
function toTRPCError(error: Error): TRPCClientErrorLike<AnyRouter> {
  return {
    message: error.message,
    data: {
      code: 'INTERNAL_SERVER_ERROR',
      httpStatus: 500,
      ...(error.stack != null && { stack: error.stack }),
    },
    cause: error,
  };
}

/**
 * Create Express adapter
 */
export function createExpressAdapter(config: AdapterConfig) {
  return async (req: { body: unknown; headers: Record<string, string> }, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    try {
      const ctx = config.createContext ? await config.createContext({ req: req as unknown as Request }) : {};
      const body = req.body as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };

      // Handle batch requests
      if (body.batch && Array.isArray(body.batch)) {
        const results = await Promise.all(
          body.batch.map(async (item) => {
            const result = await (config.router as unknown as RouterWithHandle).handle(item, ctx);
            return result;
          })
        );
        res.json(results);
        return;
      }

      // Handle single request
      const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
      res.json(result);
    } catch (error) {
      config.onError?.(toTRPCError(error as Error), {} as BaseContext);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  };
}

/**
 * Create Fastify adapter
 */
export function createFastifyAdapter(config: AdapterConfig) {
  return async (request: { body: unknown }, reply: { send: (data: unknown) => void; code: (code: number) => { send: (data: unknown) => void } }) => {
    try {
      const ctx = config.createContext ? await config.createContext({ req: request as unknown as Request }) : {};
      const body = request.body as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };

      if (body.batch && Array.isArray(body.batch)) {
        const results = await Promise.all(
          body.batch.map(async (item) => {
            return await (config.router as unknown as RouterWithHandle).handle(item, ctx);
          })
        );
        reply.send(results);
        return;
      }

      const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
      reply.send(result);
    } catch (error) {
      config.onError?.(toTRPCError(error as Error), {} as BaseContext);
      reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  };
}

/**
 * Create Hono adapter
 */
export function createHonoAdapter(config: AdapterConfig) {
  return async (c: { req: { json: () => Promise<unknown> }; json: (data: unknown, status?: number) => Response }) => {
    try {
      const body = await c.req.json() as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };
      const ctx = config.createContext ? await config.createContext({ req: c.req as unknown as Request }) : {};

      if (body.batch && Array.isArray(body.batch)) {
        const results = await Promise.all(
          body.batch.map(async (item) => {
            return await (config.router as unknown as RouterWithHandle).handle(item, ctx);
          })
        );
        return c.json(results);
      }

      const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
      return c.json(result);
    } catch (error) {
      config.onError?.(toTRPCError(error as Error), {} as BaseContext);
      return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
    }
  };
}

/**
 * Create Cloudflare Workers adapter
 */
export function createCloudflareAdapter(config: AdapterConfig) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        const body = await request.json() as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };
        const ctx = config.createContext ? await config.createContext({ req: request }) : {};

        if (body.batch && Array.isArray(body.batch)) {
          const results = await Promise.all(
            body.batch.map(async (item) => {
              return await (config.router as unknown as RouterWithHandle).handle(item, ctx);
            })
          );
          return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        config.onError?.(toTRPCError(error as Error), {} as BaseContext);
        return new Response(
          JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },
  };
}

/**
 * Create AWS Lambda adapter
 */
export function createLambdaAdapter(config: AdapterConfig) {
  return async (event: { body: string; headers: Record<string, string> }): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> => {
    try {
      const body = JSON.parse(event.body || '{}') as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };
      const ctx = config.createContext ? await config.createContext({ req: event as unknown as Request }) : {};

      if (body.batch && Array.isArray(body.batch)) {
        const results = await Promise.all(
          body.batch.map(async (item) => {
            return await (config.router as unknown as RouterWithHandle).handle(item, ctx);
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify(results),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
      };
    } catch (error) {
      config.onError?.(toTRPCError(error as Error), {} as BaseContext);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  };
}

/**
 * Create standalone HTTP server (Node.js)
 */
export function createStandaloneServer(config: AdapterConfig & { port?: number }) {
  let server: { listen: (port: number, cb: () => void) => void; close: (cb: (err?: Error) => void) => void } | null = null;

  async function readBody(req: { on: (event: string, cb: (chunk: Buffer) => void) => void }): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk.toString();
      });
      req.on('end', () => resolve(data));
      req.on('error', (err) => reject(err));
    });
  }

  async function handleRequest(
    req: { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; on: (event: string, cb: (chunk: Buffer) => void) => void },
    res: { setHeader: (name: string, value: string) => void; statusCode: number; end: (body?: string) => void }
  ) {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' } }));
      return;
    }

    try {
      const bodyText = await readBody(req);
      const body = JSON.parse(bodyText || '{}') as { method?: string; path?: string; input?: unknown; batch?: Array<{ method: string; path: string; input?: unknown }> };
      const ctx = config.createContext ? await config.createContext({ req: req as unknown as Request }) : {};

      if (body.batch && Array.isArray(body.batch)) {
        const results = await Promise.all(
          body.batch.map(async (item) => {
            return await (config.router as unknown as RouterWithHandle).handle(item, ctx);
          })
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
        return;
      }

      const result = await (config.router as unknown as RouterWithHandle).handle(body, ctx);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      config.onError?.(toTRPCError(error as Error), {} as BaseContext);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }));
    }
  }

  return {
    async listen(port = config.port || 3000): Promise<void> {
      if (!server) {
        const http = await import('node:http');
        server = http.createServer((req, res) => {
          void handleRequest(req, res);
        });
      }

      await new Promise<void>((resolve) => {
        server?.listen(port, () => resolve());
      });
      console.log(`Server listening on port ${port}`);
    },

    async close(): Promise<void> {
      if (!server) return;
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
