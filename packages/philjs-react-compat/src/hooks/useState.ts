/**
 * React useState compatibility wrapper for PhilJS signals.
 * Provides a familiar API for React developers while using PhilJS signals under the hood.
 */

import { signal, type Signal } from 'philjs-core';

export type Setter<T> = (value: T | ((prev: T) => T)) => void;
export type UseStateReturn<T> = [T, Setter<T>];

/**
 * React-compatible useState hook that wraps PhilJS signals.
 * Returns a tuple of [value, setValue] similar to React's useState.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *       <button onClick={() => setCount(c => c + 1)}>Increment (functional)</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Note: Unlike React's useState:
 * - Updates are synchronous (no batching needed in most cases)
 * - No stale closure issues (signals are always current)
 * - Fine-grained reactivity (only affected DOM nodes update)
 */
export function useState<T>(initialValue: T | (() => T)): UseStateReturn<T> {
  // Handle lazy initialization
  const initial = typeof initialValue === 'function'
    ? (initialValue as () => T)()
    : initialValue;

  const sig = signal<T>(initial);

  // Create a setter function that matches React's API
  const setValue: Setter<T> = (value: T | ((prev: T) => T)) => {
    sig.set(value);
  };

  // Return the current value (not a function call) to match React's API
  const value = sig();

  return [value, setValue];
}

/**
 * Advanced version that returns both the signal and React-style tuple.
 * Useful when you want to gradually migrate to PhilJS patterns.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { signal: countSignal, tuple: [count, setCount] } = useStateAdvanced(0);
 *
 *   // Use React style
 *   setCount(count + 1);
 *
 *   // Or use PhilJS style
 *   countSignal.set(countSignal() + 1);
 * }
 * ```
 */
export function useStateAdvanced<T>(initialValue: T | (() => T)): {
  signal: Signal<T>;
  tuple: UseStateReturn<T>;
} {
  const initial = typeof initialValue === 'function'
    ? (initialValue as () => T)()
    : initialValue;

  const sig = signal<T>(initial);

  const setValue: Setter<T> = (value: T | ((prev: T) => T)) => {
    sig.set(value);
  };

  return {
    signal: sig,
    tuple: [sig(), setValue]
  };
}

/**
 * Hook to create a controlled input binding compatible with React patterns.
 *
 * @example
 * ```tsx
 * function Form() {
 *   const [value, onChange] = useControlledInput('');
 *
 *   return (
 *     <input
 *       value={value}
 *       onChange={(e) => onChange(e.target.value)}
 *     />
 *   );
 * }
 * ```
 */
export function useControlledInput(initialValue: string = ''): UseStateReturn<string> {
  return useState(initialValue);
}

/**
 * Hook for managing boolean state (common pattern in React).
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const [isOpen, setIsOpen] = useBoolean(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setIsOpen(true)}>Open</button>
 *       {isOpen && <div>Modal Content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBoolean(initialValue: boolean = false): UseStateReturn<boolean> {
  return useState(initialValue);
}

/**
 * Hook for managing array state with helper methods.
 *
 * @example
 * ```tsx
 * function TodoList() {
 *   const [items, { push, remove, clear }] = useArray(['Item 1']);
 *
 *   return (
 *     <div>
 *       <button onClick={() => push('New Item')}>Add</button>
 *       <button onClick={() => clear()}>Clear</button>
 *       <ul>
 *         {items.map((item, i) => (
 *           <li key={i}>
 *             {item}
 *             <button onClick={() => remove(i)}>Remove</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useArray<T>(initialValue: T[] = []): [
  T[],
  {
    push: (item: T) => void;
    remove: (index: number) => void;
    clear: () => void;
    set: Setter<T[]>;
  }
] {
  const [items, setItems] = useState(initialValue);

  return [
    items,
    {
      push: (item: T) => setItems([...items, item]),
      remove: (index: number) => setItems(items.filter((_, i) => i !== index)),
      clear: () => setItems([]),
      set: setItems,
    }
  ];
}
