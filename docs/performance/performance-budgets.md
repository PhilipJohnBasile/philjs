# Performance Budgets

Set and enforce performance goals to maintain fast application performance.


## What You'll Learn

- Setting performance budgets
- Budget categories
- Monitoring tools
- CI/CD integration
- Enforcement strategies
- Best practices

## What Are Performance Budgets?

Performance budgets are limits you set for metrics that affect your application's performance. They help prevent performance regressions by making performance measurable and enforceable.

### Common Budget Categories

```typescript
interface PerformanceBudget {
  // Timing budgets
  timing: {
    FCP: number;  // First Contentful Paint
    LCP: number;  // Largest Contentful Paint
    TTI: number;  // Time to Interactive
    FID: number;  // First Input Delay
    CLS: number;  // Cumulative Layout Shift
  };

  // Size budgets
  size: {
    totalJS: number;      // Total JavaScript size
    totalCSS: number;     // Total CSS size
    mainBundle: number;   // Main bundle size
    vendorBundle: number; // Vendor bundle size
    images: number;       // Total image size
  };

  // Resource budgets
  resources: {
    requests: number;     // Total HTTP requests
    fonts: number;        // Number of font files
    scripts: number;      // Number of script files
  };
}

// Example budget
const budget: PerformanceBudget = {
  timing: {
    FCP: 1800,  // 1.8s
    LCP: 2500,  // 2.5s
    TTI: 3800,  // 3.8s
    FID: 100,   // 100ms
    CLS: 0.1    // 0.1
  },
  size: {
    totalJS: 300,      // 300KB (gzipped)
    totalCSS: 50,      // 50KB (gzipped)
    mainBundle: 170,   // 170KB (gzipped)
    vendorBundle: 130, // 130KB (gzipped)
    images: 500        // 500KB
  },
  resources: {
    requests: 50,
    fonts: 2,
    scripts: 10
  }
};
```

## Setting Budgets

### Analyze Current Performance

```typescript
import { signal } from '@philjs/core';

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  TTI: number;
  bundleSize: number;
  requestCount: number;
}

async function analyzeCurrentPerformance(): Promise<PerformanceMetrics> {
  // Get timing metrics
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  // Get paint metrics
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0;

  // Get LCP
  let lcp = 0;
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    lcp = entries[entries.length - 1].startTime;
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Get resource sizes
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const bundleSize = resources
    .filter(r => r.name.endsWith('.js'))
    .reduce((sum, r) => sum + (r.transferSize || 0), 0);

  return {
    FCP: fcp,
    LCP: lcp,
    TTI: navigation.domInteractive,
    bundleSize: bundleSize / 1024, // Convert to KB
    requestCount: resources.length
  };
}

// Usage
const currentMetrics = await analyzeCurrentPerformance();
console.log('Current performance:', currentMetrics);

// Set budgets based on current performance (10-20% improvement)
const improvedBudget = {
  FCP: currentMetrics.FCP * 0.9,
  LCP: currentMetrics.LCP * 0.9,
  TTI: currentMetrics.TTI * 0.85
};
```

### Competitive Analysis

```typescript
interface CompetitorMetrics {
  name: string;
  FCP: number;
  LCP: number;
  bundleSize: number;
}

const competitors: CompetitorMetrics[] = [
  { name: 'Competitor A', FCP: 1200, LCP: 2100, bundleSize: 250 },
  { name: 'Competitor B', FCP: 1500, LCP: 2400, bundleSize: 300 },
  { name: 'Competitor C', FCP: 1800, LCP: 2800, bundleSize: 350 }
];

// Set budget to be faster than average competitor
const avgFCP = competitors.reduce((sum, c) => sum + c.FCP, 0) / competitors.length;
const avgLCP = competitors.reduce((sum, c) => sum + c.LCP, 0) / competitors.length;
const avgBundle = competitors.reduce((sum, c) => sum + c.bundleSize, 0) / competitors.length;

const competitiveBudget = {
  FCP: avgFCP * 0.8,  // 20% faster than average
  LCP: avgLCP * 0.8,
  bundleSize: avgBundle * 0.9  // 10% smaller
};
```

## Monitoring Budgets

