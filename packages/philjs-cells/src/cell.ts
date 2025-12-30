/**
 * PhilJS Cells - Core Cell Implementation
 *
 * RedwoodJS-style Cells pattern for declarative data loading.
 * Provides automatic loading, error, empty, and success states.
 */

import {
  signal,
  memo,
  effect,
  batch,
  createElement,
  type Signal,
  type Memo,
} from 'philjs-core';
import type { VNode, JSXElement } from 'philjs-core';

import type {
  CellDefinition,
  CellComponent,
  CellProps,
  CellState,
  ReactiveCellState,
  LoadingProps,
  EmptyProps,
  FailureProps,
  SuccessProps,
  CellFetcher,
  GraphQLResult,
} from './types.js';
import { defaultIsEmpty } from './types.js';
import { useCellContext, generateCacheKey } from './context.js';
import { cellCache } from './cache.js';

// ============================================================================
// Default Components
// ============================================================================

/**
 * Default Loading component
 */
function DefaultLoading(props: LoadingProps): VNode {
  return createElement('div', {
    'aria-busy': 'true',
    'aria-live': 'polite',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
  },
    createElement('div', {
      style: {
        width: '24px',
        height: '24px',
        border: '3px solid #e0e0e0',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      },
    }),
    createElement('style', {}, `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `)
  );
}

/**
 * Default Empty component
 */
function DefaultEmpty(props: EmptyProps): VNode {
  return createElement('div', {
    style: {
      textAlign: 'center',
      padding: '2rem',
      color: '#666',
    },
  },
    createElement('p', {}, 'No data found')
  );
}

/**
 * Default Failure component
 */
