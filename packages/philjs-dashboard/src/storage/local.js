/**
 * Local Storage Backend
 * IndexedDB storage with data retention policies and export functionality
 */
import { openDB } from 'idb';
// ============================================================================
// Local Storage Manager
// ============================================================================
export class LocalStorageManager {
    config;
    retention;
    db = null;
    cleanupTimer = null;
    constructor(config = {}) {
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
    async init() {
        this.db = await openDB(this.config.dbName, this.config.dbVersion, {
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
    close() {
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
    async storeMetrics(snapshot) {
        const db = this.getDb();
        const id = this.generateId();
        const storedMetrics = {
            id,
            timestamp: snapshot.timestamp,
            sessionId: snapshot.sessionId,
            data: snapshot,
        };
        await db.put('metrics', storedMetrics);
        return id;
    }
    /**
     * Get metrics by time range
     */
    async getMetrics(startTime, endTime) {
        const db = this.getDb();
        const tx = db.transaction('metrics', 'readonly');
        const index = tx.store.index('by-timestamp');
        const range = this.createTimeRange(startTime, endTime);
        const metrics = [];
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
    async getMetricsBySession(sessionId) {
        const db = this.getDb();
        const tx = db.transaction('metrics', 'readonly');
        const index = tx.store.index('by-session');
        return index.getAll(sessionId);
    }
    /**
     * Delete metrics by ID
     */
    async deleteMetrics(id) {
        const db = this.getDb();
        await db.delete('metrics', id);
    }
    // ============================================================================
    // Spans Operations
    // ============================================================================
    /**
     * Store a span
     */
    async storeSpan(span) {
        const db = this.getDb();
        const id = span.spanId;
        const storedSpan = {
            id,
            timestamp: span.startTime,
            traceId: span.traceId,
            data: span,
        };
        await db.put('spans', storedSpan);
        return id;
    }
    /**
     * Store multiple spans
     */
    async storeSpans(spans) {
        const db = this.getDb();
        const tx = db.transaction('spans', 'readwrite');
        await Promise.all(spans.map((span) => {
            const storedSpan = {
                id: span.spanId,
                timestamp: span.startTime,
                traceId: span.traceId,
                data: span,
            };
            return tx.store.put(storedSpan);
        }));
        await tx.done;
    }
    /**
     * Get spans by time range
     */
    async getSpans(startTime, endTime) {
        const db = this.getDb();
        const tx = db.transaction('spans', 'readonly');
        const index = tx.store.index('by-timestamp');
        const range = this.createTimeRange(startTime, endTime);
        const spans = [];
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
    async getSpansByTrace(traceId) {
        const db = this.getDb();
        const tx = db.transaction('spans', 'readonly');
        const index = tx.store.index('by-trace');
        return index.getAll(traceId);
    }
    /**
     * Delete span by ID
     */
    async deleteSpan(id) {
        const db = this.getDb();
        await db.delete('spans', id);
    }
    // ============================================================================
    // Errors Operations
    // ============================================================================
    /**
     * Store an error
     */
    async storeError(error) {
        const db = this.getDb();
        const storedError = {
            id: error.id,
            timestamp: error.timestamp,
            fingerprint: error.fingerprint,
            data: error,
        };
        await db.put('errors', storedError);
        return error.id;
    }
    /**
     * Get errors by time range
     */
    async getErrors(startTime, endTime) {
        const db = this.getDb();
        const tx = db.transaction('errors', 'readonly');
        const index = tx.store.index('by-timestamp');
        const range = this.createTimeRange(startTime, endTime);
        const errors = [];
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
    async getErrorsByFingerprint(fingerprint) {
        const db = this.getDb();
        const tx = db.transaction('errors', 'readonly');
        const index = tx.store.index('by-fingerprint');
        return index.getAll(fingerprint);
    }
    /**
     * Delete error by ID
     */
    async deleteError(id) {
        const db = this.getDb();
        await db.delete('errors', id);
    }
    // ============================================================================
    // Metadata Operations
    // ============================================================================
    /**
     * Set metadata value
     */
    async setMetadata(key, value) {
        const db = this.getDb();
        await db.put('metadata', {
            key,
            value,
            updatedAt: Date.now(),
        });
    }
    /**
     * Get metadata value
     */
    async getMetadata(key) {
        const db = this.getDb();
        const result = await db.get('metadata', key);
        return result?.value;
    }
    /**
     * Delete metadata
     */
    async deleteMetadata(key) {
        const db = this.getDb();
        await db.delete('metadata', key);
    }
    // ============================================================================
    // Retention and Cleanup
    // ============================================================================
    /**
     * Clean up old data based on retention policy
     */
    async cleanup() {
        const db = this.getDb();
        const cutoffTime = Date.now() - this.retention.maxAge;
        const metricsDeleted = await this.cleanupStore('metrics', cutoffTime);
        const spansDeleted = await this.cleanupStore('spans', cutoffTime);
        const errorsDeleted = await this.cleanupStore('errors', cutoffTime);
        return { metricsDeleted, spansDeleted, errorsDeleted };
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        const db = this.getDb();
        const [metricsCount, spansCount, errorsCount] = await Promise.all([
            db.count('metrics'),
            db.count('spans'),
            db.count('errors'),
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
    async export(options = {}) {
        const db = this.getDb();
        const { startTime, endTime, includeMetrics = true, includeSpans = true, includeErrors = true, format = 'json', } = options;
        const [metrics, spans, errors] = await Promise.all([
            includeMetrics ? this.getMetrics(startTime, endTime) : [],
            includeSpans ? this.getSpans(startTime, endTime) : [],
            includeErrors ? this.getErrors(startTime, endTime) : [],
        ]);
        const data = {
            exportedAt: Date.now(),
            metrics,
            spans,
            errors,
        };
        if (startTime !== undefined)
            data.startTime = startTime;
        if (endTime !== undefined)
            data.endTime = endTime;
        if (format === 'csv') {
            return this.exportToCsv(data);
        }
        return data;
    }
    /**
     * Export as downloadable file
     */
    async exportToFile(options = {}) {
        const data = await this.export(options);
        const format = options.format ?? 'json';
        if (format === 'csv') {
            return new Blob([data], { type: 'text/csv' });
        }
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
    /**
     * Import data
     */
    async import(data) {
        const db = this.getDb();
        const tx = db.transaction(['metrics', 'spans', 'errors'], 'readwrite');
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
    async clearAll() {
        const db = this.getDb();
        const tx = db.transaction(['metrics', 'spans', 'errors', 'metadata'], 'readwrite');
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
    ensureInitialized() {
        if (!this.db) {
            throw new Error('LocalStorageManager not initialized. Call init() first.');
        }
    }
    getDb() {
        if (!this.db) {
            throw new Error('LocalStorageManager not initialized. Call init() first.');
        }
        return this.db;
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    createTimeRange(startTime, endTime) {
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
    async cleanupStore(storeName, cutoffTime) {
        const db = this.getDb();
        const tx = db.transaction(storeName, 'readwrite');
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
        const count = await db.count(storeName);
        if (count > this.retention.maxRecords) {
            const excess = count - this.retention.maxRecords;
            const tx2 = db.transaction(storeName, 'readwrite');
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
    async getOldestTimestamp(storeName) {
        const db = this.getDb();
        const tx = db.transaction(storeName, 'readonly');
        const index = tx.store.index('by-timestamp');
        const cursor = await index.openCursor();
        return cursor?.value.timestamp ?? null;
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup().catch(console.error);
        }, this.retention.cleanupInterval);
    }
    exportToCsv(data) {
        const lines = [];
        // Metrics CSV
        if (data.metrics.length > 0) {
            lines.push('# Metrics');
            lines.push('id,timestamp,sessionId,lcp,fid,cls,fcp,ttfb');
            for (const m of data.metrics) {
                const wv = m.data.webVitals;
                lines.push(`${m.id},${m.timestamp},${m.sessionId},${wv.lcp ?? ''},${wv.fid ?? ''},${wv.cls ?? ''},${wv.fcp ?? ''},${wv.ttfb ?? ''}`);
            }
            lines.push('');
        }
        // Spans CSV
        if (data.spans.length > 0) {
            lines.push('# Spans');
            lines.push('spanId,traceId,parentSpanId,name,kind,startTime,duration,status');
            for (const s of data.spans) {
                const span = s.data;
                lines.push(`${span.spanId},${span.traceId},${span.parentSpanId ?? ''},${span.name},${span.kind},${span.startTime},${span.duration ?? ''},${span.status.code}`);
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
                lines.push(`${e.id},${e.timestamp},${e.fingerprint},${err.error.name},"${escapedMessage}",${err.url}`);
            }
        }
        return lines.join('\n');
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let defaultStorage = null;
export async function getLocalStorage(config) {
    if (!defaultStorage) {
        defaultStorage = new LocalStorageManager(config);
        await defaultStorage.init();
    }
    return defaultStorage;
}
export async function resetLocalStorage() {
    if (defaultStorage) {
        defaultStorage.close();
        defaultStorage = null;
    }
}
//# sourceMappingURL=local.js.map