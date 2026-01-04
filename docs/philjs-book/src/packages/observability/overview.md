# @philjs/observability

Comprehensive observability for PhilJS applications with distributed tracing, metrics collection, structured logging, error tracking, and visualization components.

## Installation

```bash
npm install @philjs/observability
```

Optional peer dependencies for enhanced functionality:

```bash
# OpenTelemetry integration
npm install @opentelemetry/api @opentelemetry/sdk-node

# Sentry error tracking
npm install @sentry/node
```

## Features

- **Distributed Tracing** - OpenTelemetry-compatible span-based tracing
- **Metrics Collection** - Counters, gauges, histograms with exporters
- **Structured Logging** - Log levels, context, and trace correlation
- **Performance Monitoring** - Web Vitals (FCP, LCP, FID, CLS, TTFB)
- **Error Tracking** - Global error handlers with Sentry/Datadog integration
- **Visualization** - Charts, gauges, and dashboard widgets
- **Alerting Engine** - Rule-based alerts with notification channels

---

## Tracer

OpenTelemetry-compatible distributed tracing with spans, events, and attributes.

### Basic Usage

```typescript
import { Tracer } from '@philjs/observability';

const tracer = new Tracer({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  environment: 'production',
});

// Start and end spans manually
const span = tracer.startSpan('fetch-user-data', {
  'user.id': '12345',
});

try {
  const data = await fetchUserData();
  tracer.setAttribute(span, 'user.name', data.name);
  tracer.endSpan(span, 'ok');
} catch (error) {
  tracer.recordException(span, error);
  tracer.endSpan(span, 'error');
  throw error;
}
```

### Trace Wrapper

The `trace()` method provides a convenient wrapper for async functions:

```typescript
const result = await tracer.trace(
  'process-order',
  async (span) => {
    tracer.addEvent(span, 'order-received', { orderId: '123' });

    const order = await processOrder('123');

    tracer.setAttribute(span, 'order.total', order.total);
    tracer.addEvent(span, 'order-processed');

    return order;
  },
  { 'order.priority': 'high' }
);
```

### Span Events and Attributes

Add contextual information to spans:

```typescript
const span = tracer.startSpan('database-query');

// Add attributes for searchable metadata
tracer.setAttribute(span, 'db.system', 'postgresql');
tracer.setAttribute(span, 'db.statement', 'SELECT * FROM users');

// Add events for point-in-time occurrences
tracer.addEvent(span, 'query-started');
tracer.addEvent(span, 'query-completed', {
  rowCount: 42,
  duration: 15.5,
});

tracer.endSpan(span);
```

### Sampling and Exporters

Configure sampling rate and custom exporters:

```typescript
import { Tracer, SpanExporter, Span } from '@philjs/observability';

// Custom exporter
class ConsoleExporter implements SpanExporter {
  async export(spans: Span[]): Promise<void> {
    for (const span of spans) {
      console.log(`[${span.name}] ${span.endTime! - span.startTime}ms`);
    }
  }
}

const tracer = new Tracer({
  serviceName: 'my-app',
  sampleRate: 0.1, // Sample 10% of traces
  exporters: [new ConsoleExporter()],
});

// Manually flush spans
await tracer.flush();
```

### Nested Spans

Child spans automatically inherit the parent's trace ID:

```typescript
const parentSpan = tracer.startSpan('http-request');

// Child span created while parent is active
const childSpan = tracer.startSpan('database-query');
// childSpan.parentSpanId === parentSpan.spanId
// childSpan.traceId === parentSpan.traceId

tracer.endSpan(childSpan);
tracer.endSpan(parentSpan);
```

---

## Metrics

Collect counters, gauges, and histograms for application telemetry.

### Basic Usage

```typescript
import { Metrics } from '@philjs/observability';

const metrics = new Metrics({
  prefix: 'myapp',
  defaultLabels: { service: 'api' },
});

// Counter - monotonically increasing value
metrics.counter('http_requests_total', 1, {
  method: 'GET',
  path: '/api/users',
  status: '200',
});

// Gauge - value that can go up or down
metrics.gauge('active_connections', 42);
metrics.gauge('memory_usage_bytes', process.memoryUsage().heapUsed);

// Histogram - distribution of values
metrics.histogram('http_request_duration_ms', 125.5, {
  endpoint: '/api/users',
});
```

### Timer Utility

Measure execution time automatically:

