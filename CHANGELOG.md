# Changelog

All notable changes to PhilJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test coverage for the Islands architecture.
- Scaffolding for the browser DevTools extension.

### Changed
- Marked `createReducerContext` as deprecated - use signals directly instead
- Documented novel features (cost tracking, usage analytics) as optional advanced features

### Deprecated
- `createReducerContext` - Encourages Redux-style patterns that signals eliminate. Use `signal()` and `createSignalContext()` instead.

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

## Migration Guide

For breaking changes between versions, see:
- [React Migration Guide](/docs/migration/from-react.md)
- [Vue Migration Guide](/docs/migration/from-vue.md)
- [Svelte Migration Guide](/docs/migration/from-svelte.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to PhilJS.

---

## Support

- 📖 [Documentation](https://philjs.dev)
- 💬 [GitHub Discussions](https://github.com/philjs/philjs/discussions)
- 🐛 [Issue Tracker](https://github.com/philjs/philjs/issues)
