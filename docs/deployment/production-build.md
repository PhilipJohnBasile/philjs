# Production Build Guide

Complete guide to building and optimizing PhilJS applications for production deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [Build Presets](#build-presets)
- [Production Optimizations](#production-optimizations)
- [Bundle Analysis](#bundle-analysis)
- [Performance Budgets](#performance-budgets)
- [Asset Optimization](#asset-optimization)
- [Chunk Splitting Strategies](#chunk-splitting-strategies)
- [Source Maps](#source-maps)
- [Build Configuration](#build-configuration)
- [CI/CD Integration](#cicd-integration)

## Quick Start

### Basic Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Using Production Preset

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import { createProductionViteConfig } from 'philjs-compiler/presets';

export default defineConfig({
  plugins: [
    philjs({
      production: {
        minify: true,
        chunkSplitting: true,
        analyze: true,
        budgets: {
          maxInitial: 100 * 1024,  // 100 KB
          maxChunk: 50 * 1024,      // 50 KB
          maxTotal: 500 * 1024,     // 500 KB
        },
      },
    }),
  ],
  ...createProductionViteConfig({
    sourceMaps: true,
    minify: 'aggressive',
  }),
});
```

## Build Presets

PhilJS provides three optimized build presets:

### Production Preset

Optimized for deployment with maximum performance:

```typescript
import { createProductionPreset } from 'philjs-compiler/presets';

const config = createProductionPreset({
  // Enable source maps for error tracking
  sourceMaps: true,

  // Aggressive minification
  minify: 'aggressive',

  // Smart code splitting
  codeSplitting: true,

  // Target modern browsers
  target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],

  // Performance budgets
  budgets: {
    maxInitial: 100 * 1024,
    maxChunk: 50 * 1024,
    maxTotal: 500 * 1024,
  },

  // Asset optimization
  assets: {
    inlineLimit: 4096,
    optimizeImages: true,
    optimizeSvg: true,
    subsetFonts: true,
  },

  // Resource hints
  hints: {
    preload: true,
    prefetch: true,
  },

  // Bundle analysis
  analyze: true,
});
```

### Development Preset

Fast rebuilds with debugging support:

```typescript
import { createDevelopmentPreset } from 'philjs-compiler/presets';

const config = createDevelopmentPreset({
  sourceMaps: true,
  verbose: false,
  hmrStatePreservation: true,
  enhancedErrors: true,
  profiling: true,
  cache: true,
});
```

### Library Preset

For building reusable packages:

```typescript
import { createLibraryPreset } from 'philjs-compiler/presets';

const config = createLibraryPreset({
  name: 'MyLibrary',
  entry: './src/index.ts',
  formats: ['es', 'cjs'],
  external: ['react', 'philjs-core'],
  dts: true,
  preserveModules: true,
});
```

## Production Optimizations

PhilJS automatically applies these optimizations in production:

### 1. Automatic Optimizations

```typescript
// Before optimization
const count = signal(0);
const doubled = signal(count() * 2);
const tripled = signal(count() * 3);

// After optimization (automatic memoization)
const count = signal(0);
const doubled = memo(() => count() * 2);
const tripled = memo(() => count() * 3);
```

### 2. Dead Code Elimination

```typescript
// Development code
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// Production build (removed completely)
```

### 3. Console Statement Removal

```typescript
// Before
console.log('User clicked button');
console.debug('State:', state);
console.trace('Call stack');

// After (only console.error and console.warn remain)
```

### 4. Constant Inlining

```typescript
// Before
const API_URL = 'https://api.example.com';
fetch(API_URL + '/users');

// After
fetch('https://api.example.com/users');
```

### 5. String Optimization

```typescript
// Before
const message = 'Hello' + ' ' + 'World';

// After
const message = 'Hello World';
```

## Bundle Analysis

### Enable Analysis

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      production: {
        analyze: true,
      },
    }),
  ],
});
```

### Build Output

```
╔════════════════════════════════════════════════════════════╗
║             PhilJS Bundle Analysis Report                 ║
╚════════════════════════════════════════════════════════════╝

Bundle Breakdown:
─────────────────────────────────────────────────────────────
 1. index-a3b4c5d6.js
    [██████████████████████████████] 45.23 KB
    Dependencies: vendor-philjs, utils

 2. vendor-philjs-e7f8g9h0.js
    [████████████████████          ] 32.18 KB
    Dependencies:

 3. route-dashboard-i1j2k3l4.js
    [████████████                  ] 18.45 KB
    Dependencies: index, utils

─────────────────────────────────────────────────────────────
Total Size: 95.86 KB
Chunks: 3
```

### Programmatic Analysis

```typescript
import { Analyzer } from 'philjs-compiler';

const analyzer = new Analyzer();
const analysis = analyzer.analyze(code, 'src/App.tsx');

// Get bundle metrics
const metrics = analyzer.analyzeBundleMetrics(code);
console.log('Total size:', metrics.totalSize);
console.log('Components:', metrics.components);
console.log('Tree-shakeable:', metrics.treeshakeable);

// Get dependency graph
const graph = analyzer.generateDependencyGraph(analysis);
console.log('Nodes:', graph.nodes.length);
console.log('Edges:', graph.edges.length);

// Get chunk candidates
const candidates = analyzer.analyzeChunkCandidates(analysis);
candidates.forEach(c => {
  console.log(`${c.name}: ${c.priority} priority, ${c.size} bytes`);
});
```

## Performance Budgets

Set and enforce performance budgets:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      production: {
        budgets: {
          // Maximum initial bundle size
          maxInitial: 100 * 1024,  // 100 KB

          // Maximum size for any single chunk
          maxChunk: 50 * 1024,     // 50 KB

          // Maximum total bundle size
          maxTotal: 500 * 1024,    // 500 KB
        },
      },
    }),
  ],
});
```

### Budget Violations

```
⚠️  Performance Budget Violations:
  chunk:dashboard-abc123.js: 65.43 KB exceeds 50.00 KB
  total: 524.18 KB exceeds 500.00 KB
```

### Checking Budgets

```typescript
import { checkPerformanceBudgets } from 'philjs-compiler/presets';

const stats = [
  { name: 'index.js', size: 45000, gzipSize: 15000 },
  { name: 'vendor.js', size: 80000, gzipSize: 25000 },
];

const result = checkPerformanceBudgets(stats, {
  maxInitial: 50 * 1024,
  maxChunk: 60 * 1024,
  maxTotal: 200 * 1024,
});

if (!result.passed) {
  console.error('Budget violations:', result.violations);
  process.exit(1);
}
```

## Asset Optimization

### Image Optimization

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      assets: {
        // Inline assets smaller than 4KB
        inlineLimit: 4096,

        // Enable image optimization
        optimizeImages: true,

        // Enable SVG optimization
        optimizeSvg: true,
      },
    }),
  ],
});
```

### Manual Asset Import

```typescript
// Inline small assets
import smallIcon from './icon.svg?inline';

// Load as URL
import largeImage from './hero.jpg?url';

// Import with optimization
import optimizedImage from './photo.jpg?w=800&format=webp';
```

## Chunk Splitting Strategies

### Automatic Vendor Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // PhilJS in separate chunk
          if (id.includes('philjs-core')) {
            return 'vendor-philjs';
          }

          // Other vendors
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // Route-based splitting
          if (id.includes('/routes/')) {
            const match = id.match(/\/routes\/(.+?)\//);
            if (match) {
              return `route-${match[1]}`;
            }
          }
        },
      },
    },
  },
});
```

### Dynamic Imports

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./routes/Dashboard'));
const Profile = lazy(() => import('./routes/Profile'));

// Lazy load heavy components
const Chart = lazy(() => import('./components/Chart'));

// Preload on hover
function ProductCard({ product }) {
  const preloadDetails = () => {
    import('./routes/ProductDetails');
  };

  return (
    <a
      href={`/product/${product.id}`}
      onMouseEnter={preloadDetails}
    >
      {product.name}
    </a>
  );
}
```