```typescript
// Start timer
const stopTimer = metrics.timer('database_query', {
  table: 'users',
  operation: 'select',
});

// Perform operation
await db.query('SELECT * FROM users');

// Stop timer - automatically records duration
stopTimer();
// Records: myapp_database_query_duration_ms histogram
```

### Metric Exporters

Export metrics to external systems:

```typescript
import { Metrics, MetricsExporter, MetricValue } from '@philjs/observability';

class PrometheusExporter implements MetricsExporter {
  async export(metrics: MetricValue[]): Promise<void> {
    for (const metric of metrics) {
      const labels = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      console.log(`${metric.name}{${labels}} ${metric.value}`);
    }
  }
}

const metrics = new Metrics({
  prefix: 'app',
  exporters: [new PrometheusExporter()],
  flushInterval: 10000, // Export every 10 seconds
});

// Manual flush
await metrics.flush();

// Cleanup on shutdown
metrics.destroy();
```

---

## Logger

Structured logging with levels, context, and trace correlation.

### Basic Usage

```typescript
import { Logger } from '@philjs/observability';

const logger = new Logger({
  level: 'info',
  format: 'pretty', // or 'json' for production
});

logger.debug('Debugging information', { details: 'here' });
logger.info('User logged in', { userId: '123' });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.error('Failed to process request', new Error('Connection timeout'));
logger.fatal('Database connection lost', { host: 'db.example.com' });
```

### Log Levels

Logs below the configured level are filtered out:

| Level | Priority | Use Case |
|-------|----------|----------|
| `debug` | 0 | Detailed debugging information |
| `info` | 1 | General operational messages |
| `warn` | 2 | Warning conditions |
| `error` | 3 | Error conditions |
| `fatal` | 4 | Critical failures |

```typescript
const logger = new Logger({ level: 'warn' });

logger.debug('Not logged'); // Filtered
logger.info('Not logged');  // Filtered
logger.warn('Logged');      // Logged
logger.error('Logged');     // Logged
```

### Child Loggers with Context

Create child loggers with inherited context:

```typescript
const logger = new Logger({
  context: { service: 'api' },
});

// Child logger for specific request
const requestLogger = logger.child({
  requestId: 'abc-123',
  userId: 'user-456',
});

requestLogger.info('Processing request');
// Output includes: service, requestId, userId
```

### Custom Transports

Implement custom log destinations:

```typescript
import { Logger, LogTransport, LogEntry, ConsoleTransport } from '@philjs/observability';

class FileTransport implements LogTransport {
  log(entry: LogEntry): void {
    const line = JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      ...entry.context,
    });
    fs.appendFileSync('app.log', line + '\n');
  }
}

const logger = new Logger({
  transports: [
    new ConsoleTransport('pretty'),
    new FileTransport(),
  ],
});
```

### Trace ID Correlation

Logs automatically include trace context when inside a span:

```typescript
const tracer = new Tracer({ serviceName: 'api' });
const logger = new Logger();

await tracer.trace('handle-request', async (span) => {
  logger.info('Processing request');
  // Log includes: traceId, spanId from current span

  await processRequest();

  logger.info('Request completed');
});
```

---

## Performance Monitoring

Track Web Vitals and performance metrics in the browser.

### usePerformance Hook

```typescript
import { usePerformance } from '@philjs/observability';

function PerformanceMonitor() {
  const { metrics, getWebVitals } = usePerformance();

  // Access current metrics
  const vitals = metrics();

  console.log('Performance Metrics:', {
    fcp: vitals.fcp,  // First Contentful Paint
    lcp: vitals.lcp,  // Largest Contentful Paint
    fid: vitals.fid,  // First Input Delay
    cls: vitals.cls,  // Cumulative Layout Shift
    ttfb: vitals.ttfb, // Time to First Byte
  });

  return null;
}
```

### Web Vitals Explained

| Metric | Description | Good | Needs Improvement |
|--------|-------------|------|-------------------|
| **FCP** | First Contentful Paint - when first content appears | < 1.8s | < 3s |
| **LCP** | Largest Contentful Paint - when main content loads | < 2.5s | < 4s |
| **FID** | First Input Delay - time to respond to first interaction | < 100ms | < 300ms |
| **CLS** | Cumulative Layout Shift - visual stability score | < 0.1 | < 0.25 |
| **TTFB** | Time to First Byte - server response time | < 200ms | < 500ms |

### Tracking Performance in Components

