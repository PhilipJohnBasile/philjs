/**
 * PhilJS Serverless Router
 *
 * Simple and efficient router for serverless functions.
 */

import type {
  Handler,
  Middleware,
  ServerlessContext,
  RouterConfig,
  RouteDefinition,
  MatchedRoute,
} from '../types.js';
import { createContext, createPlatformContext } from '../handler/context.js';
import { compose } from '../handler/middleware.js';

/**
 * Default 404 handler
 */
const defaultNotFound: Handler = () => {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Default error handler
 */
const defaultOnError = (error: Error): Response => {
  console.error('[Router Error]', error);
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Route parameter regex pattern
 */
const PARAM_PATTERN = /:([^/]+)/g;

/**
 * Convert route path to regex pattern
 */
function pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];

  // Escape special regex characters except : and *
  let pattern = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  // Replace :param with capture groups
  pattern = pattern.replace(PARAM_PATTERN, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });

  // Replace * with catch-all pattern
  if (pattern.endsWith('*')) {
    pattern = pattern.slice(0, -1) + '(.*)';
    paramNames.push('*');
  }

  // Ensure exact match (with optional trailing slash)
  pattern = `^${pattern}/?$`;

  return { regex: new RegExp(pattern), paramNames };
}

/**
 * Match a path against a route pattern
 */
function matchPath(
  path: string,
  routePath: string
): { matched: boolean; params: Record<string, string> } {
  const { regex, paramNames } = pathToRegex(routePath);
  const match = path.match(regex);

  if (!match) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1] ?? '';
  });

  return { matched: true, params };
}

/**
 * Router instance
 */
export interface Router<State = Record<string, unknown>> {
  /** Add a route */
  add(
    method: string | string[],
    path: string,
    handler: Handler<State>,
    middleware?: Middleware<State>[]
  ): Router<State>;