## Source Maps

### Production Source Maps

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // Hidden source maps (not referenced in bundle)
    sourcemap: 'hidden',
  },
  plugins: [
    philjs({
      production: {
        sourceMaps: true,
      },
    }),
  ],
});
```

### Upload to Error Tracking

```bash
# Upload source maps to Sentry
sentry-cli sourcemaps upload --release=$VERSION ./dist

# Upload to Rollbar
rollbar deploy \
  --environment=production \
  --source-maps=./dist
```

## Build Configuration

### Complete Example

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import {
  createProductionViteConfig,
  createProductionPreset
} from 'philjs-compiler/presets';

export default defineConfig({
  plugins: [
    philjs({
      ...createProductionPreset(),
      verbose: true,
      production: {
        minify: true,
        chunkSplitting: true,
        resourceHints: true,
        analyze: process.env.ANALYZE === 'true',
        budgets: {
          maxInitial: 100 * 1024,
          maxChunk: 50 * 1024,
          maxTotal: 500 * 1024,
        },
      },
      assets: {
        inlineLimit: 4096,
        optimizeImages: true,
        optimizeSvg: true,
      },
    }),
  ],
  ...createProductionViteConfig({
    sourceMaps: process.env.SOURCE_MAPS === 'true',
    minify: 'aggressive',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  }),
});
```

