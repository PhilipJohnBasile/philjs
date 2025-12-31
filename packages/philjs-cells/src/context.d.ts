/**
 * PhilJS Cells - Context Provider
 *
 * Provides global configuration for Cells including GraphQL client,
 * caching, and SSR support.
 */
import type { VNode } from 'philjs-core';
import type { CellProviderConfig, CellContextValue, CellSSRContext as CellSSRContextType } from './types.js';
/**
 * Context for Cell configuration and utilities
 */
export declare const CellContext: any;
/**
 * SSR Context for server-side rendering
 */
export declare const CellSSRContext: any;
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
export declare function CellProvider(props: CellProviderProps): any;
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
export declare function CellSSRProvider(props: CellSSRProviderProps): any;
/**
 * Hook to access Cell context configuration
 */
export declare function useCellContext(): CellContextValue;
/**
 * Hook to access SSR context (returns null on client)
 */
export declare function useCellSSR(): CellSSRContextType | null;
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
export declare function useCellInvalidate(): (pattern: string | RegExp) => void;
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
export declare function useCellPrefetch(): <T>(cell: {
    __cellDefinition: {
        QUERY?: string;
        fetch?: unknown;
    };
}, variables?: Record<string, unknown>) => Promise<void>;
/**
 * Generate a cache key from query/fetch and variables
 */
export declare function generateCacheKey(identifier: string, variables: Record<string, unknown>): string;
/**
 * Serialize cell data for SSR hydration
 */
export declare function serializeCellData(ssrContext: CellSSRContextType): string;
/**
 * Hydrate cells from SSR data
 */
export declare function hydrateCells(data: string): void;
/**
 * Script tag for injecting cell data into HTML
 */
export declare function getCellHydrationScript(ssrContext: CellSSRContextType): string;
/**
 * Initialize cells from window data (call on client)
 */
export declare function initializeCellsFromWindow(): void;
//# sourceMappingURL=context.d.ts.map