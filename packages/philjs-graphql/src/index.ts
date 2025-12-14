/**
 * PhilJS GraphQL Integration
 *
 * Provides GraphQL query and mutation support with:
 * - Type-safe queries and mutations
 * - Integration with PhilJS loaders and actions
 * - Automatic caching and deduplication
 * - Subscriptions support (coming soon)
 */

import type { Signal } from 'philjs-core';
import { signal, resource } from 'philjs-core';
import { defineLoader, defineAction } from 'philjs-ssr';
import type { DocumentNode } from 'graphql';

export interface GraphQLClientConfig {
  /** GraphQL endpoint URL */
  endpoint: string;
  /** Optional headers to include with every request */
  headers?: Record<string, string>;
  /** Optional fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
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
}

export interface GraphQLMutationOptions<TVariables = any> {
  /** GraphQL mutation document */
  mutation: string | DocumentNode;
  /** Mutation variables */
  variables?: TVariables;
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

/**
 * GraphQL Client for PhilJS
 */
export class GraphQLClient {
  private config: GraphQLClientConfig;
  private cache: Map<string, Promise<GraphQLResponse>>;

  constructor(config: GraphQLClientConfig) {
    this.config = config;
    this.cache = new Map();
  }

  /**
   * Execute a GraphQL query
   */
  async query<TData = any, TVariables = any>(
    options: GraphQLQueryOptions<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    const { query, variables, cacheKey, noCache } = options;

    // Generate cache key
    const key = cacheKey || this.generateCacheKey(query, variables);

    // Check cache if caching is enabled
    if (!noCache && this.cache.has(key)) {
      return this.cache.get(key)! as Promise<GraphQLResponse<TData>>;
    }

    // Execute query
    const promise = this.executeRequest<TData>({
      query: this.documentToString(query),
      variables
    });

    // Store in cache if caching is enabled
    if (!noCache) {
      this.cache.set(key, promise);
    }

    return promise;
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<TData = any, TVariables = any>(
    options: GraphQLMutationOptions<TVariables>
  ): Promise<GraphQLResponse<TData>> {
    const { mutation, variables } = options;

    const response = await this.executeRequest<TData>({
      query: this.documentToString(mutation),
      variables
    });

    // Clear cache after mutation
    this.clearCache();

    return response;
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

    return response.json();
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

  const query = resource(async () => {
    try {
      loading.set(true);
      const response = await client.query<TData, TVariables>(options);

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
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
  });

  return {
    data,
    error,
    loading,
    refetch: () => query.refresh()
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
      const response = await client.mutate<TData, TVariables>({
        mutation,
        variables
      });

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors[0].message);
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
      throw new Error(response.errors[0].message);
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
      throw new Error(response.errors[0].message);
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
