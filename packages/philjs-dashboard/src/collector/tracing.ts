/**
 * Distributed Tracing Module
 * Provides span creation, trace context propagation, and OpenTelemetry compatibility
 */

import type {
  Span as OTelSpan,
  SpanContext,
  SpanStatus,
  Tracer,
  TracerProvider,
  Context,
  TextMapGetter,
  TextMapSetter,
} from '@opentelemetry/api';

// ============================================================================
// Types
// ============================================================================

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export type SpanStatusCode = 'unset' | 'ok' | 'error';

export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: SpanAttributes;
}

export interface Span {
  /** Unique span identifier */
  spanId: string;
  /** Trace identifier */
  traceId: string;
  /** Parent span ID (if any) */
  parentSpanId?: string;
  /** Span name/operation */
  name: string;
  /** Span kind */
  kind: SpanKind;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Span attributes */
  attributes: SpanAttributes;
  /** Span events */
  events: SpanEvent[];
  /** Links to other spans */
  links: SpanLink[];
  /** Span status */
  status: {
    code: SpanStatusCode;
    message?: string;
  };
  /** Resource information */
  resource: {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
  };
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

export interface TracingConfig {
  /** Service name for this application */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Environment (production, staging, development) */
  environment?: string;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Maximum spans to keep in memory */
  maxSpans?: number;
  /** Enable W3C Trace Context propagation */
  enableW3CTraceContext?: boolean;
  /** Enable automatic instrumentation */
  autoInstrument?: boolean;
  /** Callback when a span is completed */
  onSpanEnd?: (span: Span) => void;
}

// ============================================================================
// ID Generation
// ============================================================================

function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// Span Builder
// ============================================================================

export class SpanBuilder {
  private span: Span;
  private tracer: TracingManager;

  constructor(tracer: TracingManager, name: string, parentContext?: TraceContext) {
    this.tracer = tracer;
    this.span = {
      spanId: generateSpanId(),
      traceId: parentContext?.traceId ?? generateTraceId(),
      parentSpanId: parentContext?.spanId,
      name,
      kind: 'internal',
      startTime: performance.now(),
      attributes: {},
      events: [],
      links: [],
      status: { code: 'unset' },
      resource: {
        serviceName: tracer.getConfig().serviceName,
        serviceVersion: tracer.getConfig().serviceVersion,
        environment: tracer.getConfig().environment,
      },
    };
  }

  setKind(kind: SpanKind): SpanBuilder {
    this.span.kind = kind;
    return this;
  }

  setAttribute(key: string, value: string | number | boolean): SpanBuilder {
    this.span.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: SpanAttributes): SpanBuilder {
    Object.assign(this.span.attributes, attributes);
    return this;
  }

  addEvent(name: string, attributes?: SpanAttributes): SpanBuilder {
    this.span.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
    return this;
  }

  addLink(traceId: string, spanId: string, attributes?: SpanAttributes): SpanBuilder {
    this.span.links.push({ traceId, spanId, attributes });
    return this;
  }

  setStatus(code: SpanStatusCode, message?: string): SpanBuilder {
    this.span.status = { code, message };
    return this;
  }

  end(): Span {
    this.span.endTime = performance.now();
    this.span.duration = this.span.endTime - this.span.startTime;
    this.tracer.recordSpan(this.span);
    return this.span;
  }

  getContext(): TraceContext {
    return {
      traceId: this.span.traceId,
      spanId: this.span.spanId,
      traceFlags: 1,
    };
  }

  getSpan(): Span {
    return this.span;
  }
}

// ============================================================================
// Tracing Manager
// ============================================================================

export class TracingManager {
  private config: Required<TracingConfig>;
  private spans: Span[] = [];
  private activeSpans: Map<string, SpanBuilder> = new Map();
  private currentContext: TraceContext | undefined;

  constructor(config: TracingConfig) {
    this.config = {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion ?? '0.0.0',
      environment: config.environment ?? 'development',
      sampleRate: config.sampleRate ?? 1,
      maxSpans: config.maxSpans ?? 1000,
      enableW3CTraceContext: config.enableW3CTraceContext ?? true,
      autoInstrument: config.autoInstrument ?? false,
      onSpanEnd: config.onSpanEnd ?? (() => {}),
    };

    if (this.config.autoInstrument) {
      this.setupAutoInstrumentation();
    }
  }

  getConfig(): Required<TracingConfig> {
    return this.config;
  }

  /**
   * Start a new span
   */
  startSpan(name: string, parentContext?: TraceContext): SpanBuilder {
    if (!this.shouldSample()) {
      return new SpanBuilder(this, name, parentContext);
    }

    const context = parentContext ?? this.currentContext;
    const spanBuilder = new SpanBuilder(this, name, context);
    this.activeSpans.set(spanBuilder.getSpan().spanId, spanBuilder);
    return spanBuilder;
  }

