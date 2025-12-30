# API Stability & Versioning

This document outlines the stability guarantees, deprecation policies, and versioning strategy for PhilJS APIs.

## Table of Contents

- [Stability Badges](#stability-badges)
- [Stable APIs](#stable-apis)
- [Experimental APIs](#experimental-apis)
- [Deprecated APIs](#deprecated-apis)
- [Migration Paths](#migration-paths)
- [Versioning Policy](#versioning-policy)
- [Breaking Changes](#breaking-changes)

---

## Stability Badges

PhilJS uses stability badges to communicate the maturity and support level of each API:

### ![Stable](https://img.shields.io/badge/stability-stable-brightgreen) Stable

**Production-ready.** These APIs are thoroughly tested, widely used, and guaranteed not to change without a major version bump. Breaking changes will include comprehensive migration guides and deprecation warnings.

### ![Experimental](https://img.shields.io/badge/stability-experimental-orange) Experimental

**Use with caution.** These APIs are feature-complete and tested but may undergo breaking changes in minor versions based on community feedback. Suitable for early adopters and non-critical applications.

### ![Beta](https://img.shields.io/badge/stability-beta-yellow) Beta

**Under active development.** These APIs are functional but incomplete. API surface may change significantly. Best for testing and feedback, not production use.

### ![Deprecated](https://img.shields.io/badge/stability-deprecated-red) Deprecated

**Scheduled for removal.** These APIs will be removed in the next major version. Migration guides are provided. Warnings are logged in development mode.

---

## Stable APIs

These APIs are production-ready and guaranteed to remain stable.

### Core Reactivity ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

The foundation of PhilJS's reactive system. Battle-tested and performant.

```typescript
import {
  signal,
  memo,
  effect,
  batch,
  untrack,
  onCleanup,
  createRoot
} from 'philjs-core';
```

#### `signal<T>(initialValue: T): Signal<T>`

Create a reactive signal with getter/setter interface.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

```typescript
const count = signal(0);
count();           // 0
count.set(1);      // Update
count.set(c => c + 1); // Functional update
```

#### `memo<T>(fn: () => T): Memo<T>`

Create a memoized computed value that only recalculates when dependencies change.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

```typescript
const doubled = memo(() => count() * 2);
```

#### `effect(fn: () => void | (() => void)): () => void`

Create a side effect that runs when dependencies change.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

```typescript
effect(() => {
  console.log('Count:', count());
});
```

#### `batch(fn: () => void): void`

Batch multiple updates to trigger effects only once.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

```typescript
batch(() => {
  count.set(1);
  name.set('Alice');
  // Effects run once after batch completes
});
```

#### `untrack<T>(fn: () => T): T`

Run a function without tracking dependencies.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `onCleanup(fn: () => void): void`

Register a cleanup function for the current effect.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `createRoot<T>(fn: (dispose: () => void) => T): T`

Create a non-tracking reactive scope with manual disposal.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### JSX Runtime ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Rendering and component composition.

```typescript
import { jsx, jsxs, Fragment, createElement } from 'philjs-core';
```

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Component Rendering ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Client-side rendering and hydration.

```typescript
import { render, hydrate } from 'philjs-core';
```

#### `render(component: JSXElement, container: HTMLElement): void`

Mount a component to the DOM.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `hydrate(component: JSXElement, container: HTMLElement): void`

Hydrate server-rendered HTML with interactivity.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Server-Side Rendering ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Generate HTML on the server.

```typescript
import { renderToString, renderToStream } from 'philjs-core';
```

#### `renderToString(component: JSXElement): Promise<string>`

Render a component to an HTML string.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `renderToStream(component: JSXElement): ReadableStream`

Render a component to a streaming response.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Context API ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Dependency injection and state sharing.

```typescript
import {
  createContext,
  useContext,
  createSignalContext
} from 'philjs-core';
```

#### `createContext<T>(defaultValue: T): Context<T>`

Create a context for passing data through the component tree.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `useContext<T>(context: Context<T>): T`

Access the nearest context value in the tree.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

#### `createSignalContext<T>(defaultValue: T)`

Create a context with reactive signal integration.

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Error Boundaries ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Error handling and recovery.

```typescript
import { ErrorBoundary } from 'philjs-core';
```

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Forms & Validation ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Type-safe form handling with built-in validation.

```typescript
import { useForm, validators as v } from 'philjs-core';
```

**Stability:** Stable since v0.1.0
**Breaking Change Risk:** None

---

### Islands Architecture ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Selective hydration for performance.

```typescript
import { Island, mountIslands, registerIsland } from 'philjs-islands';
```

**Stability:** Stable since v0.2.0
**Breaking Change Risk:** Low

---

### Data Layer ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Data fetching and caching.

```typescript
import {
  createQuery,
  createMutation,
  queryCache,
  invalidateQueries
} from 'philjs-core';
```

**Stability:** Stable since v0.3.0
**Breaking Change Risk:** Low

---

### Internationalization ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Multi-language support with AI-powered translation.

```typescript
import { I18nProvider, useI18n, useTranslation } from 'philjs-core';
```

**Stability:** Stable since v0.4.0
**Breaking Change Risk:** Low

---

### Animation & Motion ![Stable](https://img.shields.io/badge/stability-stable-brightgreen)

Declarative animations and gesture handling.

```typescript
import {
  createAnimatedValue,
  easings,
  FLIPAnimator,
  attachGestures
} from 'philjs-core';
```

**Stability:** Stable since v0.5.0
**Breaking Change Risk:** Low

---

## Experimental APIs

These APIs are feature-complete but may change based on feedback.

### Server Islands with Caching ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Per-component server-side rendering with intelligent caching.

```typescript
import {
  ServerIsland,
  cacheIsland,
  invalidateIslandsByTag
} from 'philjs-islands/server';
```

**Status:** Experimental since v0.9.0
**Target Stable:** v1.0.0 (Q1 2026)
**Breaking Change Risk:** Medium

**What might change:**
- Cache configuration API
- Cache adapter interface
- Metrics API

**Example:**

```typescript
<ServerIsland
  id="user-recommendations"
  cache={{ ttl: 300, tags: ['user'] }}
  fallback={<Skeleton />}
>
  <Recommendations userId={userId} />
</ServerIsland>
```

**Use in production?** Yes, but be prepared for cache API changes in minor versions.

---

### Linked Signals ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Bidirectional writable computed values.

```typescript
import { linkedSignal } from 'philjs-core';
```

**Status:** Experimental since v0.9.0
**Target Stable:** v1.0.0 (Q1 2026)
**Breaking Change Risk:** Low

**What might change:**
- API naming (may become `writable` or `computed`)
- Synchronization behavior edge cases

**Example:**

```typescript
const count = signal(0);
const doubled = linkedSignal(() => count() * 2, (value) => count.set(value / 2));

doubled.set(10); // count becomes 5
```

**Use in production?** Yes, core behavior is stable.

---

### Accessibility Features ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Automatic accessibility enhancements and auditing.

```typescript
import {
  configureA11y,
  enhanceWithAria,
  validateHeadingHierarchy,
  auditAccessibility,
  announceToScreenReader,
  createFocusManager,
  KeyboardNavigator
} from 'philjs-core/accessibility';
```

**Status:** Experimental since v0.9.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Medium

**What might change:**
- Configuration API structure
- Audit report format
- Some helper function signatures

**Use in production?** Yes, but monitor release notes for API changes.

---

### A/B Testing ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Built-in experimentation framework.

```typescript
import {
  ABTestEngine,
  initABTesting,
  useExperiment,
  ABTest,
  useFeatureFlag
} from 'philjs-core/ab-testing';
```

**Status:** Experimental since v0.9.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Medium

**What might change:**
- Targeting rules API
- Analytics integration interface
- Configuration format

**Use in production?** Yes for simple A/B tests, but complex targeting may change.

---

### Resource API ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Async data loading with Suspense-like patterns.

```typescript
import { resource } from 'philjs-core';
```

**Status:** Experimental since v0.1.0
**Target Stable:** v1.0.0 (Q1 2026)
**Breaking Change Risk:** Medium

**What might change:**
- Error handling API
- Suspense integration
- Cancellation behavior

---

### Result Type ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Rust-style error handling.

```typescript
import {
  Ok,
  Err,
  isOk,
  isErr,
  matchResult,
  unwrap,
  unwrapOr
} from 'philjs-core/result';
```

**Status:** Experimental since v0.8.0
**Target Stable:** v1.0.0 (Q1 2026)
**Breaking Change Risk:** Low

**What might change:**
- Additional utility methods
- TypeScript type inference improvements

---

### Resumability ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Zero-hydration resumability (like Qwik).

```typescript
import {
  initResumability,
  resumable,
  registerHandler,
  resume
} from 'philjs-core/resumability';
```

**Status:** Experimental since v0.6.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** High

**What might change:**
- Serialization format
- Event handler registration
- State management API

**Use in production?** Not recommended yet. API is still evolving.

---

### Service Worker Generation ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Automatic PWA service worker generation.

```typescript
import {
  generateServiceWorker,
  registerServiceWorker
} from 'philjs-core/service-worker';
```

**Status:** Experimental since v0.7.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Medium

---

### Performance Budgets ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Automated performance monitoring.

```typescript
import { PerformanceBudgetManager } from 'philjs-core/performance-budgets';
```

**Status:** Experimental since v0.7.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Low

---

### Cost Tracking ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Cloud cost estimation and tracking.

```typescript
import { costTracker, CostTracker } from 'philjs-core/cost-tracking';
```

**Status:** Experimental since v0.7.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Low

---

### Usage Analytics ![Experimental](https://img.shields.io/badge/stability-experimental-orange)

Dead code detection and usage tracking.

```typescript
import { usageAnalytics, UsageAnalytics } from 'philjs-core/usage-analytics';
```

**Status:** Experimental since v0.7.0
**Target Stable:** v1.0.0 (Q2 2026)
**Breaking Change Risk:** Low

---

## Beta APIs

These APIs are planned for upcoming releases.

### Partial Pre-rendering (PPR) ![Beta](https://img.shields.io/badge/stability-beta-yellow)

Static shell pre-rendering with dynamic content streaming.

**Status:** Planned for v1.0.0 (Q1 2026 - Week 5-7)
**Currently:** Not yet implemented
**Breaking Change Risk:** High (API not finalized)

**Proposed API:**

```typescript
// Planned API (subject to change)
import { prerender, dynamic } from 'philjs-core/ppr';

export default function Page() {
  return (
    <div>
      <Header /> {/* Pre-rendered */}
      <dynamic>
        <UserContent userId={userId} /> {/* Streamed dynamically */}
      </dynamic>
    </div>
  );
}
```

**Do not use yet.** API is not stable.

---

### Activity Component ![Beta](https://img.shields.io/badge/stability-beta-yellow)

Priority-based deferred rendering (like React `<Activity>`).

**Status:** Planned for v1.0.0 (Q1 2026 - Week 11-12)
**Currently:** Not yet implemented
**Breaking Change Risk:** High (API not finalized)

**Proposed API:**

```typescript
// Planned API (subject to change)
import { Activity } from 'philjs-core';

<Activity priority="low">
  <Comments /> {/* Deferred until high-priority content renders */}
</Activity>
```

**Do not use yet.** API is not stable.

---

### Auto-Compiler ![Beta](https://img.shields.io/badge/stability-beta-yellow)

Automatic reactivity compilation (like Svelte/Solid).

**Status:** Planned for v1.0.0 (Q1 2026 - Week 1-4)
**Currently:** Not yet implemented
**Breaking Change Risk:** Medium

**Proposed usage:**

```typescript
// Vite config
import { philjs } from '@philjs/compiler/vite';

export default {
  plugins: [philjs({ compiler: true })]
};
```

**Do not use yet.** Compiler API is under development.

---

## Deprecated APIs

These APIs will be removed in v1.0.0.

### `createReducerContext()` ![Deprecated](https://img.shields.io/badge/stability-deprecated-red)

Redux-style reducer context.

**Deprecated:** v0.9.0
**Removal:** v1.0.0 (Q1 2026)
**Migration:** Use `signal()` and `createSignalContext()` instead

**Why deprecated:** Encourages complex Redux patterns that signals eliminate. Direct state management is simpler and more performant.

**Migration path:**

```typescript
// ❌ Old way (deprecated):
const CounterContext = createReducerContext(
  (state, action) => {
    switch (action.type) {
      case 'increment': return state + 1;
      case 'decrement': return state - 1;
      default: return state;
    }
  },
  0
);

const { useDispatch } = CounterContext;
const dispatch = useDispatch();
dispatch({ type: 'increment' });

// ✅ New way (recommended):
const CounterContext = createSignalContext(0);

// In component:
const count = useContext(CounterContext);
count.set(count.get() + 1); // Direct update
```

**See also:** [Migration Guide: From Redux Patterns](../migration/from-redux.md)

---

## Migration Paths

### General Migration Strategy

1. **Update dependencies:**
   ```bash
   pnpm update philjs-core philjs-islands
   ```

2. **Check deprecation warnings** in development mode
3. **Read release notes** for breaking changes
4. **Run tests** to catch breaking changes
5. **Use codemods** when provided for automated migration

---

### Experimental to Stable Migration

When experimental APIs become stable, no code changes are typically required. However:

- **Import paths may change** (e.g., from `philjs-core/experimental` to `philjs-core`)
- **Some configuration options may be renamed**
- **Default behaviors may be optimized**

Always check release notes when upgrading.

---

### Handling Breaking Changes

**Before major version updates:**

1. Fix all deprecation warnings in current version
2. Read the [CHANGELOG.md](../../CHANGELOG.md)
3. Review the specific [Migration Guide](../migration/overview.md)
4. Test in a staging environment
5. Update incrementally (e.g., v0.9 → v1.0, not v0.8 → v1.0)

---

## Versioning Policy

PhilJS follows **Semantic Versioning 2.0.0** (semver.org):

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (v0 → v1): Breaking changes, API removals
- **MINOR** (v1.0 → v1.1): New features, experimental API changes
- **PATCH** (v1.0.0 → v1.0.1): Bug fixes, performance improvements

---

### Pre-1.0 Versioning (Current Phase)

During v0.x development:

- **Breaking changes may occur in MINOR versions** (v0.8 → v0.9)
- **Experimental APIs may change without warning**
- **Deprecation warnings provided when possible**

This allows rapid iteration while building toward v1.0.0.

---

### Post-1.0 Versioning (Stability Guarantee)

After v1.0.0 release:

- **Breaking changes ONLY in MAJOR versions** (v1.x → v2.0)
- **Experimental APIs may still change in MINOR versions**
- **Stable APIs guaranteed backward compatible within MAJOR version**
- **Deprecations announced at least 6 months before removal**

---

### Release Schedule

- **Patch releases:** As needed (bug fixes, security)
- **Minor releases:** Every 6-8 weeks (new features)
- **Major releases:** Annually or when necessary (breaking changes)

---

### Long-Term Support (LTS)

Starting from v1.0.0:

- **Current major version:** Full support (features + fixes)
- **Previous major version:** Security fixes for 12 months
- **Older versions:** No official support (community-driven)

**Example:**
- v2.0.0 released → v1.x gets security fixes for 12 months
- v3.0.0 released → v1.x support ends, v2.x gets 12 months

---

## Breaking Changes

### What Constitutes a Breaking Change

**Breaking changes include:**

✅ Removing a public API
✅ Changing function signatures
✅ Changing default behavior that affects output
✅ Removing or renaming exports
✅ Requiring new peer dependencies
✅ Dropping support for Node/browser versions

**Not breaking changes:**

❌ Internal implementation changes
❌ Performance improvements (unless behavior changes)
❌ Bug fixes (even if code relied on the bug)
❌ Adding new APIs (backward compatible)
❌ Experimental API changes (marked as experimental)
❌ TypeScript type refinements (if code still compiles)

---

### Breaking Change Process

1. **Announce deprecation** in MINOR release with warnings
2. **Provide migration guide** in documentation
3. **Wait for next MAJOR release** to remove
4. **Offer codemods** when possible for automated migration

---

### Deprecation Warnings

Deprecated APIs log warnings in development mode:

```
[PhilJS] DEPRECATION WARNING: createReducerContext() is deprecated.
Use signal() and createSignalContext() instead for simpler state management.
This function will be removed in v1.0.0.
See: https://philjs.dev/docs/migration/from-redux
```

**To suppress warnings** (not recommended):

```typescript
// Set environment variable
process.env.PHILJS_SUPPRESS_WARNINGS = 'true';
```

---

## Stability Timeline

### Current Status (v0.9.0 - December 2025)

- **Stable APIs:** Core reactivity, rendering, SSR, context, data layer
- **Experimental APIs:** Server Islands, linkedSignal, A/B testing, accessibility
- **Beta APIs:** PPR, Activity Component, Auto-Compiler (planned)
- **Deprecated APIs:** `createReducerContext()`

---

### v1.0.0 (Q1 2026 - Target: March 2026)

**Stable:**
- All current experimental APIs (Server Islands, linkedSignal, A/B testing, accessibility)
- PPR (Partial Pre-rendering)
- Activity Component
- Auto-Compiler

**Experimental:**
- Resumability enhancements
- Time-travel debugging
- Type-safe CSS

**Removed:**
- `createReducerContext()` (deprecated in v0.9.0)

---

### v1.5.0 (Q2 2026 - Target: June 2026)

**New Stable:**
- Time-travel debugging
- Type-safe CSS
- Visual Inspector

**New Experimental:**
- AI Component Generation
- Enhanced HMR

---

### v2.0.0 (Q3 2026 - Target: September 2026)

**Breaking Changes:**
- Improved TypeScript types (may break edge cases)
- Compiler becomes default (opt-out via config)
- SSR streaming V2 (new API)

**New Stable:**
- AI Component Generation
- Collaborative State Sync
- Multi-Tenancy

---

## API Stability Checklist

When evaluating whether to use an API in production:

- [ ] Check the stability badge in this document
- [ ] Review the "Breaking Change Risk" rating
- [ ] Read the "What might change" section if experimental
- [ ] Check release notes for recent changes
- [ ] Test in staging environment first
- [ ] Monitor [GitHub Discussions](https://github.com/philjs/philjs/discussions) for community feedback
- [ ] Subscribe to [Release Notifications](https://github.com/philjs/philjs/releases)

---

## Resources

- **[CHANGELOG.md](../../CHANGELOG.md)** - All releases and changes
- **[Migration Guides](../migration/overview.md)** - Version upgrade guides
- **[Roadmap](../../ROADMAP_2026.md)** - Future API plans
- **[GitHub Discussions](https://github.com/philjs/philjs/discussions)** - Community feedback
- **[API Reference](./overview.md)** - Complete API documentation

---

## Contributing

Found an error in this document? APIs marked incorrectly? Please [open an issue](https://github.com/philjs/philjs/issues) or submit a pull request.

---

**Last Updated:** December 2025
**Current Version:** v0.9.0
**Next Major Release:** v1.0.0 (Q1 2026)
