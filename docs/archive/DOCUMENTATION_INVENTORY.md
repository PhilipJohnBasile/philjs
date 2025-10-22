# Documentation Inventory
**Generated:** 2025-10-05
**Purpose:** Complete catalog of all APIs documented in PhilJS documentation

## Summary Statistics

- **Total Documentation Files:** 175 markdown files
- **API Reference Files:** 10 files
- **Learn Section Files:** 25 files
- **Tutorial Files:** 3 files
- **Migration Guides:** 3 files
- **Documented Import Statements Found:** 389+ instances
- **Code Examples:** 800+ examples across all docs

---

## APIs Documented by Package

### philjs-core

#### Signals & Reactivity
- **`signal<T>(initialValue: T): Signal<T>`**
  - Documented in:
    - `docs/learn/signals.md` (comprehensive guide with 50+ examples)
    - `docs/api-reference/core.md`
    - `docs/api-reference/reactivity.md` (detailed TypeScript signatures)
  - Parameters: `initialValue: T`
  - Returns: `Signal<T>` with methods `.set()`, `.subscribe()`, `.peek()`
  - Examples: 15+ code examples in learn section, 10+ in API reference
  - Usage shown in: 100+ documentation files

- **`memo<T>(computation: () => T): Memo<T>`**
  - Documented in:
    - `docs/learn/memos.md`
    - `docs/api-reference/core.md`
    - `docs/api-reference/reactivity.md`
  - Parameters: `computation: () => T`
  - Returns: `Memo<T>` (read-only function)
  - Examples: 12+ code examples
  - Usage shown in: 50+ files

- **`effect(fn: () => void | (() => void)): () => void`**
  - Documented in:
    - `docs/learn/effects.md`
    - `docs/api-reference/core.md`
    - `docs/api-reference/reactivity.md`
  - Parameters: `fn: () => void | (() => void)` (can return cleanup)
  - Returns: Dispose function
  - Examples: 10+ code examples
  - Usage shown in: 60+ files

- **`batch(fn: () => void): void`**
  - Documented in:
    - `docs/api-reference/core.md`
    - `docs/api-reference/reactivity.md`
  - Parameters: `fn: () => void`
  - Returns: `void`
  - Examples: 5+ code examples
  - Usage shown in: 20+ files

- **`untrack<T>(fn: () => T): T`**
  - Documented in:
    - `docs/api-reference/reactivity.md`
  - Parameters: `fn: () => T`
  - Returns: `T`
  - Examples: 3 code examples
  - Usage shown in: 5+ files

- **`onCleanup(fn: () => void): void`**
  - Documented in:
    - `docs/api-reference/core.md`
    - `docs/api-reference/reactivity.md`
  - Parameters: `fn: () => void`
  - Returns: `void`
  - Examples: 4 code examples

- **`createRoot<T>(fn: (dispose: () => void) => T): T`**
  - NOT documented in user-facing docs
  - Only appears in implementation

- **`resource<T>(fetcher: () => T | Promise<T>): Resource<T>`**
  - Mentioned in API docs but NO comprehensive documentation
  - Examples: Minimal

#### Context API
- **`createContext<T>(defaultValue?: T): Context<T>`**
  - Documented in:
    - `docs/learn/context.md`
    - `docs/api-reference/core.md`
    - `docs/api-reference/context.md` (comprehensive)
  - Parameters: `defaultValue?: T`
  - Returns: `Context<T>` with `.Provider` and `.Consumer`
  - Examples: 15+ code examples

- **`useContext<T>(context: Context<T>): T`**
  - Documented in:
    - `docs/learn/context.md`
    - `docs/api-reference/core.md`
    - `docs/api-reference/context.md`
  - Parameters: `context: Context<T>`
  - Returns: `T`
  - Examples: 10+ code examples
  - Usage shown in: 30+ files

- **`createSignalContext<T>(defaultValue: T)`**
  - Documented in: `docs/api-reference/context.md` (mentioned in patterns)
  - NOT in core API docs
  - Examples: Limited

- **`createReducerContext<State, Action>(reducer, initialState)`**
  - Documented in: `docs/api-reference/context.md`
  - Examples: 1 comprehensive example

- **`combineProviders(...providers)`**
  - Documented in: `docs/api-reference/context.md` (mentioned)
  - Examples: Minimal

- **`createThemeContext<T>(defaultTheme: T)`**
  - Documented in: `docs/api-reference/context.md` (mentioned)
  - Examples: Minimal