  /**
   * Record a completed span
   */
  recordSpan(span: Span): void {
    this.spans.push(span);
    this.activeSpans.delete(span.spanId);

    // Trim old spans
    if (this.spans.length > this.config.maxSpans) {
      this.spans = this.spans.slice(-this.config.maxSpans);
    }

    this.config.onSpanEnd(span);
  }

  /**
   * Get all recorded spans
   */
  getSpans(): Span[] {
    return [...this.spans];
  }

  /**
   * Get spans for a specific trace
   */
  getTraceSpans(traceId: string): Span[] {
    return this.spans.filter((span) => span.traceId === traceId);
  }

  /**
   * Clear all recorded spans
   */
  clearSpans(): void {
    this.spans = [];
  }

  /**
   * Set the current trace context
   */
  setContext(context: TraceContext | undefined): void {
    this.currentContext = context;
  }

  /**
   * Get the current trace context
   */
  getContext(): TraceContext | undefined {
    return this.currentContext;
  }

  /**
   * Run a function within a span context
   */
  async withSpan<T>(
    name: string,
    fn: (span: SpanBuilder) => Promise<T>,
    options?: { kind?: SpanKind; attributes?: SpanAttributes }
  ): Promise<T> {
    const span = this.startSpan(name);

    if (options?.kind) {
      span.setKind(options.kind);
    }

    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }

