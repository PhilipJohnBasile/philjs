/**
 * API definition for philjs-rpc.
 * Creates type-safe API routers with nested namespaces.
 */
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
export function createAPI(router) {
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
export function createAPIWithMiddleware(middlewares, router) {
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
function validateRouter(router, path = '') {
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
            validateRouter(value, currentPath);
            continue;
        }
        throw new Error(`Invalid router at "${currentPath}": expected procedure or nested router, got ${typeof value}`);
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
export function getRouterPaths(router, prefix = '') {
    const paths = [];
    for (const [key, value] of Object.entries(router)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        if (isProcedure(value)) {
            paths.push(currentPath);
        }
        else if (typeof value === 'object' && value !== null) {
            paths.push(...getRouterPaths(value, currentPath));
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
export function getProcedureAtPath(router, path) {
    const parts = path.split('.');
    let current = router;
    for (const part of parts) {
        if (current === null || current === undefined) {
            return null;
        }
        if (isProcedure(current)) {
            // We hit a procedure before exhausting the path
            return null;
        }
        current = current[part];
    }
    if (current !== undefined && isProcedure(current)) {
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
export function mergeRouters(routers) {
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
export function createRouter(router) {
    validateRouter(router);
    return router;
}
//# sourceMappingURL=createAPI.js.map