/**
 * API definition for philjs-rpc.
 * Creates type-safe API routers with nested namespaces.
 */
import type { Router, APIDefinition, ProcedureDefinition, ProcedureContext, ProcedureType, Middleware } from './types.js';
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
export declare function createAPI<TRouter extends Router>(router: TRouter): APIDefinition<TRouter>;
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
export declare function createAPIWithMiddleware<TRouter extends Router>(middlewares: Middleware[], router: TRouter): APIDefinition<TRouter>;
/**
 * Get all procedure paths from a router.
 *
 * @example
 * ```ts
 * const paths = getRouterPaths(api._def.router);
 * // ['users.list', 'users.byId', 'users.create', 'posts.list', 'posts.comments.list']
 * ```
 */
export declare function getRouterPaths(router: Router, prefix?: string): string[];
/**
 * Get a procedure at a specific path in the router.
 *
 * @example
 * ```ts
 * const procedure = getProcedureAtPath(api._def.router, 'users.byId');
 * ```
 */
export declare function getProcedureAtPath(router: Router, path: string): ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext> | null;
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
export declare function mergeRouters<T extends Record<string, Router>>(routers: T): {
    [K in keyof T]: T[K];
};
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
export declare function createRouter<TRouter extends Router>(router: TRouter): TRouter;
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
export type GetProcedureType<TRouter extends Router, TPath extends string> = TPath extends `${infer First}.${infer Rest}` ? First extends keyof TRouter ? TRouter[First] extends Router ? GetProcedureType<TRouter[First], Rest> : never : never : TPath extends keyof TRouter ? TRouter[TPath] extends ProcedureDefinition<infer TType, unknown, unknown, ProcedureContext> ? TType : never : never;
/**
 * Get procedure input type at a path.
 */
export type GetProcedureInput<TRouter extends Router, TPath extends string> = TPath extends `${infer First}.${infer Rest}` ? First extends keyof TRouter ? TRouter[First] extends Router ? GetProcedureInput<TRouter[First], Rest> : never : never : TPath extends keyof TRouter ? TRouter[TPath] extends ProcedureDefinition<ProcedureType, infer TInput, unknown, ProcedureContext> ? TInput : never : never;
/**
 * Get procedure output type at a path.
 */
export type GetProcedureOutput<TRouter extends Router, TPath extends string> = TPath extends `${infer First}.${infer Rest}` ? First extends keyof TRouter ? TRouter[First] extends Router ? GetProcedureOutput<TRouter[First], Rest> : never : never : TPath extends keyof TRouter ? TRouter[TPath] extends ProcedureDefinition<ProcedureType, unknown, infer TOutput, ProcedureContext> ? TOutput : never : never;
//# sourceMappingURL=createAPI.d.ts.map