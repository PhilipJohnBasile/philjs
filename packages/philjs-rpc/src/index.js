/**
 * philjs-rpc - tRPC-style end-to-end type-safe RPC system for PhilJS
 *
 * @example Server-side API definition:
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
 * });
 *
 * export type AppAPI = typeof api;
 * ```
 *
 * @example Client-side usage:
 * ```ts
 * import { createClient } from 'philjs-rpc/client';
 * import type { AppAPI } from './server/api';
 *
 * const client = createClient<AppAPI>({ url: '/api/rpc' });
 *
 * // In components
 * const users = client.users.list.useQuery();
 * const createUser = client.users.create.useMutation();
 *
 * // Direct calls
 * const data = await client.users.list.fetch();
 * ```
 *
 * @example Server handler:
 * ```ts
 * import { createHandler } from 'philjs-rpc/server';
 * import { api } from './api';
 *
 * export const handler = createHandler(api);
 * ```
 *
 * @packageDocumentation
 */
// Error class
export { RPCError, RPC_ERROR_CODES_TO_HTTP } from './types.js';
// API creation
export { createAPI, createAPIWithMiddleware, createRouter, mergeRouters } from './createAPI.js';
// Router utilities
export { getRouterPaths, getProcedureAtPath } from './createAPI.js';
// Procedure builder
export { procedure, createProcedureBuilder, executeProcedure, isProcedure, isQuery, isMutation, isSubscription } from './procedure.js';
// Middleware
export { createMiddleware, executeMiddlewareChain, loggerMiddleware, timingMiddleware, rateLimitMiddleware, createAuthMiddleware, permissionMiddleware, retryMiddleware, cacheMiddleware, validationMiddleware, } from './middleware.js';
// SuperJSON Integration
export { serializeRequest, deserializeRequest, serializeResponse, deserializeResponse, serializeBatchRequest, deserializeBatchRequest, serializeBatchResponse, deserializeBatchResponse, createSuperJSONMiddleware, createClientRequestTransformer, createClientResponseTransformer, withSuperJSON, withoutSuperJSON, hasSuperJSON, getSuperJSONOptions, createLazyDeserialized, isLazyDeserialized, unwrapLazy, createStreamingSerializer, createStreamingDeserializer, SUPERJSON_ENABLED, LAZY_MARKER, } from './superjson.js';
// Subscriptions
export { WebSocketConnection, createUseSubscription, createLocalStorageStateManager, createMemoryStateManager, } from './subscriptions.js';
// SSE Transport
export { SSEConnection, createUseSSESubscription, isSSESupported, createAutoTransport, } from './sse.js';
// Subscription Middleware
export { createSubscriptionAuthMiddleware, createSubscriptionRateLimitMiddleware, createBackpressureMiddleware, createConnectionLimitMiddleware, createSubscriptionFilterMiddleware, createMultiplexingMiddleware, composeSubscriptionMiddleware, } from './subscription-middleware.js';
// Links
export { createHttpLink, createWebSocketLink, createSplitLink, createBatchLink, createDeduplicationLink, createRetryLink, createLoggingLink, createLinkChain, createTerminatingLink, } from './links.js';
// ============================================================================
// Treaty Client (Eden Treaty-style)
// ============================================================================
// Treaty client exports
export { treaty, createTreatyClient, TreatyError, } from "./treaty.js";
// Treaty server utilities
export { extractAPIMetadata, generateOpenAPI, generateTypeDefinitions, validateRequest, printAPIRoutes, exportRoutesJSON, isRouter, getAllPaths, getProcedureCount, } from "./treaty-server.js";
//# sourceMappingURL=index.js.map