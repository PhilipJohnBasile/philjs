# @philjs/dashboard

Dashboard components and layouts for building admin panels and analytics interfaces. Provides a flexible grid system with resizable and draggable widgets.

## Installation

```bash
npm install @philjs/dashboard
# or
yarn add @philjs/dashboard
# or
pnpm add @philjs/dashboard
```

## Basic Usage

```tsx
import { Dashboard, Widget, DashboardGrid } from '@philjs/dashboard';

function AdminPanel() {
  const layout = [
    { id: 'stats', x: 0, y: 0, w: 6, h: 2 },
    { id: 'chart', x: 6, y: 0, w: 6, h: 4 },
    { id: 'table', x: 0, y: 2, w: 6, h: 4 },
  ];

  return (
    <Dashboard layout={layout} onLayoutChange={console.log}>
      <Widget id="stats" title="Statistics">
        <StatsCard />
      </Widget>
      <Widget id="chart" title="Revenue">
        <RevenueChart />
      </Widget>
      <Widget id="table" title="Recent Orders">
        <OrdersTable />
      </Widget>
    </Dashboard>
  );
}
```

## Features

- **Grid Layout** - 12-column responsive grid system
- **Draggable Widgets** - Rearrange dashboard elements via drag-and-drop
- **Resizable Widgets** - Adjust widget dimensions interactively
- **Layout Persistence** - Save and restore user layouts
- **Widget Library** - Pre-built widgets for common use cases
- **Responsive Breakpoints** - Different layouts for desktop/tablet/mobile
- **Fullscreen Mode** - Expand widgets to fullscreen view
- **Widget Actions** - Refresh, settings, and custom actions
- **Theming** - Consistent styling across all widgets
- **Loading States** - Built-in skeleton loading for widgets
- **Error Boundaries** - Graceful error handling per widget

## Components

| Component | Description |
|-----------|-------------|
| `Dashboard` | Main container with layout management |
| `Widget` | Individual dashboard card/panel |
| `DashboardGrid` | Grid layout engine |
| `WidgetHeader` | Widget title and action buttons |
| `StatCard` | KPI/metric display widget |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./collectors
- Source files: packages/philjs-dashboard/src/index.ts

### Public API
- Direct exports: DashboardInitConfig, DashboardInstance, VERSION, initDashboard
- Re-exported names: // Errors
  ErrorTracker, // Local Storage
  LocalStorageManager, // Metrics
  MetricsCollector, // Remote Storage
  RemoteStorageManager, // Tracing
  TracingManager, Alert, AlertCondition, AlertManager, AlertManagerConfig, AlertRule, AlertSeverity, AlertStatus, AnomalyCondition, AnomalyDetector, BatchItem, BatchPayload, BeaconSender, Breadcrumb, CPUMetrics, CapturedError, CombinedStorageConfig, CombinedStorageManager, ComparisonOperator, ConsoleConfig, CustomConfig, CustomMetric, DashboardConfig, DashboardDBSchema, DashboardData, DashboardFilter, DashboardTab, DataType, DatadogConfig, DatadogExporter, DatadogLog, DatadogMetric, DatadogRumEvent, DatadogTrace, EmailConfig, ErrorBoundaryInfo, ErrorContext, ErrorGroup, ErrorPatternCondition, ErrorRateCondition, ErrorTrackerConfig, ExportOptions, ExportedData, GrafanaConfig, GrafanaDashboard, GrafanaExporter, GrafanaPanel, LocalStorageConfig, LokiLogEntry, LokiPushRequest, LongTaskAttribution, LongTaskEntry, MemoryMetrics, MetricType, MetricsCollectorConfig, MetricsSnapshot, NetworkRequest, NotificationChannel, NotificationConfig, PRESET_RULES, PagerDutyConfig, ParsedError, PhilChartContainer, PhilDashboard, PhilMetricCard, PrometheusTimeSeries, PrometheusWriteRequest, RemoteStorageConfig, RetentionPolicy, SentryBreadcrumb, SentryConfig, SentryEvent, SentryExporter, SentrySpan, SentryStackFrame, SentryTransaction, SlackConfig, SourceMapResolver, Span, SpanAttributes, SpanBuilder, SpanEvent, SpanKind, SpanLink, SpanStatusCode, StackFrame, StorageMetadata, StoredError, StoredMetrics, StoredSpan, TempoSpan, ThresholdCondition, TimeRange, TimeRangeValue, TraceContext, TracingConfig, UserInfo, WebVitalsMetrics, WebhookConfig, calculatePerformanceScore, captureReactError, createDatadogExporter, createGrafanaExporter, createSentryExporter, generateErrorFingerprint, generateWebVitalsDashboard, getAlertManager, getErrorTracker, getLocalStorage, getMetricsCollector, getRemoteStorage, getTracingManager, initErrorTracking, initRemoteStorage, initTracing, measureAsync, measureSync, parseError, parseStackTrace, resetAlertManager, resetErrorTracking, resetLocalStorage, resetMetricsCollector, resetRemoteStorage, resetTracing, trace, traceSync
- Re-exported modules: ./alerts/index.js, ./collector/errors.js, ./collector/metrics.js, ./collector/tracing.js, ./integrations/datadog.js, ./integrations/grafana.js, ./integrations/sentry.js, ./storage/local.js, ./storage/remote.js, ./ui/Dashboard.js
<!-- API_SNAPSHOT_END -->

## License

MIT
