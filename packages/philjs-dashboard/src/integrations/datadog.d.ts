/**
 * Datadog Integration
 * Export metrics, traces, and logs to Datadog
 */
import type { MetricsSnapshot, WebVitalsMetrics, CustomMetric } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';
export interface DatadogConfig {
    /** Datadog API key */
    apiKey: string;
    /** Application key (for some endpoints) */
    applicationKey?: string;
    /** Datadog site (e.g., 'datadoghq.com', 'datadoghq.eu') */
    site?: string;
    /** Service name */
    service: string;
    /** Environment */
    env?: string;
    /** Version */
    version?: string;
    /** Custom tags */
    tags?: string[];
    /** Enable RUM (Real User Monitoring) */
    enableRum?: boolean;
    /** Enable APM (Application Performance Monitoring) */
    enableApm?: boolean;
    /** Enable log collection */
    enableLogs?: boolean;
    /** Sample rate (0-1) */
    sampleRate?: number;
    /** Flush interval in ms */
    flushInterval?: number;
}
export interface DatadogMetric {
    metric: string;
    type: 'gauge' | 'count' | 'rate';
    points: Array<[number, number]>;
    tags?: string[];
    host?: string;
}
export interface DatadogTrace {
    trace_id: string;
    span_id: string;
    parent_id?: string;
    name: string;
    resource: string;
    service: string;
    type?: string;
    start: number;
    duration: number;
    error?: number;
    meta?: Record<string, string>;
    metrics?: Record<string, number>;
}
export interface DatadogLog {
    message: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    timestamp: number;
    service: string;
    source?: string;
    tags?: string[];
    attributes?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
        kind?: string;
    };
}
export interface DatadogRumEvent {
    type: 'view' | 'action' | 'resource' | 'error' | 'long_task';
    application: {
        id: string;
    };
    session: {
        id: string;
    };
    view: {
        id: string;
        name?: string;
        url: string;
    };
    date: number;
    [key: string]: unknown;
}
export declare class DatadogExporter {
    private config;
    private metricsQueue;
    private tracesQueue;
    private logsQueue;
    private flushTimer;
    private sessionId;
    private viewId;
    private isDestroyed;
    constructor(config: DatadogConfig);
    /**
     * Export Web Vitals as metrics
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
     * Export spans as Datadog traces
     */
    exportTrace(spans: Span[]): void;
    /**
     * Export an error as a log
     */
    exportError(error: CapturedError): void;
    /**
     * Export a log message
     */
    log(message: string, level?: DatadogLog['level'], attributes?: Record<string, unknown>): void;
    /**
     * Track a page view
     */
    trackPageView(viewName: string, url: string): void;
    /**
     * Track a user action
     */
    trackAction(name: string, type: string, attributes?: Record<string, unknown>): void;
    /**
     * Flush all queued data
     */
    flush(): Promise<void>;
    /**
     * Destroy the exporter
     */
    destroy(): Promise<void>;
    private getBaseTags;
    private generateId;
    private convertTraceId;
    private convertSpanId;
    private mapSpanKindToName;
    private mapSpanKindToType;
    private stringifyAttributes;
    private sendMetrics;
    private sendTraces;
    private sendLogs;
    private startFlushTimer;
}
export declare function createDatadogExporter(config: DatadogConfig): DatadogExporter;
//# sourceMappingURL=datadog.d.ts.map