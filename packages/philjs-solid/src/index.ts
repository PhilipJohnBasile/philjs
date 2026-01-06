/**
 * PhilJS SolidJS Integration
 *
 * Comprehensive interoperability between PhilJS and SolidJS,
 * providing signal conversion, store integration, routing,
 * SSR utilities, and component bridges.
 */

import {
    createSignal as createSolidSignal,
    createEffect as createSolidEffect,
    createMemo as createSolidMemo,
    createResource,
    createContext as createSolidContext,
    useContext as useSolidContext,
    onCleanup,
    onMount,
    batch as solidBatch,
    untrack,
    Suspense,
    ErrorBoundary,
    Show,
    For,
    Switch,
    Match,
    Index,
    Portal,
    Dynamic,
    type Accessor,
    type Setter,
    type Resource,
    type ResourceReturn,
    type Component,
    type ParentComponent,
    type JSX,
} from 'solid-js';
import { createStore, produce, reconcile } from 'solid-js/store';

// ============================================================================
// TYPES
// ============================================================================

export interface PhilJSSignal<T> {
    (): T;
    set: (value: T | ((prev: T) => T)) => void;
    update: (fn: (prev: T) => T) => void;
    subscribe: (callback: (value: T) => void) => () => void;
}

export interface PhilJSComputed<T> {
    (): T;
}

export interface SolidAccessor<T> {
    (): T;
}

export interface SolidSetter<T> {
    (value: T | ((prev: T) => T)): void;
}

export interface ResourceOptions<T, S = unknown> {
    fetcher: (source: S, info: { value: T | undefined; refetching: S | boolean }) => Promise<T>;
    source?: Accessor<S>;
    initialValue?: T;
    name?: string;
    deferStream?: boolean;
    ssrLoadFrom?: 'initial' | 'server';
    storage?: (init: T | undefined) => [Accessor<T | undefined>, Setter<T | undefined>];
    onHydrated?: (k: S | undefined, info: { value: T | undefined }) => void;
}

export interface RouteDataOptions<T> {
    fetcher: () => Promise<T>;
    key?: string | (() => string);
    reconcileOptions?: { key?: string; merge?: boolean };
}

export interface ActionOptions<T, R> {
    action: (data: T) => Promise<R>;
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
    invalidate?: string[];
}

export interface TransitionState {
    pending: boolean;
    start: (fn: () => void) => void;
}

// ============================================================================
// SIGNAL INTEROP
// ============================================================================

/**
 * Convert a PhilJS signal to a SolidJS accessor/setter pair
 *
 * @example
 * ```tsx
 * import { signal } from '@philjs/core';
 * import { toSolid } from '@philjs/solid';
 *
 * const philCount = signal(0);
 * const [count, setCount] = toSolid(philCount);
 *
 * // Use in Solid component
 * <div>{count()}</div>
 * <button onClick={() => setCount(c => c + 1)}>Increment</button>
 * ```
 */
export function toSolid<T>(
    philSignal: PhilJSSignal<T>
): [Accessor<T>, Setter<T>] {
    const [solidValue, setSolidValue] = createSolidSignal(philSignal());

    // Subscribe to PhilJS signal changes
    const unsubscribe = philSignal.subscribe((newValue) => {
        setSolidValue(() => newValue);
    });

    // Cleanup on disposal
    onCleanup(unsubscribe);

    // Create setter that updates both
    const setter: Setter<T> = (valueOrFn: T | ((prev: T) => T)) => {
        const newValue = typeof valueOrFn === 'function'
            ? (valueOrFn as (prev: T) => T)(philSignal())
            : valueOrFn;
        philSignal.set(newValue);
        setSolidValue(() => newValue);
        return newValue;
    };

    return [solidValue, setter as Setter<T>];
}

/**
 * Convert a PhilJS signal to a read-only SolidJS accessor
 */
export function toSolidReadonly<T>(philSignal: PhilJSSignal<T>): Accessor<T> {
    const [solidValue, setSolidValue] = createSolidSignal(philSignal());

    const unsubscribe = philSignal.subscribe((newValue) => {
        setSolidValue(() => newValue);
    });

    onCleanup(unsubscribe);

    return solidValue;
}

