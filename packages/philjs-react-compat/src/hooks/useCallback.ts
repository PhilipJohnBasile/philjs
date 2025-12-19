/**
 * React useCallback compatibility wrapper for PhilJS.
 * In PhilJS, useCallback is typically unnecessary due to fine-grained reactivity,
 * but this wrapper is provided for easier migration from React.
 */

import { memo } from 'philjs-core';

/**
 * React-compatible useCallback hook.
 * Unlike React, this is mostly unnecessary in PhilJS since functions don't cause re-renders.
 * However, it's provided for compatibility during migration.
 *
 * @example
 * ```tsx
 * function TodoList({ onAdd }) {
 *   const [items, setItems] = useState([]);
 *
 *   // In React, this prevents child re-renders
 *   // In PhilJS, it's not needed but works for compatibility
 *   const handleAdd = useCallback((text) => {
 *     setItems([...items, { id: Date.now(), text }]);
 *   }, [items]);
 *
 *   return (
 *     <div>
 *       <TodoInput onAdd={handleAdd} />
 *       <TodoItems items={items} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @param fn - Callback function
 * @param deps - Dependency array (ignored, kept for React compatibility)
 *
 * Note: In PhilJS, functions are stable and don't cause re-renders.
 * This hook is provided for compatibility but is essentially a no-op.
 */
export function useCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps?: any[]
): T {
  // Warn in development that this is unnecessary in PhilJS
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useCallback is unnecessary in PhilJS. ' +
      'Functions are stable and don\'t cause re-renders. ' +
      'You can safely remove useCallback and use the function directly.'
    );
  }

  // Just return the function as-is
  // PhilJS doesn't need memoization for callbacks
  return fn;
}

/**
 * Hook to create a memoized event handler.
 * This is more for documentation purposes in PhilJS - the function is stable anyway.
 *
 * @example
 * ```tsx
 * function Form() {
 *   const [value, setValue] = useState('');
 *
 *   const handleSubmit = useEventHandler((e) => {
 *     e.preventDefault();
 *     console.log('Submitted:', value);
 *   });
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useEventHandler<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T {
  return useCallback(fn, deps);
}

/**
 * Hook to create a stable function reference with the latest closure values.
 * This solves the "stale closure" problem without dependency arrays.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const [count, setCount] = useState(0);
 *
 *   // Always uses the latest count value
 *   const handleClick = useLatestCallback(() => {
 *     console.log('Current count:', count);
 *   });
 *
 *   return <button onClick={handleClick}>Log Count</button>;
 * }
 * ```
 */
export function useLatestCallback<T extends (...args: any[]) => any>(fn: T): T {
  // In PhilJS, closures don't go stale because signals are always current
  // Just return the function
  return fn;
}

/**
 * Hook to create a debounced callback.
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *
 *   const debouncedSearch = useDebouncedCallback((value) => {
 *     // Perform search
 *     fetch(`/api/search?q=${value}`);
 *   }, 500);
 *
 *   return (
 *     <input
 *       value={query}
 *       onChange={(e) => {
 *         setQuery(e.target.value);
 *         debouncedSearch(e.target.value);
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps?: any[]
): T {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useDebouncedCallback dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies.'
    );
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;

  return debouncedFn;
}

/**
 * Hook to create a throttled callback.
 *
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const handleScroll = useThrottledCallback((e) => {
 *     console.log('Scroll position:', window.scrollY);
 *   }, 200);
 *
 *   return <div onScroll={handleScroll}>...</div>;
 * }
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps?: any[]
): T {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useThrottledCallback dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies.'
    );
  }

  let lastCall = 0;

  const throttledFn = ((...args: any[]) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;

  return throttledFn;
}
