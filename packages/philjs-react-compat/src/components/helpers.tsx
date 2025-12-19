/**
 * React component helpers compatibility for PhilJS.
 * Provides forwardRef, memo, and other component utilities.
 */

import { signal } from 'philjs-core';
import type { RefObject } from '../hooks/useRef.js';

/**
 * Forward ref to allow parent components to access child DOM elements.
 * In PhilJS, this is simpler than React since we don't have the same ref forwarding restrictions.
 *
 * @example
 * ```tsx
 * import { forwardRef } from 'philjs-react-compat';
 *
 * const Input = forwardRef<HTMLInputElement, { placeholder?: string }>((props, ref) => {
 *   return <input ref={ref} placeholder={props.placeholder} />;
 * });
 *
 * function Parent() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *
 *   const focusInput = () => {
 *     inputRef.current?.focus();
 *   };
 *
 *   return (
 *     <div>
 *       <Input ref={inputRef} placeholder="Enter text" />
 *       <button onClick={focusInput}>Focus Input</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function forwardRef<T, P = {}>(
  render: (props: P, ref: RefObject<T> | ((instance: T | null) => void) | null) => any
): (props: P & { ref?: RefObject<T> | ((instance: T | null) => void) | null }) => any {
  return (props: P & { ref?: RefObject<T> | ((instance: T | null) => void) | null }) => {
    const { ref, ...restProps } = props;
    return render(restProps as P, ref || null);
  };
}

/**
 * React.memo equivalent for PhilJS.
 * Note: In PhilJS, this is largely unnecessary due to fine-grained reactivity.
 * Provided for compatibility during migration.
 *
 * @example
 * ```tsx
 * import { memo } from 'philjs-react-compat';
 *
 * const ExpensiveComponent = memo(({ data }) => {
 *   // Expensive rendering logic
 *   return <div>{data}</div>;
 * });
 * ```
 *
 * Note: In PhilJS, you can safely remove memo() wrappers.
 * The fine-grained reactivity system ensures components only update when needed.
 */
export function memo<P = {}>(
  Component: (props: P) => any,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): (props: P) => any {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[PhilJS React Compat] memo() is unnecessary in PhilJS. ' +
      'Fine-grained reactivity automatically optimizes rendering. ' +
      'You can safely remove the memo() wrapper.'
    );
  }

  // In PhilJS, just return the component as-is
  // The reactivity system handles optimization automatically
  return Component;
}

/**
 * Create a ref object.
 * This is equivalent to React.createRef().
 *
 * @example
 * ```tsx
 * import { createRef } from 'philjs-react-compat';
 *
 * class ClassComponent extends Component {
 *   inputRef = createRef<HTMLInputElement>();
 *
 *   focusInput = () => {
 *     this.inputRef.current?.focus();
 *   };
 *
 *   render() {
 *     return (
 *       <div>
 *         <input ref={this.inputRef} />
 *         <button onClick={this.focusInput}>Focus</button>
 *       </div>
 *     );
 *   }
 * }
 * ```
 */
export function createRef<T>(): RefObject<T> {
  const sig = signal<T | null>(null);

  return {
    get current() {
      return sig.peek();
    },
    set current(value: T | null) {
      sig.set(value);
    }
  };
}

/**
 * Check if a value is a valid React element (JSX element).
 *
 * @example
 * ```tsx
 * import { isValidElement } from 'philjs-react-compat';
 *
 * function Component({ children }) {
 *   if (isValidElement(children)) {
 *     // children is a JSX element
 *   }
 * }
 * ```
 */
export function isValidElement(value: any): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    ('type' in value || 'tag' in value)
  );
}

/**
 * Clone a JSX element with new props.
 *
 * @example
 * ```tsx
 * import { cloneElement } from 'philjs-react-compat';
 *
 * function Wrapper({ children }) {
 *   return cloneElement(children, {
 *     className: 'wrapped',
 *     onClick: () => console.log('Clicked!')
 *   });
 * }
 * ```
 */
export function cloneElement(element: any, props: any, ...children: any[]): any {
  if (!isValidElement(element)) {
    throw new Error('cloneElement: First argument must be a valid element');
  }

  return {
    ...element,
    props: {
      ...element.props,
      ...props,
      children: children.length > 0 ? children : element.props.children
    }
  };
}

/**
 * Get the children as an array.
 *
 * @example
 * ```tsx
 * import { Children } from 'philjs-react-compat';
 *
 * function List({ children }) {
 *   return (
 *     <ul>
 *       {Children.toArray(children).map((child, index) => (
 *         <li key={index}>{child}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export const Children = {
  map: (children: any, fn: (child: any, index: number) => any): any[] => {
    if (Array.isArray(children)) {
      return children.map(fn);
    }
    return children != null ? [fn(children, 0)] : [];
  },

  forEach: (children: any, fn: (child: any, index: number) => void): void => {
    if (Array.isArray(children)) {
      children.forEach(fn);
    } else if (children != null) {
      fn(children, 0);
    }
  },

  count: (children: any): number => {
    if (Array.isArray(children)) {
      return children.length;
    }
    return children != null ? 1 : 0;
  },

  only: (children: any): any => {
    if (!isValidElement(children)) {
      throw new Error('Children.only: Expected to receive a single React element child');
    }
    return children;
  },

  toArray: (children: any): any[] => {
    if (Array.isArray(children)) {
      return children;
    }
    return children != null ? [children] : [];
  }
};

/**
 * Create a context value provider helper.
 *
 * @example
 * ```tsx
 * import { createContextProvider } from 'philjs-react-compat';
 *
 * const [ThemeProvider, useTheme] = createContextProvider('light');
 *
 * function App() {
 *   return (
 *     <ThemeProvider value="dark">
 *       <ThemedComponent />
 *     </ThemeProvider>
 *   );
 * }
 *
 * function ThemedComponent() {
 *   const theme = useTheme();
 *   return <div className={theme}>Content</div>;
 * }
 * ```
 */
export function createContextProvider<T>(defaultValue: T): [
  (props: { value: T; children: any }) => any,
  () => T
] {
  const { createContext, useContext } = require('philjs-core');
  const Context = createContext<T>(defaultValue);

  const Provider = (props: { value: T; children: any }) => {
    return <Context.Provider value={props.value}>{props.children}</Context.Provider>;
  };

  const useValue = () => useContext(Context);

  return [Provider, useValue];
}