/**
 * Convert a SolidJS accessor to a PhilJS-style readable signal
 *
 * @example
 * ```tsx
 * import { createSignal } from 'solid-js';
 * import { fromSolid } from '@philjs/solid';
 *
 * const [count, setCount] = createSignal(0);
 * const philCount = fromSolid(count);
 *
 * // Use in PhilJS context
 * console.log(philCount()); // Read value
 * ```
 */
export function fromSolid<T>(accessor: Accessor<T>): PhilJSSignal<T> {
    // Create a phantom PhilJS signal
    const subscribers = new Set<(value: T) => void>();

    // Track changes using Solid effect
    createSolidEffect(() => {
        const value = accessor();
        subscribers.forEach((cb) => cb(value));
    });

    const signal: PhilJSSignal<T> = Object.assign(
        () => accessor(),
        {
            set: (_value: T | ((prev: T) => T)) => {
                console.warn('fromSolid creates a read-only signal. Use the original Solid setter.');
            },
            update: (_fn: (prev: T) => T) => {
                console.warn('fromSolid creates a read-only signal. Use the original Solid setter.');
            },
            subscribe: (callback: (value: T) => void) => {
                subscribers.add(callback);
                return () => subscribers.delete(callback);
            },
        }
    );

    return signal;
}

/**
 * Convert a SolidJS accessor/setter pair to a PhilJS signal
 */
export function fromSolidPair<T>(
    accessor: Accessor<T>,
    setter: Setter<T>
): PhilJSSignal<T> {
    const subscribers = new Set<(value: T) => void>();

    createSolidEffect(() => {
        const value = accessor();
        subscribers.forEach((cb) => cb(value));
    });

    const signal: PhilJSSignal<T> = Object.assign(
        () => accessor(),
        {
            set: (valueOrFn: T | ((prev: T) => T)) => {
                setter(valueOrFn as any);
            },
            update: (fn: (prev: T) => T) => {
                setter((prev) => fn(prev));
            },
            subscribe: (callback: (value: T) => void) => {
                subscribers.add(callback);
                return () => subscribers.delete(callback);
            },
        }
    );

    return signal;
}

/**
 * Create a bridged signal that syncs between PhilJS and Solid
 */
export function createBridgedSignal<T>(
    initialValue: T
): [PhilJSSignal<T>, Accessor<T>, Setter<T>] {
    const [solidValue, setSolidValue] = createSolidSignal(initialValue);
    const subscribers = new Set<(value: T) => void>();

    const philSignal: PhilJSSignal<T> = Object.assign(
        () => solidValue(),
        {
            set: (valueOrFn: T | ((prev: T) => T)) => {
                const newValue = typeof valueOrFn === 'function'
                    ? (valueOrFn as (prev: T) => T)(solidValue())
                    : valueOrFn;
                setSolidValue(() => newValue);
            },
            update: (fn: (prev: T) => T) => {
                setSolidValue((prev) => fn(prev));
            },
            subscribe: (callback: (value: T) => void) => {
                subscribers.add(callback);
                createSolidEffect(() => {
                    callback(solidValue());
                });
                return () => subscribers.delete(callback);
            },
        }
    );

    return [philSignal, solidValue, setSolidValue];
}

// ============================================================================
// COMPUTED INTEROP
// ============================================================================

/**
 * Convert a PhilJS computed to a SolidJS memo
 */
export function computedToMemo<T>(philComputed: PhilJSComputed<T>): Accessor<T> {
    return createSolidMemo(() => philComputed());
}

/**
 * Create a computed that works in both PhilJS and Solid contexts
 */
export function createBridgedComputed<T>(
    fn: () => T
): [PhilJSComputed<T>, Accessor<T>] {
    const solidMemo = createSolidMemo(fn);

    const philComputed: PhilJSComputed<T> = () => solidMemo();

    return [philComputed, solidMemo];
}

// ============================================================================
// EFFECT INTEROP
// ============================================================================

/**
 * Create an effect that runs in both PhilJS and Solid contexts
 */
export function createBridgedEffect(fn: () => void | (() => void)): void {
    createSolidEffect(() => {
        const cleanup = fn();
        if (cleanup) {
            onCleanup(cleanup);
        }
    });
}

/**
 * Run a function untracked (no reactive tracking)
 */
export function runUntracked<T>(fn: () => T): T {
    return untrack(fn);
}

// ============================================================================
// STORE INTEROP
// ============================================================================

