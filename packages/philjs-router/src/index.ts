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

export type { RouteModule as Route }; // Re-export for convenience

export type { RoutePattern } from "./discovery.js";
export type { LayoutComponent, LayoutChain } from "./layouts.js";
export { discoverRoutes, matchRoute } from "./discovery.js";
export { findLayouts, applyLayouts } from "./layouts.js";

// High-level router API
export {
  createAppRouter,
  useRouter,
  useRoute,
  Link,
  RouterView,
  createRouteManifest,
  createRouteMatcher,
  generateRouteTypes,
} from "./high-level.js";
export type {
  RouteDefinition,
  RouterOptions,
  NavigateFunction,
  MatchedRoute,
  PrefetchOptions,
  RouteTransitionOptions,
  RouteManifestOptions,
  RouteTypeGenerationOptions,
  RouteMatcher,
} from "./high-level.js";

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

// View Transitions (Astro-inspired)
export {
  // Manager
  ViewTransitionManager,
  initViewTransitions,
  getViewTransitionManager,
  resetViewTransitions,
  // Navigation
  navigateWithTransition,
  navigate,
  startViewTransition,
  // Shared Elements
  markSharedElement,
  transitionLink,
  // Support Detection
  supportsViewTransitions,
  prefersReducedMotion,
  // Fallback
  animateFallback,
  // Hooks
  useViewTransition,
  useViewTransitionEvent,
  useTransitionPersist,
  useTransitionName,
  // Components
  ViewTransitionLink,
  createViewTransitionLink,
  // Utilities
  getNavigationDirection,
} from "./view-transitions.js";
export type {
  // Core Types
  TransitionConfig,
  TransitionType,
  TransitionDirection,
  FallbackBehavior,
  ViewTransitionOptions,
  ViewTransitionConfig,
  // Event Types
  ViewTransitionEvent,
  ViewTransitionEventDetail,
  ViewTransitionEventHandler,
  // State Types
  ViewTransitionState,
  // Shared Element Types
  SharedElementOptions,
  // Component Types
  ViewTransitionLinkProps,
} from "./view-transitions.js";

// Qwik-style Speculative Prefetching
export {
  PrefetchManager,
  initPrefetchManager,
  getPrefetchManager,
  prefetchRoute,
  prefetchRouteWithData,
} from "./prefetch.js";
export type {
  PrefetchMode,
  PrefetchPriority,
  PrefetchConfig,
  PrefetchQueueItem,
  PrefetchStats,
  PrefetchResult,
} from "./prefetch.js";

// Enhanced Link with Prefetch Modes
export {
  EnhancedLink,
  PrefetchLink,
  usePrefetchLink,
} from "./link.js";
export type {
  EnhancedLinkProps,
  LinkPrefetchOptions,
  UsePrefetchLinkOptions,
  UsePrefetchLinkResult,
} from "./link.js";

// Intersection Observer Utilities
export {
  createIntersectionObserver,
  observeElement,
  unobserveElement,
  isObserving,
  hasIntersected,
  disconnectAll,
  getVisibilityState,
  isApproachingViewport,
  createPrefetchZone,
  getScrollDirection,
  onScrollDirectionChange,
  getLinksInScrollPath,
} from "./intersection.js";
export type {
  IntersectionOptions,
  ObservedElement,
  VisibilityState,
  PrefetchZone,
  ScrollDirection,
} from "./intersection.js";

// Service Worker Prefetch Integration
export {
  generatePrefetchServiceWorker,
  initServiceWorkerPrefetch,
  requestSwPrefetch,
  isSwCached,
  getSwCachedUrls,
  clearSwCache,
  onSwMessage,
  closeServiceWorkerPrefetch,
  registerPrefetchServiceWorker,
  createInlineServiceWorker,
  swrFetch,
} from "./service-worker-prefetch.js";
export type {
  PrefetchCacheConfig,
  PrefetchMessage,
  CacheStats,
  CachedRoute,
  SwRegistrationOptions,
  SWRFetchOptions,
} from "./service-worker-prefetch.js";

// ============================================================================
// Remix-style Data Loading
// ============================================================================

export {
  // Loader execution
  executeLoader,
  executeLoadersParallel,
  executeNestedLoaders,
  // Hooks
  useLoaderData,
  useRouteLoaderData,
  useMatchesData,
  useLoaderLoading,
  useMatches,
  // Context management
  setCurrentRouteData,
  clearLoaderData,
  invalidateLoaderCache,
  revalidate,
  // Utilities
  createLoaderRequest,
  json,
  redirect,
  isRedirectResponse,
  getRedirectLocation,
} from "./loader.js";
export type {
  LoaderFunctionContext,
  LoaderFunction,
  LoaderResult,
  RouteLoaderData,
  LoaderOptions,
  InferLoaderData,
} from "./loader.js";

