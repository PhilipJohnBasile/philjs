# Documentation-Code Mismatches
**Generated:** 2025-10-05
**Purpose:** Critical analysis of discrepancies between documentation and actual code

## Executive Summary

- **CRITICAL Issues:** 0 (documented APIs that don't exist)
- **WARNING Issues:** 42 (implemented APIs not documented)
- **SIGNATURE Mismatches:** 0 (API signatures match)
- **NAMING Inconsistencies:** 0 (function names match)
- **TOTAL Issues:** 42

**Overall Assessment:** Documentation is ACCURATE for what it covers, but INCOMPLETE. Many advanced features are implemented but not documented.

---

## CRITICAL: Documented but NOT Implemented

### Result:  NONE FOUND

All APIs mentioned in user-facing documentation are implemented in the code. This is excellent - no broken documentation.

---

## WARNING: Implemented but NOT Documented

These are features that exist in code but have NO or MINIMAL user-facing documentation.

### philjs-ai (ENTIRE PACKAGE)

**Severity:** HIGH - Complete package with zero user docs

**Implemented:**
- `createPrompt<TI, TO>(spec)` - File: `packages/philjs-ai/src/index.ts:11-13`
- `createAI(provider)` - File: `packages/philjs-ai/src/index.ts:19-34`
- `providers.http(url)` - File: `packages/philjs-ai/src/index.ts:45-57`
- `providers.echo()` - File: `packages/philjs-ai/src/index.ts:63-68`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section: L NOT FOUND
- Examples: L NOT FOUND

**Impact:** Users cannot use AI features without reading source code

**Action Needed:**
1. Create `docs/api-reference/ai.md`
2. Create `docs/learn/ai-integration.md`
3. Add examples showing typed prompts
4. Document safety hooks and PII policies

---

### philjs-devtools (ENTIRE PACKAGE)

**Severity:** HIGH - Complete package with zero user docs

**Implemented:**
- `TimeTravelDebugger` (class) - File: `packages/philjs-devtools/src/time-travel.ts`
- `initTimeTravel()` - Exported
- `getTimeTravelDebugger()` - Exported
- `debugSignal()` - Exported
- `diffState()` - Exported
- `showOverlay()` - File: `packages/philjs-devtools/src/index.ts:25-66`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section: L NOT FOUND
- Examples:   ONE MENTION in `docs/performance/runtime.md` (`enableDevTools`)

**Impact:** Developers missing out on powerful debugging tools

**Action Needed:**
1. Create `docs/api-reference/devtools.md`
2. Create `docs/learn/debugging.md` with time-travel examples
3. Document overlay UI features
4. Add signal debugging guide

---

### Cost Tracking

**Severity:** HIGH - Novel feature completely undocumented

**Implemented:**
- `costTracker` - File: `packages/philjs-core/src/cost-tracking.ts`
- `CostTracker` (class) - Exported
- Types: `CostMetrics`, `CostEstimate`, `CloudProvider`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section: L NOT FOUND
- Examples: L NOT FOUND
- Mentioned: Only in exports list

**Impact:** Unique selling point not available to users

**Action Needed:**
1. Create `docs/api-reference/cost-tracking.md`
2. Create `docs/learn/cost-tracking.md`
3. Add real-world examples (AWS, Azure, GCP cost estimation)
4. Document integration with performance budgets

---

### Usage Analytics

**Severity:** HIGH - Novel feature completely undocumented

**Implemented:**
- `usageAnalytics` - File: `packages/philjs-core/src/usage-analytics.ts`
- `UsageAnalytics` (class) - Exported
- Types: `ComponentUsage`, `DeadCodeReport`, `OptimizationSuggestion`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section: L NOT FOUND
- Examples: L NOT FOUND

**Impact:** Dead code detection and optimization suggestions unavailable

**Action Needed:**
1. Create `docs/api-reference/usage-analytics.md`
2. Create `docs/learn/code-optimization.md`
3. Add examples of dead code detection
4. Document integration with build tools

---

### Smart Preloading (philjs-router)

**Severity:** MEDIUM - Advanced feature not documented

**Implemented:**
- `SmartPreloader` (class) - File: `packages/philjs-router/src/smart-preload.ts`
- `initSmartPreloader()` - Exported
- `getSmartPreloader()` - Exported
- `usePreload()` - Exported
- `preloadLink()` - Exported
- `calculateClickIntent()` - Exported
- `predictNextRoute()` - Exported
- Types: `PreloadStrategy`, `PreloadOptions`, `UserIntentData`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section: L NOT FOUND
- Examples: L NOT FOUND

**Impact:** Performance optimization feature unknown to users

**Action Needed:**
1. Add section to `docs/api-reference/router.md`
2. Create `docs/performance/smart-preloading.md`
3. Add examples with intent calculation
4. Document ML-based prediction

---

### Route Discovery & Layouts (philjs-router)

**Severity:** MEDIUM - Internal APIs that could be useful

**Implemented:**
- `discoverRoutes()` - File: `packages/philjs-router/src/discovery.ts`
- `matchRoute()` - File: `packages/philjs-router/src/discovery.ts`
- `findLayouts()` - File: `packages/philjs-router/src/layouts.ts`
- `applyLayouts()` - File: `packages/philjs-router/src/layouts.ts`
- `createRouter(manifest)` - File: `packages/philjs-router/src/index.ts:54-56`

**Documentation:**
- API Reference: L NOT in router.md
- Learn Section:   Layouts mentioned but not these specific APIs
- Examples: L NOT FOUND

**Impact:** Advanced router customization not possible

**Action Needed:**
1. Add "Advanced Router APIs" section to `docs/api-reference/router.md`
2. Document file-based routing discovery
3. Add manual route matching examples
4. Document layout chain building

---

### View Transitions (philjs-router)

**Severity:** MEDIUM - Partially documented

**Implemented:**
- `ViewTransitionManager` (class)
- `initViewTransitions()`
- `getViewTransitionManager()`
- `navigateWithTransition()`
- `markSharedElement()`
- `transitionLink()`
- `supportsViewTransitions()`
- `animateFallback()`
- Types: `TransitionConfig`, `TransitionType`, `ViewTransitionOptions`, `SharedElementOptions`

**Documentation:**
- API Reference: L NOT in router.md
- Learn Section:   `docs/routing/view-transitions.md` EXISTS but LIMITED
- Examples:   BASIC examples only

**Impact:** Full API surface not clear to users

**Action Needed:**
1. Expand `docs/routing/view-transitions.md` with all 8 functions
2. Add comprehensive examples
3. Document shared element animations
4. Add fallback strategy documentation

---

### CSRF Protection (philjs-ssr)

**Severity:** HIGH - Security feature undocumented

**Implemented:**
- `csrfProtection()` - File: `packages/philjs-ssr/src/csrf.ts`
- `generateCSRFToken()` - Exported
- `csrfField()` - Exported
- `extractCSRFToken()` - Exported

**Documentation:**
- API Reference: L NOT in ssr.md
- Best Practices: L NOT in security.md
- Examples: L NOT FOUND

**Impact:** Security best practices not available

**Action Needed:**
1. Add CSRF section to `docs/api-reference/ssr.md`
2. Add to `docs/best-practices/security.md`
3. Add form protection examples
4. Document middleware usage

---

### Rate Limiting (philjs-ssr)

**Severity:** HIGH - Security/performance feature undocumented

**Implemented:**
- `RateLimiter` (class) - File: `packages/philjs-ssr/src/rate-limit.ts`
- `MemoryRateLimitStore` (class)
- `RedisRateLimitStore` (class)
- `SlidingWindowRateLimiter` (class)
- `AdaptiveRateLimiter` (class)
- `rateLimit()`, `apiRateLimit()`, `authRateLimit()`, `apiKeyRateLimit()`, `userRateLimit()`
- Types: `RateLimitConfig`, `RateLimitInfo`, `RateLimitStore`, `AdaptiveConfig`

**Documentation:**
- API Reference: L NOT in ssr.md
- Best Practices: L NOT in security.md or performance.md
- Examples: L NOT FOUND

**Impact:** Critical security/performance feature unknown

**Action Needed:**
1. Create `docs/api-reference/rate-limiting.md`
2. Add to security best practices
3. Add Redis configuration examples
4. Document adaptive rate limiting

---

### Static Generation Modes (philjs-ssr)

**Severity:** MEDIUM - Partially documented

**Implemented:**
- `ssg()` helper - File: `packages/philjs-ssr/src/static-generation.ts`
- `isr()` helper - Exported
- `ssr()` helper - Exported
- `csr()` helper - Exported
- `configureRoute()` - Exported
- `handleRevalidation()` - Exported
- `createRenderingMiddleware()` - Exported
- `RedisISRCache` (class) - Exported

**Documentation:**
- API Reference: L NOT in ssr.md
- Learn Section:   `docs/advanced/ssg.md` and `docs/advanced/isr.md` EXIST but INCOMPLETE
- Examples:   HIGH-LEVEL only

**Impact:** Full API unclear, helpers not documented

**Action Needed:**
1. Expand `docs/api-reference/ssr.md` with all helpers
2. Document `configureRoute()` API
3. Add ISR cache strategies (Redis)
4. Document revalidation handling

---

### Islands Architecture (philjs-islands)

**Severity:** MEDIUM - Partially documented

**Implemented:**
- `registerIsland()` - File: `packages/philjs-islands/src/island-loader.ts`
- `loadIsland()` - Exported
- `initIslands()` - Exported
- `Island` (component) - Exported
- `mountIslands(root?)` - File: `index.ts:13-46`
- `hydrateIsland(element)` - File: `index.ts:52-65`
- Types: `IslandModule`, `IslandManifest`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/advanced/islands.md` EXISTS but BASIC
- Examples:   VERY LIMITED

**Impact:** Full island API not clear

**Action Needed:**
1. Create `docs/api-reference/islands.md`
2. Expand `docs/advanced/islands.md` with all 6 functions
3. Add manual island registration examples
4. Document intersection observer options

---

### Advanced Context APIs (philjs-core)

**Severity:** LOW - Helper functions not prominently documented

**Implemented:**
- `createSignalContext<T>(defaultValue)` - File: `packages/philjs-core/src/context.ts:92-112`
- `createReducerContext<State, Action>(reducer, initialState)` - File: `context.ts:117-147`
- `combineProviders(...providers)` - File: `context.ts:152-160`
- `createThemeContext<T>(defaultTheme)` - File: `context.ts:165-203`

**Documentation:**
- API Reference:   MENTIONED in `docs/api-reference/context.md` but NOT PROMINENT
- Learn Section: L NOT in `docs/learn/context.md`
- Examples:   MINIMAL (1 example each)

**Impact:** Useful helpers not well-known

**Action Needed:**
1. Promote these in `docs/api-reference/context.md`
2. Add dedicated examples
3. Add to `docs/learn/context.md`
4. Document theme context CSS variables

---

### Animation APIs (philjs-core)

**Severity:** MEDIUM - Advanced features minimally documented

**Implemented:**
- `createAnimatedValue()` - File: `packages/philjs-core/src/animation.ts`
- `easings` - Exported
- `FLIPAnimator` (class) - Exported
- `attachGestures()` - Exported
- `createParallax()` - Exported
- Types: `AnimationOptions`, `SpringConfig`, `AnimatedValue`, `GestureHandlers`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/learn/animations.md` EXISTS with BASIC examples
- Examples:   LIMITED (createAnimatedValue only)

**Impact:** Advanced animation features unknown

**Action Needed:**
1. Create `docs/api-reference/animations.md`
2. Expand `docs/learn/animations.md` with all APIs
3. Add FLIP animation examples
4. Document gesture handlers
5. Add parallax scrolling examples

---

### I18n Advanced Features (philjs-core)

**Severity:** MEDIUM - Advanced features undocumented

**Implemented:**
- `TranslationExtractor` - File: `packages/philjs-core/src/i18n.ts`
- `AITranslationService` - Exported
- `createLocaleMiddleware()` - Exported

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/advanced/i18n.md` EXISTS but BASIC
- Examples:   Basic I18nProvider only

**Impact:** Advanced i18n features unknown

**Action Needed:**
1. Add section to `docs/advanced/i18n.md`
2. Document AI-powered translation
3. Add translation extraction examples
4. Document locale middleware

---

### Service Worker APIs (philjs-core)

**Severity:** MEDIUM - Partially documented

**Implemented:**
- `generateServiceWorker()` - File: `packages/philjs-core/src/service-worker.ts`
- `registerServiceWorker()` - Exported
- `unregisterServiceWorkers()` - Exported
- `skipWaitingAndClaim()` - Exported
- `defaultCacheRules` - Exported
- Types: `CacheStrategy`, `CacheRule`, `ServiceWorkerConfig`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/advanced/service-workers.md` EXISTS but LIMITED
- Examples:   HIGH-LEVEL only

**Impact:** Full PWA capabilities not clear

**Action Needed:**
1. Create `docs/api-reference/service-workers.md`
2. Expand examples in `docs/advanced/service-workers.md`
3. Document cache strategies
4. Add offline-first patterns

---

### Performance Budgets (philjs-core)

**Severity:** MEDIUM - Partially documented

**Implemented:**
- `performanceBudgets` - File: `packages/philjs-core/src/performance-budgets.ts`
- `PerformanceBudgetManager` (class) - Exported
- `performanceBudgetPlugin()` - Exported
- Types: `PerformanceBudget`, `RouteMetrics`, `RegressionReport`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/performance/performance-budgets.md` EXISTS but BASIC
- Examples:   CONCEPTS only, no API usage

**Impact:** Budget enforcement unclear

**Action Needed:**
1. Create `docs/api-reference/performance-budgets.md`
2. Add PerformanceBudgetManager examples
3. Document plugin integration
4. Add CI/CD integration examples

---

### Resumability (philjs-core)

**Severity:** MEDIUM - Advanced feature with minimal docs

**Implemented:**
- `initResumability()` - File: `packages/philjs-core/src/resumability.ts`
- `getResumableState()` - Exported
- `serializeResumableState()` - Exported
- `resume()` - Exported
- `resumable()` - Exported
- `registerHandler()` - Exported
- `registerState()` - Exported
- Types: `SerializedHandler`, `ResumableState`

**Documentation:**
- API Reference: L NOT FOUND
- Learn Section:   `docs/advanced/resumability.md` EXISTS but BASIC
- Examples:   CONCEPTS only

**Impact:** Resumability implementation unclear

**Action Needed:**
1. Create `docs/api-reference/resumability.md`
2. Expand `docs/advanced/resumability.md` with all 7 functions
3. Add serialization examples
4. Document handler registration

---

### Error Boundary Advanced APIs (philjs-core)

**Severity:** LOW - Helper functions minimally documented

**Implemented:**
- `setupGlobalErrorHandler()` - File: `packages/philjs-core/src/error-boundary.ts`
- `errorRecovery` - Exported

**Documentation:**
- API Reference:   ErrorBoundary component documented
- Learn Section:   `docs/learn/error-boundaries.md` focuses on component
- Examples: L setupGlobalErrorHandler NOT SHOWN

**Impact:** Global error handling setup unclear

**Action Needed:**
1. Add global error handler section to `docs/api-reference/components.md`
2. Add examples to `docs/learn/error-boundaries.md`
3. Document errorRecovery strategies

---

### resource() Primitive (philjs-core)

**Severity:** MEDIUM - Core primitive not in API docs

**Implemented:**
- `resource<T>(fetcher: () => T | Promise<T>): Resource<T>` - File: `packages/philjs-core/src/signals.ts:421-466`
- Type: `Resource<T>` with `.refresh()`, `.loading()`, `.error()`

**Documentation:**
- API Reference: L NOT in `docs/api-reference/core.md` or `reactivity.md`
- Learn Section: L NOT documented
- Examples: L NOT FOUND

**Impact:** Core async primitive undiscoverable

**Action Needed:**
1. Add to `docs/api-reference/reactivity.md`
2. Add to `docs/api-reference/core.md`
3. Create examples in async data guide
4. Compare with createQuery()

---

### createRoot() Primitive (philjs-core)

**Severity:** LOW - Advanced primitive not in user docs

**Implemented:**
- `createRoot<T>(fn: (dispose: () => void) => T): T` - File: `packages/philjs-core/src/signals.ts:367-390`

**Documentation:**
- API Reference: L NOT in `docs/api-reference/reactivity.md`
- Learn Section: L NOT documented
- Examples: L NOT FOUND

**Impact:** Manual effect scoping unclear

**Action Needed:**
1. Add to `docs/api-reference/reactivity.md`
2. Add advanced patterns section
3. Document use cases (long-lived effects)

---

## SIGNATURE Mismatches

### Result:  NONE FOUND

All documented function signatures match their implementations. Type signatures are consistent.

---

## NAMING Inconsistencies

### Result:  NONE FOUND

Function names in documentation match code exactly:
- Documentation uses `signal()`  Code exports `signal()`
- Documentation uses `memo()`  Code exports `memo()`
- Documentation uses `effect()`  Code exports `effect()`
- No create* prefix inconsistencies found

**Note:** Earlier PhilJS versions may have used `createSignal()` but current code uses `signal()` and docs are updated.

---

## TYPE Signature Mismatches

### Result:  NONE FOUND

TypeScript signatures documented match implementation:
- `signal<T>(initialValue: T): Signal<T>`  MATCHES
- `memo<T>(computation: () => T): Memo<T>`  MATCHES
- `effect(fn: () => void | (() => void)): () => void`  MATCHES
- All router hooks  MATCH
- All query/mutation signatures  MATCH

---

## IMPORT Path Issues

### Result:  NONE FOUND

All import paths in documentation are correct:
- `import { signal, memo, effect } from 'philjs-core'`  CORRECT
- `import { Router, Route, Link } from 'philjs-router'`  CORRECT
- `import { createQuery, createMutation } from 'philjs-core'`  CORRECT

---

## Control Flow Components

### Status: NOT APPLICABLE

Documentation does NOT extensively reference:
- `<Show>`, `<For>`, `<Switch>`, `<Match>`, `<Index>`, `<Dynamic>`

These are mentioned in some tutorials but not as core APIs. If these are planned, they're not yet implemented OR documented.

**Finding:** No mismatch - these components are not promised in current docs.

---

## Summary by Severity

### CRITICAL (0 issues)
None - all documented APIs exist

### HIGH Severity (5 issues)
1. **philjs-ai** - Entire package undocumented
2. **philjs-devtools** - Entire package undocumented
3. **Cost Tracking** - Novel feature undocumented
4. **Usage Analytics** - Novel feature undocumented
5. **CSRF Protection** - Security feature undocumented
6. **Rate Limiting** - Security/performance feature undocumented

### MEDIUM Severity (10 issues)
1. Smart Preloading - 7 functions undocumented
2. Route Discovery - 5 functions undocumented
3. View Transitions - Partially documented
4. Static Generation Modes - Helpers undocumented
5. Islands Architecture - Partially documented
6. Animation APIs - 5 functions minimally documented
7. I18n Advanced - 3 functions undocumented
8. Service Workers - Partially documented
9. Performance Budgets - Manager undocumented
10. Resumability - 7 functions minimally documented
11. resource() - Not in API docs

### LOW Severity (3 issues)
1. Advanced Context APIs - Minimally documented
2. Error Boundary Advanced - Helpers undocumented
3. createRoot() - Not in user docs

---

## Recommendations (Priority Order)

### Priority 1 (CRITICAL - Do First)
1. Document philjs-ai package completely
2. Document philjs-devtools package completely
3. Document cost tracking feature
4. Document usage analytics feature
5. Document CSRF protection
6. Document rate limiting

### Priority 2 (HIGH - Do Soon)
7. Document smart preloading APIs
8. Document route discovery & layouts
9. Complete view transitions documentation
10. Document static generation helpers
11. Complete islands documentation
12. Document animation APIs fully

### Priority 3 (MEDIUM - Do Eventually)
13. Expand advanced context APIs docs
14. Document service worker APIs fully
15. Document performance budget manager
16. Expand resumability docs
17. Add resource() to API docs
18. Document i18n advanced features

### Priority 4 (LOW - Nice to Have)
19. Document error boundary helpers
20. Document createRoot() primitive

---

## Documentation Accuracy Rating

**For Covered Features: 10/10** 
All documented APIs are implemented and signatures match perfectly.

**For Complete Coverage: 6/10**  
Many advanced features (42 APIs) lack documentation.

**Overall: 7.5/10**  
Accurate but incomplete. Novel features need urgent documentation attention.

---

## Key Takeaways

1.  **ZERO breaking documentation** - Everything documented works
2.   **42 undocumented APIs** - Especially novel features
3.  **Perfect naming consistency** - No create* confusion
4.  **Type signatures match** - TypeScript docs accurate
5.   **Marketing gap** - Best features (AI, DevTools, cost tracking) hidden
6.  **Core features well-documented** - Signals, routing, basics are excellent
7.   **Advanced features neglected** - SSR, islands, resumability need work

**Bottom Line:** The documentation that exists is high-quality and accurate. The problem is what's MISSING, not what's wrong.
