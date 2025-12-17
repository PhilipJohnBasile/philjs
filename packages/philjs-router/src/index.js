/**
 * File-based routing for PhilJS.
 */
export { discoverRoutes, matchRoute } from "./discovery.js";
export { findLayouts, applyLayouts } from "./layouts.js";
// High-level router API
export { createAppRouter, useRouter, useRoute, Link, RouterView, createRouteManifest, createRouteMatcher, generateRouteTypes, } from "./high-level.js";
// Smart Preloading
export { SmartPreloader, initSmartPreloader, getSmartPreloader, usePreload, preloadLink, calculateClickIntent, predictNextRoute, } from "./smart-preload.js";
// View Transitions
export { ViewTransitionManager, initViewTransitions, getViewTransitionManager, navigateWithTransition, markSharedElement, transitionLink, supportsViewTransitions, animateFallback, } from "./view-transitions.js";
/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export function createRouter(manifest) {
    return { manifest };
}
//# sourceMappingURL=index.js.map