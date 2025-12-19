/**
 * React useRef compatibility wrapper for PhilJS signals.
 * Provides a familiar API for React developers while using PhilJS signals under the hood.
 */

import { signal, type Signal } from 'philjs-core';

/**
 * Ref object matching React's MutableRefObject interface.
 */
export interface RefObject<T> {
  current: T;
}

/**
 * React-compatible useRef hook that wraps PhilJS signals.
 * Returns an object with a .current property that can be read and written.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   const countRef = useRef(0);
 *
 *   const focusInput = () => {
 *     inputRef.current?.focus();
 *   };
 *
 *   const increment = () => {
 *     countRef.current += 1;
 *     console.log('Count:', countRef.current);
 *   };
 *
 *   return (
 *     <div>
 *       <input ref={inputRef} />
 *       <button onClick={focusInput}>Focus Input</button>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Note: Unlike signals, refs don't trigger reactivity when changed.
 * This matches React's behavior.
 */
export function useRef<T>(initialValue: T): RefObject<T> {
  const sig = signal<T>(initialValue);

  // Create a ref object with getter/setter for .current
  const ref: RefObject<T> = {
    get current() {
      // Use peek() to avoid tracking this as a dependency
      return sig.peek();
    },
    set current(value: T) {
      // Update without triggering reactivity
      sig.set(value);
    }
  };

  return ref;
}

/**
 * Hook to create a ref that's always up-to-date with the latest value.
 * Useful for accessing props/state in callbacks without stale closures.
 *
 * @example
 * ```tsx
 * function Component({ onUpdate }) {
 *   const [count, setCount] = useState(0);
 *   const countRef = useLatestRef(count);
 *
 *   const handleClick = () => {
 *     setTimeout(() => {
 *       // Always has the latest count, even after delays
 *       console.log('Latest count:', countRef.current);
 *     }, 1000);
 *   };
 *
 *   return <button onClick={handleClick}>Click</button>;
 * }
 * ```
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);

  // Update ref whenever value changes
  ref.current = value;

  return ref;
}

/**
 * Hook to create a callback ref for DOM elements.
 * Useful when you need to run code when an element is mounted/unmounted.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const [element, ref] = useCallbackRef<HTMLDivElement>((el) => {
 *     if (el) {
 *       console.log('Element mounted:', el);
 *       // Set up observers, measure, etc.
 *     } else {
 *       console.log('Element unmounted');
 *     }
 *   });
 *
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useCallbackRef<T>(
  callback: (element: T | null) => void
): [T | null, (element: T | null) => void] {
  const elementRef = useRef<T | null>(null);

  const setRef = (element: T | null) => {
    if (elementRef.current !== element) {
      elementRef.current = element;
      callback(element);
    }
  };

  return [elementRef.current, setRef];
}

/**
 * Hook to merge multiple refs into one.
 * Useful when you need to use both a forwarded ref and a local ref.
 *
 * @example
 * ```tsx
 * const Component = forwardRef<HTMLDivElement>((props, forwardedRef) => {
 *   const localRef = useRef<HTMLDivElement>(null);
 *   const mergedRef = useMergedRef(localRef, forwardedRef);
 *
 *   return <div ref={mergedRef}>Content</div>;
 * });
 * ```
 */
export function useMergedRef<T>(
  ...refs: (RefObject<T> | ((instance: T | null) => void) | null | undefined)[]
): (instance: T | null) => void {
  return (instance: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref != null) {
        (ref as RefObject<T>).current = instance;
      }
    });
  };
}

/**
 * Hook to create a ref that stores the previous value.
 *
 * @example
 * ```tsx
 * function Component({ count }) {
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  const prevValue = ref.current;
  ref.current = value;
  return prevValue;
}

/**
 * Hook to create a ref for storing mutable values that persist across renders
 * but don't trigger re-renders when changed.
 *
 * @example
 * ```tsx
 * function Timer() {
 *   const [count, setCount] = useState(0);
 *   const intervalRef = useMutableRef<NodeJS.Timeout>();
 *
 *   const start = () => {
 *     intervalRef.current = setInterval(() => {
 *       setCount(c => c + 1);
 *     }, 1000);
 *   };
 *
 *   const stop = () => {
 *     if (intervalRef.current) {
 *       clearInterval(intervalRef.current);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={start}>Start</button>
 *       <button onClick={stop}>Stop</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMutableRef<T>(initialValue?: T): RefObject<T | undefined> {
  return useRef<T | undefined>(initialValue);
}
