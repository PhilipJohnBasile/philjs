/**
 * PhilJS Dashboard - Performance Monitoring Package
 *
 * A comprehensive performance monitoring solution for PhilJS applications.
 * Provides metrics collection, distributed tracing, error tracking, and visualization.
 *
 * @packageDocumentation
 */
export { MetricsCollector, getMetricsCollector, resetMetricsCollector, measureAsync, measureSync, calculatePerformanceScore, type MetricsCollectorConfig, type MetricsSnapshot, type WebVitalsMetrics, type MemoryMetrics, type CPUMetrics, type LongTaskEntry, type LongTaskAttribution, type NetworkRequest, type CustomMetric, } from './collector/metrics.js';
export { TracingManager, SpanBuilder, getTracingManager, initTracing, resetTracing, trace, traceSync, type TracingConfig, type Span, type SpanKind, type SpanStatusCode, type SpanAttributes, type SpanEvent, type SpanLink, type TraceContext, } from './collector/tracing.js';
export { ErrorTracker, SourceMapResolver, getErrorTracker, initErrorTracking, resetErrorTracking, parseStackTrace, parseError, generateErrorFingerprint, captureReactError, type ErrorTrackerConfig, type CapturedError, type ParsedError, type StackFrame, type Breadcrumb, type ErrorContext, type UserInfo, type ErrorGroup, type ErrorBoundaryInfo, } from './collector/errors.js';
export { LocalStorageManager, getLocalStorage, resetLocalStorage, type LocalStorageConfig, type RetentionPolicy, type ExportOptions, type ExportedData, type StoredMetrics, type StoredSpan, type StoredError, type StorageMetadata, type DashboardDBSchema, } from './storage/local.js';
export { RemoteStorageManager, BeaconSender, CombinedStorageManager, getRemoteStorage, initRemoteStorage, resetRemoteStorage, type RemoteStorageConfig, type CombinedStorageConfig, type BatchPayload, type BatchItem, type DataType, } from './storage/remote.js';
export { AlertManager, AnomalyDetector, getAlertManager, resetAlertManager, PRESET_RULES, type AlertManagerConfig, type AlertRule, type Alert, type AlertSeverity, type AlertStatus, type AlertCondition, type ThresholdCondition, type AnomalyCondition, type ErrorRateCondition, type ErrorPatternCondition, type ComparisonOperator, type MetricType, type NotificationChannel, type NotificationConfig, type WebhookConfig, type SlackConfig, type PagerDutyConfig, type EmailConfig, type ConsoleConfig, type CustomConfig, } from './alerts/index.js';
export { SentryExporter, createSentryExporter, type SentryConfig, type SentryEvent, type SentryTransaction, type SentrySpan, type SentryStackFrame, type SentryBreadcrumb, } from './integrations/sentry.js';
export { DatadogExporter, createDatadogExporter, type DatadogConfig, type DatadogMetric, type DatadogTrace, type DatadogLog, type DatadogRumEvent, } from './integrations/datadog.js';
export { GrafanaExporter, createGrafanaExporter, generateWebVitalsDashboard, type GrafanaConfig, type GrafanaDashboard, type GrafanaPanel, type PrometheusTimeSeries, type PrometheusWriteRequest, type LokiLogEntry, type LokiPushRequest, type TempoSpan, } from './integrations/grafana.js';
export { PhilDashboard, PhilMetricCard, PhilChartContainer, type DashboardConfig, type DashboardData, type DashboardFilter, type DashboardTab, type TimeRange, type TimeRangeValue, } from './ui/Dashboard.js';
import { MetricsCollector } from './collector/metrics.js';
import { TracingManager } from './collector/tracing.js';
import { ErrorTracker } from './collector/errors.js';
import { LocalStorageManager } from './storage/local.js';
import { RemoteStorageManager } from './storage/remote.js';
import { AlertManager } from './alerts/index.js';
export interface DashboardInitConfig {
    /** Enable metrics collection */
    metrics?: boolean;
    /** Tracing configuration */
    tracing?: {
        serviceName: string;
        serviceVersion?: string;
        environment?: string;
        sampleRate?: number;
    };
    /** Error tracking configuration */
    errors?: {
        captureGlobalErrors?: boolean;
        captureUnhandledRejections?: boolean;
        sampleRate?: number;
    };
    /** Local storage configuration */
    localStorage?: boolean;
    /** Remote storage endpoint */
    remoteStorage?: {
        endpoint: string;
        apiKey?: string;
    };
    /** Enable alerting */
    alerts?: boolean;
}
export interface DashboardInstance {
    metrics: MetricsCollector;
    tracing: TracingManager | null;
    errors: ErrorTracker;
    localStorage: LocalStorageManager | null;
    remoteStorage: RemoteStorageManager | null;
    alerts: AlertManager | null;
    destroy: () => Promise<void>;
}
/**
 * Initialize the complete dashboard with sensible defaults
 */
export declare function initDashboard(config: DashboardInitConfig): Promise<DashboardInstance>;
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map