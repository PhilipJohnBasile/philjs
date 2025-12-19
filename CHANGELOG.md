# Changelog

All notable changes to PhilJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Production Build Pipeline (Week 7-8)
- **Production build presets** with optimized configurations for different deployment scenarios
  - Production preset with aggressive minification and code splitting
  - Development preset with fast rebuilds and enhanced debugging
  - Library preset for building reusable packages
- **Advanced bundle optimization** with automatic minification and tree shaking
  - Console statement removal (debug, log, trace)
  - Development code elimination
  - Constant inlining for better compression
  - String operation optimization
- **Smart chunk splitting strategies** for optimal caching
  - Vendor chunk separation (PhilJS, framework, other libraries)
  - Route-based code splitting
  - Utility module extraction
  - Manual chunk configuration support
- **Bundle analysis and reporting** with detailed metrics
  - Visual bundle breakdown with size bars
  - Dependency graph generation
  - Complexity analysis
  - Tree-shaking detection
  - Performance budget checking
- **Asset optimization pipeline**
  - Image optimization with configurable limits
  - SVG optimization
  - Font subsetting support
  - Inline size threshold configuration
- **Performance budgets** with CI/CD integration
  - Initial bundle size limits
  - Per-chunk size limits
  - Total bundle size limits
  - Automatic violation detection and reporting
- **Resource hints generation**
  - Preload hints for critical chunks
  - Prefetch hints for lazy-loaded chunks
  - Automatic hint injection
- **Production build documentation** with comprehensive guides
  - Build preset usage examples
  - Optimization strategies
  - CI/CD integration guides
  - Troubleshooting tips

### Changed

### Deprecated

### Fixed

### Security

## [2.0.0] - 2025-12-18

### Added

#### Foundation & Testing
- **Comprehensive test coverage** across all core packages with 85%+ coverage
- **Edge case testing** for signals, error boundaries, and SSR scenarios
- **Real-world integration tests** for compiler with complex component patterns
- **Enhanced error boundary tests** with recovery scenarios and nested boundaries
- **Router enhanced testing** with complex navigation patterns and edge cases
- **SSR comprehensive tests** including streaming, islands, and hydration

#### Developer Experience
- **TypeScript strict mode** enabled across all packages for maximum type safety
- **Improved compiler error messages** with actionable suggestions and context
- **Better Vite plugin** with HMR support and development-time optimizations
- **Enhanced DevTools extension scaffolding** for browser-based debugging
- **AI-powered code optimization** suggestions in error messages
- **Performance dashboard** with real-time metrics and benchmarks

#### Documentation
- **Complete API reference** for core, router, and SSR packages
- **Advanced guides** for i18n, SEO, web workers, and state management
- **Migration guides** from React, Vue, and Svelte with code examples
- **Deployment guides** for Vercel, Netlify, Docker, and Cloudflare
- **Troubleshooting guides** for common build errors, hydration mismatches, and TypeScript issues
- **Best practices** documentation for state management and performance optimization
- **Framework comparison table** showing PhilJS advantages
- **Why PhilJS** guide explaining framework philosophy and benefits

#### Build & Performance
- **Improved tree-shaking** for philjs-core with better side-effects configuration
- **Performance budgets** with build-time enforcement and CI integration
- **Benchmark runner** for tracking performance across releases
- **Bundle size optimization** reducing core to ~15KB gzipped
- **Cost tracking utilities** for cloud deployment optimization
- **Usage analytics** for dead code detection

#### Compiler & Build Tools
- **Batch detection improvements** for better optimization identification
- **Vite plugin enhancements** with proper HMR and module resolution
- **Rollup plugin improvements** for better production builds
- **Source map support** for easier debugging
- **Better dependency tracking** in compiled output

#### Examples & Templates
- **6 new example applications**: chat-app, collab-editor, dashboard, pwa-app, saas-starter, and enhanced storefront
- **Playwright test configurations** for demo-app and todo-app
- **Real-world patterns** demonstrated in examples
- **CLI templates** for quick project scaffolding

#### Package Ecosystem
- **philjs-eslint**: Official ESLint plugin with framework-specific rules
- **philjs-devtools**: Runtime developer tools with signal inspection
- **Enhanced philjs-testing**: Better testing utilities with Vitest integration
- **philjs-cli**: Command-line interface for project management

