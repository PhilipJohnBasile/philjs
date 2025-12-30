/**
 * Router integration for lazy loading
 */

import type { LazyHandler } from '../types.js';
import { loadSymbol } from '../runtime.js';

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
export function lazyRoute(config: {
  path: string;
  loader?: () => any;
  action?: (...args: any[]) => any;
  component?: () => any;
  children?: LazyRoute[];
}): LazyRoute {
  const route: LazyRoute = {
    path: config.path,
    ...(config.children !== undefined && { children: config.children }),
  };

  // Wrap loaders with lazy loading
  if (config.loader) {
    const symbolId = `loader_${config.path.replace(/\//g, '_')}`;
    route.loader = {
      id: symbolId,
      symbolId,
      handler: config.loader,
      loaded: false,
    };
  }

  if (config.action) {
    const symbolId = `action_${config.path.replace(/\//g, '_')}`;
    route.action = {
      id: symbolId,
      symbolId,
      handler: config.action,
      loaded: false,
    };
  }

  if (config.component) {
    const symbolId = `component_${config.path.replace(/\//g, '_')}`;
    route.component = {
      id: symbolId,
      symbolId,
      handler: config.component,
      loaded: false,
    };
  }

  return route;
}

/**
 * Load a route's component
 */
export async function loadRouteComponent(route: LazyRoute): Promise<any> {
  if (!route.component) {
    return null;
  }

  if (route.component.loaded) {
    return route.component.handler;
  }

  const component = await loadSymbol(route.component.symbolId);
  route.component.handler = component;
  route.component.loaded = true;

  return component;
}

/**
 * Load a route's loader
 */
export async function loadRouteLoader(route: LazyRoute, ...args: any[]): Promise<any> {
  if (!route.loader) {
    return null;
  }

  if (!route.loader.loaded) {
    const loader = await loadSymbol(route.loader.symbolId);
    route.loader.handler = loader;
    route.loader.loaded = true;
  }

  return route.loader.handler(...args);
}

/**
 * Load a route's action
 */
export async function loadRouteAction(route: LazyRoute, ...args: any[]): Promise<any> {
  if (!route.action) {
    return null;
  }

  if (!route.action.loaded) {
    const action = await loadSymbol(route.action.symbolId);
    route.action.handler = action;
    route.action.loaded = true;
  }

  return route.action.handler(...args);
}

/**
 * Prefetch a route
 */
export async function prefetchRoute(route: LazyRoute): Promise<void> {
  const promises: Promise<any>[] = [];

  if (route.component) {
    promises.push(loadRouteComponent(route));
  }

  if (route.loader) {
    promises.push(loadSymbol(route.loader.symbolId));
  }

  if (route.action) {
    promises.push(loadSymbol(route.action.symbolId));
  }

  await Promise.all(promises);
}

/**
 * Route matcher with lazy loading
 */
export class LazyRouteManager {
  private routes: LazyRoute[] = [];
  private prefetchedRoutes = new Set<string>();

  addRoute(route: LazyRoute): void {
    this.routes.push(route);
  }

  async matchRoute(path: string): Promise<LazyRoute | null> {
    for (const route of this.routes) {
      if (this.matchPath(route.path, path)) {
        // Prefetch route if not already prefetched
        if (!this.prefetchedRoutes.has(route.path)) {
          await prefetchRoute(route);
          this.prefetchedRoutes.add(route.path);
        }

        return route;
      }
    }

    return null;
  }

  private matchPath(pattern: string, path: string): boolean {
    // Simple path matching (can be enhanced with path-to-regexp)
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$'
    );
    return regex.test(path);
  }

  async prefetchAll(): Promise<void> {
    await Promise.all(this.routes.map((route) => prefetchRoute(route)));
  }
}
