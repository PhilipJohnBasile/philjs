/**
 * PhilJS Dashboard - Performance Monitoring Package
 *
 * A comprehensive performance monitoring solution for PhilJS applications.
 * Provides metrics collection, distributed tracing, error tracking, and visualization.
 *
 * @packageDocumentation
 */

// ============================================================================
// Collectors
// ============================================================================

export {
  // Metrics
  MetricsCollector,
  getMetricsCollector,
  resetMetricsCollector,
  measureAsync,
  measureSync,
  calculatePerformanceScore,
  type MetricsCollectorConfig,
  type MetricsSnapshot,
  type WebVitalsMetrics,
  type MemoryMetrics,
  type CPUMetrics,
  type LongTaskEntry,
  type LongTaskAttribution,
  type NetworkRequest,
  type CustomMetric,
} from './collector/metrics';

export {
  // Tracing
  TracingManager,
  SpanBuilder,
  getTracingManager,
  initTracing,
  resetTracing,
  trace,
  traceSync,
  type TracingConfig,
  type Span,
  type SpanKind,
  type SpanStatusCode,
  type SpanAttributes,
  type SpanEvent,
  type SpanLink,
  type TraceContext,
} from './collector/tracing';

export {
  // Errors
  ErrorTracker,
  SourceMapResolver,
  getErrorTracker,
  initErrorTracking,
  resetErrorTracking,
  parseStackTrace,
  parseError,
  generateErrorFingerprint,
  captureReactError,
  type ErrorTrackerConfig,
  type CapturedError,
  type ParsedError,
  type StackFrame,
  type Breadcrumb,
  type ErrorContext,
  type UserInfo,
  type ErrorGroup,
  type ErrorBoundaryInfo,
} from './collector/errors';

// ============================================================================
// Storage
// ============================================================================

export {
  // Local Storage
  LocalStorageManager,
  getLocalStorage,
  resetLocalStorage,
  type LocalStorageConfig,
  type RetentionPolicy,
  type ExportOptions,
  type ExportedData,
  type StoredMetrics,
  type StoredSpan,
  type StoredError,
  type StorageMetadata,
  type DashboardDBSchema,
} from './storage/local';

export {
  // Remote Storage
  RemoteStorageManager,
  BeaconSender,
  CombinedStorageManager,
  getRemoteStorage,
  initRemoteStorage,
  resetRemoteStorage,
  type RemoteStorageConfig,
  type CombinedStorageConfig,
  type BatchPayload,
  type BatchItem,
  type DataType,
} from './storage/remote';

// ============================================================================
// Alerts
// ============================================================================

export {
  AlertManager,
  AnomalyDetector,
  getAlertManager,
  resetAlertManager,
  PRESET_RULES,
  type AlertManagerConfig,
  type AlertRule,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
  type AlertCondition,
  type ThresholdCondition,
  type AnomalyCondition,
  type ErrorRateCondition,
  type ErrorPatternCondition,
  type ComparisonOperator,
  type MetricType,
  type NotificationChannel,
  type NotificationConfig,
  type WebhookConfig,
  type SlackConfig,
  type PagerDutyConfig,
  type EmailConfig,
  type ConsoleConfig,
  type CustomConfig,
} from './alerts';

// ============================================================================
// Integrations
// ============================================================================

export {
  SentryExporter,
  createSentryExporter,
  type SentryConfig,
  type SentryEvent,
  type SentryTransaction,
  type SentrySpan,
  type SentryStackFrame,
  type SentryBreadcrumb,
} from './integrations/sentry';

export {
  DatadogExporter,
  createDatadogExporter,
  type DatadogConfig,
  type DatadogMetric,
  type DatadogTrace,
  type DatadogLog,
  type DatadogRumEvent,
} from './integrations/datadog';

export {
  GrafanaExporter,
  createGrafanaExporter,
  generateWebVitalsDashboard,
  type GrafanaConfig,
  type GrafanaDashboard,
  type GrafanaPanel,
  type PrometheusTimeSeries,
  type PrometheusWriteRequest,
  type LokiLogEntry,
  type LokiPushRequest,
  type TempoSpan,
} from './integrations/grafana';

// ============================================================================
// UI Components
// ============================================================================

export {
  Dashboard,
  useDashboard,
  MetricCard,
  ChartContainer,
  TimeRangeSelector,
  RefreshButton,
  OverviewCards,
  type DashboardProps,
  type DashboardContextValue,
  type DashboardData,
  type DashboardFilter,
  type DashboardTab,
  type TimeRange,
  type TimeRangeValue,
  type MetricCardProps,
  type ChartContainerProps,
} from './ui/Dashboard';

export {
  MetricsPanel,
  WebVitalCard,
  WebVitalsHistory,
  MemorySection,
  NetworkSection,
  CustomMetricsSection,
  type MetricsPanelProps,
  type WebVitalThreshold,
  type WebVitalStatus,
} from './ui/MetricsPanel';

