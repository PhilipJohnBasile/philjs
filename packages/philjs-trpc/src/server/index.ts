/**
 * @philjs/trpc - Server utilities
 * Type-safe RPC server - framework agnostic
 */

import type { BaseContext, AuthContext, RouterConfig, MiddlewareFunction } from '../types';

/**
 * RPC Error class
 */
export class RPCError extends Error {
  code: string;
  statusCode: number;

  constructor(options: { code: string; message: string; statusCode?: number }) {
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
} as const;

/**
 * Create an RPC router
 */
export function createRouter<TContext extends BaseContext = BaseContext>() {
  const procedures = new Map<string, ProcedureDefinition<TContext>>();

  interface ProcedureDefinition<T> {
    type: 'query' | 'mutation' | 'subscription';
    middleware: MiddlewareFunction<T>[];
    handler: (opts: { ctx: T; input: unknown }) => Promise<unknown>;
    inputValidator?: (input: unknown) => unknown;
  }

  const createProcedure = (type: 'query' | 'mutation' | 'subscription') => {
    let middleware: MiddlewareFunction<TContext>[] = [];
    let inputValidator: ((input: unknown) => unknown) | undefined;

    const builder = {
      use(mw: MiddlewareFunction<TContext>) {
        middleware.push(mw);
        return builder;
      },

      input<T>(validator: (input: unknown) => T) {
        inputValidator = validator;
        return builder;
      },

      handler(fn: (opts: { ctx: TContext; input: unknown }) => Promise<unknown>) {
        return (name: string) => {
          procedures.set(name, {
            type,
            middleware,
            handler: fn,
            inputValidator,
          });
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
    async handle(
      request: { method: string; path: string; input?: unknown },
      ctx: TContext
    ): Promise<{ data?: unknown; error?: { code: string; message: string } }> {
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
          await mw(currentCtx, async () => {});
        }

        // Execute handler
        const result = await procedure.handler({ ctx: currentCtx, input });
        return { data: result };
      } catch (error) {
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
export function createAuthMiddleware<TContext extends AuthContext>(): MiddlewareFunction<TContext> {
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
export function createRoleMiddleware<TContext extends AuthContext>(
  allowedRoles: string[]
): MiddlewareFunction<TContext> {
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
export function createRateLimitMiddleware<TContext extends BaseContext>(options: {
  windowMs: number;
  max: number;
  keyGenerator?: (ctx: TContext) => string;
}): MiddlewareFunction<TContext> {
  const { windowMs, max, keyGenerator } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();

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
    } else {
      requests.set(key, { count: 1, resetTime: now + windowMs });
    }

    await next();
  };
}

/**
 * Logging middleware factory
 */
export function createLoggingMiddleware<TContext extends BaseContext>(options?: {
  logger?: { info: (msg: unknown) => void; error: (msg: unknown) => void };
}): MiddlewareFunction<TContext> {
  const logger = options?.logger || console;

  return async (ctx, next) => {
    const start = Date.now();
    try {
      await next();
      logger.info({ duration: Date.now() - start, status: 'success' });
    } catch (error) {
      logger.error({ duration: Date.now() - start, status: 'error', error });
      throw error;
    }
  };
}

/**
 * Caching middleware factory
 */
export function createCacheMiddleware<TContext extends BaseContext>(options: {
  ttl: number;
  keyGenerator?: (ctx: TContext) => string;
}): MiddlewareFunction<TContext> {
  const { ttl, keyGenerator } = options;
  const cache = new Map<string, { data: unknown; expiresAt: number }>();

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
export function validateInput<T>(
  schema: { parse: (input: unknown) => T }
): (input: unknown) => T {
  return (input: unknown) => schema.parse(input);
}
