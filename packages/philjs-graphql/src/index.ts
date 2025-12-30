/**
 * PhilJS GraphQL Integration
 *
 * Provides GraphQL query and mutation support with:
 * - Type-safe queries and mutations
 * - Signal-based reactive caching
 * - Integration with PhilJS loaders and actions
 * - Automatic caching and deduplication
 * - GraphQL subscriptions over WebSocket
 * - Optimistic updates for mutations
 * - Advanced error handling with retry logic
 */

import type { Signal } from 'philjs-core';
import { signal, resource, memo, batch } from 'philjs-core';
import { defineLoader, defineAction } from 'philjs-ssr';
import type { DocumentNode } from 'graphql';

export interface GraphQLClientConfig {
  /** GraphQL endpoint URL */
  endpoint: string;
  /** Optional WebSocket endpoint for subscriptions */
  subscriptionEndpoint?: string;
  /** Optional headers to include with every request */
  headers?: Record<string, string>;
  /** Optional fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
  /** Enable signal-based reactive caching (default: true) */
  reactiveCache?: boolean;
  /** Default cache time-to-live in milliseconds (default: 5 minutes) */
  defaultCacheTTL?: number;
  /** Retry configuration */
  retry?: {
    /** Maximum number of retries (default: 3) */
    maxRetries?: number;
    /** Retry delay in milliseconds (default: 1000) */
    retryDelay?: number;
    /** Exponential backoff multiplier (default: 2) */
    backoffMultiplier?: number;
  };
}

export interface GraphQLQueryOptions<TVariables = any> {
  /** GraphQL query document */
  query: string | DocumentNode;
  /** Query variables */
  variables?: TVariables;
  /** Cache key override (defaults to query + variables hash) */
  cacheKey?: string;
  /** Disable caching for this query */
  noCache?: boolean;
  /** Cache time-to-live in milliseconds */
  cacheTTL?: number;
  /** Enable polling with interval in milliseconds */
  pollInterval?: number;
}

export interface GraphQLMutationOptions<TVariables = any> {
  /** GraphQL mutation document */
  mutation: string | DocumentNode;
  /** Mutation variables */
  variables?: TVariables;
  /** Optimistic response to update cache immediately */
  optimisticResponse?: any;
  /** Queries to refetch after mutation */
  refetchQueries?: Array<string | { query: string | DocumentNode; variables?: any }>;
  /** Update function to manually update cache */
  update?: (cache: CacheStore, result: any) => void;
}

export interface GraphQLResponse<TData = any> {
  data?: TData;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

export interface GraphQLSubscriptionOptions<TVariables = any> {
  /** GraphQL subscription document */
  subscription: string | DocumentNode;
  /** Subscription variables */
  variables?: TVariables;
  /** Callback for subscription data */
  onData?: (data: any) => void;
  /** Callback for subscription errors */
  onError?: (error: Error) => void;
  /** Callback for subscription completion */
  onComplete?: () => void;
}

/**
 * Cache entry with signal-based reactivity
 */
interface CacheEntry<T = any> {
  data: Signal<GraphQLResponse<T> | null>;
  promise: Promise<GraphQLResponse<T>> | null;
  timestamp: number;
  ttl?: number;
}

/**
 * Cache store interface for mutation updates
 */
export interface CacheStore {
  get<T>(key: string): Signal<GraphQLResponse<T> | null> | undefined;
  set<T>(key: string, data: GraphQLResponse<T>, ttl?: number): void;
  delete(key: string): void;
  clear(pattern?: string | RegExp): void;
}

/**
 * GraphQL Client for PhilJS
 */
export class GraphQLClient implements CacheStore {
  private config: GraphQLClientConfig;
  private cache: Map<string, CacheEntry>;
  private subscriptions: Map<string, WebSocket>;