```typescript
import { usePerformance, Metrics } from '@philjs/observability';

const metrics = new Metrics({ prefix: 'frontend' });

function App() {
  const { metrics: perfMetrics } = usePerformance();

  // Report metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const vitals = perfMetrics();

      if (vitals.lcp) metrics.histogram('web_vitals_lcp', vitals.lcp);
      if (vitals.fid) metrics.histogram('web_vitals_fid', vitals.fid);
      if (vitals.cls) metrics.histogram('web_vitals_cls', vitals.cls);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return <MyApp />;
}
```

---

## Error Tracking

Capture and report errors with global handlers and integrations.

### ErrorTracker Class

```typescript
import { ErrorTracker } from '@philjs/observability';

const errorTracker = new ErrorTracker({
  dsn: 'https://errors.example.com/project/123',
  environment: 'production',
  release: '1.0.0',
  sampleRate: 1.0, // Capture 100% of errors
  onError: (error, context) => {
    console.error('Error captured:', error.message, context);
  },
});

// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  errorTracker.captureException(error, {
    operation: 'riskyOperation',
    userId: currentUser.id,
  });
}

// Capture messages
errorTracker.captureMessage('Payment processed', 'info', {
  amount: 99.99,
  currency: 'USD',
});
```

### Global Error Handlers

The ErrorTracker automatically sets up global handlers:

```typescript
const errorTracker = new ErrorTracker({
  environment: 'production',
});

// Browser - automatically captures:
// - window.onerror events
// - unhandledrejection events

// Node.js - automatically captures:
// - process.on('uncaughtException')
// - process.on('unhandledRejection')
```

### User Context

Associate errors with user information:

```typescript
errorTracker.setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
});

errorTracker.setTags({
  feature: 'checkout',
  experiment: 'new-flow-v2',
});
```

### Sentry Integration

```typescript
import { ErrorTracker } from '@philjs/observability';
import * as Sentry from '@sentry/node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Use ErrorTracker with Sentry callback
const errorTracker = new ErrorTracker({
  onError: (error, context) => {
    Sentry.captureException(error, {
      extra: context,
    });
  },
});
```

---

## Charts and Visualization

SVG-based chart components for observability dashboards.

### TimeSeriesChart

Line chart for time-series data:

```typescript
import { TimeSeriesChart, DataPoint, TimeSeries } from '@philjs/observability';

const series: TimeSeries[] = [
  {
    name: 'CPU Usage',
    color: '#4a90d9',
    data: [
      { timestamp: Date.now() - 60000, value: 45 },
      { timestamp: Date.now() - 30000, value: 52 },
      { timestamp: Date.now(), value: 48 },
    ],
  },
  {
    name: 'Memory Usage',
    color: '#e74c3c',
    data: [
      { timestamp: Date.now() - 60000, value: 72 },
      { timestamp: Date.now() - 30000, value: 75 },
      { timestamp: Date.now(), value: 73 },
    ],
  },
];

const svg = TimeSeriesChart({
  series,
  width: 600,
  height: 300,
  showLegend: true,
  showGrid: true,
  xAxisLabel: 'Time',
  yAxisLabel: 'Percentage',
});
```

### Histogram

Bar chart for distribution visualization:

```typescript
import { Histogram, HistogramBucket } from '@philjs/observability';

const buckets: HistogramBucket[] = [
  { label: '0-100ms', value: 150, color: '#27ae60' },
  { label: '100-200ms', value: 89, color: '#27ae60' },
  { label: '200-500ms', value: 45, color: '#f39c12' },
  { label: '500ms-1s', value: 12, color: '#e74c3c' },
  { label: '>1s', value: 3, color: '#e74c3c' },
];

const svg = Histogram({
  buckets,
  width: 500,
  height: 300,
  showValues: true,
  showLabels: true,
  xAxisLabel: 'Response Time',
  yAxisLabel: 'Request Count',
});
```

### FlameGraph

Visualize performance profiling and tracing data:

```typescript
import { FlameGraph, spansToFlameGraph, FlameGraphNode } from '@philjs/observability';

// Convert spans to flame graph
const spans = tracer.getSpans();
const root = spansToFlameGraph(spans);

const svg = FlameGraph({
  root,
  width: 800,
  height: 400,
  cellHeight: 20,
  colorScheme: 'warm', // 'warm' | 'cool' | 'gradient'
  showLabels: true,
  minWidth: 5,
});

// Or create manually
const manualRoot: FlameGraphNode = {
  name: 'main',
  value: 1000,
  children: [
    {
      name: 'fetchData',
      value: 600,
      children: [
        { name: 'query', value: 400, children: [] },
        { name: 'transform', value: 200, children: [] },
      ],
    },
    { name: 'render', value: 400, children: [] },
  ],
};
```

