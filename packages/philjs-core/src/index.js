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
//# sourceMappingURL=index.js.map