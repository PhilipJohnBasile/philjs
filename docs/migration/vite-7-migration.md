# Migrating to Vite 7

Research-based guide for migrating PhilJS projects to Vite 7 when upgrading from previous versions.

## Overview

Vite 7.0 was released on June 24, 2025, marking 5 years since the first Vite commit. This release introduces several breaking changes, modernizes browser targets, and paves the way for Rolldown integration. This guide documents the changes you'll need to make when upgrading PhilJS projects to Vite 7.

**Current Status:** Vite 7 is stable and widely adopted. The latest version is 7.3.0 (as of December 2025).

## Breaking Changes

### 1. Node.js Version Requirements

Vite 7 requires newer Node.js versions:

**Before (Vite 6):**
- Node.js 18.0+ (or higher)

**After (Vite 7):**
- Node.js 20.19+ or 22.12+ required
- Node.js 18 is no longer supported (reached EOL April 2025)

**Why:** These new Node.js version ranges are required so Node.js supports `require(esm)` without a flag, allowing Vite 7.0 to be distributed as ESM-only without preventing the Vite JavaScript API from being required by CJS modules.

**Action Required:**
```bash
# Check your Node.js version
node --version

# If below 20.19, upgrade Node.js
# Using nvm:
nvm install 20.19
nvm use 20.19

# Or using nvm-windows:
nvm install 20.19.0
nvm use 20.19.0
```

Update your project's `package.json` to enforce the minimum version:
```json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

### 2. Browser Target Changes

Vite 7 changes the default browser target from `'modules'` to `'baseline-widely-available'`.

**What is Baseline Widely Available?**
- Features that have been available across all major browsers for at least 30 months
- Ensures compatibility with well-established browser features
- More modern target than the previous `'modules'` setting

**Before (Vite 6):**
```js
// vite.config.js
export default {
  build: {
    target: 'modules' // Default
  }
}
```

**After (Vite 7):**
```js
// vite.config.js
export default {
  build: {
    target: 'baseline-widely-available' // New default
  }
}
```

**Impact:**
- Your build output may use newer JavaScript features
- Older browsers may no longer be supported
- Bundle size may be smaller due to less transpilation

**Action Required:**
- Review your browser support requirements
- If you need to support older browsers, explicitly set a different target:
  ```js
  export default {
    build: {
      target: 'es2020' // Or your preferred target
    }
  }
  ```
- Test your application in your target browsers

**PhilJS Projects:**
Most PhilJS examples currently use `target: 'es2022'`, which is already more modern than the new default. No changes needed for most PhilJS projects.

### 3. Sass Legacy API Removal

Vite 7 has completely removed support for the Sass legacy API.

**Background:**
- Sass deprecated its legacy JS API in Dart Sass 1.45.0
- The legacy API will be removed in Dart Sass v2.0
- Vite 7 proactively drops support for the legacy API

**Before (Vite 6):**
```js
export default {
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern', // or 'legacy'
        // other options
      }
    }
  }
}
```

**After (Vite 7):**
```js
export default {
  css: {
    preprocessorOptions: {
      scss: {
        // 'api' option removed - always uses modern API
        // other options
      }
    }
  }
}
```

**Action Required:**
- Remove the `css.preprocessorOptions.sass.api` option
- Remove the `css.preprocessorOptions.scss.api` option
- Verify your Sass/SCSS files compile correctly with the modern API
- Update any Sass syntax that relied on legacy behavior

**PhilJS Projects:**
PhilJS does not use Sass/SCSS by default. Only action needed if you've added Sass to your project.

### 4. Removed Deprecated Features

#### splitVendorChunkPlugin

**Removed:** `splitVendorChunkPlugin` (deprecated in v5.2.7)

This plugin was originally provided to ease migration to Vite v2.9.

**Before:**
```js
import { splitVendorChunkPlugin } from 'vite';

