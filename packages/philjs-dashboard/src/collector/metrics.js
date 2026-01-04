/**
 * Metrics Collection Module
 * Collects Core Web Vitals, custom metrics, memory, CPU, and network data
 */
// ============================================================================
// Metrics Collector Class
// ============================================================================
export class MetricsCollector {
    config;
    sessionId;
    webVitals;
    longTasks = [];
    networkRequests = [];
    customMetrics = [];
    observers = [];
    isCollecting = false;
    constructor(config = {}) {
        this.config = {
            collectWebVitals: config.collectWebVitals ?? true,
            collectMemory: config.collectMemory ?? true,
            collectCPU: config.collectCPU ?? true,
            collectNetwork: config.collectNetwork ?? true,
            sampleRate: config.sampleRate ?? 1,
            maxNetworkRequests: config.maxNetworkRequests ?? 100,
            longTaskThreshold: config.longTaskThreshold ?? 50,
            onMetrics: config.onMetrics ?? (() => { }),
        };
        this.sessionId = this.generateSessionId();
        this.webVitals = {
            lcp: null,
            fid: null,
            cls: null,
            fcp: null,
            ttfb: null,
            inp: null,
        };
    }
    /**
     * Start collecting metrics
     */
    async start() {
        if (this.isCollecting)
            return;
        if (!this.shouldSample())
            return;
        this.isCollecting = true;
        if (this.config.collectWebVitals) {
            await this.initWebVitals();
        }
        if (this.config.collectCPU) {
            this.initLongTaskObserver();
        }
        if (this.config.collectNetwork) {
            this.initNetworkObserver();
        }
    }
    /**
     * Stop collecting metrics
     */
    stop() {
        this.isCollecting = false;
        this.observers.forEach((observer) => observer.disconnect());
        this.observers = [];
    }
    /**
     * Get current metrics snapshot
     */
    getSnapshot() {
        return {
            timestamp: Date.now(),
            sessionId: this.sessionId,
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            webVitals: { ...this.webVitals },
            memory: this.getMemoryMetrics(),
            cpu: this.getCPUMetrics(),
            networkRequests: [...this.networkRequests],
            customMetrics: [...this.customMetrics],
        };
    }
    /**
     * Record a custom metric
     */
    recordMetric(name, value, unit = 'ms', tags, metadata) {
        const metric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
            ...(tags !== undefined && { tags }),
            ...(metadata !== undefined && { metadata }),
        };
        this.customMetrics.push(metric);
    }
    /**
     * Record a timing metric
     */
    recordTiming(name, startTime, endTime) {
        const end = endTime ?? performance.now();
        this.recordMetric(name, end - startTime, 'ms');
    }
    /**
     * Create a timer that can be stopped
     */
    startTimer(name) {
        const startTime = performance.now();
        return () => this.recordTiming(name, startTime);
    }
    /**
     * Clear collected metrics
     */
    clear() {
        this.networkRequests = [];
        this.customMetrics = [];
        this.longTasks = [];
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }
    async initWebVitals() {
        try {
            const webVitalsModule = await import('web-vitals');
            const handleMetric = (metric) => {
                const metricName = metric.name.toLowerCase();
                if (metricName in this.webVitals) {
                    this.webVitals[metricName] = metric.value;
                }
                this.config.onMetrics(this.getSnapshot());
            };
            webVitalsModule.onLCP(handleMetric);
            webVitalsModule.onFID(handleMetric);
            webVitalsModule.onCLS(handleMetric);
            webVitalsModule.onFCP(handleMetric);
            webVitalsModule.onTTFB(handleMetric);
            webVitalsModule.onINP(handleMetric);
        }
        catch {
            console.warn('[MetricsCollector] Failed to initialize web-vitals');
        }
    }
    initLongTaskObserver() {
        if (typeof PerformanceObserver === 'undefined')
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration >= this.config.longTaskThreshold) {
                        const taskEntry = entry;
                        this.longTasks.push({
                            startTime: entry.startTime,
                            duration: entry.duration,
                            attribution: (taskEntry.attribution || []).map((attr) => ({
                                name: attr.name,
                                entryType: attr.entryType,
                                containerType: attr.containerType,
                                containerId: attr.containerId,
                                containerName: attr.containerName,
                                containerSrc: attr.containerSrc,
                            })),
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
            this.observers.push(observer);
        }
        catch {
            console.warn('[MetricsCollector] Long task observation not supported');
        }
    }
    initNetworkObserver() {
        if (typeof PerformanceObserver === 'undefined')
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const resourceEntry = entry;
                    const request = {
                        url: resourceEntry.name,
                        method: 'GET', // Not available from PerformanceResourceTiming
                        startTime: resourceEntry.startTime,
                        endTime: resourceEntry.responseEnd,
                        duration: resourceEntry.duration,
                        transferSize: resourceEntry.transferSize,
                        encodedBodySize: resourceEntry.encodedBodySize,
                        decodedBodySize: resourceEntry.decodedBodySize,
                        status: 200, // Not available from PerformanceResourceTiming
                        initiatorType: resourceEntry.initiatorType,
                        nextHopProtocol: resourceEntry.nextHopProtocol,
                    };
                    this.networkRequests.push(request);
                    // Trim to max size
                    if (this.networkRequests.length > this.config.maxNetworkRequests) {
                        this.networkRequests.shift();
                    }
                }
            });
            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        }
        catch {
            console.warn('[MetricsCollector] Resource observation not supported');
        }
    }
    getMemoryMetrics() {
        if (!this.config.collectMemory)
            return null;
        const performance = globalThis.performance;
        if (!performance.memory)
            return null;
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
        return {
            usedJSHeapSize,
            totalJSHeapSize,
            jsHeapSizeLimit,
            heapUtilization: (usedJSHeapSize / jsHeapSizeLimit) * 100,
        };
    }
    getCPUMetrics() {
        const totalBlockingTime = this.longTasks.reduce((total, task) => total + Math.max(0, task.duration - 50), 0);
        return {
            hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 1 : 1,
            longTasks: [...this.longTasks],
            totalBlockingTime,
        };
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let defaultCollector = null;
export function getMetricsCollector(config) {
    if (!defaultCollector) {
        defaultCollector = new MetricsCollector(config);
    }
    return defaultCollector;
}
export function resetMetricsCollector() {
    if (defaultCollector) {
        defaultCollector.stop();
        defaultCollector = null;
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Measure execution time of an async function
 */
export async function measureAsync(name, fn, collector) {
    const metricsCollector = collector ?? getMetricsCollector();
    const stopTimer = metricsCollector.startTimer(name);
    try {
        return await fn();
    }
    finally {
        stopTimer();
    }
}
/**
 * Measure execution time of a sync function
 */
export function measureSync(name, fn, collector) {
    const metricsCollector = collector ?? getMetricsCollector();
    const stopTimer = metricsCollector.startTimer(name);
    try {
        return fn();
    }
    finally {
        stopTimer();
    }
}
/**
 * Calculate performance score based on Web Vitals
 */
export function calculatePerformanceScore(webVitals) {
    let score = 100;
    let metrics = 0;
    // LCP scoring (Good: <2.5s, Needs Improvement: <4s, Poor: >4s)
    if (webVitals.lcp !== null) {
        metrics++;
        if (webVitals.lcp <= 2500) {
            score += 100;
        }
        else if (webVitals.lcp <= 4000) {
            score += 50;
        }
        else {
            score += 0;
        }
    }
    // FID scoring (Good: <100ms, Needs Improvement: <300ms, Poor: >300ms)
    if (webVitals.fid !== null) {
        metrics++;
        if (webVitals.fid <= 100) {
            score += 100;
        }
        else if (webVitals.fid <= 300) {
            score += 50;
        }
        else {
            score += 0;
        }
    }
    // CLS scoring (Good: <0.1, Needs Improvement: <0.25, Poor: >0.25)
    if (webVitals.cls !== null) {
        metrics++;
        if (webVitals.cls <= 0.1) {
            score += 100;
        }
        else if (webVitals.cls <= 0.25) {
            score += 50;
        }
        else {
            score += 0;
        }
    }
    // FCP scoring (Good: <1.8s, Needs Improvement: <3s, Poor: >3s)
    if (webVitals.fcp !== null) {
        metrics++;
        if (webVitals.fcp <= 1800) {
            score += 100;
        }
        else if (webVitals.fcp <= 3000) {
            score += 50;
        }
        else {
            score += 0;
        }
    }
    // TTFB scoring (Good: <800ms, Needs Improvement: <1800ms, Poor: >1800ms)
    if (webVitals.ttfb !== null) {
        metrics++;
        if (webVitals.ttfb <= 800) {
            score += 100;
        }
        else if (webVitals.ttfb <= 1800) {
            score += 50;
        }
        else {
            score += 0;
        }
    }
    return metrics > 0 ? Math.round((score - 100) / metrics) : 0;
}
//# sourceMappingURL=metrics.js.map