  constructor(config: GraphQLClientConfig) {
    this.config = {
      reactiveCache: true,
      defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      ...config,
    };
    this.cache = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Execute a GraphQL query
   */
  async query<TData = any, TVariables = any>(
    options: GraphQLQueryOptions<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    const { query, variables, cacheKey, noCache, cacheTTL } = options;

    // Generate cache key
    const key = cacheKey || this.generateCacheKey(query, variables);

    // Check cache if caching is enabled
    if (!noCache) {
      const entry = this.cache.get(key);
      if (entry) {
        // Check if cache is still valid
        const now = Date.now();
        const ttl = cacheTTL || entry.ttl || this.config.defaultCacheTTL!;
        if (now - entry.timestamp < ttl) {
          // Return cached data if available
          const cached = entry.data();
          if (cached) {
            return cached;
          }
          // Return pending promise if still loading
          if (entry.promise) {
            return entry.promise;
          }
        } else {
          // Cache expired, remove it
          this.cache.delete(key);
        }
      }
    }

    // Execute query with retry logic
    const promise = this.executeRequestWithRetry<TData>({
      query: this.documentToString(query),
      variables
    });

    // Store in cache if caching is enabled
    if (!noCache && this.config.reactiveCache) {
      const dataSignal = signal<GraphQLResponse<TData> | null>(null);
      const entry: CacheEntry<TData> = {
        data: dataSignal,
        promise,
        timestamp: Date.now(),
      };
      const ttlValue = cacheTTL || this.config.defaultCacheTTL;
      if (ttlValue !== undefined) entry.ttl = ttlValue;
      this.cache.set(key, entry);

      // Update signal when promise resolves
      promise.then((response) => {
        dataSignal.set(response);
        entry.promise = null;
      }).catch(() => {
        entry.promise = null;
      });
    }

    return promise;
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<TData = any, TVariables = any>(
    options: GraphQLMutationOptions<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    const { mutation, variables, optimisticResponse, refetchQueries, update } = options;

    // Apply optimistic update if provided
    if (optimisticResponse && update) {
      batch(() => {
        update(this, { data: optimisticResponse });
      });
    }

    try {
      const response = await this.executeRequestWithRetry<TData>({
        query: this.documentToString(mutation),
        variables
      });

      // Apply cache updates
      if (update && response.data) {
        batch(() => {
          update(this, response);
        });
      }

      // Refetch specified queries
      if (refetchQueries && refetchQueries.length > 0) {
        await Promise.all(
          refetchQueries.map((q) => {
            if (typeof q === 'string') {
              // Clear cache for this query pattern
              this.clearCache(q);
            } else {
              // Refetch specific query
              return this.query({ query: q.query, variables: q.variables, noCache: true });
            }
          })
        );
      } else {
        // Default behavior: clear all cache
        this.clearCache();
      }

      return response;
    } catch (error) {
      // Revert optimistic update on error
      if (optimisticResponse && update) {
        // In a real implementation, you'd store the previous state and restore it
        this.clearCache();
      }
      throw error;
    }
  }

  /**
   * Subscribe to GraphQL subscription
   */
  subscribe<TData = any, TVariables = any>(
    options: GraphQLSubscriptionOptions<TVariables>
  ): () => void {
    const { subscription, variables, onData, onError, onComplete } = options;

    if (!this.config.subscriptionEndpoint) {
      throw new Error('Subscription endpoint not configured');
    }

    const key = this.generateCacheKey(subscription, variables);

    // Check if subscription already exists
    if (this.subscriptions.has(key)) {
      console.warn('Subscription already active for this key');
      return () => this.unsubscribe(key);
    }

    // Create WebSocket connection
    const ws = new WebSocket(this.config.subscriptionEndpoint);

    ws.onopen = () => {
      // Send subscription request
      ws.send(JSON.stringify({
        type: 'start',
        payload: {
          query: this.documentToString(subscription),
          variables,
        },
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'data' && onData) {
        onData(message.payload.data);
      } else if (message.type === 'error' && onError) {
        onError(new Error(message.payload.message || 'Subscription error'));
      } else if (message.type === 'complete' && onComplete) {
        onComplete();
        this.unsubscribe(key);
      }
    };

    ws.onerror = (error) => {
      if (onError) {
        onError(new Error('WebSocket error'));
      }
    };

    ws.onclose = () => {
      if (onComplete) {
        onComplete();
      }
      this.unsubscribe(key);
    };

    this.subscriptions.set(key, ws);

    // Return unsubscribe function
    return () => this.unsubscribe(key);
  }

  /**
   * Unsubscribe from a subscription
   */
  private unsubscribe(key: string): void {
    const ws = this.subscriptions.get(key);
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop' }));
        ws.close();
      }
      this.subscriptions.delete(key);
    }
  }

  /**
   * Clear the query cache
   */
  clearCache(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = typeof pattern === 'string'
      ? new RegExp(pattern)
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the query cache (CacheStore interface implementation)
   */
  clear(pattern?: string | RegExp): void {
    this.clearCache(pattern);
  }

  /**
   * Get cache entry (implements CacheStore)
   */
  get<T>(key: string): Signal<GraphQLResponse<T> | null> | undefined {
    const entry = this.cache.get(key);
    return entry?.data as Signal<GraphQLResponse<T> | null>;
  }

  /**
   * Set cache entry (implements CacheStore)
   */
  set<T>(key: string, data: GraphQLResponse<T>, ttl?: number): void {
    const dataSignal = signal<GraphQLResponse<T> | null>(data);
    const entry: CacheEntry<T> = {
      data: dataSignal,
      promise: null,
      timestamp: Date.now(),
    };
    const ttlValue = ttl || this.config.defaultCacheTTL;
    if (ttlValue !== undefined) entry.ttl = ttlValue;
    this.cache.set(key, entry);
  }

  /**
   * Delete cache entry (implements CacheStore)
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Execute the GraphQL request with retry logic
   */
  private async executeRequestWithRetry<TData = any>(
    body: { query: string; variables?: any },
    retryCount = 0
  ): Promise<GraphQLResponse<TData>> {
    try {
      return await this.executeRequest<TData>(body);
    } catch (error) {
      const { maxRetries = 3, retryDelay = 1000, backoffMultiplier = 2 } = this.config.retry || {};

      if (retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeRequestWithRetry<TData>(body, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Execute the GraphQL request
   */
  private async executeRequest<TData = any>(body: {
    query: string;
    variables?: any;
  }): Promise<GraphQLResponse<TData>> {
    const fetchFn = this.config.fetch || globalThis.fetch;

    const response = await fetchFn(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      // Still return the result, but consumers can check for errors
      return result;
    }

    return result;
  }

  /**
   * Convert DocumentNode to string if needed
   */
  private documentToString(doc: string | DocumentNode): string {
    if (typeof doc === 'string') {
      return doc;
    }

    // If it's a DocumentNode, extract the query string
    // This is a simplified version - in production you'd use graphql/print
    return (doc as any).loc?.source?.body || String(doc);
  }

  /**
   * Generate cache key from query and variables
   */
  private generateCacheKey(query: string | DocumentNode, variables?: any): string {
    const queryStr = this.documentToString(query);
    const varsStr = variables ? JSON.stringify(variables) : '';
    return `${queryStr}:${varsStr}`;
  }
}

/**
 * Create a GraphQL client instance
 */
export function createGraphQLClient(config: GraphQLClientConfig): GraphQLClient {
  return new GraphQLClient(config);
}

/**
 * Create a reactive GraphQL query hook
 */
export function createQuery<TData = any, TVariables = any>(
  client: GraphQLClient,
  options: GraphQLQueryOptions<TVariables>
) {
  const data = signal<TData | undefined>(undefined);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const retryCount = signal(0);

  let pollInterval: NodeJS.Timeout | null = null;

  const executeQuery = async () => {
    try {
      loading.set(true);
      const response = await client.query<TData, TVariables>(options);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0]!.message);
      }

      data.set(response.data);
      error.set(null);
      retryCount.set(0);
      return response.data;
    } catch (err) {
      error.set(err as Error);
      retryCount.set(retryCount() + 1);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  const query = resource(executeQuery);

  // Setup polling if specified
  if (options.pollInterval) {
    pollInterval = setInterval(() => {
      query.refresh();
    }, options.pollInterval);
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  const startPolling = (interval: number) => {
    stopPolling();
    pollInterval = setInterval(() => {
      query.refresh();
    }, interval);
  };

  return {
    data,
    error,
    loading,
    retryCount,
    refetch: () => query.refresh(),
    startPolling,
    stopPolling,
  };
}

/**
 * Create a GraphQL mutation hook
 */
export function createMutation<TData = any, TVariables = any>(
  client: GraphQLClient,
  mutation: string | DocumentNode
) {
  const data = signal<TData | undefined>(undefined);
  const error = signal<Error | null>(null);
  const loading = signal(false);

  const execute = async (variables?: TVariables) => {
    try {
      loading.set(true);
      const mutationOptions: GraphQLMutationOptions<TVariables> = { mutation };
      if (variables !== undefined) mutationOptions.variables = variables;
      const response = await client.mutate<TData, TVariables>(mutationOptions);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0]!.message);
      }

      data.set(response.data);
      error.set(null);
      return response.data;
    } catch (err) {
      error.set(err as Error);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  return {
    mutate: execute,
    data,
    error,
    loading
  };
}

/**
 * Create a GraphQL loader for server-side data fetching
 */
export function createGraphQLLoader<TData = any, TVariables = any>(
  client: GraphQLClient,
  query: string | DocumentNode
) {
  return defineLoader(async ({ params, request }) => {
    // Extract variables from URL params or request
    const variables = params as TVariables;

    const response = await client.query<TData, TVariables>({
      query,
      variables
    });

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]!.message);
    }

    return response.data;
  });
}

/**
 * Create a GraphQL action for mutations
 */
export function createGraphQLAction<TData = any, TVariables = any>(
  client: GraphQLClient,
  mutation: string | DocumentNode
) {
  return defineAction(async ({ request }) => {
    const formData = await request.formData();
    const variables: any = {};

    // Convert form data to variables
    for (const [key, value] of formData.entries()) {
      try {
        // Try to parse JSON values
        variables[key] = JSON.parse(value as string);
      } catch {
        // Use raw value if not JSON
        variables[key] = value;
      }
    }

    const response = await client.mutate<TData, TVariables>({
      mutation,
      variables
    });

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]!.message);
    }

    return response.data;
  });
}

/**
 * GraphQL utilities
 */
export const gql = (strings: TemplateStringsArray, ...values: any[]) => {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] || '');
  }, '');
};