export default {
  plugins: [
    splitVendorChunkPlugin()
  ]
}
```

**After:**
Use `build.rollupOptions.output.manualChunks` for custom chunking:
```js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Example
          // Add your own chunking strategy
        }
      }
    }
  }
}
```

**PhilJS Projects:**
PhilJS projects don't use this plugin by default. Only relevant if you explicitly added it.

#### transformIndexHtml Hook Changes

**Removed:** Hook-level `enforce` / `transform` for `transformIndexHtml` (deprecated in v4.0.0)

**Before (deprecated pattern):**
```js
export default {
  plugins: [
    {
      name: 'my-plugin',
      transformIndexHtml: {
        enforce: 'pre',
        transform(html) {
          return html.replace('<!-- inject -->', '<script>...</script>');
        }
      }
    }
  ]
}
```

**After (correct pattern):**
```js
export default {
  plugins: [
    {
      name: 'my-plugin',
      transformIndexHtml: {
        order: 'pre', // Use 'order' instead of 'enforce'
        handler(html) { // Use 'handler' instead of 'transform'
          return html.replace('<!-- inject -->', '<script>...</script>');
        }
      }
    }
  ]
}
```

**PhilJS Projects:**
Only relevant if you've created custom Vite plugins that transform index.html.

## New Features

### 1. Environment API (Experimental)

Vite 7 continues to evolve the Environment API introduced in Vite 6. This API remains experimental while the ecosystem provides feedback.

**What is the Environment API?**
- Allows creation of multiple environments (client, SSR, edge, etc.)
- Enables running code in different environments concurrently during dev
- More flexible than the previous implicit client/ssr setup

**Status in Vite 7:**
- Still experimental
- New `buildApp` hook added to coordinate multi-environment builds
- API may change in future major versions

**PhilJS Projects:**
The Environment API is not used by default in PhilJS. Framework authors may explore this for advanced SSR scenarios.

### 2. Rolldown Integration (Technical Preview)

Vite 7 introduces technical preview support for Rolldown, a Rust-based bundler being developed by the VoidZero team.

**What is Rolldown?**
- Rust-based next-generation bundler
- Drop-in replacement for Rollup
- Significantly faster build times
- Maintains compatibility with existing Rollup plugins

**How to Try Rolldown:**
```bash
# Install rolldown-vite instead of vite
npm install rolldown-vite
```

**Performance Improvements:**
- GitLab achieved 2.6x faster builds with rolldown-vite
- With all native plugins enabled: 7x faster (2.5 minutes → 22 seconds)
- Also 43x faster than their previous Webpack build

**Important Notes:**
- Technical preview only - not recommended for production yet
- Rolldown will become the default bundler in a future Vite version (Vite 8+)
- Can be used as an intermediate migration step
- Some plugins may not be fully compatible yet

**PhilJS Projects:**
We recommend waiting until Rolldown becomes the default before migrating PhilJS projects. Monitor the Vite changelog for updates.

## Plugin Compatibility

### Rollup Plugin Compatibility

Vite 7 maintains compatibility with the Rollup plugin ecosystem. However, there are some considerations:

**Known Issues:**
- Some TypeScript types for Rollup plugins may show compatibility warnings
- Most plugins work without issues, but test thoroughly

**Compatible Official Plugins:**
- @rollup/plugin-alias
- @rollup/plugin-commonjs
- @rollup/plugin-dynamic-import-vars
- @rollup/plugin-json
- @rollup/plugin-babel
- @rollup/plugin-inject
- @rollup/plugin-replace
- @rollup/plugin-virtual
- @rollup/plugin-yaml

**PhilJS Projects:**
PhilJS uses standard Vite plugins and should not be affected by plugin compatibility issues. If you've added custom Rollup plugins, test them after upgrading.

### Vitest Compatibility

**Important:** If you use Vitest for testing, ensure you upgrade to a compatible version.

**Minimum Version:**
- Vite 7.0 requires Vitest 3.2 or higher

**Action Required:**
```bash
# Check your Vitest version
npm list vitest

# Upgrade if needed
npm install vitest@latest --save-dev
```

**PhilJS Projects:**
PhilJS examples use Vitest. Make sure to upgrade Vitest when upgrading Vite.

## Configuration Changes

### Review Your vite.config Files

Most Vite configurations will continue to work without changes, but review these areas:

**1. Check for Deprecated Options:**
```js
// Remove these if present:
export default {
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern' // ❌ Remove this line
      }
    }
  }
}
```

**2. Verify Build Target:**
```js
export default {
  build: {
    // Explicitly set if you need older browser support
    target: 'es2020' // or your preferred target
  }
}
```

**3. Update Manual Chunks if Using splitVendorChunkPlugin:**
```js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Define your chunking strategy
        }
      }
    }
  }
}
```

## Migration Steps

### Prerequisites

Before starting the migration:

1. **Backup your project**
   ```bash
   git checkout -b vite-7-migration
   ```

2. **Update Node.js**
   ```bash
   node --version # Should be 20.19+ or 22.12+
   ```

3. **Review the changelog**
   - [Vite 7 Announcement](https://vite.dev/blog/announcing-vite7)
   - [Migration Guide](https://vite.dev/guide/migration)

### Step-by-Step Migration

#### 1. Update Dependencies

```bash
# Update Vite
npm install vite@^7.3.0 --save-dev

