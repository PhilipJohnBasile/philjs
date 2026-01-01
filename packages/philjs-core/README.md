# philjs-core

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Core signals, memos, and resources for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add philjs-core
```

## Usage

### Signals

```js
import { signal } from "philjs-core";

const count = signal(0);

console.log(count()); // 0

count.set(5);
console.log(count()); // 5

count.set((prev) => prev + 1);
console.log(count()); // 6

// Subscribe to changes
const unsubscribe = count.subscribe((value) => {
  console.log("Count changed:", value);
});

count.set(10); // Logs: "Count changed: 10"

unsubscribe();
```

### Memos

```js
import { signal, memo } from "philjs-core";

const count = signal(10);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 20
```

### Resources

```js
import { resource } from "philjs-core";

let apiData = { value: 1 };
const data = resource(() => apiData);

console.log(data()); // { value: 1 }

apiData = { value: 2 };
data.refresh();

console.log(data()); // { value: 2 }
```

### Async Operations with Promise.withResolvers()

```js
import { signal } from "philjs-core";

const data = signal(null);

// Using ES2024 Promise.withResolvers() for cleaner async control
async function fetchWithTimeout(url, timeout = 5000) {
  const { promise, resolve, reject } = Promise.withResolvers();

  const timer = setTimeout(() => reject(new Error("Timeout")), timeout);

  fetch(url)
    .then(res => res.json())
    .then(result => {
      clearTimeout(timer);
      data.set(result);
      resolve(result);
    })
    .catch(reject);

  return promise;
}
```

### Grouping Data with Object.groupBy()

```js
import { signal, memo } from "philjs-core";

const items = signal([
  { type: "fruit", name: "apple" },
  { type: "vegetable", name: "carrot" },
  { type: "fruit", name: "banana" },
]);

// Using ES2024 Object.groupBy() for cleaner grouping
const grouped = memo(() => Object.groupBy(items(), item => item.type));

console.log(grouped());
// { fruit: [...], vegetable: [...] }
```

### Resource Management with `using`

```ts
import { signal } from "philjs-core";

// Using TypeScript 6 explicit resource management
function createManagedResource() {
  const state = signal({ active: true });

  return {
    state,
    [Symbol.dispose]() {
      state.set({ active: false });
      console.log("Resource disposed");
    }
  };
}

function example() {
  using resource = createManagedResource();
  // resource is automatically disposed when scope exits
}
```

## TC39 Signals (Native-First)

Use the native Signals implementation when available and lazily load the polyfill when needed.

```ts
import { getSignalImpl, hasNativeSignals } from '@philjs/core/tc39-signals';

const Signal = await getSignalImpl();
const count = new Signal.State(0);

