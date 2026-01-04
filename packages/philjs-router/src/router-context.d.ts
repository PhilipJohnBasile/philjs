/**
 * Global Router Context for PhilJS Router.
 * Provides type-safe context injection available to all routes.
 *
 * @example
 * ```tsx
 * // app.tsx - Set up global context
 * const router = createAppRouter({
 *   routes,
 *   context: {
 *     user: currentUser,
 *     theme: 'dark',
 *     api: apiClient,
 *   },
 * });
 *
 * // route.tsx - Access context in any route
 * export function loader({ context }) {
 *   const { user, api } = context;
 *   return api.fetchData(user.id);
 * }
 *
 * export default function Route() {
 *   const context = useRouterContext();
 *   return <div>Hello {context.user.name}</div>;
 * }
 * ```
 */
/**
 * Router context map.
 */
export type RouterContext = Record<string, unknown>;
/**
 * Type-safe context definition.
 */
export type TypedRouterContext<T extends RouterContext = RouterContext> = T;
/**
 * Context provider configuration.
 */
export type ContextProvider<T = unknown> = {
    /** Unique key for this context */
    key: string;
    /** Function to provide the context value */
    provide: () => T | Promise<T>;
    /** Whether to cache the value */
    cache?: boolean;
    /** Dependencies that trigger re-computation */
    deps?: unknown[];
    /** Scope of the context */
    scope?: "global" | "route" | "request";
};
/**
 * Context override for specific routes.
 */
export type RouteContextOverride = {
    /** Route ID or pattern */
    route: string | RegExp;
    /** Context values to override */
    context: Partial<RouterContext>;
    /** Whether to merge with parent context */
    merge?: boolean;
};
/**
 * Context middleware.
 */
export type ContextMiddleware<T extends RouterContext = RouterContext> = (context: T, options: {
    route: string;
    params: Record<string, string>;
    request?: Request;
}) => T | Promise<T>;
/**
 * Context validation rule.
 */
export type ContextValidator<T = unknown> = {
    /** Validation function */
    validate: (value: T) => boolean | Promise<boolean>;
    /** Error message if validation fails */
    errorMessage?: string;
};
/**
 * Context configuration.
 */
export type RouterContextConfig = {
    /** Initial context values */
    initialContext?: RouterContext;
    /** Context providers */
    providers?: ContextProvider[];
    /** Route-specific overrides */
    overrides?: RouteContextOverride[];
    /** Middleware to transform context */
    middleware?: ContextMiddleware[];
    /** Validators for context values */
    validators?: Record<string, ContextValidator>;
    /** Whether to freeze context (make immutable) */
    freeze?: boolean;
    /** Whether to enable strict mode (throw on missing keys) */
    strict?: boolean;
};
/**
 * Initialize router context.
 */
export declare function initRouterContext(config?: RouterContextConfig): void;
/**
 * Set the global router context.
 */
export declare function setGlobalContext<T extends RouterContext>(context: T): void;
/**
 * Update a specific value in the global context.
 */
export declare function updateGlobalContext<K extends keyof RouterContext>(key: K, value: RouterContext[K]): void;
/**
 * Update multiple values in the global context.
 */
export declare function updateGlobalContextMultiple(updates: Partial<RouterContext>): void;
/**
 * Get the global router context.
 */
export declare function getGlobalContext<T extends RouterContext = RouterContext>(): T;
/**
 * Get a specific value from global context.
 */
export declare function getGlobalContextValue<T = unknown>(key: string): T | undefined;
/**
 * Register a context provider.
 */
export declare function registerContextProvider<T = unknown>(provider: ContextProvider<T>): void;
/**
 * Unregister a context provider.
 */
export declare function unregisterContextProvider(key: string): void;
/**
 * Compute context from all providers.
 */
export declare function computeProvidedContext(): Promise<RouterContext>;
/**
 * Register a route-specific context override.
 */
export declare function registerRouteContextOverride(override: RouteContextOverride): void;
/**
 * Unregister a route context override.
 */
export declare function unregisterRouteContextOverride(route: string | RegExp): void;
/**
 * Get context for a specific route.
 */
export declare function getRouteContext<T extends RouterContext = RouterContext>(route: string): T;
/**
 * Set context for the current route.
 */
