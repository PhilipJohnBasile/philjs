/**
 * Distributed Tracing Module
 * Provides span creation, trace context propagation, and OpenTelemetry compatibility
 */
import type { Tracer, TracerProvider, TextMapGetter, TextMapSetter } from '@opentelemetry/api';
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
export declare class SpanBuilder {
    private span;
    private tracer;
    constructor(tracer: TracingManager, name: string, parentContext?: TraceContext);
    setKind(kind: SpanKind): SpanBuilder;
    setAttribute(key: string, value: string | number | boolean): SpanBuilder;
    setAttributes(attributes: SpanAttributes): SpanBuilder;
    addEvent(name: string, attributes?: SpanAttributes): SpanBuilder;
    addLink(traceId: string, spanId: string, attributes?: SpanAttributes): SpanBuilder;
    setStatus(code: SpanStatusCode, message?: string): SpanBuilder;
    end(): Span;
    getContext(): TraceContext;
    getSpan(): Span;
}
export declare class TracingManager {
    private config;
    private spans;
    private activeSpans;
    private currentContext;
    constructor(config: TracingConfig);
    getConfig(): Required<TracingConfig>;
    /**
     * Start a new span
     */
    startSpan(name: string, parentContext?: TraceContext): SpanBuilder;
    /**
     * Record a completed span
     */
    recordSpan(span: Span): void;
    /**
     * Get all recorded spans
     */
    getSpans(): Span[];
    /**
     * Get spans for a specific trace
     */
    getTraceSpans(traceId: string): Span[];
    /**
     * Clear all recorded spans
     */
    clearSpans(): void;
    /**
     * Set the current trace context
     */
    setContext(context: TraceContext | undefined): void;
    /**
     * Get the current trace context
     */
    getContext(): TraceContext | undefined;
    /**
     * Run a function within a span context
     */
    withSpan<T>(name: string, fn: (span: SpanBuilder) => Promise<T>, options?: {
        kind?: SpanKind;
        attributes?: SpanAttributes;
    }): Promise<T>;
    /**
     * Run a sync function within a span context
     */
    withSpanSync<T>(name: string, fn: (span: SpanBuilder) => T, options?: {
        kind?: SpanKind;
        attributes?: SpanAttributes;
    }): T;
    /**
     * Inject trace context into headers
     */
    inject(headers: Record<string, string>): void;
    /**
     * Extract trace context from headers
     */
    extract(headers: Record<string, string | undefined>): TraceContext | undefined;
    /**
     * Create an OpenTelemetry-compatible tracer
     */
    getOTelTracer(): Tracer;
    /**
     * Create an OpenTelemetry-compatible TracerProvider
     */
    getOTelTracerProvider(): TracerProvider;
    getTextMapPropagator(): {
        inject: (context: TraceContext, carrier: Record<string, string>, setter: TextMapSetter<Record<string, string>>) => void;
        extract: (context: unknown, carrier: Record<string, string | undefined>, getter: TextMapGetter<Record<string, string | undefined>>) => TraceContext | undefined;
    };
    private shouldSample;
    private setupAutoInstrumentation;
}
export declare function getTracingManager(config?: TracingConfig): TracingManager;
export declare function initTracing(config: TracingConfig): TracingManager;
export declare function resetTracing(): void;
/**
 * Decorator to trace a method
 */
export declare function trace(name?: string, options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
}): MethodDecorator;
/**
 * Decorator to trace a sync method
 */
export declare function traceSync(name?: string, options?: {
    kind?: SpanKind;
    attributes?: SpanAttributes;
}): MethodDecorator;
//# sourceMappingURL=tracing.d.ts.map