# PhilJS Consolidated Reference

Status: 2025-XX-XX • Maintainer notes that align published documentation with the actual code in this repository.

This document cross-links each package's public surface with its implementation so writers and engineers can keep the rest of the documentation honest. Paths reference the source files under `packages/`.

---

## philjs-core

Source entry: `packages/philjs-core/src/index.ts`

- **Reactivity primitives** — `signal`, `memo`, `resource`, `effect`, `batch`, `untrack`, `onCleanup`, `createRoot` (`signals.ts`)
- **JSX runtime** — `jsx`, `jsxs`, `jsxDEV`, `Fragment`, `createElement`, `isJSXElement` (`jsx-runtime.ts`)
- **Rendering** — `render`, `hydrate` (`hydrate.ts`), `renderToString`, `renderToStream` (`render-to-string.ts`)
- **Resumability** — `initResumability`, `serializeResumableState`, `resume`, `resumable`, `registerHandler`, `registerState` (`resumability.ts`)
- **Data layer** — `createQuery`, `createMutation`, cache helpers (`data-layer.ts`)
- **Context helpers** — `createContext`, `useContext`, `createSignalContext`, `combineProviders`, etc. (`context.ts`)
- **Animation toolkit** — `createAnimatedValue`, `FLIPAnimator`, gesture helpers (`animation.ts`)
- **Internationalisation** — `I18nProvider`, `useTranslation`, `AITranslationService` (`i18n.ts`)
- **Error boundaries** — `ErrorBoundary`, `setupGlobalErrorHandler`, `errorRecovery` (`error-boundary.ts`)
- **Service worker generator** — `generateServiceWorker`, `registerServiceWorker`, cache helpers (`service-worker.ts`)
- **Performance tooling** — `performanceBudgets`, `PerformanceBudgetManager`, plugin utilities (`performance-budgets.ts`)
- **Intelligence features**
  - Cost tracking: `costTracker`, `CostTracker`, and related types (`cost-tracking.ts`)
  - Usage analytics: `usageAnalytics`, `UsageAnalytics` (`usage-analytics.ts`)

> ❗ Documentation gaps: existing guides cover reactivity, forms, and usage analytics, but we still lack API reference pages for cost tracking and the performance budget manager.

---

## philjs-router

Source entry: `packages/philjs-router/src/index.ts`

- **Manifest helpers** — `createRouter(manifest)` returns a lightweight container for discovered routes.
- **Discovery utilities** — `discoverRoutes`, `matchRoute`, and the `RoutePattern` type (`discovery.ts`)
- **Nested layout support** — `findLayouts`, `applyLayouts`, `LayoutChain` (`layouts.ts`)
- **Smart preloading** — `SmartPreloader`, singleton helpers, hooks, and utilities such as `calculateClickIntent` and `predictNextRoute` (`smart-preload.ts`)
- **View transitions** — `ViewTransitionManager`, `initViewTransitions`, `navigateWithTransition`, shared-element helpers, and fallbacks (`view-transitions.ts`)

> ⚠️ The previous documentation referenced `<Router>`, `<Route>`, and `useRouter()` APIs that do not exist. Replace those examples with manifest-based routing or mark them as planned features.

---

## philjs-islands

Source entry: `packages/philjs-islands/src/index.ts`

- Registers island modules and lazy loaders (`island-loader.ts`)
- DOM helpers `mountIslands(root?)` and `hydrateIsland(element)` to hydrate `island`-annotated nodes (`index.ts`)

---

## philjs-ssr

Source entry: `packages/philjs-ssr/src/index.ts`

- **Streaming & resumability** — `renderToStreamingResponse`, `Suspense`, request `handleRequest`, resume helpers (`streaming.ts`, `resume.ts`, `request-handler.ts`)
- **Security** — `csrfProtection`, token helpers (`csrf.ts`), CSP & headers via `security.ts`
- **Static generation** — `StaticGenerator`, `RedisISRCache`, `buildStaticSite`, per-route mode helpers `ssg`, `isr`, `ssr`, `csr`, `handleRevalidation` (`static-generation.ts`)
- **Rate limiting** — Multiple strategies (`RateLimiter`, `SlidingWindowRateLimiter`, `AdaptiveRateLimiter`) plus convenience factories (`rate-limit.ts`)
- **Hints** — `preloadTag`, `prefetchScript`, and other resource hint helpers (`hints.ts`)

---

## philjs-devtools

Source entry: `packages/philjs-devtools/src/index.ts`

- **Time-travel debugging** — `TimeTravelDebugger`, `initTimeTravel`, `getTimeTravelDebugger`, `debugSignal`, `diffState` (`time-travel.ts`)
- **Overlay UI** — `showOverlay()` generates an in-browser panel with hydration, bundle, and AI cost stats.

> 📌 Documentation exists at `docs/advanced/devtools.md`. Ensure API examples reference the `TimeTravelDebugger` class rather than hypothetical browser extensions.

---

## philjs-ai

Source entry: `packages/philjs-ai/src/index.ts`

- `createPrompt<TIn, TOut>(spec)` to define type-safe prompt contracts.
- `createAI(provider)` minimal client orchestrator with policy hooks.
- Built-in providers: `providers.http(url)` (REST endpoint integration) and `providers.echo()` for testing.
- Types exported from `types.ts` (`PromptSpec`, `Provider`, etc.).

Relevant documentation: `docs/advanced/ai-integration.md`. Align examples with the actual `createPrompt`/`createAI` signatures.

---

## Guidance for Documentation Authors

- Audit every page that imports `{ Router, Route, Link, useRouter }` from `philjs-router`. Replace them with manifest/discovery examples or explicitly mark them as future API.
- When referencing advanced features (usage analytics, cost tracking, performance budgets), link to the actual source modules listed above to ensure code snippets stay truthful.
- For tutorials, prefer showing how to combine `discoverRoutes`, `matchRoute`, and `applyLayouts` rather than relying on non-existent JSX components.

Keeping this reference up to date will make future audits faster and stop stale documentation from resurfacing.
