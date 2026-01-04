# @philjs/dashboard

A comprehensive performance monitoring dashboard for PhilJS applications. Provides metrics collection, distributed tracing, error tracking, alerting, and visualization with integrations for popular observability platforms.

## Installation

```bash
npm install @philjs/dashboard
# or
pnpm add @philjs/dashboard
# or
yarn add @philjs/dashboard
```

## Features

- **Web Vitals Collection** - Automatically collect Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
- **Distributed Tracing** - OpenTelemetry-compatible tracing with W3C Trace Context propagation
- **Error Tracking** - Capture errors with stack traces, source map support, and automatic grouping
- **Alerting System** - Threshold alerts, anomaly detection, and multi-channel notifications
- **Local Storage** - IndexedDB-based persistence with retention policies
- **Remote Storage** - Batch sending with compression, retry logic, and beacon API support
- **Dashboard UI** - Web Components for real-time metrics visualization
- **Platform Integrations** - Export to Sentry, Datadog, and Grafana

## Quick Start

```typescript
import { initDashboard } from '@philjs/dashboard';

// Initialize with sensible defaults
const dashboard = await initDashboard({
  metrics: true,
  tracing: {
    serviceName: 'my-app',
    serviceVersion: '1.0.0',
    environment: 'production',
  },
  errors: {
    captureGlobalErrors: true,
    captureUnhandledRejections: true,
  },
  localStorage: true,
  alerts: true,
});

// Access individual components
const { metrics, tracing, errors, alerts } = dashboard;

// Record a custom metric
metrics.recordMetric('api.response_time', 150, 'ms', {
  endpoint: '/users',
});

// Create a traced operation
await tracing?.withSpan('fetchUser', async (span) => {
  span.setAttribute('user.id', '123');
  const response = await fetch('/api/users/123');
  return response.json();
});

// Cleanup on shutdown
await dashboard.destroy();
```

## Metrics Collection

The `MetricsCollector` class automatically collects Web Vitals, memory usage, CPU metrics, and network requests.

### Basic Usage

```typescript
import { MetricsCollector, getMetricsCollector } from '@philjs/dashboard';

// Create a new collector
const collector = new MetricsCollector({
  collectWebVitals: true,
  collectMemory: true,
  collectCPU: true,
  collectNetwork: true,
  sampleRate: 1.0,
  maxNetworkRequests: 100,
  longTaskThreshold: 50,
  onMetrics: (snapshot) => {
    console.log('Metrics updated:', snapshot);
  },
});

// Start collection
await collector.start();

// Get current snapshot
const snapshot = collector.getSnapshot();
console.log('LCP:', snapshot.webVitals.lcp);
console.log('Memory:', snapshot.memory?.heapUtilization);

// Record custom metrics
collector.recordMetric('cart.items', 3, 'count', { currency: 'USD' });

// Time an operation
const stopTimer = collector.startTimer('checkout.process');
// ... do work
stopTimer();

// Stop collection
collector.stop();
```

### Using Singleton Instance

```typescript
import { getMetricsCollector, resetMetricsCollector } from '@philjs/dashboard';

// Get or create the default collector
const collector = getMetricsCollector({
  collectWebVitals: true,
});

await collector.start();

// Reset when done
resetMetricsCollector();
```

### Measuring Functions

```typescript
import { measureAsync, measureSync } from '@philjs/dashboard';

// Measure async function
const userData = await measureAsync('fetchUser', async () => {
  const response = await fetch('/api/user');
  return response.json();
});

// Measure sync function
const result = measureSync('calculateTotal', () => {
  return items.reduce((sum, item) => sum + item.price, 0);
});
```

### Calculate Performance Score

```typescript
import { calculatePerformanceScore } from '@philjs/dashboard';

const snapshot = collector.getSnapshot();
const score = calculatePerformanceScore(snapshot.webVitals);
console.log('Performance score:', score); // 0-100
```

## Distributed Tracing

The `TracingManager` provides OpenTelemetry-compatible distributed tracing with automatic context propagation.

### Basic Usage