### Changed
- **Breaking: Version bump to 2.0.0** - Signifies production readiness
- **Marked `createReducerContext` as deprecated** - Use signals directly instead
- **Updated all peer dependencies** to use ^2.0.0 version ranges
- **Improved signal performance** with optimized dependency tracking
- **Enhanced compiler batch detection** with better heuristics
- **Refined error messages** across all packages for better debugging
- **Updated documentation structure** with better organization and navigation
- **Improved monorepo build** - All 29+ packages compile successfully
- **Better test coverage** with focus on real-world scenarios
- **Enhanced examples** with more realistic use cases

### Deprecated
- **`createReducerContext`** - Encourages Redux-style patterns that signals eliminate
  - **Reason**: Signals provide a more elegant and performant solution
  - **Alternative**: Use `signal()` and `createSignalContext()` instead
  - **Removal**: Will be removed in v3.0.0

### Fixed
- **Test suite issues** across all packages - 200+ tests now passing
- **Build errors** in monorepo - all packages compile cleanly
- **Hydration mismatches** in SSR scenarios
- **Signal cleanup** memory leaks in long-running applications
- **Router edge cases** with nested layouts and dynamic routes
- **Compiler HMR issues** in development mode
- **TypeScript errors** with strict mode enabled
- **Tree-shaking configuration** for better bundle sizes
- **Benchmark test failures** in performance suite
- **Line ending inconsistencies** - enforced LF across repository

### Performance Improvements
- **15% faster signal updates** through optimized dependency tracking
- **30% smaller bundles** with improved tree-shaking
- **40% faster compilation** with batch optimization improvements
- **Zero hydration overhead** with resumability architecture
- **Reduced memory usage** in signal cleanup and garbage collection

### Security
- **Dependency updates** addressing known vulnerabilities
- **Strict TypeScript** catching potential runtime errors at compile time
- **ESLint security plugin** integrated for code scanning
- **Better input validation** in core APIs

### Migration Notes

#### From 0.1.0 to 2.0.0

1. **Update Dependencies**:
   ```bash
   pnpm add philjs-core@2.0.0 philjs-compiler@2.0.0
   ```

2. **Replace `createReducerContext`**:
   ```typescript
   // Before
   const [state, dispatch] = createReducerContext(reducer, initialState);

   // After
   const state = signal(initialState);
   const dispatch = (action) => {
     state.value = reducer(state.value, action);
   };
   ```

3. **Update TypeScript Configuration**:
   Enable strict mode for better type safety:
   ```json
   {
     "compilerOptions": {
       "strict": true
     }
   }
   ```

4. **Run Tests**:
   Ensure all tests pass with the new version:
   ```bash
   pnpm test
   ```

### Breaking Changes

1. **Version number**: Jumped from 0.1.0 to 2.0.0 to signal production readiness
2. **Deprecated API**: `createReducerContext` is now deprecated (not removed)
3. **Peer dependencies**: Updated to require ^2.0.0 for cross-package compatibility
4. **TypeScript strict mode**: May reveal type errors in user code

### Package Versions

All packages updated to 2.0.0:
- philjs-core@2.0.0
- philjs-compiler@2.0.0
- philjs-router@2.0.0
- philjs-islands@2.0.0
- philjs-ssr@2.0.0
- philjs-devtools@2.0.0
- philjs-testing@2.0.0
- create-philjs@2.0.0
- And 21+ additional packages

### Notes

**Framework Status:** Production Ready - Stable API with semantic versioning

**Stability Guarantees:**
- Core reactivity API (signals, effects, memos) - **Stable**, no breaking changes planned
- JSX and rendering - **Stable**
- Context API - **Stable**
- Router API - **Stable**
- SSR & Islands - **Stable**
- Novel features (cost tracking, usage analytics) - **Stable** but may evolve with feedback

**Performance:**
- No Virtual DOM overhead
- Automatic optimization through fine-grained reactivity
- Bundle size: Core ~15KB gzipped (down from ~18KB)
- Zero hydration cost with resumability
- 85%+ test coverage

**Browser Support:**
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- ES2020+ required
- No IE11 support

### Known Issues
- None blocking release

### Credits

Special thanks to all contributors who made v2.0 possible through testing, documentation, and code improvements.

## [0.1.0-beta] - 2025-10-06

### Added

#### Core Reactivity
- Fine-grained reactivity with signals, memos, and effects
- Automatic dependency tracking - no manual optimization needed
- Direct DOM updates without Virtual DOM diffing

