/**
 * Context API for shared state across components.
 * Provides dependency injection without prop drilling.
 */
import { signal } from "./signals.js";
/**
 * Global context storage.
 * Maps context IDs to their current values in the component tree.
 */
const contextStack = new Map();
/**
 * Create a context for sharing values across the component tree.
 */
export function createContext(defaultValue) {
    const id = Symbol("context");
    // Initialize context stack
    contextStack.set(id, [defaultValue]);
    const Provider = (props) => {
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
        return children;
    };
    const Consumer = (props) => {
        const stack = contextStack.get(id) || [defaultValue];
        const value = stack[stack.length - 1];
        return props.children(value);
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
export function useContext(context) {
    const stack = contextStack.get(context.id) || [context.defaultValue];
    return stack[stack.length - 1];
}
/**
 * Internal component for managing context boundaries during SSR.
 */
function ContextBoundary(props) {
    // This is a special component that pops context after rendering
    return props.children;
}
/**
 * Create a context with a reactive signal value.
 * Changes to the signal will trigger re-renders.
 */
export function createSignalContext(defaultValue) {
    const valueSignal = signal(defaultValue);
    const context = createContext({
        get: () => valueSignal(),
        set: (value) => valueSignal.set(value),
        subscribe: valueSignal.subscribe,
    });
    return {
        ...context,
        useValue: () => {
            const ctx = useContext(context);
            return ctx.get();
        },
        setValue: (value) => {
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
export function createReducerContext(reducer, initialState) {
    // Deprecation warning
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn('[PhilJS] DEPRECATION WARNING: createReducerContext() is deprecated.\n' +
            'Use signal() and createSignalContext() instead for simpler state management.\n' +
            'This function will be removed in v1.0.0.\n' +
            'See: https://philjs.dev/docs/migration/from-redux');
    }
    const stateSignal = signal(initialState);
    const dispatch = (action) => {
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
        useSelector: (selector) => {
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
export function combineProviders(...providers) {
    return (props) => {
        return providers.reduceRight((children, { Provider, value }) => {
            return Provider({ value, children });
        }, props.children);
    };
}
/**
 * Create a theme context with CSS variables.
 */
export function createThemeContext(defaultTheme) {
    const themeSignal = signal(defaultTheme);
    const baseContext = createContext({
        get: () => themeSignal(),
        set: (value) => themeSignal.set(value),
        subscribe: themeSignal.subscribe,
    });
    const ThemeProvider = (props) => {
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
                        set: (value) => themeSignal.set(value),
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
//# sourceMappingURL=context.js.map