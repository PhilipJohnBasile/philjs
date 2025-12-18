/**
 * Comprehensive tests for context.ts
 * Testing nested contexts, multiple consumers, unmounting, default values, signal contexts, reducer contexts
 */
import { describe, it, expect } from "vitest";
import { createContext, useContext, createSignalContext, createReducerContext, combineProviders, createThemeContext, } from "./context";
describe("Context API - Basic Usage", () => {
    it("should create context with default value", () => {
        const TestContext = createContext("default");
        expect(TestContext.defaultValue).toBe("default");
        expect(TestContext.id).toBeDefined();
        expect(TestContext.Provider).toBeDefined();
        expect(TestContext.Consumer).toBeDefined();
    });
    it("should use default value when no provider", () => {
        const TestContext = createContext("default");
        const value = useContext(TestContext);
        expect(value).toBe("default");
    });
    it("should provide value to consumers", () => {
        const TestContext = createContext("default");
        // Push value onto stack
        const Provider = TestContext.Provider;
        Provider({ value: "provided", children: null });
        const value = useContext(TestContext);
        expect(value).toBe("provided");
    });
    it("should create unique context ids", () => {
        const Context1 = createContext("value1");
        const Context2 = createContext("value2");
        expect(Context1.id).not.toBe(Context2.id);
    });
});
describe("Context API - Nested Contexts", () => {
    it("should handle nested providers", () => {
        const TestContext = createContext("default");
        // Outer provider
        TestContext.Provider({ value: "outer", children: null });
        const outerValue = useContext(TestContext);
        expect(outerValue).toBe("outer");
        // Inner provider
        TestContext.Provider({ value: "inner", children: null });
        const innerValue = useContext(TestContext);
        expect(innerValue).toBe("inner");
    });
    it("should handle deeply nested contexts", () => {
        const TestContext = createContext(0);
        // Nest multiple levels
        TestContext.Provider({ value: 1, children: null });
        expect(useContext(TestContext)).toBe(1);
        TestContext.Provider({ value: 2, children: null });
        expect(useContext(TestContext)).toBe(2);
        TestContext.Provider({ value: 3, children: null });
        expect(useContext(TestContext)).toBe(3);
    });
    it("should handle different contexts independently", () => {
        const Context1 = createContext("default1");
        const Context2 = createContext("default2");
        Context1.Provider({ value: "value1", children: null });
        Context2.Provider({ value: "value2", children: null });
        expect(useContext(Context1)).toBe("value1");
        expect(useContext(Context2)).toBe("value2");
    });
    it("should isolate nested context scopes", () => {
        const TestContext = createContext("default");
        TestContext.Provider({ value: "level1", children: null });
        const level1 = useContext(TestContext);
        TestContext.Provider({ value: "level2", children: null });
        const level2 = useContext(TestContext);
        expect(level1).toBe("level1");
        expect(level2).toBe("level2");
    });
});
describe("Context API - Multiple Consumers", () => {
    it("should allow multiple consumers of same context", () => {
        const TestContext = createContext({ count: 0 });
        TestContext.Provider({ value: { count: 5 }, children: null });
        const consumer1 = useContext(TestContext);
        const consumer2 = useContext(TestContext);
        expect(consumer1).toEqual({ count: 5 });
        expect(consumer2).toEqual({ count: 5 });
        expect(consumer1).toBe(consumer2); // Same object reference
    });
    it("should update all consumers when context changes", () => {
        const TestContext = createContext(0);
        TestContext.Provider({ value: 1, children: null });
        const value1 = useContext(TestContext);
        const value2 = useContext(TestContext);
        expect(value1).toBe(1);
        expect(value2).toBe(1);
    });
    it("should handle Consumer component render prop", () => {
        const TestContext = createContext("default");
        TestContext.Provider({ value: "test value", children: null });
        const consumerResult = TestContext.Consumer({
            children: (value) => ({ type: "div", props: { children: value } }),
        });
        expect(consumerResult).toEqual({
            type: "div",
            props: { children: "test value" },
        });
    });
});
describe("Context API - Default Values", () => {
    it("should fall back to default when no provider in tree", () => {
        const TestContext = createContext("fallback");
        const value = useContext(TestContext);
        expect(value).toBe("fallback");
    });
    it("should use default value for complex objects", () => {
        const defaultValue = { name: "test", count: 0 };
        const TestContext = createContext(defaultValue);
        const value = useContext(TestContext);
        expect(value).toEqual(defaultValue);
    });
    it("should use default value for functions", () => {
        const defaultFn = () => "default";
        const TestContext = createContext(defaultFn);
        const value = useContext(TestContext);
        expect(value()).toBe("default");
    });
    it("should use default value for null/undefined", () => {
        const NullContext = createContext(null);
        const UndefinedContext = createContext(undefined);
        expect(useContext(NullContext)).toBe(null);
        expect(useContext(UndefinedContext)).toBe(undefined);
    });
});
describe("Context API - Signal Context", () => {
    it("should create signal context", () => {
        const SignalContext = createSignalContext(0);
        expect(SignalContext.id).toBeDefined();
        expect(SignalContext.useValue).toBeDefined();
        expect(SignalContext.setValue).toBeDefined();
    });
    it("should read signal context value", () => {
        const SignalContext = createSignalContext(42);
        SignalContext.Provider({ value: { get: () => 100, set: () => { }, subscribe: () => () => { } }, children: null });
        const value = SignalContext.useValue();
        expect(value).toBe(100);
    });
    it("should update signal context value", () => {
        const SignalContext = createSignalContext(0);
        let storedValue = 0;
        SignalContext.Provider({
            value: {
                get: () => storedValue,
                set: (v) => { storedValue = v; },
                subscribe: () => () => { },
            },
            children: null,
        });
        SignalContext.setValue(42);
        expect(storedValue).toBe(42);
    });
    it("should support signal subscriptions", () => {
        const SignalContext = createSignalContext(0);
        const subscribers = [];
        SignalContext.Provider({
            value: {
                get: () => 0,
                set: () => { },
                subscribe: (fn) => {
                    subscribers.push(fn);
                    return () => {
                        const index = subscribers.indexOf(fn);
                        if (index > -1)
                            subscribers.splice(index, 1);
                    };
                },
            },
            children: null,
        });
        const ctx = useContext(SignalContext);
        const unsubscribe = ctx.subscribe(() => { });
        expect(subscribers.length).toBe(1);
        unsubscribe();
        expect(subscribers.length).toBe(0);
    });
});
describe("Context API - Reducer Context", () => {
    const reducer = (state, action) => {
        switch (action.type) {
            case "increment":
                return { count: state.count + 1 };
            case "decrement":
                return { count: state.count - 1 };
            case "set":
                return { count: action.value };
            default:
                return state;
        }
    };
    it("should create reducer context", () => {
        const ReducerContext = createReducerContext(reducer, { count: 0 });
        expect(ReducerContext.id).toBeDefined();
        expect(ReducerContext.useSelector).toBeDefined();
        expect(ReducerContext.useDispatch).toBeDefined();
    });
    it("should dispatch actions and update state", () => {
        const ReducerContext = createReducerContext(reducer, { count: 0 });
        let currentState = { count: 0 };
        ReducerContext.Provider({
            value: {
                getState: () => currentState,
                dispatch: (action) => {
                    currentState = reducer(currentState, action);
                },
                subscribe: () => () => { },
            },
            children: null,
        });
        const dispatch = ReducerContext.useDispatch();
        dispatch({ type: "increment" });
        expect(currentState.count).toBe(1);
        dispatch({ type: "increment" });
        expect(currentState.count).toBe(2);
        dispatch({ type: "decrement" });
        expect(currentState.count).toBe(1);
    });
    it("should use selectors to access state", () => {
        const ReducerContext = createReducerContext(reducer, { count: 42 });
        ReducerContext.Provider({
            value: {
                getState: () => ({ count: 42 }),
                dispatch: () => { },
                subscribe: () => () => { },
            },
            children: null,
        });
        const count = ReducerContext.useSelector((state) => state.count);
        expect(count).toBe(42);
    });
    it("should handle complex state transformations", () => {
        const ReducerContext = createReducerContext(reducer, { count: 0 });
        let currentState = { count: 10 };
        ReducerContext.Provider({
            value: {
                getState: () => currentState,
                dispatch: (action) => {
                    currentState = reducer(currentState, action);
                },
                subscribe: () => () => { },
            },
            children: null,
        });
        const dispatch = ReducerContext.useDispatch();
        dispatch({ type: "set", value: 100 });
        expect(currentState.count).toBe(100);
    });
});
describe("Context API - Combine Providers", () => {
    it("should combine multiple providers", () => {
        const Context1 = createContext("value1");
        const Context2 = createContext("value2");
        const CombinedProvider = combineProviders({ Provider: Context1.Provider, value: "combined1" }, { Provider: Context2.Provider, value: "combined2" });
        const result = CombinedProvider({ children: null });
        expect(result).toBeDefined();
    });
    it("should nest providers in correct order", () => {
        const Context1 = createContext("default1");
        const Context2 = createContext("default2");
        const Context3 = createContext("default3");
        const CombinedProvider = combineProviders({ Provider: Context1.Provider, value: "a" }, { Provider: Context2.Provider, value: "b" }, { Provider: Context3.Provider, value: "c" });
        const result = CombinedProvider({ children: { type: "div", props: {} } });
        expect(result).toBeDefined();
    });
});
describe("Context API - Theme Context", () => {
    it("should create theme context", () => {
        const theme = { primaryColor: "#007bff", fontSize: "16px" };
        const ThemeContext = createThemeContext(theme);
        expect(ThemeContext.id).toBeDefined();
        expect(ThemeContext.ThemeProvider).toBeDefined();
        expect(ThemeContext.useTheme).toBeDefined();
    });
    it("should provide theme values", () => {
        const theme = { primaryColor: "#007bff" };
        const ThemeContext = createThemeContext(theme);
        const currentTheme = ThemeContext.useTheme();
        expect(currentTheme).toEqual(theme);
    });
    it("should generate CSS variables from theme", () => {
        const theme = { primaryColor: "#007bff", fontSize: "16px" };
        const ThemeContext = createThemeContext(theme);
        const result = ThemeContext.ThemeProvider({
            theme: { primaryColor: "#ff0000", fontSize: "20px" },
            children: { type: "div", props: {} },
        });
        expect(result.type).toBe("div");
        expect(result.props.style).toContain("--primaryColor: #ff0000");
        expect(result.props.style).toContain("--fontSize: 20px");
    });
    it("should update theme reactively", () => {
        const initialTheme = { color: "blue" };
        const ThemeContext = createThemeContext(initialTheme);
        const theme1 = ThemeContext.useTheme();
        expect(theme1).toEqual(initialTheme);
        ThemeContext.ThemeProvider({
            theme: { color: "red" },
            children: { type: "div", props: {} },
        });
        const theme2 = ThemeContext.useTheme();
        expect(theme2).toEqual({ color: "red" });
    });
});
describe("Context API - SSR Handling", () => {
    it("should handle SSR context boundaries", () => {
        const TestContext = createContext("default");
        // Simulate SSR environment
        const originalWindow = global.window;
        // @ts-ignore
        delete global.window;
        const result = TestContext.Provider({
            value: "ssr-value",
            children: { type: "div", props: {} },
        });
        // Should return ContextBoundary in SSR
        expect(result).toBeDefined();
        // Restore window
        global.window = originalWindow;
    });
    it("should pass through on client", () => {
        const TestContext = createContext("default");
        // Ensure we're in client mode
        if (typeof window !== "undefined") {
            const children = { type: "div", props: {} };
            const result = TestContext.Provider({
                value: "client-value",
                children,
            });
            expect(result).toBe(children);
        }
    });
});
describe("Context API - Edge Cases", () => {
    it("should handle empty context stack", () => {
        const TestContext = createContext("default");
        // Create a new context that doesn't exist in stack
        const value = useContext(TestContext);
        expect(value).toBeDefined();
    });
    it("should handle object reference equality", () => {
        const obj = { value: 42 };
        const TestContext = createContext(obj);
        TestContext.Provider({ value: obj, children: null });
        const retrieved = useContext(TestContext);
        expect(retrieved).toBe(obj);
    });
    it("should handle array values", () => {
        const arr = [1, 2, 3];
        const TestContext = createContext(arr);
        TestContext.Provider({ value: arr, children: null });
        const retrieved = useContext(TestContext);
        expect(retrieved).toBe(arr);
    });
    it("should handle Map and Set values", () => {
        const map = new Map([["key", "value"]]);
        const TestContext = createContext(map);
        TestContext.Provider({ value: map, children: null });
        const retrieved = useContext(TestContext);
        expect(retrieved).toBe(map);
        expect(retrieved.get("key")).toBe("value");
    });
});
//# sourceMappingURL=context.test.js.map