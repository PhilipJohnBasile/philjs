# @philjs/perf-budget

Hard performance budget enforcement for production applications. **NO OTHER FRAMEWORK provides enforced performance budgets** - PhilJS is the only framework that treats performance as a first-class constraint, not an afterthought.

## Installation

```bash
npm install @philjs/perf-budget
```

## Why Performance Budgets Matter

Performance budgets transform vague performance goals into enforceable constraints. Instead of hoping your app stays fast, you define hard limits and get immediate feedback when they're exceeded - during development, at build time, and in production.

## Features

- **Bundle Size Limits** - Enforce maximum bundle sizes at build time
- **Core Web Vitals Budgets** - Set limits for LCP, FID, CLS, INP, TTFB, and FCP
- **Runtime Performance Monitoring** - Track memory usage, long tasks, and DOM nodes
- **Build-time Budget Checks** - Fail builds that exceed budgets
- **Performance Scoring** - Get A-F grades based on your performance metrics
- **Real User Monitoring (RUM)** - Collect metrics from actual users
- **Violation Reporting** - Send budget violations to your monitoring service
- **CI/CD Integration** - Block deployments that don't meet performance standards

## Quick Start

```typescript
import { BudgetChecker, perfBudgetPlugin } from '@philjs/perf-budget';

// Runtime budget checking
const checker = new BudgetChecker({
  budget: {
    maxLCP: 2500,      // Largest Contentful Paint < 2.5s
    maxCLS: 0.1,       // Cumulative Layout Shift < 0.1
    maxFID: 100,       // First Input Delay < 100ms
    maxBundleSize: 250 * 1024  // 250KB max bundle
  },
  onViolation: (violation) => {
    console.error(`Budget exceeded: ${violation.message}`);
  }
});
```

---

## PerformanceBudget Interface

The `PerformanceBudget` interface defines all available budget constraints:

```typescript
interface PerformanceBudget {
  // Bundle size budgets (bytes)
  maxBundleSize?: number;      // Total JS bundle size
  maxInitialBundle?: number;   // Initial/entry bundle size
  maxChunkSize?: number;       // Maximum size per chunk
  maxTotalAssets?: number;     // All assets combined

  // Core Web Vitals budgets
  maxLCP?: number;   // Largest Contentful Paint (ms)
  maxFID?: number;   // First Input Delay (ms)
  maxCLS?: number;   // Cumulative Layout Shift (unitless)
  maxINP?: number;   // Interaction to Next Paint (ms)
  maxTTFB?: number;  // Time to First Byte (ms)
  maxFCP?: number;   // First Contentful Paint (ms)

  // Runtime budgets
  maxMemory?: number;          // Memory usage (MB)
  maxLongTasks?: number;       // Count of long tasks (>50ms)
  maxLayoutShifts?: number;    // Count of layout shifts
  maxNetworkRequests?: number; // Total network requests
  maxDOMNodes?: number;        // DOM node count

  // Custom budgets
  custom?: Record<string, number>;
}
```

### Bundle Size Budgets

| Property | Description | Recommended Value |
|----------|-------------|-------------------|
| `maxBundleSize` | Total JavaScript bundle size in bytes | 250KB - 500KB |
| `maxInitialBundle` | Entry point bundle size (critical for initial load) | 100KB - 200KB |
| `maxChunkSize` | Maximum size for any single chunk | 50KB - 150KB |
| `maxTotalAssets` | All assets including images, fonts, CSS | 1MB - 2MB |

### Core Web Vitals Budgets

| Property | Metric | Good | Needs Improvement | Poor |
|----------|--------|------|-------------------|------|
| `maxLCP` | Largest Contentful Paint | < 2500ms | 2500-4000ms | > 4000ms |
| `maxFID` | First Input Delay | < 100ms | 100-300ms | > 300ms |
| `maxCLS` | Cumulative Layout Shift | < 0.1 | 0.1-0.25 | > 0.25 |
| `maxINP` | Interaction to Next Paint | < 200ms | 200-500ms | > 500ms |
| `maxTTFB` | Time to First Byte | < 800ms | 800-1800ms | > 1800ms |
| `maxFCP` | First Contentful Paint | < 1800ms | 1800-3000ms | > 3000ms |