if (!hasNativeSignals()) {
  console.log('Polyfill loaded for TC39 Signals.');
}
```

If you need a synchronous polyfill in environments without native Signals, use:

```ts
import { Signal } from '@philjs/core/tc39-signals-polyfill';
```

## API

### `signal<T>(initial: T)`

Creates a reactive signal.

### `memo<T>(calc: () => T)`

Creates a memoized computation.

### `resource<T>(calc: () => T)`

Creates a resource that can be refreshed.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./signals, ./jsx-runtime, ./jsx-dev-runtime, ./render-to-string, ./hydrate, ./context, ./error-boundary, ./forms, ./i18n, ./animation, ./accessibility, ./ab-testing, ./result, ./core, ./resumability, ./data-layer, ./service-worker, ./performance-budgets, ./cost-tracking, ./usage-analytics, ./testing, ./superjson, ./superjson-perf, ./plugin-system, ./tiny, ./html, ./element, ./tc39-signals, ./tc39-signals-polyfill, ./view-transitions, ./navigation
- Source files: packages/philjs-core/src/index.ts, packages/philjs-core/src/signals.ts, packages/philjs-core/src/jsx-runtime.ts, packages/philjs-core/src/jsx-dev-runtime.ts, packages/philjs-core/src/render-to-string.ts, packages/philjs-core/src/hydrate.ts, packages/philjs-core/src/context.ts, packages/philjs-core/src/error-boundary.ts, packages/philjs-core/src/forms.ts, packages/philjs-core/src/i18n.ts, packages/philjs-core/src/animation.ts, packages/philjs-core/src/accessibility.ts, packages/philjs-core/src/ab-testing.ts, packages/philjs-core/src/result.ts, packages/philjs-core/src/core.ts, packages/philjs-core/src/resumability.ts, packages/philjs-core/src/data-layer.ts, packages/philjs-core/src/service-worker.ts, packages/philjs-core/src/performance-budgets.ts, packages/philjs-core/src/cost-tracking.ts, packages/philjs-core/src/usage-analytics.ts, packages/philjs-core/src/testing.ts, packages/philjs-core/src/superjson.ts, packages/philjs-core/src/superjson-perf.ts, packages/philjs-core/src/plugin-system.ts, packages/philjs-core/src/tiny.ts, packages/philjs-core/src/html.ts, packages/philjs-core/src/element.ts, packages/philjs-core/src/tc39-signals.ts, packages/philjs-core/src/tc39-signals-polyfill.ts, packages/philjs-core/src/view-transitions.ts, packages/philjs-core/src/navigation.ts

### Public API
- Direct exports: A11yConfig, A11yReport, A11yWarning, ABTest, ABTestConfig, ABTestEngine, AITranslationService, AnimatedValue, AnimationOptions, BuildConfig, BuildOutput, BuildResult, CacheRule, CacheStrategy, Cleanup, CloudProvider, ComponentUsage, CompressedSuperJSONResult, CompressionAlgorithm, Context, CostEstimate, CostMetrics, CostTracker, CustomTypeHandler, DeadCodeReport, DeserializeOptions, Directive, EasingFunction, EffectCleanup, EffectFn, EffectFunction, Element, Err, ErrorBoundary, ErrorBoundaryProps, ErrorCategory, ErrorInfo, ErrorRecovery, ErrorSuggestion, Experiment, ExperimentAssignment, ExperimentEvent, ExperimentResults, FLIPAnimator, FallbackUIPattern, FieldProps, FieldSchema, FocusManager, For, FormApi, FormSchema, FormState, FormatOptions, Fragment, GestureHandlers, Getter, HMROptions, I18nConfig, I18nProvider, IntrinsicAttributes, IntrinsicElements, JSX, JSXElement, KeyboardNavigator, LZCompression, LazyValue, LinkedSignal, LinkedSignalOptions, Locale, Memo, MutationOptions, MutationResult, NativeCompression, NavigateOptions, NavigationCallback, NavigationGuard, Ok, OptimizationSuggestion, Part, PerformanceBudget, PerformanceBudgetManager, PerformanceMetrics, PhilElementConstructor, Plugin, PluginConfigSchema, PluginContext, PluginFactory, PluginFileSystem, PluginHooks, PluginLogger, PluginManager, PluginMetadata, PluginPhase, PluginPreset, PluginUtils, PluralRules, PropUsageStats, PropertyOptions, QueryKey, QueryOptions, QueryResult, RegressionReport, RenderResult, Resource, ResourceFetcher, Result, ResumableState, RouteHandler, RouteMatch, RouteMetrics, RouteParams, Router, RouterOptions, Routes, SerializationMeta, SerializeOptions, SerializedHandler, ServiceWorkerConfig, Setter, Show, Signal, SignalComputed, SignalState, SignalWatcher, SimilarError, SnapshotTester, SpringConfig, StreamChunk, StreamingDeserializer, StreamingSerializer, SuperJSONResult, TargetingRules, TemplateResult, TinyElement, TinySignal, TransformResult, TranslationExtractor, TranslationKey, Translations, UsageAnalytics, UseFormOptions, User, VNode, ValidationError, ValidationRule, Variant, VariantResults, ViewTransitionOptions, ViewTransitionResult, addSkipLink, andThen, announceToScreenReader, assert, async, attachGestures, auditAccessibility, batch, cache, calculateSignificance, cleanupHMREffects, clearCustomTypes, clearHMRState, combineProviders, composePlugins, computed, configureA11y, costTracker, createAnimatedValue, createContext, createElement, createField, createFocusManager, createLoadingState, createLocaleMiddleware, createMultivariateTest, createMutation, createParallax, createPlugin, createQuery, createReducerContext, createRoot, createRouter, createSignalContext, createSpy, createSuperJSON, createTestComponent, createTestSignal, createThemeContext, crossfade, css, defaultCacheRules, definePlugin, definePreset, deserialize, deserializeWithDecompression, deserializeWithMetrics, easings, effect, enhanceWithAria, errorRecovery, expectAll, generateElementId, generateServiceWorker, getA11yConfig, getABTestEngine, getContrastRatio, getCustomTypes, getHMRStats, getHeadingWarnings, getNativeSignal, getResumableState, getSignalImpl, h, hasNativeSignals, html, hydrate, initABTesting, initDeclarativeTransitions, initResumability, installSignalPolyfill, interceptLinks, invalidateQueries, isCompressed, isErr, isHMRInProgress, isJSXElement, isOk, isResult, jsx, jsxDEV, jsxs, lazy, lazyObject, linkedSignal, listen, loadSignalPolyfill, map, mapErr, matchResult, memo, mock, morph, navigate, needsSerialization, nextTick, onCleanup, parse, perf, performanceBudgetPlugin, performanceBudgets, prefersReducedMotion, prefetchQuery, property, query, queryCache, registerCustomType, registerHandler, registerServiceWorker, registerState, render, renderToString, repeat, resetHeadingTracker, resource, restoreHMRState, resumable, resume, rollbackHMRState, scale, serialize, serializeHandler, serializeResumableState, serializeWithCompression, serializeWithMetrics, setupGlobalErrorHandler, signal, skipWaitingAndClaim, slide, snapshotHMRState, startA11yMonitoring, startViewTransition, state, store, stringify, supportsNavigationAPI, supportsViewTransitions, svg, unregisterServiceWorkers, unsafeHTML, until, untrack, unwrap, unwrapOr, usageAnalytics, useContext, useExperiment, useFeatureFlag, useForm, useHash, useI18n, useLocation, useSearchParams, useTranslation, v, validateColorContrast, validateHeadingHierarchy, wait, when
- Re-exported names: $, $$, // @deprecated - Use signal() and createSignalContext() instead
  combineProviders, A11yConfig, A11yReport, A11yWarning, ABTest, ABTestConfig, ABTestEngine, AITranslationService, APIPerformance, AnimatedValue, AnimationOptions, AsyncMutationOptions, AsyncOptions, AsyncState, AutoRegisterOptions, Breadcrumb, CSSProperties, CacheConfig, CacheRule, CacheStrategy, CloudProvider, ComponentPerformance, ComponentUsage, ContentCollection, ContentItem, ContentWithFrontmatter, Context, CopyFileOptions, CostEstimate, CostMetrics, CostTracker, DeadCodeReport, EffectCleanup, Err, ErrorBoundary, ErrorBoundaryProps, ErrorCategory, ErrorEvent, ErrorInfo, ErrorStats, ErrorSuggestion, ErrorTracker, ErrorTrackingOptions, Experiment, ExperimentAssignment, ExperimentEvent, ExperimentResults, FLIPAnimator, FieldProps, FieldSchema, FocusManager, FormApi, FormSchema, FormState, FormatOptions, Fragment, GestureHandlers, GetStatsOptions, GlobEager, GlobLazy, GlobOptions, GlobPathInfo, GlobResult, HydrationMap, I18nConfig, I18nProvider, JSXChild, JSXElement, KeyboardNavigator, LazyHandler, LinkedSignal, Locale, Memo, MutationOptions, MutationResult, Ok, OptimizationSuggestion, PathConfig, PerformanceBudget, PerformanceBudgetManager, PerformanceMark, PerformanceMetrics, PerformanceSnapshot, PerformanceTracker, PersistConfig, Plugin, QueryOptions, QueryResult, ReadDirOptions, ReadFileOptions, RegressionReport, RequestContext, Resource, ResourcePerformance, Result, ResumableState, RetryConfig, RouteMetadata, RouteMetrics, RouteModule, RouteParams, RuntimeBudget, SanitizeOptions, SerializableArray, SerializableObject, SerializableValue, SerializationOptions, SerializedHandler, SerializedState, ServiceWorkerConfig, SetStoreFunction, Signal, SpringConfig, Store, StoreMiddleware, StoreNode, StoreOptions, TargetingRules, TranslationExtractor, Translations, UsageAnalytics, UseFormOptions, User, UserContext, VNode, ValidationError, ValidationRule, Variant, VariantResults, VirtualModuleConfig, WatchOptions, WebVitalsMetric, WebVitalsMonitor, WebVitalsOptions, WriteFileOptions, addBreadcrumb, addSkipLink, andThen, announceToScreenReader, assets, asyncDisposable, attachGestures, auditAccessibility, autoRegister, base, batch, buildBreadcrumbs, buildPath, calculateSignificance, captureError, captureException, captureMessage, clearCache, clearCaches, clearSignalRegistry, configureA11y, configurePaths, constantTimeEqual, copyFile, costTracker, createAnimatedValue, createAsync, createAsyncDisposableScope, createAsyncMutation, createCollection, createConcurrencyLimiter, createContext, createCspNonce, createDir, createDisposableMutex, createDisposableScope, createElement, createField, createFocusManager, createLazyEventHandler, createLoadingState, createLocaleMiddleware, createMultivariateTest, createMutation, createParallax, createPerformanceReport, createQuery, createQueue, createReducerContext, createRoot, createSignalContext, createSlice, createStore, createStoreWithActions, createSuspenseResource, createThemeContext, createUndoableStore, debounceAsync, deepClone, deepEqual, defaultCacheRules, deleteDir, deleteFile, derive, deserialize, deserializeFromURL, dirExists, disposableAbortController, disposableEventListener, disposableInterval, disposableSubscription, disposableTimeout, easings, effect, enhanceForm, enhanceWithAria, errorRecovery, escapeAttr, escapeHtml, escapeJs, escapeUrl, exportPerformanceData, extractHydrationData, fileExists, filePathToRoute, fileUtils, filterByFrontmatter, filterGlob, fromJSON, generateSecureToken, generateServiceWorker, generateVirtualModuleTypes, getA11yConfig, getABTestEngine, getCacheStats, getCached, getContrastRatio, getDirectory, getErrorStats, getErrorTracker, getExtension, getFilename, getHeadingWarnings, getPerformanceTracker, getResumableState, getSerializationStats, getStats, getWebVitalsMetrics, getWebVitalsMonitor, glob, globUtils, groupContent, handlerRegistry, hydrate, hydrateFromSSR, hydrateLazyHandlers, importGlob, importPerformanceData, initABTesting, initErrorTracking, initResumability, initWebVitals, initializePlugins, injectHydrationData, invalidateCache, invalidateQueries, isErr, isJSXElement, isLazyHandler, isOk, isRelativePath, isResult, isValidEmail, joinPaths, jsx, jsxDEV, jsxs, linkedSignal, loadContent, loadContentWithFrontmatter, loadHandler, loadPlugins, loadRoutes, makeRelative, map, mapErr, mapGlob, matchFiles, matchPath, matchResult, measureAsync, measureSync, memo, monitorResources, moveFile, normalizePath, onCleanup, parseGlobPath, parseUrl, paths, pathsMatch, performanceBudgetPlugin, performanceBudgets, persistToLocalStorage, persistentSignal, prefetchHandler, prefetchQuery, preload, produce, queryCache, readDir, readFile, readJSON, reconcile, registerHandler, registerServiceWorker, registerState, render, renderToStream, renderToString, reportWebVitals, resetHeadingTracker, resolveAsset, resolveLazyHandlers, resolveRoute, resource, restoreFromLocalStorage, resumable, resume, safeJsonParse, sanitizeHtml, sanitizePath, sanitizeUrl, serialize, serializeForHydration, serializeLazyHandlers, serializeResumableState, serializeToURL, setCache, setContext, setTag, setUser, setupGlobalErrorHandler, signal, skipWaitingAndClaim, sortByFrontmatter, sortContent, startA11yMonitoring, subscribeToStore, throttleAsync, toAsyncDisposable, toDisposable, toJSON, unregisterServiceWorkers, untrack, unwrap, unwrapOr, urlSignal, usageAnalytics, useAPIPerformance, useContext, useCustomPerformance, useErrorBoundary, useExperiment, useFeatureFlag, useForm, useI18n, usePerformance, usePerformanceBudget, usePerformanceSnapshot, useTranslation, validateColorContrast, validateHeadingHierarchy, validators, virtualModulesPlugin, watchDir, watchFile, withErrorTracking, writeFile, writeJSON, writeVirtualModuleTypes
- Re-exported modules: ./ab-testing.js, ./accessibility.js, ./animation.js, ./async.js, ./context.js, ./cost-tracking.js, ./data-layer.js, ./disposable.js, ./error-boundary.js, ./error-tracking.js, ./file-utils.js, ./forms.js, ./glob.js, ./hydrate.js, ./i18n.js, ./jsx-runtime.js, ./lazy-handlers.js, ./paths.js, ./performance-budgets.js, ./performance-tracking.js, ./render-to-string.js, ./result.js, ./resumability.js, ./security.js, ./serialization.js, ./service-worker.js, ./signals.js, ./store.js, ./types.js, ./usage-analytics.js, ./virtual-modules.js, ./web-vitals.js
<!-- API_SNAPSHOT_END -->

## License

MIT
