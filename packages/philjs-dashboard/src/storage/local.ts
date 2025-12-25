/**
 * Local Storage Backend
 * IndexedDB storage with data retention policies and export functionality
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { MetricsSnapshot } from '../collector/metrics';
import type { Span } from '../collector/tracing';
import type { CapturedError } from '../collector/errors';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Local Storage Manager
// ============================================================================

export class LocalStorageManager {
  private config: Required<LocalStorageConfig>;
  private retention: Required<RetentionPolicy>;
  private db: IDBPDatabase<DashboardDBSchema> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: LocalStorageConfig = {}) {
    this.config = {
      dbName: config.dbName ?? 'philjs-dashboard',
      dbVersion: config.dbVersion ?? 1,
      retention: config.retention ?? {},
      autoCleanup: config.autoCleanup ?? true,
    };

    this.retention = {
      maxAge: this.config.retention.maxAge ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      maxRecords: this.config.retention.maxRecords ?? 10000,
      cleanupInterval: this.config.retention.cleanupInterval ?? 60 * 60 * 1000, // 1 hour
    };
  }

  /**
   * Initialize the storage
   */
  async init(): Promise<void> {
    this.db = await openDB<DashboardDBSchema>(this.config.dbName, this.config.dbVersion, {
      upgrade(db) {
        // Metrics store
        if (!db.objectStoreNames.contains('metrics')) {
          const metricsStore = db.createObjectStore('metrics', { keyPath: 'id' });
          metricsStore.createIndex('by-timestamp', 'timestamp');
          metricsStore.createIndex('by-session', 'sessionId');
        }

        // Spans store
        if (!db.objectStoreNames.contains('spans')) {
          const spansStore = db.createObjectStore('spans', { keyPath: 'id' });
          spansStore.createIndex('by-timestamp', 'timestamp');
          spansStore.createIndex('by-trace', 'traceId');
        }

        // Errors store
        if (!db.objectStoreNames.contains('errors')) {
          const errorsStore = db.createObjectStore('errors', { keyPath: 'id' });
          errorsStore.createIndex('by-timestamp', 'timestamp');
          errorsStore.createIndex('by-fingerprint', 'fingerprint');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });

    if (this.config.autoCleanup) {
      await this.cleanup();
      this.startCleanupTimer();
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ============================================================================
  // Metrics Operations
  // ============================================================================

  /**
   * Store a metrics snapshot
   */
  async storeMetrics(snapshot: MetricsSnapshot): Promise<string> {
    this.ensureInitialized();

    const id = this.generateId();
    const storedMetrics: StoredMetrics = {
      id,
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      data: snapshot,
    };

    await this.db!.put('metrics', storedMetrics);
    return id;
  }

  /**
   * Get metrics by time range
   */
  async getMetrics(startTime?: number, endTime?: number): Promise<StoredMetrics[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('metrics', 'readonly');
    const index = tx.store.index('by-timestamp');

    const range = this.createTimeRange(startTime, endTime);
    const metrics: StoredMetrics[] = [];

    let cursor = await index.openCursor(range);
    while (cursor) {
      metrics.push(cursor.value);
      cursor = await cursor.continue();
    }

    return metrics;
  }

  /**
   * Get metrics by session
   */
  async getMetricsBySession(sessionId: string): Promise<StoredMetrics[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('metrics', 'readonly');
    const index = tx.store.index('by-session');

    return index.getAll(sessionId);
  }

  /**
   * Delete metrics by ID
   */
  async deleteMetrics(id: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('metrics', id);
  }

  // ============================================================================
  // Spans Operations
  // ============================================================================

  /**
   * Store a span
   */
  async storeSpan(span: Span): Promise<string> {
    this.ensureInitialized();

    const id = span.spanId;
    const storedSpan: StoredSpan = {
      id,
      timestamp: span.startTime,
      traceId: span.traceId,
      data: span,
    };

    await this.db!.put('spans', storedSpan);
    return id;
  }

  /**
   * Store multiple spans
   */
  async storeSpans(spans: Span[]): Promise<void> {
    this.ensureInitialized();

    const tx = this.db!.transaction('spans', 'readwrite');

    await Promise.all(
      spans.map((span) => {
        const storedSpan: StoredSpan = {
          id: span.spanId,
          timestamp: span.startTime,
          traceId: span.traceId,
          data: span,
        };
        return tx.store.put(storedSpan);
      })
    );

    await tx.done;
  }

  /**
   * Get spans by time range
   */
  async getSpans(startTime?: number, endTime?: number): Promise<StoredSpan[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('spans', 'readonly');
    const index = tx.store.index('by-timestamp');

    const range = this.createTimeRange(startTime, endTime);
    const spans: StoredSpan[] = [];

    let cursor = await index.openCursor(range);
    while (cursor) {
      spans.push(cursor.value);
      cursor = await cursor.continue();
    }

    return spans;
  }

  /**
   * Get spans by trace ID
   */
  async getSpansByTrace(traceId: string): Promise<StoredSpan[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('spans', 'readonly');
    const index = tx.store.index('by-trace');

    return index.getAll(traceId);
  }

  /**
   * Delete span by ID
   */
  async deleteSpan(id: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('spans', id);
  }

  // ============================================================================
  // Errors Operations
  // ============================================================================

  /**
   * Store an error
   */
  async storeError(error: CapturedError): Promise<string> {
    this.ensureInitialized();

    const storedError: StoredError = {
      id: error.id,
      timestamp: error.timestamp,
      fingerprint: error.fingerprint,
      data: error,
    };

    await this.db!.put('errors', storedError);
    return error.id;
  }

  /**
   * Get errors by time range
   */
  async getErrors(startTime?: number, endTime?: number): Promise<StoredError[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('errors', 'readonly');
    const index = tx.store.index('by-timestamp');

    const range = this.createTimeRange(startTime, endTime);
    const errors: StoredError[] = [];

    let cursor = await index.openCursor(range);
    while (cursor) {
      errors.push(cursor.value);
      cursor = await cursor.continue();
    }

    return errors;
  }

  /**
   * Get errors by fingerprint
   */
  async getErrorsByFingerprint(fingerprint: string): Promise<StoredError[]> {
    this.ensureInitialized();

    const tx = this.db!.transaction('errors', 'readonly');
    const index = tx.store.index('by-fingerprint');

    return index.getAll(fingerprint);
  }

  /**
   * Delete error by ID
   */
  async deleteError(id: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('errors', id);
  }

  // ============================================================================
  // Metadata Operations
  // ============================================================================

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: unknown): Promise<void> {
    this.ensureInitialized();

    await this.db!.put('metadata', {
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get metadata value
   */
  async getMetadata<T = unknown>(key: string): Promise<T | undefined> {
    this.ensureInitialized();

    const result = await this.db!.get('metadata', key);
    return result?.value as T | undefined;
  }

  /**
   * Delete metadata
   */
  async deleteMetadata(key: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('metadata', key);
  }

  // ============================================================================
  // Retention and Cleanup
  // ============================================================================

  /**
   * Clean up old data based on retention policy
   */
  async cleanup(): Promise<{
    metricsDeleted: number;
    spansDeleted: number;
    errorsDeleted: number;
  }> {
    this.ensureInitialized();

    const cutoffTime = Date.now() - this.retention.maxAge;

    const metricsDeleted = await this.cleanupStore('metrics', cutoffTime);
    const spansDeleted = await this.cleanupStore('spans', cutoffTime);
    const errorsDeleted = await this.cleanupStore('errors', cutoffTime);

    return { metricsDeleted, spansDeleted, errorsDeleted };
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    metricsCount: number;
    spansCount: number;
    errorsCount: number;
    oldestMetric: number | null;
    oldestSpan: number | null;
    oldestError: number | null;
  }> {
    this.ensureInitialized();

    const [metricsCount, spansCount, errorsCount] = await Promise.all([
      this.db!.count('metrics'),
      this.db!.count('spans'),
      this.db!.count('errors'),
    ]);

    const [oldestMetric, oldestSpan, oldestError] = await Promise.all([
      this.getOldestTimestamp('metrics'),
      this.getOldestTimestamp('spans'),
      this.getOldestTimestamp('errors'),
    ]);

    return {
      metricsCount,
      spansCount,
      errorsCount,
      oldestMetric,
      oldestSpan,
      oldestError,
    };
  }

  // ============================================================================
  // Export Functionality
  // ============================================================================

  /**
   * Export data
   */
  async export(options: ExportOptions = {}): Promise<ExportedData | string> {
    this.ensureInitialized();

    const {
      startTime,
      endTime,
      includeMetrics = true,
      includeSpans = true,
      includeErrors = true,
      format = 'json',
    } = options;

    const [metrics, spans, errors] = await Promise.all([
      includeMetrics ? this.getMetrics(startTime, endTime) : [],
      includeSpans ? this.getSpans(startTime, endTime) : [],
      includeErrors ? this.getErrors(startTime, endTime) : [],
    ]);

    const data: ExportedData = {
      exportedAt: Date.now(),
      startTime,
      endTime,
      metrics,
      spans,
      errors,
    };

    if (format === 'csv') {
      return this.exportToCsv(data);
    }

    return data;
  }

  /**
   * Export as downloadable file
   */
  async exportToFile(options: ExportOptions = {}): Promise<Blob> {
    const data = await this.export(options);
    const format = options.format ?? 'json';

    if (format === 'csv') {
      return new Blob([data as string], { type: 'text/csv' });
    }

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  /**
   * Import data
   */
  async import(data: ExportedData): Promise<{
    metricsImported: number;
    spansImported: number;
    errorsImported: number;
  }> {
    this.ensureInitialized();

    const tx = this.db!.transaction(['metrics', 'spans', 'errors'], 'readwrite');

    await Promise.all([
      ...data.metrics.map((m) => tx.objectStore('metrics').put(m)),
      ...data.spans.map((s) => tx.objectStore('spans').put(s)),
      ...data.errors.map((e) => tx.objectStore('errors').put(e)),
    ]);

    await tx.done;

    return {
      metricsImported: data.metrics.length,
      spansImported: data.spans.length,
      errorsImported: data.errors.length,
    };
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();

    const tx = this.db!.transaction(['metrics', 'spans', 'errors', 'metadata'], 'readwrite');

    await Promise.all([
      tx.objectStore('metrics').clear(),
      tx.objectStore('spans').clear(),
      tx.objectStore('errors').clear(),
      tx.objectStore('metadata').clear(),
    ]);

    await tx.done;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private ensureInitialized(): asserts this is { db: IDBPDatabase<DashboardDBSchema> } {
    if (!this.db) {
      throw new Error('LocalStorageManager not initialized. Call init() first.');
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private createTimeRange(startTime?: number, endTime?: number): IDBKeyRange | undefined {
    if (startTime !== undefined && endTime !== undefined) {
      return IDBKeyRange.bound(startTime, endTime);
    }
    if (startTime !== undefined) {
      return IDBKeyRange.lowerBound(startTime);
    }
    if (endTime !== undefined) {
      return IDBKeyRange.upperBound(endTime);
    }
    return undefined;
  }

  private async cleanupStore(
    storeName: 'metrics' | 'spans' | 'errors',
    cutoffTime: number
  ): Promise<number> {
    const tx = this.db!.transaction(storeName, 'readwrite');
    const index = tx.store.index('by-timestamp');

    let deletedCount = 0;
    const range = IDBKeyRange.upperBound(cutoffTime);

    let cursor = await index.openCursor(range);
    while (cursor) {
      await cursor.delete();
      deletedCount++;
      cursor = await cursor.continue();
    }

    // Also enforce max records limit
    const count = await this.db!.count(storeName);
    if (count > this.retention.maxRecords) {
      const excess = count - this.retention.maxRecords;
      const tx2 = this.db!.transaction(storeName, 'readwrite');
      const index2 = tx2.store.index('by-timestamp');

      let deleteCount = 0;
      let cursor2 = await index2.openCursor();
      while (cursor2 && deleteCount < excess) {
        await cursor2.delete();
        deleteCount++;
        deletedCount++;
        cursor2 = await cursor2.continue();
      }
    }

    return deletedCount;
  }

  private async getOldestTimestamp(
    storeName: 'metrics' | 'spans' | 'errors'
  ): Promise<number | null> {
    const tx = this.db!.transaction(storeName, 'readonly');
    const index = tx.store.index('by-timestamp');

    const cursor = await index.openCursor();
    return cursor?.value.timestamp ?? null;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.retention.cleanupInterval);
  }

  private exportToCsv(data: ExportedData): string {
    const lines: string[] = [];

    // Metrics CSV
    if (data.metrics.length > 0) {
      lines.push('# Metrics');
      lines.push('id,timestamp,sessionId,lcp,fid,cls,fcp,ttfb');
      for (const m of data.metrics) {
        const wv = m.data.webVitals;
        lines.push(
          `${m.id},${m.timestamp},${m.sessionId},${wv.lcp ?? ''},${wv.fid ?? ''},${wv.cls ?? ''},${wv.fcp ?? ''},${wv.ttfb ?? ''}`
        );
      }
      lines.push('');
    }

    // Spans CSV
    if (data.spans.length > 0) {
      lines.push('# Spans');
      lines.push('spanId,traceId,parentSpanId,name,kind,startTime,duration,status');
      for (const s of data.spans) {
        const span = s.data;
        lines.push(
          `${span.spanId},${span.traceId},${span.parentSpanId ?? ''},${span.name},${span.kind},${span.startTime},${span.duration ?? ''},${span.status.code}`
        );
      }
      lines.push('');
    }

    // Errors CSV
    if (data.errors.length > 0) {
      lines.push('# Errors');
      lines.push('id,timestamp,fingerprint,name,message,url');
      for (const e of data.errors) {
        const err = e.data;
        const escapedMessage = err.error.message.replace(/"/g, '""');
        lines.push(
          `${e.id},${e.timestamp},${e.fingerprint},${err.error.name},"${escapedMessage}",${err.url}`
        );
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultStorage: LocalStorageManager | null = null;

export async function getLocalStorage(config?: LocalStorageConfig): Promise<LocalStorageManager> {
  if (!defaultStorage) {
    defaultStorage = new LocalStorageManager(config);
    await defaultStorage.init();
  }
  return defaultStorage;
}

export async function resetLocalStorage(): Promise<void> {
  if (defaultStorage) {
    defaultStorage.close();
    defaultStorage = null;
  }
}
