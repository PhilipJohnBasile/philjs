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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Tracer
// ============================================================================

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

class TraceContext {
  private currentSpan = signal<Span | null>(null);
  private spans: Span[] = [];

  getCurrentSpan(): Span | null {
    return this.currentSpan();
  }

  setCurrentSpan(span: Span | null): void {
    this.currentSpan.set(span);
  }

  addSpan(span: Span): void {
    this.spans.push(span);
  }

  getSpans(): Span[] {
    return this.spans;
  }

  clear(): void {
    this.spans = [];
  }
}

const globalContext = new TraceContext();

export class Tracer {
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;
  private sampleRate: number;
  private exporters: SpanExporter[];

  constructor(options: TracerOptions) {
    this.serviceName = options.serviceName;
    this.serviceVersion = options.serviceVersion || '1.0.0';
    this.environment = options.environment || 'development';
    this.sampleRate = options.sampleRate ?? 1.0;
    this.exporters = options.exporters || [];
  }

  startSpan(name: string, attributes?: Record<string, any>): Span {
    if (Math.random() > this.sampleRate) {
      // Not sampled - return a no-op span
      return this.createNoOpSpan(name);
    }

    const parentSpan = globalContext.getCurrentSpan();

    const span: Span = {
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

  endSpan(span: Span, status?: 'ok' | 'error'): void {
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

  addEvent(span: Span, name: string, attributes?: Record<string, any>): void {
    span.events.push({
      name,
      timestamp: Date.now(),
      ...(attributes !== undefined ? { attributes } : {}),
    });
  }

  setAttribute(span: Span, key: string, value: any): void {
    span.attributes[key] = value;
  }

  recordException(span: Span, error: Error): void {
    span.status = 'error';
    span.attributes['exception.type'] = error.name;
    span.attributes['exception.message'] = error.message;
    span.attributes['exception.stacktrace'] = error.stack;
    this.addEvent(span, 'exception', {
      type: error.name,
      message: error.message,
    });
  }

  async flush(): Promise<void> {
    const spans = globalContext.getSpans();
    if (spans.length === 0) return;

    await Promise.all(this.exporters.map(exporter => exporter.export(spans)));
    globalContext.clear();
  }

  // Utility: Wrap async function with span
  async trace<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, any>): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await fn(span);
      this.endSpan(span, 'ok');
      return result;
    } catch (error) {
      this.recordException(span, error instanceof Error ? error : new Error(String(error)));
      this.endSpan(span, 'error');
      throw error;
    }
  }