```typescript
import { TracingManager, initTracing, getTracingManager } from '@philjs/dashboard';

// Initialize tracing
const tracer = initTracing({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  environment: 'production',
  sampleRate: 1.0,
  enableW3CTraceContext: true,
  autoInstrument: true, // Auto-instrument fetch and XHR
  onSpanEnd: (span) => {
    console.log('Span completed:', span.name, span.duration);
  },
});

// Create a span manually
const span = tracer.startSpan('processOrder');
span.setAttribute('order.id', '12345');
span.addEvent('validation_started');

try {
  // ... process order
  span.setStatus('ok');
} catch (error) {
  span.setStatus('error', error.message);
  throw error;
} finally {
  span.end();
}
```

### Context-Aware Tracing

```typescript
// Async operations with automatic context
await tracer.withSpan('handleRequest', async (span) => {
  span.setKind('server');
  span.setAttribute('http.method', 'POST');

  // Child spans automatically inherit context
  await tracer.withSpan('validateInput', async (childSpan) => {
    childSpan.setAttribute('validation.type', 'schema');
    // ... validation logic
  });

  await tracer.withSpan('saveToDatabase', async (childSpan) => {
    childSpan.setKind('client');
    // ... database operation
  });
});

// Sync operations
const result = tracer.withSpanSync('parseConfig', (span) => {
  span.setAttribute('config.version', '2.0');
  return JSON.parse(configString);
});
```

### W3C Trace Context Propagation

```typescript
// Inject trace context into outgoing requests
const headers: Record<string, string> = {};
tracer.inject(headers);
// headers now contains 'traceparent' and optionally 'tracestate'

await fetch('/api/downstream', { headers });

// Extract trace context from incoming requests
const incomingHeaders = request.headers;
const context = tracer.extract({
  traceparent: incomingHeaders.get('traceparent'),
  tracestate: incomingHeaders.get('tracestate'),
});

// Continue the trace
const span = tracer.startSpan('handleIncoming', context);
```

### Method Decorators

```typescript
import { trace, traceSync } from '@philjs/dashboard';

class OrderService {
  @trace('createOrder', { kind: 'server' })
  async createOrder(items: Item[]): Promise<Order> {
    // Automatically traced
    return this.repository.save(items);
  }

  @traceSync('validateOrder')
  validateOrder(order: Order): boolean {
    // Automatically traced (sync)
    return order.items.length > 0;
  }
}
```

### OpenTelemetry Compatibility

```typescript
// Get OTel-compatible tracer
const otelTracer = tracer.getOTelTracer();

// Use with OTel API
const span = otelTracer.startSpan('operation');
span.setAttribute('key', 'value');
span.end();

// Get TracerProvider for SDK integration
const provider = tracer.getOTelTracerProvider();
```

## Error Tracking

The `ErrorTracker` captures errors with full stack traces, source map support, breadcrumbs, and automatic grouping.

### Basic Usage

```typescript
import { ErrorTracker, initErrorTracking, getErrorTracker } from '@philjs/dashboard';

const tracker = initErrorTracking({
  maxBreadcrumbs: 50,
  maxErrors: 100,
  sampleRate: 1.0,
  captureGlobalErrors: true,
  captureUnhandledRejections: true,
  captureConsoleErrors: false,
  inAppPatterns: [/src\//, /app\//],
  ignorePatterns: [/ResizeObserver/],
  attachSourceMaps: true,
  sourceMapUrls: {
    'https://example.com/app.js': 'https://example.com/app.js.map',
  },
  onError: (error) => {
    console.log('Error captured:', error.fingerprint);
  },
});

// Set user context
tracker.setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
});

// Set release and environment
tracker.setRelease('1.0.0');
tracker.setEnvironment('production');

// Add breadcrumbs
tracker.addBreadcrumb({
  type: 'navigation',
  category: 'navigation',
  message: 'User navigated to /dashboard',
  level: 'info',
  data: { from: '/', to: '/dashboard' },
});

// Capture an error manually
try {
  await riskyOperation();
} catch (error) {
  await tracker.captureError(error, {
    componentName: 'CheckoutForm',
    extra: { cartId: '456' },
  });
}

// Capture a message
await tracker.captureMessage('User completed checkout', 'info', {
  extra: { orderId: '789' },
});
```

### Error Groups

```typescript
// Get all error groups
const groups = tracker.getErrorGroups();

for (const group of groups) {
  console.log(`${group.name}: ${group.count} occurrences`);
  console.log(`First seen: ${new Date(group.firstSeen)}`);
  console.log(`Users affected: ${group.usersAffected}`);
}

// Get errors in a specific group
const errors = tracker.getGroupErrors(group.fingerprint);
```

