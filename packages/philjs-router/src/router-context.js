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
import { signal } from "@philjs/core";
// ============================================================================
// State Management
// ============================================================================
/**
 * Global router context.
 */
const globalContextSignal = signal({});
/**
 * Route-specific context overrides.
 */
const routeContextOverridesSignal = signal(new Map());
/**
 * Context providers.
 */
const contextProvidersSignal = signal(new Map());
/**
 * Context middleware stack.
 */
const contextMiddlewareSignal = signal([]);
/**
 * Context configuration.
 */
const contextConfigSignal = signal({
    freeze: false,
    strict: false,
});
/**
 * Context cache for providers.
 */
const contextCacheSignal = signal(new Map());
/**
 * Current route context (global + route overrides).
 */
const currentRouteContextSignal = signal({});
// ============================================================================
// Public API
// ============================================================================
/**
 * Initialize router context.
 */
export function initRouterContext(config) {
    const currentConfig = contextConfigSignal();
    contextConfigSignal.set({ ...currentConfig, ...config });
    if (config?.initialContext) {
        setGlobalContext(config.initialContext);
    }
    if (config?.providers) {
        for (const provider of config.providers) {
            registerContextProvider(provider);
        }
    }
    if (config?.overrides) {
        for (const override of config.overrides) {
            registerRouteContextOverride(override);
        }
    }
    if (config?.middleware) {
        for (const mw of config.middleware) {
            addContextMiddleware(mw);
        }
    }
}
/**
 * Set the global router context.
 */
export function setGlobalContext(context) {
    const config = contextConfigSignal();
    let finalContext = { ...context };
    // Validate context
    if (config.validators) {
        for (const [key, validator] of Object.entries(config.validators)) {
            if (key in finalContext) {
                const isValid = validator.validate(finalContext[key]);
                if (!isValid) {
                    throw new Error(validator.errorMessage ||
                        `Context validation failed for key: ${key}`);
                }
            }
        }
    }
    // Freeze if configured
    if (config.freeze) {
        finalContext = Object.freeze(finalContext);
    }
    globalContextSignal.set(finalContext);
    updateCurrentRouteContext();
}
/**
 * Update a specific value in the global context.
 */
export function updateGlobalContext(key, value) {
    const context = globalContextSignal();
    setGlobalContext({ ...context, [key]: value });
}
/**
 * Update multiple values in the global context.
 */
export function updateGlobalContextMultiple(updates) {
    const context = globalContextSignal();
    setGlobalContext({ ...context, ...updates });
}
/**
 * Get the global router context.
 */
export function getGlobalContext() {
    return globalContextSignal();
}
/**
 * Get a specific value from global context.
 */
export function getGlobalContextValue(key) {
    return globalContextSignal()[key];
}
/**
 * Register a context provider.
 */
export function registerContextProvider(provider) {
    const providers = contextProvidersSignal();
    providers.set(provider.key, provider);
    contextProvidersSignal.set(new Map(providers));
}
/**
 * Unregister a context provider.
 */
export function unregisterContextProvider(key) {
    const providers = contextProvidersSignal();
    providers.delete(key);
    contextProvidersSignal.set(new Map(providers));
    // Clear cache
    const cache = contextCacheSignal();
    cache.delete(key);
    contextCacheSignal.set(new Map(cache));
}
/**
 * Compute context from all providers.
 */
export async function computeProvidedContext() {
    const providers = contextProvidersSignal();
    const cache = contextCacheSignal();
    const context = {};
    for (const [key, provider] of providers.entries()) {
        // Check cache
        if (provider.cache && cache.has(key)) {
            context[key] = cache.get(key);
            continue;
        }
        // Compute value
        const value = await provider.provide();
        context[key] = value;
        // Cache if enabled
        if (provider.cache) {
            cache.set(key, value);
            contextCacheSignal.set(new Map(cache));
        }
    }
    return context;
}
/**
 * Register a route-specific context override.
 */