### Build-Time Budget Checking

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@philjs/core', '@philjs/router'],
          ui: ['./src/components']
        }
      }
    }
  },
  plugins: [
    {
      name: 'budget-checker',
      closeBundle() {
        const fs = require('fs');
        const path = require('path');

        const distDir = path.resolve(__dirname, 'dist/assets');
        const files = fs.readdirSync(distDir);

        let totalJS = 0;
        let totalCSS = 0;

        files.forEach((file: string) => {
          const stats = fs.statSync(path.join(distDir, file));
          const sizeKB = stats.size / 1024;

          if (file.endsWith('.js')) {
            totalJS += sizeKB;
          } else if (file.endsWith('.css')) {
            totalCSS += sizeKB;
          }
        });

        // Check budgets
        const budgets = {
          js: 300,  // 300KB
          css: 50   // 50KB
        };

        if (totalJS > budgets.js) {
          throw new Error(
            `JavaScript budget exceeded: ${totalJS.toFixed(2)}KB > ${budgets.js}KB`
          );
        }

        if (totalCSS > budgets.css) {
          throw new Error(
            `CSS budget exceeded: ${totalCSS.toFixed(2)}KB > ${budgets.css}KB`
          );
        }

        console.log('✓ Performance budgets met');
        console.log(`  JS: ${totalJS.toFixed(2)}KB / ${budgets.js}KB`);
        console.log(`  CSS: ${totalCSS.toFixed(2)}KB / ${budgets.css}KB`);
      }
    }
  ]
});
```

### Using size-limit

```bash
npm install -D @size-limit/file @size-limit/webpack
```

```json
// package.json
{
  "scripts": {
    "size": "size-limit",
    "build": "vite build && npm run size"
  },
  "size-limit": [
    {
      "name": "Main bundle",
      "path": "dist/assets/index-*.js",
      "limit": "170 KB",
      "gzip": true
    },
    {
      "name": "Vendor bundle",
      "path": "dist/assets/vendor-*.js",
      "limit": "130 KB",
      "gzip": true
    },
    {
      "name": "Total CSS",
      "path": "dist/assets/*.css",
      "limit": "50 KB",
      "gzip": true
    }
  ]
}
```

### Using bundlesize

```bash
npm install -D bundlesize
```

```json
// package.json
{
  "scripts": {
    "test:size": "bundlesize"
  },
  "bundlesize": [
    {
      "path": "./dist/assets/index-*.js",
      "maxSize": "170 KB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/vendor-*.js",
      "maxSize": "130 KB",
      "compression": "gzip"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "50 KB",
      "compression": "gzip"
    }
  ]
}
```

## Runtime Budget Monitoring

### Track Web Vitals

```typescript
import { signal, effect } from '@philjs/core';

interface WebVitals {
  FCP: number;
  LCP: number;
  FID: number;
  CLS: number;
}

const vitals = signal<Partial<WebVitals>>({});

export function trackWebVitals(budget: WebVitals) {
  effect(() => {
    // First Contentful Paint
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcp = entry.startTime;
          vitals.set({ ...vitals(), FCP: fcp });

          if (fcp > budget.FCP) {
            console.warn(`FCP budget exceeded: ${fcp.toFixed(0)}ms > ${budget.FCP}ms`);
            reportBudgetViolation('FCP', fcp, budget.FCP);
          }
        }
      }
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1].startTime;
      vitals.set({ ...vitals(), LCP: lcp });

      if (lcp > budget.LCP) {
        console.warn(`LCP budget exceeded: ${lcp.toFixed(0)}ms > ${budget.LCP}ms`);
        reportBudgetViolation('LCP', lcp, budget.LCP);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as PerformanceEventTiming;
      const fid = entry.processingStart - entry.startTime;
      vitals.set({ ...vitals(), FID: fid });

      if (fid > budget.FID) {
        console.warn(`FID budget exceeded: ${fid.toFixed(0)}ms > ${budget.FID}ms`);
        reportBudgetViolation('FID', fid, budget.FID);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      vitals.set({ ...vitals(), CLS: clsValue });

      if (clsValue > budget.CLS) {
        console.warn(`CLS budget exceeded: ${clsValue.toFixed(2)} > ${budget.CLS}`);
        reportBudgetViolation('CLS', clsValue, budget.CLS);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      paintObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  });
}

function reportBudgetViolation(
  metric: string,
  actual: number,
  budget: number
) {
  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('budget-violation', {
      metric,
      actual,
      budget,
      excess: actual - budget,
      url: window.location.pathname
    });
  }
}

