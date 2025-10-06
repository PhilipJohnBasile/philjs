# PhilJS Architecture & Vision

## Core Philosophy

PhilJS combines the best ideas from modern web frameworks without their tradeoffs. We believe developers shouldn't have to choose between performance and developer experience.

## Core Architecture

### 1. Fine-Grained Reactivity with Signals ✅
- **Status**: IMPLEMENTED
- Following Solid.js and the new direction of React, Angular, and Vue
- Signals provide optimal performance without virtual DOM overhead
- Simple mental model with automatic dependency tracking

### 2. Resumability Over Hydration ✅
- **Status**: IMPLEMENTED
- Inspired by Qwik's approach
- Serializes state and resumes execution rather than re-executing on client
- Dramatically improves Time to Interactive (TTI)
- Zero-hydration for static content

### 3. Compiler-First Approach 🚧
- **Status**: PARTIALLY IMPLEMENTED
- Like Svelte, moves work to build time
- Static analysis for automatic optimizations
- Aggressive tree-shaking by default
- Automatic code splitting per route and component

## Developer Experience

### 4. TypeScript-Native ✅
- **Status**: IMPLEMENTED
- Designed from ground up for TypeScript
- Full type inference without excessive annotations
- Type-safe loaders, actions, and components

### 5. Unified Data Fetching 🚧
- **Status**: PLANNED
- Combines server-side data loading (like RSC) with client-side caching (like SWR)
- Automatic deduplication and revalidation
- Built-in optimistic updates
- Streaming data support

### 6. File-Based Routing ✅
- **Status**: IMPLEMENTED
- Nested layouts with composition
- Dynamic routes with parameters
- Catch-all routes
- Parallel and intercepting routes (planned)

### 7. Single-File Components 🚧
- **Status**: PLANNED
- Support both JSX (implemented) and template syntax
- Let developers choose their preference
- Co-location of styles, logic, and markup

## Performance Features

### 8. Partial Hydration (Islands) ✅
- **Status**: IMPLEMENTED
- Only hydrates interactive components
- Lazy loading with IntersectionObserver
- Automatic code splitting per island

### 9. Streaming SSR ✅
- **Status**: IMPLEMENTED
- Progressive rendering with Suspense
- Chunks flush as data becomes available
- Improved perceived performance

### 10. View Transitions ⚠️
- **Status**: HELPERS EXIST
- Smooth navigation using View Transitions API
- Automatic FLIP animations
- Customizable transitions per route

## Modern Primitives

### 11. Built-In State Management ⚠️
- **Status**: PARTIALLY IMPLEMENTED
- Signals for local state (done)
- Context for shared state (planned)
- No external state library needed

### 12. Suspense & Error Boundaries 🚧
- **Status**: SUSPENSE IMPLEMENTED
- First-class async handling
- Error boundaries for graceful failures
- Loading states without boilerplate

### 13. Form Actions ⚠️
- **Status**: BASIC IMPLEMENTATION
- Progressive enhancement - works without JS
- CSRF protection built-in
- Automatic validation and error handling

### 14. Optimistic UI 🚧
- **Status**: PLANNED
- Built-in patterns for instant feedback
- Automatic rollback on failure
- Conflict resolution helpers

## Tooling

### 15. Zero-Config by Default 🚧
- **Status**: PLANNED
- Works out of the box
- Smart defaults with escape hatches
- Convention over configuration

### 16. Vite Integration 🚧
- **Status**: PLANNED
- Fast dev server with instant HMR
- Build optimizations
- Plugin ecosystem compatibility

### 17. Integrated Testing 🚧
- **Status**: BASIC SETUP
- Component testing with Vitest
- E2E testing with Playwright
- Visual regression testing

### 18. Edge-Ready ⚠️
- **Status**: ARCHITECTURE READY
- Deploy to Cloudflare Workers
- Vercel Edge Functions
- AWS Lambda@Edge
- Traditional Node.js servers

## Developer Ergonomics

### 19. Excellent Error Messages 🚧
- **Status**: PLANNED
- Like Elm/Svelte - explains what's wrong and how to fix it
- Build-time and runtime error handling
- Stack traces with source maps

### 20. Time-Travel Debugging 🚧
- **Status**: PLANNED
- Built into dev tools
- State snapshots and replay
- Action history

