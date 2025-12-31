/**
 * SQLite Sync Engine
 * Synchronization between local SQLite and remote server
 */
import type { SQLiteDB, Row } from '../db/sqlite-wasm.js';
/**
 * Sync configuration
 */
export interface SyncConfig {
    /** Remote sync endpoint */
    endpoint?: string;
    /** Sync interval in ms (0 = manual only) */
    syncInterval?: number;
    /** Conflict resolution strategy */
    conflictStrategy: 'client-wins' | 'server-wins' | 'last-write-wins' | 'merge' | 'manual';
    /** Tables to sync */
    tables: string[];
    /** Auth token getter */
    getAuthToken?: () => string | Promise<string>;
    /** Callback when sync completes */
    onSyncComplete?: (result: SyncResult) => void;
    /** Callback when conflict occurs (for manual strategy) */
    onConflict?: (conflict: SyncConflict) => Promise<ConflictResolution>;
    /** Enable debug logging */
    debug?: boolean;
}
/**
 * Change record for tracking
 */
export interface ChangeRecord {
    id: string;
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    rowId: number;
    data: Row | null;
    timestamp: number;
    synced: boolean;
}
/**
 * Sync result
 */
export interface SyncResult {
    success: boolean;
    pushed: number;
    pulled: number;
    conflicts: number;
    errors: string[];
    duration: number;
}
/**
 * Sync conflict
 */
export interface SyncConflict {
    table: string;
    rowId: number;
    localData: Row;
    remoteData: Row;
    localTimestamp: number;
    remoteTimestamp: number;
}
/**
 * Conflict resolution
 */
export interface ConflictResolution {
    action: 'use-local' | 'use-remote' | 'use-merged';
    mergedData?: Row;
}
/**
 * Sync engine for SQLite
 */
export declare class SQLiteSyncEngine {
    private db;
    private config;
    private changesTable;
    private metaTable;
    private syncTimer;
    private unsubscribes;
    private syncing;
    constructor(db: SQLiteDB, config: SyncConfig);
    /**
     * Initialize sync engine
     */
    initialize(): Promise<void>;
    /**
     * Create sync tracking tables
     */
    private createSyncTables;
    /**
     * Subscribe to changes on tracked tables
     */
    private subscribeToChanges;
    /**
     * Record a change for sync
     */
    private recordChange;
    /**
     * Get pending changes
     */
    getPendingChanges(): ChangeRecord[];
    /**
     * Sync with remote server
     */
    sync(): Promise<SyncResult>;
    /**
     * Push changes to server
     */
    private pushChanges;
    /**
     * Pull changes from server
     */
    private pullChanges;
    /**
     * Apply a remote change
     */
    private applyRemoteChange;
    /**
     * Resolve a conflict based on strategy
     */
    private resolveConflict;
    /**
     * Mark changes as synced
     */
    private markChangesSynced;
    /**
     * Get last sync timestamp
     */
    private getLastSyncTimestamp;
    /**
     * Set last sync timestamp
     */
    private setLastSyncTimestamp;
    /**
     * Start sync interval
     */
    private startSyncInterval;
    /**
     * Stop sync interval
     */
    stopSyncInterval(): void;
    /**
     * Check if currently syncing
     */
    isSyncing(): boolean;
    /**
     * Get sync status
     */
    getStatus(): {
        pendingChanges: number;
        lastSync: number;
        syncing: boolean;
    };
    /**
     * Cleanup
     */
    dispose(): void;
}
/**
 * Create a sync engine
 */
export declare function createSyncEngine(db: SQLiteDB, config: SyncConfig): SQLiteSyncEngine;
//# sourceMappingURL=sync-engine.d.ts.map