// Usage
trackWebVitals({
  FCP: 1800,
  LCP: 2500,
  FID: 100,
  CLS: 0.1
});
```

### Monitor Bundle Sizes

```typescript
function monitorBundleSize() {
  effect(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const budgets = {
      js: 300 * 1024,   // 300KB
      css: 50 * 1024,   // 50KB
      images: 500 * 1024 // 500KB
    };

    let totalJS = 0;
    let totalCSS = 0;
    let totalImages = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;

      if (resource.name.endsWith('.js')) {
        totalJS += size;
      } else if (resource.name.endsWith('.css')) {
        totalCSS += size;
      } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(resource.name)) {
        totalImages += size;
      }
    });

    // Check budgets
    if (totalJS > budgets.js) {
      console.warn(
        `JS size budget exceeded: ${(totalJS / 1024).toFixed(2)}KB > ${budgets.js / 1024}KB`
      );
    }

    if (totalCSS > budgets.css) {
      console.warn(
        `CSS size budget exceeded: ${(totalCSS / 1024).toFixed(2)}KB > ${budgets.css / 1024}KB`
      );
    }

    if (totalImages > budgets.images) {
      console.warn(
        `Image size budget exceeded: ${(totalImages / 1024).toFixed(2)}KB > ${budgets.images / 1024}KB`
      );
    }
  });
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/performance.yml
name: Performance Budget

on:
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npm run size

      - name: Comment PR
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Lighthouse CI

```bash
npm install -D @lhci/cli
```

```javascript
// lighthouserc.ts
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173'],
      numberOfRuns: 3
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 300000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 1000000 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '24'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## Enforcement Strategies

### Fail Builds on Budget Violation

```typescript
// scripts/check-budgets.ts
import fs from 'node:fs';
import path from 'node:path';

interface Budget {
  name: string;
  path: string;
  limit: number;
}

const budgets: Budget[] = [
  { name: 'Main bundle', path: 'dist/assets/index-*.js', limit: 170 * 1024 },
  { name: 'Vendor bundle', path: 'dist/assets/vendor-*.js', limit: 130 * 1024 },
  { name: 'Total CSS', path: 'dist/assets/*.css', limit: 50 * 1024 }
];

function checkBudgets() {
  let violations = 0;

  budgets.forEach((budget) => {
    const files = findFiles(budget.path);
    const totalSize = files.reduce((sum, file) => {
      return sum + fs.statSync(file).size;
    }, 0);

    console.log(`\n${budget.name}:`);
    console.log(`  Size: ${(totalSize / 1024).toFixed(2)}KB`);
    console.log(`  Budget: ${(budget.limit / 1024).toFixed(2)}KB`);

    if (totalSize > budget.limit) {
      const excess = totalSize - budget.limit;
      console.error(`  ❌ EXCEEDED by ${(excess / 1024).toFixed(2)}KB`);
      violations++;
    } else {
      const remaining = budget.limit - totalSize;
      console.log(`  ✓ ${(remaining / 1024).toFixed(2)}KB remaining`);
    }
  });

  if (violations > 0) {
    console.error(`\n❌ ${violations} budget violation(s) found`);
    process.exit(1);
  } else {
    console.log('\n✓ All budgets met');
  }
}

function findFiles(pattern: string): string[] {
  const dir = path.dirname(pattern);
  const filePattern = path.basename(pattern);

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  const regex = new RegExp(
    filePattern.replace(/\*/g, '.*').replace(/\?/g, '.')
  );

  return files
    .filter(file => regex.test(file))
    .map(file => path.join(dir, file));
}

checkBudgets();
```

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "check:budgets": "tsx scripts/check-budgets.ts",
    "prebuild": "npm run check:budgets"
  }
}
```

### Warning System

```typescript
// scripts/warn-budgets.ts
interface BudgetStatus {
  name: string;
  size: number;
  budget: number;
  status: 'ok' | 'warning' | 'exceeded';
}

function checkWithWarnings() {
  const statuses: BudgetStatus[] = [];

  budgets.forEach((budget) => {
    const files = findFiles(budget.path);
    const totalSize = files.reduce((sum, file) => {
      return sum + fs.statSync(file).size;
    }, 0);

    let status: BudgetStatus['status'] = 'ok';

    if (totalSize > budget.limit) {
      status = 'exceeded';
    } else if (totalSize > budget.limit * 0.9) {
      status = 'warning';
    }

    statuses.push({
      name: budget.name,
      size: totalSize,
      budget: budget.limit,
      status
    });
  });

  // Print report
  console.log('\n📊 Performance Budget Report\n');

  statuses.forEach((s) => {
    const percentage = (s.size / s.budget * 100).toFixed(1);
    const sizeKB = (s.size / 1024).toFixed(2);
    const budgetKB = (s.budget / 1024).toFixed(2);

    if (s.status === 'exceeded') {
      console.log(`❌ ${s.name}: ${sizeKB}KB / ${budgetKB}KB (${percentage}%)`);
    } else if (s.status === 'warning') {
      console.log(`⚠️  ${s.name}: ${sizeKB}KB / ${budgetKB}KB (${percentage}%)`);
    } else {
      console.log(`✓  ${s.name}: ${sizeKB}KB / ${budgetKB}KB (${percentage}%)`);
    }
  });

  // Fail only on exceeded
  const exceeded = statuses.filter(s => s.status === 'exceeded');
  if (exceeded.length > 0) {
    process.exit(1);
  }
}
```