#### Component Rendering
- **`render(component: JSX.Element, container: HTMLElement): void`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/getting-started/quick-start.md`
    - `docs/getting-started/installation.md`
  - Parameters: `component`, `container`
  - Returns: `void`
  - Examples: 5+ code examples

- **`hydrate(component: JSX.Element, container: HTMLElement): void`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/api-reference/ssr.md`
  - Parameters: `component`, `container`
  - Returns: `void`
  - Examples: 3+ code examples

- **`Fragment`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/getting-started/your-first-component.md`
  - Usage: `<>...</>` or `<Fragment>...</Fragment>`
  - Examples: 5+ code examples

- **`lazy<P>(loader: () => Promise<{ default: Component<P> }>): Component<P>`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/learn/lazy-loading.md`
    - `docs/performance/code-splitting.md`
  - Parameters: `loader` function
  - Returns: Lazy component
  - Examples: 10+ code examples
  - Usage shown in: 20+ files

- **`Suspense`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/learn/suspense-async.md`
    - `docs/api-reference/ssr.md`
  - Props: `fallback: JSX.Element`, `children: JSX.Element`
  - Examples: 8+ code examples

- **`ErrorBoundary`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/learn/error-boundaries.md`
    - `docs/advanced/error-boundaries.md`
    - `docs/api-reference/ssr.md`
  - Props: `fallback`, `onError`, `children`
  - Examples: 10+ code examples
  - Usage shown in: 25+ files

- **`Portal`**
  - Documented in:
    - `docs/api-reference/components.md`
    - `docs/learn/portals.md`
    - `docs/advanced/portals.md`
  - Props: `children`, `container?`
  - Examples: 5+ code examples

- **`jsx()`, `jsxs()`, `jsxDEV()`, `createElement()`**
  - NOT documented (internal/compatibility APIs)

#### Data Fetching
- **`createQuery<T>(options: QueryOptions<T>): QueryResult<T>`**
  - Documented in:
    - `docs/api-reference/data.md`
    - `docs/data-fetching/queries.md`
  - Parameters: `key`, `fetcher`, `staleTime`, etc.
  - Returns: `QueryResult<T>`
  - Examples: 3+ code examples in API docs

- **`createMutation<TData, TVariables>(options): MutationResult<TData, TVariables>`**
  - Documented in:
    - `docs/api-reference/data.md`
    - `docs/data-fetching/mutations.md`
  - Parameters: `mutationFn`, callbacks
  - Returns: `MutationResult<TData, TVariables>`
  - Examples: 5+ code examples
  - Usage shown in: 10+ files

- **`invalidateQueries(keyPattern)`**
  - Documented in: `docs/data-fetching/mutations.md`
  - Parameters: `keyPattern?: QueryKey | ((key: QueryKey) => boolean)`
  - Examples: 3 examples

- **`queryCache`**
  - Documented in: `docs/api-reference/data.md` (mentioned)
  - Limited documentation

- **`prefetchQuery<T>(options): Promise<T>`**
  - Documented in: `docs/api-reference/core.md` (mentioned)
  - Examples: Minimal

#### Server-Side Rendering
- **`renderToString(component: JSX.Element): Promise<string>`**
  - Documented in: `docs/api-reference/ssr.md`
  - Parameters: `component`
  - Returns: `Promise<string>`
  - Examples: 3+ code examples

- **`renderToStream(component, options)`**
  - Documented in: `docs/api-reference/ssr.md`
  - Parameters: `component`, `options`
  - Returns: Stream
  - Examples: 2 examples

- **`renderToStaticMarkup(component): Promise<string>`**
  - Documented in: `docs/api-reference/ssr.md`
  - Parameters: `component`
  - Returns: `Promise<string>`
  - Examples: 1 example

#### Forms & Validation
- **`useForm(options)`**
  - Documented in:
    - `docs/forms/overview.md`
    - `docs/learn/forms.md`
  - Parameters: Schema and options
  - Returns: `FormApi`
  - Examples: 5+ code examples

- **`validators` (as `v`)**
  - Documented in: `docs/forms/validation.md`
  - Examples: Multiple validation examples

- **`createField()`**
  - Documented in: `docs/forms/overview.md` (mentioned)
  - Examples: Limited

#### Internationalization
- **`I18nProvider`**
  - Documented in: i18n docs
  - Props: config, translations, children
  - Examples: Limited

- **`useI18n()`**
  - Documented in: `docs/advanced/i18n.md`
  - Examples: Limited

- **`useTranslation()`**
  - Documented in: `docs/advanced/i18n.md`
  - Examples: Limited

- **`TranslationExtractor`, `AITranslationService`, `createLocaleMiddleware()`**
  - NOT documented in user docs

#### Animation & Motion
- **`createAnimatedValue()`**
  - Documented in: `docs/learn/animations.md`
  - Examples: Limited

