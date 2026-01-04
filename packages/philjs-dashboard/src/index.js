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
MetricsCollector, getMetricsCollector, resetMetricsCollector, measureAsync, measureSync, calculatePerformanceScore, } from './collector/metrics.js';
export { 
// Tracing
TracingManager, SpanBuilder, getTracingManager, initTracing, resetTracing, trace, traceSync, } from './collector/tracing.js';
export { 
// Errors
ErrorTracker, SourceMapResolver, getErrorTracker, initErrorTracking, resetErrorTracking, parseStackTrace, parseError, generateErrorFingerprint, captureReactError, } from './collector/errors.js';
// ============================================================================
// Storage
// ============================================================================
export { 
// Local Storage
LocalStorageManager, getLocalStorage, resetLocalStorage, } from './storage/local.js';
export { 
// Remote Storage
RemoteStorageManager, BeaconSender, CombinedStorageManager, getRemoteStorage, initRemoteStorage, resetRemoteStorage, } from './storage/remote.js';
// ============================================================================
// Alerts
// ============================================================================
export { AlertManager, AnomalyDetector, getAlertManager, resetAlertManager, PRESET_RULES, } from './alerts/index.js';
// ============================================================================
// Integrations
// ============================================================================
export { SentryExporter, createSentryExporter, } from './integrations/sentry.js';
export { DatadogExporter, createDatadogExporter, } from './integrations/datadog.js';
export { GrafanaExporter, createGrafanaExporter, generateWebVitalsDashboard, } from './integrations/grafana.js';
// ============================================================================
// UI Components
// ============================================================================
export { PhilDashboard, PhilMetricCard, PhilChartContainer, } from './ui/Dashboard.js';
// ============================================================================
// Convenience Functions
// ============================================================================
import { MetricsCollector } from './collector/metrics.js';
import { TracingManager } from './collector/tracing.js';
import { ErrorTracker } from './collector/errors.js';
import { LocalStorageManager } from './storage/local.js';
import { RemoteStorageManager } from './storage/remote.js';
import { AlertManager, PRESET_RULES } from './alerts/index.js';
/**
 * Initialize the complete dashboard with sensible defaults
 */
export async function initDashboard(config) {
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
    let tracing = null;
    if (config.tracing) {
        tracing = new TracingManager({
            serviceName: config.tracing.serviceName,
            ...(config.tracing.serviceVersion !== undefined && { serviceVersion: config.tracing.serviceVersion }),
            ...(config.tracing.environment !== undefined && { environment: config.tracing.environment }),
            ...(config.tracing.sampleRate !== undefined && { sampleRate: config.tracing.sampleRate }),
        });
    }
    // Initialize error tracking
    const errors = new ErrorTracker({
        captureGlobalErrors: config.errors?.captureGlobalErrors ?? true,
        captureUnhandledRejections: config.errors?.captureUnhandledRejections ?? true,
        sampleRate: config.errors?.sampleRate ?? 1,
    });
    // Initialize local storage
    let localStorage = null;
    if (config.localStorage !== false) {
        localStorage = new LocalStorageManager();
        await localStorage.init();
    }
    // Initialize remote storage
    let remoteStorage = null;
    if (config.remoteStorage) {
        remoteStorage = new RemoteStorageManager({
            endpoint: config.remoteStorage.endpoint,
            ...(config.remoteStorage.apiKey !== undefined && { apiKey: config.remoteStorage.apiKey }),
        });
    }
    // Initialize alerts
    let alerts = null;
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
            return function (...args) {
                original.apply(this, args);
                const snapshot = this.getSnapshot();
                remoteStorage.sendMetrics(snapshot);
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
//# sourceMappingURL=index.js.map