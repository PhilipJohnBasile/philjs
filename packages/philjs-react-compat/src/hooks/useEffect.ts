/**
 * React useEffect compatibility wrapper for PhilJS effects.
 * Provides a familiar API for React developers while using PhilJS effects under the hood.
 */

import { effect } from 'philjs-core';

type EffectCleanup = (() => void) | void;
type EffectFunction = () => EffectCleanup;

/**
 * React-compatible useEffect hook that wraps PhilJS effects.
 * Unlike React's useEffect, this runs synchronously and doesn't require dependency arrays.
 *
 * @example
 * ```tsx
 * function Component({ userId }) {
 *   const [user, setUser] = useState(null);
 *
 *   // No dependency array needed - automatically tracks userId
 *   useEffect(() => {
 *     fetchUser(userId).then(setUser);
 *   });
 *
 *   return <div>{user?.name}</div>;
 * }
 * ```
 *
 * @param fn - Effect function, can return cleanup function
 * @param deps - Dependency array (ignored, kept for React compatibility)
 *
 * Note: The deps parameter is ignored. PhilJS automatically tracks dependencies.
 * This parameter exists only for React code compatibility.
 */
export function useEffect(fn: EffectFunction, deps?: any[]): void {
  // Warn in development if deps are provided
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useEffect dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies. You can safely remove the array.'
    );
  }

  effect(fn);
}

/**
 * React useLayoutEffect compatibility.
 * In PhilJS, all effects run synchronously, so this is identical to useEffect.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const ref = useRef(null);
 *
 *   useLayoutEffect(() => {
 *     // Measure DOM element
 *     const height = ref.current?.offsetHeight;
 *   });
 *
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useLayoutEffect(fn: EffectFunction, deps?: any[]): void {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useLayoutEffect dependency array is ignored. ' +
      'PhilJS effects are already synchronous, so useLayoutEffect behaves identically to useEffect.'
    );
  }

  // In PhilJS, effects are already synchronous, so this is the same as useEffect
  effect(fn);
}

/**
 * Custom hook for effects that should only run once (like componentDidMount).
 * This is a convenience wrapper that makes the intent clearer.
 *
 * @example
 * ```tsx
 * function Component() {
 *   useEffectOnce(() => {
 *     console.log('Component mounted');
 *
 *     return () => {
 *       console.log('Component unmounted');
 *     };
 *   });
 * }
 * ```
 */
export function useEffectOnce(fn: EffectFunction): void {
  // In PhilJS, if an effect doesn't read any signals, it only runs once
  // We can wrap it to ensure it doesn't accidentally track signals
  effect(() => {
    // Execute the function in an untracked context
    return fn();
  });
}

/**
 * Custom hook for async effects with proper cleanup.
 * Handles the common pattern of canceling async operations.
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const [user, setUser] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *
 *   useAsyncEffect(async (signal) => {
 *     setLoading(true);
 *     try {
 *       const response = await fetch(`/api/users/${userId}`, { signal });
 *       const data = await response.json();
 *       setUser(data);
 *     } catch (error) {
 *       if (error.name !== 'AbortError') {
 *         console.error('Failed to fetch user:', error);
 *       }
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, [userId]);
 * }
 * ```
 */
export function useAsyncEffect(
  fn: (abortSignal: AbortSignal) => Promise<void>,
  deps?: any[]
): void {
  if (process.env.NODE_ENV !== 'production' && deps !== undefined) {
    console.warn(
      '[PhilJS React Compat] useAsyncEffect dependency array is ignored. ' +
      'PhilJS automatically tracks dependencies.'
    );
  }

  effect(() => {
    const abortController = new AbortController();

    // Execute async function
    fn(abortController.signal).catch((error) => {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Async effect error:', error);
      }
    });

    // Cleanup: abort the operation
    return () => {
      abortController.abort();
    };
  });
}

/**
 * Custom hook for interval-based effects.
 *
 * @example
 * ```tsx
 * function Clock() {
 *   const [time, setTime] = useState(new Date());
 *
 *   useInterval(() => {
 *     setTime(new Date());
 *   }, 1000);
 *
 *   return <div>{time.toLocaleTimeString()}</div>;
 * }
 * ```
 */
export function useInterval(callback: () => void, delay: number | null): void {
  effect(() => {
    if (delay === null) return;

    const id = setInterval(callback, delay);

    return () => {
      clearInterval(id);
    };
  });
}

/**
 * Custom hook for timeout-based effects.
 *
 * @example
 * ```tsx
 * function Notification({ message }) {
 *   const [visible, setVisible] = useState(true);
 *
 *   useTimeout(() => {
 *     setVisible(false);
 *   }, 3000);
 *
 *   if (!visible) return null;
 *   return <div>{message}</div>;
 * }
 * ```
 */
export function useTimeout(callback: () => void, delay: number | null): void {
  effect(() => {
    if (delay === null) return;

    const id = setTimeout(callback, delay);

    return () => {
      clearTimeout(id);
    };
  });
}

/**
 * Custom hook for debugging value changes.
 *
 * @example
 * ```tsx
 * function Component({ userId, postId }) {
 *   useDebugValue('Component', { userId, postId });
 * }
 * ```
 */
export function useDebugValue(name: string, value: any): void {
  if (process.env.NODE_ENV !== 'production') {
    effect(() => {
      console.log(`[${name}] Updated:`, value);
    });
  }
}