### Sparklines

Compact inline charts:

```typescript
import { Sparkline, SparkBar, SparkArea } from '@philjs/observability';

const data = [10, 15, 12, 18, 22, 19, 25, 28, 24, 30];

// Line sparkline
const lineSvg = Sparkline({
  data,
  width: 100,
  height: 30,
  color: '#4a90d9',
  strokeWidth: 1.5,
  showDots: false,
});

// Bar sparkline
const barSvg = SparkBar({
  data,
  width: 100,
  height: 30,
  color: '#27ae60',
  gap: 1,
});

// Area sparkline
const areaSvg = SparkArea({
  data,
  width: 100,
  height: 30,
  fillColor: 'rgba(74, 144, 217, 0.3)',
  strokeColor: '#4a90d9',
});
```

### GaugeChart

Circular progress indicators:

```typescript
import { GaugeChart, MiniGauge, HalfGauge } from '@philjs/observability';

// Full circular gauge with thresholds
const fullGauge = GaugeChart({
  value: 75,
  min: 0,
  max: 100,
  width: 200,
  height: 200,
  showValue: true,
  label: 'CPU Usage',
  unit: '%',
  thresholds: [
    { value: 80, color: '#e74c3c' },
    { value: 60, color: '#f39c12' },
    { value: 0, color: '#27ae60' },
  ],
});

// Compact mini gauge
const miniGauge = MiniGauge({
  value: 65,
  max: 100,
  size: 40,
  color: '#4a90d9',
  strokeWidth: 4,
});

// Semi-circular gauge
const halfGauge = HalfGauge({
  value: 85,
  min: 0,
  max: 100,
  width: 200,
  height: 120,
  showValue: true,
  label: 'Memory',
  unit: '%',
});
```

---

## Widgets

Dashboard widgets for displaying metrics and status.

### MetricCard

Display metrics in a card format:

```typescript
import { MetricCard, CompactMetricCard } from '@philjs/observability';

const card = MetricCard({
  title: 'Response Time',
  value: 145,
  unit: 'ms',
  trend: 'down', // 'up' | 'down' | 'stable'
  trendValue: -12.5, // Percentage change
  status: 'healthy', // 'healthy' | 'warning' | 'critical' | 'unknown'
  description: 'P95 latency',
});

const compact = CompactMetricCard({
  title: 'Active Users',
  value: '1,234',
  status: 'healthy',
});
```

### StatusIndicator

Display system health status:

```typescript
import { StatusIndicator, StatusCard, UptimeBar } from '@philjs/observability';

// Simple status indicator
const indicator = StatusIndicator({
  status: 'healthy', // 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  label: 'API Server',
  size: 'md', // 'sm' | 'md' | 'lg'
});

// Status card with description
const statusCard = StatusCard({
  title: 'Database',
  status: 'healthy',
  description: 'PostgreSQL primary node',
  lastChecked: new Date(),
});

// Uptime bar
const uptimeBar = UptimeBar({
  uptime: 99.95, // Percentage (0-100) or ratio (0-1)
  days: 30,
  showPercentage: true,
});
```

### AlertBadge

Display alerts and notifications:

```typescript
import { AlertBadge, AlertList, AlertBanner, AlertToast } from '@philjs/observability';

// Alert count badge
const badge = AlertBadge({
  count: 5,
  severity: 'warning', // 'info' | 'warning' | 'error' | 'critical'
});

// Alert list
const alerts = [
  {
    id: '1',
    title: 'High Memory Usage',
    message: 'Memory usage exceeded 90%',
    severity: 'warning',
    timestamp: new Date(),
    acknowledged: false,
  },
  {
    id: '2',
    title: 'API Latency Spike',
    message: 'P95 latency > 2s',
    severity: 'error',
    timestamp: new Date(),
    acknowledged: true,
  },
];

const list = AlertList({
  alerts,
  maxItems: 5,
});

// Alert banner
const banner = AlertBanner({
  alert: alerts[0],
  dismissible: true,
});

// Toast notification
const toast = AlertToast({
  alert: alerts[0],
  duration: 5000,
});
```

---

## Alerting Engine

Rule-based alerting with threshold evaluation and notification channels.

### AlertManager Setup