### React Error Boundary Integration

```typescript
import { captureReactError } from '@philjs/dashboard';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureReactError(error, {
      componentStack: errorInfo.componentStack,
    }, 'MyComponent');
  }
}
```

### Source Map Resolution

```typescript
import { SourceMapResolver, parseStackTrace } from '@philjs/dashboard';

const resolver = new SourceMapResolver({
  'https://example.com/app.min.js': 'https://example.com/app.min.js.map',
});

const error = new Error('Something went wrong');
const frames = parseStackTrace(error, [/src\//]);

// Resolve to original source locations
const resolvedFrames = await resolver.resolveStackTrace(frames);

// Cleanup
resolver.destroy();
```

## Alerting System

The `AlertManager` provides threshold-based alerts, anomaly detection, and multi-channel notifications.

### Basic Usage

```typescript
import { AlertManager, getAlertManager, PRESET_RULES } from '@philjs/dashboard';

const alertManager = new AlertManager({
  rules: PRESET_RULES, // Use built-in rules
  evaluationInterval: 60000,
  maxAlerts: 1000,
  onAlert: (alert) => {
    console.log(`Alert: ${alert.ruleName} - ${alert.message}`);
  },
  onResolve: (alert) => {
    console.log(`Resolved: ${alert.ruleName}`);
  },
});

// Start monitoring
alertManager.start();

// Process metrics (typically called from MetricsCollector callback)
alertManager.processMetrics(metricsSnapshot);

// Process errors
alertManager.processError(capturedError);
```

### Custom Alert Rules

```typescript
// Add a threshold rule
alertManager.addRule({
  id: 'slow-api',
  name: 'Slow API Response',
  description: 'API response time exceeds 2 seconds',
  enabled: true,
  condition: {
    type: 'threshold',
    metric: 'custom',
    customMetricName: 'api.response_time',
    operator: 'gt',
    value: 2000,
  },
  severity: 'warning',
  cooldown: 300000,
  channels: ['slack', 'console'],
});

// Add an anomaly detection rule
alertManager.addRule({
  id: 'lcp-anomaly',
  name: 'LCP Anomaly',
  description: 'LCP deviates significantly from baseline',
  enabled: true,
  condition: {
    type: 'anomaly',
    metric: 'lcp',
    sensitivity: 2.5, // Standard deviations
    baselineWindow: 3600000, // 1 hour
  },
  severity: 'warning',
  cooldown: 600000,
  channels: ['webhook'],
});

// Add an error rate rule
alertManager.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate',
  enabled: true,
  condition: {
    type: 'errorRate',
    threshold: 10, // Errors per minute
    window: 60000,
  },
  severity: 'critical',
  cooldown: 60000,
  channels: ['pagerduty', 'slack'],
});

// Add an error pattern rule
alertManager.addRule({
  id: 'payment-errors',
  name: 'Payment Errors',
  enabled: true,
  condition: {
    type: 'errorPattern',
    pattern: 'payment|stripe|checkout',
    minOccurrences: 3,
    window: 300000,
  },
  severity: 'critical',
  cooldown: 60000,
  channels: ['pagerduty'],
});
```

### Notification Channels

```typescript
// Webhook channel
alertManager.addChannel({
  id: 'webhook',
  type: 'webhook',
  name: 'Custom Webhook',
  enabled: true,
  config: {
    type: 'webhook',
    url: 'https://api.example.com/alerts',
    method: 'POST',
    headers: { 'X-Custom-Header': 'value' },
    authToken: 'your-token',
  },
});

// Slack channel
alertManager.addChannel({
  id: 'slack',
  type: 'slack',
  name: 'Slack Alerts',
  enabled: true,
  config: {
    type: 'slack',
    webhookUrl: 'https://hooks.slack.com/services/...',
    channel: '#alerts',
    username: 'PhilJS Dashboard',
  },
});

// PagerDuty channel
alertManager.addChannel({
  id: 'pagerduty',
  type: 'pagerduty',
  name: 'PagerDuty',
  enabled: true,
  config: {
    type: 'pagerduty',
    routingKey: 'your-routing-key',
    severity: 'critical',
  },
});

// Console channel (for development)
alertManager.addChannel({
  id: 'console',
  type: 'console',
  name: 'Console',
  enabled: true,
  config: { type: 'console' },
});

// Custom handler
alertManager.addChannel({
  id: 'custom',
  type: 'custom',
  name: 'Custom Handler',
  enabled: true,
  config: {
    type: 'custom',
    handler: async (alert) => {
      await sendToMyService(alert);
    },
  },
});
```

