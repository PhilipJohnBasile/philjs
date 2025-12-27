/**
 * Sentry Integration
 * Export metrics, traces, and errors to Sentry
 */

import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics';
import type { Span, TraceContext } from '../collector/tracing';
import type { CapturedError, StackFrame, Breadcrumb } from '../collector/errors';

// ============================================================================
// Types
// ============================================================================

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
  measurements?: Record<string, { value: number; unit: string }>;
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

// ============================================================================
// Sentry Exporter
// ============================================================================

export class SentryExporter {
  private config: Required<SentryConfig>;
  private projectId: string;
  private publicKey: string;
  private host: string;
  private queue: Array<SentryEvent | SentryTransaction> = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  constructor(config: SentryConfig) {
    this.config = {
      dsn: config.dsn,
      environment: config.environment ?? 'production',
      release: config.release ?? '',
      errorSampleRate: config.errorSampleRate ?? 1,
      tracesSampleRate: config.tracesSampleRate ?? 0.1,
      enablePerformance: config.enablePerformance ?? true,
      tags: config.tags ?? {},
      beforeSend: config.beforeSend ?? ((e) => e),
      beforeSendTransaction: config.beforeSendTransaction ?? ((t) => t),
    };

    const parsed = this.parseDsn(config.dsn);
    this.projectId = parsed.projectId;
    this.publicKey = parsed.publicKey;
    this.host = parsed.host;

    this.startFlushTimer();
  }

  /**
   * Export an error to Sentry
   */
  async exportError(error: CapturedError): Promise<void> {
    if (this.isDestroyed) return;
    if (Math.random() >= this.config.errorSampleRate) return;

    let event = this.convertErrorToEvent(error);
    event = this.config.beforeSend(event) as SentryEvent;

    if (event) {
      this.queue.push(event);
    }
  }

  /**
   * Export a trace to Sentry
   */
  async exportTrace(spans: Span[]): Promise<void> {
    if (this.isDestroyed) return;
    if (!this.config.enablePerformance) return;
    if (Math.random() >= this.config.tracesSampleRate) return;
    if (spans.length === 0) return;

    let transaction = this.convertSpansToTransaction(spans);
    transaction = this.config.beforeSendTransaction(transaction) as SentryTransaction;

    if (transaction) {
      this.queue.push(transaction);
    }
  }

  /**
   * Export Web Vitals to Sentry
   */
  async exportWebVitals(webVitals: WebVitalsMetrics, traceContext?: TraceContext): Promise<void> {
    if (this.isDestroyed) return;
    if (!this.config.enablePerformance) return;

    // Create a transaction with Web Vitals measurements
    const transaction: SentryTransaction = {
      event_id: this.generateEventId(),
      type: 'transaction',
      transaction: 'pageload',
      start_timestamp: Date.now() / 1000 - 1, // Approximate
      timestamp: Date.now() / 1000,
      contexts: {
        trace: {
          trace_id: traceContext?.traceId || this.generateTraceId(),
          span_id: traceContext?.spanId || this.generateSpanId(),
          op: 'pageload',
          status: 'ok',
        },
      },
      spans: [],
      measurements: {},
      tags: this.config.tags,
      environment: this.config.environment,
      release: this.config.release,
    };

    // Add Web Vitals as measurements
    if (webVitals.lcp !== null) {
      transaction.measurements!['lcp'] = { value: webVitals.lcp, unit: 'millisecond' };
    }
    if (webVitals.fid !== null) {
      transaction.measurements!['fid'] = { value: webVitals.fid, unit: 'millisecond' };
    }
    if (webVitals.cls !== null) {
      transaction.measurements!['cls'] = { value: webVitals.cls, unit: 'none' };
    }
    if (webVitals.fcp !== null) {
      transaction.measurements!['fcp'] = { value: webVitals.fcp, unit: 'millisecond' };
    }
    if (webVitals.ttfb !== null) {
      transaction.measurements!['ttfb'] = { value: webVitals.ttfb, unit: 'millisecond' };
    }
    if (webVitals.inp !== null) {
      transaction.measurements!['inp'] = { value: webVitals.inp, unit: 'millisecond' };
    }

    const filtered = this.config.beforeSendTransaction(transaction);
    if (filtered) {
      this.queue.push(filtered);
    }
  }

  /**
   * Capture a message
   */
  async captureMessage(
    message: string,
    level: SentryEvent['level'] = 'info'
  ): Promise<void> {
    if (this.isDestroyed) return;

    const event: SentryEvent = {
      event_id: this.generateEventId(),
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level,
      message,
      tags: this.config.tags,
      environment: this.config.environment,
      release: this.config.release,
    };

    const filtered = this.config.beforeSend(event);
    if (filtered) {
      this.queue.push(filtered);
    }
  }

