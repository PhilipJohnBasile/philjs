/**
 * Middleware system for philjs-rpc.
 * Provides composable middleware for authentication, logging, rate limiting, etc.
 */

import type {
  Middleware,
  MiddlewareFn,
  MiddlewareResult,
  ProcedureContext,
  ProcedureType,
  RPCError,
} from './types.js';

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
export function createMiddleware<
  TInput = unknown,
  TContext extends ProcedureContext = ProcedureContext,
  TNewContext extends ProcedureContext = TContext
>(fn: MiddlewareFn<TInput, TContext, TNewContext>): Middleware<TInput, TNewContext> {
  return {
    _input: undefined as TInput,
    _context: undefined as unknown as TNewContext,
    fn: fn as any,
  };
}

// ============================================================================
// Middleware Execution
// ============================================================================

/**
 * Execute a chain of middlewares.
 */
export async function executeMiddlewareChain<TContext extends ProcedureContext>(
  middlewares: Middleware[],
  opts: {
    ctx: TContext;
    input: unknown;
    type: ProcedureType;
    path: string;
    handler: () => Promise<unknown>;
  }
): Promise<MiddlewareResult> {
  const { ctx, input, type, path, handler } = opts;

  // If no middlewares, execute handler directly
  if (middlewares.length === 0) {
    try {
      const data = await handler();
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error as RPCError,
      };
    }
  }

  // Create the middleware chain
  let index = 0;
  let currentCtx = ctx;

  const next = async (newCtx?: any): Promise<MiddlewareResult> => {
    if (newCtx) {
      currentCtx = newCtx;
    }

    // If we've exhausted all middlewares, run the handler
    if (index >= middlewares.length) {
      try {
        const data = await handler();
        return { ok: true, data };
      } catch (error) {
        return {
          ok: false,
          error: error as RPCError,
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
    } catch (error) {
      return {
        ok: false,
        error: error as RPCError,
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
export function loggerMiddleware(options?: {
  logInput?: boolean;
  logOutput?: boolean;
  logger?: (message: string, data?: unknown) => void;
}): Middleware {
  const { logInput = false, logOutput = false, logger = console.log } = options ?? {};

  return createMiddleware(async ({ ctx, input, next, type, path }) => {
    const start = Date.now();

    logger(`[RPC] ${type.toUpperCase()} ${path} started`, logInput ? { input } : undefined);

    const result = await next(ctx);
    const duration = Date.now() - start;

    if (result.ok) {
      logger(
        `[RPC] ${type.toUpperCase()} ${path} completed in ${duration}ms`,
        logOutput ? { data: result.data } : undefined
      );
    } else {
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
export function timingMiddleware(): Middleware {
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
export function rateLimitMiddleware(options: {
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
}): Middleware {
  const { limit, windowMs, keyGenerator } = options;

  // Simple in-memory store
  const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

  const store = options.store ?? {
    get: async (key: string) => {
      const entry = inMemoryStore.get(key);
      if (!entry || Date.now() > entry.resetAt) {
        return undefined;
      }
      return entry.count;
    },
    set: async (key: string, count: number, ttlMs: number) => {
      inMemoryStore.set(key, { count, resetAt: Date.now() + ttlMs });
    },
    increment: async (key: string) => {
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
export function createAuthMiddleware<TUser>(options: {
  /** Extract token from context */
  getToken?: (ctx: ProcedureContext) => string | undefined;
  /** Validate token and return user */
  validateToken: (token: string) => Promise<TUser | null>;
  /** Optional: whether auth is required (default: true) */
  required?: boolean;
}): Middleware {
  const {
    getToken = (ctx) => {
      const authHeader = ctx.headers?.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }
      return undefined;
    },
    validateToken,
    required = true,
  } = options;

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
export function permissionMiddleware(
  requiredPermissions: string[],
  options?: {
    /** Extract permissions from context */
    getPermissions?: (ctx: ProcedureContext) => string[];
    /** Check mode: 'all' requires all permissions, 'any' requires at least one */
    mode?: 'all' | 'any';
  }
): Middleware {
  const {
    getPermissions = (ctx) => {
      const user = ctx.user as { permissions?: string[]; roles?: string[] } | undefined;
      return user?.permissions ?? user?.roles ?? [];
    },
    mode = 'all',
  } = options ?? {};

  return createMiddleware(async ({ ctx, next }) => {
    const userPermissions = getPermissions(ctx);

    const hasPermission =
      mode === 'all'
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
export function retryMiddleware(options?: {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Exponential backoff factor */
  backoff?: number;
  /** Should retry check */
  shouldRetry?: (error: RPCError, attempt: number) => boolean;
}): Middleware {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => {
      // Only retry on server errors
      return error.code === 'INTERNAL_SERVER_ERROR' || error.code === 'TIMEOUT';
    },
  } = options ?? {};

  return createMiddleware(async ({ ctx, input, next, type, path }) => {
    let lastError: RPCError | undefined;
    let attempts = 0;

    while (attempts <= maxRetries) {
      const result = await next(ctx);

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      if (!shouldRetry(lastError!, attempts)) {
        return result;
      }

      attempts++;

      if (attempts <= maxRetries) {
        // Wait before retry with exponential backoff
        const waitTime = delay * Math.pow(backoff, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    return {
      ok: false,
      error: lastError,
    };
  });
}

/**
 * Cache middleware - caches query results.
 */
export function cacheMiddleware(options?: {
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
}): Middleware {
  const {
    ttl = 60000, // 1 minute default
    keyGenerator = (path, input) => `rpc:${path}:${JSON.stringify(input)}`,
  } = options ?? {};

  // Simple in-memory cache
  const inMemoryCache = new Map<string, { value: unknown; expiresAt: number }>();

  const store = options?.store ?? {
    get: async (key: string) => {
      const entry = inMemoryCache.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        inMemoryCache.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set: async (key: string, value: unknown, ttlMs: number) => {
      inMemoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    delete: async (key: string) => {
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
export function validationMiddleware(options: {
  /** Input validator */
  input?: (input: unknown) => unknown;
  /** Output validator */
  output?: (output: unknown) => unknown;
}): Middleware {
  const { input: validateInput, output: validateOutput } = options;

  return createMiddleware(async ({ ctx, input, next }) => {
    // Validate input
    if (validateInput) {
      try {
        input = validateInput(input);
      } catch (error) {
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
      } catch (error) {
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