export interface SolidStore<T extends object> {
    state: T;
    setState: (path: keyof T | ((state: T) => void), value?: any) => void;
    mutate: (fn: (state: T) => void) => void;
    reset: (initialValue?: T) => void;
}

/**
 * Create a SolidJS store that can be used with PhilJS
 *
 * @example
 * ```tsx
 * const store = createPhilJSStore({
 *   count: 0,
 *   user: { name: 'John' },
 * });
 *
 * // In Solid component
 * <div>{store.state.count}</div>
 * <button onClick={() => store.mutate(s => s.count++)}>Increment</button>
 * ```
 */
export function createPhilJSStore<T extends object>(
    initialValue: T
): SolidStore<T> {
    const [state, setState] = createStore(initialValue);
    const initialState = structuredClone(initialValue);

    return {
        get state() {
            return state;
        },

        setState: (pathOrFn: keyof T | ((state: T) => void), value?: any) => {
            if (typeof pathOrFn === 'function') {
                setState(produce(pathOrFn));
            } else {
                setState(pathOrFn as any, value);
            }
        },

        mutate: (fn: (state: T) => void) => {
            setState(produce(fn));
        },

        reset: (newInitial?: T) => {
            setState(reconcile(newInitial ?? initialState));
        },
    };
}

/**
 * Convert a PhilJS store to a Solid store
 */
export function philStoreToSolid<T extends object>(
    philStore: { get: () => T; set: (value: T) => void; subscribe: (cb: (value: T) => void) => () => void }
): SolidStore<T> {
    const [state, setState] = createStore(philStore.get());

    // Sync from PhilJS to Solid
    const unsubscribe = philStore.subscribe((newValue) => {
        setState(reconcile(newValue));
    });

    onCleanup(unsubscribe);

    return {
        get state() {
            return state;
        },

        setState: (pathOrFn: keyof T | ((state: T) => void), value?: any) => {
            if (typeof pathOrFn === 'function') {
                setState(produce(pathOrFn));
                philStore.set(state);
            } else {
                setState(pathOrFn as any, value);
                philStore.set(state);
            }
        },

        mutate: (fn: (state: T) => void) => {
            setState(produce(fn));
            philStore.set(state);
        },

        reset: () => {
            const initial = philStore.get();
            setState(reconcile(initial));
        },
    };
}

// ============================================================================
// CONTEXT INTEROP
// ============================================================================

export interface BridgedContext<T> {
    Provider: ParentComponent<{ value: T }>;
    useContext: () => T;
    solidContext: ReturnType<typeof createSolidContext<T>>;
}

/**
 * Create a context that works in both PhilJS and Solid
 */
export function createBridgedContext<T>(
    defaultValue: T,
    name?: string
): BridgedContext<T> {
    const solidContext = createSolidContext<T>(defaultValue);

    const Provider: ParentComponent<{ value: T }> = (props) => {
        return solidContext.Provider({
            value: props.value,
            children: props.children,
        });
    };

    const useContext = () => {
        return useSolidContext(solidContext);
    };

    return {
        Provider,
        useContext,
        solidContext,
    };
}

// ============================================================================
// RESOURCE / DATA LOADING
// ============================================================================

/**
 * Create a resource for async data loading
 *
 * @example
 * ```tsx
 * const [user] = createRouteData(() => fetchUser(userId()));
 *
 * return (
 *   <Show when={!user.loading} fallback={<Loading />}>
 *     <UserProfile user={user()} />
 *   </Show>
 * );
 * ```
 */
export function createRouteData<T, S = true>(
    fetcher: S extends true
        ? () => Promise<T>
        : (source: S) => Promise<T>,
    options?: {
        source?: Accessor<S>;
        initialValue?: T;
        name?: string;
    }
): ResourceReturn<T, S> {
    if (options?.source) {
        return createResource(options.source, fetcher as any, {
            initialValue: options.initialValue,
            name: options.name,
        });
    }

    return createResource(fetcher as () => Promise<T>, {
        initialValue: options?.initialValue,
        name: options?.name,
    });
}

/**
 * Create a route data loader with caching
 */
export function createCachedRouteData<T>(
    fetcher: () => Promise<T>,
    options?: {
        key?: string;
        ttl?: number;
        initialValue?: T;
    }
): ResourceReturn<T> {
    const cache = new Map<string, { data: T; timestamp: number }>();
    const key = options?.key ?? 'default';
    const ttl = options?.ttl ?? 60000;

    const cachedFetcher = async () => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }

        const data = await fetcher();
        cache.set(key, { data, timestamp: Date.now() });
        return data;
    };

    return createResource(cachedFetcher, {
        initialValue: options?.initialValue,
    });
}