```typescript
import { AlertManager, initAlertManager, getAlertManager } from '@philjs/observability';

// Initialize with configuration
const alertManager = initAlertManager({
  evaluationInterval: 10000, // Check every 10 seconds
  retentionPeriod: 86400000, // Keep alerts for 24 hours
  maxAlerts: 1000,
  defaultNotificationChannels: ['console', 'slack'],
});

// Start evaluation loop
alertManager.start();

// Or get existing instance
const manager = getAlertManager();
```

### Alert Rules

Define conditions that trigger alerts:

```typescript
import { AlertManager, AlertRule } from '@philjs/observability';

const alertManager = new AlertManager();

// Add custom rule
alertManager.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate',
  description: 'Alert when error rate exceeds 5%',
  enabled: true,
  metric: 'errors.rate',
  condition: {
    operator: 'gt', // 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'
    threshold: 5,
    aggregation: 'avg', // 'avg' | 'sum' | 'min' | 'max' | 'count' | 'last'
    window: 300000, // 5 minute window
  },
  severity: 'critical', // 'critical' | 'warning' | 'info'
  for: 60000, // Must be true for 1 minute before firing
  cooldown: 300000, // Don't re-fire for 5 minutes
  labels: { team: 'backend' },
  annotations: { runbook: 'https://wiki.example.com/high-error-rate' },
  notificationChannels: ['pagerduty', 'slack'],
});

// Use preset rules
import { presetRules } from '@philjs/observability';

alertManager.addRule(presetRules.highCpuUsage);
alertManager.addRule(presetRules.highMemoryUsage);
alertManager.addRule(presetRules.highErrorRate);
alertManager.addRule(presetRules.slowResponseTime);
alertManager.addRule(presetRules.lowDiskSpace);
```

### Recording Metrics

Feed metrics to the alert manager:

```typescript
// Record metric values for rule evaluation
alertManager.recordMetric('cpu.usage', 75);
alertManager.recordMetric('memory.usage', 85);
alertManager.recordMetric('errors.rate', 2.5);
alertManager.recordMetric('response.time.p95', 450);
```

### Notification Channels

Configure how alerts are delivered:

```typescript
import { NotificationChannel } from '@philjs/observability';

// Console logging
alertManager.addChannel({
  id: 'console',
  name: 'Console',
  type: 'console',
  config: {},
  enabled: true,
});

// Webhook
alertManager.addChannel({
  id: 'webhook',
  name: 'Custom Webhook',
  type: 'webhook',
  config: {
    url: 'https://api.example.com/alerts',
    headers: { 'X-API-Key': 'secret' },
  },
  enabled: true,
});

// Slack
alertManager.addChannel({
  id: 'slack',
  name: 'Slack Alerts',
  type: 'slack',
  config: {
    webhookUrl: 'https://hooks.slack.com/services/xxx/yyy/zzz',
  },
  enabled: true,
});

// Email
alertManager.addChannel({
  id: 'email',
  name: 'Email Alerts',
  type: 'email',
  config: {
    endpoint: 'https://api.sendgrid.com/v3/mail/send',
    apiKey: process.env.SENDGRID_API_KEY,
    to: ['ops@example.com'],
    from: 'alerts@example.com',
  },
  enabled: true,
});

// PagerDuty
alertManager.addChannel({
  id: 'pagerduty',
  name: 'PagerDuty',
  type: 'pagerduty',
  config: {
    routingKey: process.env.PAGERDUTY_ROUTING_KEY,
  },
  enabled: true,
});
```

### Managing Alerts

```typescript
// Get all alerts
const allAlerts = alertManager.getAlerts();

// Filter alerts
const criticalAlerts = alertManager.getAlerts({
  severity: 'critical',
  state: 'firing',
});

const recentAlerts = alertManager.getAlerts({
  since: Date.now() - 3600000, // Last hour
});

// Get active (firing) alerts
const active = alertManager.getActiveAlerts();

// Acknowledge alert
alertManager.acknowledgeAlert('alert-123', 'john.doe');

// Manually resolve alert
alertManager.resolveAlert('alert-123');

// Get statistics
const stats = alertManager.getStats();
console.log(stats);
// {
//   totalRules: 5,
//   enabledRules: 4,
//   activeAlerts: 2,
//   totalAlerts: 15,
//   alertsBySeverity: { critical: 1, warning: 1, info: 0 },
//   alertsByState: { pending: 0, firing: 2, resolved: 12, acknowledged: 1 }
// }
```

### useAlerts Hook

React hook for alert management:

