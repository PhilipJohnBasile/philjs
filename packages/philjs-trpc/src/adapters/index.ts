/**
 * @philjs/trpc - Platform adapters
 * Adapters for various server frameworks - no external dependencies
 */

import type { AdapterConfig, BaseContext } from '../types';

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
            const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(item, ctx);
            return result;
          })
        );
        res.json(results);
        return;
      }

      // Handle single request
      const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(body, ctx);
      res.json(result);
    } catch (error) {
      config.onError?.(error as Error, {} as BaseContext);
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
            return await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(item, ctx);
          })
        );
        reply.send(results);
        return;
      }

      const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(body, ctx);
      reply.send(result);
    } catch (error) {
      config.onError?.(error as Error, {} as BaseContext);
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
            return await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(item, ctx);
          })
        );
        return c.json(results);
      }

      const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(body, ctx);
      return c.json(result);
    } catch (error) {
      config.onError?.(error as Error, {} as BaseContext);
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
              return await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(item, ctx);
            })
          );
          return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(body, ctx);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        config.onError?.(error as Error, {} as BaseContext);
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
            return await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(item, ctx);
          })
        );
        return {
          statusCode: 200,
          body: JSON.stringify(results),
          headers: { 'Content-Type': 'application/json' },
        };
      }

      const result = await (config.router as { handle: (r: unknown, c: unknown) => Promise<unknown> }).handle(body, ctx);
      return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
      };
    } catch (error) {
      config.onError?.(error as Error, {} as BaseContext);
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
  return {
    async listen(port = config.port || 3000): Promise<void> {
      // Node.js http server would be created here
      // This is a placeholder - actual implementation would use Node's http module
      console.log(`Server listening on port ${port}`);
    },
  };
}
