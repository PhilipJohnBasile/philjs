import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Loader exports
  executeLoader,
  executeLoadersParallel,
  executeNestedLoaders,
  useLoaderData,
  useRouteLoaderData,
  useMatchesData,
  setCurrentRouteData,
  clearLoaderData,
  json,
  redirect,
  isRedirectResponse,
  createLoaderRequest,
  type LoaderFunctionContext,
} from './loader.js';
import {
  // Defer exports
  defer,
  isDeferred,
  resolveDeferred,
  Await,
  deferData,
  awaitAllDeferred,
  streamDeferred,
} from './defer.js';
import {
  // Action exports
  executeAction,
  useActionData,
  useNavigation,
  Form,
  formDataToObject,
  objectToFormData,
  type ActionFunctionContext,
} from './action.js';
import {
  // Nested route exports
  matchNestedRoutes,
  loadNestedRouteData,
  renderNestedRoutes,
  Outlet,
  createRoute,
  createLayoutRoute,
  createIndexRoute,
  generatePath,
  parseParams,
  type NestedRouteDefinition,
} from './nested.js';
import {
  // Error boundary exports
  isRouteErrorResponse,
  createErrorResponse,
  throwNotFound,
  throwUnauthorized,
  useRouteError,
  setRouteError,
  clearAllRouteErrors,
  RouteErrorBoundary,
  DefaultErrorBoundary,
  withErrorRecovery,
} from './error-boundary.js';

// ============================================================================
// Loader Tests
// ============================================================================