### 21. Accessible by Default ⚠️
- **Status**: PARTIAL (ESLint plugin)
- Warnings for accessibility issues
- Semantic HTML encouraged
- ARIA helpers and headless components

### 22. CSS Solutions 🚧
- **Status**: PLANNED
- CSS Modules support
- CSS-in-JS with zero runtime
- Atomic CSS generation
- Design tokens system

## Implementation Status

### ✅ Complete (30%)
- Signals & reactivity
- JSX runtime & SSR
- File-based routing
- Nested layouts
- Islands architecture
- Resumability core
- TypeScript support
- Streaming SSR
- CSRF protection

### 🚧 In Progress (20%)
- Compiler optimizations
- Unified data fetching
- Error boundaries
- Zero-config tooling
- CSS solutions
- Testing framework

### 🔮 Planned (50%)
- Template syntax
- Context API
- Optimistic UI patterns
- Time-travel debugging
- Edge adapters
- CLI tool (create-philjs)
- Plugin system
- Dev server with HMR
- Visual regression testing
- I18n support

## Next Major Milestones

### Milestone 1: Data Layer (Q1 2025)
- Unified data fetching with server/client integration
- Built-in caching with stale-while-revalidate
- Optimistic updates and rollback
- Real-time subscriptions support

### Milestone 2: Developer Tooling (Q1 2025)
- Vite dev server integration
- Hot Module Replacement
- Better error messages with fix suggestions
- Chrome DevTools extension

### Milestone 3: Production Ready (Q2 2025)
- CLI tool for project scaffolding
- Edge deployment adapters
- Performance monitoring
- Bundle size optimization

### Milestone 4: Ecosystem (Q2 2025)
- Component library
- Form validation library
- Authentication helpers
- CMS integrations

## Key Differentiators

1. **No Hydration Penalty**: Resumability means zero JS execution for static content
2. **True Progressive Enhancement**: Forms and navigation work without JavaScript
3. **Optimal Bundle Splitting**: Automatic, intelligent code splitting
4. **Type Safety Without Boilerplate**: Full inference, minimal annotations
5. **Performance by Default**: Smart defaults guide toward best practices

## Design Principles

1. **Performance without compromise** - Fast by default, faster with effort
2. **Developer happiness** - Intuitive APIs, excellent errors, great docs
3. **Progressive enhancement** - Works without JS, better with it
4. **Type safety** - Catch errors at build time, not runtime
5. **Flexibility** - Conventions with escape hatches
6. **Modern standards** - Web platform APIs over abstractions

## Comparison to Other Frameworks

| Feature | PhilJS | Next.js | SvelteKit | Qwik | Solid | Astro |
|---------|--------|---------|-----------|------|-------|--------|
| No hydration | ✅ | ❌ | ❌ | ✅ | ❌ | ⚠️ |
| Fine-grained reactivity | ✅ | ❌ | ⚠️ | ❌ | ✅ | ❌ |
| Islands architecture | ✅ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| Streaming SSR | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| File-based routing | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Built-in state management | ✅ | ❌ | ⚠️ | ✅ | ✅ | ❌ |
| TypeScript-first | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Zero-config | 🚧 | ⚠️ | ✅ | ✅ | ❌ | ✅ |

## Getting Started

```bash
# Once CLI is ready (Q1 2025)
npm create philjs@latest my-app

# Current development
git clone https://github.com/yourusername/philjs
cd philjs
pnpm install
pnpm build
pnpm dev
```

## Genuinely Novel Features 🎯

### Performance Intelligence
- **Performance Budgets as First-Class** ✅ - Block builds exceeding size/LCP/CLS limits
- **Automatic Regression Detection** ✅ - Track metrics over time, warn on degradation
- **Cost Tracking Per Route** ✅ - Show estimated cloud costs ($0.23/1000 requests)
- **Smart Code Splitting** 🚧 - ML learns user patterns, pre-bundles accordingly

### Developer Intelligence
- **Component Usage Analytics** ✅ - Track actual production usage, suggest optimizations
- **Dead Code Detection** ✅ - "This function hasn't been called in 30 days"
- **Automatic API Optimization** ✅ - "87% pass same value for size prop, make it default"
- **Dependency Health Monitoring** 🚧 - Warn about unmaintained packages

### Visual Intelligence
- **Visual Regression Testing** 🚧 - Screenshot components, compare with baselines
- **Component Marketplace** 🚧 - Search/preview/install components in dev tools
- **Design Token Sync** 🚧 - Two-way sync with Figma/Sketch

