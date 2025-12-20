/**
 * API definition for philjs-rpc.
 * Creates type-safe API routers with nested namespaces.
 */

import type {
  Router,
  RouterNode,
  APIDefinition,
  ProcedureDefinition,
  ProcedureContext,
  ProcedureType,
  Middleware,
} from './types.js';
import { isProcedure } from './procedure.js';

// ============================================================================
// API Creation
// ============================================================================

/**
 * Create an API definition from a router.
 *
 * @example
 * ```ts
 * import { createAPI, procedure } from 'philjs-rpc';
 * import { z } from 'zod';
 *
 * export const api = createAPI({
 *   users: {
 *     list: procedure.query(async () => {
 *       return db.users.findMany();
 *     }),
 *     byId: procedure
 *       .input(z.object({ id: z.string() }))
 *       .query(async ({ input }) => {
 *         return db.users.findUnique({ where: { id: input.id } });
 *       }),
 *     create: procedure
 *       .input(z.object({ name: z.string(), email: z.string().email() }))
 *       .mutation(async ({ input }) => {
 *         return db.users.create({ data: input });
 *       }),
 *   },
 *   posts: {
 *     list: procedure.query(async () => {
 *       return db.posts.findMany();
 *     }),
 *     // Nested namespaces
 *     comments: {
 *       list: procedure
 *         .input(z.object({ postId: z.string() }))
 *         .query(async ({ input }) => {
 *           return db.comments.findMany({ where: { postId: input.postId } });
 *         }),
 *     },
 *   },
 * });
 *
 * export type AppAPI = typeof api;
 * ```
 */
export function createAPI<TRouter extends Router>(
  router: TRouter
): APIDefinition<TRouter> {
  // Validate the router structure
  validateRouter(router);

  return {
    _router: router,
    _def: {
      router,
      middlewares: [],
    },
  };
}

/**
 * Create an API with global middleware.
 *
 * @example
 * ```ts
 * const api = createAPIWithMiddleware(
 *   [authMiddleware, loggerMiddleware],
 *   {
 *     users: {
 *       list: procedure.query(async () => db.users.findMany()),
 *     },
 *   }
 * );
 * ```
 */
export function createAPIWithMiddleware<TRouter extends Router>(
  middlewares: Middleware[],
  router: TRouter
): APIDefinition<TRouter> {
  validateRouter(router);

  return {
    _router: router,
    _def: {
      router,
      middlewares,
    },
  };
}

// ============================================================================
// Router Utilities
// ============================================================================

/**
 * Validate that a router has a valid structure.
 */
function validateRouter(router: Router, path: string = ''): void {
  for (const [key, value] of Object.entries(router)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (value === null || value === undefined) {
      throw new Error(`Invalid router at "${currentPath}": value is null or undefined`);
    }

    if (isProcedure(value)) {
      // Valid procedure
      continue;
    }

    if (typeof value === 'object') {
      // Nested router
      validateRouter(value as Router, currentPath);
      continue;
    }

    throw new Error(
      `Invalid router at "${currentPath}": expected procedure or nested router, got ${typeof value}`
    );
  }
}

/**
 * Get all procedure paths from a router.
 *
 * @example
 * ```ts
 * const paths = getRouterPaths(api._def.router);
 * // ['users.list', 'users.byId', 'users.create', 'posts.list', 'posts.comments.list']
 * ```
 */
export function getRouterPaths(router: Router, prefix: string = ''): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(router)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (isProcedure(value)) {
      paths.push(currentPath);
    } else if (typeof value === 'object' && value !== null) {
      paths.push(...getRouterPaths(value as Router, currentPath));
    }
  }

  return paths;
}

/**
 * Get a procedure at a specific path in the router.
 *
 * @example
 * ```ts
 * const procedure = getProcedureAtPath(api._def.router, 'users.byId');
 * ```
 */
export function getProcedureAtPath(
  router: Router,
  path: string
): ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext> | null {
  const parts = path.split('.');
  let current: RouterNode | Router = router;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }

    if (isProcedure(current)) {
      // We hit a procedure before exhausting the path
      return null;
    }

    current = (current as Router)[part];
  }

  if (isProcedure(current)) {
    return current;
  }

  return null;
}

/**
 * Merge multiple routers into one.
 *
 * @example
 * ```ts
 * const usersRouter = { list: ..., byId: ... };
 * const postsRouter = { list: ..., create: ... };
 *
 * const api = createAPI(mergeRouters({
 *   users: usersRouter,
 *   posts: postsRouter,
 * }));
 * ```
 */
export function mergeRouters<T extends Record<string, Router>>(
  routers: T
): { [K in keyof T]: T[K] } {
  return routers;
}

/**
 * Create a sub-router that can be merged into a larger API.
 *
 * @example
 * ```ts
 * // users.ts
 * export const usersRouter = createRouter({
 *   list: procedure.query(async () => db.users.findMany()),
 *   byId: procedure
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ input }) => db.users.findUnique({ where: { id: input.id } })),
 * });
 *
 * // api.ts
 * import { usersRouter } from './users';
 * import { postsRouter } from './posts';
 *
 * export const api = createAPI({
 *   users: usersRouter,
 *   posts: postsRouter,
 * });
 * ```
 */
export function createRouter<TRouter extends Router>(router: TRouter): TRouter {
  validateRouter(router);
  return router;
}

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Infer the router type from an API definition.
 */
export type InferRouter<TApi extends APIDefinition> = TApi['_router'];

/**
 * Infer all procedure paths from a router type.
 * Simplified to avoid "Type instantiation is excessively deep" errors.
 */
export type InferPaths<TRouter extends Router> = string;

/**
 * Get procedure type at a path.
 */
export type GetProcedureType<
  TRouter extends Router,
  TPath extends string
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TRouter
    ? TRouter[First] extends Router
      ? GetProcedureType<TRouter[First], Rest>
      : never
    : never
  : TPath extends keyof TRouter
  ? TRouter[TPath] extends ProcedureDefinition<
      infer TType,
      unknown,
      unknown,
      ProcedureContext
    >
    ? TType
    : never
  : never;

/**
 * Get procedure input type at a path.
 */
export type GetProcedureInput<
  TRouter extends Router,
  TPath extends string
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TRouter
    ? TRouter[First] extends Router
      ? GetProcedureInput<TRouter[First], Rest>
      : never
    : never
  : TPath extends keyof TRouter
  ? TRouter[TPath] extends ProcedureDefinition<
      ProcedureType,
      infer TInput,
      unknown,
      ProcedureContext
    >
    ? TInput
    : never
  : never;

/**
 * Get procedure output type at a path.
 */
export type GetProcedureOutput<
  TRouter extends Router,
  TPath extends string
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TRouter
    ? TRouter[First] extends Router
      ? GetProcedureOutput<TRouter[First], Rest>
      : never
    : never
  : TPath extends keyof TRouter
  ? TRouter[TPath] extends ProcedureDefinition<
      ProcedureType,
      unknown,
      infer TOutput,
      ProcedureContext
    >
    ? TOutput
    : never
  : never;
