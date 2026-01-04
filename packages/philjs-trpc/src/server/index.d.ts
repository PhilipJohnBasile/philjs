/**
 * @philjs/trpc - Server utilities
 * Type-safe RPC server - framework agnostic
 */
import type { BaseContext, AuthContext, MiddlewareFunction } from '../types.js';
/**
 * RPC Error class
 */
export declare class RPCError extends Error {
    code: string;
    statusCode: number;
    constructor(options: {
        code: string;
        message: string;
        statusCode?: number;
    });
}
/**
 * Common error codes
 */
export declare const ErrorCodes: {
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export interface ProcedureDefinition<T> {
    type: 'query' | 'mutation' | 'subscription';
    middleware: MiddlewareFunction<T>[];
    handler: (opts: {
        ctx: T;
        input: unknown;
    }) => Promise<unknown>;
    inputValidator?: (input: unknown) => unknown;
}
/**
 * Create an RPC router
 */
export declare function createRouter<TContext extends BaseContext = BaseContext>(): {
    query: {
        use(mw: MiddlewareFunction<TContext>): /*elided*/ any;
        input<T>(validator: (input: unknown) => T): /*elided*/ any;
        handler(fn: (opts: {
            ctx: TContext;
            input: unknown;
        }) => Promise<unknown>): (name: string) => void;
    };
    mutation: {
        use(mw: MiddlewareFunction<TContext>): /*elided*/ any;
        input<T>(validator: (input: unknown) => T): /*elided*/ any;
        handler(fn: (opts: {
            ctx: TContext;
            input: unknown;
        }) => Promise<unknown>): (name: string) => void;
    };
    subscription: {
        use(mw: MiddlewareFunction<TContext>): /*elided*/ any;
        input<T>(validator: (input: unknown) => T): /*elided*/ any;
        handler(fn: (opts: {
            ctx: TContext;
            input: unknown;
        }) => Promise<unknown>): (name: string) => void;
    };
    /**
     * Get all procedure definitions
     */
    getProcedures(): Map<string, ProcedureDefinition<TContext>>;
    /**
     * Handle an incoming request
     */
    handle(request: {
        method: string;
        path: string;
        input?: unknown;
    }, ctx: TContext): Promise<{
        data?: unknown;
        error?: {
            code: string;
            message: string;
        };
    }>;
};
/**
 * Authentication middleware factory
 */
export declare function createAuthMiddleware<TContext extends AuthContext>(): MiddlewareFunction<TContext>;
/**
 * Role-based access control middleware factory
 */
export declare function createRoleMiddleware<TContext extends AuthContext>(allowedRoles: string[]): MiddlewareFunction<TContext>;
/**
 * Rate limiting middleware factory
 */
export declare function createRateLimitMiddleware<TContext extends BaseContext>(options: {
    windowMs: number;
    max: number;
    keyGenerator?: (ctx: TContext) => string;
}): MiddlewareFunction<TContext>;
/**
 * Logging middleware factory
 */
export declare function createLoggingMiddleware<TContext extends BaseContext>(options?: {
    logger?: {
        info: (msg: unknown) => void;
        error: (msg: unknown) => void;
    };
}): MiddlewareFunction<TContext>;
/**
 * Caching middleware factory
 */
export declare function createCacheMiddleware<TContext extends BaseContext>(options: {
    ttl: number;
    keyGenerator?: (ctx: TContext) => string;
}): MiddlewareFunction<TContext>;
/**
 * Input validation helper using a schema
 */
export declare function validateInput<T>(schema: {
    parse: (input: unknown) => T;
}): (input: unknown) => T;
//# sourceMappingURL=index.d.ts.map