/**
 * Grafana Integration
 * Export metrics to Grafana Cloud or self-hosted Grafana/Prometheus
 */
import type { MetricsSnapshot, WebVitalsMetrics, CustomMetric } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
export interface GrafanaConfig {
    /** Prometheus remote write endpoint */
    prometheusUrl?: string;
    /** Loki endpoint for logs */
    lokiUrl?: string;
    /** Tempo endpoint for traces */
    tempoUrl?: string;
    /** API key or bearer token */
    apiKey?: string;
    /** Basic auth username */
    username?: string;
    /** Basic auth password */
    password?: string;
    /** Job name for Prometheus metrics */
    job?: string;
    /** Instance identifier */
    instance?: string;
    /** Additional labels */
    labels?: Record<string, string>;
    /** Flush interval in ms */
    flushInterval?: number;
    /** Enable gzip compression */
    compression?: boolean;
}
export interface PrometheusTimeSeries {
    labels: Record<string, string>;
    samples: Array<{
        timestamp: number;
        value: number;
    }>;
}
export interface PrometheusWriteRequest {
    timeseries: PrometheusTimeSeries[];
}
export interface LokiLogEntry {
    stream: Record<string, string>;
    values: Array<[string, string]>;
}
export interface LokiPushRequest {
    streams: LokiLogEntry[];
}
export interface TempoSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    serviceName: string;
    startTime: number;
    duration: number;
    tags: Array<{
        key: string;
        type: string;
        value: string | number | boolean;
    }>;
    logs?: Array<{
        timestamp: number;
        fields: Array<{
            key: string;
            type: string;
            value: string;
        }>;
    }>;
}
export declare class GrafanaExporter {
    private config;
    private metricsQueue;
    private logsQueue;
    private tracesQueue;
    private flushTimer;
    private isDestroyed;
    constructor(config: GrafanaConfig);
    /**
     * Export Web Vitals as Prometheus metrics
     */
    exportWebVitals(webVitals: WebVitalsMetrics): void;
    /**
     * Export custom metrics
     */
    exportCustomMetrics(customMetrics: CustomMetric[]): void;
    /**
     * Export a full metrics snapshot
     */
    exportMetricsSnapshot(snapshot: MetricsSnapshot): void;
    /**
     * Export a gauge metric
     */
    gauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Export a counter increment
     */
    counter(name: string, increment?: number, labels?: Record<string, string>): void;
    /**
     * Export a histogram observation
     */
    histogram(name: string, value: number, buckets?: number[], labels?: Record<string, string>): void;
    /**
     * Export a log entry to Loki
     */
    log(message: string, level?: 'debug' | 'info' | 'warn' | 'error', labels?: Record<string, string>): void;
    /**
     * Export an error to Loki
     */
    logError(error: Error, context?: Record<string, unknown>, labels?: Record<string, string>): void;
    /**
     * Export spans to Tempo
     */
    exportTrace(spans: Span[]): void;
    /**
     * Flush all queued data
     */
    flush(): Promise<void>;
    /**
     * Destroy the exporter
     */
    destroy(): Promise<void>;
    private getBaseLabels;
    private sanitizeMetricName;
    private getAuthHeaders;
    private sendMetrics;
    private sendLogs;
    private sendTraces;
    private startFlushTimer;
}
export declare function createGrafanaExporter(config: GrafanaConfig): GrafanaExporter;
export interface GrafanaDashboard {
    title: string;
    uid: string;
    panels: GrafanaPanel[];
    time: {
        from: string;
        to: string;
    };
    refresh: string;
}
export interface GrafanaPanel {
    id: number;
    type: string;
    title: string;
    gridPos: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    targets: Array<{
        expr?: string;
        legendFormat?: string;
        refId: string;
    }>;
}
/**
 * Generate a Grafana dashboard JSON for Web Vitals
 */
export declare function generateWebVitalsDashboard(job?: string): GrafanaDashboard;
//# sourceMappingURL=grafana.d.ts.map