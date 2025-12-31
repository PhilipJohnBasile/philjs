/**
 * Remote Storage Module
 * Send data to backend API with batching, retry logic, and compression
 */
import type { MetricsSnapshot } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';
export type DataType = 'metrics' | 'spans' | 'errors';
export interface BatchItem<T = unknown> {
    type: DataType;
    data: T;
    timestamp: number;
    id: string;
}
export interface BatchPayload {
    batchId: string;
    timestamp: number;
    items: BatchItem[];
    metadata: {
        clientId: string;
        sessionId: string;
        environment: string;
        release?: string;
    };
}
export interface RemoteStorageConfig {
    /** API endpoint URL */
    endpoint: string;
    /** API key for authentication */
    apiKey?: string;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Batch size before sending */
    batchSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
    /** Enable compression */
    compression?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Retry delay in milliseconds */
    retryDelay?: number;
    /** Exponential backoff multiplier */
    backoffMultiplier?: number;
    /** Maximum retry delay */
    maxRetryDelay?: number;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Callback on successful send */
    onSuccess?: (batchId: string, itemCount: number) => void;
    /** Callback on send error */
    onError?: (error: Error, batch: BatchPayload) => void;
    /** Client ID */
    clientId?: string;
    /** Session ID */
    sessionId?: string;
    /** Environment */
    environment?: string;
    /** Release version */
    release?: string;
}
export interface RetryState {
    attempts: number;
    nextRetryTime: number;
    batch: BatchPayload;
}
export declare class RemoteStorageManager {
    private config;
    private queue;
    private retryQueue;
    private flushTimer;
    private retryTimer;
    private isFlushing;
    private isDestroyed;
    constructor(config: RemoteStorageConfig);
    /**
     * Send metrics snapshot
     */
    sendMetrics(metrics: MetricsSnapshot): void;
    /**
     * Send span
     */
    sendSpan(span: Span): void;
    /**
     * Send multiple spans
     */
    sendSpans(spans: Span[]): void;
    /**
     * Send error
     */
    sendError(error: CapturedError): void;
    /**
     * Force flush all queued items
     */
    flush(): Promise<void>;
    /**
     * Get queue status
     */
    getStatus(): {
        queueSize: number;
        retryQueueSize: number;
        isFlushing: boolean;
    };
    /**
     * Update session ID
     */
    setSessionId(sessionId: string): void;
    /**
     * Update release version
     */
    setRelease(release: string): void;
    /**
     * Destroy the manager
     */
    destroy(): Promise<void>;
    private generateClientId;
    private generateSessionId;
    private generateBatchId;
    private generateItemId;
    private addToQueue;
    private flushBatch;
    private createBatch;
    private sendBatch;
    private handleSendError;
    private calculateNextRetryTime;
    private startFlushTimer;
    private startRetryTimer;
    private processRetryQueue;
}
export declare class BeaconSender {
    private endpoint;
    private apiKey?;
    private pendingData;
    constructor(endpoint: string, apiKey?: string);
    queue<T>(type: DataType, data: T): void;
    private sendBeacon;
}
export declare function getRemoteStorage(config?: RemoteStorageConfig): RemoteStorageManager;
export declare function initRemoteStorage(config: RemoteStorageConfig): RemoteStorageManager;
export declare function resetRemoteStorage(): Promise<void>;
export interface CombinedStorageConfig {
    local?: {
        enabled: boolean;
    };
    remote?: RemoteStorageConfig;
    beacon?: {
        enabled: boolean;
        endpoint?: string;
    };
}
export declare class CombinedStorageManager {
    private remote;
    private beacon;
    private localEnabled;
    constructor(config: CombinedStorageConfig);
    sendMetrics(metrics: MetricsSnapshot): void;
    sendSpan(span: Span): void;
    sendError(error: CapturedError): void;
    flush(): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=remote.d.ts.map