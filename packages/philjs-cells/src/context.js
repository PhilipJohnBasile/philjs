/**
 * PhilJS Cells - Context Provider
 *
 * Provides global configuration for Cells including GraphQL client,
 * caching, and SSR support.
 */
import { createContext, useContext } from '@philjs/core';
import { cellCache } from './cache.js';
// ============================================================================
// Default Configuration
// ============================================================================
const defaultConfig = {
    defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
    retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
    },
    streaming: {
        enabled: true,
    },
};
// ============================================================================
// Context Creation
// ============================================================================
/**
 * Context for Cell configuration and utilities
 */
export const CellContext = createContext({
    ...defaultConfig,
    executeQuery: async () => {
        throw new Error('CellProvider not found. Wrap your app with <CellProvider>');
    },
    executeFetch: async () => {
        throw new Error('CellProvider not found. Wrap your app with <CellProvider>');
    },
    getCached: () => null,
    setCached: () => { },
    invalidate: () => { },
});
/**
 * SSR Context for server-side rendering
 */
export const CellSSRContext = createContext(null);
/**
 * Provider component for Cell configuration.
 *
 * @example
 * ```tsx
 * import { CellProvider } from 'philjs-cells';
 * import { createGraphQLClient } from 'philjs-graphql';
 *
 * const graphqlClient = createGraphQLClient({
 *   endpoint: '/graphql',
 * });
 *
 * function App() {
 *   return (
 *     <CellProvider graphqlClient={graphqlClient}>
 *       <MyApp />
 *     </CellProvider>
 *   );
 * }
 * ```
 */
export function CellProvider(props) {
    const { children, graphqlClient, fetch: customFetch, defaultCacheTTL = defaultConfig.defaultCacheTTL, retry = defaultConfig.retry, streaming = defaultConfig.streaming, onError, onSuccess, } = props;
    // Create context value
    const contextValue = {
        ...(defaultCacheTTL != null && { defaultCacheTTL }),
        ...(retry != null && { retry }),
        ...(streaming != null && { streaming }),
        ...(graphqlClient != null && { graphqlClient }),
        ...(customFetch != null && { fetch: customFetch }),
        ...(onError != null && { onError }),
        ...(onSuccess != null && { onSuccess }),
        executeQuery: async (query, variables) => {
            if (!graphqlClient) {
                throw new Error('No GraphQL client configured. Either pass a graphqlClient to CellProvider ' +
                    'or use the fetch option in your Cell definition.');
            }
            const result = await graphqlClient.query(query, variables);
            return result;
        },
        executeFetch: async (fetcher, variables) => {
            return fetcher(variables);
        },
        getCached: (key) => {
            const entry = cellCache.get(key);
            if (!entry)
                return null;
            if (cellCache.isStale(key))
                return null;
            return entry.data;
        },
        setCached: (key, data, ttl) => {
            cellCache.set(key, data, ttl ?? defaultCacheTTL);
        },
        invalidate: (pattern) => {
            cellCache.clear(pattern);
        },
    };
    return CellContext.Provider({
        value: contextValue,
        children,
    });
}
/**
 * Provider component for SSR support.
 * Tracks cell data for hydration on the client.
 *
 * @example
 * ```tsx
 * // Server-side
 * import { CellSSRProvider, serializeCellData } from 'philjs-cells';
 *
 * const html = await renderToString(
 *   <CellSSRProvider>
 *     <App />
 *   </CellSSRProvider>
 * );
 *
 * const cellData = serializeCellData();
 * // Inject cellData into HTML for hydration
 * ```
 */
export function CellSSRProvider(props) {
    const ssrContext = {
        cellData: new Map(),
        pendingCells: new Map(),
        markHydrated: (key) => {
            // No-op for now, tracking is implicit
        },
        isHydrated: (key) => {
            return ssrContext.cellData.has(key);
        },
        serialize: () => {
            const data = {};
            for (const [key, value] of ssrContext.cellData.entries()) {
                data[key] = value;
            }
            return JSON.stringify(data);
        },
        deserialize: (data) => {
            try {
                const parsed = JSON.parse(data);
                for (const [key, value] of Object.entries(parsed)) {
                    ssrContext.cellData.set(key, value);
                }
            }
            catch {
                console.warn('[CellSSRProvider] Failed to deserialize cell data');
            }
        },
    };
    return CellSSRContext.Provider({
        value: ssrContext,
        children: props.children,
    });
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to access Cell context configuration
 */
export function useCellContext() {
    return useContext(CellContext);
}
/**
 * Hook to access SSR context (returns null on client)
 */
export function useCellSSR() {
    return useContext(CellSSRContext);
}
/**
 * Hook to invalidate cell cache
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const invalidate = useCellInvalidate();
 *
 *   const handleUpdate = () => {
 *     // ... update user
 *     invalidate(/^user/); // Invalidate all user-related cells
 *   };
 * }
 * ```
 */
export function useCellInvalidate() {
    const context = useCellContext();
    return context.invalidate;
}
/**
 * Hook to prefetch cell data
 *
 * @example
 * ```tsx
 * function UsersList() {
 *   const prefetch = useCellPrefetch();
 *
 *   return (
 *     <ul>
 *       {users.map(user => (
 *         <li
 *           key={user.id}
 *           onMouseEnter={() => prefetch(UserCell, { id: user.id })}
 *         >
 *           {user.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useCellPrefetch() {
    const context = useCellContext();
    return async (cell, variables = {}) => {
        const def = cell.__cellDefinition;
        const cacheKey = generateCacheKey(def.QUERY || 'fetch', variables);
        // Skip if already cached
        if (context.getCached(cacheKey))
            return;
        try {
            let data;
            if (def.QUERY) {
                data = await context.executeQuery(def.QUERY, variables);
            }
            else if (typeof def.fetch === 'function') {
                data = await def.fetch(variables);
            }
            else {
                throw new Error('Cell must have either QUERY or fetch defined');
            }
            context.setCached(cacheKey, data);
        }
        catch (error) {
            // Silently fail prefetch - actual fetch will retry
            console.warn('[CellPrefetch] Failed to prefetch:', error);
        }
    };
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Generate a cache key from query/fetch and variables
 */
export function generateCacheKey(identifier, variables) {
    const varsStr = Object.keys(variables).length > 0
        ? ':' + JSON.stringify(variables, Object.keys(variables).sort())
        : '';
    // Create a simple hash of the identifier
    const idHash = simpleHash(identifier);
    return `cell:${idHash}${varsStr}`;
}
/**
 * Simple string hash function
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}
/**
 * Serialize cell data for SSR hydration
 */
export function serializeCellData(ssrContext) {
    return ssrContext.serialize();
}
/**
 * Hydrate cells from SSR data
 */
export function hydrateCells(data) {
    try {
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
            cellCache.set(key, value);
        }
    }
    catch {
        console.warn('[hydrateCells] Failed to hydrate cell data');
    }
}
/**
 * Script tag for injecting cell data into HTML
 */
export function getCellHydrationScript(ssrContext) {
    const data = serializeCellData(ssrContext);
    return `<script>window.__PHILJS_CELL_DATA__=${data};</script>`;
}
/**
 * Initialize cells from window data (call on client)
 */
export function initializeCellsFromWindow() {
    if (typeof window !== 'undefined' && window['__PHILJS_CELL_DATA__']) {
        const data = window['__PHILJS_CELL_DATA__'];
        if (typeof data === 'object' && data !== null) {
            for (const [key, value] of Object.entries(data)) {
                cellCache.set(key, value);
            }
        }
    }
}
//# sourceMappingURL=context.js.map