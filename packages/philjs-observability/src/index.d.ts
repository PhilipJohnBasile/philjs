/**
 * PhilJS Observability - Distributed Tracing, Metrics & Logging
 *
 * Features:
 * - OpenTelemetry integration
 * - Distributed tracing with spans
 * - Metrics collection (counters, histograms, gauges)
 * - Structured logging
 * - Error tracking (Sentry, Datadog)
 * - Performance monitoring
 * - Custom instrumentation
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, any>;
    traceId?: string;
    spanId?: string;
    error?: Error;
}
export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    startTime: number;
    endTime?: number;
    status: 'ok' | 'error' | 'unset';
    attributes: Record<string, any>;
    events: SpanEvent[];
}
export interface SpanEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
}
export interface MetricValue {
    name: string;
    value: number;
    timestamp: number;
    labels: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram';
}
export interface TracerOptions {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    sampleRate?: number;
    exporters?: SpanExporter[];
}
export interface SpanExporter {
    export(spans: Span[]): Promise<void>;
}
export declare class Tracer {
    private serviceName;
    private serviceVersion;
    private environment;
    private sampleRate;
    private exporters;
    constructor(options: TracerOptions);
    startSpan(name: string, attributes?: Record<string, any>): Span;
    endSpan(span: Span, status?: 'ok' | 'error'): void;
    addEvent(span: Span, name: string, attributes?: Record<string, any>): void;
    setAttribute(span: Span, key: string, value: any): void;
    recordException(span: Span, error: Error): void;
    flush(): Promise<void>;
    trace<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, any>): Promise<T>;
    private generateId;
    private createNoOpSpan;
}
export interface MetricsOptions {
    prefix?: string;
    defaultLabels?: Record<string, string>;
    exporters?: MetricsExporter[];
    flushInterval?: number;
}
export interface MetricsExporter {
    export(metrics: MetricValue[]): Promise<void>;
}
export declare class Metrics {
    private prefix;
    private defaultLabels;
    private exporters;
    private buffer;
    private flushInterval;
    private flushTimer?;
    constructor(options?: MetricsOptions);
    counter(name: string, value?: number, labels?: Record<string, string>): void;
    gauge(name: string, value: number, labels?: Record<string, string>): void;
    histogram(name: string, value: number, labels?: Record<string, string>): void;
    timer(name: string, labels?: Record<string, string>): () => void;
    private record;
    flush(): Promise<void>;
    destroy(): void;
}
export interface LoggerOptions {
    level?: LogLevel;
    context?: Record<string, any>;
    transports?: LogTransport[];
    format?: 'json' | 'pretty';
}
export interface LogTransport {
    log(entry: LogEntry): void;
}
export declare class Logger {
    private level;
    private context;
    private transports;
    private format;
    constructor(options?: LoggerOptions);
    child(context: Record<string, any>): Logger;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error | Record<string, any>): void;
    fatal(message: string, error?: Error | Record<string, any>): void;
    private log;
}
export declare class ConsoleTransport implements LogTransport {
    private format;
    constructor(format?: 'json' | 'pretty');
    log(entry: LogEntry): void;
}
export interface PerformanceMetrics {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    tti?: number;
}
export declare function usePerformance(): {
    metrics: () => any;
    getWebVitals: () => any;
};
export interface ErrorTrackerOptions {
    dsn?: string;
    environment?: string;
    release?: string;
    sampleRate?: number;
    onError?: (error: Error, context?: Record<string, any>) => void;
}
export declare class ErrorTracker {
    private options;
    constructor(options?: ErrorTrackerOptions);
    captureException(error: Error, context?: Record<string, any>): void;
    captureMessage(message: string, level?: LogLevel, context?: Record<string, any>): void;
    setUser(user: {
        id: string;
        email?: string;
        username?: string;
    }): void;
    setTags(tags: Record<string, string>): void;
    private setupGlobalHandlers;
}
export * from './charts/index.js';
export * from './widgets/index.js';
export * from './dashboard/index.js';
export { AlertManager, initAlertManager, getAlertManager, useAlerts, presetRules, } from './alerting.js';
export type { AlertSeverity, AlertState, ComparisonOperator, AlertRule, AlertCondition, Alert, NotificationChannel, AlertManagerConfig, } from './alerting.js';
//# sourceMappingURL=index.d.ts.map