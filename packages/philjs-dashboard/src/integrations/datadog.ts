/**
 * Datadog Integration
 * Export metrics, traces, and logs to Datadog
 */

import type { MetricsSnapshot, WebVitalsMetrics, CustomMetric } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Datadog Exporter
// ============================================================================

export class DatadogExporter {
  private config: Required<DatadogConfig>;
  private metricsQueue: DatadogMetric[] = [];
  private tracesQueue: DatadogTrace[][] = [];
  private logsQueue: DatadogLog[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private viewId: string;
  private isDestroyed = false;

  constructor(config: DatadogConfig) {
    this.config = {
      apiKey: config.apiKey,
      applicationKey: config.applicationKey ?? '',
      site: config.site ?? 'datadoghq.com',
      service: config.service,
      env: config.env ?? 'production',
      version: config.version ?? '',
      tags: config.tags ?? [],
      enableRum: config.enableRum ?? true,
      enableApm: config.enableApm ?? true,
      enableLogs: config.enableLogs ?? true,
      sampleRate: config.sampleRate ?? 1,
      flushInterval: config.flushInterval ?? 10000,
    };

    this.sessionId = this.generateId();
    this.viewId = this.generateId();

    this.startFlushTimer();
  }

  // ============================================================================
  // Metrics Export
  // ============================================================================

  /**
   * Export Web Vitals as metrics
   */
  exportWebVitals(webVitals: WebVitalsMetrics): void {
    if (this.isDestroyed) return;
    if (Math.random() >= this.config.sampleRate) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const baseTags = this.getBaseTags();

    const metrics: DatadogMetric[] = [];

    if (webVitals.lcp !== null) {
      metrics.push({
        metric: 'web.vitals.lcp',
        type: 'gauge',
        points: [[timestamp, webVitals.lcp]],
        tags: baseTags,
      });
    }

    if (webVitals.fid !== null) {
      metrics.push({
        metric: 'web.vitals.fid',
        type: 'gauge',
        points: [[timestamp, webVitals.fid]],
        tags: baseTags,
      });
    }

    if (webVitals.cls !== null) {
      metrics.push({
        metric: 'web.vitals.cls',
        type: 'gauge',
        points: [[timestamp, webVitals.cls]],
        tags: baseTags,
      });
    }

    if (webVitals.fcp !== null) {
      metrics.push({
        metric: 'web.vitals.fcp',
        type: 'gauge',
        points: [[timestamp, webVitals.fcp]],
        tags: baseTags,
      });
    }

    if (webVitals.ttfb !== null) {
      metrics.push({
        metric: 'web.vitals.ttfb',
        type: 'gauge',
        points: [[timestamp, webVitals.ttfb]],
        tags: baseTags,
      });
    }

    if (webVitals.inp !== null) {
      metrics.push({
        metric: 'web.vitals.inp',
        type: 'gauge',
        points: [[timestamp, webVitals.inp]],
        tags: baseTags,
      });
    }

    this.metricsQueue.push(...metrics);
  }

  /**
   * Export custom metrics
   */
  exportCustomMetrics(customMetrics: CustomMetric[]): void {
    if (this.isDestroyed) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const baseTags = this.getBaseTags();

    for (const metric of customMetrics) {
      const tags = [...baseTags];
      if (metric.tags) {
        Object.entries(metric.tags).forEach(([k, v]) => {
          tags.push(`${k}:${v}`);
        });
      }

      this.metricsQueue.push({
        metric: `custom.${metric.name}`,
        type: 'gauge',
        points: [[timestamp, metric.value]],
        tags,
      });
    }
  }

  /**
   * Export a full metrics snapshot
   */
  exportMetricsSnapshot(snapshot: MetricsSnapshot): void {
    this.exportWebVitals(snapshot.webVitals);

    if (snapshot.customMetrics.length > 0) {
      this.exportCustomMetrics(snapshot.customMetrics);
    }

    // Export memory metrics
    if (snapshot.memory) {
      const timestamp = Math.floor(Date.now() / 1000);
      const baseTags = this.getBaseTags();

      this.metricsQueue.push(
        {
          metric: 'browser.memory.used_heap',
          type: 'gauge',
          points: [[timestamp, snapshot.memory.usedJSHeapSize]],
          tags: baseTags,
        },
        {
          metric: 'browser.memory.heap_utilization',
          type: 'gauge',
          points: [[timestamp, snapshot.memory.heapUtilization]],
          tags: baseTags,
        }
      );
    }

    // Export CPU metrics
    if (snapshot.cpu) {
      const timestamp = Math.floor(Date.now() / 1000);
      const baseTags = this.getBaseTags();

      this.metricsQueue.push({
        metric: 'browser.cpu.total_blocking_time',
        type: 'gauge',
        points: [[timestamp, snapshot.cpu.totalBlockingTime]],
        tags: baseTags,
      });
    }
  }

  // ============================================================================
  // Traces Export
  // ============================================================================

  /**
   * Export spans as Datadog traces
   */
  exportTrace(spans: Span[]): void {
    if (this.isDestroyed) return;
    if (!this.config.enableApm) return;
    if (Math.random() >= this.config.sampleRate) return;

    const ddSpans: DatadogTrace[] = spans.map((span) => {
      const trace: DatadogTrace = {
        trace_id: this.convertTraceId(span.traceId),
        span_id: this.convertSpanId(span.spanId),
        name: this.mapSpanKindToName(span.kind),
        resource: span.name,
        service: span.resource.serviceName || this.config.service,
        type: this.mapSpanKindToType(span.kind),
        start: Math.floor(span.startTime * 1000000), // nanoseconds
        duration: Math.floor((span.duration || 0) * 1000000), // nanoseconds
        error: span.status.code === 'error' ? 1 : 0,
        meta: {
          ...this.stringifyAttributes(span.attributes),
          env: this.config.env,
          version: this.config.version || span.resource.serviceVersion || '',
          'span.kind': span.kind,
        },
        metrics: {},
      };
      if (span.parentSpanId) {
        trace.parent_id = this.convertSpanId(span.parentSpanId);
      }
      return trace;
    });

    this.tracesQueue.push(ddSpans);
  }

  // ============================================================================
  // Logs Export
  // ============================================================================

  /**
   * Export an error as a log
   */
  exportError(error: CapturedError): void {
    if (this.isDestroyed) return;
    if (!this.config.enableLogs) return;

    const log: DatadogLog = {
      message: error.error.message,
      level: 'error',
      timestamp: error.timestamp,
      service: this.config.service,
      source: 'browser',
      tags: [
        ...this.getBaseTags(),
        ...Object.entries(error.tags).map(([k, v]) => `${k}:${v}`),
      ],
      attributes: {
        error_name: error.error.name,
        error_fingerprint: error.fingerprint,
        url: error.url,
        user_agent: error.userAgent,
        breadcrumbs: error.breadcrumbs,
        context: error.context,
        user: error.user,
        trace_id: error.traceId,
        span_id: error.spanId,
      },
      error: {
        message: error.error.message,
        stack: error.error.rawStack,
        kind: error.error.name,
      },
    };

    this.logsQueue.push(log);
  }

  /**
   * Export a log message
   */
  log(
    message: string,
    level: DatadogLog['level'] = 'info',
    attributes?: Record<string, unknown>
  ): void {
    if (this.isDestroyed) return;
    if (!this.config.enableLogs) return;

    const log: DatadogLog = {
      message,
      level,
      timestamp: Date.now(),
      service: this.config.service,
      source: 'browser',
      tags: this.getBaseTags(),
    };
    if (attributes !== undefined) {
      log.attributes = attributes;
    }

    this.logsQueue.push(log);
  }

  // ============================================================================
  // RUM Events
  // ============================================================================

  /**
   * Track a page view
   */
  trackPageView(viewName: string, url: string): void {
    if (this.isDestroyed) return;
    if (!this.config.enableRum) return;

    this.viewId = this.generateId();

    // Page views are typically handled by RUM SDK,
    // but we can send custom metrics for tracking
    const timestamp = Math.floor(Date.now() / 1000);
    this.metricsQueue.push({
      metric: 'rum.page_view',
      type: 'count',
      points: [[timestamp, 1]],
      tags: [
        ...this.getBaseTags(),
        `view.name:${viewName}`,
        `view.url:${url}`,
      ],
    });
  }

  /**
   * Track a user action
   */
  trackAction(name: string, type: string, attributes?: Record<string, unknown>): void {
    if (this.isDestroyed) return;
    if (!this.config.enableRum) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const tags = [
      ...this.getBaseTags(),
      `action.name:${name}`,
      `action.type:${type}`,
    ];

    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => {
        tags.push(`${k}:${v}`);
      });
    }

