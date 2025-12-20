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

// ============================================================================
// Core Exports
// ============================================================================

// Types
export type {
  // Procedure types
  ProcedureType,
  ProcedureContext,
  ProcedureDefinition,
  ProcedureOptions,
  ProcedureHandler,

  // Schema types
  Schema,
  InferSchemaOutput,

  // Router types
  Router,
  RouterNode,
  APIDefinition,

  // Middleware types
  Middleware,
  MiddlewareFn,
  MiddlewareResult,

  // Error types
  RPCErrorCode,

  // Request/Response types
  RPCRequest,
  RPCResponse,
  RPCBatchRequest,
  RPCBatchResponse,

  // Client types
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  ClientProcedure,
  BuildClientFromRouter,

  // Handler types
  RequestAdapter,
  ResponseAdapter,
  HandlerFn,
  HandlerOptions,

  // Type inference utilities
  InferProcedureInput,
  InferProcedureOutput,
  IsProcedure,
  IsQuery,
  IsMutation,
  IsSubscription,
  RouterPaths,

  // Subscription types
  SubscriptionObserver,
  SubscriptionHandler,
  UseSubscriptionOptions,
  UseSubscriptionResult,
  SubscriptionEventMap,
} from './types.js';

// Error class
export { RPCError, RPC_ERROR_CODES_TO_HTTP } from './types.js';

// API creation
export { createAPI, createAPIWithMiddleware, createRouter, mergeRouters } from './createAPI.js';

// Router utilities
export { getRouterPaths, getProcedureAtPath } from './createAPI.js';

// Router type utilities
export type {
  InferRouter,
  InferPaths,
  GetProcedureType,
  GetProcedureInput,
  GetProcedureOutput,
} from './createAPI.js';

// Procedure builder
export { procedure, createProcedureBuilder, executeProcedure, isProcedure, isQuery, isMutation, isSubscription } from './procedure.js';
export type { ProcedureBuilder } from './procedure.js';

// Middleware
export {
  createMiddleware,
  executeMiddlewareChain,
  loggerMiddleware,
  timingMiddleware,
  rateLimitMiddleware,
  createAuthMiddleware,
  permissionMiddleware,
  retryMiddleware,
  cacheMiddleware,
  validationMiddleware,
} from './middleware.js';

// SuperJSON Integration
export {
  serializeRequest,
  deserializeRequest,
  serializeResponse,
  deserializeResponse,
  serializeBatchRequest,
  deserializeBatchRequest,
  serializeBatchResponse,
  deserializeBatchResponse,
  createSuperJSONMiddleware,
  createClientRequestTransformer,
  createClientResponseTransformer,
  withSuperJSON,
  withoutSuperJSON,
  hasSuperJSON,
  getSuperJSONOptions,
  createLazyDeserialized,
  isLazyDeserialized,
  unwrapLazy,
  createStreamingSerializer,
  createStreamingDeserializer,
  SUPERJSON_ENABLED,
  LAZY_MARKER,
} from './superjson.js';

export type {
  SuperJSONProcedure,
  SuperJSONHandlerOptions,
  LazyDeserialized,
  SuperJSONChunk,
} from './superjson.js';

// Subscriptions
export {
  WebSocketConnection,
  createUseSubscription,
  createLocalStorageStateManager,
  createMemoryStateManager,
} from './subscriptions.js';

export type {
  WebSocketConnectionConfig,
  WebSocketMessage,
  SubscriptionStateManager,
} from './subscriptions.js';

// SSE Transport
export {
  SSEConnection,
  createUseSSESubscription,
  isSSESupported,
  createAutoTransport,
} from './sse.js';

export type {
  SSEConnectionConfig,
  SSEMessage,
} from './sse.js';

// Subscription Middleware
export {
  createSubscriptionAuthMiddleware,
  createSubscriptionRateLimitMiddleware,
  createBackpressureMiddleware,
  createConnectionLimitMiddleware,
  createSubscriptionFilterMiddleware,
  createMultiplexingMiddleware,
  composeSubscriptionMiddleware,
} from './subscription-middleware.js';

export type {
  SubscriptionContext,
  SubscriptionMiddleware,
  SubscriptionAuthOptions,
  SubscriptionRateLimitOptions,
  BackpressureOptions,
  ConnectionLimitOptions,
  SubscriptionFilterOptions,
  MultiplexingOptions,
} from './subscription-middleware.js';

// Links
export {
  createHttpLink,
  createWebSocketLink,
  createSplitLink,
  createBatchLink,
  createDeduplicationLink,
  createRetryLink,
  createLoggingLink,
  createLinkChain,
  createTerminatingLink,
} from './links.js';

export type {
  Operation,
  OperationResult,
  Link,
  LinkFn,
  HttpLinkOptions,
  WebSocketLinkOptions,
  SplitLinkOptions,
  BatchLinkOptions,
  DeduplicationLinkOptions,
  RetryLinkOptions,
  LoggingLinkOptions,
} from './links.js';

// ============================================================================
// Treaty Client (Eden Treaty-style)
// ============================================================================

// Treaty client exports
export {
  treaty,
  createTreatyClient,
  TreatyError,
} from "./treaty.js";

export type {
  // Request types
  TreatyRequestOptions,
  TreatyConfig,
  TreatyRequestConfig,

  // Method types
  HttpMethod,
  TreatyMethod,

  // WebSocket types
  WebSocketOptions,
  WebSocketHandler,
  TreatyWebSocket,

  // Type builders
  BuildTreatyClient,
  InferTreatyClient,
  ExtractPathParams,
  ExtractQueryParams,
  ExtractBodyParams,
  ExtractResponse,
  ExtractInput,
  IsInputRequired,
} from "./treaty.js";

// Advanced treaty type utilities
export type {
  // Path types
  ExtractPathParamNames,
  HasPathParams,

  // Schema extraction
  ExtractBody,
  ExtractHeaders,
  ExtractCookies,

  // Response extraction
  InferOutput,
  InferInput,
  InferProcedureType,

  // Error types
  InferErrors,
  ErrorCode,
  TypedError,

  // WebSocket extraction
  InferWSMessage,
  InferWSSend,
  IsWebSocket,

  // Middleware types
  InferMiddlewareContext,
  MergeContexts,

  // File upload types
  FileUpload,
  ExtractFiles,
  AcceptsFiles,

  // HTTP method mapping
  ProcedureTypeToMethod,
  HTTPMethod,

  // Path construction
  BuildPath,
  ExtractPaths,

  // Utility types
  PartialBy,
  RequiredBy,
  DeepPartial,
  DeepReadonly,
  Awaited,
  UnwrapArray,
  IsNever,
  IsUnknown,
  Equals,
  Prettify,
  Brand,
  Unbrand,
  ValidInput,
  OptionalInput,
  Assert,
  AssertEquals,
  Keys,
  Values,
  RequiredKeys,
  OptionalKeys,
} from "./treaty-types.js";

// Treaty server utilities
export {
  extractAPIMetadata,
  generateOpenAPI,
  generateTypeDefinitions,
  validateRequest,
  printAPIRoutes,
  exportRoutesJSON,
  isRouter,
  getAllPaths,
  getProcedureCount,
} from "./treaty-server.js";

export type {
  RouteMetadata,
  APIMetadata,
  OpenAPISchema,
  OpenAPIOperation,
  TypeGenerationOptions,
} from "./treaty-server.js";