- **`easings`**
  - NOT well documented

- **`FLIPAnimator`, `attachGestures()`, `createParallax()`**
  - NOT well documented

#### Error Handling
- **`setupGlobalErrorHandler()`**
  - Documented in: `docs/advanced/error-boundaries.md` (mentioned)
  - Examples: Minimal

- **`errorRecovery`**
  - NOT documented

#### Service Worker
- **`generateServiceWorker()`, `registerServiceWorker()`, `unregisterServiceWorkers()`, `skipWaitingAndClaim()`, `defaultCacheRules`**
  - Documented in: `docs/advanced/service-workers.md`
  - Examples: Limited

#### Performance & Intelligence
- **`performanceBudgets`, `PerformanceBudgetManager`, `performanceBudgetPlugin()`**
  - Documented in: `docs/performance/performance-budgets.md`
  - Examples: Limited

- **`costTracker`, `CostTracker`**
  - NOT documented in user docs

- **`usageAnalytics`, `UsageAnalytics`**
  - NOT documented in user docs

#### Resumability
- **`initResumability()`, `getResumableState()`, `serializeResumableState()`, `resume()`, `resumable()`, `registerHandler()`, `registerState()`**
  - Documented in: `docs/advanced/resumability.md`
  - Examples: Limited

### philjs-router

#### Core Router Components
- **`Router`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/overview.md`
    - `docs/routing/basics.md`
  - Props: `children`, `base?`
  - Examples: 10+ code examples
  - Usage shown in: 40+ files

- **`Route`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/overview.md`
  - Props: `path`, `component`, `exact?`
  - Examples: 15+ code examples
  - Usage shown in: 40+ files

- **`Link`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/navigation.md`
  - Props: `to`, `replace?`, `className?`, `activeClassName?`
  - Examples: 10+ code examples
  - Usage shown in: 30+ files

- **`Navigate`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/error-handling.md`
    - `docs/routing/route-guards.md`
  - Props: `to`
  - Examples: 5+ code examples
  - Usage shown in: 10+ files

#### Router Hooks
- **`useRouter()`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/navigation.md`
  - Returns: `Router` object
  - Examples: 8+ code examples

- **`useNavigate()`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/navigation.md`
  - Returns: `Navigate` function
  - Examples: 5+ code examples

- **`useParams<T>()`**
  - Documented in:
    - `docs/api-reference/router.md`
    - `docs/routing/dynamic-routes.md`
  - Returns: `T` (route parameters)
  - Examples: 15+ code examples
  - Usage shown in: 35+ files

- **`useLocation()`**
  - Documented in: `docs/api-reference/router.md`
  - Returns: `() => Location`
  - Examples: 3+ code examples

- **`useSearchParams()`**
  - Documented in: `docs/api-reference/router.md`
  - Returns: `{ searchParams, setSearchParams }`
  - Examples: 5+ code examples

- **`usePathname()`**
  - Documented in: `docs/routing/error-handling.md`
  - Examples: 3+ code examples

#### Advanced Router Features
- **`createRouter(manifest)`**
  - NOT documented in user-facing docs

- **`discoverRoutes()`, `matchRoute()`, `findLayouts()`, `applyLayouts()`**
  - NOT documented in user-facing docs

#### Smart Preloading
- **`SmartPreloader`, `initSmartPreloader()`, `getSmartPreloader()`, `usePreload()`, `preloadLink()`, `calculateClickIntent()`, `predictNextRoute()`**
  - NOT documented in user-facing docs

#### View Transitions
- **`ViewTransitionManager`, `initViewTransitions()`, `getViewTransitionManager()`, `navigateWithTransition()`, `markSharedElement()`, `transitionLink()`, `supportsViewTransitions()`, `animateFallback()`**
  - Partially documented in: `docs/routing/view-transitions.md`
  - Examples: Limited

#### Route Guards
- **`redirect()`, `createDataLoader()`**
  - Documented in: `docs/routing/route-guards.md`
  - Examples: 2-3 examples

### philjs-ssr

#### SSR Core
- **`handleRequest()`, `renderToStreamingResponse()`, `Suspense`**
  - NOT documented in user docs (exported but no docs)

#### Static Generation
- **`StaticGenerator`, `RedisISRCache`, `buildStaticSite()`, `configureRoute()`, `ssg()`, `isr()`, `ssr()`, `csr()`, `handleRevalidation()`, `createRenderingMiddleware()`**
  - Partially documented in: `docs/advanced/ssg.md`, `docs/advanced/isr.md`
  - Examples: Limited