  /** GET route */
  get(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** POST route */
  post(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** PUT route */
  put(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** PATCH route */
  patch(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** DELETE route */
  delete(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** HEAD route */
  head(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** OPTIONS route */
  options(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** ALL methods route */
  all(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State>;

  /** Mount a sub-router */
  mount(basePath: string, router: Router<State>): Router<State>;

  /** Apply middleware to all routes */
  use(...middleware: Middleware<State>[]): Router<State>;

  /** Handle a request */
  handle(request: Request, ...args: unknown[]): Promise<Response>;

  /** Get the handler function for use with serverless platforms */
  fetch: (request: Request, ...args: unknown[]) => Promise<Response>;

  /** Get all registered routes */
  routes(): RouteDefinition<State>[];

  /** Match a request to a route */
  match(method: string, path: string): MatchedRoute<State> | null;
}

/**
 * Create a serverless router
 *
 * @example
 * ```typescript
 * import { createRouter, json } from '@philjs/serverless';
 *
 * const router = createRouter()
 *   .get('/users', async (ctx) => json(await getUsers()))
 *   .get('/users/:id', async (ctx) => json(await getUser(ctx.params.id)))
 *   .post('/users', async (ctx) => {
 *     const body = await ctx.request.json();
 *     const user = await createUser(body);
 *     return json(user, 201);
 *   });
 *
 * export default router.fetch;
 * ```
 */
export function createRouter<State = Record<string, unknown>>(
  config: RouterConfig<State> = {}
): Router<State> {
  const {
    basePath = '',
    middleware: globalMiddleware = [],
    notFound = defaultNotFound as Handler<State>,
    onError = defaultOnError,
  } = config;

  const routes: RouteDefinition<State>[] = [];
  let cachedGlobalMiddleware: Middleware<State> | null = null;

  const router: Router<State> = {
    add(
      method: string | string[],
      path: string,
      handler: Handler<State>,
      middleware: Middleware<State>[] = []
    ): Router<State> {
      const fullPath = normalizePath(basePath + path);
      routes.push({
        method: Array.isArray(method) ? method.map((m) => m.toUpperCase()) : method.toUpperCase(),
        path: fullPath,
        handler,
        middleware,
      });
      return router;
    },

    get(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('GET', path, handler, middleware);
    },

    post(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('POST', path, handler, middleware);
    },

    put(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('PUT', path, handler, middleware);
    },

    patch(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('PATCH', path, handler, middleware);
    },

    delete(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('DELETE', path, handler, middleware);
    },

    head(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('HEAD', path, handler, middleware);
    },

    options(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add('OPTIONS', path, handler, middleware);
    },

    all(path: string, handler: Handler<State>, middleware?: Middleware<State>[]): Router<State> {
      return router.add(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], path, handler, middleware);
    },

    mount(mountPath: string, subRouter: Router<State>): Router<State> {
      const subRoutes = subRouter.routes();
      for (const route of subRoutes) {
        const fullPath = normalizePath(mountPath + route.path);
        routes.push({
          ...route,
          path: fullPath,
        });
      }
      return router;
    },

    use(...middleware: Middleware<State>[]): Router<State> {
      globalMiddleware.push(...middleware);
      cachedGlobalMiddleware = null; // Invalidate cache
      return router;
    },

    match(method: string, path: string): MatchedRoute<State> | null {
      const normalizedPath = normalizePath(path);
      const upperMethod = method.toUpperCase();

      for (const route of routes) {
        // Check method
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        if (!methods.includes(upperMethod)) {
          continue;
        }

        // Check path
        const { matched, params } = matchPath(normalizedPath, route.path);
        if (matched) {
          return { route, params };
        }
      }

      return null;
    },

    routes(): RouteDefinition<State>[] {
      return [...routes];
    },

    async handle(request: Request, ...args: unknown[]): Promise<Response> {
      const url = new URL(request.url);
      const path = normalizePath(url.pathname);
      const method = request.method.toUpperCase();

      // Match route
      const matchResult = router.match(method, path);

      // Create context
      const platformContext = createPlatformContext();
      const ctx = createContext<State>(request, {
        platformContext,
        params: matchResult?.params ?? {},
      });

      try {
        // Build middleware chain
        const middlewares: Middleware<State>[] = [...globalMiddleware];

        if (matchResult) {
          if (matchResult.route.middleware) {
            middlewares.push(...matchResult.route.middleware);
          }

          // Final handler as middleware
          const handler = matchResult.route.handler;
          const finalMiddleware: Middleware<State> = async (ctx) => handler(ctx);
          middlewares.push(finalMiddleware);
        } else {
          // 404 handler
          const finalMiddleware: Middleware<State> = async (ctx) => notFound(ctx);
          middlewares.push(finalMiddleware);
        }

        // Compose and execute
        if (middlewares.length === 1) {
          return await middlewares[0]!(ctx, async () => new Response(null, { status: 500 }));
        }

        const composed = compose(...middlewares);
        return await composed(ctx, async () => new Response(null, { status: 500 }));
      } catch (error) {
        return onError(error as Error, ctx);
      }
    },

    fetch: (request: Request, ...args: unknown[]) => router.handle(request, ...args),
  };

  return router;
}

/**
 * Normalize a path
 */
function normalizePath(path: string): string {
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Remove trailing slash (except for root)
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Remove double slashes
  path = path.replace(/\/+/g, '/');

  return path;
}

/**
 * Group routes with shared configuration
 *
 * @example
 * ```typescript
 * const apiRoutes = group({ prefix: '/api', middleware: [auth()] })
 *   .get('/users', getUsers)
 *   .post('/users', createUser);
 *
 * router.mount('', apiRoutes);
 * ```
 */
export function group<State = Record<string, unknown>>(
  config: { prefix?: string; middleware?: Middleware<State>[] } = {}
): Router<State> {
  const routerConfig: RouterConfig<State> = {};
  if (config.prefix !== undefined) {
    routerConfig.basePath = config.prefix;
  }
  if (config.middleware !== undefined) {
    routerConfig.middleware = config.middleware;
  }
  return createRouter<State>(routerConfig);
}

/**
 * Create a REST resource router
 *
 * @example
 * ```typescript
 * const usersResource = resource('/users', {
 *   index: async (ctx) => json(await getUsers()),
 *   show: async (ctx) => json(await getUser(ctx.params.id)),
 *   create: async (ctx) => json(await createUser(await ctx.request.json()), 201),
 *   update: async (ctx) => json(await updateUser(ctx.params.id, await ctx.request.json())),
 *   destroy: async (ctx) => new Response(null, { status: 204 }),
 * });
 *
 * router.mount('', usersResource);
 * ```
 */
export function resource<State = Record<string, unknown>>(
  path: string,
  handlers: {
    index?: Handler<State>;
    show?: Handler<State>;
    create?: Handler<State>;
    update?: Handler<State>;
    destroy?: Handler<State>;
  },
  config: { middleware?: Middleware<State>[] } = {}
): Router<State> {
  const routerConfig: RouterConfig<State> = {};
  if (config.middleware !== undefined) {
    routerConfig.middleware = config.middleware;
  }
  const router = createRouter<State>(routerConfig);

  if (handlers.index) {
    router.get(path, handlers.index);
  }

  if (handlers.create) {
    router.post(path, handlers.create);
  }

  if (handlers.show) {
    router.get(`${path}/:id`, handlers.show);
  }

  if (handlers.update) {
    router.put(`${path}/:id`, handlers.update);
    router.patch(`${path}/:id`, handlers.update);
  }

  if (handlers.destroy) {
    router.delete(`${path}/:id`, handlers.destroy);
  }

  return router;
}
