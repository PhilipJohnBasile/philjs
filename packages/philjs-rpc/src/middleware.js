/**
 * Middleware system for philjs-rpc.
 * Provides composable middleware for authentication, logging, rate limiting, etc.
 */
// ============================================================================
// Middleware Builder
// ============================================================================
/**
 * Create a middleware function.
 *
 * @example
 * ```ts
 * const authMiddleware = createMiddleware(async ({ ctx, next }) => {
 *   const user = await validateToken(ctx.headers?.authorization);
 *   if (!user) {
 *     throw new RPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
 *   }
 *   return next({ ...ctx, user });
 * });
 * ```
 */
export function createMiddleware(fn) {
    return {
        _input: undefined,
        _context: undefined,
        fn: fn,
    };
}
// ============================================================================
// Middleware Execution
// ============================================================================
/**
 * Execute a chain of middlewares.
 */
export async function executeMiddlewareChain(middlewares, opts) {
    const { ctx, input, type, path, handler } = opts;
    // If no middlewares, execute handler directly
    if (middlewares.length === 0) {
        try {
            const data = await handler();
            return { ok: true, data };
        }
        catch (error) {
            return {
                ok: false,
                error: error,
            };
        }
    }
    // Create the middleware chain
    let index = 0;
    let currentCtx = ctx;
    const next = async (newCtx) => {
        if (newCtx) {
            currentCtx = newCtx;
        }
        // If we've exhausted all middlewares, run the handler
        if (index >= middlewares.length) {
            try {
                const data = await handler();
                return { ok: true, data };
            }
            catch (error) {
                return {
                    ok: false,
                    error: error,
                };
            }
        }
        // Get the next middleware
        const middleware = middlewares[index++];
        try {
            return await middleware.fn({
                ctx: currentCtx,
                input,
                next,
                type,
                path,
            });
        }
        catch (error) {
            return {
                ok: false,
                error: error,
            };
        }
    };
    return next();
}
// ============================================================================
// Built-in Middlewares
// ============================================================================
/**
 * Logging middleware - logs procedure calls.
 *
 * @example
 * ```ts
 * const api = createAPI({
 *   users: {
 *     list: procedure.use(loggerMiddleware()).query(async () => {
 *       return db.users.findMany();
 *     }),
 *   },
 * });
 * ```
 */
export function loggerMiddleware(options) {
    const { logInput = false, logOutput = false, logger = console.log } = options ?? {};
    return createMiddleware(async ({ ctx, input, next, type, path }) => {
        const start = Date.now();
        logger(`[RPC] ${type.toUpperCase()} ${path} started`, logInput ? { input } : undefined);
        const result = await next(ctx);
        const duration = Date.now() - start;
        if (result.ok) {
            logger(`[RPC] ${type.toUpperCase()} ${path} completed in ${duration}ms`, logOutput ? { data: result.data } : undefined);
        }
        else {
            logger(`[RPC] ${type.toUpperCase()} ${path} failed in ${duration}ms`, {
                error: result.error?.message,
            });
        }
        return result;
    });
}
/**
 * Timing middleware - adds timing information to context.
 */
export function timingMiddleware() {
    return createMiddleware(async ({ ctx, next }) => {
        const start = Date.now();
        const result = await next({
            ...ctx,
            timing: { start },
        });
        if (result.ok) {
            return {
                ...result,
                data: {
                    ...(typeof result.data === 'object' && result.data !== null ? result.data : { data: result.data }),
                    _timing: {
                        start,
                        end: Date.now(),
                        duration: Date.now() - start,
                    },
                },
            };
        }
        return result;
    });
}
/**
 * Rate limiting middleware.
 *
 * @example
 * ```ts
 * const api = createAPI({
 *   users: {
 *     create: procedure
 *       .use(rateLimitMiddleware({ limit: 10, windowMs: 60000 }))
 *       .mutation(async ({ input }) => {
 *         return db.users.create({ data: input });
 *       }),
 *   },
 * });
 * ```
 */
export function rateLimitMiddleware(options) {
    const { limit, windowMs, keyGenerator } = options;
    // Simple in-memory store
    const inMemoryStore = new Map();
    const store = options.store ?? {
        get: async (key) => {
            const entry = inMemoryStore.get(key);
            if (!entry || Date.now() > entry.resetAt) {
                return undefined;
            }
            return entry.count;
        },
        set: async (key, count, ttlMs) => {
            inMemoryStore.set(key, { count, resetAt: Date.now() + ttlMs });
        },
        increment: async (key) => {
            const entry = inMemoryStore.get(key);
            if (!entry || Date.now() > entry.resetAt) {
                inMemoryStore.set(key, { count: 1, resetAt: Date.now() + windowMs });
                return 1;
            }
            entry.count++;
            return entry.count;
        },
    };
    return createMiddleware(async ({ ctx, next, path }) => {
        const key = keyGenerator
            ? keyGenerator(ctx)
            : ctx.headers?.['x-forwarded-for']?.toString() ??
                ctx.headers?.['x-real-ip']?.toString() ??
                'anonymous';
        const requestKey = `${key}:${path}`;
        const count = await store.increment(requestKey);
        if (count > limit) {
            const { RPCError } = await import('./types.js');
            return {
                ok: false,
                error: new RPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: `Rate limit exceeded. Try again later.`,
                }),
            };
        }
        return next({
            ...ctx,
            rateLimit: {
                limit,
                remaining: limit - count,
                reset: Date.now() + windowMs,
            },
        });
    });
}
/**
 * Authentication middleware - validates authentication and adds user to context.
 *
 * @example
 * ```ts
 * const authMiddleware = createAuthMiddleware({
 *   validateToken: async (token) => {
 *     const user = await verifyJWT(token);
 *     return user;
 *   },
 * });
 *
 * const api = createAPI({
 *   users: {
 *     me: procedure.use(authMiddleware).query(async ({ ctx }) => {
 *       return ctx.user; // Fully typed!
 *     }),
 *   },
 * });
 * ```
 */
