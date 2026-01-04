/**
 * @philjs/nexus - Sync Engine
 *
 * Local-first sync engine with CRDT support and multi-backend sync
 */
import type { LocalConfig, RemoteConfig, SyncStatus, SyncEventListener, ConflictMetadata } from '../types.js';
/**
 * Storage adapter interface for local persistence
 */
export interface StorageAdapter {
    /** Initialize the storage */
    init(): Promise<void>;
    /** Get a value by key */
    get<T>(collection: string, key: string): Promise<T | undefined>;
    /** Get all values in a collection */
    getAll<T>(collection: string): Promise<T[]>;
    /** Set a value */
    set<T>(collection: string, key: string, value: T): Promise<void>;
    /** Delete a value */
    delete(collection: string, key: string): Promise<void>;
    /** Clear a collection */
    clear(collection: string): Promise<void>;
    /** Get all keys in a collection */
    keys(collection: string): Promise<string[]>;
    /** Close the storage connection */
    close(): Promise<void>;
}
/**
 * IndexedDB storage adapter for browser environments
 */
export declare class IndexedDBAdapter implements StorageAdapter {
    private db;
    private dbName;
    private collections;
    constructor(dbName?: string);
    init(): Promise<void>;
    get<T>(collection: string, key: string): Promise<T | undefined>;
    getAll<T>(collection: string): Promise<T[]>;
    set<T>(collection: string, key: string, value: T): Promise<void>;
    delete(collection: string, key: string): Promise<void>;
    clear(collection: string): Promise<void>;
    keys(collection: string): Promise<string[]>;
    close(): Promise<void>;
    addPendingChange(change: PendingChange): Promise<void>;
    getPendingChanges(): Promise<PendingChange[]>;
    clearPendingChanges(): Promise<void>;
}
/**
 * In-memory storage adapter
 */
export declare class MemoryAdapter implements StorageAdapter {
    private data;
    private pending;
    init(): Promise<void>;
    get<T>(collection: string, key: string): Promise<T | undefined>;
    getAll<T>(collection: string): Promise<T[]>;
    set<T>(collection: string, key: string, value: T): Promise<void>;
    delete(collection: string, key: string): Promise<void>;
    clear(collection: string): Promise<void>;
    keys(collection: string): Promise<string[]>;
    close(): Promise<void>;
}
/**
 * Remote sync adapter interface
 */
export interface RemoteSyncAdapter {
    /** Connect to the remote */
    connect(): Promise<void>;
    /** Disconnect from the remote */
    disconnect(): Promise<void>;
    /** Push local changes to remote */
    push(changes: SyncChange[]): Promise<SyncResult>;
    /** Pull remote changes */
    pull(since: number): Promise<SyncChange[]>;
    /** Subscribe to real-time changes */
    subscribe(callback: (changes: SyncChange[]) => void): () => void;
    /** Check if connected */
    isConnected(): boolean;
}
/**
 * Supabase sync adapter
 */
export declare class SupabaseSyncAdapter implements RemoteSyncAdapter {
    private url;
    private apiKey;
    private connected;
    private ws;
    private subscribers;
    constructor(config: RemoteConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    push(changes: SyncChange[]): Promise<SyncResult>;
    pull(since: number): Promise<SyncChange[]>;
    subscribe(callback: (changes: SyncChange[]) => void): () => void;
    isConnected(): boolean;
}
/**
 * Pending change structure
 */
export interface PendingChange {
    id?: number;
    collection: string;
    key: string;
    operation: 'set' | 'delete';
    value?: unknown;
    timestamp: number;
}
/**
 * Sync change from remote
 */
export interface SyncChange {
    collection: string;
    key: string;
    operation: 'set' | 'delete';
    value?: unknown;
    timestamp: number;
    userId?: string;
}
/**
 * Sync result
 */
export interface SyncResult {
    success: boolean;
    error?: Error;
    synced: number;
    conflicts: ConflictMetadata[];
}
/**
 * Sync engine configuration
 */
export interface SyncEngineConfig {
    local: LocalConfig;
    remote?: RemoteConfig;
}
/**
 * Main sync engine class
 */
export declare class SyncEngine {
    private local;
    private remote;
    private status;
    private listeners;
    private syncInterval;
    private config;
    constructor(config: SyncEngineConfig);
    /**
     * Initialize the sync engine
     */
    init(): Promise<void>;
    /**
     * Get current sync status
     */
    getStatus(): SyncStatus;
    /**
     * Get a value from local storage
     */
    get<T>(collection: string, key: string): Promise<T | undefined>;
    /**
     * Get all values from a collection
     */
    getAll<T>(collection: string): Promise<T[]>;
    /**
     * Set a value (writes locally, queues for sync)
     */
    set<T>(collection: string, key: string, value: T): Promise<void>;
    /**
     * Delete a value
     */
    delete(collection: string, key: string): Promise<void>;
    /**
     * Manually trigger a sync
     */
    sync(): Promise<SyncResult>;
    /**
     * Subscribe to sync events
     */
    subscribe(listener: SyncEventListener): () => void;
    /**
     * Close the sync engine
     */
    close(): Promise<void>;
    private applyRemoteChanges;
    private handleOnline;
    private handleOffline;
    private emit;
}
/**
 * Create a new sync engine
 */
export declare function createSyncEngine(config: SyncEngineConfig): SyncEngine;
//# sourceMappingURL=index.d.ts.map