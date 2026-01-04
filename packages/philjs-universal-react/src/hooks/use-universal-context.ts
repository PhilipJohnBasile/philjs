/**
 * React hook for accessing Universal Context.
 * Provides cross-framework context access within React components.
 */

import { useCallback, useDebugValue, useSyncExternalStore } from 'react';
import {
  getGlobalContextBridge,
  type UniversalContext,
} from '@philjs/universal';

/**
 * React hook to access a Universal Context value.
 * Subscribes to context changes and re-renders when the value updates.
 *
 * @param id - The unique identifier of the context
 * @returns The current context value, or undefined if not set
 *
 * @example
 * ```tsx
 * import { useUniversalContext } from '@philjs/universal-react';
 *
 * // In a React component
 * function UserDisplay() {
 *   const user = useUniversalContext<User>('user');
 *
 *   if (!user) {
 *     return <div>No user logged in</div>;
 *   }
 *
 *   return <div>Hello, {user.name}!</div>;
 * }
 * ```
 */
export function useUniversalContext<T>(id: string): T | undefined {
  const bridge = getGlobalContextBridge();

  // Subscribe to context changes
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      const context = bridge.getContext<T>(id);
      if (context) {
        return context.subscribe(() => callback());
      }
      // If context doesn't exist, return no-op cleanup
      return () => {};
    },
    [id, bridge]
  );

  // Get the current value
  const getSnapshot = useCallback((): T | undefined => {
    const context = bridge.getContext<T>(id);
    return context?.get();
  }, [id, bridge]);

  // Server snapshot for SSR
  const getServerSnapshot = useCallback((): T | undefined => {
    const context = bridge.getContext<T>(id);
    return context?.get();
  }, [id, bridge]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useDebugValue(value, (v) => (v !== undefined ? 'Set' : 'Undefined'));

  return value;
}

/**
 * React hook to access a Universal Context with a setter.
 * Similar to useUniversalContext but also returns a setter function.
 *
 * @param id - The unique identifier of the context
 * @returns A tuple of [value, setValue, context]
 *
 * @example
 * ```tsx
 * import { useUniversalContextState } from '@philjs/universal-react';
 *
 * function ThemeToggle() {
 *   const [theme, setTheme] = useUniversalContextState<'light' | 'dark'>('theme');
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Current: {theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUniversalContextState<T>(
  id: string
): [T | undefined, (value: T) => void, UniversalContext<T> | undefined] {
  const bridge = getGlobalContextBridge();
  const context = bridge.getContext<T>(id);
  const value = useUniversalContext<T>(id);

  // Create a stable setter
  const setValue = useCallback(
    (newValue: T): void => {
      context?.set(newValue);
    },
    [context]
  );

  return [value, setValue, context];
}

/**
 * React hook to provide a Universal Context value.
 * Creates the context if it doesn't exist and cleans up on unmount.
 *
 * @param id - The unique identifier of the context
 * @param value - The value to provide
 *
 * @example
 * ```tsx
 * import { useProvideUniversalContext } from '@philjs/universal-react';
 *
 * function App() {
 *   const [user, setUser] = useState<User | null>(null);
 *
 *   // Provide the user to all universal components
 *   useProvideUniversalContext('user', user);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useProvideUniversalContext<T>(id: string, value: T): void {
  const bridge = getGlobalContextBridge();

  // Get or create the context
  let context = bridge.getContext<T>(id);
  if (!context) {
    context = bridge.createContext<T>(id, value);
  }

  // Update the context value when it changes
  useSyncExternalStore(
    useCallback(() => () => {}, []),
    useCallback(() => {
      if (context && context.get() !== value) {
        context.set(value);
      }
      return value;
    }, [context, value]),
    useCallback(() => value, [value])
  );
}

/**
 * React hook to check if a Universal Context exists.
 *
 * @param id - The unique identifier of the context
 * @returns Whether the context exists
 */
export function useHasUniversalContext(id: string): boolean {
  const bridge = getGlobalContextBridge();

  return useSyncExternalStore(
    useCallback(() => () => {}, []),
    useCallback(() => bridge.hasContext(id), [id, bridge]),
    useCallback(() => bridge.hasContext(id), [id, bridge])
  );
}

/**
 * React hook that waits for a Universal Context to be available.
 * Returns null while waiting, then the value once available.
 *
 * @param id - The unique identifier of the context
 * @param timeout - Optional timeout in milliseconds
 * @returns The context value or null if still waiting
 *
 * @example
 * ```tsx
 * import { useAwaitUniversalContext } from '@philjs/universal-react';
 *
 * function WaitForConfig() {
 *   const config = useAwaitUniversalContext<Config>('config');
 *
 *   if (!config) {
 *     return <div>Loading configuration...</div>;
 *   }
 *
 *   return <div>API URL: {config.apiUrl}</div>;
 * }
 * ```
 */
export function useAwaitUniversalContext<T>(
  id: string,
  timeout?: number
): T | null {
  const bridge = getGlobalContextBridge();

  // Check if context exists and has a value
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      // Poll for context existence
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let intervalId: ReturnType<typeof setInterval> | null = null;

      const checkContext = (): boolean => {
        const context = bridge.getContext<T>(id);
        if (context && context.hasValue()) {
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
          callback();
          return true;
        }
        return false;
      };

      // If already available, don't poll
      if (checkContext()) {
        return () => {};
      }

      // Poll every 100ms
      intervalId = setInterval(() => {
        checkContext();
      }, 100);

      // Optional timeout
      if (timeout) {
        timeoutId = setTimeout(() => {
          if (intervalId) clearInterval(intervalId);
          callback(); // Trigger re-render with null
        }, timeout);
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    },
    [id, bridge, timeout]
  );

  const getSnapshot = useCallback((): T | null => {
    const context = bridge.getContext<T>(id);
    if (context && context.hasValue()) {
      return context.get() ?? null;
    }
    return null;
  }, [id, bridge]);

  const getServerSnapshot = useCallback((): T | null => {
    const context = bridge.getContext<T>(id);
    if (context && context.hasValue()) {
      return context.get() ?? null;
    }
    return null;
  }, [id, bridge]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