## Best Practices

### Set Realistic Budgets

```typescript
// ✅ Based on real metrics and goals
const realisticBudget = {
  // Start with current performance
  current: {
    FCP: 2000,
    LCP: 3000
  },

  // Set achievable improvement (10-20%)
  target: {
    FCP: 1800,  // 10% improvement
    LCP: 2500   // 17% improvement
  }
};

// ❌ Unrealistic budgets
const unrealisticBudget = {
  FCP: 500,   // Too aggressive
  LCP: 1000   // Impossible without major changes
};
```

### Budget by Route

```typescript
// Different budgets for different pages
const budgetsByRoute = {
  '/': {
    // Homepage - strict budget
    FCP: 1500,
    LCP: 2000,
    bundleSize: 150
  },
  '/dashboard': {
    // Dashboard - more lenient
    FCP: 2000,
    LCP: 2500,
    bundleSize: 250
  },
  '/admin': {
    // Admin - less critical
    FCP: 2500,
    LCP: 3000,
    bundleSize: 300
  }
};

function getBudgetForRoute(route: string) {
  return budgetsByRoute[route] || budgetsByRoute['/'];
}
```

### Track Trends Over Time

```typescript
interface BudgetTrend {
  date: string;
  metric: string;
  value: number;
  budget: number;
}

const trends: BudgetTrend[] = [];

function recordMetric(metric: string, value: number, budget: number) {
  trends.push({
    date: new Date().toISOString(),
    metric,
    value,
    budget
  });

  // Store in analytics
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('performance-metric', {
      metric,
      value,
      budget,
      withinBudget: value <= budget
    });
  }
}

function analyzeTrends(metric: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const recentTrends = trends.filter(
    t => t.metric === metric && new Date(t.date) >= since
  );

  const average = recentTrends.reduce((sum, t) => sum + t.value, 0) / recentTrends.length;
  const violations = recentTrends.filter(t => t.value > t.budget).length;

  return {
    average,
    violations,
    violationRate: violations / recentTrends.length,
    trend: calculateTrend(recentTrends)
  };
}

function calculateTrend(data: BudgetTrend[]) {
  if (data.length < 2) return 'stable';

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = ((last - first) / first) * 100;

  if (change > 5) return 'worsening';
  if (change < -5) return 'improving';
  return 'stable';
}
```

### Regular Budget Reviews

```typescript
// Quarterly budget review
interface BudgetReview {
  quarter: string;
  currentBudgets: Record<string, number>;
  actualMetrics: Record<string, number>;
  recommendations: string[];
}

function quarterlyBudgetReview(): BudgetReview {
  const current = {
    FCP: 1800,
    LCP: 2500,
    bundleSize: 300
  };

  const actual = {
    FCP: 1650,  // Consistently beating budget
    LCP: 2400,  // Meeting budget
    bundleSize: 320  // Exceeding budget
  };

  const recommendations: string[] = [];

  // Adjust budgets based on actual performance
  Object.keys(current).forEach((metric) => {
    const budget = current[metric];
    const actualValue = actual[metric];

    if (actualValue < budget * 0.8) {
      recommendations.push(
        `Lower ${metric} budget to ${(actualValue * 1.1).toFixed(0)} (currently beating by 20%)`
      );
    } else if (actualValue > budget) {
      recommendations.push(
        `Address ${metric} - exceeding budget by ${((actualValue - budget) / budget * 100).toFixed(1)}%`
      );
    }
  });

  return {
    quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    currentBudgets: current,
    actualMetrics: actual,
    recommendations
  };
}
```

## Summary

You've learned:

✅ Setting performance budgets for timing, size, and resources
✅ Monitoring budgets at build time and runtime
✅ Integrating budget checks into CI/CD
✅ Enforcement strategies (warnings, failures)
✅ Tracking trends and analyzing performance over time
✅ Best practices for maintaining budgets

Performance budgets make performance measurable and enforceable!

---

**Next:** [Advanced Topics →](../advanced/overview.md) Learn advanced PhilJS patterns