/**
 * Create a deferred resource that doesn't block SSR
 */
export function createDeferredData<T>(
    fetcher: () => Promise<T>,
    options?: { initialValue?: T }
): ResourceReturn<T> {
    return createResource(fetcher, {
        initialValue: options?.initialValue,
        deferStream: true,
    });
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export interface ActionState<T, R> {
    pending: Accessor<boolean>;
    error: Accessor<Error | null>;
    result: Accessor<R | undefined>;
    submit: (data: T) => Promise<R>;
    reset: () => void;
}

/**
 * Create a server action for mutations
 *
 * @example
 * ```tsx
 * const createUser = createServerAction(async (userData: UserInput) => {
 *   const response = await fetch('/api/users', {
 *     method: 'POST',
 *     body: JSON.stringify(userData),
 *   });
 *   return response.json();
 * });
 *
 * return (
 *   <form onSubmit={(e) => {
 *     e.preventDefault();
 *     createUser.submit({ name: 'John' });
 *   }}>
 *     <Show when={createUser.pending()}>Submitting...</Show>
 *     <Show when={createUser.error()}>{createUser.error()?.message}</Show>
 *   </form>
 * );
 * ```
 */
export function createServerAction<T, R = void>(
    action: (data: T) => Promise<R>,
    options?: {
        onSuccess?: (result: R) => void;
        onError?: (error: Error) => void;
        onSettled?: () => void;
    }
): ActionState<T, R> {
    const [pending, setPending] = createSolidSignal(false);
    const [error, setError] = createSolidSignal<Error | null>(null);
    const [result, setResult] = createSolidSignal<R | undefined>(undefined);

    const submit = async (data: T): Promise<R> => {
        setPending(true);
        setError(null);

        try {
            const actionResult = await action(data);
            setResult(() => actionResult);
            options?.onSuccess?.(actionResult);
            return actionResult;
        } catch (e) {
            const err = e as Error;
            setError(err);
            options?.onError?.(err);
            throw err;
        } finally {
            setPending(false);
            options?.onSettled?.();
        }
    };

    const reset = () => {
        setPending(false);
        setError(null);
        setResult(undefined);
    };

    return {
        pending,
        error,
        result,
        submit,
        reset,
    };
}

/**
 * Create a form action handler
 */
export function createFormAction<R = void>(
    action: (formData: FormData) => Promise<R>,
    options?: {
        onSuccess?: (result: R) => void;
        onError?: (error: Error) => void;
    }
): {
    pending: Accessor<boolean>;
    error: Accessor<Error | null>;
    result: Accessor<R | undefined>;
    handleSubmit: (e: Event) => Promise<void>;
} {
    const [pending, setPending] = createSolidSignal(false);
    const [error, setError] = createSolidSignal<Error | null>(null);
    const [result, setResult] = createSolidSignal<R | undefined>(undefined);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        setPending(true);
        setError(null);

        try {
            const actionResult = await action(formData);
            setResult(() => actionResult);
            options?.onSuccess?.(actionResult);
        } catch (err) {
            setError(err as Error);
            options?.onError?.(err as Error);
        } finally {
            setPending(false);
        }
    };

    return {
        pending,
        error,
        result,
        handleSubmit,
    };
}

// ============================================================================
// TRANSITION SUPPORT
// ============================================================================

/**
 * Create a transition for non-blocking updates
 */
export function createTransition(): TransitionState {
    const [pending, setPending] = createSolidSignal(false);

    const start = (fn: () => void) => {
        setPending(true);
        // Use queueMicrotask for transition-like behavior
        queueMicrotask(() => {
            fn();
            setPending(false);
        });
    };

    return {
        get pending() {
            return pending();
        },
        start,
    };
}

/**
 * Wrap a callback in a transition
 */
export function startTransition(fn: () => void): void {
    queueMicrotask(fn);
}

// ============================================================================
// COMPONENT WRAPPERS
// ============================================================================

export interface PhilJSComponentOptions<P> {
    props?: P;
    onMount?: () => void;
    onCleanup?: () => void;
}

/**
 * Wrap a PhilJS component to work in Solid
 */