### Managing Alerts

```typescript
// Get all alerts
const allAlerts = alertManager.getAlerts();

// Get active alerts only
const activeAlerts = alertManager.getActiveAlerts();

// Get alerts by status
const resolvedAlerts = alertManager.getAlerts('resolved');

// Acknowledge an alert
alertManager.acknowledgeAlert(alertId, 'john@example.com');

// Manually resolve an alert
alertManager.resolveAlert(alertId);

// Clear all alerts
alertManager.clearAlerts();
```

### Anomaly Detection

```typescript
import { AnomalyDetector } from '@philjs/dashboard';

const detector = new AnomalyDetector(1000); // Max 1000 data points

// Add data points
detector.addDataPoint('response_time', 150);
detector.addDataPoint('response_time', 145);
detector.addDataPoint('response_time', 160);
// ... add more data points

// Check for anomaly (2.5 standard deviations)
const isAnomaly = detector.isAnomaly('response_time', 500, 2.5);

// Get baseline statistics
const baseline = detector.getBaseline('response_time');
if (baseline) {
  console.log(`Mean: ${baseline.mean}, StdDev: ${baseline.stdDev}`);
}
```

## Local Storage

The `LocalStorageManager` provides IndexedDB-based persistence with automatic cleanup and export functionality.

### Basic Usage

```typescript
import { LocalStorageManager, getLocalStorage } from '@philjs/dashboard';

const storage = new LocalStorageManager({
  dbName: 'philjs-dashboard',
  dbVersion: 1,
  retention: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxRecords: 10000,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },
  autoCleanup: true,
});

await storage.init();

// Store metrics
const metricsId = await storage.storeMetrics(metricsSnapshot);

// Store spans
await storage.storeSpan(span);
await storage.storeSpans(spans);

// Store errors
await storage.storeError(capturedError);

// Query by time range
const metrics = await storage.getMetrics(startTime, endTime);
const spans = await storage.getSpans(startTime, endTime);
const errors = await storage.getErrors(startTime, endTime);

// Query by specific criteria
const sessionMetrics = await storage.getMetricsBySession(sessionId);
const traceSpans = await storage.getSpansByTrace(traceId);
const groupErrors = await storage.getErrorsByFingerprint(fingerprint);

// Get storage statistics
const stats = await storage.getStats();
console.log(`Metrics: ${stats.metricsCount}`);
console.log(`Spans: ${stats.spansCount}`);
console.log(`Errors: ${stats.errorsCount}`);

// Manual cleanup
const cleaned = await storage.cleanup();
console.log(`Deleted: ${cleaned.metricsDeleted} metrics`);

// Close connection
storage.close();
```

### Export and Import

```typescript
// Export data as JSON
const exportedData = await storage.export({
  startTime: Date.now() - 86400000, // Last 24 hours
  endTime: Date.now(),
  includeMetrics: true,
  includeSpans: true,
  includeErrors: true,
  format: 'json',
});

// Export as CSV
const csvData = await storage.export({ format: 'csv' });

// Export to file (for download)
const blob = await storage.exportToFile({ format: 'json' });
const url = URL.createObjectURL(blob);

// Import data
const imported = await storage.import(exportedData);
console.log(`Imported: ${imported.metricsImported} metrics`);

// Clear all data
await storage.clearAll();
```

### Metadata Storage

```typescript
// Store arbitrary metadata
await storage.setMetadata('last_sync', Date.now());
await storage.setMetadata('config', { theme: 'dark' });

// Retrieve metadata
const lastSync = await storage.getMetadata<number>('last_sync');
const config = await storage.getMetadata<{ theme: string }>('config');

// Delete metadata
await storage.deleteMetadata('last_sync');
```

## Remote Storage

The `RemoteStorageManager` sends data to a backend API with batching, compression, and retry logic.

### Basic Usage