    this.metricsQueue.push({
      metric: 'rum.action',
      type: 'count',
      points: [[timestamp, 1]],
      tags,
    });
  }

  // ============================================================================
  // Flush and Lifecycle
  // ============================================================================

  /**
   * Flush all queued data
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.metricsQueue.length > 0) {
      const metrics = [...this.metricsQueue];
      this.metricsQueue = [];
      promises.push(this.sendMetrics(metrics));
    }

    if (this.tracesQueue.length > 0) {
      const traces = [...this.tracesQueue];
      this.tracesQueue = [];
      promises.push(this.sendTraces(traces));
    }

    if (this.logsQueue.length > 0) {
      const logs = [...this.logsQueue];
      this.logsQueue = [];
      promises.push(this.sendLogs(logs));
    }

    await Promise.all(promises);
  }

  /**
   * Destroy the exporter
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getBaseTags(): string[] {
    return [
      `service:${this.config.service}`,
      `env:${this.config.env}`,
      ...(this.config.version ? [`version:${this.config.version}`] : []),
      ...this.config.tags,
    ];
  }

  private generateId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private convertTraceId(traceId: string): string {
    // Datadog uses 64-bit trace IDs, take last 16 hex chars
    return traceId.slice(-16);
  }

  private convertSpanId(spanId: string): string {
    // Datadog uses 64-bit span IDs
    return spanId.slice(-16);
  }

  private mapSpanKindToName(kind: string): string {
    const mapping: Record<string, string> = {
      internal: 'internal',
      server: 'web.request',
      client: 'http.request',
      producer: 'queue.publish',
      consumer: 'queue.consume',
    };
    return mapping[kind] || kind;
  }

  private mapSpanKindToType(kind: string): string {
    const mapping: Record<string, string> = {
      internal: 'custom',
      server: 'web',
      client: 'http',
      producer: 'custom',
      consumer: 'custom',
    };
    return mapping[kind] || 'custom';
  }

  private stringifyAttributes(
    attributes: Record<string, unknown>
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      result[key] = String(value);
    }
    return result;
  }

  private async sendMetrics(metrics: DatadogMetric[]): Promise<void> {
    const url = `https://api.${this.config.site}/api/v1/series`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey,
        },
        body: JSON.stringify({ series: metrics }),
      });
    } catch (error) {
      console.error('[Datadog] Failed to send metrics:', error);
    }
  }

  private async sendTraces(traces: DatadogTrace[][]): Promise<void> {
    const url = `https://trace.agent.${this.config.site}/v0.4/traces`;

    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Datadog-Trace-Count': String(traces.length),
        },
        body: JSON.stringify(traces),
      });
    } catch (error) {
      console.error('[Datadog] Failed to send traces:', error);
    }
  }

  private async sendLogs(logs: DatadogLog[]): Promise<void> {
    const url = `https://http-intake.logs.${this.config.site}/api/v2/logs`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey,
        },
        body: JSON.stringify(logs),
      });
    } catch (error) {
      console.error('[Datadog] Failed to send logs:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.flush().catch(console.error);
      }
    }, this.config.flushInterval);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createDatadogExporter(config: DatadogConfig): DatadogExporter {
  return new DatadogExporter(config);
}
