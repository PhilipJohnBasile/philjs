/**
 * @philjs/offline - Offline-First Architecture
 *
 * Local-first data with automatic sync when online.
 * NO OTHER FRAMEWORK provides complete offline-first primitives.
 *
 * Features:
 * - IndexedDB with reactive bindings
 * - Automatic background sync
 * - Conflict resolution strategies
 * - Optimistic updates
 * - Offline queue management
 * - Network status detection
 * - Service worker integration
 * - Cache strategies
 */
export interface OfflineConfig {
    dbName?: string;
    dbVersion?: number;
    syncInterval?: number;
    maxRetries?: number;
    conflictStrategy?: ConflictStrategy;
}
export type ConflictStrategy = 'client-wins' | 'server-wins' | 'last-write-wins' | 'merge' | 'manual';
export interface SyncOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    store: string;
    data: any;
    timestamp: number;
    retries: number;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
    error?: string;
}
export interface OfflineStore<T> {
    name: string;
    keyPath: string;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
    }>;
    syncEndpoint?: string;
    transform?: (data: T) => any;
}
export interface NetworkStatus {
    online: boolean;
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
}
export interface CacheStrategy {
    name: string;
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
    maxAge?: number;
    maxEntries?: number;
}
export declare class OfflineDB {
    private dbName;
    private dbVersion;
    private db;
    private stores;
    constructor(dbName?: string, dbVersion?: number);
    open(): Promise<IDBDatabase>;
    registerStore<T>(store: OfflineStore<T>): void;
    get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
    getAll<T>(storeName: string): Promise<T[]>;
    query<T>(storeName: string, indexName: string, query: IDBKeyRange | IDBValidKey): Promise<T[]>;
    put<T>(storeName: string, data: T, addToSyncQueue?: boolean): Promise<IDBValidKey>;
    add<T>(storeName: string, data: T, addToSyncQueue?: boolean): Promise<IDBValidKey>;
    delete(storeName: string, key: IDBValidKey, addToSyncQueue?: boolean): Promise<void>;
    clear(storeName: string): Promise<void>;
    count(storeName: string): Promise<number>;
    private addToSyncQueue;
    getSyncQueue(): Promise<SyncOperation[]>;
    getPendingSyncOperations(): Promise<SyncOperation[]>;
    updateSyncOperation(operation: SyncOperation): Promise<void>;
    removeSyncOperation(id: string): Promise<void>;
    setMetadata(key: string, value: any): Promise<void>;
    getMetadata<T>(key: string): Promise<T | undefined>;
    close(): void;
}
export declare class SyncManager {
    private db;
    private config;
    private syncInterval;
    private isSyncing;
    private listeners;
    constructor(db: OfflineDB, config?: OfflineConfig);
    start(): Promise<void>;
    stop(): void;
    sync(): Promise<void>;
    private processOperation;
    private handleServerResponse;
    private mergeData;
    onSync(callback: (status: 'started' | 'completed' | 'failed') => void): () => void;
    private notifyListeners;
    getPendingCount(): Promise<number>;
    getFailedOperations(): Promise<SyncOperation[]>;
    retryFailed(): Promise<void>;
}
export declare class NetworkMonitor {
    private listeners;
    private currentStatus;
    constructor();
    private updateStatus;
    private setupListeners;
    getStatus(): NetworkStatus;
    isOnline(): boolean;
    isSlowConnection(): boolean;
    shouldSaveData(): boolean;
    subscribe(callback: (status: NetworkStatus) => void): () => void;
    private notifyListeners;
}
export declare class CacheManager {
    private cacheName;
    private strategies;
    constructor(cacheName?: string);
    registerStrategy(pattern: string, strategy: CacheStrategy): void;
    get(request: Request | string): Promise<Response | undefined>;
    put(request: Request | string, response: Response): Promise<void>;
    delete(request: Request | string): Promise<boolean>;
    clear(): Promise<void>;
    fetch(request: Request | string, strategy?: CacheStrategy): Promise<Response>;
    private getStrategyForUrl;
    private cacheFirst;
    private networkFirst;
    private staleWhileRevalidate;
    private cacheOnly;
    private networkOnly;
    private isValid;
}
export declare function createOfflineStore<T extends Record<string, any>>(db: OfflineDB, store: OfflineStore<T>): {
    get: (key: IDBValidKey) => Promise<T | undefined>;
    getAll: () => Promise<T[]>;
    query: (indexName: string, query: IDBKeyRange | IDBValidKey) => Promise<T[]>;
    put: (data: T) => Promise<IDBValidKey>;
    add: (data: T) => Promise<IDBValidKey>;
    delete: (key: IDBValidKey) => Promise<void>;
    clear: () => Promise<void>;
    count: () => Promise<number>;
};
/**
 * Hook for offline data
 */
export declare function useOfflineData<T extends Record<string, any>>(storeName: string, storeConfig: Omit<OfflineStore<T>, 'name'>): {
    data: T[];
    get: (key: IDBValidKey) => Promise<T | undefined>;
    add: (item: T) => Promise<IDBValidKey>;
    update: (item: T) => Promise<IDBValidKey>;
    remove: (key: IDBValidKey) => Promise<void>;
    refresh: () => Promise<void>;
    loading: boolean;
};
/**
 * Hook for network status
 */
export declare function useNetworkStatus(): {
    online: boolean;
    status: NetworkStatus;
    isSlowConnection: boolean;
    shouldSaveData: boolean;
};
/**
 * Hook for sync management
 */
export declare function useSync(config?: OfflineConfig): {
    sync: () => Promise<void>;
    pendingCount: number;
    isSyncing: boolean;
    startAutoSync: () => Promise<void>;
    stopAutoSync: () => void;
    retryFailed: () => Promise<void>;
};
/**
 * Hook for caching
 */
export declare function useCache(): {
    get: (url: string) => Promise<Response | undefined>;
    put: (url: string, response: Response) => Promise<void>;
    delete: (url: string) => Promise<boolean>;
    fetch: (url: string, strategy?: CacheStrategy) => Promise<Response>;
    clear: () => Promise<void>;
};
declare const _default: {
    OfflineDB: typeof OfflineDB;
    SyncManager: typeof SyncManager;
    NetworkMonitor: typeof NetworkMonitor;
    CacheManager: typeof CacheManager;
    createOfflineStore: typeof createOfflineStore;
    useOfflineData: typeof useOfflineData;
    useNetworkStatus: typeof useNetworkStatus;
    useSync: typeof useSync;
    useCache: typeof useCache;
};
export default _default;
//# sourceMappingURL=index.d.ts.map