// ============================================================================
// Deferred Data Loading
// ============================================================================

export {
  // Core
  defer,
  isDeferred,
  resolveDeferred,
  // Component
  Await,
  // Helpers
  deferData,
  awaitAllDeferred,
  getDeferredStates,
  // Streaming
  streamDeferred,
  serializeDeferred,
  hydrateDeferred,
} from "./defer.js";
export type {
  DeferredStatus,
  DeferredValue,
  AwaitProps,
  DeferredData,
  StreamOptions,
} from "./defer.js";

// ============================================================================
// Route Actions
// ============================================================================

export {
  // Action execution
  executeAction,
  createActionRequest,
  // Hooks
  useActionData,
  useNavigation,
  useSubmit,
  useFetcher,
  useFetchers,
  // Components
  Form,
  // State management
  setActionData,
  clearActionData,
  setNavigationState,
  // Form utilities
  formDataToObject,
  objectToFormData,
  validateFormData,
  // Optimistic updates
  applyOptimisticUpdate,
  useOptimisticUpdates,
  clearOptimisticUpdates,
} from "./action.js";
export type {
  ActionFunctionContext,
  ActionFunction,
  ActionResult,
  NavigationState,
  FormProps,
  SubmitOptions,
  FetcherState,
  ValidationError,
  ValidationResult,
  OptimisticUpdate,
} from "./action.js";

// ============================================================================
// Nested Routes
// ============================================================================

export {
  // Matching
  matchNestedRoutes,
  // Data loading
  loadNestedRouteData,
  executeNestedAction,
  // Rendering
  renderNestedRoutes,
  createOutlet,
  Outlet,
  setOutletContext,
  useOutletContext,
  // Hierarchy utilities
  getRouteIds,
  findRouteById,
  getParentRoute,
  getAncestorRoutes,
  // Route builders
  createRoute,
  createLayoutRoute,
  createIndexRoute,
  createCatchAllRoute,
  // Path utilities
  generatePath,
  parseParams,
} from "./nested.js";
export type {
  NestedRouteDefinition,
  RouteComponent,
  RouteComponentProps,
  MatchedNestedRoute,
  NestedRouteMatch,
  NestedRouteOptions,
} from "./nested.js";

// ============================================================================
// Error Boundaries
// ============================================================================

export {
  // Type guards
  isRouteErrorResponse,
  // Error creation
  createRouteErrorResponse,
  createErrorResponse,
  throwResponse,
  throwNotFound,
  throwUnauthorized,
  throwForbidden,
  throwBadRequest,
  throwServerError,
  // Hooks
  useRouteError,
  useRouteErrorById,
  useHasRouteError,
  useRouteErrors,
  // State management
  setRouteError,
  setCurrentRouteError,
  clearRouteError,
  clearAllRouteErrors,
  markErrorHandled,
  setErrorStack,
  // Components
  RouteErrorBoundary,
  DefaultErrorBoundary,
  // Error handling
  catchRouteError,
  handleRouteError,
  // Status helpers
  isClientError,
  isServerError,
  isSuccessStatus,
  // Error recovery
  withErrorRecovery,
  createRetryHandler,
} from "./error-boundary.js";
export type {
  RouteErrorResponse,
  RouteError,
  ErrorBoundaryProps,
  ErrorBoundaryComponent,
  RouteErrorContext,
  RouteErrorBoundaryProps,
  ErrorRecoveryOptions,
} from "./error-boundary.js";

// ============================================================================
// Parallel Routes (Next.js 14 style)
// ============================================================================

export {
  // Matching
  matchParallelRoutes,
  parseInterception,
  // Data loading
  loadParallelSlots,
  // Rendering
  renderParallelSlots,
  // Route interception
  navigateWithInterception,
  closeInterception,
  isIntercepted,
  getInterceptionHistory,
  // Hooks
  useSlot,
  useSlotByName,
  useSlots,
  useInterception,
  useInterceptedNavigation,
  // Configuration
  createParallelRouteConfig,
  // State management
  updateParallelRouteState,
  clearParallelRouteState,
} from "./parallel-routes.js";
export type {
  SlotName,
  SlotDefinition,
  SlotComponent,
  SlotComponentProps,
  MatchedSlot,
  InterceptConfig,
  ParallelRouteConfig,
  NavigationMode,
  InterceptedNavigationState,
} from "./parallel-routes.js";

// ============================================================================
// Router DevTools (TanStack-style)
// ============================================================================