### Debugging Intelligence
- **Production Debugging Mode** 🚧 - Secure, time-limited debug sessions
- **Git Blame in Errors** 🚧 - Show who wrote erroring code and when
- **Smart Error Recovery** 🚧 - Suggest fixes based on error patterns

### Automation Intelligence
- **Automatic A11y Fixes** 🚧 - "Fix all" button adds ARIA labels automatically
- **Automatic i18n Extraction** 🚧 - Detect hardcoded strings, offer translations
- **Automatic Documentation** ✅ - Generate from actual usage patterns
- **Automatic Changelog** 🚧 - Based on component changes

### Collaboration Features
- **Realtime Dev Mode** 🚧 - Multiple developers, live cursors, voice chat
- **State Time-Travel Branching** 🚧 - Fork timelines, explore "what if"
- **Presence Awareness** 🚧 - See who's viewing what in collaborative apps

### Build & Deploy Intelligence
- **Incremental Builds** 🚧 - Only rebuild what changed
- **Canary Deployments** 🚧 - Auto-rollback based on metrics
- **Preview Deployments** 🚧 - Auto-generate preview URLs for PRs

## Contributing

PhilJS is an ambitious project that needs community input. Key areas where we need help:

1. **Compiler optimizations** - Static analysis and build-time optimization
2. **Edge adapters** - Platform-specific deployment targets
3. **DevTools** - Browser extension and debugging tools
4. **Documentation** - Tutorials, guides, and examples
5. **Ecosystem** - Libraries and integrations

## Things We Explicitly Avoid ❌

### No Complexity Without Benefits
- **No class-based components** - Functional components won. Classes add complexity.
- **No HOCs** - Create wrapper hell. Use hooks/composition instead.
- **No lifecycle methods** - Confusing. Effects and cleanup are clearer.
- **No synthetic events** - Native DOM events work fine.

### No Magic or Implicit Behavior
- **No implicit globals** - Explicit imports enable tree-shaking.
- **No magic conventions** - File naming should be flexible, not forced.
- **No "use client"/"use server" directives** - Confusing boundaries.
- **No hidden network requests** - Clear server vs client separation.
- **No side effects in render** - Rendering must be pure.

### No Performance Footguns
- **No giant runtime** - Compiler does heavy lifting.
- **No CSS-in-JS runtime overhead** - Zero-runtime only.
- **No memoization requirements** - Framework should be fast by default.
- **No layout thrashing** - Batch DOM reads before writes.
- **No large polyfills** - Modern browsers first.

### No Developer Experience Traps
- **No proprietary syntax quirks** - Stay close to web standards.
- **No string-based refs** - Type-unsafe.
- **No mandatory decorators** - Not standardized.
- **No two-way binding by default** - Explicit data flow.
- **No useEffect for everything** - Provide proper primitives.

### No Configuration Hell
- **No massive config files** - Smart defaults, minimal config.
- **No webpack exposure** - Abstract build complexity.
- **No plugin ecosystem for basics** - Core features built-in.
- **No version conflicts** - One cohesive package.

### No Lock-in
- **No proprietary deployment requirements** - Deploy anywhere.
- **No closed-source components** - Everything inspectable.
- **No SaaS-only features** - Platform agnostic.
- **No telemetry without consent** - Privacy-first.

### No API Inconsistency
- **No inconsistent naming** - One convention throughout.
- **No abbreviations** - Spell it out for clarity.
- **No mutating props** - Immutable always.
- **No multiple ways to do the same thing** - One clear path.

### No Documentation Problems
- **No "coming soon" features** - Document what exists.
- **No separate TS docs** - TypeScript is the default.
- **No toy examples** - Production-ready code only.

### No Testing Nightmares
- **No required test runners** - Work with any tool.
- **No framework mocking** - Simple component testing.
- **No untestable patterns** - Everything unit-testable.

### No Migration Pain
- **No breaking changes without codemods** - Automated migrations.
- **No deprecated APIs without upgrade paths** - Clear fixes.
- **No "rewrite your app" upgrades** - Always gradual.

## Core Philosophy

**Explicit over implicit. Simple over clever. Obvious over magical.**

Every design decision should make the developer's intent clear, reduce cognitive load, and avoid surprising behavior. The framework should guide developers toward best practices through good defaults, not force them through restrictions.

## License

MIT