# Update Vitest if using
npm install vitest@^4.0.0 --save-dev

# Update other Vite plugins if using
npm install @vitejs/plugin-react@latest --save-dev  # If using React plugins
```

For PhilJS monorepo projects:
```bash
# Update in root package.json
pnpm add -D vite@^7.3.0 vitest@^4.0.0

# Update in specific packages if needed
pnpm --filter @philjs/compiler add -D vite@^7.3.0
```

#### 2. Update Configuration Files

Review all `vite.config.js` / `vite.config.ts` files:

```js
// Before
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'modules', // Old default
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern' // Remove this
      }
    }
  },
  plugins: [
    splitVendorChunkPlugin() // Remove this
  ]
});

// After
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022', // Explicit target (or use new default)
  },
  css: {
    preprocessorOptions: {
      scss: {
        // api option removed
      }
    }
  },
  plugins: [
    // Use build.rollupOptions.output.manualChunks instead
  ]
});
```

#### 3. Update package.json

Add Node.js version requirement:

```json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

#### 4. Test Your Build

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test development server
npm run dev

# Test production build
npm run build

# Test preview
npm run preview
```

#### 5. Run Tests

```bash
# Run your test suite
npm run test

# Run E2E tests if you have them
npm run test:e2e
```

#### 6. Check for Warnings

Look for deprecation warnings in the console during development and build. Address any warnings before deploying.

### PhilJS-Specific Considerations

**PhilJS Compiler:**
- The PhilJS compiler uses Vite plugins - test compilation thoroughly
- Check that JSX transformation still works correctly
- Verify SSR builds produce correct output

**PhilJS Examples:**
- Test all example apps in the monorepo
- Verify dev server works correctly
- Confirm production builds are successful
- Check bundle sizes haven't increased unexpectedly

**PhilJS Packages:**
- Test that all packages build correctly
- Verify that package builds work in different Node.js versions
- Ensure TypeScript types are generated correctly

## Timeline and Recommendations

### When to Upgrade

**Upgrade Now If:**
- You're starting a new project
- You need the latest features and improvements
- Your CI/CD environment already uses Node.js 20.19+ or 22.12+
- You want better performance and smaller bundles

**Wait If:**
- You're locked to Node.js 18 (though it's EOL)
- You have complex custom Vite plugins that need testing
- You want to wait for more ecosystem adoption
- You're close to a major release and want to minimize risk

**PhilJS Projects:**
- **New projects:** Use Vite 7 from the start
- **Existing projects:** Upgrade during your next minor/major release cycle
- **Production apps:** Test thoroughly in staging before upgrading

### Recommended Approach

**For PhilJS Development:**

1. **Phase 1 (Now):** Update development dependencies to Vite 7
2. **Phase 2 (Testing):** Test all examples and packages
3. **Phase 3 (Documentation):** Update all documentation references
4. **Phase 4 (Release):** Include Vite 7 in next PhilJS release

**For PhilJS Users:**

1. **Read this guide** thoroughly
2. **Test in a branch** first
3. **Update one project** at a time if you have multiple
4. **Monitor for issues** after upgrading
5. **Report any PhilJS-specific issues** to the maintainers

## Future Changes (Vite 8+)

Vite 8 is expected to introduce even more significant changes:

**Expected Changes:**
- **Rolldown becomes default bundler** (replacing Rollup)
- **Oxc replaces esbuild** for transformations
- **Environment API stabilization** (potential breaking changes)
- **Lightning CSS** for CSS minification by default
- **Oxc minifier** for JS minification by default

**What This Means:**
- Vite 7 can be seen as a stepping stone to Vite 8
- The `rolldown-vite` package in Vite 7 allows testing Rolldown before Vite 8
- Vite 8 will bring massive performance improvements

**PhilJS Considerations:**
- We'll need to test PhilJS compiler compatibility with Rolldown
- Plugin API may need updates for Vite 8
- Performance improvements will benefit all PhilJS users

## Troubleshooting

### Common Issues

**Issue: Node.js version error**
```
Error: Vite requires Node.js 20.19+ or 22.12+
```
**Solution:** Upgrade Node.js to 20.19 or higher

**Issue: Sass compilation fails**
```
Error: Unknown option 'api'
```
**Solution:** Remove the `api` option from Sass preprocessor config

**Issue: Build fails with splitVendorChunkPlugin**
```
Error: splitVendorChunkPlugin is not a function
```
**Solution:** Remove splitVendorChunkPlugin and use manualChunks instead

**Issue: Vitest compatibility error**
```
Error: Vite version mismatch
```
**Solution:** Upgrade Vitest to 3.2 or higher

**Issue: TypeScript errors with plugins**
```
Type 'Plugin' is not assignable to type 'Plugin'
```
**Solution:** Update plugin type definitions, usually by upgrading the plugin

### Getting Help

**PhilJS-Specific Issues:**
- Open an issue on the PhilJS GitHub repository
- Check existing issues for similar problems
- Include your Vite config and error messages

**General Vite Issues:**
- Check the [Vite Discord](https://chat.vite.dev)
- Review [Vite GitHub Issues](https://github.com/vitejs/vite/issues)
- Consult the [official migration guide](https://vite.dev/guide/migration)

## Checklist

Use this checklist when migrating:

- [ ] Node.js version is 20.19+ or 22.12+
- [ ] Updated `vite` package to ^7.3.0
- [ ] Updated `vitest` package to ^3.2 or higher (if using)
- [ ] Updated Vite plugin packages to latest versions
- [ ] Removed `api` option from Sass/SCSS config (if using)
- [ ] Removed `splitVendorChunkPlugin` (if using)
- [ ] Updated `transformIndexHtml` hooks to use `order`/`handler` (if applicable)
- [ ] Reviewed and updated `build.target` if needed
- [ ] Added `engines.node` to package.json
- [ ] Tested development server
- [ ] Tested production build
- [ ] Tested preview mode
- [ ] Ran all tests successfully
- [ ] Checked bundle sizes
- [ ] Verified browser compatibility
- [ ] Updated CI/CD Node.js version
- [ ] Tested in staging environment
- [ ] Updated documentation

## Resources

### Official Documentation
- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7)
- [Migration from v6 Guide](https://vite.dev/guide/migration)
- [Breaking Changes](https://vite.dev/changes/)
- [Vite Releases](https://vite.dev/releases)
- [Rolldown Integration Guide](https://vite.dev/guide/rolldown)

### Community Resources
- [Vite 7.0 - All Major Changes](https://syntackle.com/blog/vite-7-is-here/)
- [What's New in Vite 7](https://blog.openreplay.com/whats-new-vite-7-rust-baseline-beyond/)
- [Vite GitHub Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md)

### Rollup Plugin Compatibility
- [Vite Rollup Plugins](https://vite-rollup-plugins.patak.dev/)

### Environment API
- [Environment API for Frameworks](https://vite.dev/guide/api-environment-frameworks)
- [Environment API Documentation](https://vite.dev/guide/api-environment)

## Summary

Vite 7 is a solid, stable release that modernizes the ecosystem while maintaining most compatibility with Vite 6. The main breaking changes are:

**Key Changes:**
- Node.js 20.19+ or 22.12+ required
- Default browser target changed to 'baseline-widely-available'
- Sass legacy API removed
- Deprecated features removed

**Migration Effort:**
- **Low** for most projects
- **Medium** if using Sass or custom plugins
- **High** if locked to Node.js 18

**Benefits:**
- Better performance
- Smaller bundles
- Modern browser features
- Foundation for Rolldown (Vite 8+)

**PhilJS Projects:**
Most PhilJS projects will upgrade smoothly with minimal changes. Test thoroughly and update Node.js versions in CI/CD.

---

**Last Updated:** December 17, 2025
**Vite Version:** 7.3.0
**PhilJS Version:** 0.1.0
