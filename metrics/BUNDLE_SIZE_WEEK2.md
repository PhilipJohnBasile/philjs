# Bundle Size Analysis - Week 2

**Date**: 2025-12-17
**Improvements**: Tree-shaking optimizations

## Summary

Added `sideEffects: false` and separated all modules into individual entry points for optimal tree-shaking.

## philjs-core Bundle Sizes

### Individual Modules (ES Modules)

| Module | Raw Size | Gzipped | Purpose |
|--------|----------|---------|---------|
| signals.js | 16.5KB | 3.3KB | Core reactivity |
| jsx-runtime.js | 1.8KB | 0.8KB | JSX support |
| hydrate.js | 14KB | 2.8KB | Client hydration |
| context.js | 5.9KB | - | Context API |
| forms.js | 17KB | - | Form handling |
| i18n.js | 11.8KB | - | Internationalization |
| animation.js | 10.4KB | - | Animations |
| accessibility.js | 17KB | - | A11y helpers |
| ab-testing.js | 15.9KB | - | A/B testing |
| error-boundary.js | 12.6KB | - | Error handling |
| result.js | 1.4KB | - | Rust-style Result |
| **index.js (full)** | **177KB** | **39KB** | Everything bundled |

### Minimal Core Bundle

For apps that only need basic reactivity + JSX:
```
signals.js + jsx-runtime.js + hydrate.js = ~32KB raw, ~7KB gzipped
```

## Tree-Shaking Test Results

### Storefront Example (before/after)

| Metric | Before | After |
|--------|--------|-------|
| Client JS | ~15KB | **5.49KB** |
| Client JS (gzip) | ~5KB | **2.40KB** |
| Server JS | ~30KB | 25.63KB |

### Import Strategies

**Full import (not recommended for production):**
```typescript
import { signal, memo, effect, jsx } from 'philjs-core';
// Bundles: 177KB (before tree-shaking)
```

**Optimal import (tree-shakeable):**
```typescript
import { signal, memo, effect } from 'philjs-core/signals';
import { jsx, Fragment } from 'philjs-core/jsx-runtime';
// Bundles: ~18KB raw, ~4KB gzipped
```

**Minimal core import:**
```typescript
import { signal, memo, effect, jsx, hydrate } from 'philjs-core/core';
// Bundles: ~32KB raw, ~7KB gzipped
```

## New Package.json Configuration

```json
{
  "sideEffects": false,
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core.js",
    "./signals": "./dist/signals.js",
    "./jsx-runtime": "./dist/jsx-runtime.js",
    "./forms": "./dist/forms.js",
    // ... 15 more entry points
  }
}
```

## Comparison with Frameworks

| Framework | Minimal Bundle (gzip) | Notes |
|-----------|----------------------|-------|
| **PhilJS** | **~4KB** | signals + jsx |
| React | ~45KB | react + react-dom |
| Solid.js | ~7KB | Similar fine-grained |
| Preact | ~4KB | React-compatible |
| Vue 3 | ~16KB | Composition API |
| Svelte | ~2KB | Compiled, no runtime |

## Recommendations

1. **For minimal apps**: Import from `philjs-core/core`
2. **For feature-specific code**: Import from subpaths (`philjs-core/forms`, etc.)
3. **Build tools**: Vite, Rollup, and webpack 5 all support tree-shaking with `sideEffects: false`

## Next Steps

- [ ] Add size-limit CI checks
- [ ] Further split signals.ts (separate linkedSignal, resource)
- [ ] Profile and optimize hot paths
