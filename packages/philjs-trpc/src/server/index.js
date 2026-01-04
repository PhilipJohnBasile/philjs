/**
 * @philjs/trpc - Server utilities
 * Type-safe RPC server - framework agnostic
 */
/**
 * RPC Error class
 */
export class RPCError extends Error {
    code;
    statusCode;
    constructor(options) {
        super(options.message);
        this.code = options.code;
        this.statusCode = options.statusCode || 500;
        this.name = 'RPCError';
    }
}
/**
 * Common error codes
 */
export const ErrorCodes = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
};
/**
 * Create an RPC router
 */
export function createRouter() {
    const procedures = new Map();
    const createProcedure = (type) => {
        let middleware = [];
        let inputValidator;
        const builder = {
            use(mw) {
                middleware.push(mw);
                return builder;
            },
            input(validator) {
                inputValidator = validator;
                return builder;
            },
            handler(fn) {
                return (name) => {
                    const definition = {
                        type,
                        middleware,
                        handler: fn,
                    };
                    if (inputValidator !== undefined)
                        definition.inputValidator = inputValidator;
                    procedures.set(name, definition);
                };
            },
        };
        return builder;
    };
    return {
        query: createProcedure('query'),
        mutation: createProcedure('mutation'),
        subscription: createProcedure('subscription'),
        /**
         * Get all procedure definitions
         */
        getProcedures() {
            return procedures;
        },
        /**
         * Handle an incoming request
         */
        async handle(request, ctx) {
            const procedure = procedures.get(request.path);
            if (!procedure) {
                return {
                    error: { code: ErrorCodes.NOT_FOUND, message: `Procedure not found: ${request.path}` },
                };
            }
            if (procedure.type !== request.method) {
                return {
                    error: { code: ErrorCodes.BAD_REQUEST, message: `Invalid method for ${request.path}` },
                };
            }
            try {
                // Validate input
                let input = request.input;
                if (procedure.inputValidator) {
                    input = procedure.inputValidator(input);
                }
                // Run middleware chain
                let currentCtx = ctx;
                for (const mw of procedure.middleware) {
                    await mw(currentCtx, async () => { });
                }
                // Execute handler
                const result = await procedure.handler({ ctx: currentCtx, input });
                return { data: result };
            }
            catch (error) {
                if (error instanceof RPCError) {
                    return { error: { code: error.code, message: error.message } };
                }
                return {
                    error: {
                        code: ErrorCodes.INTERNAL_ERROR,
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                };
            }
        },
    };
}
/**
 * Authentication middleware factory
 */
export function createAuthMiddleware() {
    return async (ctx, next) => {
        if (!ctx.user) {
            throw new RPCError({
                code: ErrorCodes.UNAUTHORIZED,
                message: 'You must be logged in to access this resource',
                statusCode: 401,
            });
        }
        await next();
    };
}
/**
 * Role-based access control middleware factory
 */
export function createRoleMiddleware(allowedRoles) {
    return async (ctx, next) => {
        if (!ctx.user) {
            throw new RPCError({
                code: ErrorCodes.UNAUTHORIZED,
                message: 'You must be logged in to access this resource',
                statusCode: 401,
            });
        }
        if (!ctx.user.role || !allowedRoles.includes(ctx.user.role)) {
            throw new RPCError({
                code: ErrorCodes.FORBIDDEN,
                message: 'You do not have permission to access this resource',
                statusCode: 403,
            });
        }
        await next();
    };
}
/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options) {
    const { windowMs, max, keyGenerator } = options;
    const requests = new Map();
    return async (ctx, next) => {
        const key = keyGenerator?.(ctx) || 'global';
        const now = Date.now();
        const record = requests.get(key);
        if (record && now < record.resetTime) {
            if (record.count >= max) {
                throw new RPCError({
                    code: ErrorCodes.TOO_MANY_REQUESTS,
                    message: 'Too many requests, please try again later',
                    statusCode: 429,
                });
            }
            record.count++;
        }
        else {
            requests.set(key, { count: 1, resetTime: now + windowMs });
        }
        await next();
    };
}
/**
 * Logging middleware factory
 */
export function createLoggingMiddleware(options) {
    const logger = options?.logger || console;
    return async (ctx, next) => {
        const start = Date.now();
        try {
            await next();
            logger.info({ duration: Date.now() - start, status: 'success' });
        }
        catch (error) {
            logger.error({ duration: Date.now() - start, status: 'error', error });
            throw error;
        }
    };
}
/**
 * Caching middleware factory
 */
export function createCacheMiddleware(options) {
    const { ttl, keyGenerator } = options;
    const cache = new Map();
    return async (ctx, next) => {
        const key = keyGenerator?.(ctx) || 'default';
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && now < cached.expiresAt) {
            return cached.data;
        }
        await next();
    };
}
/**
 * Input validation helper using a schema
 */
export function validateInput(schema) {
    return (input) => schema.parse(input);
}
//# sourceMappingURL=index.js.map