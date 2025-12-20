/**
 * PhilJS Cells
 *
 * RedwoodJS-style Cells pattern for PhilJS.
 * Declarative data loading components with built-in loading, error, empty, and success states.
 *
 * @example
 * ```tsx
 * // cells/UsersCell.tsx
 * import { createCell } from 'philjs-cells';
 *
 * export const QUERY = `
 *   query Users {
 *     users { id, name, email }
 *   }
 * `;
 *
 * export const Loading = () => <Spinner />;
 * export const Empty = () => <p>No users found</p>;
 * export const Failure = ({ error }) => <Error message={error.message} />;
 * export const Success = ({ users }) => (
 *   <ul>
 *     {users.map(user => <li key={user.id}>{user.name}</li>)}
 *   </ul>
 * );
 *
 * export default createCell({ QUERY, Loading, Empty, Failure, Success });
 * ```
 *
 * @example
 * ```tsx
 * // Using fetch instead of GraphQL
 * import { createCell } from 'philjs-cells';
 *
 * export const fetch = async () => {
 *   const res = await fetch('/api/users');
 *   return res.json();
 * };
 *
 * export const Success = ({ users }) => <UsersList users={users} />;
 *
 * export default createCell({ fetch, Success });
 * ```
 *
 * @example
 * ```tsx
 * // Usage in components
 * import UsersCell from './cells/UsersCell';
 *
 * function UsersPage() {
 *   return (
 *     <div>
 *       <h1>Users</h1>
 *       <UsersCell />
 *     </div>
 *   );
 * }
 *
 * // With variables
 * <UserCell id="123" />
 * ```
 *
 * @packageDocumentation
 */

// Core Cell creation
export {
  createCell,
  createTypedCell,
  composeCells,
  createDependentCell,
  createCellWithRetry,
} from './cell.js';

// Context and Provider
export {
  CellProvider,
  CellSSRProvider,
  useCellContext,
  useCellSSR,
  useCellInvalidate,
  useCellPrefetch,
  generateCacheKey,
  serializeCellData,
  hydrateCells,
  getCellHydrationScript,
  initializeCellsFromWindow,
} from './context.js';

// Cache
export {
  cellCache,
  createScopedCache,
  warmCache,
  createCellCacheKey,
  batchInvalidate,
  setupCacheGC,
  inspectCache,
  logCacheStats,
  type CacheStats,
} from './cache.js';

// Types
export type {
  CellFetcher,
  CellQuery,
  LoadingProps,
  EmptyProps,
  FailureProps,
  SuccessProps,
  CellStateComponents,
  CellDefinition,
  CellProps,
  CellComponent,
  CellState,
  ReactiveCellState,
  CellProviderConfig,
  CellContextValue,
  CellCacheEntry,
  CellCache,
  CellSSRContext,
  CellDataType,
  CellVariablesType,
  PartialExcept,
  GraphQLResult,
  EmptyCheckFn,
} from './types.js';

export { defaultIsEmpty } from './types.js';
