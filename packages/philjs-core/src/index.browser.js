/**
 * @fileoverview Browser-safe exports for @philjs/core
 * This file excludes all Node.js-dependent modules (file-utils, virtual-modules)
 */
// Signals & Reactivity
export { signal, memo, linkedSignal, resource, effect, batch, untrack, onCleanup, createRoot } from "./signals.js";
// JSX Runtime
export { jsx, jsxs, jsxDEV, Fragment, createElement, isJSXElement } from "./jsx-runtime.js";
// Rendering
export { renderToString, renderToStream } from "./render-to-string.js";
export { hydrate, render } from "./hydrate.js";
// Resumability
export { initResumability, getResumableState, serializeResumableState, resume, resumable, registerHandler, registerState } from "./resumability.js";
// Data Layer
export { createQuery, createMutation, queryCache, invalidateQueries, prefetchQuery } from "./data-layer.js";
// Context API
export { createContext, useContext, createSignalContext, createReducerContext, // @deprecated - Use signal() and createSignalContext() instead
combineProviders, createThemeContext } from "./context.js";
// Animation & Motion
export { createAnimatedValue, easings, FLIPAnimator, attachGestures, createParallax } from "./animation.js";
// Internationalization
export { I18nProvider, useI18n, useTranslation, TranslationExtractor, AITranslationService, createLocaleMiddleware } from "./i18n.js";
// Error Boundaries
export { ErrorBoundary, setupGlobalErrorHandler, errorRecovery } from "./error-boundary.js";
// Service Worker
export { generateServiceWorker, registerServiceWorker, unregisterServiceWorkers, skipWaitingAndClaim, defaultCacheRules } from "./service-worker.js";
// Performance & Intelligence
export { performanceBudgets, PerformanceBudgetManager, performanceBudgetPlugin } from "./performance-budgets.js";
export { costTracker, CostTracker } from "./cost-tracking.js";
// Note: estimateCost and compareCosts are methods on CostTracker class, not standalone functions
export { usageAnalytics, UsageAnalytics } from "./usage-analytics.js";
// Error handling & Result
export { Ok, Err, isOk, isErr, isResult, map, mapErr, andThen, unwrap, unwrapOr, matchResult, } from "./result.js";
// Forms & Validation
export { useForm, v as validators, createField } from "./forms.js";
// Accessibility (2026 Innovation)
export { configureA11y, getA11yConfig, enhanceWithAria, validateHeadingHierarchy, getHeadingWarnings, resetHeadingTracker, getContrastRatio, validateColorContrast, auditAccessibility, startA11yMonitoring, addSkipLink, announceToScreenReader, createLoadingState, createFocusManager, KeyboardNavigator } from "./accessibility.js";
// A/B Testing (2026 Innovation)
export { ABTestEngine, initABTesting, getABTestEngine, useExperiment, ABTest, useFeatureFlag, createMultivariateTest, calculateSignificance } from "./ab-testing.js";
// Security Utilities
export { escapeHtml, escapeAttr, escapeJs, escapeUrl, sanitizeHtml, sanitizeUrl, safeJsonParse, generateSecureToken, isValidEmail, createCspNonce, constantTimeEqual } from "./security.js";
// State Serialization
export { serialize, deserialize, toJSON, fromJSON, serializeForHydration, hydrateFromSSR, injectHydrationData, extractHydrationData, persistToLocalStorage, restoreFromLocalStorage, persistentSignal, serializeToURL, deserializeFromURL, urlSignal, clearSignalRegistry, getSerializationStats, deepClone, deepEqual, } from "./serialization.js";
// Web Vitals Monitoring
export { WebVitalsMonitor, initWebVitals, getWebVitalsMonitor, reportWebVitals, getWebVitalsMetrics, } from "./web-vitals.js";
// Performance Tracking
export { PerformanceTracker, usePerformance, useAPIPerformance, useCustomPerformance, usePerformanceBudget, usePerformanceSnapshot, measureAsync, measureSync, monitorResources, exportPerformanceData, importPerformanceData, getPerformanceTracker, createPerformanceReport, } from "./performance-tracking.js";
// Error Tracking
export { ErrorTracker, initErrorTracking, getErrorTracker, captureError, captureException, captureMessage, addBreadcrumb, setUser, setTag, setContext, getErrorStats, withErrorTracking, useErrorBoundary, } from "./error-tracking.js";
// Path Utilities (SvelteKit-style)
export { paths, configurePaths, base, assets, resolveRoute, buildPath, matchPath, resolveAsset, parseUrl, joinPaths, normalizePath, isRelativePath, makeRelative, sanitizePath, getExtension, getFilename, getDirectory, pathsMatch, buildBreadcrumbs, } from "./paths.js";
// Glob Utilities (Astro-style)
export { glob, importGlob, mapGlob, filterGlob, parseGlobPath, loadContent, sortContent, groupContent, autoRegister, loadRoutes, filePathToRoute, loadContentWithFrontmatter, filterByFrontmatter, sortByFrontmatter, loadPlugins, initializePlugins, createCollection, globUtils, } from "./glob.js";
// NOTE: Virtual Modules (virtualModulesPlugin) is server-only - import from "@philjs/core/server"
// NOTE: File Utilities (fileUtils) is server-only - import from "@philjs/core/server"
// Lazy Handlers (Optimizer Integration)
export { $, $$, loadHandler, createLazyEventHandler, prefetchHandler, isLazyHandler, resolveLazyHandlers, serializeLazyHandlers, hydrateLazyHandlers, enhanceForm, handlerRegistry, } from "./lazy-handlers.js";
// Deep Reactive Store
export { createStore, createStoreWithActions, createUndoableStore, derive, produce, reconcile, createSlice, subscribeToStore, } from "./store.js";
// Advanced Async Primitives
export { createAsync, createMutation as createAsyncMutation, debounceAsync, throttleAsync, createQueue, createConcurrencyLimiter, createSuspenseResource, preload, getCached, setCache, invalidateCache, clearCache, } from "./async.js";
// Disposable Utilities (TypeScript 6 Explicit Resource Management)
export { disposableTimeout, disposableInterval, disposableAbortController, disposableEventListener, disposableSubscription, asyncDisposable, createDisposableScope, createAsyncDisposableScope, toDisposable, toAsyncDisposable, createDisposableMutex, } from "./disposable.js";
//# sourceMappingURL=index.browser.js.map