### Runtime Budgets

| Property | Description | Recommended Value |
|----------|-------------|-------------------|
| `maxMemory` | JavaScript heap size in MB | 50MB - 100MB |
| `maxLongTasks` | Tasks blocking main thread > 50ms | 0 - 5 |
| `maxLayoutShifts` | Number of layout shift events | 0 - 3 |
| `maxNetworkRequests` | Total HTTP requests | 50 - 100 |
| `maxDOMNodes` | Total DOM elements | 1000 - 1500 |

---

## BudgetChecker Class

The `BudgetChecker` class provides runtime budget monitoring with automatic metric collection via Performance Observer APIs.

### Constructor

```typescript
const checker = new BudgetChecker(config: BudgetConfig);
```

#### BudgetConfig Options

```typescript
interface BudgetConfig {
  budget: PerformanceBudget;          // Your budget definitions
  warningThreshold?: number;          // % of budget to trigger warning (default: 0.8)
  errorThreshold?: number;            // % of budget to trigger error (default: 1.0)
  onViolation?: (violation: BudgetViolation) => void;  // Violation callback
  reportUrl?: string;                 // URL to POST violations to
  enableRUM?: boolean;                // Enable Real User Monitoring (default: true)
}
```

### checkBudgets()

Check metrics against your defined budget:

```typescript
const violations = checker.checkBudgets(metrics: PerformanceMetrics);
```

Returns an array of `BudgetViolation` objects:

```typescript
interface BudgetViolation {
  metric: string;           // Which metric was violated
  budget: number;           // The budget limit
  actual: number;           // The actual measured value
  severity: 'warning' | 'error';
  message: string;          // Human-readable description
  timestamp: number;        // When the violation occurred
}
```

#### Example: Manual Budget Checking

```typescript
import { BudgetChecker } from '@philjs/perf-budget';

const checker = new BudgetChecker({
  budget: {
    maxLCP: 2500,
    maxCLS: 0.1,
    maxMemory: 100
  },
  warningThreshold: 0.8,  // Warn at 80% of budget
  errorThreshold: 1.0,    // Error at 100% of budget
  onViolation: (violation) => {
    if (violation.severity === 'error') {
      // Send to error tracking
      trackError('performance_budget_exceeded', violation);
    }
  }
});

// Check with custom metrics
const violations = checker.checkBudgets({
  lcp: 2800,
  cls: 0.05,
  memoryUsage: 85
});

// Output: [{ metric: 'LCP', budget: 2500, actual: 2800, severity: 'error', ... }]
```

### calculateScore()

Get a comprehensive performance score with A-F grading:

```typescript
const score = checker.calculateScore(metrics: PerformanceMetrics);
```

Returns a `PerformanceScore` object:

```typescript
interface PerformanceScore {
  overall: number;        // 0-100 composite score
  bundleScore: number;    // Bundle size score (0-100)
  webVitalsScore: number; // Core Web Vitals score (0-100)
  runtimeScore: number;   // Runtime metrics score (0-100)
  violations: BudgetViolation[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

#### Scoring Weights

The overall score is calculated with these weights:
- **Web Vitals**: 50% (most important for user experience)
- **Bundle Size**: 30% (critical for load time)
- **Runtime**: 20% (affects ongoing performance)

#### Grade Thresholds

| Grade | Score Range |
|-------|-------------|
| A | 90-100 |
| B | 80-89 |
| C | 70-79 |
| D | 60-69 |
| F | 0-59 |

#### Example: Performance Scoring

```typescript
const score = checker.calculateScore({
  lcp: 2100,
  fid: 50,
  cls: 0.05,
  ttfb: 600,
  fcp: 1500,
  bundleSize: 200 * 1024,
  memoryUsage: 45,
  longTasks: 2
});