export function registerRouteContextOverride(override) {
    const overrides = routeContextOverridesSignal();
    const key = typeof override.route === "string"
        ? override.route
        : override.route.source;
    overrides.set(key, override.context);
    routeContextOverridesSignal.set(new Map(overrides));
}
/**
 * Unregister a route context override.
 */
export function unregisterRouteContextOverride(route) {
    const overrides = routeContextOverridesSignal();
    const key = typeof route === "string" ? route : route.source;
    overrides.delete(key);
    routeContextOverridesSignal.set(new Map(overrides));
}
/**
 * Get context for a specific route.
 */
export function getRouteContext(route) {
    const globalContext = globalContextSignal();
    const overrides = routeContextOverridesSignal();
    let routeContext = { ...globalContext };
    // Apply matching overrides
    for (const [pattern, overrideContext] of overrides.entries()) {
        if (matchesRoutePattern(route, pattern)) {
            routeContext = { ...routeContext, ...overrideContext };
        }
    }
    return routeContext;
}
/**
 * Set context for the current route.
 */
export function setCurrentRouteContext(route, additionalContext) {
    const routeContext = getRouteContext(route);
    const finalContext = { ...routeContext, ...additionalContext };
    currentRouteContextSignal.set(finalContext);
}
/**
 * Get the current route context.
 */
export function getCurrentRouteContext() {
    return currentRouteContextSignal();
}
/**
 * Add context middleware.
 */
export function addContextMiddleware(middleware) {
    const middlewares = contextMiddlewareSignal();
    contextMiddlewareSignal.set([...middlewares, middleware]);
}
/**
 * Remove context middleware.
 */
export function removeContextMiddleware(middleware) {
    const middlewares = contextMiddlewareSignal();
    contextMiddlewareSignal.set(middlewares.filter((mw) => mw !== middleware));
}
/**
 * Apply context middleware.
 */
export async function applyContextMiddleware(context, options) {
    const middlewares = contextMiddlewareSignal();
    let processedContext = context;
    for (const middleware of middlewares) {
        processedContext = (await middleware(processedContext, options));
    }
    return processedContext;
}
/**
 * Clear context cache.
 */
export function clearContextCache(key) {
    const cache = contextCacheSignal();
    if (key) {
        cache.delete(key);
    }
    else {
        cache.clear();
    }
    contextCacheSignal.set(new Map(cache));
}
/**
 * Reset all router context.
 */
