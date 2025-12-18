/**
 * PhilJS Enhanced Error System
 *
 * Export all enhanced error functionality
 */

// Re-export error codes and catalog
export {
  type PhilJSError,
  type ErrorDefinition,
  type ErrorSuggestion,
  type SourceLocation,
  type ErrorCategory,
  ERROR_CATALOG,
  getErrorDefinition,
  getErrorsByCategory,
  createPhilJSError,
  formatError,
} from './error-codes';

// Re-export stack trace processing
export {
  type StackFrame,
  type ProcessedStack,
  parseStack,
  processStack,
  getPrimaryLocation,
  formatStackTrace,
  cleanStack,
  enhanceErrorStack,
  formatErrorForDev,
  loadSourceMap,
  applySourceMap,
} from './stack-trace';

// Re-export signal error tracking
export {
  recordSignalAccess,
  markSignalUpdateStart,
  markSignalUpdateEnd,
  addDependency,
  clearDependencyGraph,
  recordSignalUpdate,
  registerEffect,
  hasEffectCleanup,
  recordMemoComputation,
  getSignalErrorStats,
  clearSignalErrorTracking,
  setSignalErrorTracking,
  isSignalErrorTrackingEnabled,
} from './signal-errors';

// Re-export error overlay
export {
  showErrorOverlay,
  hideErrorOverlay,
  initErrorOverlay,
  isErrorOverlayVisible,
  getCurrentError,
  updateErrorOverlay,
} from './error-overlay';

// Re-export SSR/hydration error tracking
export {
  type HydrationMismatch,
  startHydration,
  endHydration,
  recordHydrationMismatch,
  isCurrentlyHydrating,
  getHydrationMismatches,
  clearHydrationMismatches,
  isServer,
  guardBrowserAPI,
  setSSRData,
  getSSRData,
  requireSSRData,
  detectHydrationIssues,
  hydrationSafe,
  getSSRErrorStats,
  clearSSRErrorTracking,
} from './ssr-errors';

// Re-export router error tracking
export {
  type RoutePattern,
  validateRoutePattern,
  throwInvalidRoutePattern,
  ensureValidRoutePattern,
  matchPath,
  getRequiredParams,
  validateNavigationParams,
  throwMissingRouteParameter,
  buildPath,
  registerRoute,
  unregisterRoute,
  findMatchingRoute,
  warnRouteNotFound,
  recordNavigation,
  getNavigationHistory,
  getFailedNavigations,
  clearNavigationHistory,
  getRouterErrorStats,
  clearRouterErrorTracking,
  suggestSimilarRoutes,
} from './router-errors';

// Re-export compiler error enhancements
export {
  type CompilerErrorContext,
  type JSXErrorPattern,
  JSX_ERROR_PATTERNS,
  createJSXSyntaxError,
  createUnsupportedFeatureError,
  createOptimizationWarning,
  extractCodeSnippet,
  detectJSXErrorPattern,
  enhanceCompilerError,
  checkDeprecatedAttributes,
  addCompilerWarning,
  getCompilerWarnings,
  getWarningsForFile,
  clearCompilerWarnings,
  formatCompilerError,
  getCompilerErrorStats,
} from './compiler-errors';

// Re-export original error tracking
export type {
  ErrorContext,
  ErrorTracker,
  TrackerOptions,
  UserContext,
  Breadcrumb,
  Span,
  ErrorEvent,
} from './index';

export {
  initErrorTracking,
  getErrorTracker,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  createErrorBoundary,
  startSpan,
  withErrorTracking,
  trackSignalErrors,
  createSentryTracker,
  createLogRocketTracker,
  createRollbarTracker,
} from './index';