    const previousContext = this.currentContext;
    this.currentContext = span.getContext();

    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      span.end();
      this.currentContext = previousContext;
    }
  }

  /**
   * Run a sync function within a span context
   */
  withSpanSync<T>(
    name: string,
    fn: (span: SpanBuilder) => T,
    options?: { kind?: SpanKind; attributes?: SpanAttributes }
  ): T {
    const span = this.startSpan(name);

    if (options?.kind) {
      span.setKind(options.kind);
    }

    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }

    const previousContext = this.currentContext;
    this.currentContext = span.getContext();

    try {
      const result = fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      span.end();
      this.currentContext = previousContext;
    }
  }

  // ============================================================================
  // W3C Trace Context Propagation
  // ============================================================================

  /**
   * Inject trace context into headers
   */
  inject(headers: Record<string, string>): void {
    if (!this.config.enableW3CTraceContext || !this.currentContext) return;

    const { traceId, spanId, traceFlags } = this.currentContext;
    headers['traceparent'] = `00-${traceId}-${spanId}-${traceFlags.toString(16).padStart(2, '0')}`;

    if (this.currentContext.traceState) {
      headers['tracestate'] = this.currentContext.traceState;
    }
  }

  /**
   * Extract trace context from headers
   */
  extract(headers: Record<string, string | undefined>): TraceContext | undefined {
    if (!this.config.enableW3CTraceContext) return undefined;

    const traceparent = headers['traceparent'];
    if (!traceparent) return undefined;

    const match = traceparent.match(
      /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/
    );

    if (!match) return undefined;

    return {
      traceId: match[1],
      spanId: match[2],
      traceFlags: parseInt(match[3], 16),
      traceState: headers['tracestate'],
    };
  }

  // ============================================================================
  // OpenTelemetry Compatibility
  // ============================================================================

  /**
   * Create an OpenTelemetry-compatible tracer
   */
  getOTelTracer(): Tracer {
    const manager = this;

    return {
      startSpan(name: string, _options?: unknown, _context?: Context): OTelSpan {
        const spanBuilder = manager.startSpan(name);

        return {
          spanContext(): SpanContext {
            const ctx = spanBuilder.getContext();
            return {
              traceId: ctx.traceId,
              spanId: ctx.spanId,
              traceFlags: ctx.traceFlags,
              isRemote: false,
            };
          },
          setAttribute(key: string, value: unknown): OTelSpan {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              spanBuilder.setAttribute(key, value);
            }
            return this;
          },
          setAttributes(attributes: SpanAttributes): OTelSpan {
            spanBuilder.setAttributes(attributes);
            return this;
          },
          addEvent(name: string, attributes?: SpanAttributes): OTelSpan {
            spanBuilder.addEvent(name, attributes);
            return this;
          },
          setStatus(status: SpanStatus): OTelSpan {
            const code = status.code === 2 ? 'error' : status.code === 1 ? 'ok' : 'unset';
            spanBuilder.setStatus(code, status.message);
            return this;
          },
          updateName(name: string): OTelSpan {
            spanBuilder.getSpan().name = name;
            return this;
          },
          end(): void {
            spanBuilder.end();
          },
          isRecording(): boolean {
            return true;
          },
          recordException(): void {
            // Record exception as event
          },
          addLink(): OTelSpan {
            return this;
          },
        } as OTelSpan;
      },
      startActiveSpan<F extends (span: OTelSpan) => unknown>(
        name: string,
        fn: F
      ): ReturnType<F> {
        const span = this.startSpan(name);
        try {
          return fn(span) as ReturnType<F>;
        } finally {
          span.end();
        }
      },
    } as Tracer;
  }

  /**
   * Create an OpenTelemetry-compatible TracerProvider
   */
  getOTelTracerProvider(): TracerProvider {
    const manager = this;

    return {
      getTracer(): Tracer {
        return manager.getOTelTracer();
      },
      forceFlush(): Promise<void> {
        return Promise.resolve();
      },
      shutdown(): Promise<void> {
        manager.clearSpans();
        return Promise.resolve();
      },
    } as TracerProvider;
  }

  // ============================================================================
  // Text Map Propagator (for OpenTelemetry compatibility)
  // ============================================================================

  getTextMapPropagator(): {
    inject: (context: TraceContext, carrier: Record<string, string>, setter: TextMapSetter<Record<string, string>>) => void;
    extract: (context: unknown, carrier: Record<string, string | undefined>, getter: TextMapGetter<Record<string, string | undefined>>) => TraceContext | undefined;
  } {
    const manager = this;

    return {
      inject(
        context: TraceContext,
        carrier: Record<string, string>,
        setter: TextMapSetter<Record<string, string>>
      ): void {
        const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, '0')}`;
        setter.set(carrier, 'traceparent', traceparent);

        if (context.traceState) {
          setter.set(carrier, 'tracestate', context.traceState);
        }
      },
      extract(
        _context: unknown,
        carrier: Record<string, string | undefined>,
        getter: TextMapGetter<Record<string, string | undefined>>
      ): TraceContext | undefined {
        return manager.extract({
          traceparent: getter.get(carrier, 'traceparent'),
          tracestate: getter.get(carrier, 'tracestate'),
        });
      },
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private setupAutoInstrumentation(): void {
    if (typeof window === 'undefined') return;

    // Instrument fetch
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      return this.withSpan(
        `fetch ${url}`,
        async (span) => {
          span.setKind('client');
          span.setAttribute('http.method', init?.method ?? 'GET');
          span.setAttribute('http.url', url);

          // Inject trace context
          const headers = new Headers(init?.headers);
          const traceHeaders: Record<string, string> = {};
          this.inject(traceHeaders);
          Object.entries(traceHeaders).forEach(([key, value]) => {
            headers.set(key, value);
          });

          const response = await originalFetch(input, { ...init, headers });

          span.setAttribute('http.status_code', response.status);
          span.setStatus(response.ok ? 'ok' : 'error');

          return response;
        }
      );
    };

    // Instrument XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const manager = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      (this as XMLHttpRequest & { _tracingUrl: string; _tracingMethod: string })._tracingUrl = url.toString();
      (this as XMLHttpRequest & { _tracingMethod: string })._tracingMethod = method;
      return originalXHROpen.call(this, method, url, async ?? true, username, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this as XMLHttpRequest & { _tracingUrl: string; _tracingMethod: string };
      const span = manager.startSpan(`xhr ${xhr._tracingUrl}`);
      span.setKind('client');
      span.setAttribute('http.method', xhr._tracingMethod);
      span.setAttribute('http.url', xhr._tracingUrl);

      // Inject trace context
      const traceHeaders: Record<string, string> = {};
      manager.inject(traceHeaders);
      Object.entries(traceHeaders).forEach(([key, value]) => {
        this.setRequestHeader(key, value);
      });

      this.addEventListener('loadend', () => {
        span.setAttribute('http.status_code', this.status);
        span.setStatus(this.status >= 200 && this.status < 300 ? 'ok' : 'error');
        span.end();
      });

      return originalXHRSend.call(this, body);
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultTracer: TracingManager | null = null;

export function getTracingManager(config?: TracingConfig): TracingManager {
  if (!defaultTracer) {
    if (!config) {
      throw new Error('TracingManager must be initialized with a config first');
    }
    defaultTracer = new TracingManager(config);
  }
  return defaultTracer;
}

export function initTracing(config: TracingConfig): TracingManager {
  if (defaultTracer) {
    console.warn('[Tracing] TracingManager already initialized, returning existing instance');
    return defaultTracer;
  }
  defaultTracer = new TracingManager(config);
  return defaultTracer;
}

export function resetTracing(): void {
  if (defaultTracer) {
    defaultTracer.clearSpans();
    defaultTracer = null;
  }
}

// ============================================================================
// Decorators (for class methods)
// ============================================================================

/**
 * Decorator to trace a method
 */
export function trace(
  name?: string,
  options?: { kind?: SpanKind; attributes?: SpanAttributes }
): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const spanName = name ?? String(propertyKey);

    descriptor.value = async function (...args: unknown[]) {
      const tracer = getTracingManager();
      return tracer.withSpan(spanName, async (span) => {
        if (options?.kind) span.setKind(options.kind);
        if (options?.attributes) span.setAttributes(options.attributes);
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

/**
 * Decorator to trace a sync method
 */
export function traceSync(
  name?: string,
  options?: { kind?: SpanKind; attributes?: SpanAttributes }
): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const spanName = name ?? String(propertyKey);

    descriptor.value = function (...args: unknown[]) {
      const tracer = getTracingManager();
      return tracer.withSpanSync(spanName, (span) => {
        if (options?.kind) span.setKind(options.kind);
        if (options?.attributes) span.setAttributes(options.attributes);
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
