/**
 * Grafana Integration
 * Export metrics to Grafana Cloud or self-hosted Grafana/Prometheus
 */
// ============================================================================
// Prometheus Remote Write Format
// ============================================================================
/**
 * Encodes metrics into Prometheus remote write format
 * This is a simplified implementation - production use should use protobuf
 */
function encodePrometheusTimeSeries(timeseries) {
    // For simplicity, we'll use the text-based format
    // In production, you'd want to use protobuf with snappy compression
    const lines = [];
    for (const ts of timeseries) {
        const labelPairs = Object.entries(ts.labels)
            .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
            .join(',');
        for (const sample of ts.samples) {
            lines.push(`{${labelPairs}} ${sample.value} ${sample.timestamp}`);
        }
    }
    return lines.join('\n');
}
function escapeLabel(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}
// ============================================================================
// Grafana Exporter
// ============================================================================
export class GrafanaExporter {
    config;
    metricsQueue = [];
    logsQueue = [];
    tracesQueue = [];
    flushTimer = null;
    isDestroyed = false;
    constructor(config) {
        this.config = {
            prometheusUrl: config.prometheusUrl ?? '',
            lokiUrl: config.lokiUrl ?? '',
            tempoUrl: config.tempoUrl ?? '',
            apiKey: config.apiKey ?? '',
            username: config.username ?? '',
            password: config.password ?? '',
            job: config.job ?? 'philjs-dashboard',
            instance: config.instance ?? 'browser',
            labels: config.labels ?? {},
            flushInterval: config.flushInterval ?? 15000,
            compression: config.compression ?? false,
        };
        this.startFlushTimer();
    }
    // ============================================================================
    // Metrics Export (Prometheus)
    // ============================================================================
    /**
     * Export Web Vitals as Prometheus metrics
     */
    exportWebVitals(webVitals) {
        if (this.isDestroyed)
            return;
        if (!this.config.prometheusUrl)
            return;
        const timestamp = Date.now();
        const baseLabels = this.getBaseLabels();
        const metrics = [
            { name: 'web_vitals_lcp_milliseconds', value: webVitals.lcp, help: 'Largest Contentful Paint' },
            { name: 'web_vitals_fid_milliseconds', value: webVitals.fid, help: 'First Input Delay' },
            { name: 'web_vitals_cls', value: webVitals.cls, help: 'Cumulative Layout Shift' },
            { name: 'web_vitals_fcp_milliseconds', value: webVitals.fcp, help: 'First Contentful Paint' },
            { name: 'web_vitals_ttfb_milliseconds', value: webVitals.ttfb, help: 'Time to First Byte' },
            { name: 'web_vitals_inp_milliseconds', value: webVitals.inp, help: 'Interaction to Next Paint' },
        ];
        for (const metric of metrics) {
            if (metric.value !== null) {
                this.metricsQueue.push({
                    labels: {
                        __name__: metric.name,
                        ...baseLabels,
                    },
                    samples: [{ timestamp, value: metric.value }],
                });
            }
        }
    }
    /**
     * Export custom metrics
     */
    exportCustomMetrics(customMetrics) {
        if (this.isDestroyed)
            return;
        if (!this.config.prometheusUrl)
            return;
        const timestamp = Date.now();
        const baseLabels = this.getBaseLabels();
        for (const metric of customMetrics) {
            const labels = {
                __name__: this.sanitizeMetricName(metric.name),
                unit: metric.unit,
                ...baseLabels,
            };
            if (metric.tags) {
                Object.assign(labels, metric.tags);
            }
            this.metricsQueue.push({
                labels,
                samples: [{ timestamp, value: metric.value }],
            });
        }
    }
    /**
     * Export a full metrics snapshot
     */
    exportMetricsSnapshot(snapshot) {
        this.exportWebVitals(snapshot.webVitals);
        if (snapshot.customMetrics.length > 0) {
            this.exportCustomMetrics(snapshot.customMetrics);
        }
        if (snapshot.memory) {
            const timestamp = Date.now();
            const baseLabels = this.getBaseLabels();
            this.metricsQueue.push({
                labels: { __name__: 'browser_memory_used_heap_bytes', ...baseLabels },
                samples: [{ timestamp, value: snapshot.memory.usedJSHeapSize }],
            }, {
                labels: { __name__: 'browser_memory_total_heap_bytes', ...baseLabels },
                samples: [{ timestamp, value: snapshot.memory.totalJSHeapSize }],
            }, {
                labels: { __name__: 'browser_memory_heap_utilization_percent', ...baseLabels },
                samples: [{ timestamp, value: snapshot.memory.heapUtilization }],
            });
        }
        if (snapshot.cpu) {
            const timestamp = Date.now();
            const baseLabels = this.getBaseLabels();
            this.metricsQueue.push({
                labels: { __name__: 'browser_cpu_total_blocking_time_milliseconds', ...baseLabels },
                samples: [{ timestamp, value: snapshot.cpu.totalBlockingTime }],
            });
        }
    }
    /**
     * Export a gauge metric
     */
    gauge(name, value, labels) {
        if (this.isDestroyed)
            return;
        if (!this.config.prometheusUrl)
            return;
        this.metricsQueue.push({
            labels: {
                __name__: this.sanitizeMetricName(name),
                ...this.getBaseLabels(),
                ...labels,
            },
            samples: [{ timestamp: Date.now(), value }],
        });
    }
    /**
     * Export a counter increment
     */
    counter(name, increment = 1, labels) {
        if (this.isDestroyed)
            return;
        if (!this.config.prometheusUrl)
            return;
        this.metricsQueue.push({
            labels: {
                __name__: this.sanitizeMetricName(name),
                ...this.getBaseLabels(),
                ...labels,
            },
            samples: [{ timestamp: Date.now(), value: increment }],
        });
    }
    /**
     * Export a histogram observation
     */
    histogram(name, value, buckets = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000], labels) {
        if (this.isDestroyed)
            return;
        if (!this.config.prometheusUrl)
            return;
        const timestamp = Date.now();
        const baseLabels = { ...this.getBaseLabels(), ...labels };
        const sanitizedName = this.sanitizeMetricName(name);
        // Create bucket metrics
        for (const bucket of buckets) {
            this.metricsQueue.push({
                labels: {
                    __name__: `${sanitizedName}_bucket`,
                    le: String(bucket),
                    ...baseLabels,
                },
                samples: [{ timestamp, value: value <= bucket ? 1 : 0 }],
            });
        }
        // +Inf bucket
        this.metricsQueue.push({
            labels: {
                __name__: `${sanitizedName}_bucket`,
                le: '+Inf',
                ...baseLabels,
            },
            samples: [{ timestamp, value: 1 }],
        });
        // Sum and count
        this.metricsQueue.push({
            labels: { __name__: `${sanitizedName}_sum`, ...baseLabels },
            samples: [{ timestamp, value }],
        }, {
            labels: { __name__: `${sanitizedName}_count`, ...baseLabels },
            samples: [{ timestamp, value: 1 }],
        });
    }
    // ============================================================================
    // Logs Export (Loki)
    // ============================================================================
    /**
     * Export a log entry to Loki
     */
    log(message, level = 'info', labels) {
        if (this.isDestroyed)
            return;
        if (!this.config.lokiUrl)
            return;
        const streamLabels = {
            job: this.config.job,
            instance: this.config.instance,
            level,
            ...this.config.labels,
            ...labels,
        };
        const timestamp = String(Date.now() * 1000000); // nanoseconds
        // Find existing stream or create new one
        const existingStream = this.logsQueue.find((s) => JSON.stringify(s.stream) === JSON.stringify(streamLabels));
        if (existingStream) {
            existingStream.values.push([timestamp, message]);
        }
        else {
            this.logsQueue.push({
                stream: streamLabels,
                values: [[timestamp, message]],
            });
        }
    }
    /**
     * Export an error to Loki
     */
    logError(error, context, labels) {
        const message = JSON.stringify({
            error: error.name,
            message: error.message,
            stack: error.stack,
            context,
        });
        this.log(message, 'error', labels);
    }
    // ============================================================================
    // Traces Export (Tempo)
    // ============================================================================
    /**
     * Export spans to Tempo
     */
    exportTrace(spans) {
        if (this.isDestroyed)
            return;
        if (!this.config.tempoUrl)
            return;
        for (const span of spans) {
            const tempoSpan = {
                traceId: span.traceId,
                spanId: span.spanId,
                operationName: span.name,
                serviceName: span.resource.serviceName,
                startTime: span.startTime * 1000, // microseconds
                duration: (span.duration || 0) * 1000, // microseconds
                tags: [
                    { key: 'span.kind', type: 'string', value: span.kind },
                    { key: 'status.code', type: 'string', value: span.status.code },
                    ...Object.entries(span.attributes).map(([key, value]) => ({
                        key,
                        type: typeof value === 'number' ? 'int64' : typeof value === 'boolean' ? 'bool' : 'string',
                        value: value,
                    })),
                ],
                ...(span.parentSpanId !== undefined && { parentSpanId: span.parentSpanId }),
                logs: span.events.map((event) => ({
                    timestamp: event.timestamp * 1000,
                    fields: [
                        { key: 'event', type: 'string', value: event.name },
                        ...Object.entries(event.attributes || {}).map(([key, value]) => ({
                            key,
                            type: 'string',
                            value: String(value),
                        })),
                    ],
                })),
            };
            this.tracesQueue.push(tempoSpan);
        }
    }
    // ============================================================================
    // Flush and Lifecycle
    // ============================================================================
    /**
     * Flush all queued data
     */
    async flush() {
        const promises = [];
        if (this.metricsQueue.length > 0 && this.config.prometheusUrl) {
            const metrics = [...this.metricsQueue];
            this.metricsQueue = [];
            promises.push(this.sendMetrics(metrics));
        }
        if (this.logsQueue.length > 0 && this.config.lokiUrl) {
            const logs = [...this.logsQueue];
            this.logsQueue = [];
            promises.push(this.sendLogs(logs));
        }
        if (this.tracesQueue.length > 0 && this.config.tempoUrl) {
            const traces = [...this.tracesQueue];
            this.tracesQueue = [];
            promises.push(this.sendTraces(traces));
        }
        await Promise.all(promises);
    }
    /**
     * Destroy the exporter
     */
    async destroy() {
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
    getBaseLabels() {
        return {
            job: this.config.job,
            instance: this.config.instance,
            ...this.config.labels,
        };
    }
    sanitizeMetricName(name) {
        // Prometheus metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
        return name
            .replace(/[^a-zA-Z0-9_:]/g, '_')
            .replace(/^[0-9]/, '_$&');
    }
    getAuthHeaders() {
        const headers = {};
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        else if (this.config.username && this.config.password) {
            const credentials = btoa(`${this.config.username}:${this.config.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }
        return headers;
    }
    async sendMetrics(timeseries) {
        // For browser compatibility, we'll use the text format
        // In production, use protobuf with snappy compression
        const body = encodePrometheusTimeSeries(timeseries);
        try {
            await fetch(this.config.prometheusUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    ...this.getAuthHeaders(),
                },
                body,
            });
        }
        catch (error) {
            console.error('[Grafana] Failed to send metrics:', error);
        }
    }
    async sendLogs(streams) {
        const body = JSON.stringify({ streams });
        try {
            await fetch(`${this.config.lokiUrl}/loki/api/v1/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body,
            });
        }
        catch (error) {
            console.error('[Grafana] Failed to send logs:', error);
        }
    }
    async sendTraces(spans) {
        // Tempo accepts Jaeger, Zipkin, or OTLP format
        // Using a simplified Jaeger-like format
        const body = JSON.stringify({
            data: [
                {
                    traceID: spans[0]?.traceId,
                    spans: spans.map((span) => ({
                        traceID: span.traceId,
                        spanID: span.spanId,
                        parentSpanID: span.parentSpanId,
                        operationName: span.operationName,
                        serviceName: span.serviceName,
                        startTime: span.startTime,
                        duration: span.duration,
                        tags: span.tags,
                        logs: span.logs,
                    })),
                },
            ],
        });
        try {
            await fetch(`${this.config.tempoUrl}/api/traces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body,
            });
        }
        catch (error) {
            console.error('[Grafana] Failed to send traces:', error);
        }
    }
    startFlushTimer() {
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
export function createGrafanaExporter(config) {
    return new GrafanaExporter(config);
}
/**
 * Generate a Grafana dashboard JSON for Web Vitals
 */
export function generateWebVitalsDashboard(job = 'philjs-dashboard') {
    return {
        title: 'Web Vitals Dashboard',
        uid: 'web-vitals',
        panels: [
            {
                id: 1,
                type: 'stat',
                title: 'LCP (Latest)',
                gridPos: { x: 0, y: 0, w: 4, h: 4 },
                targets: [
                    {
                        expr: `web_vitals_lcp_milliseconds{job="${job}"}`,
                        legendFormat: 'LCP',
                        refId: 'A',
                    },
                ],
            },
            {
                id: 2,
                type: 'stat',
                title: 'FID (Latest)',
                gridPos: { x: 4, y: 0, w: 4, h: 4 },
                targets: [
                    {
                        expr: `web_vitals_fid_milliseconds{job="${job}"}`,
                        legendFormat: 'FID',
                        refId: 'A',
                    },
                ],
            },
            {
                id: 3,
                type: 'stat',
                title: 'CLS (Latest)',
                gridPos: { x: 8, y: 0, w: 4, h: 4 },
                targets: [
                    {
                        expr: `web_vitals_cls{job="${job}"}`,
                        legendFormat: 'CLS',
                        refId: 'A',
                    },
                ],
            },
            {
                id: 4,
                type: 'timeseries',
                title: 'Web Vitals Over Time',
                gridPos: { x: 0, y: 4, w: 12, h: 8 },
                targets: [
                    {
                        expr: `web_vitals_lcp_milliseconds{job="${job}"}`,
                        legendFormat: 'LCP',
                        refId: 'A',
                    },
                    {
                        expr: `web_vitals_fcp_milliseconds{job="${job}"}`,
                        legendFormat: 'FCP',
                        refId: 'B',
                    },
                    {
                        expr: `web_vitals_ttfb_milliseconds{job="${job}"}`,
                        legendFormat: 'TTFB',
                        refId: 'C',
                    },
                ],
            },
            {
                id: 5,
                type: 'timeseries',
                title: 'Memory Usage',
                gridPos: { x: 12, y: 4, w: 12, h: 8 },
                targets: [
                    {
                        expr: `browser_memory_used_heap_bytes{job="${job}"}`,
                        legendFormat: 'Used Heap',
                        refId: 'A',
                    },
                    {
                        expr: `browser_memory_total_heap_bytes{job="${job}"}`,
                        legendFormat: 'Total Heap',
                        refId: 'B',
                    },
                ],
            },
        ],
        time: {
            from: 'now-1h',
            to: 'now',
        },
        refresh: '30s',
    };
}
//# sourceMappingURL=grafana.js.map