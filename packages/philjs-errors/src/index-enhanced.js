/**
 * PhilJS Enhanced Error System
 *
 * Export all enhanced error functionality
 */
// Re-export error codes and catalog
export { ERROR_CATALOG, getErrorDefinition, getErrorsByCategory, createPhilJSError, formatError, } from './error-codes.js';
// Re-export stack trace processing
export { parseStack, processStack, getPrimaryLocation, formatStackTrace, cleanStack, enhanceErrorStack, formatErrorForDev, loadSourceMap, applySourceMap, } from './stack-trace.js';
// Re-export signal error tracking
export { recordSignalAccess, markSignalUpdateStart, markSignalUpdateEnd, addDependency, clearDependencyGraph, recordSignalUpdate, registerEffect, hasEffectCleanup, recordMemoComputation, getSignalErrorStats, clearSignalErrorTracking, setSignalErrorTracking, isSignalErrorTrackingEnabled, } from './signal-errors.js';
// Re-export error overlay
export { showErrorOverlay, hideErrorOverlay, initErrorOverlay, isErrorOverlayVisible, getCurrentError, updateErrorOverlay, } from './error-overlay.js';
// Re-export SSR/hydration error tracking
export { startHydration, endHydration, recordHydrationMismatch, isCurrentlyHydrating, getHydrationMismatches, clearHydrationMismatches, isServer, guardBrowserAPI, setSSRData, getSSRData, requireSSRData, detectHydrationIssues, hydrationSafe, getSSRErrorStats, clearSSRErrorTracking, } from './ssr-errors.js';
// Re-export router error tracking
export { validateRoutePattern, throwInvalidRoutePattern, ensureValidRoutePattern, matchPath, getRequiredParams, validateNavigationParams, throwMissingRouteParameter, buildPath, registerRoute, unregisterRoute, findMatchingRoute, warnRouteNotFound, recordNavigation, getNavigationHistory, getFailedNavigations, clearNavigationHistory, getRouterErrorStats, clearRouterErrorTracking, suggestSimilarRoutes, } from './router-errors.js';
// Re-export compiler error enhancements
export { JSX_ERROR_PATTERNS, createJSXSyntaxError, createUnsupportedFeatureError, createOptimizationWarning, extractCodeSnippet, detectJSXErrorPattern, enhanceCompilerError, checkDeprecatedAttributes, addCompilerWarning, getCompilerWarnings, getWarningsForFile, clearCompilerWarnings, formatCompilerError, getCompilerErrorStats, } from './compiler-errors.js';
export { initErrorTracking, getErrorTracker, captureError, captureMessage, setUser, addBreadcrumb, createErrorBoundary, startSpan, withErrorTracking, trackSignalErrors, createSentryTracker, createLogRocketTracker, createRollbarTracker, } from './index.js';
//# sourceMappingURL=index-enhanced.js.map