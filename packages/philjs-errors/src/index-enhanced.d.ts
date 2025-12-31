/**
 * PhilJS Enhanced Error System
 *
 * Export all enhanced error functionality
 */
export { type PhilJSError, type ErrorDefinition, type ErrorSuggestion, type SourceLocation, type ErrorCategory, ERROR_CATALOG, getErrorDefinition, getErrorsByCategory, createPhilJSError, formatError, } from './error-codes.js';
export { type StackFrame, type ProcessedStack, parseStack, processStack, getPrimaryLocation, formatStackTrace, cleanStack, enhanceErrorStack, formatErrorForDev, loadSourceMap, applySourceMap, } from './stack-trace.js';
export { recordSignalAccess, markSignalUpdateStart, markSignalUpdateEnd, addDependency, clearDependencyGraph, recordSignalUpdate, registerEffect, hasEffectCleanup, recordMemoComputation, getSignalErrorStats, clearSignalErrorTracking, setSignalErrorTracking, isSignalErrorTrackingEnabled, } from './signal-errors.js';
export { showErrorOverlay, hideErrorOverlay, initErrorOverlay, isErrorOverlayVisible, getCurrentError, updateErrorOverlay, } from './error-overlay.js';
export { type HydrationMismatch, startHydration, endHydration, recordHydrationMismatch, isCurrentlyHydrating, getHydrationMismatches, clearHydrationMismatches, isServer, guardBrowserAPI, setSSRData, getSSRData, requireSSRData, detectHydrationIssues, hydrationSafe, getSSRErrorStats, clearSSRErrorTracking, } from './ssr-errors.js';
export { type RoutePattern, validateRoutePattern, throwInvalidRoutePattern, ensureValidRoutePattern, matchPath, getRequiredParams, validateNavigationParams, throwMissingRouteParameter, buildPath, registerRoute, unregisterRoute, findMatchingRoute, warnRouteNotFound, recordNavigation, getNavigationHistory, getFailedNavigations, clearNavigationHistory, getRouterErrorStats, clearRouterErrorTracking, suggestSimilarRoutes, } from './router-errors.js';
export { type CompilerErrorContext, type JSXErrorPattern, JSX_ERROR_PATTERNS, createJSXSyntaxError, createUnsupportedFeatureError, createOptimizationWarning, extractCodeSnippet, detectJSXErrorPattern, enhanceCompilerError, checkDeprecatedAttributes, addCompilerWarning, getCompilerWarnings, getWarningsForFile, clearCompilerWarnings, formatCompilerError, getCompilerErrorStats, } from './compiler-errors.js';
export type { ErrorContext, ErrorTracker, TrackerOptions, UserContext, Breadcrumb, Span, ErrorEvent, } from './index.js';
export { initErrorTracking, getErrorTracker, captureError, captureMessage, setUser, addBreadcrumb, createErrorBoundary, startSpan, withErrorTracking, trackSignalErrors, createSentryTracker, createLogRocketTracker, createRollbarTracker, } from './index.js';
//# sourceMappingURL=index-enhanced.d.ts.map