export function wrapPhilJSComponent<P extends object>(
    philComponent: (props: P) => unknown,
    options?: { forwardRef?: boolean }
): Component<P> {
    return (props: P) => {
        onMount(() => {
            // PhilJS mount lifecycle
        });

        onCleanup(() => {
            // PhilJS cleanup lifecycle
        });

        // Render the PhilJS component
        return philComponent(props) as JSX.Element;
    };
}

/**
 * Wrap a Solid component to work in PhilJS
 */
export function wrapSolidComponent<P extends object>(
    solidComponent: Component<P>
): (props: P) => unknown {
    return (props: P) => {
        return solidComponent(props);
    };
}

/**
 * Create a lazy-loaded component
 */
export function createLazyComponent<P extends object>(
    loader: () => Promise<{ default: Component<P> }>
): Component<P> {
    let Component: Component<P> | null = null;
    let promise: Promise<void> | null = null;

    return (props: P) => {
        if (!Component) {
            if (!promise) {
                promise = loader().then((mod) => {
                    Component = mod.default;
                });
            }
            throw promise;
        }

        return Component(props);
    };
}

// ============================================================================
// SSR UTILITIES
// ============================================================================

export interface SSRContext {
    tags: string[];
    scripts: string[];
    styles: string[];
}

/**
 * Create SSR context for server rendering
 */
export function createSSRContext(): SSRContext {
    return {
        tags: [],
        scripts: [],
        styles: [],
    };
}

/**
 * Add meta tag during SSR
 */
export function useHead(tag: { title?: string; meta?: Record<string, string>[] }): void {
    // This would integrate with Solid's <Head> component
    if (tag.title) {
        if (typeof document !== 'undefined') {
            document.title = tag.title;
        }
    }
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
    return typeof window === 'undefined';
}

/**
 * Check if running on client
 */
export function isClient(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Run code only on the client
 */
export function clientOnly<T>(fn: () => T): T | undefined {
    if (isClient()) {
        return fn();
    }
    return undefined;
}

/**
 * Run code only on the server
 */
export function serverOnly<T>(fn: () => T): T | undefined {
    if (isServer()) {
        return fn();
    }
    return undefined;
}

// ============================================================================
// ROUTER HELPERS
// ============================================================================

export interface RouteParams {
    [key: string]: string;
}

export interface RouteMatch {
    path: string;
    params: RouteParams;
}

/**
 * Create route params from URL
 */
export function createRouteParams(
    url: string,
    pattern: string
): RouteParams | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const urlParts = url.split('/').filter(Boolean);

    if (patternParts.length !== urlParts.length) {
        return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const urlPart = urlParts[i];

        if (patternPart?.startsWith(':')) {
            const paramName = patternPart.slice(1);
            params[paramName] = urlPart!;
        } else if (patternPart !== urlPart) {
            return null;
        }
    }

    return params;
}

/**
 * Navigate using history API
 */