export function createAuthMiddleware(options) {
    const { getToken = (ctx) => {
        const authHeader = ctx.headers?.['authorization'];
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7);
        }
        return undefined;
    }, validateToken, required = true, } = options;
    return createMiddleware(async ({ ctx, next }) => {
        const token = getToken(ctx);
        if (!token) {
            if (required) {
                const { RPCError } = await import('./types.js');
                return {
                    ok: false,
                    error: new RPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    }),
                };
            }
            return next({ ...ctx, user: null });
        }
        const user = await validateToken(token);
        if (!user && required) {
            const { RPCError } = await import('./types.js');
            return {
                ok: false,
                error: new RPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired token',
                }),
            };
        }
        return next({ ...ctx, user });
    });
}
/**
 * Permission middleware - checks if user has required permissions.
 *
 * @example
 * ```ts
 * const api = createAPI({
 *   admin: {
 *     deleteUser: procedure
 *       .use(authMiddleware)
 *       .use(permissionMiddleware(['admin']))
 *       .mutation(async ({ input }) => {
 *         return db.users.delete({ where: { id: input.id } });
 *       }),
 *   },
 * });
 * ```
 */
export function permissionMiddleware(requiredPermissions, options) {
    const { getPermissions = (ctx) => {
        const user = ctx.user;
        return user?.permissions ?? user?.roles ?? [];
    }, mode = 'all', } = options ?? {};
    return createMiddleware(async ({ ctx, next }) => {
        const userPermissions = getPermissions(ctx);
        const hasPermission = mode === 'all'
            ? requiredPermissions.every((p) => userPermissions.includes(p))
            : requiredPermissions.some((p) => userPermissions.includes(p));
        if (!hasPermission) {
            const { RPCError } = await import('./types.js');
            return {
                ok: false,
                error: new RPCError({
                    code: 'FORBIDDEN',
                    message: `Missing required permissions: ${requiredPermissions.join(', ')}`,
                }),
            };
        }
        return next(ctx);
    });
}
/**
 * Retry middleware - retries failed procedures.
 */
export function retryMiddleware(options) {
    const { maxRetries = 3, delay = 1000, backoff = 2, shouldRetry = (error) => {
        // Only retry on server errors
        return error.code === 'INTERNAL_SERVER_ERROR' || error.code === 'TIMEOUT';
    }, } = options ?? {};
    return createMiddleware(async ({ ctx, input, next, type, path }) => {
        let lastError;
        let attempts = 0;
        while (attempts <= maxRetries) {
            const result = await next(ctx);
            if (result.ok) {
                return result;
            }
            lastError = result.error;
            if (!shouldRetry(lastError, attempts)) {
                return result;
            }
            attempts++;
            if (attempts <= maxRetries) {
                // Wait before retry with exponential backoff
                const waitTime = delay * Math.pow(backoff, attempts - 1);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
        const result = {
            ok: false,
        };
        if (lastError !== undefined) {
            result.error = lastError;
        }
        return result;
    });
}
/**
 * Cache middleware - caches query results.
 */
export function cacheMiddleware(options) {
    const { ttl = 60000, // 1 minute default
    keyGenerator = (path, input) => `rpc:${path}:${JSON.stringify(input)}`, } = options ?? {};
    // Simple in-memory cache
    const inMemoryCache = new Map();
    const store = options?.store ?? {
        get: async (key) => {
            const entry = inMemoryCache.get(key);
            if (!entry || Date.now() > entry.expiresAt) {
                inMemoryCache.delete(key);
                return undefined;
            }
            return entry.value;
        },
        set: async (key, value, ttlMs) => {
            inMemoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
        },
        delete: async (key) => {
            inMemoryCache.delete(key);
        },
    };
    return createMiddleware(async ({ ctx, input, next, type, path }) => {
        // Only cache queries
        if (type !== 'query') {
            return next(ctx);
        }
        const key = keyGenerator(path, input);
        // Check cache
        const cached = await store.get(key);
        if (cached !== undefined) {
            return { ok: true, data: cached };
        }
        // Execute and cache
        const result = await next(ctx);
        if (result.ok && result.data !== undefined) {
            await store.set(key, result.data, ttl);
        }
        return result;
    });
}
/**
 * Validation middleware - validates input/output with custom validators.
 */
export function validationMiddleware(options) {
    const { input: validateInput, output: validateOutput } = options;
    return createMiddleware(async ({ ctx, input, next }) => {
        // Validate input
        if (validateInput) {
            try {
                input = validateInput(input);
            }
            catch (error) {
                const { RPCError } = await import('./types.js');
                return {
                    ok: false,
                    error: new RPCError({
                        code: 'BAD_REQUEST',
                        message: error instanceof Error ? error.message : 'Input validation failed',
                        cause: error,
                    }),
                };
            }
        }
        const result = await next(ctx);
        // Validate output
        if (result.ok && validateOutput) {
            try {
                result.data = validateOutput(result.data);
            }
            catch (error) {
                const { RPCError } = await import('./types.js');
                return {
                    ok: false,
                    error: new RPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: error instanceof Error ? error.message : 'Output validation failed',
                        cause: error,
                    }),
                };
            }
        }
        return result;
    });
}
//# sourceMappingURL=middleware.js.map