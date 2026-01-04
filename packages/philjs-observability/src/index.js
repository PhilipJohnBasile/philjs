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
import { signal, effect, memo } from '@philjs/core';
class TraceContext {
    currentSpan = signal(null);
    spans = [];
    getCurrentSpan() {
        return this.currentSpan();
    }
    setCurrentSpan(span) {
        this.currentSpan.set(span);
    }
    addSpan(span) {
        this.spans.push(span);
    }
    getSpans() {
        return this.spans;
    }
    clear() {
        this.spans = [];
    }
}
const globalContext = new TraceContext();
export class Tracer {
    serviceName;
    serviceVersion;
    environment;
    sampleRate;
    exporters;
    constructor(options) {
        this.serviceName = options.serviceName;
        this.serviceVersion = options.serviceVersion || '1.0.0';
        this.environment = options.environment || 'development';
        this.sampleRate = options.sampleRate ?? 1.0;
        this.exporters = options.exporters || [];
    }
    startSpan(name, attributes) {
        if (Math.random() > this.sampleRate) {
            // Not sampled - return a no-op span
            return this.createNoOpSpan(name);
        }
        const parentSpan = globalContext.getCurrentSpan();
        const span = {
            traceId: parentSpan?.traceId || this.generateId(),
            spanId: this.generateId(),
            ...(parentSpan?.spanId !== undefined ? { parentSpanId: parentSpan.spanId } : {}),
            name,
            startTime: Date.now(),
            status: 'unset',
            attributes: {
                'service.name': this.serviceName,
                'service.version': this.serviceVersion,
                'deployment.environment': this.environment,
                ...attributes,
            },
            events: [],
        };
        globalContext.setCurrentSpan(span);
        globalContext.addSpan(span);
        return span;
    }
    endSpan(span, status) {
        span.endTime = Date.now();
        span.status = status || 'ok';
        // Restore parent span
        const parentSpan = globalContext.getSpans().find(s => s.spanId === span.parentSpanId);
        globalContext.setCurrentSpan(parentSpan || null);
        // Export if this is a root span
        if (!span.parentSpanId) {
            this.flush();
        }
    }
    addEvent(span, name, attributes) {
        span.events.push({
            name,
            timestamp: Date.now(),
            ...(attributes !== undefined ? { attributes } : {}),
        });
    }
    setAttribute(span, key, value) {
        span.attributes[key] = value;
    }
    recordException(span, error) {
        span.status = 'error';
        span.attributes['exception.type'] = error.name;
        span.attributes['exception.message'] = error.message;
        span.attributes['exception.stacktrace'] = error.stack;
        this.addEvent(span, 'exception', {
            type: error.name,
            message: error.message,
        });
    }
    async flush() {
        const spans = globalContext.getSpans();
        if (spans.length === 0)
            return;
        await Promise.all(this.exporters.map(exporter => exporter.export(spans)));
        globalContext.clear();
    }
    // Utility: Wrap async function with span
    async trace(name, fn, attributes) {
        const span = this.startSpan(name, attributes);
        try {
            const result = await fn(span);
            this.endSpan(span, 'ok');
            return result;
        }
        catch (error) {
            this.recordException(span, error instanceof Error ? error : new Error(String(error)));
            this.endSpan(span, 'error');
            throw error;
        }
    }
    generateId() {
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    createNoOpSpan(name) {
        return {
            traceId: '',
            spanId: '',
            name,
            startTime: 0,
            status: 'unset',
            attributes: {},
            events: [],
        };
    }
}
export class Metrics {
    prefix;
    defaultLabels;
    exporters;
    buffer = [];
    flushInterval;
    flushTimer;
    constructor(options = {}) {
        this.prefix = options.prefix || '';
        this.defaultLabels = options.defaultLabels || {};
        this.exporters = options.exporters || [];
        this.flushInterval = options.flushInterval || 10000;
        if (this.exporters.length > 0) {
            this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
        }
    }
    // Counter: Monotonically increasing value
    counter(name, value = 1, labels = {}) {
        this.record(name, value, 'counter', labels);
    }
    // Gauge: Value that can go up or down
    gauge(name, value, labels = {}) {
        this.record(name, value, 'gauge', labels);
    }
    // Histogram: Distribution of values
    histogram(name, value, labels = {}) {
        this.record(name, value, 'histogram', labels);
    }
    // Timer utility
    timer(name, labels = {}) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.histogram(`${name}_duration_ms`, duration, labels);
        };
    }
    record(name, value, type, labels) {
        const fullName = this.prefix ? `${this.prefix}_${name}` : name;
        this.buffer.push({
            name: fullName,
            value,
            timestamp: Date.now(),
            labels: { ...this.defaultLabels, ...labels },
            type,
        });
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const metrics = [...this.buffer];
        this.buffer = [];
        await Promise.all(this.exporters.map(exporter => exporter.export(metrics)));
    }
    destroy() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};
