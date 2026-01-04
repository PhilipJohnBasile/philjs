/**
 * Router context management - separate module to avoid circular dependencies
 */
import type { RouterContextType } from "./types.js";
/**
 * Get the current router context.
 * Returns null if not within a Router.
 */
export declare function getRouterContext(): RouterContextType | null;
/**
 * Set the router context (internal use only).
 */
export declare function setRouterContext(context: RouterContextType | null): void;
//# sourceMappingURL=context.d.ts.map