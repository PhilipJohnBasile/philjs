/**
 * @philjs/trpc - Type definitions
 * Type-safe API layer types
 */

// Define router types inline to avoid dependency on @trpc packages
// These are compatible with @trpc/server and @trpc/client when they are installed

/**
 * Any router type - represents a tRPC router of any shape
 */
export interface AnyRouter {
  _def: {
    procedures: Record<string, unknown>;
    record: Record<string, unknown>;
  };
  createCaller: (ctx: unknown) => unknown;
}

/**
 * tRPC client error type - compatible with @trpc/client TRPCClientErrorLike
 */
export interface TRPCClientErrorLike<TRouter extends AnyRouter> {
  message: string;
  data?: {
    code: string;
    httpStatus: number;
    path?: string;
    stack?: string;
  };
  shape?: {
    message: string;
    code: number;
    data: {
      code: string;
      httpStatus: number;
      path?: string;
    };
  };
  meta?: Record<string, unknown>;
  cause?: Error;
}

// Context types
export interface BaseContext {
  req?: Request;
  res?: Response;
}

export interface AuthContext extends BaseContext {
  user?: User | null;
  session?: Session | null;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  [key: string]: unknown;
}

// Router configuration
export interface RouterConfig {
  prefix?: string;
  middleware?: MiddlewareFunction[];
  errorHandler?: ErrorHandler;
}

export type MiddlewareFunction<TContext = BaseContext> = (
  ctx: TContext,
  next: () => Promise<unknown>
) => Promise<unknown>;

export type ErrorHandler = (
  error: TRPCClientErrorLike<AnyRouter>,
  ctx: BaseContext
) => void;

// Procedure types
export interface ProcedureConfig {
  input?: unknown;
  output?: unknown;
  middleware?: MiddlewareFunction[];
}

// Client configuration
export interface ClientConfig {
  url: string;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  transformer?: DataTransformer;
  fetch?: typeof fetch;
  AbortController?: typeof AbortController;
}

export interface DataTransformer {
  serialize: (data: unknown) => unknown;
  deserialize: (data: unknown) => unknown;
}

// Subscription types
export interface SubscriptionConfig {
  enabled?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxRetries?: number;
}

export interface SubscriptionCallbacks<TData> {
  onData: (data: TData) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onStarted?: () => void;
  onStopped?: () => void;
}

// Batch configuration
export interface BatchConfig {
  enabled?: boolean;
  maxItems?: number;
  waitMs?: number;
}

// Link types
export interface LinkConfig {
  url: string;
  batch?: BatchConfig;
  headers?: Record<string, string>;
}

// Adapter types
export type AdapterType = 'express' | 'fastify' | 'next' | 'hono' | 'cloudflare' | 'aws-lambda';

export interface AdapterConfig {
  router: AnyRouter;
  createContext?: (opts: { req: Request; res?: Response }) => Promise<BaseContext> | BaseContext;
  onError?: ErrorHandler;
  batching?: BatchConfig;
}

// Query/Mutation options
export interface QueryOptions<TData, TError> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: boolean | number;
  retryDelay?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

export interface MutationOptions<TData, TError, TVariables> {
  retry?: boolean | number;
  retryDelay?: number;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
}

// Optimistic update types
export interface OptimisticUpdateConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate: (variables: TVariables) => Promise<{ previousData: TData }>;
  onError: (error: Error, variables: TVariables, context: { previousData: TData }) => void;
  onSettled: () => void;
}

// SSR types
export interface SSRConfig {
  ssr?: boolean;
  ssrPrepass?: boolean;
}

export interface DehydratedState {
  queries: Array<{
    queryKey: unknown[];
    state: unknown;
  }>;
  mutations: Array<{
    mutationKey: unknown[];
    state: unknown;
  }>;
}
