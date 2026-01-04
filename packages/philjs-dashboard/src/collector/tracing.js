// @ts-nocheck
/**
 * Distributed Tracing Module
 * Provides span creation, trace context propagation, and OpenTelemetry compatibility
 */
// ============================================================================
// ID Generation
// ============================================================================
function generateTraceId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
function generateSpanId() {
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
    span;
    tracer;
    constructor(tracer, name, parentContext) {
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
    setKind(kind) {
        this.span.kind = kind;
        return this;
    }
    setAttribute(key, value) {
        this.span.attributes[key] = value;
        return this;
    }
    setAttributes(attributes) {
        Object.assign(this.span.attributes, attributes);
        return this;
    }
    addEvent(name, attributes) {
        this.span.events.push({
            name,
            timestamp: performance.now(),
            attributes,
        });
        return this;
    }
    addLink(traceId, spanId, attributes) {
        this.span.links.push({ traceId, spanId, attributes });
        return this;
    }
    setStatus(code, message) {
        this.span.status = { code, message };
        return this;
    }
    end() {
        this.span.endTime = performance.now();
        this.span.duration = this.span.endTime - this.span.startTime;
        this.tracer.recordSpan(this.span);
        return this.span;
    }
    getContext() {
        return {
            traceId: this.span.traceId,
            spanId: this.span.spanId,
            traceFlags: 1,
        };
    }
    getSpan() {
        return this.span;
    }
}
// ============================================================================
// Tracing Manager
// ============================================================================
export class TracingManager {
    config;
    spans = [];
    activeSpans = new Map();
    currentContext;
    constructor(config) {
        this.config = {
            serviceName: config.serviceName,
            serviceVersion: config.serviceVersion ?? '0.0.0',
            environment: config.environment ?? 'development',
            sampleRate: config.sampleRate ?? 1,
            maxSpans: config.maxSpans ?? 1000,
            enableW3CTraceContext: config.enableW3CTraceContext ?? true,
            autoInstrument: config.autoInstrument ?? false,
            onSpanEnd: config.onSpanEnd ?? (() => { }),
        };
        if (this.config.autoInstrument) {
            this.setupAutoInstrumentation();
        }
    }
    getConfig() {
        return this.config;
    }
    /**
     * Start a new span
     */
    startSpan(name, parentContext) {
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
    recordSpan(span) {
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
    getSpans() {
        return [...this.spans];
    }
    /**
     * Get spans for a specific trace
     */
    getTraceSpans(traceId) {
        return this.spans.filter((span) => span.traceId === traceId);
    }
    /**
     * Clear all recorded spans
     */
    clearSpans() {
        this.spans = [];
    }
    /**
     * Set the current trace context
     */
    setContext(context) {
        this.currentContext = context;
    }
    /**
     * Get the current trace context
     */
    getContext() {
        return this.currentContext;
    }
    /**
     * Run a function within a span context
     */
    async withSpan(name, fn, options) {
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
        }
        catch (error) {
            span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
        finally {
            span.end();
            this.currentContext = previousContext;
        }
    }
    /**
     * Run a sync function within a span context
     */
    withSpanSync(name, fn, options) {
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
        }
        catch (error) {
            span.setStatus('error', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
        finally {
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
    inject(headers) {
        if (!this.config.enableW3CTraceContext || !this.currentContext)
            return;
        const { traceId, spanId, traceFlags } = this.currentContext;
        headers['traceparent'] = `00-${traceId}-${spanId}-${traceFlags.toString(16).padStart(2, '0')}`;
        if (this.currentContext.traceState) {
            headers['tracestate'] = this.currentContext.traceState;
        }
    }
    /**
     * Extract trace context from headers
     */
    extract(headers) {
        if (!this.config.enableW3CTraceContext)
            return undefined;
        const traceparent = headers['traceparent'];
        if (!traceparent)
            return undefined;
        const match = traceparent.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/);
        if (!match)
            return undefined;
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
    getOTelTracer() {
        const manager = this;
        return {
            startSpan(name, _options, _context) {
                const spanBuilder = manager.startSpan(name);
                return {
                    spanContext() {
                        const ctx = spanBuilder.getContext();
                        return {
                            traceId: ctx.traceId,
                            spanId: ctx.spanId,
                            traceFlags: ctx.traceFlags,
                            isRemote: false,
                        };
                    },
                    setAttribute(key, value) {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            spanBuilder.setAttribute(key, value);
                        }
                        return this;
                    },
                    setAttributes(attributes) {
                        spanBuilder.setAttributes(attributes);
                        return this;
                    },
                    addEvent(name, attributes) {
                        spanBuilder.addEvent(name, attributes);
                        return this;
                    },
                    setStatus(status) {
                        const code = status.code === 2 ? 'error' : status.code === 1 ? 'ok' : 'unset';
                        spanBuilder.setStatus(code, status.message);
                        return this;
                    },
                    updateName(name) {
                        spanBuilder.getSpan().name = name;
                        return this;
                    },
                    end() {
                        spanBuilder.end();
                    },
                    isRecording() {
                        return true;
                    },
                    recordException() {
                        // Record exception as event
                    },
                    addLink() {
                        return this;
                    },
                };
            },
            startActiveSpan(name, fn) {
                const span = this.startSpan(name);
                try {
                    return fn(span);
                }
                finally {
                    span.end();
                }
            },
        };
    }
    /**
     * Create an OpenTelemetry-compatible TracerProvider
     */
    getOTelTracerProvider() {
        const manager = this;
        return {
            getTracer() {
                return manager.getOTelTracer();
            },
            forceFlush() {
                return Promise.resolve();
            },
            shutdown() {
                manager.clearSpans();
                return Promise.resolve();
            },
        };
    }
    // ============================================================================
    // Text Map Propagator (for OpenTelemetry compatibility)
    // ============================================================================
    getTextMapPropagator() {
        const manager = this;
        return {
            inject(context, carrier, setter) {
                const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, '0')}`;
                setter.set(carrier, 'traceparent', traceparent);
                if (context.traceState) {
                    setter.set(carrier, 'tracestate', context.traceState);
                }
            },
            extract(_context, carrier, getter) {
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
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }
    setupAutoInstrumentation() {
        if (typeof window === 'undefined')
            return;
        // Instrument fetch
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            return this.withSpan(`fetch ${url}`, async (span) => {
                span.setKind('client');
                span.setAttribute('http.method', init?.method ?? 'GET');
                span.setAttribute('http.url', url);
                // Inject trace context
                const headers = new Headers(init?.headers);
                const traceHeaders = {};
                this.inject(traceHeaders);
                Object.entries(traceHeaders).forEach(([key, value]) => {
                    headers.set(key, value);
                });
                const response = await originalFetch(input, { ...init, headers });
                span.setAttribute('http.status_code', response.status);
                span.setStatus(response.ok ? 'ok' : 'error');
                return response;
            });
        };
        // Instrument XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const manager = this;
        XMLHttpRequest.prototype.open = function (method, url, async, username, password) {
            this._tracingUrl = url.toString();
            this._tracingMethod = method;
            return originalXHROpen.call(this, method, url, async ?? true, username, password);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const xhr = this;
            const span = manager.startSpan(`xhr ${xhr._tracingUrl}`);
            span.setKind('client');
            span.setAttribute('http.method', xhr._tracingMethod);
            span.setAttribute('http.url', xhr._tracingUrl);
            // Inject trace context
            const traceHeaders = {};
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
let defaultTracer = null;
export function getTracingManager(config) {
    if (!defaultTracer) {
        if (!config) {
            throw new Error('TracingManager must be initialized with a config first');
        }
        defaultTracer = new TracingManager(config);
    }
    return defaultTracer;
}
export function initTracing(config) {
    if (defaultTracer) {
        console.warn('[Tracing] TracingManager already initialized, returning existing instance');
        return defaultTracer;
    }
    defaultTracer = new TracingManager(config);
    return defaultTracer;
}
export function resetTracing() {
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
export function trace(name, options) {
    return function (_target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const spanName = name ?? String(propertyKey);
        descriptor.value = async function (...args) {
            const tracer = getTracingManager();
            return tracer.withSpan(spanName, async (span) => {
                if (options?.kind)
                    span.setKind(options.kind);
                if (options?.attributes)
                    span.setAttributes(options.attributes);
                return originalMethod.apply(this, args);
            });
        };
        return descriptor;
    };
}
/**
 * Decorator to trace a sync method
 */
export function traceSync(name, options) {
    return function (_target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const spanName = name ?? String(propertyKey);
        descriptor.value = function (...args) {
            const tracer = getTracingManager();
            return tracer.withSpanSync(spanName, (span) => {
                if (options?.kind)
                    span.setKind(options.kind);
                if (options?.attributes)
                    span.setAttributes(options.attributes);
                return originalMethod.apply(this, args);
            });
        };
        return descriptor;
    };
}
//# sourceMappingURL=tracing.js.map