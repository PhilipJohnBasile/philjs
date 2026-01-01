# Bundle Optimization

Minimize bundle size for faster downloads and better performance.


## What You'll Learn

- Bundle analysis
- Tree shaking
- Dependency optimization
- Compression
- Build configuration
- Best practices

## Bundle Analysis

### Analyze Bundle Size

```bash
# Build with analysis
npm run build -- --analyze

# Or use rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
};
```

### Monitor Bundle Growth

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "analyze": "vite build --analyze",
    "size": "size-limit"
  },
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "170 KB"
    }
  ]
}
```

## Tree Shaking

### Import Only What You Need

```typescript
// ✅ Named imports (tree-shakeable)
import { format } from 'date-fns';
import { debounce } from 'lodash-es';

// ❌ Default imports (includes everything)
import _ from 'lodash';
import dateFns from 'date-fns';

// ✅ Specific path imports
import debounce from 'lodash-es/debounce';

// ❌ Barrel imports (may not tree-shake)
import { Button, Input, Card } from './components';
```

### Mark Side-Effect-Free Code

```json
// package.json
{
  "sideEffects": false
}

// Or specify files with side effects
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.ts"
  ]
}
```

## Dependency Optimization

### Replace Large Libraries

```typescript
// ❌ Moment.js (67KB)
import moment from 'moment';
const formatted = moment().format('YYYY-MM-DD');

// ✅ date-fns (modular, ~2KB per function)
import { format } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');

// ❌ Lodash (24KB full)
import _ from 'lodash';

// ✅ Lodash-es (tree-shakeable)
import { debounce, throttle } from 'lodash-es';

// ❌ Axios (13KB)
import axios from 'axios';

// ✅ Native fetch (0KB)
const response = await fetch(url);
```

### Use Lighter Alternatives

```typescript
// Heavy library alternatives:

// ❌ jQuery (87KB) → ✅ Native DOM APIs (0KB)
// ❌ Moment.js (67KB) → ✅ date-fns (2-10KB) or Day.js (2KB)
// ❌ Lodash (24KB) → ✅ Native methods or lodash-es (tree-shakeable)
// ❌ Axios (13KB) → ✅ fetch (0KB) or ky (4KB)
```

### Dynamic Imports for Heavy Features

```typescript
// ✅ Load PDF library only when needed
async function exportToPDF() {
  const { jsPDF } = await import('jspdf');
  // Use jsPDF
}

// ✅ Load chart library only for chart page
const ChartPage = lazy(() => import('./ChartPage'));

// ✅ Conditionally load polyfills
if (!('IntersectionObserver' in window)) {
  await import('intersection-observer');
}
```

## Code Splitting Strategy

### Split by Route

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunk per route
          home: ['./src/pages/Home'],
          dashboard: ['./src/pages/Dashboard'],
          settings: ['./src/pages/Settings']
        }
      }
    }
  }
};
```

### Vendor Splitting

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Split large vendors separately
            if (id.includes('chart.js')) return 'vendor-charts';
            if (id.includes('@date-fns')) return 'vendor-date';

            // Everything else in main vendor
            return 'vendor';
          }
        }
      }
    }
  }
};
```

## Compression

### Enable Gzip/Brotli

```typescript
// vite.config.ts
import compress from 'vite-plugin-compression';

export default {
  plugins: [
    compress({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compress({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
};
```

### Server Configuration

```nginx
# nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Brotli
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

## Minification

### Optimize Production Build

```typescript
// vite.config.ts
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      format: {
        comments: false // Remove comments
      }
    }
  }
};
```

### CSS Minification

```typescript
// vite.config.ts
export default {
  css: {
    devSourcemap: false
  },
  build: {
    cssCodeSplit: true,
    cssMinify: true
  }
};
```

## Asset Optimization

### Image Optimization

```typescript
// vite.config.ts
import imagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [
          { removeViewBox: false },
          { removeEmptyAttrs: true }
        ]
      }
    })
  ]
};
```

### Font Subsetting

```typescript
// Only include characters you need
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; // Latin only
}
```

## Remove Unused Code

### Remove Development Code

```typescript
// Use environment variables
if (import.meta.env.DEV) {
  // Development-only code (removed in production)
  console.log('Debug info');
}

// Dead code elimination
const DEBUG = false;

if (DEBUG) {
  // This entire block is removed in production
  console.log('Never called');
}
```

### Purge Unused CSS

```typescript
// vite.config.ts
export default {
  build: {
    cssCodeSplit: true
  }
};

// With PurgeCSS
import purgecss from '@fullhuman/postcss-purgecss';

export default {
  css: {
    postcss: {
      plugins: [
        purgecss({
          content: ['./src/**/*.{tsx,html}'],
          safelist: ['active', 'disabled'] // Keep these classes
        })
      ]
    }
  }
};
```

## Module Federation

### Share Dependencies

```typescript
// vite.config.ts
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
    federation({
      name: 'app',
      shared: {
        '@philjs/core': {},
        '@philjs/router': {}
      }
    })
  ]
};
```

## Best Practices

### Audit Dependencies Regularly

```bash
# Check bundle size impact
npm install -g bundle-wizard
bundle-wizard

# Find duplicate dependencies
npm dedupe

# Remove unused dependencies
npm prune
```

### Use Modern JavaScript

```typescript
// vite.config.ts
export default {
  build: {
    target: 'es2020', // Modern browsers only
    polyfillModulePreload: false // Skip if not needed
  }
};
```

### Lazy Load Non-Critical Features

```typescript
// ✅ Load analytics asynchronously
setTimeout(() => {
  import('./analytics').then(({ init }) => init());
}, 3000);

// ✅ Load non-critical UI later
const Footer = lazy(() => import('./Footer'));
const CookieBanner = lazy(() => import('./CookieBanner'));
```

### Monitor Third-Party Scripts

```typescript
// ✅ Load third-party scripts async
<script async src="https://analytics.example.com/script.js" />

// ✅ Use facades for heavy embeds
function YouTubeEmbed({ videoId }: { videoId: string }) {
  const [loaded, setLoaded] = signal(false);

  if (!loaded()) {
    return (
      <div
        onClick={() => setLoaded(true)}
        style={{ cursor: 'pointer' }}
      >
        <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} />
        <div>▶ Play Video</div>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      allow="accelerometer; autoplay; encrypted-media"
    />
  );
}
```

## Performance Budget

```json
// .budgetrc.json
{
  "budgets": [
    {
      "path": "dist/assets/*.js",
      "limit": "170 KB",
      "gzip": true
    },
    {
      "path": "dist/assets/*.css",
      "limit": "30 KB",
      "gzip": true
    },
    {
      "path": "dist/index.html",
      "limit": "10 KB"
    }
  ]
}
```

## Summary

You've learned:

✅ Bundle analysis tools
✅ Tree shaking optimization
✅ Dependency replacement strategies
✅ Compression techniques
✅ Code splitting patterns
✅ Asset optimization
✅ Removing unused code
✅ Performance budgets

Smaller bundles mean faster load times!

---

**Next:** [Runtime Performance →](./runtime-performance.md) Optimize runtime execution