export type { DocumentNode };

// Export subscription utilities
export {
  SubscriptionClient,
  SubscriptionHandle,
  createSubscriptionClient,
  useSubscription,
  type SubscriptionConfig,
  type SubscriptionOptions,
  type SubscriptionState,
} from './subscription.js';

// Export persisted query utilities
export {
  PersistedQueryManager,
  PersistedQueryRegistry,
  createPersistedQueryManager,
  createPersistedQueryRegistry,
  shouldRetryWithFullQuery,
  buildPersistedQueryRequest,
  extractQueryHash,
  generatePersistedQueryManifest,
  type PersistedQueryConfig,
  type PersistedQueryLink,
} from './persisted.js';

// Export fragment utilities
export {
  FragmentRegistry,
  defineFragment,
  maskFragment,
  unmaskFragment,
  isMaskedFragment,
  spreadFragment,
  composeFragments,
  buildQueryWithFragments,
  useFragment,
  withFragment,
  getComponentFragment,
  mergeFragmentData,
  selectFromFragment,
  getFragmentRegistry,
  createFragmentRegistry,
  fragment,
  inlineFragment,
  FragmentUtils,
  type FragmentDefinition,
  type MaskedFragment,
} from './fragments.js';

// Export optimistic update utilities
export {
  OptimisticUpdateManager,
  OptimisticResponseBuilder,
  MutationQueue,
  LastWriteWinsResolver,
  FirstWriteWinsResolver,
  CustomConflictResolver,
  createOptimisticUpdateManager,
  buildOptimisticResponse,
  createMutationQueue,
  type OptimisticUpdateConfig,
  type OptimisticMutation,
  type OptimisticUpdateSnapshot,
  type ConflictResolver,
} from './optimistic.js';

// Export code generation utilities
export {
  GraphQLCodegen,
  BatchCodegen,
  createCodegen,
  createBatchCodegen,
  runCodegen,
  extractOperationInfo,
  extractFragmentInfo,
  type CodegenConfig,
  type GeneratedOperation,
  type GeneratedFragment,
} from './codegen-enhanced.js';
