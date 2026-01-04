/**
 * Router integration for lazy loading
 */
import type { LazyHandler } from '../types.js';
/**
 * Lazy route loader
 */
export interface LazyRoute {
    path: string;
    loader?: LazyHandler;
    action?: LazyHandler;
    component?: LazyHandler;
    children?: LazyRoute[];
}
/**
 * Create a lazy route
 */
export declare function lazyRoute(config: {
    path: string;
    loader?: () => any;
    action?: (...args: any[]) => any;
    component?: () => any;
    children?: LazyRoute[];
}): LazyRoute;
/**
 * Load a route's component
 */
export declare function loadRouteComponent(route: LazyRoute): Promise<any>;
/**
 * Load a route's loader
 */
export declare function loadRouteLoader(route: LazyRoute, ...args: any[]): Promise<any>;
/**
 * Load a route's action
 */
export declare function loadRouteAction(route: LazyRoute, ...args: any[]): Promise<any>;
/**
 * Prefetch a route
 */
export declare function prefetchRoute(route: LazyRoute): Promise<void>;
/**
 * Route matcher with lazy loading
 */
export declare class LazyRouteManager {
    private routes;
    private prefetchedRoutes;
    addRoute(route: LazyRoute): void;
    matchRoute(path: string): Promise<LazyRoute | null>;
    private matchPath;
    prefetchAll(): Promise<void>;
}
//# sourceMappingURL=router.d.ts.map