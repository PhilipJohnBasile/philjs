# @philjs/observability

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Monitoring and observability tools for PhilJS applications. Track performance, errors, and user behavior with built-in dashboards and alerting.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add @philjs/observability
```

## Basic Usage

```tsx
import {
  ObservabilityProvider,
  useMetrics,
  PerformanceDashboard
} from '@philjs/observability';

function App() {
  return (
    <ObservabilityProvider
      endpoint="/api/metrics"
      sampleRate={0.1}
    >
      <MyApp />
    </ObservabilityProvider>
  );
}

function Dashboard() {
  const { trackEvent, trackError } = useMetrics();

  const handleClick = () => {
    trackEvent('button_clicked', { button: 'submit' });
  };

  return <PerformanceDashboard />;
}
```

## Features

- **Performance Monitoring** - Track Core Web Vitals and custom metrics
- **Error Tracking** - Capture and report JavaScript errors
- **User Analytics** - Track user behavior and interactions
- **Custom Metrics** - Define and track business metrics
- **Dashboards** - Pre-built visualization dashboards
- **Alerting** - Configure alerts for metric thresholds
- **Distributed Tracing** - Track requests across services
- **Session Replay** - Replay user sessions for debugging
- **Network Monitoring** - Track API latency and errors
- **Real User Monitoring** - Measure real user experience
- **Sparklines** - Compact inline metric visualizations
- **Gauge Charts** - Display current metric values

## Components

| Component | Description |
|-----------|-------------|
| `PerformanceDashboard` | Web Vitals dashboard |
| `WebVitalsDashboard` | Core Web Vitals display |
| `NetworkWaterfallPanel` | Network request timeline |
| `AlertsConfigPanel` | Alert configuration UI |
| `ComponentRenderPanel` | Component render metrics |
| `Sparkline` | Inline metric chart |
| `GaugeChart` | Circular metric gauge |

## Hooks

| Hook | Description |
|------|-------------|
| `useMetrics` | Track events and errors |
| `usePerformance` | Access performance data |
| `useWebVitals` | Core Web Vitals metrics |
| `useErrorBoundary` | Error tracking boundary |

## Metrics API

```typescript
import { metrics } from '@philjs/observability';

metrics.increment('page_views');
metrics.gauge('active_users', 150);
metrics.histogram('response_time', 234);
metrics.timing('api_call', startTime);
```

## License

MIT
