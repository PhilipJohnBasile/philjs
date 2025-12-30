/**
 * File-based routing for PhilJS.
 * Includes Remix-style nested routes, data loading, and error boundaries.
 */
export { discoverRoutes, matchRoute } from "./discovery.js";
export { findLayouts, applyLayouts } from "./layouts.js";
// High-level router API
export { createAppRouter, useRouter, useRoute, Link, RouterView, createRouteManifest, createRouteMatcher, generateRouteTypes, } from "./high-level.js";
// Smart Preloading
export { SmartPreloader, initSmartPreloader, getSmartPreloader, usePreload, preloadLink, calculateClickIntent, predictNextRoute, } from "./smart-preload.js";
// View Transitions (Astro-inspired)
export { 
// Manager
ViewTransitionManager, initViewTransitions, getViewTransitionManager, resetViewTransitions, 
// Navigation
navigateWithTransition, navigate, startViewTransition, 
// Shared Elements
markSharedElement, transitionLink, 
// Support Detection
supportsViewTransitions, prefersReducedMotion, 
// Fallback
animateFallback, 
// Hooks
useViewTransition, useViewTransitionEvent, useTransitionPersist, useTransitionName, 
// Components
ViewTransitionLink, createViewTransitionLink, 
// Utilities
getNavigationDirection, } from "./view-transitions.js";
// Qwik-style Speculative Prefetching
export { PrefetchManager, initPrefetchManager, getPrefetchManager, prefetchRoute, prefetchRouteWithData, } from "./prefetch.js";
// Enhanced Link with Prefetch Modes
export { EnhancedLink, PrefetchLink, usePrefetchLink, } from "./link.js";
// Intersection Observer Utilities
export { createIntersectionObserver, observeElement, unobserveElement, isObserving, hasIntersected, disconnectAll, getVisibilityState, isApproachingViewport, createPrefetchZone, getScrollDirection, onScrollDirectionChange, getLinksInScrollPath, } from "./intersection.js";
// Service Worker Prefetch Integration
export { generatePrefetchServiceWorker, initServiceWorkerPrefetch, requestSwPrefetch, isSwCached, getSwCachedUrls, clearSwCache, onSwMessage, closeServiceWorkerPrefetch, registerPrefetchServiceWorker, createInlineServiceWorker, swrFetch, } from "./service-worker-prefetch.js";
// ============================================================================
// Remix-style Data Loading
// ============================================================================
export { 
// Loader execution
executeLoader, executeLoadersParallel, executeNestedLoaders, 
// Hooks
useLoaderData, useRouteLoaderData, useMatchesData, useLoaderLoading, useMatches, 
// Context management
setCurrentRouteData, clearLoaderData, invalidateLoaderCache, revalidate, 
// Utilities
createLoaderRequest, json, redirect, isRedirectResponse, getRedirectLocation, } from "./loader.js";
// ============================================================================
// Deferred Data Loading
// ============================================================================
export { 
// Core
defer, isDeferred, resolveDeferred, 
// Component
Await, 
// Helpers
deferData, awaitAllDeferred, getDeferredStates, 
// Streaming
streamDeferred, serializeDeferred, hydrateDeferred, } from "./defer.js";
// ============================================================================
// Route Actions
// ============================================================================
export { 
// Action execution
executeAction, createActionRequest, 
// Hooks
useActionData, useNavigation, useSubmit, useFetcher, useFetchers, 
// Components
Form, 
// State management
setActionData, clearActionData, setNavigationState, 
// Form utilities
formDataToObject, objectToFormData, validateFormData, 
// Optimistic updates
applyOptimisticUpdate, useOptimisticUpdates, clearOptimisticUpdates, } from "./action.js";
// ============================================================================
// Nested Routes
// ============================================================================
export { 
// Matching
matchNestedRoutes, 
// Data loading
loadNestedRouteData, executeNestedAction, 
// Rendering
renderNestedRoutes, createOutlet, Outlet, setOutletContext, useOutletContext, 
// Hierarchy utilities
getRouteIds, findRouteById, getParentRoute, getAncestorRoutes, 
// Route builders
createRoute, createLayoutRoute, createIndexRoute, createCatchAllRoute, 
// Path utilities
generatePath, parseParams, } from "./nested.js";
// ============================================================================
// Error Boundaries
// ============================================================================
export { 
// Type guards
isRouteErrorResponse, 
// Error creation
createRouteErrorResponse, createErrorResponse, throwResponse, throwNotFound, throwUnauthorized, throwForbidden, throwBadRequest, throwServerError, 
// Hooks
useRouteError, useRouteErrorById, useHasRouteError, useRouteErrors, 
// State management
setRouteError, setCurrentRouteError, clearRouteError, clearAllRouteErrors, markErrorHandled, setErrorStack, 
// Components
RouteErrorBoundary, DefaultErrorBoundary, 
// Error handling
catchRouteError, handleRouteError, 
// Status helpers
isClientError, isServerError, isSuccessStatus, 
// Error recovery
withErrorRecovery, createRetryHandler, } from "./error-boundary.js";
// ============================================================================
// Parallel Routes (Next.js 14 style)
// ============================================================================
export { 
// Matching
matchParallelRoutes, parseInterception, 
// Data loading
loadParallelSlots, 
// Rendering
renderParallelSlots, 
// Route interception
navigateWithInterception, closeInterception, isIntercepted, getInterceptionHistory, 
// Hooks
useSlot, useSlotByName, useSlots, useInterception, useInterceptedNavigation, 
// Configuration
createParallelRouteConfig, 
// State management
updateParallelRouteState, clearParallelRouteState, } from "./parallel-routes.js";
// ============================================================================
// Router DevTools (TanStack-style)
// ============================================================================
export { 
// Initialization
initRouterDevTools, 
// Navigation tracking
trackNavigation, completeNavigation, trackLoader, 
// State updates
updateRouteTree, updateRouteState, recordRouteMatch, 
// History & Performance
clearHistory, clearPerformance, 
// Import/Export
exportState, importState, 
// State access
getDevToolsState, 
// UI controls
toggleDevTools, toggleMinimize, setActiveTab, 
// Main component
RouterDevTools, } from "./devtools.js";
// ============================================================================
// Route Groups (SolidStart-style)
// ============================================================================
export { 
// Parsing
parseRouteGroup, isGroupPath, extractGroups, removeGroups, 
// Creation
createRouteGroup, addRouteToGroup, 
// Processing
processRouteGroups, 
// Middleware
executeGroupMiddleware, createAuthMiddleware, createPermissionMiddleware, createLoggingMiddleware, createRateLimitMiddleware, createHeaderMiddleware, 
// Discovery
discoverRouteGroups, 
// Utilities
getRoutesByGroup, mergeRouteGroups, createNestedGroups, validateRouteGroup, visualizeRouteGroups, exportRouteGroups, } from "./route-groups.js";
// ============================================================================
// Route Masking
// ============================================================================
export { 
// Initialization
initRouteMasking, 
// Mask creation & management
createRouteMask, applyRouteMask, removeRouteMask, 
// State access
getCurrentMask, isRouteMasked, getActualRoute, getMaskedUrl, 
// Navigation with masking
navigateWithMask, navigateAsModal, navigateAsDrawer, closeOverlay, 
// Stack management
pushMask, popMask, getMaskStack, getMaskStackDepth, clearMaskStack, 
// History
restoreMaskFromHistory, getMaskFromHistory, clearMaskHistory, 
// Utilities
matchesMask, detectMaskFromHistory, serializeMask, deserializeMask, 
// Configuration
isRouteMaskingEnabled, setRouteMaskingEnabled, getMaskConfig, updateMaskConfig, 
// Hooks
useRouteMask, useIsRouteMasked, useActualRoute, useMaskedUrl, useMaskState, 
// Debug
getRouteMaskingDebugInfo, exportMaskingState, } from "./route-masking.js";
// ============================================================================
// Router Context
// ============================================================================
export { 
// Initialization
initRouterContext, 
// Global context
setGlobalContext, updateGlobalContext, updateGlobalContextMultiple, getGlobalContext, getGlobalContextValue, 
// Context providers
registerContextProvider, unregisterContextProvider, computeProvidedContext, 
// Route overrides
registerRouteContextOverride, unregisterRouteContextOverride, getRouteContext, 
// Current route context
setCurrentRouteContext, getCurrentRouteContext, 
// Middleware
addContextMiddleware, removeContextMiddleware, applyContextMiddleware, 
// Cache management
clearContextCache, resetRouterContext, 
// Hooks
useRouterContext, useRouterContextValue, useUpdateRouterContext, 
// Type-safe helpers
createTypedContext, defineContextProvider, defineContextMiddleware, 
// Utilities
validateContext, mergeContexts, cloneContext, hasContextKey, getContextKeys, 
// Built-in providers
createUserContextProvider, createThemeContextProvider, createLocaleContextProvider, createApiContextProvider, 
// Built-in middleware
createLoggingContextMiddleware, createTransformContextMiddleware, createFilterContextMiddleware, 
// Debug
getRouterContextDebugInfo, exportContextState, } from "./router-context.js";
// ============================================================================
// Navigation Guards (Vue Router-style)
// ============================================================================
export { 
// Registration
beforeEach, afterEach, beforeRoute, 
// Execution
runNavigationGuards, runAfterHooks, 
// Built-in guards
createAuthGuard, createRoleGuard, createPermissionGuard, createLoadingGuard, createScrollGuard, createTitleGuard, createAnalyticsGuard, createConfirmGuard, createRateLimitGuard, 
// Utilities
parseLocation, createLocation, isNavigationCancelled, getNavigationStatus, clearAllGuards, getGuardsCount, } from "./guards.js";
// Type-Safe URL Builder
export { createURLBuilder, defineRoutes, buildQueryString, parseQueryString, mergeQueryParams, generateBreadcrumbs, extractParamNames, normalizePath, joinPaths, parseURL, matchPattern, resolveLinkTo, isActivePath, serializeRouteState, deserializeRouteState, } from "./url-builder.js";
/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export function createRouter(manifest) {
    return { manifest };
}
//# sourceMappingURL=index.js.map