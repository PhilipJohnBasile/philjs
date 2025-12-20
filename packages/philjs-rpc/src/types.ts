/**
 * Type utilities for end-to-end type inference in philjs-rpc.
 * Provides the foundation for type-safe RPC communication.
 */

import type { ZodType, ZodTypeDef, infer as ZodInfer } from 'zod';

// ============================================================================
// Base Types
// ============================================================================

/**
 * Procedure types supported by the RPC system.
 */
export type ProcedureType = 'query' | 'mutation' | 'subscription';

/**
 * Schema type - supports Zod schemas and custom validation functions.
 */
export type Schema<T = unknown> = ZodType<T, ZodTypeDef, unknown> | {
  parse: (input: unknown) => T;
  _output?: T;
};

/**
 * Infer the output type from a schema.
 */
export type InferSchemaOutput<S> = S extends ZodType<infer T, ZodTypeDef, unknown>
  ? T
  : S extends { parse: (input: unknown) => infer T }
  ? T
  : unknown;

// ============================================================================
// Procedure Types
// ============================================================================

/**
 * Context passed to procedures.
 */
export interface ProcedureContext {
  /** Request headers */
  headers?: Record<string, string | string[] | undefined>;
  /** Request cookies */
  cookies?: Record<string, string>;
  /** User session or auth info */
  user?: unknown;
  /** Custom context data added by middleware */
  [key: string]: unknown;
}

/**
 * Options for procedure execution.
 */
export interface ProcedureOptions<TInput = unknown, TContext = ProcedureContext> {
  /** Validated input data */
  input: TInput;
  /** Procedure context */
  ctx: TContext;
}

/**
 * Procedure handler function type.
 */
export type ProcedureHandler<TInput, TOutput, TContext = ProcedureContext> = (
  opts: ProcedureOptions<TInput, TContext>
) => TOutput | Promise<TOutput>;

/**
 * A defined procedure with input schema and handler.
 */
export interface ProcedureDefinition<
  TType extends ProcedureType = ProcedureType,
  TInput = unknown,
  TOutput = unknown,
  TContext = ProcedureContext
> {
  _type: TType;
  _input: TInput;
  _output: TOutput;
  _context: TContext;
  _def: {
    type: TType;
    inputSchema?: Schema<TInput>;
    handler: ProcedureHandler<TInput, TOutput, TContext>;
    middlewares: Middleware<unknown, TContext>[];
  };
}

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Middleware function type.
 */
export type MiddlewareFn<TInput = unknown, TContext = ProcedureContext, TNewContext = TContext> = (
  opts: {
    ctx: TContext;
    input: TInput;
    next: <T extends TNewContext>(ctx?: T) => Promise<MiddlewareResult>;
    type: ProcedureType;
    path: string;
  }
) => Promise<MiddlewareResult>;

/**
 * Result from middleware execution.
 */
export interface MiddlewareResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  error?: RPCError;
}

/**
 * Middleware definition.
 */
export interface Middleware<TInput = unknown, TContext = ProcedureContext> {
  _input: TInput;
  _context: TContext;
  fn: MiddlewareFn<TInput, TContext>;
}

// ============================================================================
// API Router Types
// ============================================================================

/**
 * A single procedure or nested router.
 */
export type RouterNode = ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext> | Router;

/**
 * API Router structure - procedures and nested routers.
 */
export interface Router {
  [key: string]: RouterNode;
}

/**
 * Type-safe API definition.
 */
