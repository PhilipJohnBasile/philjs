/**
 * File-based routing for PhilJS.
 * Includes Remix-style nested routes, data loading, and error boundaries.
 */
export type RouteModule = {
    loader?: Function;
    action?: Function;
    default?: Function;
    config?: Record<string, unknown>;
};
export type { RouteModule as Route };
export type { RoutePattern } from "./discovery.js";
export type { LayoutComponent, LayoutChain } from "./layouts.js";
export { discoverRoutes, matchRoute } from "./discovery.js";
export { findLayouts, applyLayouts } from "./layouts.js";
export { createAppRouter, useRouter, useRoute, Link, RouterView, createRouteManifest, createRouteMatcher, generateRouteTypes, } from "./high-level.js";
export type { RouteDefinition, RouterOptions, NavigateFunction, MatchedRoute, PrefetchOptions, RouteTransitionOptions, RouteManifestOptions, RouteTypeGenerationOptions, RouteMatcher, } from "./high-level.js";
export { SmartPreloader, initSmartPreloader, getSmartPreloader, usePreload, preloadLink, calculateClickIntent, predictNextRoute, } from "./smart-preload.js";
export type { PreloadStrategy, PreloadOptions, UserIntentData } from "./smart-preload.js";
export { ViewTransitionManager, initViewTransitions, getViewTransitionManager, resetViewTransitions, navigateWithTransition, navigate, startViewTransition, markSharedElement, transitionLink, supportsViewTransitions, prefersReducedMotion, animateFallback, useViewTransition, useViewTransitionEvent, useTransitionPersist, useTransitionName, ViewTransitionLink, createViewTransitionLink, getNavigationDirection, } from "./view-transitions.js";
export type { TransitionConfig, TransitionType, TransitionDirection, FallbackBehavior, ViewTransitionOptions, ViewTransitionConfig, ViewTransitionEvent, ViewTransitionEventDetail, ViewTransitionEventHandler, ViewTransitionState, SharedElementOptions, ViewTransitionLinkProps, } from "./view-transitions.js";
export { PrefetchManager, initPrefetchManager, getPrefetchManager, prefetchRoute, prefetchRouteWithData, } from "./prefetch.js";
export type { PrefetchMode, PrefetchPriority, PrefetchConfig, PrefetchQueueItem, PrefetchStats, PrefetchResult, } from "./prefetch.js";
export { EnhancedLink, PrefetchLink, usePrefetchLink, } from "./link.js";
export type { EnhancedLinkProps, LinkPrefetchOptions, UsePrefetchLinkOptions, UsePrefetchLinkResult, } from "./link.js";
export { createIntersectionObserver, observeElement, unobserveElement, isObserving, hasIntersected, disconnectAll, getVisibilityState, isApproachingViewport, createPrefetchZone, getScrollDirection, onScrollDirectionChange, getLinksInScrollPath, } from "./intersection.js";
export type { IntersectionOptions, ObservedElement, VisibilityState, PrefetchZone, ScrollDirection, } from "./intersection.js";
export { generatePrefetchServiceWorker, initServiceWorkerPrefetch, requestSwPrefetch, isSwCached, getSwCachedUrls, clearSwCache, onSwMessage, closeServiceWorkerPrefetch, registerPrefetchServiceWorker, createInlineServiceWorker, swrFetch, } from "./service-worker-prefetch.js";
export type { PrefetchCacheConfig, PrefetchMessage, CacheStats, CachedRoute, SwRegistrationOptions, SWRFetchOptions, } from "./service-worker-prefetch.js";
export { executeLoader, executeLoadersParallel, executeNestedLoaders, useLoaderData, useRouteLoaderData, useMatchesData, useLoaderLoading, useMatches, setCurrentRouteData, clearLoaderData, invalidateLoaderCache, revalidate, createLoaderRequest, json, redirect, isRedirectResponse, getRedirectLocation, } from "./loader.js";
export type { LoaderFunctionContext, LoaderFunction, LoaderResult, RouteLoaderData, LoaderOptions, InferLoaderData, } from "./loader.js";
export { defer, isDeferred, resolveDeferred, Await, deferData, awaitAllDeferred, getDeferredStates, streamDeferred, serializeDeferred, hydrateDeferred, } from "./defer.js";
export type { DeferredStatus, DeferredValue, AwaitProps, DeferredData, StreamOptions, } from "./defer.js";
export { executeAction, createActionRequest, useActionData, useNavigation, useSubmit, useFetcher, useFetchers, Form, setActionData, clearActionData, setNavigationState, formDataToObject, objectToFormData, validateFormData, applyOptimisticUpdate, useOptimisticUpdates, clearOptimisticUpdates, } from "./action.js";
export type { ActionFunctionContext, ActionFunction, ActionResult, NavigationState, FormProps, SubmitOptions, FetcherState, ValidationError, ValidationResult, OptimisticUpdate, } from "./action.js";
export { matchNestedRoutes, loadNestedRouteData, executeNestedAction, renderNestedRoutes, createOutlet, Outlet, setOutletContext, useOutletContext, getRouteIds, findRouteById, getParentRoute, getAncestorRoutes, createRoute, createLayoutRoute, createIndexRoute, createCatchAllRoute, generatePath, parseParams, } from "./nested.js";
export type { NestedRouteDefinition, RouteComponent, RouteComponentProps, MatchedNestedRoute, NestedRouteMatch, NestedRouteOptions, } from "./nested.js";
export { isRouteErrorResponse, createRouteErrorResponse, createErrorResponse, throwResponse, throwNotFound, throwUnauthorized, throwForbidden, throwBadRequest, throwServerError, useRouteError, useRouteErrorById, useHasRouteError, useRouteErrors, setRouteError, setCurrentRouteError, clearRouteError, clearAllRouteErrors, markErrorHandled, setErrorStack, RouteErrorBoundary, DefaultErrorBoundary, catchRouteError, handleRouteError, isClientError, isServerError, isSuccessStatus, withErrorRecovery, createRetryHandler, } from "./error-boundary.js";
export type { RouteErrorResponse, RouteError, ErrorBoundaryProps, ErrorBoundaryComponent, RouteErrorContext, RouteErrorBoundaryProps, ErrorRecoveryOptions, } from "./error-boundary.js";
export { matchParallelRoutes, parseInterception, loadParallelSlots, renderParallelSlots, navigateWithInterception, closeInterception, isIntercepted, getInterceptionHistory, useSlot, useSlotByName, useSlots, useInterception, useInterceptedNavigation, createParallelRouteConfig, updateParallelRouteState, clearParallelRouteState, } from "./parallel-routes.js";
export type { SlotName, SlotDefinition, SlotComponent, SlotComponentProps, MatchedSlot, InterceptConfig, ParallelRouteConfig, NavigationMode, InterceptedNavigationState, } from "./parallel-routes.js";
export { initRouterDevTools, trackNavigation, completeNavigation, trackLoader, updateRouteTree, updateRouteState, recordRouteMatch, clearHistory, clearPerformance, exportState, importState, getDevToolsState, toggleDevTools, toggleMinimize, setActiveTab, RouterDevTools, } from "./devtools.js";
export type { RouteTreeNode, NavigationHistoryEntry, NavigationMetrics, RoutePerformance, RouteStateSnapshot, DevToolsConfig, RouteMatchDebugInfo, } from "./devtools.js";
export { parseRouteGroup, isGroupPath, extractGroups, removeGroups, createRouteGroup, addRouteToGroup, processRouteGroups, executeGroupMiddleware, createAuthMiddleware, createPermissionMiddleware, createLoggingMiddleware, createRateLimitMiddleware, createHeaderMiddleware, discoverRouteGroups, getRoutesByGroup, mergeRouteGroups, createNestedGroups, validateRouteGroup, visualizeRouteGroups, exportRouteGroups, } from "./route-groups.js";
export type { RouteGroup, GroupRoute, RouteGroupMiddleware, MiddlewareContext, MiddlewareResult, RouteGroupMeta, RouteGroupConfig, ProcessedGroupRoute, } from "./route-groups.js";
export { initRouteMasking, createRouteMask, applyRouteMask, removeRouteMask, getCurrentMask, isRouteMasked, getActualRoute, getMaskedUrl, navigateWithMask, navigateAsModal, navigateAsDrawer, closeOverlay, pushMask, popMask, getMaskStack, getMaskStackDepth, clearMaskStack, restoreMaskFromHistory, getMaskFromHistory, clearMaskHistory, matchesMask, detectMaskFromHistory, serializeMask, deserializeMask, isRouteMaskingEnabled, setRouteMaskingEnabled, getMaskConfig, updateMaskConfig, useRouteMask, useIsRouteMasked, useActualRoute, useMaskedUrl, useMaskState, getRouteMaskingDebugInfo, exportMaskingState, } from "./route-masking.js";
export type { RouteMask, MaskedNavigationOptions, MaskStackEntry, MaskMatchStrategy, MaskRestoreOptions, } from "./route-masking.js";
export { initRouterContext, setGlobalContext, updateGlobalContext, updateGlobalContextMultiple, getGlobalContext, getGlobalContextValue, registerContextProvider, unregisterContextProvider, computeProvidedContext, registerRouteContextOverride, unregisterRouteContextOverride, getRouteContext, setCurrentRouteContext, getCurrentRouteContext, addContextMiddleware, removeContextMiddleware, applyContextMiddleware, clearContextCache, resetRouterContext, useRouterContext, useRouterContextValue, useUpdateRouterContext, createTypedContext, defineContextProvider, defineContextMiddleware, validateContext, mergeContexts, cloneContext, hasContextKey, getContextKeys, createUserContextProvider, createThemeContextProvider, createLocaleContextProvider, createApiContextProvider, createLoggingContextMiddleware, createTransformContextMiddleware, createFilterContextMiddleware, getRouterContextDebugInfo, exportContextState, } from "./router-context.js";
export type { RouterContext, TypedRouterContext, ContextProvider, RouteContextOverride, ContextMiddleware, ContextValidator, RouterContextConfig, } from "./router-context.js";
export { beforeEach, afterEach, beforeRoute, runNavigationGuards, runAfterHooks, createAuthGuard, createRoleGuard, createPermissionGuard, createLoadingGuard, createScrollGuard, createTitleGuard, createAnalyticsGuard, createConfirmGuard, createRateLimitGuard, parseLocation, createLocation, isNavigationCancelled, getNavigationStatus, clearAllGuards, getGuardsCount, } from "./guards.js";
export type { RouteLocation, RouteMatch, RouteMeta, NavigationGuard, NavigationGuardReturn, AfterNavigationHook, GuardContext, NavigationFailure, NavigationFailureType, GuardConfig, } from "./guards.js";
export { createURLBuilder, defineRoutes, buildQueryString, parseQueryString, mergeQueryParams, generateBreadcrumbs, extractParamNames, normalizePath, joinPaths, parseURL, matchPattern, resolveLinkTo, isActivePath, serializeRouteState, deserializeRouteState, } from "./url-builder.js";
export type { ParamValue, QueryValue, RouteParams, QueryParams, URLBuilderOptions, BuilderResult, URLBuilder, Breadcrumb, BreadcrumbConfig, LinkProps, } from "./url-builder.js";
/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export declare function createRouter(manifest: Record<string, RouteModule>): {
    manifest: Record<string, RouteModule>;
};
//# sourceMappingURL=index.d.ts.map