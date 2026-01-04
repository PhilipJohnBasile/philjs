/**
 * Local Storage Backend
 * IndexedDB storage with data retention policies and export functionality
 */
import type { DBSchema } from 'idb';
import type { MetricsSnapshot } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError } from '../collector/errors.js';
export interface DashboardDBSchema extends DBSchema {
    metrics: {
        key: string;
        value: StoredMetrics;
        indexes: {
            'by-timestamp': number;
            'by-session': string;
        };
    };
    spans: {
        key: string;
        value: StoredSpan;
        indexes: {
            'by-timestamp': number;
            'by-trace': string;
        };
    };
    errors: {
        key: string;
        value: StoredError;
        indexes: {
            'by-timestamp': number;
            'by-fingerprint': string;
        };
    };
    metadata: {
        key: string;
        value: StorageMetadata;
    };
}
export interface StoredMetrics {
    id: string;
    timestamp: number;
    sessionId: string;
    data: MetricsSnapshot;
}
export interface StoredSpan {
    id: string;
    timestamp: number;
    traceId: string;
    data: Span;
}
export interface StoredError {
    id: string;
    timestamp: number;
    fingerprint: string;
    data: CapturedError;
}
export interface StorageMetadata {
    key: string;
    value: unknown;
    updatedAt: number;
}
export interface RetentionPolicy {
    /** Maximum age of data in milliseconds */
    maxAge: number;
    /** Maximum number of records per type */
    maxRecords: number;
    /** Run cleanup interval in milliseconds */
    cleanupInterval: number;
}
export interface LocalStorageConfig {
    /** Database name */
    dbName?: string;
    /** Database version */
    dbVersion?: number;
    /** Retention policy */
    retention?: Partial<RetentionPolicy>;
    /** Auto cleanup on init */
    autoCleanup?: boolean;
}
export interface ExportOptions {
    /** Start timestamp */
    startTime?: number;
    /** End timestamp */
    endTime?: number;
    /** Include metrics */
    includeMetrics?: boolean;
    /** Include spans */
    includeSpans?: boolean;
    /** Include errors */
    includeErrors?: boolean;
    /** Export format */
    format?: 'json' | 'csv';
}
export interface ExportedData {
    exportedAt: number;
    startTime?: number;
    endTime?: number;
    metrics: StoredMetrics[];
    spans: StoredSpan[];
    errors: StoredError[];
}
export declare class LocalStorageManager {
    private config;
    private retention;
    private db;
    private cleanupTimer;
    constructor(config?: LocalStorageConfig);
    /**
     * Initialize the storage
     */
    init(): Promise<void>;
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Store a metrics snapshot
     */
    storeMetrics(snapshot: MetricsSnapshot): Promise<string>;
    /**
     * Get metrics by time range
     */
    getMetrics(startTime?: number, endTime?: number): Promise<StoredMetrics[]>;
    /**
     * Get metrics by session
     */
    getMetricsBySession(sessionId: string): Promise<StoredMetrics[]>;
    /**
     * Delete metrics by ID
     */
    deleteMetrics(id: string): Promise<void>;
    /**
     * Store a span
     */
    storeSpan(span: Span): Promise<string>;
    /**
     * Store multiple spans
     */
    storeSpans(spans: Span[]): Promise<void>;
    /**
     * Get spans by time range
     */
    getSpans(startTime?: number, endTime?: number): Promise<StoredSpan[]>;
    /**
     * Get spans by trace ID
     */
    getSpansByTrace(traceId: string): Promise<StoredSpan[]>;
    /**
     * Delete span by ID
     */
    deleteSpan(id: string): Promise<void>;
    /**
     * Store an error
     */
    storeError(error: CapturedError): Promise<string>;
    /**
     * Get errors by time range
     */
    getErrors(startTime?: number, endTime?: number): Promise<StoredError[]>;
    /**
     * Get errors by fingerprint
     */
    getErrorsByFingerprint(fingerprint: string): Promise<StoredError[]>;
    /**
     * Delete error by ID
     */
    deleteError(id: string): Promise<void>;
    /**
     * Set metadata value
     */
    setMetadata(key: string, value: unknown): Promise<void>;
    /**
     * Get metadata value
     */
    getMetadata<T = unknown>(key: string): Promise<T | undefined>;
    /**
     * Delete metadata
     */
    deleteMetadata(key: string): Promise<void>;
    /**
     * Clean up old data based on retention policy
     */
    cleanup(): Promise<{
        metricsDeleted: number;
        spansDeleted: number;
        errorsDeleted: number;
    }>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        metricsCount: number;
        spansCount: number;
        errorsCount: number;
        oldestMetric: number | null;
        oldestSpan: number | null;
        oldestError: number | null;
    }>;
    /**
     * Export data
     */
    export(options?: ExportOptions): Promise<ExportedData | string>;
    /**
     * Export as downloadable file
     */
    exportToFile(options?: ExportOptions): Promise<Blob>;
    /**
     * Import data
     */
    import(data: ExportedData): Promise<{
        metricsImported: number;
        spansImported: number;
        errorsImported: number;
    }>;
    /**
     * Clear all data
     */
    clearAll(): Promise<void>;
    private ensureInitialized;
    private getDb;
    private generateId;
    private createTimeRange;
    private cleanupStore;
    private getOldestTimestamp;
    private startCleanupTimer;
    private exportToCsv;
}
export declare function getLocalStorage(config?: LocalStorageConfig): Promise<LocalStorageManager>;
export declare function resetLocalStorage(): Promise<void>;
//# sourceMappingURL=local.d.ts.map