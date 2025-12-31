/**
 * Network Monitor for PhilJS DevTools
 *
 * Tracks all network requests, provides waterfall visualization,
 * and helps identify performance bottlenecks.
 */
export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    status: number;
    statusText: string;
    type: RequestType;
    initiator: string;
    startTime: number;
    endTime: number;
    duration: number;
    size: number;
    compressedSize?: number;
    headers: Record<string, string>;
    responseHeaders: Record<string, string>;
    timing?: ResourceTiming;
    error?: string;
    cached: boolean;
    priority: 'high' | 'medium' | 'low';
}
export type RequestType = 'fetch' | 'xhr' | 'script' | 'stylesheet' | 'image' | 'font' | 'document' | 'other';
export interface ResourceTiming {
    dns: number;
    connect: number;
    ssl: number;
    ttfb: number;
    download: number;
    total: number;
}
export interface NetworkStats {
    totalRequests: number;
    totalSize: number;
    totalTime: number;
    byType: Record<RequestType, {
        count: number;
        size: number;
        time: number;
    }>;
    slowestRequests: NetworkRequest[];
    largestRequests: NetworkRequest[];
    failedRequests: NetworkRequest[];
    cachedRequests: number;
    compressionRatio: number;
}
export interface NetworkMonitorConfig {
    maxRequests?: number;
    captureHeaders?: boolean;
    captureTiming?: boolean;
    ignorePatterns?: RegExp[];
}
export declare class NetworkMonitor {
    private requests;
    private config;
    private isRecording;
    private requestCounter;
    private originalFetch;
    private originalXHROpen;
    private originalXHRSend;
    private listeners;
    constructor(config?: NetworkMonitorConfig);
    /**
     * Start monitoring network requests
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Clear recorded requests
     */
    clear(): void;
    /**
     * Get all requests
     */
    getRequests(): NetworkRequest[];
    /**
     * Get request by ID
     */
    getRequest(id: string): NetworkRequest | undefined;
    /**
     * Get network statistics
     */
    getStats(): NetworkStats;
    /**
     * Add a listener for new requests
     */
    onRequest(callback: (request: NetworkRequest) => void): () => void;
    /**
     * Filter requests
     */
    filterRequests(filter: {
        type?: RequestType;
        status?: 'success' | 'error' | 'pending';
        search?: string;
        minSize?: number;
        maxSize?: number;
        minDuration?: number;
        maxDuration?: number;
    }): NetworkRequest[];
    /**
     * Export requests as HAR
     */
    exportAsHAR(): object;
    private interceptFetch;
    private restoreFetch;
    private interceptXHR;
    private restoreXHR;
    private observePerformance;
    private inferResourceType;
    private addRequest;
}
/**
 * Create a network monitor instance
 */
export declare function createNetworkMonitor(config?: NetworkMonitorConfig): NetworkMonitor;
//# sourceMappingURL=index.d.ts.map