```typescript
import { useAlerts } from '@philjs/observability';

function AlertsPanel() {
  const { alerts, stats, acknowledge, resolve } = useAlerts({
    state: 'firing',
    severity: 'critical',
  });

  return (
    <div>
      <h2>Active Critical Alerts ({stats.activeAlerts})</h2>
      <ul>
        {alerts.map((alert) => (
          <li key={alert.id}>
            <strong>{alert.ruleName}</strong>: {alert.message}
            <button onClick={() => acknowledge(alert.id)}>Acknowledge</button>
            <button onClick={() => resolve(alert.id)}>Resolve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Alert Event Listeners

Subscribe to alert state changes:

```typescript
const unsubscribe = alertManager.onAlert((alert) => {
  if (alert.state === 'firing') {
    console.log(`ALERT: ${alert.ruleName} - ${alert.message}`);
  } else if (alert.state === 'resolved') {
    console.log(`RESOLVED: ${alert.ruleName}`);
  }
});

// Cleanup
unsubscribe();
```

---

## Complete Example

```typescript
import {
  Tracer,
  Metrics,
  Logger,
  ErrorTracker,
  AlertManager,
  usePerformance,
} from '@philjs/observability';

// Initialize observability stack
const tracer = new Tracer({
  serviceName: 'my-api',
  environment: process.env.NODE_ENV,
});

const metrics = new Metrics({
  prefix: 'myapi',
  defaultLabels: { service: 'api' },
});

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
});

const errorTracker = new ErrorTracker({
  environment: process.env.NODE_ENV,
});

const alertManager = new AlertManager();
alertManager.addRule({
  id: 'high-latency',
  name: 'High API Latency',
  enabled: true,
  metric: 'http.duration',
  condition: { operator: 'gt', threshold: 1000, aggregation: 'avg' },
  severity: 'warning',
});
alertManager.start();

// Usage in request handler
async function handleRequest(req: Request) {
  return tracer.trace('handle-request', async (span) => {
    const requestLogger = logger.child({
      path: req.url,
      method: req.method,
    });

    const stopTimer = metrics.timer('http', {
      path: req.url,
      method: req.method,
    });

    try {
      requestLogger.info('Request received');
      metrics.counter('http_requests_total');

      const result = await processRequest(req);

      stopTimer();
      metrics.counter('http_requests_success');
      requestLogger.info('Request completed');

      return result;
    } catch (error) {
      stopTimer();
      metrics.counter('http_requests_error');
      errorTracker.captureException(error, { url: req.url });
      requestLogger.error('Request failed', error);
      throw error;
    }
  });
}
```

## API Reference

### Tracer

| Method | Description |
|--------|-------------|
| `startSpan(name, attributes?)` | Start a new span |
| `endSpan(span, status?)` | End a span with optional status |
| `addEvent(span, name, attributes?)` | Add event to span |
| `setAttribute(span, key, value)` | Set span attribute |
| `recordException(span, error)` | Record exception on span |
| `trace(name, fn, attributes?)` | Wrap async function with span |
| `flush()` | Export pending spans |

### Metrics

| Method | Description |
|--------|-------------|
| `counter(name, value?, labels?)` | Increment counter |
| `gauge(name, value, labels?)` | Set gauge value |
| `histogram(name, value, labels?)` | Record histogram value |
| `timer(name, labels?)` | Start timer, returns stop function |
| `flush()` | Export pending metrics |
| `destroy()` | Stop flush interval and export |

### Logger

| Method | Description |
|--------|-------------|
| `debug(message, context?)` | Log debug message |
| `info(message, context?)` | Log info message |
| `warn(message, context?)` | Log warning message |
| `error(message, error?)` | Log error message |
| `fatal(message, error?)` | Log fatal message |
| `child(context)` | Create child logger |

### AlertManager

| Method | Description |
|--------|-------------|
| `addRule(rule)` | Add alert rule |
| `removeRule(ruleId)` | Remove alert rule |
| `enableRule(ruleId)` | Enable rule |
| `disableRule(ruleId)` | Disable rule |
| `addChannel(channel)` | Add notification channel |
| `recordMetric(name, value)` | Record metric for evaluation |
| `getAlerts(filter?)` | Get alerts with optional filter |
| `getActiveAlerts()` | Get firing alerts |
| `acknowledgeAlert(alertId, by?)` | Acknowledge alert |
| `resolveAlert(alertId)` | Resolve alert |
| `onAlert(listener)` | Subscribe to alert events |
| `start()` | Start evaluation loop |
| `stop()` | Stop evaluation loop |
| `getStats()` | Get alert statistics |