describe('Loader System', () => {
  beforeEach(() => {
    clearLoaderData();
  });

  describe('executeLoader', () => {
    it('should execute a loader and return data', async () => {
      const loader = async ({ params }: LoaderFunctionContext) => {
        return { user: { id: params.id, name: 'Test User' } };
      };

      const context: LoaderFunctionContext = {
        params: { id: '123' },
        request: new Request('http://localhost/users/123'),
        url: new URL('http://localhost/users/123'),
      };

      const result = await executeLoader(loader, context);

      expect(result.loading).toBe(false);
      expect(result.data).toEqual({ user: { id: '123', name: 'Test User' } });
      expect(result.error).toBeUndefined();
    });

    it('should handle loader errors', async () => {
      const loader = async () => {
        throw new Error('Loader failed');
      };

      const context: LoaderFunctionContext = {
        params: {},
        request: new Request('http://localhost/'),
        url: new URL('http://localhost/'),
      };

      const result = await executeLoader(loader, context);

      expect(result.loading).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Loader failed');
    });

    it('should cache loader results when cacheDuration is provided', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return { count: callCount };
      };

      const context: LoaderFunctionContext = {
        params: {},
        request: new Request('http://localhost/cached'),
        url: new URL('http://localhost/cached'),
      };

      // First call
      const result1 = await executeLoader(loader, context, { cacheDuration: 60000 });
      expect(result1.data).toEqual({ count: 1 });

      // Second call should use cache
      const result2 = await executeLoader(loader, context, { cacheDuration: 60000 });
      expect(result2.data).toEqual({ count: 1 });
      expect(callCount).toBe(1);

      // Force revalidate
      const result3 = await executeLoader(loader, context, { cacheDuration: 60000, revalidate: true });
      expect(result3.data).toEqual({ count: 2 });
      expect(callCount).toBe(2);
    });
  });

  describe('executeLoadersParallel', () => {
    it('should execute multiple loaders in parallel', async () => {
      const executionOrder: string[] = [];

      const loaders = {
        user: async () => {
          executionOrder.push('user-start');
          await new Promise(r => setTimeout(r, 10));
          executionOrder.push('user-end');
          return { name: 'User' };
        },
        posts: async () => {
          executionOrder.push('posts-start');
          await new Promise(r => setTimeout(r, 5));
          executionOrder.push('posts-end');
          return { count: 5 };
        },
      };

      const context: LoaderFunctionContext = {
        params: {},
        request: new Request('http://localhost/'),
        url: new URL('http://localhost/'),
      };

      const results = await executeLoadersParallel(loaders, context);

      expect(results.user.data).toEqual({ name: 'User' });
      expect(results.posts.data).toEqual({ count: 5 });

      // Both should start before either ends (parallel execution)
      expect(executionOrder.indexOf('user-start')).toBeLessThan(executionOrder.indexOf('user-end'));
      expect(executionOrder.indexOf('posts-start')).toBeLessThan(executionOrder.indexOf('posts-end'));
    });
  });

  describe('executeNestedLoaders', () => {
    it('should execute all nested route loaders in parallel', async () => {
      const routes = [
        {
          routeId: 'root',
          loader: async () => ({ layout: true }),
          params: {},
        },
        {
          routeId: 'users',
          loader: async () => ({ users: ['user1', 'user2'] }),
          params: {},
        },
        {
          routeId: 'users/:id',
          loader: async ({ params }: any) => ({ user: { id: params.id } }),
          params: { id: '123' },
        },
      ];

      const request = new Request('http://localhost/users/123');
      const results = await executeNestedLoaders(routes, request);

      expect(results).toHaveLength(3);
      expect(results[0].data).toEqual({ layout: true });
      expect(results[1].data).toEqual({ users: ['user1', 'user2'] });
      expect(results[2].data).toEqual({ user: { id: '123' } });
    });
  });

  describe('json utility', () => {
    it('should create a JSON response', () => {
      const response = json({ message: 'Hello' });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('redirect utility', () => {
    it('should create a redirect response', () => {
      const response = redirect('/new-location');

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/new-location');
    });

    it('should support custom status codes', () => {
      const response = redirect('/permanent', 301);

      expect(response.status).toBe(301);
    });

    it('should be detectable with isRedirectResponse', () => {
      const response = redirect('/somewhere');
      expect(isRedirectResponse(response)).toBe(true);

      const normalResponse = new Response('OK');
      expect(isRedirectResponse(normalResponse)).toBe(false);
    });
  });
});

// ============================================================================
// Defer Tests
// ============================================================================

describe('Defer System', () => {
  describe('defer', () => {
    it('should create a deferred value from a promise', async () => {
      const deferred = defer(Promise.resolve({ data: 'test' }));

      expect(isDeferred(deferred)).toBe(true);
      expect(deferred.status).toBe('pending');

      // Wait for resolution
      await deferred.promise;

      expect(deferred.status).toBe('resolved');
      expect(deferred.value).toEqual({ data: 'test' });
    });

    it('should handle rejected promises', async () => {
      const deferred = defer(Promise.reject(new Error('Failed')));

      expect(deferred.status).toBe('pending');

      try {
        await deferred.promise;
      } catch {
        // Expected
      }

      expect(deferred.status).toBe('rejected');
      expect(deferred.error?.message).toBe('Failed');
    });

    it('should notify subscribers on status change', async () => {
      const statusChanges: string[] = [];
      const deferred = defer(Promise.resolve('done'));

      deferred.subscribe((status) => {
        statusChanges.push(status);
      });

      await deferred.promise;

      expect(statusChanges).toContain('resolved');
    });
  });

  describe('resolveDeferred', () => {
    it('should resolve deferred values', async () => {
      const deferred = defer(Promise.resolve('value'));
      await deferred.promise;

      const result = await resolveDeferred(deferred);
      expect(result).toBe('value');
    });

    it('should pass through regular promises', async () => {
      const promise = Promise.resolve('regular');
      const result = await resolveDeferred(promise);
      expect(result).toBe('regular');
    });

    it('should pass through regular values', async () => {
      const result = await resolveDeferred('static');
      expect(result).toBe('static');
    });
  });

  describe('deferData', () => {
    it('should wrap promises in deferred values', () => {
      const data = deferData({
        immediate: 'value',
        lazy: Promise.resolve('lazy-value'),
      });

      expect(data.immediate).toBe('value');
      expect(isDeferred(data.lazy)).toBe(true);
    });
  });

  describe('awaitAllDeferred', () => {
    it('should wait for all deferred values', async () => {
      const data = deferData({
        a: Promise.resolve('a-value'),
        b: Promise.resolve('b-value'),
        c: 'immediate',
      });

      const resolved = await awaitAllDeferred(data);

      expect(resolved.a).toBe('a-value');
      expect(resolved.b).toBe('b-value');
      expect(resolved.c).toBe('immediate');
    });
  });

  describe('streamDeferred', () => {
    it('should stream resolved values', async () => {
      const resolved: string[] = [];
      const data = deferData({
        fast: Promise.resolve('fast'),
        slow: new Promise(r => setTimeout(() => r('slow'), 10)),
      });

      const unsubscribe = streamDeferred(data, {
        onResolve: (key) => resolved.push(key),
        onComplete: () => {},
      });

      await new Promise(r => setTimeout(r, 20));

      expect(resolved).toContain('fast');
      expect(resolved).toContain('slow');

      unsubscribe();
    });
  });
});

// ============================================================================
// Action Tests
// ============================================================================

describe('Action System', () => {
  describe('executeAction', () => {
    it('should execute an action and return data', async () => {
      const action = async ({ request }: ActionFunctionContext) => {
        const formData = await request.formData();
        return { success: true, name: formData.get('name') };
      };

      const formData = new FormData();
      formData.append('name', 'Test');

      const context: ActionFunctionContext = {
        params: {},
        request: new Request('http://localhost/action', {
          method: 'POST',
          body: formData,
        }),
        url: new URL('http://localhost/action'),
      };

      const result = await executeAction(action, context);

      expect(result.status).toBe('success');
      expect(result.data).toEqual({ success: true, name: 'Test' });
    });

    it('should handle action errors', async () => {
      const action = async () => {
        throw new Error('Action failed');
      };

      const context: ActionFunctionContext = {
        params: {},
        request: new Request('http://localhost/action', { method: 'POST' }),
        url: new URL('http://localhost/action'),
      };

      const result = await executeAction(action, context);

      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Action failed');
    });

    it('should handle redirect responses', async () => {
      const action = async () => {
        return redirect('/success');
      };

      const context: ActionFunctionContext = {
        params: {},
        request: new Request('http://localhost/action', { method: 'POST' }),
        url: new URL('http://localhost/action'),
      };

      const result = await executeAction(action, context);

      expect(result.status).toBe('success');
      expect((result.data as any)?._redirect).toBe('/success');
    });
  });

  describe('formDataToObject', () => {
    it('should convert FormData to object', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('email', 'john@example.com');

      const obj = formDataToObject(formData);

      expect(obj).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should handle multiple values', () => {
      const formData = new FormData();
      formData.append('tags', 'a');
      formData.append('tags', 'b');
      formData.append('tags', 'c');

      const obj = formDataToObject(formData);

      expect(obj.tags).toEqual(['a', 'b', 'c']);
    });
  });

  describe('objectToFormData', () => {
    it('should convert object to FormData', () => {
      const obj = {
        name: 'John',
        age: 30,
      };

      const formData = objectToFormData(obj);

      expect(formData.get('name')).toBe('John');
      expect(formData.get('age')).toBe('30');
    });

    it('should handle arrays', () => {
      const obj = {
        tags: ['a', 'b', 'c'],
      };

      const formData = objectToFormData(obj);

      expect(formData.getAll('tags')).toEqual(['a', 'b', 'c']);
    });
  });
});

// ============================================================================
// Nested Routes Tests
// ============================================================================

describe('Nested Routes', () => {
  describe('matchNestedRoutes', () => {
    const routes: NestedRouteDefinition[] = [
      {
        path: '/',
        id: 'root',
        component: () => null,
        children: [
          {
            path: '/users',
            id: 'users',
            component: () => null,
            children: [
              {
                path: '/users/:id',
                id: 'user-detail',
                component: () => null,
              },
            ],
          },
          {
            path: '/posts',
            id: 'posts',
            component: () => null,
          },
        ],
      },
    ];

    it('should match root route', () => {
      const match = matchNestedRoutes('/', routes);

      expect(match).not.toBeNull();
      expect(match?.matches).toHaveLength(1);
      expect(match?.leaf.id).toBe('root');
    });

    it('should match nested routes', () => {
      const match = matchNestedRoutes('/users', routes);

      expect(match).not.toBeNull();
      expect(match?.matches.map(m => m.id)).toEqual(['root', 'users']);
    });

    it('should match deeply nested routes with params', () => {
      const match = matchNestedRoutes('/users/123', routes);

      expect(match).not.toBeNull();
      expect(match?.matches.map(m => m.id)).toEqual(['root', 'users', 'user-detail']);
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should return null for non-matching routes', () => {
      const match = matchNestedRoutes('/unknown', routes);
      expect(match).toBeNull();
    });
  });

  describe('generatePath', () => {
    it('should generate path from pattern and params', () => {
      expect(generatePath('/users/:id', { id: '123' })).toBe('/users/123');
      expect(generatePath('/posts/:category/:slug', {
        category: 'tech',
        slug: 'hello-world',
      })).toBe('/posts/tech/hello-world');
    });

    it('should handle catch-all segments', () => {
      expect(generatePath('/docs/*', { '*': 'guide/intro' })).toBe('/docs/guide/intro');
    });

    it('should encode special characters', () => {
      expect(generatePath('/search/:query', { query: 'hello world' })).toBe('/search/hello%20world');
    });
  });

  describe('parseParams', () => {
    it('should parse params from pathname', () => {
      expect(parseParams('/users/123', '/users/:id')).toEqual({ id: '123' });
      expect(parseParams('/posts/tech/hello', '/posts/:category/:slug')).toEqual({
        category: 'tech',
        slug: 'hello',
      });
    });

    it('should return null for non-matching paths', () => {
      expect(parseParams('/users', '/posts/:id')).toBeNull();
    });
  });

  describe('createRoute helpers', () => {
    it('should create a route definition', () => {
      const route = createRoute({
        path: '/test',
        component: () => null,
      });

      expect(route.path).toBe('/test');
      expect(route.id).toBe('/test');
    });

    it('should create a layout route', () => {
      const route = createLayoutRoute('/dashboard', [
        createRoute({ path: '/dashboard/overview', component: () => null }),
      ]);

      expect(route.path).toBe('/dashboard');
      expect(route.children).toHaveLength(1);
    });

    it('should create an index route', () => {
      const route = createIndexRoute({
        component: () => null,
      });

      expect(route.path).toBe('');
      expect(route.index).toBe(true);
    });
  });
});

// ============================================================================
// Error Boundary Tests
// ============================================================================

describe('Error Boundaries', () => {
  beforeEach(() => {
    clearAllRouteErrors();
  });

  describe('isRouteErrorResponse', () => {
    it('should identify RouteErrorResponse objects', () => {
      const errorResponse = {
        status: 404,
        statusText: 'Not Found',
        data: 'Page not found',
        internal: false,
      };

      expect(isRouteErrorResponse(errorResponse)).toBe(true);
      expect(isRouteErrorResponse(new Error('test'))).toBe(false);
      expect(isRouteErrorResponse(null)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);

      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      expect(response.data).toBe('Something went wrong');
      expect(response.internal).toBe(true);
    });

    it('should support custom status codes', () => {
      const response = createErrorResponse(new Error('Bad request'), 400);

      expect(response.status).toBe(400);
      expect(response.statusText).toBe('Bad Request');
    });
  });

  describe('throwNotFound', () => {
    it('should throw a 404 error', () => {
      expect(() => throwNotFound()).toThrow();

      try {
        throwNotFound('User not found');
      } catch (error) {
        expect(isRouteErrorResponse(error)).toBe(true);
        if (isRouteErrorResponse(error)) {
          expect(error.status).toBe(404);
          expect(error.data).toBe('User not found');
        }
      }
    });
  });

  describe('throwUnauthorized', () => {
    it('should throw a 401 error', () => {
      try {
        throwUnauthorized();
      } catch (error) {
        expect(isRouteErrorResponse(error)).toBe(true);
        if (isRouteErrorResponse(error)) {
          expect(error.status).toBe(401);
        }
      }
    });
  });

  describe('withErrorRecovery', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await withErrorRecovery(fn, {
        maxRetries: 3,
        retryDelay: 10,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Permanent failure');
      };

      await expect(
        withErrorRecovery(fn, { maxRetries: 2, retryDelay: 10 })
      ).rejects.toThrow('Permanent failure');
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  it('should support full Remix-style loader pattern', async () => {
    // Define a loader
    const userLoader = async ({ params }: LoaderFunctionContext) => {
      if (!params.id) {
        throwNotFound('User ID required');
      }

      return {
        user: { id: params.id, name: 'John Doe' },
        posts: defer(Promise.resolve([{ id: 1, title: 'Post 1' }])),
      };
    };

    const context: LoaderFunctionContext = {
      params: { id: '123' },
      request: new Request('http://localhost/users/123'),
      url: new URL('http://localhost/users/123'),
    };

    const result = await executeLoader(userLoader, context);

    expect(result.data.user).toEqual({ id: '123', name: 'John Doe' });
    expect(isDeferred(result.data.posts)).toBe(true);

    // Wait for deferred data
    const posts = await result.data.posts.promise;
    expect(posts).toEqual([{ id: 1, title: 'Post 1' }]);
  });

  it('should handle parallel nested loaders', async () => {
    const startTimes: Record<string, number> = {};
    const endTimes: Record<string, number> = {};

    const routes = [
      {
        routeId: 'layout',
        loader: async () => {
          startTimes.layout = Date.now();
          await new Promise(r => setTimeout(r, 20));
          endTimes.layout = Date.now();
          return { layout: true };
        },
        params: {},
      },
      {
        routeId: 'users',
        loader: async () => {
          startTimes.users = Date.now();
          await new Promise(r => setTimeout(r, 20));
          endTimes.users = Date.now();
          return { users: [] };
        },
        params: {},
      },
    ];

    const request = new Request('http://localhost/users');
    await executeNestedLoaders(routes, request);

    // Both loaders should start at nearly the same time (parallel)
    const startDiff = Math.abs(startTimes.layout - startTimes.users);
    expect(startDiff).toBeLessThan(10); // Within 10ms of each other
  });
});