### Environment-Specific Config

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      philjs({
        development: mode === 'development',
        production: mode === 'production' ? {
          minify: env.MINIFY !== 'false',
          analyze: env.ANALYZE === 'true',
          budgets: {
            maxInitial: parseInt(env.BUDGET_INITIAL || '100') * 1024,
            maxChunk: parseInt(env.BUDGET_CHUNK || '50') * 1024,
            maxTotal: parseInt(env.BUDGET_TOTAL || '500') * 1024,
          },
        } : undefined,
      }),
    ],
  };
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Production Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          NODE_ENV: production
          ANALYZE: true
          SOURCE_MAPS: true

      - name: Check bundle size
        run: pnpm run check-budgets --ci

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

      - name: Upload source maps
        if: success()
        run: |
          sentry-cli sourcemaps upload \
            --release=${{ github.sha }} \
            ./dist
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

### Build Scripts

```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "ANALYZE=true vite build",
    "build:staging": "NODE_ENV=staging vite build",
    "build:production": "NODE_ENV=production vite build",
    "check-budgets": "node scripts/check-budgets.mjs",
    "preview": "vite preview --port 4173"
  }
}
```

### Performance Monitoring

```typescript
// src/monitoring.ts
export function reportBuildMetrics(metrics: {
  duration: number;
  size: number;
  chunks: number;
}) {
  // Report to analytics
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      type: 'build',
      timestamp: Date.now(),
      ...metrics,
    }),
  });
}
```

## Best Practices

### 1. Use Code Splitting

Split large routes and components:

```typescript
// ✅ Good
const Dashboard = lazy(() => import('./routes/Dashboard'));

// ❌ Bad
import Dashboard from './routes/Dashboard';
```

### 2. Optimize Dependencies

Keep bundle size minimal:

```bash
# Analyze what's in your bundle
pnpm build:analyze

# Check for duplicate dependencies
pnpm dedupe

# Remove unused dependencies
pnpm prune
```

### 3. Use Production Builds

Always test production builds:

```bash
# Build for production
pnpm build

# Preview locally
pnpm preview

# Test on staging
pnpm build:staging && pnpm preview
```

### 4. Monitor Bundle Size

Track bundle size over time:

```bash
# Check against budgets
pnpm check-budgets

# Save baseline
pnpm check-budgets --save-history

# Compare with baseline
pnpm check-budgets --compare
```

### 5. Leverage Caching

Use long-term caching:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Content-hashed filenames
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
```

## Troubleshooting

### Large Bundle Size

```bash
# Analyze what's taking space
pnpm build:analyze

# Check for:
# - Duplicate dependencies
# - Unused exports
# - Large assets
# - Missing tree-shaking
```

### Slow Build Times

```bash
# Enable caching
# Check for:
# - Too many files being processed
# - Expensive transforms
# - Missing excludes
```

### Budget Violations

```typescript
// Increase budgets (if justified)
budgets: {
  maxChunk: 75 * 1024,  // Increased from 50 KB
}

// Or split the chunk
manualChunks: (id) => {
  if (id.includes('heavy-component')) {
    return 'heavy-component';
  }
}
```

## Next Steps

- [Deployment Overview](./overview.md)
- [Vercel Deployment](./vercel.md)
- [Docker Deployment](./docker.md)
- [Performance Optimization](../performance/optimization-guide.md)