```typescript
import { RemoteStorageManager, initRemoteStorage } from '@philjs/dashboard';

const remote = new RemoteStorageManager({
  endpoint: 'https://api.example.com/telemetry',
  apiKey: 'your-api-key',
  batchSize: 50,
  flushInterval: 10000,
  compression: true,
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  timeout: 30000,
  environment: 'production',
  release: '1.0.0',
  onSuccess: (batchId, count) => {
    console.log(`Sent batch ${batchId}: ${count} items`);
  },
  onError: (error, batch) => {
    console.error(`Failed to send batch:`, error);
  },
});

// Send data
remote.sendMetrics(metricsSnapshot);
remote.sendSpan(span);
remote.sendSpans(spans);
remote.sendError(capturedError);

// Force flush
await remote.flush();

// Get queue status
const status = remote.getStatus();
console.log(`Queue: ${status.queueSize}, Retry: ${status.retryQueueSize}`);

// Update session/release
remote.setSessionId('new-session-id');
remote.setRelease('1.1.0');

// Cleanup
await remote.destroy();
```

### Beacon API for Page Unload

```typescript
import { BeaconSender } from '@philjs/dashboard';

const beacon = new BeaconSender(
  'https://api.example.com/telemetry/beacon',
  'your-api-key'
);

// Queue data for beacon sending on page unload
beacon.queue('metrics', metricsSnapshot);
beacon.queue('errors', capturedError);

// Data is automatically sent when page becomes hidden or unloads
```

### Combined Storage Manager

```typescript
import { CombinedStorageManager } from '@philjs/dashboard';

const storage = new CombinedStorageManager({
  local: { enabled: true },
  remote: {
    endpoint: 'https://api.example.com/telemetry',
    apiKey: 'your-api-key',
  },
  beacon: {
    enabled: true,
    endpoint: 'https://api.example.com/telemetry/beacon',
  },
});

// Data is sent to all enabled backends
storage.sendMetrics(metricsSnapshot);
storage.sendSpan(span);
storage.sendError(capturedError);

await storage.destroy();
```

## Dashboard UI Components

The package includes Web Components for building monitoring dashboards.

### PhilDashboard Component

```typescript
import { PhilDashboard } from '@philjs/dashboard';

// The component is auto-registered as <phil-dashboard>
const dashboard = document.querySelector('phil-dashboard') as PhilDashboard;

dashboard.configure({
  fetchData: async (timeRange, filters) => {
    const response = await fetch(`/api/dashboard?start=${timeRange.start}&end=${timeRange.end}`);
    return response.json();
  },
  refreshInterval: 30000,
  defaultTimeRange: '1h',
  theme: 'dark',
  tabs: [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'traces', label: 'Traces' },
    { id: 'errors', label: 'Errors' },
  ],
  onError: (error) => console.error('Dashboard error:', error),
});
```

```html
<phil-dashboard theme="dark">
  <div slot="header-content">
    <button>Custom Button</button>
  </div>
  <div slot="metrics">
    <!-- Custom metrics content -->
  </div>
  <div slot="traces">
    <!-- Custom traces content -->
  </div>
</phil-dashboard>
```

### PhilMetricCard Component

```html
<phil-metric-card
  title="LCP"
  value="1.2s"
  subtitle="Largest Contentful Paint"
  trend="down"
  trend-value="-15%"
  color="#22c55e"
></phil-metric-card>
```

### PhilChartContainer Component

```html
<phil-chart-container title="Performance Over Time" height="400">
  <!-- Insert your preferred charting library here -->
  <canvas id="performance-chart"></canvas>
</phil-chart-container>
```

## Platform Integrations

### Sentry Integration

```typescript
import { SentryExporter, createSentryExporter } from '@philjs/dashboard';

const sentry = createSentryExporter({
  dsn: 'https://key@sentry.io/project',
  environment: 'production',
  release: '1.0.0',
  errorSampleRate: 1.0,
  tracesSampleRate: 0.1,
  enablePerformance: true,
  tags: { app: 'my-app' },
  beforeSend: (event) => {
    // Filter or modify events
    return event;
  },
});

// Export errors
await sentry.exportError(capturedError);

// Export traces
await sentry.exportTrace(spans);

// Export Web Vitals
await sentry.exportWebVitals(webVitals, traceContext);

// Capture a message
await sentry.captureMessage('Deployment completed', 'info');

// Cleanup
sentry.destroy();
```

### Datadog Integration