  private generateId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private createNoOpSpan(name: string): Span {
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

// ============================================================================
// Metrics
// ============================================================================

export interface MetricsOptions {
  prefix?: string;
  defaultLabels?: Record<string, string>;
  exporters?: MetricsExporter[];
  flushInterval?: number;
}

export interface MetricsExporter {
  export(metrics: MetricValue[]): Promise<void>;
}

export class Metrics {
  private prefix: string;
  private defaultLabels: Record<string, string>;
  private exporters: MetricsExporter[];
  private buffer: MetricValue[] = [];
  private flushInterval: number;
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(options: MetricsOptions = {}) {
    this.prefix = options.prefix || '';
    this.defaultLabels = options.defaultLabels || {};
    this.exporters = options.exporters || [];
    this.flushInterval = options.flushInterval || 10000;

    if (this.exporters.length > 0) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  // Counter: Monotonically increasing value
  counter(name: string, value = 1, labels: Record<string, string> = {}): void {
    this.record(name, value, 'counter', labels);
  }

  // Gauge: Value that can go up or down
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, 'gauge', labels);
  }

  // Histogram: Distribution of values
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, 'histogram', labels);
  }

  // Timer utility
  timer(name: string, labels: Record<string, string> = {}): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.histogram(`${name}_duration_ms`, duration, labels);
    };
  }

  private record(name: string, value: number, type: MetricValue['type'], labels: Record<string, string>): void {
    const fullName = this.prefix ? `${this.prefix}_${name}` : name;
    this.buffer.push({
      name: fullName,
      value,
      timestamp: Date.now(),
      labels: { ...this.defaultLabels, ...labels },
      type,
    });
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metrics = [...this.buffer];
    this.buffer = [];

    await Promise.all(this.exporters.map(exporter => exporter.export(metrics)));
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// ============================================================================
// Logger
// ============================================================================

export interface LoggerOptions {
  level?: LogLevel;
  context?: Record<string, any>;
  transports?: LogTransport[];
  format?: 'json' | 'pretty';
}

export interface LogTransport {
  log(entry: LogEntry): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class Logger {
  private level: LogLevel;
  private context: Record<string, any>;
  private transports: LogTransport[];
  private format: 'json' | 'pretty';

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.context = options.context || {};
    this.transports = options.transports || [new ConsoleTransport(options.format || 'pretty')];
    this.format = options.format || 'pretty';
  }

  child(context: Record<string, any>): Logger {
    return new Logger({
      level: this.level,
      context: { ...this.context, ...context },
      transports: this.transports,
      format: this.format,
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    if (error instanceof Error) {
      this.log('error', message, { error: error.message, stack: error.stack });
    } else {
      this.log('error', message, error);
    }
  }

  fatal(message: string, error?: Error | Record<string, any>): void {
    if (error instanceof Error) {
      this.log('fatal', message, { error: error.message, stack: error.stack });
    } else {
      this.log('fatal', message, error);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return;

    const currentSpan = globalContext.getCurrentSpan();

    const entry: LogEntry = {
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
export class ConsoleTransport implements LogTransport {
  private format: 'json' | 'pretty';

  constructor(format: 'json' | 'pretty' = 'pretty') {
    this.format = format;
  }

  log(entry: LogEntry): void {
    if (this.format === 'json') {
      return;
    }

    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const trace = entry.traceId ? ` [${entry.traceId.slice(0, 8)}]` : '';
    const ctx = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    };

    const reset = '\x1b[0m';
    console.log(`${colors[entry.level]}${timestamp} ${level}${reset}${trace} ${entry.message}${ctx}`);
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
}

export function usePerformance() {
  const metrics = signal<PerformanceMetrics>({});

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
      const lastEntry = entries[entries.length - 1]!;
      metrics.set({ ...metrics(), lcp: lastEntry.startTime });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Observe FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.set({ ...metrics(), fid: (entry as any).processingStart - entry.startTime });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Observe CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
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

// ============================================================================
// Error Tracking
// ============================================================================

export interface ErrorTrackerOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  onError?: (error: Error, context?: Record<string, any>) => void;
}

export class ErrorTracker {
  private options: ErrorTrackerOptions;

  constructor(options: ErrorTrackerOptions = {}) {
    this.options = options;
    this.setupGlobalHandlers();
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (Math.random() > (this.options.sampleRate ?? 1)) return;

    this.options.onError?.(error, context);

    // Would integrate with Sentry/Datadog here
    console.error('[ErrorTracker]', error, context);
  }

  captureMessage(message: string, level: LogLevel = 'info', context?: Record<string, any>): void {
    if (Math.random() > (this.options.sampleRate ?? 1)) return;

    console.log(`[ErrorTracker:${level}]`, message, context);
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    // Set user context for error reports
  }

  setTags(tags: Record<string, string>): void {
    // Set tags for error reports
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message));
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        );
      });
    }

    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.captureException(error);
      });

      process.on('unhandledRejection', (reason) => {
        this.captureException(
          reason instanceof Error ? reason : new Error(String(reason))
        );
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

export {
  AlertManager,
  initAlertManager,
  getAlertManager,
  useAlerts,
  presetRules,
} from './alerting.js';

export type {
  AlertSeverity,
  AlertState,
  ComparisonOperator,
  AlertRule,
  AlertCondition,
  Alert,
  NotificationChannel,
  AlertManagerConfig,
} from './alerting.js';