export class Logger {
    level;
    context;
    transports;
    format;
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.context = options.context || {};
        this.transports = options.transports || [new ConsoleTransport(options.format || 'pretty')];
        this.format = options.format || 'pretty';
    }
    child(context) {
        return new Logger({
            level: this.level,
            context: { ...this.context, ...context },
            transports: this.transports,
            format: this.format,
        });
    }
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, error) {
        if (error instanceof Error) {
            this.log('error', message, { error: error.message, stack: error.stack });
        }
        else {
            this.log('error', message, error);
        }
    }
    fatal(message, error) {
        if (error instanceof Error) {
            this.log('fatal', message, { error: error.message, stack: error.stack });
        }
        else {
            this.log('fatal', message, error);
        }
    }
    log(level, message, context) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level])
            return;
        const currentSpan = globalContext.getCurrentSpan();
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context: { ...this.context, ...context },
            ...(currentSpan?.traceId !== undefined ? { traceId: currentSpan.traceId } : {}),
            ...(currentSpan?.spanId !== undefined ? { spanId: currentSpan.spanId } : {}),
        };
        this.transports.forEach(transport => transport.log(entry));
    }
}
// Console Transport
export class ConsoleTransport {
    format;
    constructor(format = 'pretty') {
        this.format = format;
    }
    log(entry) {
        if (this.format === 'json') {
            console.log(JSON.stringify(entry));
            return;
        }
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        const trace = entry.traceId ? ` [${entry.traceId.slice(0, 8)}]` : '';
        const ctx = entry.context && Object.keys(entry.context).length > 0
            ? ` ${JSON.stringify(entry.context)}`
            : '';
        const colors = {
            debug: '\x1b[36m', // cyan
            info: '\x1b[32m', // green
            warn: '\x1b[33m', // yellow
            error: '\x1b[31m', // red
            fatal: '\x1b[35m', // magenta
        };
        const reset = '\x1b[0m';
        console.log(`${colors[entry.level]}${timestamp} ${level}${reset}${trace} ${entry.message}${ctx}`);
    }
}
export function usePerformance() {
    const metrics = signal({});
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    metrics.set({ ...metrics(), fcp: entry.startTime });
                }
            }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.set({ ...metrics(), lcp: lastEntry.startTime });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                metrics.set({ ...metrics(), fid: entry.processingStart - entry.startTime });
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    metrics.set({ ...metrics(), cls: clsValue });
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        // Navigation timing
        if (performance.timing) {
            const timing = performance.timing;
            setTimeout(() => {
                metrics.set({
                    ...metrics(),
                    ttfb: timing.responseStart - timing.requestStart,
                });
            }, 0);
        }
    }
    return {
        metrics: () => metrics(),
        getWebVitals: () => metrics(),
    };
}
export class ErrorTracker {
    options;
    constructor(options = {}) {
        this.options = options;
        this.setupGlobalHandlers();
    }
    captureException(error, context) {
        if (Math.random() > (this.options.sampleRate ?? 1))
            return;
        this.options.onError?.(error, context);
        // Would integrate with Sentry/Datadog here
        console.error('[ErrorTracker]', error, context);
    }
    captureMessage(message, level = 'info', context) {
        if (Math.random() > (this.options.sampleRate ?? 1))
            return;
        console.log(`[ErrorTracker:${level}]`, message, context);
    }
    setUser(user) {
        // Set user context for error reports
    }
    setTags(tags) {
        // Set tags for error reports
    }
    setupGlobalHandlers() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.captureException(event.error || new Error(event.message));
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
            });
        }
        if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.captureException(error);
            });
            process.on('unhandledRejection', (reason) => {
                this.captureException(reason instanceof Error ? reason : new Error(String(reason)));
            });
        }
    }
}
// ============================================================================
// Chart Components
// ============================================================================
export * from './charts/index.js';
// ============================================================================
// Widget Components
// ============================================================================
export * from './widgets/index.js';
// ============================================================================
// Dashboard Components
// ============================================================================
export * from './dashboard/index.js';
// ============================================================================
// Alerting Engine
// ============================================================================
export { AlertManager, initAlertManager, getAlertManager, useAlerts, presetRules, } from './alerting.js';
//# sourceMappingURL=index.js.map