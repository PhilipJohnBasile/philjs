/**
 * Sentry Integration
 * Export metrics, traces, and errors to Sentry
 */
// ============================================================================
// Sentry Exporter
// ============================================================================
export class SentryExporter {
    config;
    projectId;
    publicKey;
    host;
    queue = [];
    flushTimer = null;
    isDestroyed = false;
    constructor(config) {
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
    async exportError(error) {
        if (this.isDestroyed)
            return;
        if (Math.random() >= this.config.errorSampleRate)
            return;
        let event = this.convertErrorToEvent(error);
        event = this.config.beforeSend(event);
        if (event) {
            this.queue.push(event);
        }
    }
    /**
     * Export a trace to Sentry
     */
    async exportTrace(spans) {
        if (this.isDestroyed)
            return;
        if (!this.config.enablePerformance)
            return;
        if (Math.random() >= this.config.tracesSampleRate)
            return;
        if (spans.length === 0)
            return;
        let transaction = this.convertSpansToTransaction(spans);
        transaction = this.config.beforeSendTransaction(transaction);
        if (transaction) {
            this.queue.push(transaction);
        }
    }
    /**
     * Export Web Vitals to Sentry
     */
    async exportWebVitals(webVitals, traceContext) {
        if (this.isDestroyed)
            return;
        if (!this.config.enablePerformance)
            return;
        // Create a transaction with Web Vitals measurements
        const transaction = {
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
            transaction.measurements['lcp'] = { value: webVitals.lcp, unit: 'millisecond' };
        }
        if (webVitals.fid !== null) {
            transaction.measurements['fid'] = { value: webVitals.fid, unit: 'millisecond' };
        }
        if (webVitals.cls !== null) {
            transaction.measurements['cls'] = { value: webVitals.cls, unit: 'none' };
        }
        if (webVitals.fcp !== null) {
            transaction.measurements['fcp'] = { value: webVitals.fcp, unit: 'millisecond' };
        }
        if (webVitals.ttfb !== null) {
            transaction.measurements['ttfb'] = { value: webVitals.ttfb, unit: 'millisecond' };
        }
        if (webVitals.inp !== null) {
            transaction.measurements['inp'] = { value: webVitals.inp, unit: 'millisecond' };
        }
        const filtered = this.config.beforeSendTransaction(transaction);
        if (filtered) {
            this.queue.push(filtered);
        }
    }
    /**
     * Capture a message
     */
    async captureMessage(message, level = 'info') {
        if (this.isDestroyed)
            return;
        const event = {
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
    async flush() {
        if (this.queue.length === 0)
            return;
        const events = [...this.queue];
        this.queue = [];
        // Send events using Sentry envelope format
        for (const event of events) {
            try {
                await this.sendEvent(event);
            }
            catch (error) {
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
    destroy() {
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
    parseDsn(dsn) {
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
    convertErrorToEvent(error) {
        const event = {
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
            request: {
                url: error.url,
                headers: {
                    'User-Agent': error.userAgent,
                },
            },
            environment: error.environment || this.config.environment,
            release: error.release || this.config.release,
        };
        if (error.user) {
            const user = {};
            if (error.user.id !== undefined)
                user.id = error.user.id;
            if (error.user.username !== undefined)
                user.username = error.user.username;
            if (error.user.email !== undefined)
                user.email = error.user.email;
            if (error.user.ipAddress !== undefined)
                user.ip_address = error.user.ipAddress;
            event.user = user;
        }
        return event;
    }
    convertStackFrames(frames) {
        // Sentry expects frames in reverse order (most recent last)
        // ES2023+: Use toReversed() for non-mutating reverse
        return frames.toReversed().map((frame) => {
            const sentryFrame = {
                in_app: frame.inApp,
            };
            if (frame.fileName)
                sentryFrame.filename = frame.fileName;
            if (frame.functionName)
                sentryFrame.function = frame.functionName;
            if (frame.lineNumber !== null)
                sentryFrame.lineno = frame.lineNumber;
            if (frame.columnNumber !== null)
                sentryFrame.colno = frame.columnNumber;
            if (frame.context?.line)
                sentryFrame.context_line = frame.context.line;
            if (frame.context?.pre)
                sentryFrame.pre_context = frame.context.pre;
            if (frame.context?.post)
                sentryFrame.post_context = frame.context.post;
            return sentryFrame;
        });
    }
    convertBreadcrumbs(breadcrumbs) {
        return breadcrumbs.map((crumb) => {
            const sentryBreadcrumb = {
                type: crumb.type,
                category: crumb.category,
                message: crumb.message,
                level: crumb.level,
                timestamp: crumb.timestamp / 1000,
            };
            if (crumb.data !== undefined)
                sentryBreadcrumb.data = crumb.data;
            return sentryBreadcrumb;
        });
    }
    convertSpansToTransaction(spans) {
        const sortedSpans = [...spans].sort((a, b) => a.startTime - b.startTime);
        const rootSpan = (sortedSpans.find((s) => !s.parentSpanId) || sortedSpans[0]);
        const minStart = Math.min(...spans.map((s) => s.startTime));
        const maxEnd = Math.max(...spans.map((s) => s.startTime + (s.duration || 0)));
        const traceContext = {
            trace_id: rootSpan.traceId,
            span_id: rootSpan.spanId,
            op: this.mapSpanKindToOp(rootSpan.kind),
            status: this.mapStatusCode(rootSpan.status.code),
        };
        if (rootSpan.parentSpanId !== undefined)
            traceContext.parent_span_id = rootSpan.parentSpanId;
        return {
            event_id: this.generateEventId(),
            type: 'transaction',
            transaction: rootSpan.name,
            start_timestamp: minStart / 1000,
            timestamp: maxEnd / 1000,
            contexts: {
                trace: traceContext,
            },
            spans: spans
                .filter((s) => s.spanId !== rootSpan.spanId)
                .map((span) => {
                const sentrySpan = {
                    span_id: span.spanId,
                    trace_id: span.traceId,
                    op: this.mapSpanKindToOp(span.kind),
                    description: span.name,
                    start_timestamp: span.startTime / 1000,
                    timestamp: (span.startTime + (span.duration || 0)) / 1000,
                    status: this.mapStatusCode(span.status.code),
                    tags: span.attributes,
                };
                if (span.parentSpanId !== undefined)
                    sentrySpan.parent_span_id = span.parentSpanId;
                return sentrySpan;
            }),
            tags: this.config.tags,
            environment: this.config.environment,
            release: this.config.release,
        };
    }
    mapSpanKindToOp(kind) {
        const mapping = {
            internal: 'function',
            server: 'http.server',
            client: 'http.client',
            producer: 'queue.publish',
            consumer: 'queue.process',
        };
        return mapping[kind] || kind;
    }
    mapStatusCode(code) {
        const mapping = {
            ok: 'ok',
            error: 'internal_error',
            unset: 'unknown',
        };
        return mapping[code] || 'unknown';
    }
    async sendEvent(event) {
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
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            if (!this.isDestroyed) {
                this.flush().catch(console.error);
            }
        }, 5000);
    }
    generateEventId() {
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    generateTraceId() {
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    generateSpanId() {
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    getBrowserName() {
        if (typeof navigator === 'undefined')
            return 'Unknown';
        const ua = navigator.userAgent;
        if (ua.includes('Chrome'))
            return 'Chrome';
        if (ua.includes('Firefox'))
            return 'Firefox';
        if (ua.includes('Safari'))
            return 'Safari';
        if (ua.includes('Edge'))
            return 'Edge';
        return 'Unknown';
    }
    getDeviceFamily() {
        if (typeof navigator === 'undefined')
            return 'Unknown';
        const ua = navigator.userAgent;
        if (ua.includes('Mobile'))
            return 'Mobile';
        if (ua.includes('Tablet'))
            return 'Tablet';
        return 'Desktop';
    }
}
// ============================================================================
// Factory Function
// ============================================================================
export function createSentryExporter(config) {
    return new SentryExporter(config);
}
//# sourceMappingURL=sentry.js.map