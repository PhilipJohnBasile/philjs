# Changelog

All notable changes to PhilJS are documented here. We follow [Semantic Versioning](https://semver.org/).

> 💡 **Tip**: Subscribe to our [RSS feed](https://philjs.dev/changelog.rss) or [watch releases on GitHub](https://github.com/philjs/philjs/releases) to stay updated.

---

## [1.0.0] - 2025-01-15

**Status**: 🟢 Current Stable

### 🎉 Highlights

PhilJS 1.0 is here! This release marks the first stable version with production-ready features, comprehensive documentation, and a commitment to API stability.

### ✨ New Features

- **Zero-hydration resumability** - Server-rendered apps resume without hydration overhead
- **Islands architecture** - Partial hydration for optimal performance
- **Fine-grained reactivity** - Signals, memos, and effects with automatic dependency tracking
- **File-based routing** - Convention-based routing with dynamic routes and layouts
- **Server functions** - Type-safe RPC between client and server
- **Static site generation** - Pre-render pages at build time
- **Incremental static regeneration** - Update static pages on demand
- **TypeScript-first** - Full type safety and inference
- **DevTools** - Browser extension for debugging signals and components

### 📚 Documentation

- Complete documentation site with 100+ pages
- Interactive code playgrounds
- Deployment guides for Vercel, Netlify, Docker
- Migration guides from React, Vue, Svelte
- API reference with typed examples
- Best practices and troubleshooting guides

### 🔧 Breaking Changes

N/A - Initial stable release

### 📦 Dependencies

- Minimum Node.js version: 18.0.0
- Recommended: Node.js 20 LTS

### 🔗 Links

- [Full release notes](https://github.com/philjs/philjs/releases/tag/v1.0.0)
- [Migration guide](/docs/changelog/v1.0.0)
- [GitHub milestone](https://github.com/philjs/philjs/milestone/1)

---

## [0.9.0-beta.2] - 2024-12-20

**Status**: 🟡 Beta (superseded)

### ✨ New Features

- Added `createQuery` and `createMutation` utilities
- Improved error boundaries with better error messages
- Lazy loading with `lazy()` function
- View transitions API support

### 🐛 Bug Fixes

- Fixed signal batching in nested effects
- Resolved memory leak in cleanup functions
- Corrected SSR hydration mismatch warnings

### 🔧 Breaking Changes

- `onMount` renamed to `effect` for consistency
- Router `<Link>` component now uses `href` instead of `to`

**[Migration guide](/docs/changelog/v0.9.0-beta.2)**

---

## [0.8.0-beta.1] - 2024-11-15

**Status**: 🟡 Beta (superseded)

### ✨ New Features

- Server-side rendering (SSR) support
- File-based routing
- Layouts and nested routes
- Middleware support

### 🐛 Bug Fixes

- Fixed reactivity tracking in async contexts
- Improved performance of list rendering

### 🔧 Breaking Changes

- Requires Node.js 18+ (previously 16+)
- Routing API redesigned - see migration guide

**[Migration guide](/docs/changelog/v0.8.0-beta.1)**

---

## Earlier Releases

### [0.7.0-alpha] - 2024-10-01
- Initial islands architecture
- Context API
- Portal support

### [0.6.0-alpha] - 2024-09-01
- Improved signal performance
- Better TypeScript inference
- DevTools alpha

### [0.5.0-alpha] - 2024-08-01
- Initial public release
- Core reactivity system
- Basic component model

**[View all releases](https://github.com/philjs/philjs/releases)**

---

## Upgrade Guides

Detailed migration guides for major version upgrades:

- **[0.x → 1.0](/docs/changelog/upgrade-to-1.0)** - Migration from beta to stable
- **[React → PhilJS](/docs/migration/from-react)** - Coming from React
- **[Vue → PhilJS](/docs/migration/from-vue)** - Coming from Vue
- **[Svelte → PhilJS](/docs/migration/from-svelte)** - Coming from Svelte

---

## Breaking Changes Tracker

A comprehensive list of breaking changes across versions:

| Version | Change | Impact | Guide |
|---------|--------|--------|-------|
| 1.0.0 | None (initial stable) | - | - |
| 0.9.0 | `onMount` → `effect` | Medium | [Link](/docs/changelog/v0.9.0-beta.2#onmount-to-effect) |
| 0.9.0 | `<Link to>` → `<Link href>` | Low | [Link](/docs/changelog/v0.9.0-beta.2#link-prop-rename) |
| 0.8.0 | Routing API redesign | High | [Link](/docs/changelog/v0.8.0-beta.1#routing) |
| 0.8.0 | Node.js 18+ required | Low | Update Node version |

---

## Deprecation Warnings

Features planned for removal in future versions:

### No current deprecations

All APIs in 1.0 are stable and will be supported according to our [versioning policy](/docs/changelog/versioning-policy).

---

## Versioning Policy

PhilJS follows **Semantic Versioning 2.0.0**:

- **Major (X.0.0)** - Breaking changes, require migration
- **Minor (1.X.0)** - New features, backward compatible
- **Patch (1.0.X)** - Bug fixes, backward compatible

### Support Timeline

- **Current stable** (1.x) - Active development and support
- **Previous major** (0.x) - Security fixes for 6 months after 1.0 release
- **Older versions** - No longer supported

### Release Schedule

- **Major releases** - Annually (with 6-month migration period)
- **Minor releases** - Every 2-3 months
- **Patch releases** - As needed for critical bugs

---

## Codemods

Automated migration tools to help upgrade between versions:

```bash
# Upgrade from 0.9.x to 1.0
npx @philjs/codemod upgrade-1.0

# Migrate from React
npx @philjs/codemod migrate-from-react

# Rename onMount to effect
npx @philjs/codemod rename-onmount
```

**[View all codemods](https://github.com/philjs/codemods)**

---

## Release Notes Format

Each release includes:

- **Highlights** - Key features and changes
- **New Features** - What's new
- **Bug Fixes** - What's fixed
- **Breaking Changes** - What requires migration
- **Dependencies** - Version requirements
- **Links** - Full notes, guides, milestones

---

## Stay Updated

- 📬 **[Newsletter](https://philjs.dev/newsletter)** - Monthly updates
- 🐦 **[Twitter](https://twitter.com/philjs)** - Real-time announcements
- 📡 **[RSS Feed](https://philjs.dev/changelog.rss)** - Subscribe to releases
- 👁️ **[GitHub Releases](https://github.com/philjs/philjs/releases)** - Watch repository

---

## RFCs (Request for Comments)

Proposed major changes go through our RFC process before implementation:

### Active RFCs

- **RFC-001**: React Server Components-style API - [Discuss](https://github.com/philjs/philjs/discussions/42)
- **RFC-002**: Built-in form validation - [Discuss](https://github.com/philjs/philjs/discussions/43)

### Accepted RFCs

- RFC-000: Islands architecture (implemented in 0.7.0)

### Closed RFCs

- None yet

**[View all RFCs](https://github.com/philjs/philjs/discussions/categories/rfcs)**

---

## Contributing to Releases

Want to contribute to upcoming releases?

1. Check our [roadmap](https://github.com/philjs/philjs/projects/1)
2. Look for issues labeled [`good first issue`](https://github.com/philjs/philjs/labels/good%20first%20issue)
3. Read our [contributing guide](https://github.com/philjs/philjs/blob/main/CONTRIBUTING.md)
4. Join the conversation on [Discord](https://discord.gg/philjs)

Thank you to all our contributors! 🙏