export {
  // Initialization
  initRouterDevTools,
  // Navigation tracking
  trackNavigation,
  completeNavigation,
  trackLoader,
  // State updates
  updateRouteTree,
  updateRouteState,
  recordRouteMatch,
  // History & Performance
  clearHistory,
  clearPerformance,
  // Import/Export
  exportState,
  importState,
  // State access
  getDevToolsState,
  // UI controls
  toggleDevTools,
  toggleMinimize,
  setActiveTab,
  // Main component
  RouterDevTools,
} from "./devtools.js";
export type {
  RouteTreeNode,
  NavigationHistoryEntry,
  NavigationMetrics,
  RoutePerformance,
  RouteStateSnapshot,
  DevToolsConfig,
  RouteMatchDebugInfo,
} from "./devtools.js";

// ============================================================================
// Route Groups (SolidStart-style)
// ============================================================================

export {
  // Parsing
  parseRouteGroup,
  isGroupPath,
  extractGroups,
  removeGroups,
  // Creation
  createRouteGroup,
  addRouteToGroup,
  // Processing
  processRouteGroups,
  // Middleware
  executeGroupMiddleware,
  createAuthMiddleware,
  createPermissionMiddleware,
  createLoggingMiddleware,
  createRateLimitMiddleware,
  createHeaderMiddleware,
  // Discovery
  discoverRouteGroups,
  // Utilities
  getRoutesByGroup,
  mergeRouteGroups,
  createNestedGroups,
  validateRouteGroup,
  visualizeRouteGroups,
  exportRouteGroups,
} from "./route-groups.js";
export type {
  RouteGroup,
  GroupRoute,
  RouteGroupMiddleware,
  MiddlewareContext,
  MiddlewareResult,
  RouteGroupMeta,
  RouteGroupConfig,
  ProcessedGroupRoute,
} from "./route-groups.js";

// ============================================================================
// Route Masking
// ============================================================================

export {
  // Initialization
  initRouteMasking,
  // Mask creation & management
  createRouteMask,
  applyRouteMask,
  removeRouteMask,
  // State access
  getCurrentMask,
  isRouteMasked,
  getActualRoute,
  getMaskedUrl,
  // Navigation with masking
  navigateWithMask,
  navigateAsModal,
  navigateAsDrawer,
  closeOverlay,
  // Stack management
  pushMask,
  popMask,
  getMaskStack,
  getMaskStackDepth,
  clearMaskStack,
  // History
  restoreMaskFromHistory,
  getMaskFromHistory,
  clearMaskHistory,
  // Utilities
  matchesMask,
  detectMaskFromHistory,
  serializeMask,
  deserializeMask,
  // Configuration
  isRouteMaskingEnabled,
  setRouteMaskingEnabled,
  getMaskConfig,
  updateMaskConfig,
  // Hooks
  useRouteMask,
  useIsRouteMasked,
  useActualRoute,
  useMaskedUrl,
  useMaskState,
  // Debug
  getRouteMaskingDebugInfo,
  exportMaskingState,
} from "./route-masking.js";
export type {
  RouteMask,
  MaskedNavigationOptions,
  MaskStackEntry,
  MaskMatchStrategy,
  MaskRestoreOptions,
} from "./route-masking.js";

// ============================================================================
// Router Context
// ============================================================================

export {
  // Initialization
  initRouterContext,
  // Global context
  setGlobalContext,
  updateGlobalContext,
  updateGlobalContextMultiple,
  getGlobalContext,
  getGlobalContextValue,
  // Context providers
  registerContextProvider,
  unregisterContextProvider,
  computeProvidedContext,
  // Route overrides
  registerRouteContextOverride,
  unregisterRouteContextOverride,
  getRouteContext,
  // Current route context
  setCurrentRouteContext,
  getCurrentRouteContext,
  // Middleware
  addContextMiddleware,
  removeContextMiddleware,
  applyContextMiddleware,
  // Cache management
  clearContextCache,
  resetRouterContext,
  // Hooks
  useRouterContext,
  useRouterContextValue,
  useUpdateRouterContext,
  // Type-safe helpers
  createTypedContext,
  defineContextProvider,
  defineContextMiddleware,
  // Utilities
  validateContext,
  mergeContexts,
  cloneContext,
  hasContextKey,
  getContextKeys,
  // Built-in providers
  createUserContextProvider,
  createThemeContextProvider,
  createLocaleContextProvider,
  createApiContextProvider,
  // Built-in middleware
  createLoggingContextMiddleware,
  createTransformContextMiddleware,
  createFilterContextMiddleware,
  // Debug
  getRouterContextDebugInfo,
  exportContextState,
} from "./router-context.js";
export type {
  RouterContext,
  TypedRouterContext,
  ContextProvider,
  RouteContextOverride,
  ContextMiddleware,
  ContextValidator,
  RouterContextConfig,
} from "./router-context.js";

/**
 * Create a router from a route manifest.
 * @param {Record<string, RouteModule>} manifest - Route manifest
 * @returns {{ manifest: Record<string, RouteModule> }}
 */
export function createRouter(manifest: Record<string, RouteModule>) {
  return { manifest };
}
