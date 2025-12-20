/**
 * Tests for treaty client.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { treaty, createTreatyClient, TreatyError } from './treaty.js';
import { createAPI, procedure } from './index.js';
import { z } from 'zod';

// ============================================================================
// Test API Setup
// ============================================================================

const testAPI = createAPI({
  users: {
    list: procedure.query(async () => {
      return [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ];
    }),

    byId: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return { id: input.id, name: 'Alice', email: 'alice@example.com' };
      }),

    create: procedure
      .input(z.object({ name: z.string(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        return { id: '3', ...input };
      }),

    update: procedure
      .input(z.object({ id: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        return { id: input.id, name: input.name, email: 'updated@example.com' };
      }),

    delete: procedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true, id: input.id };
      }),
  },

  posts: {
    list: procedure.query(async () => {
      return [
        { id: '1', title: 'Post 1', content: 'Content 1' },
        { id: '2', title: 'Post 2', content: 'Content 2' },
      ];
    }),

    nested: {
      deep: {
        endpoint: procedure
          .input(z.object({ value: z.string() }))
          .query(async ({ input }) => {
            return { result: `Deep: ${input.value}` };
          }),
      },
    },
  },
});

type TestAPI = typeof testAPI;

// ============================================================================
// Mock Fetch
// ============================================================================

function createMockFetch(responses: Record<string, unknown>) {
  return vi.fn(async (url: string, options?: RequestInit) => {
    const body = options?.body ? JSON.parse(options.body as string) : null;
    const path = body?.path || 'unknown';
    const response = responses[path];

    if (!response) {
      return {
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: `Procedure not found: ${path}`,
          },
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        result: { data: response },
      }),
    };
  }) as unknown as typeof fetch;
}

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('Treaty Client - Basic Functionality', () => {
  it('should create a treaty client', () => {
    const client = treaty<TestAPI>('http://localhost:3000/api');
    expect(client).toBeDefined();
  });

  it('should make GET request for query', async () => {
    const mockFetch = createMockFetch({
      'users.list': [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ],
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    const users = await client.users.list.get();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should make POST request for mutation', async () => {
    const mockFetch = createMockFetch({
      'users.create': { id: '3', name: 'Charlie', email: 'charlie@example.com' },
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    const user = await client.users.create.post({
      name: 'Charlie',
      email: 'charlie@example.com',
    });

    expect(user.id).toBe('3');
    expect(user.name).toBe('Charlie');
  });

  it('should handle nested routes', async () => {
    const mockFetch = createMockFetch({
      'posts.nested.deep.endpoint': { result: 'Deep: test' },
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    const result = await client.posts.nested.deep.endpoint.get({ value: 'test' });
    expect(result.result).toBe('Deep: test');
  });

  it('should handle different HTTP methods', async () => {
    const mockFetch = createMockFetch({
      'users.update': { id: '1', name: 'Updated', email: 'updated@example.com' },
      'users.delete': { success: true, id: '1' },
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    // PUT request
    const updated = await client.users.update.put({ id: '1', name: 'Updated' });
    expect(updated.name).toBe('Updated');

    // DELETE request
    const deleted = await client.users.delete.delete({ id: '1' });
    expect(deleted.success).toBe(true);
  });
});

// ============================================================================
// Request Options Tests
// ============================================================================

describe('Treaty Client - Request Options', () => {
  it('should pass custom headers', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        result: { data: [] },
      }),
    })) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    await client.users.list.get({
      headers: { 'Authorization': 'Bearer token' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer token',
        }),
      })
    );
  });

  it('should support AbortController', async () => {
    const controller = new AbortController();

    const mockFetch = vi.fn(async (url, options) => {
      if (options?.signal?.aborted) {
        throw new Error('Request aborted');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ result: { data: [] } }),
      };
    }) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    const promise = client.users.list.get({
      signal: controller.signal,
    });

    controller.abort();

    await expect(promise).rejects.toThrow();
  });

  it('should handle timeout', async () => {
    const mockFetch = vi.fn(async () => {
      // Simulate slow response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        ok: true,
        status: 200,
        json: async () => ({ result: { data: [] } }),
      };
    }) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    await expect(
      client.users.list.get({
        timeout: 100, // 100ms timeout
      })
    ).rejects.toThrow();
  });
});

// ============================================================================
// Retry Logic Tests
// ============================================================================

describe('Treaty Client - Retry Logic', () => {
  it('should retry on failure', async () => {
    let attempts = 0;

    const mockFetch = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        return {
          ok: false,
          status: 500,
          json: async () => ({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Server error',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          result: { data: [] },
        }),
      };
    }) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    const result = await client.users.list.get({
      retry: {
        count: 3,
        delay: 10,
      },
    });

    expect(attempts).toBe(3);
    expect(result).toBeDefined();
  });

  it('should not retry on non-retryable status codes', async () => {
    let attempts = 0;

    const mockFetch = vi.fn(async () => {
      attempts++;
      return {
        ok: false,
        status: 400, // Bad request - shouldn't retry
        json: async () => ({
          error: {
            code: 'BAD_REQUEST',
            message: 'Bad request',
          },
        }),
      };
    }) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    await expect(
      client.users.list.get({
        retry: {
          count: 3,
          statusCodes: [500, 502, 503],
        },
      })
    ).rejects.toThrow();

    expect(attempts).toBe(1);
  });
});

// ============================================================================
// Interceptor Tests
// ============================================================================

describe('Treaty Client - Interceptors', () => {
  it('should apply request interceptor', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ result: { data: [] } }),
    })) as unknown as typeof fetch;

    const onRequest = vi.fn(async (config) => {
      config.headers['X-Custom'] = 'value';
      return config;
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
      onRequest,
    });

    await client.users.list.get();

    expect(onRequest).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom': 'value',
        }),
      })
    );
  });

  it('should apply response interceptor', async () => {
    const mockFetch = createMockFetch({
      'users.list': [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
    });

    const onResponse = vi.fn(async (response) => {
      // Transform response
      return response.map((user: any) => ({
        ...user,
        name: user.name.toUpperCase(),
      }));
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
      onResponse,
    });

    const users = await client.users.list.get();

    expect(onResponse).toHaveBeenCalled();
    expect(users[0].name).toBe('ALICE');
  });

  it('should apply error interceptor', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server error',
        },
      }),
    })) as unknown as typeof fetch;

    const onError = vi.fn(async (error) => {
      // Log error
      console.error('Error:', error.message);
    });

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
      onError,
    });

    await expect(client.users.list.get()).rejects.toThrow();

    expect(onError).toHaveBeenCalled();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Treaty Client - Error Handling', () => {
  it('should throw TreatyError on HTTP error', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      }),
    })) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    try {
      await client.users.byId.get({ id: '999' });
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(TreatyError);
      expect((error as TreatyError).code).toBe('NOT_FOUND');
      expect((error as TreatyError).status).toBe(404);
    }
  });

  it('should throw TreatyError on network error', async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error('Network error');
    }) as unknown as typeof fetch;

    const client = treaty<TestAPI>('http://localhost:3000/api', {
      fetch: mockFetch,
    });

    try {
      await client.users.list.get();
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(TreatyError);
      expect((error as TreatyError).code).toBe('NETWORK_ERROR');
    }
  });
});

// ============================================================================
// createTreatyClient Tests
// ============================================================================

describe('createTreatyClient', () => {
  it('should create client with utilities', async () => {
    const mockFetch = createMockFetch({
      'users.list': [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
      'posts.list': [{ id: '1', title: 'Post 1', content: 'Content 1' }],
    });

    const { client, utils } = createTreatyClient<TestAPI>({
      baseUrl: 'http://localhost:3000/api',
      fetch: mockFetch,
    });

    expect(client).toBeDefined();
    expect(utils).toBeDefined();
    expect(utils.batch).toBeDefined();
    expect(utils.request).toBeDefined();
  });

  it('should support batch requests', async () => {
    const mockFetch = createMockFetch({
      'users.list': [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
      'posts.list': [{ id: '1', title: 'Post 1', content: 'Content 1' }],
    });

    const { client, utils } = createTreatyClient<TestAPI>({
      baseUrl: 'http://localhost:3000/api',
      fetch: mockFetch,
    });

    const [users, posts] = await utils.batch([
      () => client.users.list.get(),
      () => client.posts.list.get(),
    ] as const);

    expect(users).toHaveLength(1);
    expect(posts).toHaveLength(1);
  });

  it('should support custom requests', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        result: { data: { custom: true } },
      }),
    })) as unknown as typeof fetch;

    const { utils } = createTreatyClient<TestAPI>({
      baseUrl: 'http://localhost:3000/api',
      fetch: mockFetch,
    });

    const result = await utils.request<{ custom: boolean }>('custom/endpoint', {
      method: 'POST',
      body: { test: true },
    });

    expect(result.custom).toBe(true);
  });
});

// ============================================================================
// Type Safety Tests (Compile-time)
// ============================================================================

describe('Treaty Client - Type Safety', () => {
  it('should have correct types', () => {
    const client = treaty<TestAPI>('http://localhost:3000/api');

    // These should compile without errors
    type UsersList = Awaited<ReturnType<typeof client.users.list.get>>;
    type User = Awaited<ReturnType<typeof client.users.byId.get>>;

    // Type assertions to verify
    const _testUsersList: UsersList = [] as any;
    const _testUser: User = {} as any;

    expect(true).toBe(true);
  });
});
