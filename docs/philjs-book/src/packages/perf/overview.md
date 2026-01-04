# @philjs/perf

Performance monitoring and profiling tools for PhilJS applications.

## Installation

```bash
npm install @philjs/perf
```

## Overview

`@philjs/perf` provides performance tools for PhilJS:

- **Component Profiling**: Measure render times
- **Signal Tracking**: Monitor signal updates
- **Memory Analysis**: Detect memory leaks
- **Web Vitals**: Core Web Vitals monitoring
- **Bundle Analysis**: Analyze bundle size
- **Runtime Metrics**: Real-time performance data

## Quick Start

```typescript
import { enableProfiling, useProfiler } from '@philjs/perf';

// Enable in development
if (import.meta.env.DEV) {
  enableProfiling({
    logSlowRenders: true,
    threshold: 16, // ms
  });
}

// Profile a component
function ExpensiveList() {
  const profiler = useProfiler('ExpensiveList');

  profiler.mark('render-start');
  const result = /* render logic */;
  profiler.mark('render-end');
  profiler.measure('render', 'render-start', 'render-end');

  return result;
}
```

## Component Profiling

```typescript
import { ProfiledComponent, useRenderCount } from '@philjs/perf';

// Wrap component for automatic profiling
const MyComponent = ProfiledComponent('MyComponent', (props) => {
  return <div>{props.children}</div>;
});

// Track render count
function Counter() {
  const renderCount = useRenderCount();
  console.log(`Rendered ${renderCount} times`);
}
```

## Signal Monitoring

```typescript
import { trackSignals, getSignalStats } from '@philjs/perf';

// Enable signal tracking
trackSignals();

// Later, get statistics
const stats = getSignalStats();
console.log('Total signals:', stats.total);
console.log('Active signals:', stats.active);
console.log('Updates/second:', stats.updatesPerSecond);
```

## Web Vitals

```typescript
import { reportWebVitals, onCLS, onFID, onLCP } from '@philjs/perf';

// Report all vitals
reportWebVitals((metric) => {
  analytics.send('web-vital', metric);
});

// Or individual metrics
onLCP((metric) => console.log('LCP:', metric.value));
onFID((metric) => console.log('FID:', metric.value));
onCLS((metric) => console.log('CLS:', metric.value));
```

## Memory Analysis

```typescript
import { trackMemory, detectLeaks } from '@philjs/perf';

// Start memory tracking
const tracker = trackMemory();

// Check for leaks periodically
setInterval(() => {
  const leaks = detectLeaks();
  if (leaks.length > 0) {
    console.warn('Potential memory leaks:', leaks);
  }
}, 30000);
```

## See Also

- [@philjs/perf-budget](../perf-budget/overview.md) - Performance budgets
- [@philjs/benchmark](../benchmark/overview.md) - Benchmarking
- [@philjs/devtools](../devtools/overview.md) - Developer tools
