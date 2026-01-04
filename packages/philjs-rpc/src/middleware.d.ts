/**
 * Middleware system for philjs-rpc.
 * Provides composable middleware for authentication, logging, rate limiting, etc.
 */
import type { Middleware, MiddlewareFn, MiddlewareResult, ProcedureContext, ProcedureType, RPCError } from './types.js';
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
export declare function createMiddleware<TInput = unknown, TContext extends ProcedureContext = ProcedureContext, TNewContext extends ProcedureContext = TContext>(fn: MiddlewareFn<TInput, TContext, TNewContext>): Middleware<TInput, TNewContext>;
/**
 * Execute a chain of middlewares.
 */
export declare function executeMiddlewareChain<TContext extends ProcedureContext>(middlewares: Middleware[], opts: {
    ctx: TContext;
    input: unknown;
    type: ProcedureType;
    path: string;
    handler: (ctx: TContext) => Promise<unknown>;
}): Promise<MiddlewareResult>;
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
export declare function loggerMiddleware(options?: {
    logInput?: boolean;
    logOutput?: boolean;
    logger?: (message: string, data?: unknown) => void;
}): Middleware;
/**
 * Timing middleware - adds timing information to context.
 */
export declare function timingMiddleware(): Middleware;
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
export declare function rateLimitMiddleware(options: {
    /** Maximum number of requests per window */
    limit: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Key generator function */
    keyGenerator?: (ctx: ProcedureContext) => string;
    /** Store for tracking requests (defaults to in-memory Map) */
    store?: {
        get: (key: string) => Promise<number | undefined>;
        set: (key: string, count: number, ttlMs: number) => Promise<void>;
        increment: (key: string) => Promise<number>;
    };
}): Middleware;
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
export declare function createAuthMiddleware<TUser>(options: {
    /** Extract token from context */
    getToken?: (ctx: ProcedureContext) => string | undefined;
    /** Validate token and return user */
    validateToken: (token: string) => Promise<TUser | null>;
    /** Optional: whether auth is required (default: true) */
    required?: boolean;
}): Middleware;
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
export declare function permissionMiddleware(requiredPermissions: string[], options?: {
    /** Extract permissions from context */
    getPermissions?: (ctx: ProcedureContext) => string[];
    /** Check mode: 'all' requires all permissions, 'any' requires at least one */
    mode?: 'all' | 'any';
}): Middleware;
/**
 * Retry middleware - retries failed procedures.
 */
export declare function retryMiddleware(options?: {
    /** Maximum number of retries */
    maxRetries?: number;
    /** Delay between retries in milliseconds */
    delay?: number;
    /** Exponential backoff factor */
    backoff?: number;
    /** Should retry check */
    shouldRetry?: (error: RPCError, attempt: number) => boolean;
}): Middleware;
/**
 * Cache middleware - caches query results.
 */
export declare function cacheMiddleware(options?: {
    /** TTL in milliseconds */
    ttl?: number;
    /** Cache key generator */
    keyGenerator?: (path: string, input: unknown) => string;
    /** Cache store */
    store?: {
        get: (key: string) => Promise<unknown | undefined>;
        set: (key: string, value: unknown, ttlMs: number) => Promise<void>;
        delete: (key: string) => Promise<void>;
    };
}): Middleware;
/**
 * Validation middleware - validates input/output with custom validators.
 */
export declare function validationMiddleware(options: {
    /** Input validator */
    input?: (input: unknown) => unknown;
    /** Output validator */
    output?: (output: unknown) => unknown;
}): Middleware;
//# sourceMappingURL=middleware.d.ts.map