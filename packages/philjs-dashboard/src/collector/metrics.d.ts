/**
 * Metrics Collection Module
 * Collects Core Web Vitals, custom metrics, memory, CPU, and network data
 */
export interface WebVitalsMetrics {
    /** Largest Contentful Paint */
    lcp: number | null;
    /** First Input Delay */
    fid: number | null;
    /** Cumulative Layout Shift */
    cls: number | null;
    /** First Contentful Paint */
    fcp: number | null;
    /** Time to First Byte */
    ttfb: number | null;
    /** Interaction to Next Paint */
    inp: number | null;
}
export interface MemoryMetrics {
    /** Used JS heap size in bytes */
    usedJSHeapSize: number;
    /** Total JS heap size in bytes */
    totalJSHeapSize: number;
    /** JS heap size limit in bytes */
    jsHeapSizeLimit: number;
    /** Heap utilization percentage */
    heapUtilization: number;
}
export interface CPUMetrics {
    /** Number of logical processors */
    hardwareConcurrency: number;
    /** Long tasks detected */
    longTasks: LongTaskEntry[];
    /** Total blocking time estimate */
    totalBlockingTime: number;
}
export interface LongTaskEntry {
    /** Start time of the long task */
    startTime: number;
    /** Duration of the long task */
    duration: number;
    /** Attribution information */
    attribution: LongTaskAttribution[];
}
export interface LongTaskAttribution {
    /** Name of the container */
    name: string;
    /** Entry type */
    entryType: string;
    /** Container type */
    containerType: string;
    /** Container ID */
    containerId: string;
    /** Container name */
    containerName: string;
    /** Container source */
    containerSrc: string;
}
export interface NetworkRequest {
    /** Request URL */
    url: string;
    /** HTTP method */
    method: string;
    /** Request start time */
    startTime: number;
    /** Response end time */
    endTime: number;
    /** Duration in milliseconds */
    duration: number;
    /** Transfer size in bytes */
    transferSize: number;
    /** Encoded body size */
    encodedBodySize: number;
    /** Decoded body size */
    decodedBodySize: number;
    /** HTTP status code */
    status: number;
    /** Resource type */
    initiatorType: string;
    /** Next hop protocol (h2, h3, etc.) */
    nextHopProtocol: string;
}
export interface CustomMetric {
    /** Metric name */
    name: string;
    /** Metric value */
    value: number;
    /** Unit of measurement */
    unit: string;
    /** Timestamp when recorded */
    timestamp: number;
    /** Optional tags */
    tags?: Record<string, string>;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}
export interface MetricsSnapshot {
    /** Timestamp of the snapshot */
    timestamp: number;
    /** Session ID */
    sessionId: string;
    /** Page URL */
    pageUrl: string;
    /** Web Vitals metrics */
    webVitals: WebVitalsMetrics;
    /** Memory metrics */
    memory: MemoryMetrics | null;
    /** CPU metrics */
    cpu: CPUMetrics;
    /** Network requests */
    networkRequests: NetworkRequest[];
    /** Custom metrics */
    customMetrics: CustomMetric[];
}
export interface MetricsCollectorConfig {
    /** Enable Web Vitals collection */
    collectWebVitals?: boolean;
    /** Enable memory metrics collection */
    collectMemory?: boolean;
    /** Enable CPU/long task monitoring */
    collectCPU?: boolean;
    /** Enable network request tracking */
    collectNetwork?: boolean;
    /** Sample rate (0-1) */
    sampleRate?: number;
    /** Maximum network requests to store */
    maxNetworkRequests?: number;
    /** Long task threshold in ms */
    longTaskThreshold?: number;
    /** Callback when metrics are collected */
    onMetrics?: (snapshot: MetricsSnapshot) => void;
}
export declare class MetricsCollector {
    private config;
    private sessionId;
    private webVitals;
    private longTasks;
    private networkRequests;
    private customMetrics;
    private observers;
    private isCollecting;
    constructor(config?: MetricsCollectorConfig);
    /**
     * Start collecting metrics
     */
    start(): Promise<void>;
    /**
     * Stop collecting metrics
     */
    stop(): void;
    /**
     * Get current metrics snapshot
     */
    getSnapshot(): MetricsSnapshot;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>, metadata?: Record<string, unknown>): void;
    /**
     * Record a timing metric
     */
    recordTiming(name: string, startTime: number, endTime?: number): void;
    /**
     * Create a timer that can be stopped
     */
    startTimer(name: string): () => void;
    /**
     * Clear collected metrics
     */
    clear(): void;
    private generateSessionId;
    private shouldSample;
    private initWebVitals;
    private initLongTaskObserver;
    private initNetworkObserver;
    private getMemoryMetrics;
    private getCPUMetrics;
}
export declare function getMetricsCollector(config?: MetricsCollectorConfig): MetricsCollector;
export declare function resetMetricsCollector(): void;
/**
 * Measure execution time of an async function
 */
export declare function measureAsync<T>(name: string, fn: () => Promise<T>, collector?: MetricsCollector): Promise<T>;
/**
 * Measure execution time of a sync function
 */
export declare function measureSync<T>(name: string, fn: () => T, collector?: MetricsCollector): T;
/**
 * Calculate performance score based on Web Vitals
 */
export declare function calculatePerformanceScore(webVitals: WebVitalsMetrics): number;
//# sourceMappingURL=metrics.d.ts.map