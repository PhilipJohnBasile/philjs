/**
 * PhilJS Cells - Context Provider
 *
 * Provides global configuration for Cells including GraphQL client,
 * caching, and SSR support.
 */

import { createContext, useContext } from 'philjs-core';
import type { VNode } from 'philjs-core';
import type {
  CellProviderConfig,
  CellContextValue,
  CellFetcher,
  CellSSRContext as CellSSRContextType,
} from './types.js';
import { cellCache } from './cache.js';

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: CellProviderConfig = {
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
export const CellContext = createContext<CellContextValue>({
  ...defaultConfig,
  executeQuery: async () => {
    throw new Error('CellProvider not found. Wrap your app with <CellProvider>');
  },
  executeFetch: async () => {
    throw new Error('CellProvider not found. Wrap your app with <CellProvider>');
  },
  getCached: () => null,
  setCached: () => {},
  invalidate: () => {},
});

/**
 * SSR Context for server-side rendering
 */
export const CellSSRContext = createContext<CellSSRContextType | null>(null);

// ============================================================================
// Cell Provider Component
// ============================================================================

export interface CellProviderProps extends CellProviderConfig {
  children: VNode;
}

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
export function CellProvider(props: CellProviderProps) {
  const {
    children,
    graphqlClient,
    fetch: customFetch,
    defaultCacheTTL = defaultConfig.defaultCacheTTL,
    retry = defaultConfig.retry,
    streaming = defaultConfig.streaming,
    onError,
    onSuccess,
  } = props;

  // Create context value
  const contextValue: CellContextValue = {
    ...(defaultCacheTTL != null && { defaultCacheTTL }),
    ...(retry != null && { retry }),
    ...(streaming != null && { streaming }),
    ...(graphqlClient != null && { graphqlClient }),
    ...(customFetch != null && { fetch: customFetch }),
    ...(onError != null && { onError }),
    ...(onSuccess != null && { onSuccess }),

    executeQuery: async <T,>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      if (!graphqlClient) {
        throw new Error(
          'No GraphQL client configured. Either pass a graphqlClient to CellProvider ' +
          'or use the fetch option in your Cell definition.'
        );
      }

      const result = await graphqlClient.query(query, variables);
      return result as T;
    },

    executeFetch: async <T,>(
      fetcher: CellFetcher<T, Record<string, unknown>>,
      variables: Record<string, unknown>
    ): Promise<T> => {
      return fetcher(variables);
    },

    getCached: <T,>(key: string): T | null => {
      const entry = cellCache.get<T>(key);
      if (!entry) return null;
      if (cellCache.isStale(key)) return null;
      return entry.data;
    },

    setCached: <T,>(key: string, data: T, ttl?: number): void => {
      cellCache.set(key, data, ttl ?? defaultCacheTTL);
    },

    invalidate: (pattern: string | RegExp): void => {
      cellCache.clear(pattern);
    },
  };

  return CellContext.Provider({
    value: contextValue,
    children,
  });
}

// ============================================================================
// SSR Provider Component
// ============================================================================

export interface CellSSRProviderProps {
  children: VNode;
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
export function CellSSRProvider(props: CellSSRProviderProps) {
  const ssrContext: CellSSRContextType = {
    cellData: new Map(),
    pendingCells: new Map(),
    markHydrated: (key: string) => {
      // No-op for now, tracking is implicit
    },
    isHydrated: (key: string) => {
      return ssrContext.cellData.has(key);
    },
    serialize: () => {
      const data: Record<string, unknown> = {};
      for (const [key, value] of ssrContext.cellData.entries()) {
        data[key] = value;
      }
      return JSON.stringify(data);
    },
    deserialize: (data: string) => {
      try {
        const parsed = JSON.parse(data);
        for (const [key, value] of Object.entries(parsed)) {
          ssrContext.cellData.set(key, value);
        }
      } catch {
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
export function useCellContext(): CellContextValue {
  return useContext(CellContext);
}

/**
 * Hook to access SSR context (returns null on client)
 */
export function useCellSSR(): CellSSRContextType | null {
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
export function useCellInvalidate(): (pattern: string | RegExp) => void {
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

  return async <T,>(
    cell: { __cellDefinition: { QUERY?: string; fetch?: unknown } },
    variables: Record<string, unknown> = {}
  ): Promise<void> => {
    const def = cell.__cellDefinition;
    const cacheKey = generateCacheKey(def.QUERY || 'fetch', variables);

    // Skip if already cached
    if (context.getCached(cacheKey)) return;

    try {
      let data: T;
      if (def.QUERY) {
        data = await context.executeQuery<T>(def.QUERY, variables);
      } else if (typeof def.fetch === 'function') {
        data = await (def.fetch as (vars: Record<string, unknown>) => Promise<T>)(variables);
      } else {
        throw new Error('Cell must have either QUERY or fetch defined');
      }

      context.setCached(cacheKey, data);
    } catch (error) {
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
export function generateCacheKey(
  identifier: string,
  variables: Record<string, unknown>
): string {
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
function simpleHash(str: string): string {
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
export function serializeCellData(ssrContext: CellSSRContextType): string {
  return ssrContext.serialize();
}

/**
 * Hydrate cells from SSR data
 */
export function hydrateCells(data: string): void {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    for (const [key, value] of Object.entries(parsed)) {
      cellCache.set(key, value);
    }
  } catch {
    console.warn('[hydrateCells] Failed to hydrate cell data');
  }
}

/**
 * Script tag for injecting cell data into HTML
 */
export function getCellHydrationScript(ssrContext: CellSSRContextType): string {
  const data = serializeCellData(ssrContext);
  return `<script>window.__PHILJS_CELL_DATA__=${data};</script>`;
}

/**
 * Initialize cells from window data (call on client)
 */
export function initializeCellsFromWindow(): void {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>)['__PHILJS_CELL_DATA__']) {
    const data = (window as unknown as Record<string, unknown>)['__PHILJS_CELL_DATA__'];
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        cellCache.set(key, value);
      }
    }
  }
}
