/**
 * Router Error Detection and Handling
 *
 * Detects and provides helpful messages for:
 * - Invalid route patterns
 * - Missing route parameters
 * - Route not found errors
 * - Navigation errors
 */
/**
 * Route pattern validation
 */
export interface RoutePattern {
    path: string;
    params: string[];
    isValid: boolean;
    errors: string[];
}
/**
 * Validate route pattern syntax
 */
export declare function validateRoutePattern(pattern: string): RoutePattern;
/**
 * Throw error for invalid route pattern
 */
export declare function throwInvalidRoutePattern(pattern: string, reason: string): never;
/**
 * Validate route pattern and throw if invalid
 */
export declare function ensureValidRoutePattern(pattern: string): RoutePattern;
/**
 * Check if path matches pattern
 */
export declare function matchPath(path: string, pattern: string): {
    matches: boolean;
    params: Record<string, string>;
} | null;
/**
 * Extract required parameters from pattern
 */
export declare function getRequiredParams(pattern: string): string[];
/**
 * Validate navigation parameters
 */
export declare function validateNavigationParams(pattern: string, providedParams: Record<string, string>): {
    valid: boolean;
    missing: string[];
    extra: string[];
};
/**
 * Throw error for missing route parameter
 */
export declare function throwMissingRouteParameter(pattern: string, paramName: string): never;
/**
 * Build path from pattern and params
 */
export declare function buildPath(pattern: string, params: Record<string, string>): string;
/**
 * Register a route pattern
 */
export declare function registerRoute(pattern: string): void;
/**
 * Unregister a route pattern
 */
export declare function unregisterRoute(pattern: string): void;
/**
 * Check if any route matches path
 */
export declare function findMatchingRoute(path: string): {
    pattern: string;
    params: Record<string, string>;
} | null;
/**
 * Warn about route not found
 */
export declare function warnRouteNotFound(path: string): void;
/**
 * Navigation tracking
 */
interface NavigationEvent {
    from: string;
    to: string;
    timestamp: number;
    success: boolean;
    error?: string;
}
/**
 * Record a navigation event
 */
export declare function recordNavigation(from: string, to: string, success: boolean, error?: string): void;
/**
 * Get navigation history
 */
export declare function getNavigationHistory(): NavigationEvent[];
/**
 * Get recent failed navigations
 */
export declare function getFailedNavigations(): NavigationEvent[];
/**
 * Clear navigation history
 */
export declare function clearNavigationHistory(): void;
/**
 * Get router error statistics
 */
export declare function getRouterErrorStats(): {
    registeredRoutes: number;
    navigationHistory: number;
    failedNavigations: number;
};
/**
 * Clear all router error tracking
 */
export declare function clearRouterErrorTracking(): void;
/**
 * Suggest similar routes
 */
export declare function suggestSimilarRoutes(path: string, maxSuggestions?: number): string[];
export {};
//# sourceMappingURL=router-errors.d.ts.map