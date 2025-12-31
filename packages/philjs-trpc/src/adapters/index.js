/**
 * @philjs/trpc - Platform adapters
 * Adapters for various server frameworks - no external dependencies
 */
/**
 * Convert an Error to TRPCClientErrorLike for the error handler
 */
function toTRPCError(error) {
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
export function createExpressAdapter(config) {
    return async (req, res) => {
        try {
            const ctx = config.createContext ? await config.createContext({ req: req }) : {};
            const body = req.body;
            // Handle batch requests
            if (body.batch && Array.isArray(body.batch)) {
                const results = await Promise.all(body.batch.map(async (item) => {
                    const result = await config.router.handle(item, ctx);
                    return result;
                }));
                res.json(results);
                return;
            }
            // Handle single request
            const result = await config.router.handle(body, ctx);
            res.json(result);
        }
        catch (error) {
            config.onError?.(toTRPCError(error), {});
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
        }
    };
}
/**
 * Create Fastify adapter
 */
export function createFastifyAdapter(config) {
    return async (request, reply) => {
        try {
            const ctx = config.createContext ? await config.createContext({ req: request }) : {};
            const body = request.body;
            if (body.batch && Array.isArray(body.batch)) {
                const results = await Promise.all(body.batch.map(async (item) => {
                    return await config.router.handle(item, ctx);
                }));
                reply.send(results);
                return;
            }
            const result = await config.router.handle(body, ctx);
            reply.send(result);
        }
        catch (error) {
            config.onError?.(toTRPCError(error), {});
            reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
        }
    };
}
/**
 * Create Hono adapter
 */
export function createHonoAdapter(config) {
    return async (c) => {
        try {
            const body = await c.req.json();
            const ctx = config.createContext ? await config.createContext({ req: c.req }) : {};
            if (body.batch && Array.isArray(body.batch)) {
                const results = await Promise.all(body.batch.map(async (item) => {
                    return await config.router.handle(item, ctx);
                }));
                return c.json(results);
            }
            const result = await config.router.handle(body, ctx);
            return c.json(result);
        }
        catch (error) {
            config.onError?.(toTRPCError(error), {});
            return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
        }
    };
}
/**
 * Create Cloudflare Workers adapter
 */
export function createCloudflareAdapter(config) {
    return {
        async fetch(request) {
            try {
                const body = await request.json();
                const ctx = config.createContext ? await config.createContext({ req: request }) : {};
                if (body.batch && Array.isArray(body.batch)) {
                    const results = await Promise.all(body.batch.map(async (item) => {
                        return await config.router.handle(item, ctx);
                    }));
                    return new Response(JSON.stringify(results), {
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                const result = await config.router.handle(body, ctx);
                return new Response(JSON.stringify(result), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            catch (error) {
                config.onError?.(toTRPCError(error), {});
                return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        },
    };
}
/**
 * Create AWS Lambda adapter
 */
export function createLambdaAdapter(config) {
    return async (event) => {
        try {
            const body = JSON.parse(event.body || '{}');
            const ctx = config.createContext ? await config.createContext({ req: event }) : {};
            if (body.batch && Array.isArray(body.batch)) {
                const results = await Promise.all(body.batch.map(async (item) => {
                    return await config.router.handle(item, ctx);
                }));
                return {
                    statusCode: 200,
                    body: JSON.stringify(results),
                    headers: { 'Content-Type': 'application/json' },
                };
            }
            const result = await config.router.handle(body, ctx);
            return {
                statusCode: 200,
                body: JSON.stringify(result),
                headers: { 'Content-Type': 'application/json' },
            };
        }
        catch (error) {
            config.onError?.(toTRPCError(error), {});
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
export function createStandaloneServer(config) {
    return {
        async listen(port = config.port || 3000) {
            // Node.js http server would be created here
            // This is a placeholder - actual implementation would use Node's http module
            console.log(`Server listening on port ${port}`);
        },
    };
}
//# sourceMappingURL=index.js.map