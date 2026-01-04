/**
 * Sentry Integration
 * Export metrics, traces, and errors to Sentry
 */
import type { WebVitalsMetrics } from '../collector/metrics.js';
import type { Span, TraceContext } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';
export interface SentryConfig {
    /** Sentry DSN */
    dsn: string;
    /** Environment */
    environment?: string;
    /** Release version */
    release?: string;
    /** Sample rate for errors (0-1) */
    errorSampleRate?: number;
    /** Sample rate for transactions (0-1) */
    tracesSampleRate?: number;
    /** Enable performance monitoring */
    enablePerformance?: boolean;
    /** Custom tags */
    tags?: Record<string, string>;
    /** Before send hook for errors */
    beforeSend?: (event: SentryEvent) => SentryEvent | null;
    /** Before send hook for transactions */
    beforeSendTransaction?: (transaction: SentryTransaction) => SentryTransaction | null;
}
export interface SentryEvent {
    event_id: string;
    timestamp: number;
    platform: string;
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    message?: string;
    exception?: {
        values: Array<{
            type: string;
            value: string;
            stacktrace?: {
                frames: SentryStackFrame[];
            };
        }>;
    };
    breadcrumbs?: {
        values: SentryBreadcrumb[];
    };
    contexts?: Record<string, unknown>;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
        id?: string;
        username?: string;
        email?: string;
        ip_address?: string;
    };
    request?: {
        url?: string;
        headers?: Record<string, string>;
    };
    environment?: string;
    release?: string;
}
export interface SentryStackFrame {
    filename?: string;
    function?: string;
    lineno?: number;
    colno?: number;
    in_app?: boolean;
    context_line?: string;
    pre_context?: string[];
    post_context?: string[];
}
export interface SentryBreadcrumb {
    type?: string;
    category?: string;
    message?: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    timestamp?: number;
    data?: Record<string, unknown>;
}
export interface SentryTransaction {
    event_id: string;
    type: 'transaction';
    transaction: string;
    start_timestamp: number;
    timestamp: number;
    contexts: {
        trace: {
            trace_id: string;
            span_id: string;
            parent_span_id?: string;
            op?: string;
            status?: string;
        };
    };
    spans: SentrySpan[];
    tags?: Record<string, string>;
    measurements?: Record<string, {
        value: number;
        unit: string;
    }>;
    environment?: string;
    release?: string;
}
export interface SentrySpan {
    span_id: string;
    trace_id: string;
    parent_span_id?: string;
    op?: string;
    description?: string;
    start_timestamp: number;
    timestamp: number;
    status?: string;
    tags?: Record<string, string>;
    data?: Record<string, unknown>;
}
export declare class SentryExporter {
    private config;
    private projectId;
    private publicKey;
    private host;
    private queue;
    private flushTimer;
    private isDestroyed;
    constructor(config: SentryConfig);
    /**
     * Export an error to Sentry
     */
    exportError(error: CapturedError): Promise<void>;
    /**
     * Export a trace to Sentry
     */
    exportTrace(spans: Span[]): Promise<void>;
    /**
     * Export Web Vitals to Sentry
     */
    exportWebVitals(webVitals: WebVitalsMetrics, traceContext?: TraceContext): Promise<void>;
    /**
     * Capture a message
     */
    captureMessage(message: string, level?: SentryEvent['level']): Promise<void>;
    /**
     * Flush all queued events
     */
    flush(): Promise<void>;
    /**
     * Destroy the exporter
     */
    destroy(): void;
    private parseDsn;
    private convertErrorToEvent;
    private convertStackFrames;
    private convertBreadcrumbs;
    private convertSpansToTransaction;
    private mapSpanKindToOp;
    private mapStatusCode;
    private sendEvent;
    private startFlushTimer;
    private generateEventId;
    private generateTraceId;
    private generateSpanId;
    private getBrowserName;
    private getDeviceFamily;
}
export declare function createSentryExporter(config: SentryConfig): SentryExporter;
//# sourceMappingURL=sentry.d.ts.map