export function resetRouterContext() {
    globalContextSignal.set({});
    routeContextOverridesSignal.set(new Map());
    contextProvidersSignal.set(new Map());
    contextMiddlewareSignal.set([]);
    contextConfigSignal.set({ freeze: false, strict: false });
    contextCacheSignal.set(new Map());
    currentRouteContextSignal.set({});
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to access the router context.
 */
export function useRouterContext() {
    return currentRouteContextSignal();
}
/**
 * Hook to access a specific context value.
 */
export function useRouterContextValue(key) {
    const context = currentRouteContextSignal();
    const config = contextConfigSignal();
    if (config.strict && !(key in context)) {
        throw new Error(`[RouterContext] Key "${key}" not found in context (strict mode enabled)`);
    }
    return context[key];
}
/**
 * Hook to update global context.
 */
export function useUpdateRouterContext() {
    return {
        set: setGlobalContext,
        update: updateGlobalContext,
        updateMultiple: updateGlobalContextMultiple,
    };
}
// ============================================================================
// Type-Safe Context Helpers
// ============================================================================
/**
 * Create a typed context.
 */
export function createTypedContext() {
    return {
        Provider: (props) => {
            setGlobalContext(props.value);
            return props.children;
        },
        useContext: () => useRouterContext(),
        useValue: (key) => useRouterContextValue(key),
    };
}
/**
 * Create a context provider with type inference.
 */
export function defineContextProvider(key, provide, options) {
    return {
        key,
        provide,
        ...options,
    };
}
/**
 * Create a context middleware with type inference.
 */
export function defineContextMiddleware(middleware) {
    return middleware;
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Update current route context when global context changes.
 */
function updateCurrentRouteContext() {
    const global = globalContextSignal();
    const current = currentRouteContextSignal();
    // Preserve route-specific overrides
    currentRouteContextSignal.set({ ...global, ...current });
}
/**
 * Match a route against a pattern.
 */
function matchesRoutePattern(route, pattern) {
    if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\//g, "\\/") + "$");
        return regex.test(route);
    }
    return route === pattern;
}
/**
 * Validate context against schema.
 */
export function validateContext(context, validators) {
    const errors = [];
    for (const [key, validator] of Object.entries(validators)) {
        if (key in context) {
            const isValid = validator.validate(context[key]);
            if (!isValid) {
                errors.push(validator.errorMessage || `Validation failed for key: ${key}`);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Merge multiple contexts.
 */
export function mergeContexts(...contexts) {
    return Object.assign({}, ...contexts);
}
/**
 * Deep clone context.
 * Uses ES2024 structuredClone for better performance and type support.
 */
export function cloneContext(context) {
    return structuredClone(context);
}
/**
 * Check if context has a key.
 */
export function hasContextKey(key) {
    return key in currentRouteContextSignal();
}
/**
 * Get all context keys.
 */
export function getContextKeys() {
    return Object.keys(currentRouteContextSignal());
}
// ============================================================================
// Built-in Context Providers
// ============================================================================
/**
 * User context provider.
 */
export function createUserContextProvider(fetchUser) {
    return defineContextProvider("user", fetchUser, {
        cache: true,
        scope: "global",
    });
}
/**
 * Theme context provider.
 */
export function createThemeContextProvider(getTheme = () => "system") {
    return defineContextProvider("theme", getTheme, {
        cache: false,
        scope: "global",
    });
}
/**
 * Locale context provider.
 */
export function createLocaleContextProvider(getLocale = () => "en-US") {
    return defineContextProvider("locale", getLocale, {
        cache: false,
        scope: "global",
    });
}
/**
 * API client context provider.
 */
export function createApiContextProvider(createClient) {
    return defineContextProvider("api", createClient, {
        cache: true,
        scope: "global",
    });
}
// ============================================================================
// Built-in Context Middleware
// ============================================================================
/**
 * Logging middleware for context.
 */
export function createLoggingContextMiddleware() {
    return (context, options) => {
            route: options.route,
            params: options.params,
            contextKeys: Object.keys(context),
        });
        return context;
    };
}
/**
 * Transform middleware for context.
 */
export function createTransformContextMiddleware(transform) {
    return (context) => transform(context);
}
/**
 * Filter middleware for context.
 */
export function createFilterContextMiddleware(filter) {
    return (context) => {
        const filtered = {};
        for (const [key, value] of Object.entries(context)) {
            if (filter(key, value)) {
                filtered[key] = value;
            }
        }
        return filtered;
    };
}
// ============================================================================
// Debug & DevTools Integration
// ============================================================================
/**
 * Get debug information about router context.
 */
export function getRouterContextDebugInfo() {
    return {
        global: globalContextSignal(),
        current: currentRouteContextSignal(),
        providers: Array.from(contextProvidersSignal().keys()),
        overrides: Array.from(routeContextOverridesSignal().keys()),
        middleware: contextMiddlewareSignal().length,
        cache: Array.from(contextCacheSignal().keys()),
        config: contextConfigSignal(),
    };
}
/**
 * Export context state for debugging.
 */
export function exportContextState() {
    return JSON.stringify({
        global: globalContextSignal(),
        current: currentRouteContextSignal(),
        providers: Array.from(contextProvidersSignal().entries()).map(([key, provider]) => ({
            key,
            cache: provider.cache,
            scope: provider.scope,
        })),
        overrides: Array.from(routeContextOverridesSignal().entries()),
        config: contextConfigSignal(),
    }, null, 2);
}
/**
 * Expose to window for debugging.
 */
if (typeof window !== "undefined") {
    window.__PHILJS_ROUTER_CONTEXT__ = {
        getGlobal: getGlobalContext,
        getCurrent: getCurrentRouteContext,
        getDebugInfo: getRouterContextDebugInfo,
        exportState: exportContextState,
    };
}
//# sourceMappingURL=router-context.js.map