  /**
   * Flush all queued events
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Send events using Sentry envelope format
    for (const event of events) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.error('[Sentry] Failed to send event:', error);
        // Re-queue failed events (with limit)
        if (this.queue.length < 100) {
          this.queue.push(event);
        }
      }
    }
  }

  /**
   * Destroy the exporter
   */
  destroy(): void {
    this.isDestroyed = true;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private parseDsn(dsn: string): { projectId: string; publicKey: string; host: string } {
    const match = dsn.match(/^https?:\/\/([^@]+)@([^/]+)\/(\d+)$/);
    if (!match) {
      throw new Error('Invalid Sentry DSN');
    }

    return {
      publicKey: match[1],
      host: match[2],
      projectId: match[3],
    };
  }

  private convertErrorToEvent(error: CapturedError): SentryEvent {
    return {
      event_id: this.generateEventId(),
      timestamp: error.timestamp / 1000,
      platform: 'javascript',
      level: 'error',
      exception: {
        values: [
          {
            type: error.error.name,
            value: error.error.message,
            stacktrace: {
              frames: this.convertStackFrames(error.error.stack),
            },
          },
        ],
      },
      breadcrumbs: {
        values: this.convertBreadcrumbs(error.breadcrumbs),
      },
      contexts: {
        browser: {
          name: this.getBrowserName(),
        },
        device: {
          family: this.getDeviceFamily(),
        },
        ...error.context.extra,
      },
      tags: {
        ...this.config.tags,
        ...error.tags,
      },
      user: error.user
        ? {
            id: error.user.id,
            username: error.user.username,
            email: error.user.email,
            ip_address: error.user.ipAddress,
          }
        : undefined,
      request: {
        url: error.url,
        headers: {
          'User-Agent': error.userAgent,
        },
      },
      environment: error.environment || this.config.environment,
      release: error.release || this.config.release,
    };
  }

  private convertStackFrames(frames: StackFrame[]): SentryStackFrame[] {
    // Sentry expects frames in reverse order (most recent last)
    // ES2023+: Use toReversed() for non-mutating reverse
    return frames.toReversed().map((frame) => ({
      filename: frame.fileName || undefined,
      function: frame.functionName || undefined,
      lineno: frame.lineNumber ?? undefined,
      colno: frame.columnNumber ?? undefined,
      in_app: frame.inApp,
      context_line: frame.context?.line,
      pre_context: frame.context?.pre,
      post_context: frame.context?.post,
    }));
  }

  private convertBreadcrumbs(breadcrumbs: Breadcrumb[]): SentryBreadcrumb[] {
    return breadcrumbs.map((crumb) => ({
      type: crumb.type,
      category: crumb.category,
      message: crumb.message,
      level: crumb.level,
      timestamp: crumb.timestamp / 1000,
      data: crumb.data,
    }));
  }

  private convertSpansToTransaction(spans: Span[]): SentryTransaction {
    const sortedSpans = [...spans].sort((a, b) => a.startTime - b.startTime);
    const rootSpan = sortedSpans.find((s) => !s.parentSpanId) || sortedSpans[0];

    const minStart = Math.min(...spans.map((s) => s.startTime));
    const maxEnd = Math.max(...spans.map((s) => s.startTime + (s.duration || 0)));

    return {
      event_id: this.generateEventId(),
      type: 'transaction',
      transaction: rootSpan.name,
      start_timestamp: minStart / 1000,
      timestamp: maxEnd / 1000,
      contexts: {
        trace: {
          trace_id: rootSpan.traceId,
          span_id: rootSpan.spanId,
          parent_span_id: rootSpan.parentSpanId,
          op: this.mapSpanKindToOp(rootSpan.kind),
          status: this.mapStatusCode(rootSpan.status.code),
        },
      },
      spans: spans
        .filter((s) => s.spanId !== rootSpan.spanId)
        .map((span) => ({
          span_id: span.spanId,
          trace_id: span.traceId,
          parent_span_id: span.parentSpanId,
          op: this.mapSpanKindToOp(span.kind),
          description: span.name,
          start_timestamp: span.startTime / 1000,
          timestamp: (span.startTime + (span.duration || 0)) / 1000,
          status: this.mapStatusCode(span.status.code),
          tags: span.attributes as Record<string, string>,
        })),
      tags: this.config.tags,
      environment: this.config.environment,
      release: this.config.release,
    };
  }

  private mapSpanKindToOp(kind: string): string {
    const mapping: Record<string, string> = {
      internal: 'function',
      server: 'http.server',
      client: 'http.client',
      producer: 'queue.publish',
      consumer: 'queue.process',
    };
    return mapping[kind] || kind;
  }

  private mapStatusCode(code: string): string {
    const mapping: Record<string, string> = {
      ok: 'ok',
      error: 'internal_error',
      unset: 'unknown',
    };
    return mapping[code] || 'unknown';
  }

  private async sendEvent(event: SentryEvent | SentryTransaction): Promise<void> {
    const url = `https://${this.host}/api/${this.projectId}/envelope/`;

    // Create envelope
    const header = JSON.stringify({
      event_id: event.event_id,
      sent_at: new Date().toISOString(),
      dsn: this.config.dsn,
    });

    const itemType = 'type' in event && event.type === 'transaction' ? 'transaction' : 'event';
    const itemHeader = JSON.stringify({ type: itemType });
    const itemPayload = JSON.stringify(event);

    const envelope = `${header}\n${itemHeader}\n${itemPayload}`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=philjs-dashboard/1.0.0, sentry_key=${this.publicKey}`,
      },
      body: envelope,
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.flush().catch(console.error);
      }
    }, 5000);
  }

  private generateEventId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private getBrowserName(): string {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getDeviceFamily(): string {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSentryExporter(config: SentryConfig): SentryExporter {
  return new SentryExporter(config);
}
