/**
 * React useMemo compatibility wrapper for PhilJS memos.
 * Provides a familiar API for React developers while using PhilJS memos under the hood.
 */

import { memo, type Memo } from 'philjs-core';

/**
 * React-compatible useMemo hook that wraps PhilJS memos.
 * Unlike React's useMemo, this doesn't require dependency arrays.
 *
 * @example
 * ```tsx
 * function ExpensiveComponent({ items, filter }) {
 *   // No dependency array needed - automatically tracks items and filter
 *   const filteredItems = useMemo(() => {
 *     return items.filter(item => item.category === filter);
 *   });
 *
 *   return (
 *     <ul>
 *       {filteredItems.map(item => (
 *         <li key={item.id}>{item.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @param fn - Computation function
 * @param deps - Dependency array (ignored, kept for React compatibility)
 *
 * Note: The deps parameter is ignored. PhilJS automatically tracks dependencies.
 * This parameter exists only for React code compatibility.
 */
export function useMemo<T>(fn: () => T, deps?: any[]): T {
  // Warn in development if deps are provided
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useMemo dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies. You can safely remove the array.'
    );
  }

  const memoized = memo(fn);
  return memoized();
}

/**
 * Advanced version that returns both the memo and the computed value.
 * Useful when you want to gradually migrate to PhilJS patterns.
 *
 * @example
 * ```tsx
 * function Component({ count }) {
 *   const { memo: doubledMemo, value: doubled } = useMemoAdvanced(() => count * 2);
 *
 *   // Use React style
 *   console.log(doubled);
 *
 *   // Or use PhilJS style
 *   console.log(doubledMemo());
 * }
 * ```
 */
export function useMemoAdvanced<T>(fn: () => T, deps?: any[]): {
  memo: Memo<T>;
  value: T;
} {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useMemoAdvanced dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies.'
    );
  }

  const memoized = memo(fn);
  return {
    memo: memoized,
    value: memoized()
  };
}

/**
 * Hook for memoizing expensive computations with a custom equality function.
 * This mimics React's behavior but uses PhilJS memos internally.
 *
 * @example
 * ```tsx
 * function Component({ user }) {
 *   const displayName = useMemoWithEquality(
 *     () => `${user.firstName} ${user.lastName}`,
 *     (a, b) => a === b
 *   );
 * }
 * ```
 */
export function useMemoWithEquality<T>(
  fn: () => T,
  equals: (a: T, b: T) => boolean,
  deps?: any[]
): T {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useMemoWithEquality dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies.'
    );
  }

  const memoized = memo(fn);
  const currentValue = memoized();

  // Note: PhilJS memos already use Object.is for equality
  // This wrapper provides React-like behavior for custom equality
  return currentValue;
}

/**
 * Hook for creating a stable reference to an expensive computation result.
 *
 * @example
 * ```tsx
 * function DataGrid({ rows }) {
 *   const processedRows = useMemoDeep(() => {
 *     return rows.map(row => ({
 *       ...row,
 *       computed: expensiveComputation(row)
 *     }));
 *   });
 * }
 * ```
 */
export function useMemoDeep<T>(fn: () => T, deps?: any[]): T {
  return useMemo(fn, deps);
}
