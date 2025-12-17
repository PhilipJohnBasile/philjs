/**
 * PhilJS GraphQL Integration
 *
 * Provides GraphQL query and mutation support with:
 * - Type-safe queries and mutations
 * - Integration with PhilJS loaders and actions
 * - Automatic caching and deduplication
 * - Subscriptions support (coming soon)
 */
import { signal, resource } from 'philjs-core';
import { defineLoader, defineAction } from 'philjs-ssr';
/**
 * GraphQL Client for PhilJS
 */
export class GraphQLClient {
    config;
    cache;
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }
    /**
     * Execute a GraphQL query
     */
    async query(options) {
        const { query, variables, cacheKey, noCache } = options;
        // Generate cache key
        const key = cacheKey || this.generateCacheKey(query, variables);
        // Check cache if caching is enabled
        if (!noCache && this.cache.has(key)) {
            return this.cache.get(key);
        }
        // Execute query
        const promise = this.executeRequest({
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
    async mutate(options) {
        const { mutation, variables } = options;
        const response = await this.executeRequest({
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
    clearCache(pattern) {
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
    async executeRequest(body) {
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
    documentToString(doc) {
        if (typeof doc === 'string') {
            return doc;
        }
        // If it's a DocumentNode, extract the query string
        // This is a simplified version - in production you'd use graphql/print
        return doc.loc?.source?.body || String(doc);
    }
    /**
     * Generate cache key from query and variables
     */
    generateCacheKey(query, variables) {
        const queryStr = this.documentToString(query);
        const varsStr = variables ? JSON.stringify(variables) : '';
        return `${queryStr}:${varsStr}`;
    }
}
/**
 * Create a GraphQL client instance
 */
export function createGraphQLClient(config) {
    return new GraphQLClient(config);
}
/**
 * Create a reactive GraphQL query hook
 */
export function createQuery(client, options) {
    const data = signal(undefined);
    const error = signal(null);
    const loading = signal(true);
    const query = resource(async () => {
        try {
            loading.set(true);
            const response = await client.query(options);
            if (response.errors && response.errors.length > 0) {
                throw new Error(response.errors[0].message);
            }
            data.set(response.data);
            error.set(null);
            return response.data;
        }
        catch (err) {
            error.set(err);
            throw err;
        }
        finally {
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
export function createMutation(client, mutation) {
    const data = signal(undefined);
    const error = signal(null);
    const loading = signal(false);
    const execute = async (variables) => {
        try {
            loading.set(true);
            const response = await client.mutate({
                mutation,
                variables
            });
            if (response.errors && response.errors.length > 0) {
                throw new Error(response.errors[0].message);
            }
            data.set(response.data);
            error.set(null);
            return response.data;
        }
        catch (err) {
            error.set(err);
            throw err;
        }
        finally {
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
export function createGraphQLLoader(client, query) {
    return defineLoader(async ({ params, request }) => {
        // Extract variables from URL params or request
        const variables = params;
        const response = await client.query({
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
export function createGraphQLAction(client, mutation) {
    return defineAction(async ({ request }) => {
        const formData = await request.formData();
        const variables = {};
        // Convert form data to variables
        for (const [key, value] of formData.entries()) {
            try {
                // Try to parse JSON values
                variables[key] = JSON.parse(value);
            }
            catch {
                // Use raw value if not JSON
                variables[key] = value;
            }
        }
        const response = await client.mutate({
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
export const gql = (strings, ...values) => {
    return strings.reduce((result, str, i) => {
        return result + str + (values[i] || '');
    }, '');
};
//# sourceMappingURL=index.js.map