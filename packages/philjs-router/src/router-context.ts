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
// Types
// ============================================================================

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
export type ContextMiddleware<T extends RouterContext = RouterContext> = (
  context: T,
  options: {
    route: string;
    params: Record<string, string>;
    request?: Request;
  }
) => T | Promise<T>;

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

// ============================================================================
// State Management
// ============================================================================

/**
 * Global router context.
 */
const globalContextSignal = signal<RouterContext>({});

/**
 * Route-specific context overrides.
 */
const routeContextOverridesSignal = signal<Map<string, Partial<RouterContext>>>(
  new Map()
);

/**
 * Context providers.
 */
const contextProvidersSignal = signal<Map<string, ContextProvider>>(new Map());

/**
 * Context middleware stack.
 */
const contextMiddlewareSignal = signal<ContextMiddleware[]>([]);

/**
 * Context configuration.
 */
const contextConfigSignal = signal<RouterContextConfig>({
  freeze: false,
  strict: false,
});

/**
 * Context cache for providers.
 */
const contextCacheSignal = signal<Map<string, unknown>>(new Map());

/**
 * Current route context (global + route overrides).
 */
const currentRouteContextSignal = signal<RouterContext>({});

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize router context.
 */
export function initRouterContext(config?: RouterContextConfig): void {
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
export function setGlobalContext<T extends RouterContext>(context: T): void {
  const config = contextConfigSignal();

  let finalContext = { ...context };

  // Validate context
  if (config.validators) {
    for (const [key, validator] of Object.entries(config.validators)) {
      if (key in finalContext) {
        const isValid = validator.validate(finalContext[key]);
        if (!isValid) {
          throw new Error(
            validator.errorMessage ||
              `Context validation failed for key: ${key}`
          );
        }
      }
    }
  }

  // Freeze if configured
  if (config.freeze) {
    finalContext = Object.freeze(finalContext) as T;
  }

  globalContextSignal.set(finalContext);
  updateCurrentRouteContext();
}

/**
 * Update a specific value in the global context.
 */
export function updateGlobalContext<K extends keyof RouterContext>(
  key: K,
  value: RouterContext[K]
): void {
  const context = globalContextSignal();
  setGlobalContext({ ...context, [key]: value });
}

/**
 * Update multiple values in the global context.
 */
export function updateGlobalContextMultiple(
  updates: Partial<RouterContext>
): void {
  const context = globalContextSignal();
  setGlobalContext({ ...context, ...updates });
}

/**
 * Get the global router context.
 */
export function getGlobalContext<T extends RouterContext = RouterContext>(): T {
  return globalContextSignal() as T;
}

/**
 * Get a specific value from global context.
 */
export function getGlobalContextValue<T = unknown>(key: string): T | undefined {
  return globalContextSignal()[key] as T | undefined;
}

/**
 * Register a context provider.
 */
export function registerContextProvider<T = unknown>(
  provider: ContextProvider<T>
): void {
  const providers = contextProvidersSignal();
  providers.set(provider.key, provider as ContextProvider);
  contextProvidersSignal.set(new Map(providers));
}

/**
 * Unregister a context provider.
 */
export function unregisterContextProvider(key: string): void {
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
export async function computeProvidedContext(): Promise<RouterContext> {
  const providers = contextProvidersSignal();
  const cache = contextCacheSignal();
  const context: RouterContext = {};

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
export function registerRouteContextOverride(
  override: RouteContextOverride
): void {
  const overrides = routeContextOverridesSignal();
  const key =
    typeof override.route === "string"
      ? override.route
      : override.route.source;
  overrides.set(key, override.context);
  routeContextOverridesSignal.set(new Map(overrides));
}

/**
 * Unregister a route context override.
 */
export function unregisterRouteContextOverride(route: string | RegExp): void {
  const overrides = routeContextOverridesSignal();
  const key = typeof route === "string" ? route : route.source;
  overrides.delete(key);
  routeContextOverridesSignal.set(new Map(overrides));
}

/**
 * Get context for a specific route.
 */
export function getRouteContext<T extends RouterContext = RouterContext>(
  route: string
): T {
  const globalContext = globalContextSignal();
  const overrides = routeContextOverridesSignal();

  let routeContext = { ...globalContext };

  // Apply matching overrides
  for (const [pattern, overrideContext] of overrides.entries()) {
    if (matchesRoutePattern(route, pattern)) {
      routeContext = { ...routeContext, ...overrideContext };
    }
  }

  return routeContext as T;
}

/**
 * Set context for the current route.
 */
export function setCurrentRouteContext<T extends RouterContext>(
  route: string,
  additionalContext?: Partial<T>
): void {
  const routeContext = getRouteContext(route);
  const finalContext = { ...routeContext, ...additionalContext };

  currentRouteContextSignal.set(finalContext);
}

/**
 * Get the current route context.
 */
export function getCurrentRouteContext<
  T extends RouterContext = RouterContext
>(): T {
  return currentRouteContextSignal() as T;
}

/**
 * Add context middleware.
 */
export function addContextMiddleware(middleware: ContextMiddleware): void {
  const middlewares = contextMiddlewareSignal();
  contextMiddlewareSignal.set([...middlewares, middleware]);
}

/**
 * Remove context middleware.
 */
export function removeContextMiddleware(middleware: ContextMiddleware): void {
  const middlewares = contextMiddlewareSignal();
  contextMiddlewareSignal.set(middlewares.filter((mw) => mw !== middleware));
}

/**
 * Apply context middleware.
 */
export async function applyContextMiddleware<
  T extends RouterContext = RouterContext
>(
  context: T,
  options: {
    route: string;
    params: Record<string, string>;
    request?: Request;
  }
): Promise<T> {
  const middlewares = contextMiddlewareSignal();
  let processedContext = context;

  for (const middleware of middlewares) {
    processedContext = (await middleware(processedContext, options)) as T;
  }

  return processedContext;
}

/**
 * Clear context cache.
 */
export function clearContextCache(key?: string): void {
  const cache = contextCacheSignal();

  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }

  contextCacheSignal.set(new Map(cache));
}

/**
 * Reset all router context.
 */
export function resetRouterContext(): void {
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
export function useRouterContext<
  T extends RouterContext = RouterContext
>(): T {
  return currentRouteContextSignal() as T;
}

/**
 * Hook to access a specific context value.
 */
export function useRouterContextValue<T = unknown>(key: string): T {
  const context = currentRouteContextSignal();
  const config = contextConfigSignal();

  if (config.strict && !(key in context)) {
    throw new Error(
      `[RouterContext] Key "${key}" not found in context (strict mode enabled)`
    );
  }

  return context[key] as T;
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
export function createTypedContext<T extends RouterContext>() {
  return {
    Provider: (props: { value: T; children?: any }) => {
      setGlobalContext(props.value);
      return props.children;
    },
    useContext: (): T => useRouterContext<T>(),
    useValue: <K extends keyof T>(key: K): T[K] =>
      useRouterContextValue<T[K]>(key as string),
  };
}

/**
 * Create a context provider with type inference.
 */
export function defineContextProvider<T>(
  key: string,
  provide: () => T | Promise<T>,
  options?: Omit<ContextProvider<T>, "key" | "provide">
): ContextProvider<T> {
  return {
    key,
    provide,
    ...options,
  };
}

/**
 * Create a context middleware with type inference.
 */
export function defineContextMiddleware<T extends RouterContext>(
  middleware: ContextMiddleware<T>
): ContextMiddleware<T> {
  return middleware;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Update current route context when global context changes.
 */
function updateCurrentRouteContext(): void {
  const global = globalContextSignal();
  const current = currentRouteContextSignal();

  // Preserve route-specific overrides
  currentRouteContextSignal.set({ ...global, ...current });
}

/**
 * Match a route against a pattern.
 */
function matchesRoutePattern(route: string, pattern: string): boolean {
  if (pattern.includes("*")) {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\//g, "\\/") + "$"
    );
    return regex.test(route);
  }
  return route === pattern;
}

/**
 * Validate context against schema.
 */
export function validateContext(
  context: RouterContext,
  validators: Record<string, ContextValidator>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(validators)) {
    if (key in context) {
      const isValid = validator.validate(context[key]);
      if (!isValid) {
        errors.push(
          validator.errorMessage || `Validation failed for key: ${key}`
        );
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
export function mergeContexts(...contexts: RouterContext[]): RouterContext {
  return Object.assign({}, ...contexts);
}

/**
 * Deep clone context.
 * Uses ES2024 structuredClone for better performance and type support.
 */
export function cloneContext<T extends RouterContext>(context: T): T {
  return structuredClone(context);
}

/**
 * Check if context has a key.
 */
export function hasContextKey(key: string): boolean {
  return key in currentRouteContextSignal();
}

/**
 * Get all context keys.
 */
export function getContextKeys(): string[] {
  return Object.keys(currentRouteContextSignal());
}

// ============================================================================
// Built-in Context Providers
// ============================================================================

/**
 * User context provider.
 */
export function createUserContextProvider<T = unknown>(
  fetchUser: () => Promise<T>
): ContextProvider<T> {
  return defineContextProvider("user", fetchUser, {
    cache: true,
    scope: "global",
  });
}

/**
 * Theme context provider.
 */
export function createThemeContextProvider(
  getTheme: () => "light" | "dark" | "system" = () => "system"
): ContextProvider<"light" | "dark" | "system"> {
  return defineContextProvider("theme", getTheme, {
    cache: false,
    scope: "global",
  });
}

/**
 * Locale context provider.
 */
export function createLocaleContextProvider(
  getLocale: () => string = () => "en-US"
): ContextProvider<string> {
  return defineContextProvider("locale", getLocale, {
    cache: false,
    scope: "global",
  });
}

/**
 * API client context provider.
 */
export function createApiContextProvider<T = unknown>(
  createClient: () => T
): ContextProvider<T> {
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
export function createLoggingContextMiddleware(): ContextMiddleware {
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
export function createTransformContextMiddleware<T extends RouterContext>(
  transform: (context: T) => T
): ContextMiddleware<T> {
  return (context) => transform(context as T);
}

/**
 * Filter middleware for context.
 */
export function createFilterContextMiddleware(
  filter: (key: string, value: unknown) => boolean
): ContextMiddleware {
  return (context) => {
    const filtered: RouterContext = {};
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
export function exportContextState(): string {
  return JSON.stringify(
    {
      global: globalContextSignal(),
      current: currentRouteContextSignal(),
      providers: Array.from(contextProvidersSignal().entries()).map(
        ([key, provider]) => ({
          key,
          cache: provider.cache,
          scope: provider.scope,
        })
      ),
      overrides: Array.from(routeContextOverridesSignal().entries()),
      config: contextConfigSignal(),
    },
    null,
    2
  );
}

/**
 * Expose to window for debugging.
 */
if (typeof window !== "undefined") {
  (window as any).__PHILJS_ROUTER_CONTEXT__ = {
    getGlobal: getGlobalContext,
    getCurrent: getCurrentRouteContext,
    getDebugInfo: getRouterContextDebugInfo,
    exportState: exportContextState,
  };
}
