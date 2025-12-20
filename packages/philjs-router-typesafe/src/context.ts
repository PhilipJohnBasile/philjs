/**
 * Router context management - separate module to avoid circular dependencies
 */

import type { RouterContextType } from "./types.js";

/**
 * Global router context storage.
 * Using a simple variable since PhilJS doesn't have React-style context.
 */
let routerContext: RouterContextType | null = null;

/**
 * Get the current router context.
 * Returns null if not within a Router.
 */
export function getRouterContext(): RouterContextType | null {
  return routerContext;
}

/**
 * Set the router context (internal use only).
 */
export function setRouterContext(context: RouterContextType | null): void {
  routerContext = context;
}
