/**
 * @philjs/trpc
 * Type-safe API layer for PhilJS
 *
 * Features:
 * - Type-safe RPC client and server
 * - Server middleware (auth, rate limiting, logging, caching)
 * - Platform adapters (Express, Fastify, Hono, Cloudflare, Lambda)
 * - WebSocket subscriptions support
 * - Batched requests
 * - Query caching
 */
// Server utilities
export { createRouter, createAuthMiddleware, createRoleMiddleware, createRateLimitMiddleware, createLoggingMiddleware, createCacheMiddleware, validateInput, RPCError, ErrorCodes, } from './server/index.js';
// Client utilities
export { createClient, createBatchedClient, createQueryCache, createCachedQuery, } from './client/index.js';
// Adapters
export { createExpressAdapter, createFastifyAdapter, createHonoAdapter, createCloudflareAdapter, createLambdaAdapter, createStandaloneServer, } from './adapters/index.js';
//# sourceMappingURL=index.js.map