console.log(`Performance Grade: ${score.grade}`);
console.log(`Overall Score: ${score.overall}/100`);
console.log(`Web Vitals: ${score.webVitalsScore}/100`);
console.log(`Bundle: ${score.bundleScore}/100`);
console.log(`Runtime: ${score.runtimeScore}/100`);
// Output: Performance Grade: A, Overall Score: 95/100
```

### Other Methods

```typescript
// Get all recorded violations
const violations = checker.getViolations();

// Clear violation history
checker.clearViolations();

// Clean up observers
checker.destroy();
```

---

## BuildBudgetChecker Class

The `BuildBudgetChecker` class enforces budgets at build time, failing builds that exceed limits.

### Constructor

```typescript
const buildChecker = new BuildBudgetChecker(budget: PerformanceBudget);
```

### addArtifact()

Add build artifacts for checking:

```typescript
buildChecker.addArtifact(artifact: BuildArtifact);
buildChecker.addArtifacts(artifacts: BuildArtifact[]);
```

#### BuildArtifact Interface

```typescript
interface BuildArtifact {
  name: string;           // File name
  path: string;           // File path
  size: number;           // Size in bytes
  gzipSize?: number;      // Gzipped size
  brotliSize?: number;    // Brotli compressed size
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  isEntry?: boolean;      // Is this an entry point?
}
```

### check()

Run budget checks against all added artifacts:

```typescript
const result = buildChecker.check();
```

Returns:

```typescript
{
  passed: boolean;              // Did all budgets pass?
  violations: BudgetViolation[];  // List of violations
  summary: string;              // Human-readable summary
}
```

### getArtifactReport()

Generate a detailed report of all build artifacts:

```typescript
const report = buildChecker.getArtifactReport();
console.log(report);
```

Output:

```
Build Artifacts:

JS (245.50 KB):
  main.abc123.js: 150.25 KB
  vendor.def456.js: 95.25 KB

CSS (32.10 KB):
  styles.ghi789.css: 32.10 KB

IMAGE (512.00 KB):
  hero.webp: 312.00 KB
  logo.svg: 200.00 KB
```

#### Example: Build-time Budget Checking

```typescript
import { BuildBudgetChecker } from '@philjs/perf-budget';

const checker = new BuildBudgetChecker({
  maxBundleSize: 300 * 1024,     // 300KB total JS
  maxInitialBundle: 150 * 1024,  // 150KB initial
  maxChunkSize: 100 * 1024,      // 100KB per chunk
  maxTotalAssets: 1024 * 1024    // 1MB total
});

// Add your build artifacts
checker.addArtifacts([
  { name: 'main.js', path: 'dist/main.js', size: 145000, type: 'js', isEntry: true },
  { name: 'vendor.js', path: 'dist/vendor.js', size: 98000, type: 'js' },
  { name: 'lazy.js', path: 'dist/lazy.js', size: 52000, type: 'js' },
  { name: 'styles.css', path: 'dist/styles.css', size: 28000, type: 'css' }
]);

const result = checker.check();

if (!result.passed) {
  console.error(result.summary);
  process.exit(1);
}

console.log(checker.getArtifactReport());
console.log('\nAll performance budgets passed!');
```

---

## Hooks

PhilJS provides reactive hooks for accessing performance metrics in your components.

### usePerformanceBudget()

Full budget tracking with violations and scoring:

```typescript
import { usePerformanceBudget } from '@philjs/perf-budget';

function PerformanceMonitor() {
  const { metrics, violations, score, isWithinBudget } = usePerformanceBudget({
    budget: {
      maxLCP: 2500,
      maxCLS: 0.1,
      maxFID: 100,
      maxMemory: 100,
      maxDOMNodes: 1500
    },
    onViolation: (v) => console.warn('Budget violation:', v.message)
  });

  return (
    <div class={isWithinBudget ? 'healthy' : 'warning'}>
      <h2>Performance: {score?.grade ?? 'N/A'}</h2>
      <p>LCP: {metrics.lcp?.toFixed(0)}ms</p>
      <p>CLS: {metrics.cls?.toFixed(3)}</p>
      <p>Memory: {metrics.memoryUsage?.toFixed(1)}MB</p>

      {violations.length > 0 && (
        <ul class="violations">
          {violations.map(v => <li>{v.message}</li>)}
        </ul>
      )}
    </div>
  );
}
```

### useWebVitals()

Access Core Web Vitals directly:

```typescript
import { useWebVitals } from '@philjs/perf-budget';

