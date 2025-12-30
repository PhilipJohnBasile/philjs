/**
 * Context API for shared state across components.
 * Provides dependency injection without prop drilling.
 */

import type { VNode, JSXElement } from "./jsx-runtime.js";
import { signal } from "./signals.js";

export type Context<T> = {
  /** Unique identifier for this context */
  id: symbol;
  /** Default value */
  defaultValue: T;
  /** Provider component */
  Provider: (props: { value: T; children: VNode }) => JSXElement;
  /** Consumer component */
  Consumer: (props: { children: (value: T) => VNode }) => JSXElement;
};

/**
 * Global context storage.
 * Maps context IDs to their current values in the component tree.
 */
const contextStack = new Map<symbol, any[]>();

/**
 * Create a context for sharing values across the component tree.
 */
export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol("context");

  // Initialize context stack
  contextStack.set(id, [defaultValue]);

  const Provider = (props: { value: T; children: VNode }): JSXElement => {
    const { value, children } = props;

    // Push value onto context stack
    const stack = contextStack.get(id) || [defaultValue];
    stack.push(value);

    // During SSR, we need to wrap children to pop context after rendering
    if (typeof window === "undefined") {
      return {
        type: ContextBoundary,
        props: {
          contextId: id,
          children,
        },
      };
    }

    // On client, just pass through
    return children as JSXElement;
  };

  const Consumer = (props: { children: (value: T) => VNode }): JSXElement => {
    const stack = contextStack.get(id) || [defaultValue];
    const value = stack[stack.length - 1];
    return props.children(value) as JSXElement;
  };

  return {
    id,
    defaultValue,
    Provider,
    Consumer,
  };
}

/**
 * Use a context value in a component.
 * Must be called within a Provider.
 */
export function useContext<T>(context: Context<T>): T {
  const stack = contextStack.get(context.id) || [context.defaultValue];
  return stack[stack.length - 1];
}

/**
 * Internal component for managing context boundaries during SSR.
 */
function ContextBoundary(props: { contextId: symbol; children: VNode }): VNode {
  // This is a special component that pops context after rendering
  return props.children;
}

/**
 * Create a context with a reactive signal value.
 * Changes to the signal will trigger re-renders.
 */
export function createSignalContext<T>(defaultValue: T) {
  const valueSignal = signal(defaultValue);

  const context = createContext({
    get: () => valueSignal(),
    set: (value: T) => valueSignal.set(value),
    subscribe: valueSignal.subscribe,
  });

  return {
    ...context,
    useValue: () => {
      const ctx = useContext(context);
      return ctx.get();
    },
    setValue: (value: T) => {
      const ctx = useContext(context);
      ctx.set(value);
    },
  };
}

/**
 * Create a reducer-based context for complex state management.
 *
 * @deprecated This function encourages Redux-style patterns that signals eliminate.
 * Use `signal()` and `createSignalContext()` instead for simpler, more direct state management.
 *
 * @example
 * // ❌ Old way (deprecated):
 * const CounterContext = createReducerContext(
 *   (state, action) => action.type === 'increment' ? state + 1 : state,
 *   0
 * );
 *
 * // ✅ New way (recommended):
 * const CounterContext = createSignalContext(0);
 * // Then use: count.set(count() + 1) directly
 *
 * This function will be removed in v1.0.0.
 */
export function createReducerContext<State, Action>(
  reducer: (state: State, action: Action) => State,
  initialState: State
) {
  // Deprecation warning
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
    console.warn(
      '[PhilJS] DEPRECATION WARNING: createReducerContext() is deprecated.\n' +
      'Use signal() and createSignalContext() instead for simpler state management.\n' +
      'This function will be removed in v1.0.0.\n' +
      'See: https://philjs.dev/docs/migration/from-redux'
    );
  }

  const stateSignal = signal(initialState);

  const dispatch = (action: Action) => {
    const currentState = stateSignal();
    const newState = reducer(currentState, action);
    stateSignal.set(newState);
  };

  const context = createContext({
    getState: () => stateSignal(),
    dispatch,
    subscribe: stateSignal.subscribe,
  });

  return {
    ...context,
    useSelector: <T>(selector: (state: State) => T): T => {
      const ctx = useContext(context);
      const state = ctx.getState();
      return selector(state);
    },
    useDispatch: () => {
      const ctx = useContext(context);
      return ctx.dispatch;
    },
  };
}

/**
 * Combine multiple contexts into one provider.
 */
export function combineProviders(
  ...providers: Array<{ Provider: any; value: any }>
): (props: { children: VNode }) => VNode {
  return (props: { children: VNode }) => {
    return providers.reduceRight((children, { Provider, value }) => {
      return Provider({ value, children });
    }, props.children);
  };
}

/**
 * Create a theme context with CSS variables.
 */
export function createThemeContext<T extends Record<string, any>>(defaultTheme: T) {
  const themeSignal = signal(defaultTheme);
  const baseContext = createContext({
    get: () => themeSignal(),
    set: (value: T) => themeSignal.set(value),
    subscribe: themeSignal.subscribe,
  });

  const ThemeProvider = (props: { theme: T; children: VNode }): JSXElement => {
    // Update the theme signal
    themeSignal.set(props.theme);

    // Generate CSS variables from theme
    const cssVars = Object.entries(props.theme)
      .map(([key, value]) => `--${key}: ${value};`)
      .join(" ");

    return {
      type: "div",
      props: {
        style: cssVars,
        children: baseContext.Provider({
          value: {
            get: () => props.theme,
            set: (value: T) => themeSignal.set(value),
            subscribe: themeSignal.subscribe,
          },
          children: props.children
        }),
      },
    };
  };

  return {
    ...baseContext,
    ThemeProvider,
    useTheme: () => themeSignal(),
  };
}