/**
 * File-based routing for PhilJS.
 */

export type RouteModule = {
  loader?: Function;
  action?: Function;
  default?: Function;
  config?: Record<string, unknown>;
};

export type { RouteModule as Route }; // Re-export for convenience

export type { RoutePattern } from "./discovery.js";
export type { LayoutComponent, LayoutChain } from "./layouts.js";
export { discoverRoutes, matchRoute } from "./discovery.js";
export { findLayouts, applyLayouts } from "./layouts.js";

// Smart Preloading
export {
  SmartPreloader,
  initSmartPreloader,
  getSmartPreloader,
  usePreload,
  preloadLink,
  calculateClickIntent,
  predictNextRoute,
} from "./smart-preload.js";
export type { PreloadStrategy, PreloadOptions, UserIntentData } from "./smart-preload.js";

// View Transitions
export {
  ViewTransitionManager,
  initViewTransitions,
  getViewTransitionManager,
  navigateWithTransition,
  markSharedElement,
  transitionLink,
  supportsViewTransitions,
  animateFallback,
} from "./view-transitions.js";
export type {
  TransitionConfig,
  TransitionType,
  ViewTransitionOptions,
  SharedElementOptions,
} from "./view-transitions.js";

/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export function createRouter(manifest) {
  return { manifest };
}
