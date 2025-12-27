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

// Types
export type {
  BaseContext,
  AuthContext,
  User,
  Session,
  RouterConfig,
  MiddlewareFunction,
  ErrorHandler,
  ProcedureConfig,
  ClientConfig,
  DataTransformer,
  SubscriptionConfig,
  SubscriptionCallbacks,
  BatchConfig,
  LinkConfig,
  AdapterType,
  AdapterConfig,
} from './types';

// Server utilities
export {
  createRouter,
  createAuthMiddleware,
  createRoleMiddleware,
  createRateLimitMiddleware,
  createLoggingMiddleware,
  createCacheMiddleware,
  validateInput,
  RPCError,
  ErrorCodes,
} from './server';

// Client utilities
export {
  createClient,
  createBatchedClient,
  createQueryCache,
  createCachedQuery,
} from './client';

// Adapters
export {
  createExpressAdapter,
  createFastifyAdapter,
  createHonoAdapter,
  createCloudflareAdapter,
  createLambdaAdapter,
  createStandaloneServer,
} from './adapters';