export declare function setCurrentRouteContext<T extends RouterContext>(route: string, additionalContext?: Partial<T>): void;
/**
 * Get the current route context.
 */
export declare function getCurrentRouteContext<T extends RouterContext = RouterContext>(): T;
/**
 * Add context middleware.
 */
export declare function addContextMiddleware(middleware: ContextMiddleware): void;
/**
 * Remove context middleware.
 */
export declare function removeContextMiddleware(middleware: ContextMiddleware): void;
/**
 * Apply context middleware.
 */
export declare function applyContextMiddleware<T extends RouterContext = RouterContext>(context: T, options: {
    route: string;
    params: Record<string, string>;
    request?: Request;
}): Promise<T>;
/**
 * Clear context cache.
 */
export declare function clearContextCache(key?: string): void;
/**
 * Reset all router context.
 */
export declare function resetRouterContext(): void;
/**
 * Hook to access the router context.
 */
export declare function useRouterContext<T extends RouterContext = RouterContext>(): T;
/**
 * Hook to access a specific context value.
 */
export declare function useRouterContextValue<T = unknown>(key: string): T;
/**
 * Hook to update global context.
 */
export declare function useUpdateRouterContext(): {
    set: typeof setGlobalContext;
    update: typeof updateGlobalContext;
    updateMultiple: typeof updateGlobalContextMultiple;
};
/**
 * Create a typed context.
 */
export declare function createTypedContext<T extends RouterContext>(): {
    Provider: (props: {
        value: T;
        children?: any;
    }) => any;
    useContext: () => T;
    useValue: <K extends keyof T>(key: K) => T[K];
};
/**
 * Create a context provider with type inference.
 */
export declare function defineContextProvider<T>(key: string, provide: () => T | Promise<T>, options?: Omit<ContextProvider<T>, "key" | "provide">): ContextProvider<T>;
/**
 * Create a context middleware with type inference.
 */
export declare function defineContextMiddleware<T extends RouterContext>(middleware: ContextMiddleware<T>): ContextMiddleware<T>;
/**
 * Validate context against schema.
 */
export declare function validateContext(context: RouterContext, validators: Record<string, ContextValidator>): {
    valid: boolean;
    errors: string[];
};
/**
 * Merge multiple contexts.
 */
export declare function mergeContexts(...contexts: RouterContext[]): RouterContext;
/**
 * Deep clone context.
 * Uses ES2024 structuredClone for better performance and type support.
 */
export declare function cloneContext<T extends RouterContext>(context: T): T;
/**
 * Check if context has a key.
 */
export declare function hasContextKey(key: string): boolean;
/**
 * Get all context keys.
 */
export declare function getContextKeys(): string[];
/**
 * User context provider.
 */
export declare function createUserContextProvider<T = unknown>(fetchUser: () => Promise<T>): ContextProvider<T>;
/**
 * Theme context provider.
 */
export declare function createThemeContextProvider(getTheme?: () => "light" | "dark" | "system"): ContextProvider<"light" | "dark" | "system">;
/**
 * Locale context provider.
 */
export declare function createLocaleContextProvider(getLocale?: () => string): ContextProvider<string>;
/**
 * API client context provider.
 */
export declare function createApiContextProvider<T = unknown>(createClient: () => T): ContextProvider<T>;
/**
 * Logging middleware for context.
 */
export declare function createLoggingContextMiddleware(): ContextMiddleware;
/**
 * Transform middleware for context.
 */
export declare function createTransformContextMiddleware<T extends RouterContext>(transform: (context: T) => T): ContextMiddleware<T>;
/**
 * Filter middleware for context.
 */
export declare function createFilterContextMiddleware(filter: (key: string, value: unknown) => boolean): ContextMiddleware;
/**
 * Get debug information about router context.
 */
export declare function getRouterContextDebugInfo(): {
    global: RouterContext;
    current: RouterContext;
    providers: string[];
    overrides: string[];
    middleware: number;
    cache: string[];
    config: RouterContextConfig;
};
/**
 * Export context state for debugging.
 */
export declare function exportContextState(): string;
//# sourceMappingURL=router-context.d.ts.map