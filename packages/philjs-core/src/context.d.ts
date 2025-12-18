/**
 * Context API for shared state across components.
 * Provides dependency injection without prop drilling.
 */
import type { VNode, JSXElement } from "./jsx-runtime.js";
export type Context<T> = {
    /** Unique identifier for this context */
    id: symbol;
    /** Default value */
    defaultValue: T;
    /** Provider component */
    Provider: (props: {
        value: T;
        children: VNode;
    }) => JSXElement;
    /** Consumer component */
    Consumer: (props: {
        children: (value: T) => VNode;
    }) => JSXElement;
};
/**
 * Create a context for sharing values across the component tree.
 */
export declare function createContext<T>(defaultValue: T): Context<T>;
/**
 * Use a context value in a component.
 * Must be called within a Provider.
 */
export declare function useContext<T>(context: Context<T>): T;
/**
 * Create a context with a reactive signal value.
 * Changes to the signal will trigger re-renders.
 */
export declare function createSignalContext<T>(defaultValue: T): {
    useValue: () => T;
    setValue: (value: T) => void;
    /** Unique identifier for this context */
    id: symbol;
    /** Default value */
    defaultValue: {
        get: () => T;
        set: (value: T) => void;
        subscribe: (fn: (value: T) => void) => () => void;
    };
    /** Provider component */
    Provider: (props: {
        value: {
            get: () => T;
            set: (value: T) => void;
            subscribe: (fn: (value: T) => void) => () => void;
        };
        children: VNode;
    }) => JSXElement;
    /** Consumer component */
    Consumer: (props: {
        children: (value: {
            get: () => T;
            set: (value: T) => void;
            subscribe: (fn: (value: T) => void) => () => void;
        }) => VNode;
    }) => JSXElement;
};
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
export declare function createReducerContext<State, Action>(reducer: (state: State, action: Action) => State, initialState: State): {
    useSelector: <T>(selector: (state: State) => T) => T;
    useDispatch: () => (action: Action) => void;
    /** Unique identifier for this context */
    id: symbol;
    /** Default value */
    defaultValue: {
        getState: () => State;
        dispatch: (action: Action) => void;
        subscribe: (fn: (value: State) => void) => () => void;
    };
    /** Provider component */
    Provider: (props: {
        value: {
            getState: () => State;
            dispatch: (action: Action) => void;
            subscribe: (fn: (value: State) => void) => () => void;
        };
        children: VNode;
    }) => JSXElement;
    /** Consumer component */
    Consumer: (props: {
        children: (value: {
            getState: () => State;
            dispatch: (action: Action) => void;
            subscribe: (fn: (value: State) => void) => () => void;
        }) => VNode;
    }) => JSXElement;
};
/**
 * Combine multiple contexts into one provider.
 */
export declare function combineProviders(...providers: Array<{
    Provider: any;
    value: any;
}>): (props: {
    children: VNode;
}) => VNode;
/**
 * Create a theme context with CSS variables.
 */
export declare function createThemeContext<T extends Record<string, any>>(defaultTheme: T): {
    ThemeProvider: (props: {
        theme: T;
        children: VNode;
    }) => JSXElement;
    useTheme: () => T;
    /** Unique identifier for this context */
    id: symbol;
    /** Default value */
    defaultValue: {
        get: () => T;
        set: (value: T) => void;
        subscribe: (fn: (value: T) => void) => () => void;
    };
    /** Provider component */
    Provider: (props: {
        value: {
            get: () => T;
            set: (value: T) => void;
            subscribe: (fn: (value: T) => void) => () => void;
        };
        children: VNode;
    }) => JSXElement;
    /** Consumer component */
    Consumer: (props: {
        children: (value: {
            get: () => T;
            set: (value: T) => void;
            subscribe: (fn: (value: T) => void) => () => void;
        }) => VNode;
    }) => JSXElement;
};
//# sourceMappingURL=context.d.ts.map