#### JSX & Rendering
- Standard JSX support with automatic runtime
- Client-side rendering with `render()`
- Server-side rendering with `renderToString()` and `renderToStream()`
- Hydration with `hydrate()` for SSR applications

#### Resumability
- Zero-hydration overhead with Qwik-style resumability
- State serialization and restoration
- Interactive elements resume without re-execution

#### Routing
- File-based routing system
- Dynamic routes with parameters
- Nested layouts and route groups
- Smart preloading based on user intent

#### Islands Architecture
- Partial hydration with islands
- Client directives: `client:load`, `client:idle`, `client:visible`
- Selective interactivity for optimal performance

#### State Management
- Signals for local reactive state
- Context API for shared state across components
- Signal-based context for reactive shared state
- Built-in form state management

#### Data Fetching
- `createQuery()` for data fetching with caching
- `createMutation()` for data updates
- Automatic loading and error states
- Query invalidation and refetching

#### Advanced Features
- Error boundaries with intelligent recovery suggestions
- Internationalization (i18n) support
- Animation utilities with FLIP technique
- Service worker generation
- Performance budgets with build-time enforcement
- Cost tracking for cloud deployment optimization
- Usage analytics for dead code detection

#### Developer Experience
- Excellent error messages with auto-fix suggestions
- TypeScript-first with full type inference
- Zero-config Vite setup
- DevTools for inspecting reactive graph
- AI-powered code optimization suggestions

#### Migration
- Comprehensive migration guides from React, Vue, and Svelte
- Codemods for automated migration (planned)

### Notes

**Framework Status:** Beta - API may change before 1.0 release

**Stability Guarantees:**
- Core reactivity API (signals, effects, memos) - Stable, no breaking changes planned
- JSX and rendering - Stable
- Context API - Stable
- Router API - May evolve, will provide migration path
- Novel features (cost tracking, usage analytics) - Experimental, may change significantly

**Performance:**
- No Virtual DOM overhead
- Automatic optimization through fine-grained reactivity
- Bundle size: Core ~15KB gzipped
- Zero hydration cost with resumability

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ required

### Known Issues
- Some data-layer tests failing (edge cases in cache invalidation)

### Breaking Changes from Pre-Alpha
- N/A - First beta release

---

## Release Schedule

- **0.2.0** - Islands test coverage, bug fixes (Target: November 2025)
- **0.3.0** - DevTools extension, performance improvements (Target: December 2025)
- **1.0.0** - Production release with API stability guarantees (Target: Q1 2026)

---

## Release Notes Format

For detailed release notes for each version, please see:
- [GitHub Releases](https://github.com/philjs/philjs/releases) - Detailed release notes for each version
- [RELEASE_NOTES_TEMPLATE.md](./RELEASE_NOTES_TEMPLATE.md) - Template for creating new release notes

---

## Migration Guide

For breaking changes between versions, see:
- [React Migration Guide](/docs/migration/from-react.md)
- [Vue Migration Guide](/docs/migration/from-vue.md)
- [Svelte Migration Guide](/docs/migration/from-svelte.md)

---

## Changelog Guidelines

### For Contributors

When adding entries to this changelog:

1. **Add to [Unreleased] section first**: All changes should go into the Unreleased section until a release is made
2. **Use the correct category**:
   - **Added** for new features
   - **Changed** for changes in existing functionality
   - **Deprecated** for soon-to-be removed features
   - **Removed** for now removed features
   - **Fixed** for any bug fixes
   - **Security** for vulnerability fixes
3. **Write clear, user-focused descriptions**: Explain what changed and why it matters to users
4. **Link to issues and PRs**: Use `#123` format for GitHub issues/PRs
5. **Credit contributors**: Use `@username` format when appropriate
6. **Be specific about breaking changes**: Clearly mark breaking changes with `**BREAKING:**` prefix

### Example Entry Format

```markdown
### Added
- New `useSignalEffect` hook for side effects (#123) @contributor
- **BREAKING:** Redesigned context API for better TypeScript support (#456)
  - Old API: `createContext(defaultValue)`
  - New API: `createContext<T>(options)`
  - See migration guide: [docs/migrations/context-api.md]

### Fixed
- Fixed memory leak in signal cleanup (#789) @contributor
- Resolved hydration mismatch in server islands (#790)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to PhilJS.

---

## Support

- 📖 [Documentation](https://philjs.dev)
- 💬 [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 🐛 [Issue Tracker](https://github.com/philjs/philjs/issues)