export function navigate(
    path: string,
    options?: { replace?: boolean; state?: unknown }
): void {
    if (isClient()) {
        if (options?.replace) {
            window.history.replaceState(options.state, '', path);
        } else {
            window.history.pushState(options?.state, '', path);
        }
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}

/**
 * Create a navigation guard
 */
export function createNavigationGuard(
    guard: (from: string, to: string) => boolean | Promise<boolean>
): () => void {
    if (!isClient()) return () => {};

    const handler = async (e: PopStateEvent) => {
        const allowed = await guard(window.location.pathname, window.location.pathname);
        if (!allowed) {
            e.preventDefault();
        }
    };

    window.addEventListener('popstate', handler);

    return () => {
        window.removeEventListener('popstate', handler);
    };
}

// ============================================================================
// SUSPENSE HELPERS
// ============================================================================

/**
 * Create a suspense boundary with fallback
 */
export const SuspenseBoundary: ParentComponent<{
    fallback: JSX.Element;
}> = (props) => {
    return Suspense({
        fallback: props.fallback,
        children: props.children,
    });
};

/**
 * Create an error boundary with fallback
 */
export const ErrorBoundaryComponent: ParentComponent<{
    fallback: (err: Error, reset: () => void) => JSX.Element;
}> = (props) => {
    return ErrorBoundary({
        fallback: props.fallback,
        children: props.children,
    });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Use previous value
 */
export function usePrevious<T>(value: Accessor<T>): Accessor<T | undefined> {
    const [previous, setPrevious] = createSolidSignal<T | undefined>(undefined);

    createSolidEffect((prev: T | undefined) => {
        setPrevious(() => prev);
        return value();
    }, undefined);

    return previous;
}

/**
 * Use debounced value
 */
export function useDebounce<T>(
    value: Accessor<T>,
    delay: number
): Accessor<T> {
    const [debounced, setDebounced] = createSolidSignal(value());

    createSolidEffect(() => {
        const timeout = setTimeout(() => {
            setDebounced(() => value());
        }, delay);

        onCleanup(() => clearTimeout(timeout));
    });

    return debounced;
}

/**
 * Use throttled value
 */
export function useThrottle<T>(
    value: Accessor<T>,
    delay: number
): Accessor<T> {
    const [throttled, setThrottled] = createSolidSignal(value());
    let lastCall = 0;

    createSolidEffect(() => {
        const now = Date.now();
        const currentValue = value();

        if (now - lastCall >= delay) {
            lastCall = now;
            setThrottled(() => currentValue);
        }
    });

    return throttled;
}

/**
 * Use mounted state
 */
export function useMounted(): Accessor<boolean> {
    const [mounted, setMounted] = createSolidSignal(false);

    onMount(() => setMounted(true));

    return mounted;
}

/**
 * Use media query
 */
export function useMediaQuery(query: string): Accessor<boolean> {
    const [matches, setMatches] = createSolidSignal(false);

    onMount(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mediaQuery.addEventListener('change', handler);

        onCleanup(() => mediaQuery.removeEventListener('change', handler));
    });

    return matches;
}

/**
 * Use preferred color scheme
 */
export function usePrefersDark(): Accessor<boolean> {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Use window size
 */
export function useWindowSize(): {
    width: Accessor<number>;
    height: Accessor<number>;
} {
    const [width, setWidth] = createSolidSignal(isClient() ? window.innerWidth : 0);
    const [height, setHeight] = createSolidSignal(isClient() ? window.innerHeight : 0);

    onMount(() => {
        const handler = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        };

        window.addEventListener('resize', handler);
        onCleanup(() => window.removeEventListener('resize', handler));
    });

    return { width, height };
}

/**
 * Use intersection observer
 */
export function useIntersection(
    target: Accessor<Element | null>,
    options?: IntersectionObserverInit
): Accessor<boolean> {
    const [isIntersecting, setIsIntersecting] = createSolidSignal(false);

    createSolidEffect(() => {
        const element = target();
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry?.isIntersecting ?? false);
            },
            options
        );

        observer.observe(element);
        onCleanup(() => observer.disconnect());
    });

    return isIntersecting;
}

/**
 * Use local storage
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [Accessor<T>, (value: T) => void] {
    const getStoredValue = (): T => {
        if (!isClient()) return initialValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    };

    const [value, setValue] = createSolidSignal<T>(getStoredValue());

    const setStoredValue = (newValue: T) => {
        setValue(() => newValue);
        if (isClient()) {
            localStorage.setItem(key, JSON.stringify(newValue));
        }
    };

    return [value, setStoredValue];
}

/**
 * Use session storage
 */
export function useSessionStorage<T>(
    key: string,
    initialValue: T
): [Accessor<T>, (value: T) => void] {
    const getStoredValue = (): T => {
        if (!isClient()) return initialValue;
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    };

    const [value, setValue] = createSolidSignal<T>(getStoredValue());

    const setStoredValue = (newValue: T) => {
        setValue(() => newValue);
        if (isClient()) {
            sessionStorage.setItem(key, JSON.stringify(newValue));
        }
    };

    return [value, setStoredValue];
}

// ============================================================================
// BATCH UTILITIES
// ============================================================================

/**
 * Batch multiple updates together
 */
export function batchUpdates(fn: () => void): void {
    solidBatch(fn);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
    // Solid primitives
    createSolidSignal,
    createSolidEffect,
    createSolidMemo,
    createResource,
    createStore,
    produce,
    reconcile,
    onCleanup,
    onMount,
    untrack,
    // Solid components
    Suspense,
    ErrorBoundary,
    Show,
    For,
    Switch,
    Match,
    Index,
    Portal,
    Dynamic,
    // Solid types
    type Accessor,
    type Setter,
    type Resource,
    type Component,
    type ParentComponent,
    type JSX,
};