```typescript
import { DatadogExporter, createDatadogExporter } from '@philjs/dashboard';

const datadog = createDatadogExporter({
  apiKey: 'your-datadog-api-key',
  site: 'datadoghq.com', // or datadoghq.eu
  service: 'my-app',
  env: 'production',
  version: '1.0.0',
  tags: ['team:frontend'],
  enableRum: true,
  enableApm: true,
  enableLogs: true,
  sampleRate: 1.0,
});

// Export metrics
datadog.exportWebVitals(webVitals);
datadog.exportCustomMetrics(customMetrics);
datadog.exportMetricsSnapshot(metricsSnapshot);

// Export traces
datadog.exportTrace(spans);

// Export errors as logs
datadog.exportError(capturedError);

// Log messages
datadog.log('User signed in', 'info', { userId: '123' });

// RUM events
datadog.trackPageView('Dashboard', '/dashboard');
datadog.trackAction('button_click', 'click', { buttonId: 'submit' });

// Cleanup
await datadog.destroy();
```

### Grafana Integration

```typescript
import {
  GrafanaExporter,
  createGrafanaExporter,
  generateWebVitalsDashboard
} from '@philjs/dashboard';

const grafana = createGrafanaExporter({
  prometheusUrl: 'https://prometheus.example.com/api/v1/write',
  lokiUrl: 'https://loki.example.com',
  tempoUrl: 'https://tempo.example.com',
  apiKey: 'your-grafana-cloud-api-key',
  // Or basic auth
  username: 'user',
  password: 'password',
  job: 'my-app',
  instance: 'browser',
  labels: { env: 'production' },
});

// Export metrics to Prometheus
grafana.exportWebVitals(webVitals);
grafana.exportCustomMetrics(customMetrics);
grafana.exportMetricsSnapshot(metricsSnapshot);

// Direct metric methods
grafana.gauge('active_users', 150, { region: 'us-east' });
grafana.counter('page_views', 1, { page: '/home' });
grafana.histogram('api_latency', 250, [50, 100, 250, 500, 1000]);

// Export logs to Loki
grafana.log('User action', 'info', { action: 'login' });
grafana.logError(new Error('Failed to load'), { page: '/dashboard' });

// Export traces to Tempo
grafana.exportTrace(spans);

// Generate a Grafana dashboard JSON
const dashboardJson = generateWebVitalsDashboard('my-app');
// Import this JSON into Grafana to create a dashboard

// Cleanup
await grafana.destroy();
```

## Types Reference

### Metrics Types

```typescript
interface WebVitalsMetrics {
  lcp: number | null;   // Largest Contentful Paint (ms)
  fid: number | null;   // First Input Delay (ms)
  cls: number | null;   // Cumulative Layout Shift
  fcp: number | null;   // First Contentful Paint (ms)
  ttfb: number | null;  // Time to First Byte (ms)
  inp: number | null;   // Interaction to Next Paint (ms)
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  heapUtilization: number;  // Percentage
}

interface CPUMetrics {
  hardwareConcurrency: number;
  longTasks: LongTaskEntry[];
  totalBlockingTime: number;
}

interface NetworkRequest {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  transferSize: number;
  status: number;
  initiatorType: string;
  nextHopProtocol: string;
}

interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface MetricsSnapshot {
  timestamp: number;
  sessionId: string;
  pageUrl: string;
  webVitals: WebVitalsMetrics;
  memory: MemoryMetrics | null;
  cpu: CPUMetrics;
  networkRequests: NetworkRequest[];
  customMetrics: CustomMetric[];
}
```

### Tracing Types

```typescript
type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';
type SpanStatusCode = 'unset' | 'ok' | 'error';

interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanLink[];
  status: { code: SpanStatusCode; message?: string };
  resource: {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
  };
}

interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}
```

### Error Types

```typescript
interface StackFrame {
  functionName: string | null;
  fileName: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  context?: { pre: string[]; line: string; post: string[] };
  inApp: boolean;
}

interface ParsedError {
  name: string;
  message: string;
  stack: StackFrame[];
  rawStack: string;
  originalError: Error;
}

interface CapturedError {
  id: string;
  fingerprint: string;
  timestamp: number;
  error: ParsedError;
  url: string;
  userAgent: string;
  breadcrumbs: Breadcrumb[];
  context: ErrorContext;
  tags: Record<string, string>;
  user?: UserInfo;
  release?: string;
  environment?: string;
  traceId?: string;
  spanId?: string;
}

interface Breadcrumb {
  type: 'navigation' | 'click' | 'console' | 'xhr' | 'fetch' | 'dom' | 'custom';
  category: string;
  message: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

interface ErrorGroup {
  fingerprint: string;
  name: string;
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  errorIds: string[];
  usersAffected: number;
}
```

