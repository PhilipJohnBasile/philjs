/**
 * Router context management - separate module to avoid circular dependencies
 */
/**
 * Global router context storage.
 * Using a simple variable since PhilJS doesn't have React-style context.
 */
let routerContext = null;
/**
 * Get the current router context.
 * Returns null if not within a Router.
 */
export function getRouterContext() {
    return routerContext;
}
/**
 * Set the router context (internal use only).
 */
export function setRouterContext(context) {
    routerContext = context;
}
//# sourceMappingURL=context.js.map