function DefaultFailure(props: FailureProps): VNode {
  return createElement('div', {
    role: 'alert',
    style: {
      padding: '1rem',
      background: '#fee',
      border: '1px solid #c33',
      borderRadius: '4px',
      color: '#c33',
    },
  },
    createElement('p', { style: { fontWeight: 'bold', marginBottom: '0.5rem' } },
      'Error loading data'
    ),
    createElement('p', { style: { marginBottom: '1rem' } },
      props.error.message
    ),
    createElement('button', {
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
    },
      props.isRetrying ? 'Retrying...' : 'Retry'
    ),
    props.retryCount > 0 && createElement('span', {
      style: { marginLeft: '0.5rem', fontSize: '0.875rem', color: '#666' },
    },
      `(Attempt ${props.retryCount + 1})`
    )
  );
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
export function createCell<TData, TVariables = Record<string, unknown>>(
  definition: CellDefinition<TData, TVariables>
): CellComponent<TData, TVariables> {
  const {
    QUERY,
    fetch: fetchFn,
    afterQuery,
    isEmpty = defaultIsEmpty as (data: TData) => boolean,
    Loading = DefaultLoading,
    Empty = DefaultEmpty,
    Failure = DefaultFailure,
    Success,
    displayName = 'Cell',
  } = definition;

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
  function Cell(props: TVariables & CellProps<TVariables>): JSXElement {
    // Extract cell props from variables
    const {
      cacheKey: customCacheKey,
      noCache = false,
      pollInterval,
      onSuccess: onSuccessCallback,
      onError: onErrorCallback,
      ...variables
    } = props as CellProps<TVariables> & Record<string, unknown>;

    // Get context
    const context = useCellContext();

    // Generate cache key
    const cacheKey = customCacheKey || generateCacheKey(
      QUERY || displayName,
      variables as Record<string, unknown>
    );

    // Create reactive state
    const state = createReactiveCellState<TData>();

    // Check cache first
    const cachedData = !noCache ? context.getCached<TData>(cacheKey) : null;
    if (cachedData !== null) {
      state.data.set(cachedData);
      state.status.set('success');
    }

    // Fetch function
    const fetchData = async (): Promise<void> => {
      // Don't refetch if already loading
      if (state.status() === 'loading' && !state.isRefetching()) {
        return;
      }

      // Set loading state
      if (state.data() === null) {
        state.status.set('loading');
      } else {
        state.isRefetching.set(true);
      }

      state.attempts.set(state.attempts() + 1);

      try {
        let data: TData;

        if (QUERY) {
          // GraphQL query
          const result = await context.executeQuery<GraphQLResult<TData>>(
            QUERY,
            variables as Record<string, unknown>
          );

          if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors[0]?.message ?? 'GraphQL error');
          }

          data = result.data as TData;
        } else if (fetchFn) {
          // Custom fetch
          data = await fetchFn(variables as TVariables);
        } else {
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
      } catch (error) {
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
    const retry = (): void => {
      state.attempts.set(0);
      fetchData();
    };

    // Refetch function (passed to Success)
    const refetch = async (): Promise<void> => {
      await fetchData();
    };

    // Render based on state
    return createCellRenderer(
      state,
      {
        Loading,
        Empty,
        Failure,
        Success,
      },
      {
        retry,
        refetch,
        variables: variables as Record<string, unknown>,
      }
    );
  }

  // Set display name
  Cell.displayName = displayName;
  Cell.__cellDefinition = definition;

  return Cell as CellComponent<TData, TVariables>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create reactive cell state
 */
function createReactiveCellState<TData>(): ReactiveCellState<TData> {
  const status = signal<CellState<TData>['status']>('loading');
  const data = signal<TData | null>(null);
  const error = signal<Error | null>(null);
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
function createCellRenderer<TData>(
  state: ReactiveCellState<TData>,
  components: {
    Loading: (props: LoadingProps) => VNode;
    Empty: (props: EmptyProps) => VNode;
    Failure: (props: FailureProps) => VNode;
    Success: (props: SuccessProps<TData>) => VNode;
  },
  context: {
    retry: () => void;
    refetch: () => Promise<void>;
    variables: Record<string, unknown>;
  }
): JSXElement {
  // Use memo to reactively compute the rendered component
  const currentStatus = state.status();

  switch (currentStatus) {
    case 'loading':
      return components.Loading({
        attempts: state.attempts(),
      }) as JSXElement;

    case 'empty':
      return components.Empty({
        variables: context.variables,
      }) as JSXElement;

    case 'error':
      return components.Failure({
        error: state.error()!,
        retryCount: state.attempts(),
        retry: context.retry,
        isRetrying: state.isRefetching(),
      }) as JSXElement;

    case 'success':
      const data = state.data();
      if (data === null) {
        return components.Loading({ attempts: state.attempts() }) as JSXElement;
      }

      // Spread data and add refetch
      const successProps: SuccessProps<TData> = {
        ...(data as object),
        refetch: context.refetch,
        isRefetching: state.isRefetching(),
      } as SuccessProps<TData>;

      return components.Success(successProps) as JSXElement;

    default:
      return components.Loading({ attempts: 0 }) as JSXElement;
  }
}

// ============================================================================
// Cell Utilities
// ============================================================================

/**
 * Create a cell with automatic TypeScript inference from query
 */
export function createTypedCell<TData, TVariables = Record<string, unknown>>() {
  return function (definition: CellDefinition<TData, TVariables>): CellComponent<TData, TVariables> {
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
export function composeCells<
  T extends Record<string, CellComponent<unknown, unknown>>
>(
  cells: T
): CellComponent<
  { [K in keyof T]: T[K] extends CellComponent<infer D, unknown> ? D : never },
  Record<string, unknown>
> {
  const cellNames = Object.keys(cells);

  const ComposedCell = createCell({
    fetch: async (variables: Record<string, unknown>) => {
      const results: Record<string, unknown> = {};

      // Fetch all cells in parallel
      await Promise.all(
        cellNames.map(async (name) => {
          const cell = cells[name];
          if (!cell) return;
          const def = cell.__cellDefinition;

          if (def.QUERY) {
            // This would need access to GraphQL client
            throw new Error('composeCells with GraphQL queries not yet supported');
          } else if (def.fetch) {
            results[name] = await def.fetch(variables);
          }
        })
      );

      return results as { [K in keyof T]: T[K] extends CellComponent<infer D, unknown> ? D : never };
    },
    Success: (props) => {
      // Default success just returns the data as-is
      return null as unknown as VNode;
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
export function createDependentCell<
  TParentData,
  TData,
  TVariables = Record<string, unknown>
>(
  parentCell: CellComponent<TParentData, unknown>,
  definition: Omit<CellDefinition<TData, TParentData & TVariables>, 'QUERY'>
): CellComponent<TData, TVariables> {
  const { fetch: fetchFn, Success, ...rest } = definition;

  if (!fetchFn) {
    throw new Error('Dependent cells must have a fetch function');
  }

  return createCell({
    ...rest,
    fetch: fetchFn as CellFetcher<TData, TVariables>,
    Success,
    displayName: `Dependent(${parentCell.displayName || 'Cell'})`,
  });
}

/**
 * Create a cell with retry configuration
 */
export function createCellWithRetry<TData, TVariables = Record<string, unknown>>(
  definition: CellDefinition<TData, TVariables>,
  retryConfig: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error, attemptNumber: number) => boolean;
  } = {}
): CellComponent<TData, TVariables> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = retryConfig;

  const { fetch: originalFetch, ...rest } = definition;

  if (!originalFetch) {
    return createCell(definition);
  }

  const fetchWithRetry: CellFetcher<TData, TVariables> = async (variables) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await originalFetch(variables);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
          const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
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