export interface APIDefinition<TRouter extends Router = Router> {
  _router: TRouter;
  _def: {
    router: TRouter;
    middlewares: Middleware[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * RPC error codes.
 */
export type RPCErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR';

/**
 * HTTP status codes for RPC errors.
 */
export const RPC_ERROR_CODES_TO_HTTP: Record<RPCErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * RPC Error class for typed error handling.
 */
export class RPCError extends Error {
  public readonly code: RPCErrorCode;
  public readonly cause?: unknown;

  constructor(opts: { code: RPCErrorCode; message: string; cause?: unknown }) {
    super(opts.message);
    this.name = 'RPCError';
    this.code = opts.code;
    this.cause = opts.cause;
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * RPC request structure.
 */
export interface RPCRequest {
  /** Procedure path (e.g., "users.byId") */
  path: string;
  /** Procedure type */
  type: ProcedureType;
  /** Input data */
  input?: unknown;
}

/**
 * RPC response structure.
 */
export interface RPCResponse<TData = unknown> {
  /** Response data on success */
  result?: {
    data: TData;
  };
  /** Error on failure */
  error?: {
    code: RPCErrorCode;
    message: string;
    data?: unknown;
  };
}

/**
 * Batch RPC request.
 */
export interface RPCBatchRequest {
  requests: RPCRequest[];
}

/**
 * Batch RPC response.
 */
export interface RPCBatchResponse {
  responses: RPCResponse[];
}

// ============================================================================
// Client Types
// ============================================================================

/**
 * Query hook options.
 */
export interface UseQueryOptions<TData> {
  /** Enable/disable the query */
  enabled?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Retry count on failure */
  retry?: number | boolean;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Callback on success */
  onSuccess?: (data: TData) => void;
  /** Callback on error */
  onError?: (error: RPCError) => void;
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Initial data */
  initialData?: TData;
  /** Placeholder data while loading */
  placeholderData?: TData;
}

/**
 * Query hook result.
 */
export interface UseQueryResult<TData> {
  /** Query data */
  data: TData | undefined;
  /** Error if query failed */
  error: RPCError | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is fetching (initial or refetch) */
  isFetching: boolean;
  /** Whether the query is successful */
  isSuccess: boolean;
  /** Whether the query has errored */
  isError: boolean;
  /** Whether the query is stale */
  isStale: boolean;
  /** Refetch the query */
  refetch: () => Promise<void>;
  /** Remove the query from cache */
  remove: () => void;
}

/**
 * Mutation hook options.
 */
export interface UseMutationOptions<TData, TInput> {
  /** Callback on success */
  onSuccess?: (data: TData, variables: TInput) => void;
  /** Callback on error */
  onError?: (error: RPCError, variables: TInput) => void;
  /** Callback on settled (success or error) */
  onSettled?: (data: TData | undefined, error: RPCError | null, variables: TInput) => void;
  /** Callback before mutation */
  onMutate?: (variables: TInput) => void | Promise<void>;
  /** Retry count on failure */
  retry?: number | boolean;
}

/**
 * Mutation hook result.
 */
export interface UseMutationResult<TData, TInput> {
  /** Mutation result data */
  data: TData | undefined;
  /** Error if mutation failed */
  error: RPCError | null;
  /** Whether the mutation is in progress */
  isLoading: boolean;
  /** Whether the mutation is successful */
  isSuccess: boolean;
  /** Whether the mutation has errored */
  isError: boolean;
  /** Whether the mutation is idle (not started) */
  isIdle: boolean;
  /** Execute the mutation */
  mutate: (input: TInput) => void;
  /** Execute the mutation and return a promise */
  mutateAsync: (input: TInput) => Promise<TData>;
  /** Reset the mutation state */
  reset: () => void;
}

// ============================================================================
// Type Inference Utilities
// ============================================================================

/**
 * Infer input type from a procedure.
 */
export type InferProcedureInput<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  infer TInput,
  unknown,
  ProcedureContext
>
  ? TInput
  : never;

/**
 * Infer output type from a procedure.
 */
export type InferProcedureOutput<TProcedure> = TProcedure extends ProcedureDefinition<
  ProcedureType,
  unknown,
  infer TOutput,
  ProcedureContext
>
  ? TOutput
  : never;

/**
 * Check if a type is a procedure.
 */
export type IsProcedure<T> = T extends ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>
  ? true
  : false;

/**
 * Check if a procedure is a query.
 */
export type IsQuery<T> = T extends ProcedureDefinition<'query', unknown, unknown, ProcedureContext>
  ? true
  : false;

/**
 * Check if a procedure is a mutation.
 */
export type IsMutation<T> = T extends ProcedureDefinition<'mutation', unknown, unknown, ProcedureContext>
  ? true
  : false;

/**
 * Deep unwrap a router to get all procedure paths.
 */
export type RouterPaths<TRouter extends Router, TPrefix extends string = ''> = {
  [K in keyof TRouter]: TRouter[K] extends ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>
    ? TPrefix extends ''
      ? K
      : `${TPrefix}.${K & string}`
    : TRouter[K] extends Router
    ? RouterPaths<TRouter[K], TPrefix extends '' ? K & string : `${TPrefix}.${K & string}`>
    : never;
}[keyof TRouter];

/**
 * Get procedure at a specific path in a router.
 */
export type GetProcedureAtPath<
  TRouter extends Router,
  TPath extends string
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TRouter
    ? TRouter[First] extends Router
      ? GetProcedureAtPath<TRouter[First], Rest>
      : never
    : never
  : TPath extends keyof TRouter
  ? TRouter[TPath]
  : never;

// ============================================================================
// Client Builder Types
// ============================================================================

/**
 * Client procedure type with fetch and hooks.
 */
export interface ClientProcedure<TInput, TOutput, TType extends ProcedureType> {
  /** Direct fetch call */
  fetch: TInput extends void
    ? () => Promise<TOutput>
    : (input: TInput) => Promise<TOutput>;

  /** React Query-style hook */
  useQuery: TType extends 'query'
    ? TInput extends void
      ? (options?: UseQueryOptions<TOutput>) => UseQueryResult<TOutput>
      : (input: TInput, options?: UseQueryOptions<TOutput>) => UseQueryResult<TOutput>
    : never;

  /** Mutation hook */
  useMutation: TType extends 'mutation'
    ? (options?: UseMutationOptions<TOutput, TInput>) => UseMutationResult<TOutput, TInput>
    : never;

  /** Subscription hook */
  useSubscription: TType extends 'subscription'
    ? (input: TInput, options?: UseSubscriptionOptions<TOutput>) => UseSubscriptionResult<TOutput>
    : never;
}

/**
 * Build client type from router.
 */
export type BuildClientFromRouter<TRouter extends Router> = {
  [K in keyof TRouter]: TRouter[K] extends ProcedureDefinition<
    infer TType,
    infer TInput,
    infer TOutput,
    ProcedureContext
  >
    ? ClientProcedure<TInput, TOutput, TType>
    : TRouter[K] extends Router
    ? BuildClientFromRouter<TRouter[K]>
    : never;
};

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Request adapter interface for different runtimes.
 */
export interface RequestAdapter {
  /** Get HTTP method */
  method: string;
  /** Get request URL */
  url: string;
  /** Get headers */
  headers: Record<string, string | string[] | undefined>;
  /** Get body as JSON */
  json: () => Promise<unknown>;
  /** Get query parameters */
  query: Record<string, string | string[] | undefined>;
}

/**
 * Response adapter interface for different runtimes.
 */
export interface ResponseAdapter {
  /** Set status code */
  status: (code: number) => ResponseAdapter;
  /** Set response header */
  header: (name: string, value: string) => ResponseAdapter;
  /** Send JSON response */
  json: (data: unknown) => void;
}

/**
 * Handler function type.
 */
export type HandlerFn = (req: RequestAdapter, res: ResponseAdapter) => Promise<void>;

/**
 * Handler options.
 */
export interface HandlerOptions {
  /** Base path for the handler */
  basePath?: string;
  /** Create context from request */
  createContext?: (req: RequestAdapter) => ProcedureContext | Promise<ProcedureContext>;
  /** Error formatter */
  onError?: (error: unknown, ctx: ProcedureContext) => void;
  /** Enable batching */
  batching?: boolean;
}

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * Subscription observer interface.
 */
export interface SubscriptionObserver<TData> {
  /** Called when new data is available */
  next?: (data: TData) => void;
  /** Called when an error occurs */
  error?: (error: RPCError) => void;
  /** Called when the subscription completes */
  complete?: () => void;
}

/**
 * Subscription handler function type.
 */
export type SubscriptionHandler<TInput, TOutput, TContext = ProcedureContext> = (
  opts: ProcedureOptions<TInput, TContext>
) => AsyncGenerator<TOutput> | AsyncIterable<TOutput>;

/**
 * Subscription hook options.
 */
export interface UseSubscriptionOptions<TData> {
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Callback when data is received */
  onData?: (data: TData) => void;
  /** Callback when an error occurs */
  onError?: (error: RPCError) => void;
  /** Callback when subscription completes */
  onComplete?: () => void;
  /** Callback when subscription starts */
  onStart?: () => void;
  /** Retry on error */
  retryOnError?: boolean;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Subscription hook result.
 */
export interface UseSubscriptionResult<TData> {
  /** All received data */
  data: TData[];
  /** Last received data */
  lastData: TData | undefined;
  /** Error if subscription failed */
  error: RPCError | null;
  /** Subscription status */
  status: 'idle' | 'connecting' | 'subscribed' | 'error';
  /** Whether the subscription is active */
  isSubscribed: boolean;
  /** Whether the subscription has errored */
  isError: boolean;
  /** Reset subscription data */
  reset: () => void;
  /** Resubscribe */
  resubscribe: () => void;
}

/**
 * Subscription event map.
 */
export interface SubscriptionEventMap {
  connecting: {};
  connected: {};
  disconnected: {};
  error: { error: Error };
  reconnecting: { attempt: number; delay: number };
  reconnectFailed: {};
}

/**
 * Check if a procedure is a subscription.
 */
export type IsSubscription<T> = T extends ProcedureDefinition<'subscription', unknown, unknown, ProcedureContext>
  ? true
  : false;