function WebVitalsDisplay() {
  const { lcp, fid, cls, inp, ttfb, fcp } = useWebVitals();

  return (
    <div class="web-vitals">
      <div class="metric">
        <span>LCP</span>
        <span class={lcp && lcp < 2500 ? 'good' : 'poor'}>
          {lcp?.toFixed(0) ?? '--'}ms
        </span>
      </div>
      <div class="metric">
        <span>FID</span>
        <span class={fid && fid < 100 ? 'good' : 'poor'}>
          {fid?.toFixed(0) ?? '--'}ms
        </span>
      </div>
      <div class="metric">
        <span>CLS</span>
        <span class={cls !== undefined && cls < 0.1 ? 'good' : 'poor'}>
          {cls?.toFixed(3) ?? '--'}
        </span>
      </div>
      <div class="metric">
        <span>INP</span>
        <span class={inp && inp < 200 ? 'good' : 'poor'}>
          {inp?.toFixed(0) ?? '--'}ms
        </span>
      </div>
      <div class="metric">
        <span>TTFB</span>
        <span class={ttfb && ttfb < 800 ? 'good' : 'poor'}>
          {ttfb?.toFixed(0) ?? '--'}ms
        </span>
      </div>
      <div class="metric">
        <span>FCP</span>
        <span class={fcp && fcp < 1800 ? 'good' : 'poor'}>
          {fcp?.toFixed(0) ?? '--'}ms
        </span>
      </div>
    </div>
  );
}
```

### usePerformanceMetric()

Track custom performance metrics:

```typescript
import { usePerformanceMetric } from '@philjs/perf-budget';

function DataLoader() {
  const { value: loadTime, record } = usePerformanceMetric('dataLoadTime');

  async function fetchData() {
    const start = performance.now();

    const data = await fetch('/api/data').then(r => r.json());

    const elapsed = performance.now() - start;
    record(elapsed);  // Records the metric and creates a Performance mark

    return data;
  }

  return (
    <div>
      <button onClick={fetchData}>Load Data</button>
      {loadTime && <p>Last load: {loadTime.toFixed(0)}ms</p>}
    </div>
  );
}
```

---

## Vite/Rollup Plugin

The `perfBudgetPlugin()` integrates budget checking into your build pipeline:

### Basic Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { perfBudgetPlugin } from '@philjs/perf-budget';

export default defineConfig({
  plugins: [
    perfBudgetPlugin({
      maxBundleSize: 300 * 1024,     // 300KB total JS
      maxInitialBundle: 150 * 1024,  // 150KB initial bundle
      maxChunkSize: 100 * 1024,      // 100KB per chunk
      maxTotalAssets: 2 * 1024 * 1024  // 2MB total assets
    })
  ]
});
```

### Build Output

When you run `vite build`, the plugin will:

1. Analyze all generated bundles and assets
2. Check sizes against your budget
3. Print a detailed artifact report
4. **Fail the build** if any budget is exceeded

Example output:

```
Build Artifacts:

JS (267.45 KB):
  index.abc123.js: 145.20 KB
  vendor.def456.js: 98.50 KB
  lazy-feature.ghi789.js: 23.75 KB

CSS (28.30 KB):
  index.jkl012.css: 28.30 KB

IMAGE (412.00 KB):
  hero.webp: 312.00 KB
  icons.svg: 100.00 KB

All performance budgets passed!
```

If a budget is exceeded:

```
1 budget violation(s):
  - Total JS bundle (312.45 KB) exceeds budget (300.00 KB)

Error: Performance budget exceeded!
```

---

## Full Configuration Example

Here's a complete setup for a production application:

