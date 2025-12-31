/**
 * PhilJS Cells - Core Cell Implementation
 *
 * RedwoodJS-style Cells pattern for declarative data loading.
 * Provides automatic loading, error, empty, and success states.
 */
import { signal, memo, effect, batch, createElement, } from 'philjs-core';
import { defaultIsEmpty } from './types.js';
import { useCellContext, generateCacheKey } from './context.js';
import { cellCache } from './cache.js';
// ============================================================================
// Default Components
// ============================================================================
/**
 * Default Loading component
 */
function DefaultLoading(props) {
    return createElement('div', {
        'aria-busy': 'true',
        'aria-live': 'polite',
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        },
    }, createElement('div', {
        style: {
            width: '24px',
            height: '24px',
            border: '3px solid #e0e0e0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
        },
    }), createElement('style', {}, `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `));
}
/**
 * Default Empty component
 */
function DefaultEmpty(props) {
    return createElement('div', {
        style: {
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
        },
    }, createElement('p', {}, 'No data found'));
}
/**
 * Default Failure component
 */
function DefaultFailure(props) {
    return createElement('div', {
        role: 'alert',
        style: {
            padding: '1rem',
            background: '#fee',
            border: '1px solid #c33',
            borderRadius: '4px',
            color: '#c33',
        },
    }, createElement('p', { style: { fontWeight: 'bold', marginBottom: '0.5rem' } }, 'Error loading data'), createElement('p', { style: { marginBottom: '1rem' } }, props.error.message), createElement('button', {
        onClick: props.retry,
        disabled: props.isRetrying,
        style: {
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: props.isRetrying ? 'not-allowed' : 'pointer',
            opacity: props.isRetrying ? 0.7 : 1,
        },
    }, props.isRetrying ? 'Retrying...' : 'Retry'), props.retryCount > 0 && createElement('span', {
        style: { marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' },
    }, `(Attempt ${props.retryCount + 1})`));
}
// ============================================================================
// createCell Function
// ============================================================================
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
export function createCell(definition) {
    const { QUERY, fetch: fetchFn, afterQuery, isEmpty = defaultIsEmpty, Loading = DefaultLoading, Empty = DefaultEmpty, Failure = DefaultFailure, Success, displayName = 'Cell', } = definition;
    // Validate definition
    if (!QUERY && !fetchFn) {
        throw new Error(`Cell "${displayName}" must have either QUERY or fetch defined`);
    }
    if (QUERY && fetchFn) {
        throw new Error(`Cell "${displayName}" cannot have both QUERY and fetch defined`);
    }
    if (!Success) {
        throw new Error(`Cell "${displayName}" must have a Success component defined`);
    }
    /**
     * The Cell component
     */
    function Cell(props) {
        // Extract cell props from variables
        const { cacheKey: customCacheKey, noCache = false, pollInterval, onSuccess: onSuccessCallback, onError: onErrorCallback, ...variables } = props;
        // Get context
        const context = useCellContext();
        // Generate cache key
        const cacheKey = customCacheKey || generateCacheKey(QUERY || displayName, variables);
        // Create reactive state
        const state = createReactiveCellState();
        // Check cache first
        const cachedData = !noCache ? context.getCached(cacheKey) : null;
        if (cachedData !== null) {
            state.data.set(cachedData);
            state.status.set('success');
        }
        // Fetch function
        const fetchData = async () => {
            // Don't refetch if already loading
            if (state.status() === 'loading' && !state.isRefetching()) {
                return;
            }
            // Set loading state
            if (state.data() === null) {
                state.status.set('loading');
            }
            else {
                state.isRefetching.set(true);
            }
            state.attempts.set(state.attempts() + 1);
            try {
                let data;
                if (QUERY) {
                    // GraphQL query
                    const result = await context.executeQuery(QUERY, variables);
                    if (result.errors && result.errors.length > 0) {
                        throw new Error(result.errors[0]?.message ?? 'GraphQL error');
                    }
                    data = result.data;
                }
                else if (fetchFn) {
                    // Custom fetch
                    data = await fetchFn(variables);
                }
                else {
                    throw new Error('No fetch method defined');
                }
                // Apply afterQuery transformation
                if (afterQuery) {
                    data = afterQuery(data);
                }
                // Update cache
                if (!noCache) {
                    context.setCached(cacheKey, data);
                }
                // Update state
                batch(() => {
                    state.data.set(data);
                    state.error.set(null);
                    state.status.set(isEmpty(data) ? 'empty' : 'success');
                    state.isRefetching.set(false);
                });
                // Callbacks
                onSuccessCallback?.(data);
                context.onSuccess?.(data, displayName);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                batch(() => {
                    state.error.set(err);
                    state.status.set('error');
                    state.isRefetching.set(false);
                });
                // Callbacks
                onErrorCallback?.(err);
                context.onError?.(err, displayName);
            }
        };
        // Initial fetch if not cached
        if (cachedData === null) {
            fetchData();
        }
        // Set up polling
        if (pollInterval && pollInterval > 0) {
            effect(() => {
                const interval = setInterval(fetchData, pollInterval);
                return () => clearInterval(interval);
            });
        }
        // Retry function
        const retry = () => {
            state.attempts.set(0);
            fetchData();
        };
        // Refetch function (passed to Success)
        const refetch = async () => {
            await fetchData();
        };
        // Render based on state
        return createCellRenderer(state, {
            Loading,
            Empty,
            Failure,
            Success,
        }, {
            retry,
            refetch,
            variables: variables,
        });
    }
    // Set display name
    Cell.displayName = displayName;
    Cell.__cellDefinition = definition;
    return Cell;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Create reactive cell state
 */
function createReactiveCellState() {
    const status = signal('loading');
    const data = signal(null);
    const error = signal(null);
    const attempts = signal(0);
    const isRefetching = signal(false);
    return {
        status,
        data,
        error,
        attempts,
        isRefetching,
        isLoading: memo(() => status() === 'loading'),
        isSuccess: memo(() => status() === 'success'),
        isError: memo(() => status() === 'error'),
        isEmpty: memo(() => status() === 'empty'),
    };
}
/**
 * Create the cell renderer based on state
 */
function createCellRenderer(state, components, context) {
    // Use memo to reactively compute the rendered component
    const currentStatus = state.status();
    switch (currentStatus) {
        case 'loading':
            return components.Loading({
                attempts: state.attempts(),
            });
        case 'empty':
            return components.Empty({
                variables: context.variables,
            });
        case 'error':
            return components.Failure({
                error: state.error(),
                retryCount: state.attempts(),
                retry: context.retry,
                isRetrying: state.isRefetching(),
            });
        case 'success':
            const data = state.data();
            if (data === null) {
                return components.Loading({ attempts: state.attempts() });
            }
            // Spread data and add refetch
            const successProps = {
                ...data,
                refetch: context.refetch,
                isRefetching: state.isRefetching(),
            };
            return components.Success(successProps);
        default:
            return components.Loading({ attempts: 0 });
    }
}
// ============================================================================
// Cell Utilities
// ============================================================================
/**
 * Create a cell with automatic TypeScript inference from query
 */
export function createTypedCell() {
    return function (definition) {
        return createCell(definition);
    };
}
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
export function composeCells(cells) {
    const cellNames = Object.keys(cells);
    const ComposedCell = createCell({
        fetch: async (variables) => {
            const results = {};
            // Fetch all cells in parallel
            await Promise.all(cellNames.map(async (name) => {
                const cell = cells[name];
                if (!cell)
                    return;
                const def = cell.__cellDefinition;
                if (def.QUERY) {
                    // This would need access to GraphQL client
                    throw new Error('composeCells with GraphQL queries not yet supported');
                }
                else if (def.fetch) {
                    results[name] = await def.fetch(variables);
                }
            }));
            return results;
        },
        Success: (props) => {
            // Default success just returns the data as-is
            return null;
        },
        displayName: `Composed(${cellNames.join(', ')})`,
    });
    return ComposedCell;
}
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
export function createDependentCell(parentCell, definition) {
    const { fetch: fetchFn, Success, ...rest } = definition;
    if (!fetchFn) {
        throw new Error('Dependent cells must have a fetch function');
    }
    return createCell({
        ...rest,
        fetch: fetchFn,
        Success,
        displayName: `Dependent(${parentCell.displayName || 'Cell'})`,
    });
}
/**
 * Create a cell with retry configuration
 */
export function createCellWithRetry(definition, retryConfig = {}) {
    const { maxRetries = 3, retryDelay = 1000, backoffMultiplier = 2, shouldRetry = () => true, } = retryConfig;
    const { fetch: originalFetch, ...rest } = definition;
    if (!originalFetch) {
        return createCell(definition);
    }
    const fetchWithRetry = async (variables) => {
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await originalFetch(variables);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
                    const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw lastError;
                }
            }
        }
        throw lastError;
    };
    return createCell({
        ...rest,
        fetch: fetchWithRetry,
    });
}
//# sourceMappingURL=cell.js.map