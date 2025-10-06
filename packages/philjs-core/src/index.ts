// Signals & Reactivity
export {
  signal,
  memo,
  resource,
  effect,
  batch,
  untrack,
  onCleanup,
  createRoot
} from "./signals.js";
export type { Signal, Memo, Resource, EffectCleanup } from "./signals.js";

// JSX Runtime
export { jsx, jsxs, jsxDEV, Fragment, createElement, isJSXElement } from "./jsx-runtime.js";
export type { JSXElement, VNode } from "./jsx-runtime.js";

// Rendering
export { renderToString, renderToStream } from "./render-to-string.js";
export { hydrate, render } from "./hydrate.js";

// Resumability
export {
  initResumability,
  getResumableState,
  serializeResumableState,
  resume,
  resumable,
  registerHandler,
  registerState
} from "./resumability.js";
export type { SerializedHandler, ResumableState } from "./resumability.js";

// Data Layer
export {
  createQuery,
  createMutation,
  queryCache,
  invalidateQueries,
  prefetchQuery
} from "./data-layer.js";
export type { QueryOptions, QueryResult, MutationOptions, MutationResult } from "./data-layer.js";

// Context API
export {
  createContext,
  useContext,
  createSignalContext,
  createReducerContext,
  combineProviders,
  createThemeContext
} from "./context.js";
export type { Context } from "./context.js";

// Animation & Motion
export {
  createAnimatedValue,
  easings,
  FLIPAnimator,
  attachGestures,
  createParallax
} from "./animation.js";
export type { AnimationOptions, SpringConfig, AnimatedValue, GestureHandlers } from "./animation.js";

// Internationalization
export {
  I18nProvider,
  useI18n,
  useTranslation,
  TranslationExtractor,
  AITranslationService,
  createLocaleMiddleware
} from "./i18n.js";
export type { Locale, Translations, I18nConfig, FormatOptions } from "./i18n.js";

// Error Boundaries
export {
  ErrorBoundary,
  setupGlobalErrorHandler,
  errorRecovery
} from "./error-boundary.js";
export type { ErrorInfo, ErrorBoundaryProps, ErrorCategory, ErrorSuggestion } from "./error-boundary.js";

// Service Worker
export {
  generateServiceWorker,
  registerServiceWorker,
  unregisterServiceWorkers,
  skipWaitingAndClaim,
  defaultCacheRules
} from "./service-worker.js";
export type { CacheStrategy, CacheRule, ServiceWorkerConfig } from "./service-worker.js";

// Performance & Intelligence
export { performanceBudgets, PerformanceBudgetManager, performanceBudgetPlugin } from "./performance-budgets.js";
export type { PerformanceBudget, RouteMetrics, RegressionReport } from "./performance-budgets.js";

export { costTracker, CostTracker } from "./cost-tracking.js";
export type { CostMetrics, CostEstimate, CloudProvider } from "./cost-tracking.js";

export { usageAnalytics, UsageAnalytics } from "./usage-analytics.js";
export type { ComponentUsage, DeadCodeReport, OptimizationSuggestion } from "./usage-analytics.js";

// Forms & Validation
export { useForm, v as validators, createField } from "./forms.js";
export type {
  FormApi,
  FormSchema,
  FieldSchema,
  ValidationRule,
  ValidationError,
  FormState,
  UseFormOptions,
  FieldProps
} from "./forms.js";
