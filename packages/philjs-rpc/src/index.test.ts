/**
 * Tests for philjs-rpc package.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAPI,
  procedure,
  createRouter,
  mergeRouters,
  getRouterPaths,
  getProcedureAtPath,
  isProcedure,
  isQuery,
  isMutation,
  RPCError,
  createMiddleware,
  executeMiddlewareChain,
  loggerMiddleware,
  rateLimitMiddleware,
  executeProcedure,
} from './index.js';

// ============================================================================
// Procedure Tests
// ============================================================================

describe('procedure', () => {
  describe('query', () => {
    it('should create a query procedure', () => {
      const listUsers = procedure.query(async () => {
        return [{ id: '1', name: 'John' }];
      });

      expect(listUsers._type).toBe('query');
      expect(typeof listUsers._def.handler).toBe('function');
    });

    it('should create a query procedure with input', () => {
      const getUserById = procedure
        .input({ parse: (input: unknown) => input as { id: string } })
        .query(async ({ input }) => {
          return { id: input.id, name: 'John' };
        });

      expect(getUserById._type).toBe('query');
      expect(getUserById._def.inputSchema).toBeDefined();
    });
  });

  describe('mutation', () => {
    it('should create a mutation procedure', () => {
      const createUser = procedure
        .input({ parse: (input: unknown) => input as { name: string; email: string } })
        .mutation(async ({ input }) => {
          return { id: '1', ...input };
        });

      expect(createUser._type).toBe('mutation');
      expect(typeof createUser._def.handler).toBe('function');
    });
  });

  describe('middleware', () => {
    it('should add middleware to procedure', () => {
      const middleware = createMiddleware(async ({ ctx, next }) => next(ctx));

      const protectedQuery = procedure
        .use(middleware)
        .query(async () => ({ secret: 'data' }));

      expect(protectedQuery._def.middlewares).toHaveLength(1);
    });

    it('should chain multiple middlewares', () => {
      const middleware1 = createMiddleware(async ({ ctx, next }) => next(ctx));
      const middleware2 = createMiddleware(async ({ ctx, next }) => next(ctx));

      const protectedQuery = procedure
        .use(middleware1)
        .use(middleware2)
        .query(async () => ({ secret: 'data' }));

      expect(protectedQuery._def.middlewares).toHaveLength(2);
    });
  });
});

// ============================================================================
// API Tests
// ============================================================================

describe('createAPI', () => {
  it('should create an API from a router', () => {
    const api = createAPI({
      users: {
        list: procedure.query(async () => []),
      },
    });

    expect(api._def.router).toBeDefined();
    expect(api._def.router.users).toBeDefined();
    expect(api._def.router.users.list).toBeDefined();
  });

  it('should support nested routers', () => {
    const api = createAPI({
      users: {
        list: procedure.query(async () => []),
        posts: {
          list: procedure.query(async () => []),
        },
      },
    });

    expect(api._def.router.users.posts.list).toBeDefined();
  });

  it('should throw on invalid router structure', () => {
    expect(() => {
      createAPI({
        // @ts-expect-error - Testing invalid input
        invalid: null,
      });
    }).toThrow();
  });
});

describe('createRouter', () => {
  it('should create a sub-router', () => {
    const usersRouter = createRouter({
      list: procedure.query(async () => []),
      byId: procedure
        .input({ parse: (input: unknown) => input as { id: string } })
        .query(async ({ input }) => ({ id: input.id })),
    });

    expect(usersRouter.list).toBeDefined();
    expect(usersRouter.byId).toBeDefined();
  });
});

describe('mergeRouters', () => {
  it('should merge multiple routers', () => {
    const usersRouter = createRouter({
      list: procedure.query(async () => []),
    });

    const postsRouter = createRouter({
      list: procedure.query(async () => []),
    });

    const merged = mergeRouters({
      users: usersRouter,
      posts: postsRouter,
    });

    expect(merged.users).toBe(usersRouter);
    expect(merged.posts).toBe(postsRouter);
  });
});

// ============================================================================
// Router Utility Tests
// ============================================================================

describe('getRouterPaths', () => {
  it('should return all procedure paths', () => {
    const api = createAPI({
      users: {
        list: procedure.query(async () => []),
        byId: procedure
          .input({ parse: (input: unknown) => input as { id: string } })
          .query(async () => null),
      },
      posts: {
        list: procedure.query(async () => []),
        comments: {
          list: procedure.query(async () => []),
        },
      },
    });

    const paths = getRouterPaths(api._def.router);

    expect(paths).toContain('users.list');
    expect(paths).toContain('users.byId');
    expect(paths).toContain('posts.list');
    expect(paths).toContain('posts.comments.list');
  });
});

describe('getProcedureAtPath', () => {
  it('should get procedure at a specific path', () => {
    const listProcedure = procedure.query(async () => []);

    const api = createAPI({
      users: {
        list: listProcedure,
      },
    });

    const found = getProcedureAtPath(api._def.router, 'users.list');

    expect(found).toBe(listProcedure);
  });

  it('should return null for non-existent path', () => {
    const api = createAPI({
      users: {
        list: procedure.query(async () => []),
      },
    });

    const found = getProcedureAtPath(api._def.router, 'users.nonexistent');

    expect(found).toBeNull();
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

describe('type guards', () => {
  describe('isProcedure', () => {
    it('should return true for procedures', () => {
      const proc = procedure.query(async () => []);
      expect(isProcedure(proc)).toBe(true);
    });

    it('should return false for non-procedures', () => {
      expect(isProcedure({})).toBe(false);
      expect(isProcedure(null)).toBe(false);
      expect(isProcedure('string')).toBe(false);
    });
  });

  describe('isQuery', () => {
    it('should return true for queries', () => {
      const proc = procedure.query(async () => []);
      expect(isQuery(proc)).toBe(true);
    });

    it('should return false for mutations', () => {
      const proc = procedure.mutation(async () => {});
      expect(isQuery(proc)).toBe(false);
    });
  });

  describe('isMutation', () => {
    it('should return true for mutations', () => {
      const proc = procedure.mutation(async () => {});
      expect(isMutation(proc)).toBe(true);
    });

    it('should return false for queries', () => {
      const proc = procedure.query(async () => []);
      expect(isMutation(proc)).toBe(false);
    });
  });
});

// ============================================================================
// Error Tests
// ============================================================================

describe('RPCError', () => {
  it('should create an error with code and message', () => {
    const error = new RPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });

    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
    expect(error.name).toBe('RPCError');
  });

  it('should include cause in error', () => {
    const cause = new Error('Database error');
    const error = new RPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch user',
      cause,
    });

    expect(error.cause).toBe(cause);
  });

  it('should serialize to JSON correctly', () => {
    const error = new RPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'RPCError',
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
  });
});

// ============================================================================
// Middleware Tests
// ============================================================================

describe('middleware', () => {
  describe('createMiddleware', () => {
    it('should create middleware that passes through', async () => {
      const middleware = createMiddleware(async ({ ctx, next }) => {
        return next(ctx);
      });

      expect(middleware.fn).toBeDefined();
    });

    it('should create middleware that modifies context', async () => {
      const middleware = createMiddleware(async ({ ctx, next }) => {
        return next({ ...ctx, modified: true });
      });

      const result = await middleware.fn({
        ctx: {},
        input: {},
        next: async (newCtx) => ({ ok: true, data: newCtx }),
        type: 'query',
        path: 'test',
      });

      expect(result.ok).toBe(true);
      expect((result.data as { modified: boolean }).modified).toBe(true);
    });
  });

  describe('executeMiddlewareChain', () => {
    it('should execute handler when no middlewares', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'success' });

      const result = await executeMiddlewareChain([], {
        ctx: {},
        input: {},
        type: 'query',
        path: 'test',
        handler,
      });

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
      expect(handler).toHaveBeenCalled();
    });

    it('should execute middlewares in order', async () => {
      const order: number[] = [];

      const middleware1 = createMiddleware(async ({ ctx, next }) => {
        order.push(1);
        const result = await next(ctx);
        order.push(4);
        return result;
      });

      const middleware2 = createMiddleware(async ({ ctx, next }) => {
        order.push(2);
        const result = await next(ctx);
        order.push(3);
        return result;
      });

      const handler = vi.fn().mockResolvedValue('done');

      await executeMiddlewareChain([middleware1, middleware2], {
        ctx: {},
        input: {},
        type: 'query',
        path: 'test',
        handler,
      });

      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('should stop chain on error', async () => {
      const error = new RPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authorized',
      });

      const middleware = createMiddleware(async () => {
        return { ok: false, error };
      });

      const handler = vi.fn();

      const result = await executeMiddlewareChain([middleware], {
        ctx: {},
        input: {},
        type: 'query',
        path: 'test',
        handler,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('loggerMiddleware', () => {
    it('should log procedure calls', async () => {
      const logger = vi.fn();
      const middleware = loggerMiddleware({ logger });

      const handler = vi.fn().mockResolvedValue('result');

      await middleware.fn({
        ctx: {},
        input: { test: true },
        next: async () => {
          await handler();
          return { ok: true, data: 'result' };
        },
        type: 'query',
        path: 'users.list',
      });

      expect(logger).toHaveBeenCalledTimes(2);
      expect(logger).toHaveBeenCalledWith(
        '[RPC] QUERY users.list started',
        undefined
      );
    });
  });

  describe('rateLimitMiddleware', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests within limit', async () => {
      const middleware = rateLimitMiddleware({
        limit: 2,
        windowMs: 1000,
      });

      const next = vi.fn().mockResolvedValue({ ok: true, data: 'success' });

      // First request
      const result1 = await middleware.fn({
        ctx: { headers: { 'x-forwarded-for': '127.0.0.1' } },
        input: {},
        next,
        type: 'query',
        path: 'test',
      });

      expect(result1.ok).toBe(true);

      // Second request
      const result2 = await middleware.fn({
        ctx: { headers: { 'x-forwarded-for': '127.0.0.1' } },
        input: {},
        next,
        type: 'query',
        path: 'test',
      });

      expect(result2.ok).toBe(true);
    });

    it('should block requests over limit', async () => {
      const middleware = rateLimitMiddleware({
        limit: 1,
        windowMs: 1000,
      });

      const next = vi.fn().mockResolvedValue({ ok: true, data: 'success' });

      // First request (allowed)
      await middleware.fn({
        ctx: { headers: { 'x-forwarded-for': '127.0.0.1' } },
        input: {},
        next,
        type: 'query',
        path: 'test',
      });

      // Second request (blocked)
      const result = await middleware.fn({
        ctx: { headers: { 'x-forwarded-for': '127.0.0.1' } },
        input: {},
        next,
        type: 'query',
        path: 'test',
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('TOO_MANY_REQUESTS');
    });
  });
});

// ============================================================================
// Procedure Execution Tests
// ============================================================================

describe('executeProcedure', () => {
  it('should execute a simple query', async () => {
    const proc = procedure.query(async () => {
      return [{ id: '1', name: 'John' }];
    });

    const result = await executeProcedure(proc, {
      input: undefined,
      ctx: {},
      path: 'users.list',
    });

    expect(result).toEqual([{ id: '1', name: 'John' }]);
  });

  it('should execute a query with validated input', async () => {
    const proc = procedure
      .input({
        parse: (input: unknown) => {
          const data = input as { id: string };
          if (!data.id) throw new Error('id required');
          return data;
        },
      })
      .query(async ({ input }) => {
        return { id: input.id, name: 'John' };
      });

    const result = await executeProcedure(proc, {
      input: { id: '123' },
      ctx: {},
      path: 'users.byId',
    });

    expect(result).toEqual({ id: '123', name: 'John' });
  });

  it('should throw on invalid input', async () => {
    const proc = procedure
      .input({
        parse: (input: unknown) => {
          const data = input as { id: string };
          if (!data.id) throw new Error('id required');
          return data;
        },
      })
      .query(async ({ input }) => {
        return { id: input.id };
      });

    await expect(
      executeProcedure(proc, {
        input: {},
        ctx: {},
        path: 'users.byId',
      })
    ).rejects.toThrow();
  });

  it('should execute with middleware', async () => {
    const middleware = createMiddleware(async ({ ctx, next }) => {
      return next({ ...ctx, user: { id: 'user-1' } });
    });

    const proc = procedure
      .use(middleware)
      .query(async ({ ctx }) => {
        return { userId: (ctx as { user: { id: string } }).user.id };
      });

    const result = await executeProcedure(proc, {
      input: undefined,
      ctx: {},
      path: 'profile',
    });

    expect(result).toEqual({ userId: 'user-1' });
  });
});