#### Server Functions
- **`createServerFunction<T>(fn): T`**
  - Documented in: `docs/api-reference/ssr.md`
  - Examples: 3+ code examples

- **`useRequest()`**
  - Documented in: `docs/api-reference/ssr.md`
  - Examples: 2 examples

#### Security & CSRF
- **`csrfProtection()`, `generateCSRFToken()`, `csrfField()`, `extractCSRFToken()`**
  - NOT documented in user docs

#### Rate Limiting
- **`RateLimiter`, `MemoryRateLimitStore`, `RedisRateLimitStore`, `SlidingWindowRateLimiter`, `AdaptiveRateLimiter`, `rateLimit()`, `apiRateLimit()`, `authRateLimit()`, `apiKeyRateLimit()`, `userRateLimit()`**
  - NOT documented in user docs

### philjs-islands

- **`registerIsland()`, `loadIsland()`, `initIslands()`, `Island`, `mountIslands()`, `hydrateIsland()`**
  - Partially documented in: `docs/advanced/islands.md`
  - Examples: Very limited

### philjs-ai

- **`createPrompt(spec)`, `createAI(provider)`, `providers.http(url)`, `providers.echo()`**
  - NOT documented in user docs

### philjs-devtools

- **`TimeTravelDebugger`, `initTimeTravel()`, `getTimeTravelDebugger()`, `debugSignal()`, `diffState()`, `showOverlay()`**
  - NOT documented in user docs (entire package)

### philjs-cli

- **CLI commands**
  - Documented in: `docs/api-reference/cli.md`
  - Examples: Limited

---

## Documentation Quality Assessment

### COMPREHENSIVE (10/10):
- Core reactivity (signal, memo, effect, batch)
- Context API (createContext, useContext)
- Component rendering (render, hydrate)
- Basic routing (Router, Route, Link)
- Router hooks (useParams, useNavigate, useLocation)

### GOOD (7-9/10):
- Lazy loading & code splitting
- Suspense & ErrorBoundary
- Dynamic routes
- Forms basics
- SSR/SSG basics

### MODERATE (4-6/10):
- Data fetching (queries, mutations)
- Advanced routing (view transitions, nested routes)
- Islands architecture
- Performance budgets
- I18n

### POOR (1-3/10):
- AI integration (0/10 - no user docs)
- DevTools (0/10 - no user docs)
- Smart preloading (0/10)
- Cost tracking (0/10)
- Usage analytics (0/10)
- Resumability details (2/10)
- Security APIs (CSRF, rate limiting) (0/10)
- Animation APIs (3/10)

---

## Top Documentation Issues

1. **Novel Features Completely Undocumented:** philjs-ai, philjs-devtools, cost tracking, usage analytics
2. **Advanced Router Features Missing:** Smart preloading, route discovery APIs
3. **SSR Security Not Documented:** Rate limiting, CSRF protection
4. **Type Signatures Incomplete:** Many APIs lack full TypeScript documentation
5. **Control Flow Components Missing:** Show, For, Switch, Match not in API docs
6. **Inconsistent Naming:** Some docs use `createSignal` but code has `signal`

---

## Code Example Statistics

- **Total Examples:** 800+
- **Import Examples:** 389+ documented import statements
- **Working Examples:** ~70% (many reference non-existent APIs)
- **TypeScript Examples:** ~60% include TypeScript
- **SSR/SSG Examples:** ~15 examples
- **Real-world Patterns:** Good coverage in best practices section

---

## Documentation Files by Section

### API Reference (10 files)
- core.md, reactivity.md, components.md, context.md, router.md, ssr.md, data.md, config.md, cli.md, overview.md

### Learn (25+ files)
- signals.md, memos.md, effects.md, context.md, components.md, forms.md, styling.md, etc.

### Routing (15+ files)
- overview.md, basics.md, dynamic-routes.md, navigation.md, layouts.md, middleware.md, etc.

### Data Fetching (11 files)
- queries.md, mutations.md, caching.md, server-functions.md, etc.

### Forms (8 files)
- overview.md, validation.md, submission.md, etc.

### Performance (13 files)
- overview.md, code-splitting.md, memoization.md, profiling.md, etc.

### Advanced (12 files)
- ssr.md, ssg.md, isr.md, islands.md, resumability.md, testing.md, etc.

### Styling (10 files)
- css-modules.md, tailwind.md, css-in-js.md, animations.md, etc.

### Best Practices (13 files)
- architecture.md, performance.md, security.md, testing.md, etc.

### Troubleshooting (8 files)
- common-issues.md, debugging.md, faq.md, etc.

---

**TOTAL:** 175 markdown files, ~150 substantive documentation pages