export {
  TracesPanel,
  TraceCard,
  TraceTimeline,
  SpanDetail,
  SpanKindBadge,
  StatusBadge,
  groupSpansByTrace,
  type TracesPanelProps,
  type TraceGroup,
} from './ui/TracesPanel';

export {
  ErrorsPanel,
  ErrorCard,
  ErrorGroupCard,
  ErrorDetail,
  StackTraceView,
  BreadcrumbsView,
  type ErrorsPanelProps,
  type ErrorSeverity,
} from './ui/ErrorsPanel';

export {
  PerformanceScore,
  CompactScore,
  ScoreHistory,
  CircularProgress,
  TrendIndicator,
  MetricBreakdown,
  getScoreCategory,
  SCORE_THRESHOLDS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type PerformanceScoreProps,
  type CompactScoreProps,
  type ScoreHistoryProps,
  type ScoreCategory,
} from './ui/PerformanceScore';

// ============================================================================
// React Hooks
// ============================================================================

export {
  // Context & Provider
  MetricsProvider,
  useMetricsContext,
  type MetricsProviderProps,
  type MetricsContextValue,

  // Hooks
  useWebVitals,
  usePerformanceObserver,
  useErrorBoundary,
  useMeasure,
  useRenderCount,
  useNetworkStatus,
  useIdleCallback,

  // Types
  type UseWebVitalsOptions,
  type WebVitalsState,
  type PerformanceObserverOptions,
  type PerformanceEntryType,
  type PerformanceEntries,
  type UseErrorBoundaryOptions,
  type ErrorBoundaryState,
  type ErrorBoundaryFallbackProps,
  type UseMeasureResult,
  type NetworkStatus,
} from './hooks/useMetrics';

// ============================================================================
// Convenience Functions
// ============================================================================

import { MetricsCollector } from './collector/metrics';
import { TracingManager } from './collector/tracing';
import { ErrorTracker } from './collector/errors';
import { LocalStorageManager } from './storage/local';
import { RemoteStorageManager } from './storage/remote';
import { AlertManager, PRESET_RULES } from './alerts';

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
export async function initDashboard(
  config: DashboardInitConfig
): Promise<DashboardInstance> {
  // Initialize metrics collector
  const metrics = new MetricsCollector({
    collectWebVitals: config.metrics !== false,
    collectMemory: config.metrics !== false,
    collectCPU: config.metrics !== false,
    collectNetwork: config.metrics !== false,
  });

  if (config.metrics !== false) {
    await metrics.start();
  }

  // Initialize tracing
  let tracing: TracingManager | null = null;
  if (config.tracing) {
    tracing = new TracingManager({
      serviceName: config.tracing.serviceName,
      serviceVersion: config.tracing.serviceVersion,
      environment: config.tracing.environment,
      sampleRate: config.tracing.sampleRate,
    });
  }

  // Initialize error tracking
  const errors = new ErrorTracker({
    captureGlobalErrors: config.errors?.captureGlobalErrors ?? true,
    captureUnhandledRejections: config.errors?.captureUnhandledRejections ?? true,
    sampleRate: config.errors?.sampleRate ?? 1,
  });

  // Initialize local storage
  let localStorage: LocalStorageManager | null = null;
  if (config.localStorage !== false) {
    localStorage = new LocalStorageManager();
    await localStorage.init();
  }

  // Initialize remote storage
  let remoteStorage: RemoteStorageManager | null = null;
  if (config.remoteStorage) {
    remoteStorage = new RemoteStorageManager({
      endpoint: config.remoteStorage.endpoint,
      apiKey: config.remoteStorage.apiKey,
    });
  }

  // Initialize alerts
  let alerts: AlertManager | null = null;
  if (config.alerts !== false) {
    alerts = new AlertManager({
      rules: PRESET_RULES,
    });
    alerts.start();
  }

  // Wire up integrations
  if (remoteStorage) {
    // Connect metrics to remote storage
    metrics.recordMetric = ((original) => {
      return function (this: MetricsCollector, ...args: Parameters<MetricsCollector['recordMetric']>) {
        original.apply(this, args);
        const snapshot = this.getSnapshot();
        remoteStorage!.sendMetrics(snapshot);

        if (alerts) {
          alerts.processMetrics(snapshot);
        }

        if (localStorage) {
          localStorage.storeMetrics(snapshot);
        }
      };
    })(metrics.recordMetric.bind(metrics));
  }

  return {
    metrics,
    tracing,
    errors,
    localStorage,
    remoteStorage,
    alerts,
    destroy: async () => {
      metrics.stop();
      errors.destroy();
      localStorage?.close();
      await remoteStorage?.destroy();
      alerts?.destroy();
    },
  };
}

// ============================================================================
// Version
// ============================================================================

export const VERSION = '0.1.0';
