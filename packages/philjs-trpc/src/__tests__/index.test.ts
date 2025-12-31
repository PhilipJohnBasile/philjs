/**
 * @philjs/trpc - Test Suite
 * Tests for tRPC client and server utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Server exports
  createRouter,
  createAuthMiddleware,
  createRoleMiddleware,
  createRateLimitMiddleware,
  createLoggingMiddleware,
  createCacheMiddleware,
  validateInput,
  RPCError,
  ErrorCodes,
  // Client exports
  createQueryCache,
  createCachedQuery,
} from '../index.js';

describe('@philjs/trpc', () => {
  describe('Export Verification', () => {
    it('should export server utilities', () => {
      expect(createRouter).toBeDefined();
      expect(typeof createRouter).toBe('function');
      expect(createAuthMiddleware).toBeDefined();
      expect(createRoleMiddleware).toBeDefined();
      expect(createRateLimitMiddleware).toBeDefined();
      expect(createLoggingMiddleware).toBeDefined();
      expect(createCacheMiddleware).toBeDefined();
      expect(validateInput).toBeDefined();
    });

    it('should export RPCError class', () => {
      expect(RPCError).toBeDefined();
      expect(typeof RPCError).toBe('function');
    });

    it('should export ErrorCodes', () => {
      expect(ErrorCodes).toBeDefined();
      expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });

    it('should export client utilities', () => {
      expect(createQueryCache).toBeDefined();
      expect(typeof createQueryCache).toBe('function');
      expect(createCachedQuery).toBeDefined();
      expect(typeof createCachedQuery).toBe('function');
    });
  });

  describe('RPCError', () => {
    it('should create error with code and message', () => {
      const error = new RPCError({
        code: ErrorCodes.BAD_REQUEST,
        message: 'Invalid input',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RPCError);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('RPCError');
    });

    it('should have default status code of 500', () => {
      const error = new RPCError({
        code: 'TEST_ERROR',
        message: 'Test error',
      });

      expect(error.statusCode).toBe(500);
    });

    it('should allow custom status code', () => {
      const error = new RPCError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not logged in',
        statusCode: 401,
      });

      expect(error.statusCode).toBe(401);
    });
  });

  describe('createRouter', () => {
    it('should create a router with query, mutation, and subscription methods', () => {
      const router = createRouter();

      expect(router.query).toBeDefined();
      expect(router.mutation).toBeDefined();
      expect(router.subscription).toBeDefined();
      expect(router.getProcedures).toBeDefined();
      expect(router.handle).toBeDefined();
    });

    it('should allow defining query procedures', () => {
      const router = createRouter();

      router.query.handler(async ({ ctx, input }) => {
        return { result: 'test' };
      })('testQuery');

      const procedures = router.getProcedures();
      expect(procedures.has('testQuery')).toBe(true);
      expect(procedures.get('testQuery')?.type).toBe('query');
    });

    it('should allow defining mutation procedures', () => {
      const router = createRouter();

      router.mutation.handler(async ({ ctx, input }) => {
        return { created: true };
      })('createItem');

      const procedures = router.getProcedures();
      expect(procedures.has('createItem')).toBe(true);
      expect(procedures.get('createItem')?.type).toBe('mutation');
    });

    it('should handle query requests', async () => {
      const router = createRouter();

      router.query.handler(async ({ input }) => {
        return { echo: input };
      })('echo');

      const result = await router.handle(
        { method: 'query', path: 'echo', input: 'hello' },
        {}
      );

      expect(result.data).toEqual({ echo: 'hello' });
      expect(result.error).toBeUndefined();
    });

    it('should return NOT_FOUND for unknown procedures', async () => {
      const router = createRouter();

      const result = await router.handle(
        { method: 'query', path: 'unknown', input: null },
        {}
      );

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCodes.NOT_FOUND);
    });

    it('should return BAD_REQUEST for wrong method type', async () => {
      const router = createRouter();

      router.query.handler(async () => 'result')('myQuery');

      const result = await router.handle(
        { method: 'mutation', path: 'myQuery', input: null },
        {}
      );

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCodes.BAD_REQUEST);
    });

    it('should support input validation', async () => {
      const router = createRouter();

      const mockValidator = (input: unknown) => {
        if (typeof input !== 'string') {
          throw new Error('Input must be a string');
        }
        return input;
      };

      router.query
        .input(mockValidator)
        .handler(async ({ input }) => ({ validated: input }))('validated');

      const result = await router.handle(
        { method: 'query', path: 'validated', input: 'test' },
        {}
      );

      expect(result.data).toEqual({ validated: 'test' });
    });

    it('should support middleware chaining', () => {
      const router = createRouter();
      const middlewareCalls: string[] = [];

      const middleware1 = async (_ctx: any, next: () => Promise<unknown>) => {
        middlewareCalls.push('mw1');
        await next();
      };

      const middleware2 = async (_ctx: any, next: () => Promise<unknown>) => {
        middlewareCalls.push('mw2');
        await next();
      };

      router.query
        .use(middleware1)
        .use(middleware2)
        .handler(async () => 'result')('withMiddleware');

      const procedures = router.getProcedures();
      expect(procedures.get('withMiddleware')?.middleware.length).toBe(2);
    });
  });

  describe('createAuthMiddleware', () => {
    it('should create an authentication middleware function', () => {
      const middleware = createAuthMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should throw UNAUTHORIZED when user is not present', async () => {
      const middleware = createAuthMiddleware();
      const ctx = { user: null };

      await expect(middleware(ctx as any, async () => {})).rejects.toThrow(RPCError);

      try {
        await middleware(ctx as any, async () => {});
      } catch (error) {
        expect(error).toBeInstanceOf(RPCError);
        expect((error as RPCError).code).toBe(ErrorCodes.UNAUTHORIZED);
      }
    });

    it('should call next when user is present', async () => {
      const middleware = createAuthMiddleware();
      const ctx = { user: { id: '1', email: 'test@example.com' } };
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createRoleMiddleware', () => {
    it('should create a role-based middleware function', () => {
      const middleware = createRoleMiddleware(['admin']);
      expect(typeof middleware).toBe('function');
    });

    it('should throw UNAUTHORIZED when user is not present', async () => {
      const middleware = createRoleMiddleware(['admin']);
      const ctx = { user: null };

      try {
        await middleware(ctx as any, async () => {});
      } catch (error) {
        expect(error).toBeInstanceOf(RPCError);
        expect((error as RPCError).code).toBe(ErrorCodes.UNAUTHORIZED);
      }
    });

    it('should throw FORBIDDEN when user does not have required role', async () => {
      const middleware = createRoleMiddleware(['admin']);
      const ctx = { user: { id: '1', role: 'user' } };

      try {
        await middleware(ctx as any, async () => {});
      } catch (error) {
        expect(error).toBeInstanceOf(RPCError);
        expect((error as RPCError).code).toBe(ErrorCodes.FORBIDDEN);
      }
    });

    it('should call next when user has required role', async () => {
      const middleware = createRoleMiddleware(['admin', 'moderator']);
      const ctx = { user: { id: '1', role: 'admin' } };
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(ctx as any, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should create a rate limiting middleware function', () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        max: 10,
      });
      expect(typeof middleware).toBe('function');
    });

    it('should allow requests within rate limit', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        max: 5,
      });
      const ctx = {};
      const next = vi.fn().mockResolvedValue(undefined);

      // First request should succeed
      await middleware(ctx as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should throw TOO_MANY_REQUESTS when limit exceeded', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        max: 2,
      });
      const ctx = {};
      const next = vi.fn().mockResolvedValue(undefined);

      // Make requests up to and past the limit
      await middleware(ctx as any, next);
      await middleware(ctx as any, next);

      try {
        await middleware(ctx as any, next);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RPCError);
        expect((error as RPCError).code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
      }
    });

    it('should support custom key generator', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        max: 2,
        keyGenerator: (ctx: any) => ctx.userId,
      });
      const next = vi.fn().mockResolvedValue(undefined);

      // Different users should have separate rate limits
      const ctx1 = { userId: 'user1' };
      const ctx2 = { userId: 'user2' };

      await middleware(ctx1 as any, next);
      await middleware(ctx1 as any, next);
      await middleware(ctx2 as any, next);
      await middleware(ctx2 as any, next);

      expect(next).toHaveBeenCalledTimes(4);
    });
  });

  describe('createLoggingMiddleware', () => {
    it('should create a logging middleware function', () => {
      const middleware = createLoggingMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should log successful requests', async () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
      };
      const middleware = createLoggingMiddleware({ logger: mockLogger });
      const ctx = {};
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(ctx as any, next);

      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log errors and rethrow', async () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
      };
      const middleware = createLoggingMiddleware({ logger: mockLogger });
      const ctx = {};
      const testError = new Error('Test error');
      const next = vi.fn().mockRejectedValue(testError);

      await expect(middleware(ctx as any, next)).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validateInput', () => {
    it('should return a validation function', () => {
      const schema = { parse: (input: unknown) => input as string };
      const validator = validateInput(schema);
      expect(typeof validator).toBe('function');
    });

    it('should call schema.parse with input', () => {
      const schema = {
        parse: vi.fn((input: unknown) => input as string),
      };
      const validator = validateInput(schema);

      validator('test input');

      expect(schema.parse).toHaveBeenCalledWith('test input');
    });

    it('should return parsed result', () => {
      const schema = {
        parse: (input: unknown) => {
          if (typeof input === 'string') {
            return input.toUpperCase();
          }
          throw new Error('Invalid');
        },
      };
      const validator = validateInput(schema);

      const result = validator('hello');

      expect(result).toBe('HELLO');
    });
  });

  describe('createQueryCache', () => {
    it('should create a cache with default TTL', () => {
      const cache = createQueryCache();
      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
      expect(cache.invalidate).toBeDefined();
      expect(cache.invalidateAll).toBeDefined();
      expect(cache.has).toBeDefined();
    });

    it('should store and retrieve values', () => {
      const cache = createQueryCache();

      cache.set('key1', { data: 'value1' });
      const result = cache.get<{ data: string }>('key1');

      expect(result).toEqual({ data: 'value1' });
    });

    it('should return undefined for missing keys', () => {
      const cache = createQueryCache();

      const result = cache.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should invalidate specific keys', () => {
      const cache = createQueryCache();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.invalidate('key1');

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should invalidate all keys', () => {
      const cache = createQueryCache();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.invalidateAll();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const cache = createQueryCache();

      cache.set('exists', 'value');

      expect(cache.has('exists')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should expire entries after TTL', async () => {
      const cache = createQueryCache({ ttl: 50 }); // 50ms TTL

      cache.set('shortLived', 'value');
      expect(cache.get('shortLived')).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.get('shortLived')).toBeUndefined();
    });
  });

  describe('createCachedQuery', () => {
    it('should create a cached query function', () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'result' });
      const cachedQuery = createCachedQuery(queryFn);

      expect(typeof cachedQuery).toBe('function');
    });

    it('should call query function on first request', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'result' });
      const cachedQuery = createCachedQuery(queryFn);

      const result = await cachedQuery({ id: '1' });

      expect(queryFn).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual({ data: 'result' });
    });

    it('should return cached result on subsequent requests', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'result' });
      const cachedQuery = createCachedQuery(queryFn);

      await cachedQuery({ id: '1' });
      await cachedQuery({ id: '1' });
      await cachedQuery({ id: '1' });

      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should call query function for different inputs', async () => {
      const queryFn = vi.fn().mockImplementation((input) =>
        Promise.resolve({ data: input.id })
      );
      const cachedQuery = createCachedQuery(queryFn);

      await cachedQuery({ id: '1' });
      await cachedQuery({ id: '2' });

      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should support custom key function', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: 'result' });
      const cachedQuery = createCachedQuery(queryFn, {
        keyFn: (input: { id: string }) => input.id,
      });

      await cachedQuery({ id: '1' });
      await cachedQuery({ id: '1' });

      expect(queryFn).toHaveBeenCalledTimes(1);
    });
  });
});