### Alert Types

```typescript
type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertStatus = 'active' | 'resolved' | 'acknowledged';

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  triggeredAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  value: number;
  threshold?: number;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  condition: AlertCondition;
  severity: AlertSeverity;
  cooldown: number;
  tags?: Record<string, string>;
  channels: string[];
}

type AlertCondition =
  | ThresholdCondition
  | AnomalyCondition
  | ErrorRateCondition
  | ErrorPatternCondition;
```

## API Reference

### Metrics

| Export | Type | Description |
|--------|------|-------------|
| `MetricsCollector` | Class | Main metrics collection class |
| `getMetricsCollector` | Function | Get singleton collector instance |
| `resetMetricsCollector` | Function | Reset singleton instance |
| `measureAsync` | Function | Measure async function execution time |
| `measureSync` | Function | Measure sync function execution time |
| `calculatePerformanceScore` | Function | Calculate 0-100 score from Web Vitals |

### Tracing

| Export | Type | Description |
|--------|------|-------------|
| `TracingManager` | Class | Main tracing manager class |
| `SpanBuilder` | Class | Builder for creating spans |
| `getTracingManager` | Function | Get singleton tracer instance |
| `initTracing` | Function | Initialize tracing with config |
| `resetTracing` | Function | Reset tracing instance |
| `trace` | Decorator | Trace async methods |
| `traceSync` | Decorator | Trace sync methods |

### Errors

| Export | Type | Description |
|--------|------|-------------|
| `ErrorTracker` | Class | Main error tracking class |
| `SourceMapResolver` | Class | Resolve source maps for stack traces |
| `getErrorTracker` | Function | Get singleton tracker instance |
| `initErrorTracking` | Function | Initialize error tracking |
| `resetErrorTracking` | Function | Reset error tracker |
| `parseStackTrace` | Function | Parse error stack trace |
| `parseError` | Function | Parse error into structured format |
| `generateErrorFingerprint` | Function | Generate grouping fingerprint |
| `captureReactError` | Function | Capture React error boundary errors |

### Alerts

| Export | Type | Description |
|--------|------|-------------|
| `AlertManager` | Class | Main alert management class |
| `AnomalyDetector` | Class | Statistical anomaly detection |
| `getAlertManager` | Function | Get singleton alert manager |
| `resetAlertManager` | Function | Reset alert manager |
| `PRESET_RULES` | Constant | Built-in alert rules for Web Vitals |

### Storage

| Export | Type | Description |
|--------|------|-------------|
| `LocalStorageManager` | Class | IndexedDB storage manager |
| `getLocalStorage` | Function | Get singleton local storage |
| `resetLocalStorage` | Function | Reset local storage |
| `RemoteStorageManager` | Class | Remote API storage manager |
| `BeaconSender` | Class | Beacon API for page unload |
| `CombinedStorageManager` | Class | Combined local/remote storage |
| `getRemoteStorage` | Function | Get singleton remote storage |
| `initRemoteStorage` | Function | Initialize remote storage |
| `resetRemoteStorage` | Function | Reset remote storage |

### Integrations

| Export | Type | Description |
|--------|------|-------------|
| `SentryExporter` | Class | Export to Sentry |
| `createSentryExporter` | Function | Factory for Sentry exporter |
| `DatadogExporter` | Class | Export to Datadog |
| `createDatadogExporter` | Function | Factory for Datadog exporter |
| `GrafanaExporter` | Class | Export to Grafana stack |
| `createGrafanaExporter` | Function | Factory for Grafana exporter |
| `generateWebVitalsDashboard` | Function | Generate Grafana dashboard JSON |

### UI Components

| Export | Type | Description |
|--------|------|-------------|
| `PhilDashboard` | Web Component | Main dashboard component |
| `PhilMetricCard` | Web Component | Metric display card |
| `PhilChartContainer` | Web Component | Chart container component |

### Convenience

| Export | Type | Description |
|--------|------|-------------|
| `initDashboard` | Function | Initialize complete dashboard |
| `VERSION` | Constant | Package version |
