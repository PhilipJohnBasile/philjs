/**
 * PhilJS Cells - Core Cell Implementation
 *
 * RedwoodJS-style Cells pattern for declarative data loading.
 * Provides automatic loading, error, empty, and success states.
 */
import type { CellDefinition, CellComponent } from './types.js';
/**
 * Create a Cell component with declarative data loading states.
 *
 * @example
 * ```tsx
 * // Using GraphQL
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
 * // Using fetch
 * export const fetch = async ({ id }) => {
 *   const res = await fetch(`/api/users/${id}`);
 *   return res.json();
 * };
 *
 * export const Success = ({ user }) => <UserProfile user={user} />;
 *
 * export default createCell({ fetch, Success });
 * ```
 */
export declare function createCell<TData, TVariables = Record<string, unknown>>(definition: CellDefinition<TData, TVariables>): CellComponent<TData, TVariables>;
/**
 * Create a cell with automatic TypeScript inference from query
 */
export declare function createTypedCell<TData, TVariables = Record<string, unknown>>(): (definition: CellDefinition<TData, TVariables>) => CellComponent<TData, TVariables>;
/**
 * Compose multiple cells into a single component
 *
 * @example
 * ```tsx
 * const CombinedCell = composeCells({
 *   users: UsersCell,
 *   posts: PostsCell,
 * });
 *
 * // Usage
 * <CombinedCell
 *   Success={({ users, posts }) => (
 *     <Dashboard users={users} posts={posts} />
 *   )}
 * />
 * ```
 */
export declare function composeCells<T extends Record<string, CellComponent<unknown, unknown>>>(cells: T): CellComponent<{
    [K in keyof T]: T[K] extends CellComponent<infer D, unknown> ? D : never;
}, Record<string, unknown>>;
/**
 * Create a cell that depends on another cell's data
 *
 * @example
 * ```tsx
 * const UserPostsCell = createDependentCell(UserCell, {
 *   fetch: async ({ user }) => {
 *     const res = await fetch(`/api/users/${user.id}/posts`);
 *     return res.json();
 *   },
 *   Success: ({ posts }) => <PostsList posts={posts} />,
 * });
 * ```
 */
export declare function createDependentCell<TParentData, TData, TVariables = Record<string, unknown>>(parentCell: CellComponent<TParentData, unknown>, definition: Omit<CellDefinition<TData, TParentData & TVariables>, 'QUERY'>): CellComponent<TData, TVariables>;
/**
 * Create a cell with retry configuration
 */
export declare function createCellWithRetry<TData, TVariables = Record<string, unknown>>(definition: CellDefinition<TData, TVariables>, retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error, attemptNumber: number) => boolean;
}): CellComponent<TData, TVariables>;
//# sourceMappingURL=cell.d.ts.map