```typescript
// performance-budget.config.ts
import type { PerformanceBudget, BudgetConfig } from '@philjs/perf-budget';

export const performanceBudget: PerformanceBudget = {
  // Bundle budgets
  maxBundleSize: 300 * 1024,       // 300KB
  maxInitialBundle: 150 * 1024,    // 150KB
  maxChunkSize: 100 * 1024,        // 100KB
  maxTotalAssets: 2 * 1024 * 1024, // 2MB

  // Core Web Vitals (Google's "Good" thresholds)
  maxLCP: 2500,   // 2.5 seconds
  maxFID: 100,    // 100ms
  maxCLS: 0.1,    // 0.1
  maxINP: 200,    // 200ms
  maxTTFB: 800,   // 800ms
  maxFCP: 1800,   // 1.8 seconds

  // Runtime limits
  maxMemory: 100,        // 100MB
  maxLongTasks: 5,       // 5 long tasks max
  maxDOMNodes: 1500,     // 1500 DOM nodes
  maxNetworkRequests: 100,
  maxLayoutShifts: 5,

  // Custom metrics
  custom: {
    apiResponseTime: 500,    // 500ms
    timeToInteractive: 3000  // 3 seconds
  }
};

export const budgetConfig: BudgetConfig = {
  budget: performanceBudget,
  warningThreshold: 0.8,  // Warn at 80%
  errorThreshold: 1.0,    // Error at 100%
  enableRUM: true,
  reportUrl: '/api/performance-violations',
  onViolation: (violation) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance Budget] ${violation.message}`);
    }

    // Send to analytics
    analytics.track('performance_violation', {
      metric: violation.metric,
      budget: violation.budget,
      actual: violation.actual,
      severity: violation.severity
    });
  }
};
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { perfBudgetPlugin } from '@philjs/perf-budget';
import { performanceBudget } from './performance-budget.config';

export default defineConfig({
  plugins: [
    perfBudgetPlugin(performanceBudget)
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          // Split chunks to stay under maxChunkSize
        }
      }
    }
  }
});
```

### Runtime Monitoring

```typescript
// src/performance.ts
import { BudgetChecker } from '@philjs/perf-budget';
import { budgetConfig } from './performance-budget.config';

export const performanceChecker = new BudgetChecker(budgetConfig);

// Display performance score on page
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    const score = performanceChecker.calculateScore(
      performanceChecker.getMetrics()
    );
    console.log(`Performance Grade: ${score.grade} (${score.overall}/100)`);
  }, 5000);
}
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - run: npm ci
      - run: npm run build  # Will fail if budgets exceeded

      - name: Performance Budget Check
        run: |
          if [ $? -ne 0 ]; then
            echo "Build failed due to performance budget violations"
            exit 1
          fi
```

---

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `BudgetChecker` | Runtime budget monitoring with automatic metric collection |
| `BuildBudgetChecker` | Build-time budget enforcement |
| `PerformanceObserverManager` | Low-level Performance Observer wrapper |

### Hooks

| Hook | Description |
|------|-------------|
| `usePerformanceBudget(config)` | Full budget tracking with violations and scoring |
| `useWebVitals()` | Access Core Web Vitals (LCP, FID, CLS, INP, TTFB, FCP) |
| `usePerformanceMetric(name)` | Track custom performance metrics |

### Plugin

| Function | Description |
|----------|-------------|
| `perfBudgetPlugin(budget)` | Vite/Rollup plugin for build-time budget checking |

### Types

| Type | Description |
|------|-------------|
| `PerformanceBudget` | Budget configuration interface |
| `BudgetConfig` | Full configuration with callbacks and thresholds |
| `BudgetViolation` | Violation details |
| `PerformanceMetrics` | Collected metrics |
| `PerformanceScore` | Calculated performance score with grade |
| `BuildArtifact` | Build artifact information |

---

## Best Practices

1. **Start with Google's Core Web Vitals thresholds** - These are well-researched and user-centric
2. **Set budgets 10-20% below your targets** - Give yourself room for minor regressions
3. **Enable RUM in production** - Real user data is more valuable than synthetic tests
4. **Fail builds on budget violations** - Make performance a blocking requirement
5. **Track trends over time** - Use the `reportUrl` to collect historical data
6. **Review budgets quarterly** - Adjust as your application grows
