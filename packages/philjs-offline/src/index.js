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
// ============================================================================
// IndexedDB Wrapper
// ============================================================================
export class OfflineDB {
    dbName;
    dbVersion;
    db = null;
    stores = new Map();
    constructor(dbName = 'philjs_offline', dbVersion = 1) {
        this.dbName = dbName;
        this.dbVersion = dbVersion;
    }
    async open() {
        if (this.db)
            return this.db;
        const { promise, resolve, reject } = Promise.withResolvers();
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            this.db = request.result;
            resolve(this.db);
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create stores
            for (const store of this.stores.values()) {
                if (!db.objectStoreNames.contains(store.name)) {
                    const objectStore = db.createObjectStore(store.name, {
                        keyPath: store.keyPath,
                        autoIncrement: store.keyPath === 'id'
                    });
                    // Create indexes
                    store.indexes?.forEach(index => {
                        objectStore.createIndex(index.name, index.keyPath, {
                            unique: index.unique ?? false
                        });
                    });
                }
            }
            // Create sync queue store
            if (!db.objectStoreNames.contains('_sync_queue')) {
                const syncStore = db.createObjectStore('_sync_queue', {
                    keyPath: 'id'
                });
                syncStore.createIndex('status', 'status');
                syncStore.createIndex('store', 'store');
            }
            // Create metadata store
            if (!db.objectStoreNames.contains('_metadata')) {
                db.createObjectStore('_metadata', { keyPath: 'key' });
            }
        };
        return promise;
    }
    registerStore(store) {
        this.stores.set(store.name, store);
    }
    async get(storeName, key) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async getAll(storeName) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async query(storeName, indexName, query) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(query);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async put(storeName, data, addToSyncQueue = true) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
            if (addToSyncQueue) {
                await this.addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'update',
                    store: storeName,
                    data,
                    timestamp: Date.now(),
                    retries: 0,
                    status: 'pending'
                });
            }
            resolve(request.result);
        };
        return promise;
    }
    async add(storeName, data, addToSyncQueue = true) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
            if (addToSyncQueue) {
                await this.addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'create',
                    store: storeName,
                    data,
                    timestamp: Date.now(),
                    retries: 0,
                    status: 'pending'
                });
            }
            resolve(request.result);
        };
        return promise;
    }
    async delete(storeName, key, addToSyncQueue = true) {
        const db = await this.open();
        // Get the data before deleting for sync queue
        const data = addToSyncQueue ? await this.get(storeName, key) : null;
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
            if (addToSyncQueue && data) {
                await this.addToSyncQueue({
                    id: crypto.randomUUID(),
                    type: 'delete',
                    store: storeName,
                    data: { key, ...data },
                    timestamp: Date.now(),
                    retries: 0,
                    status: 'pending'
                });
            }
            resolve();
        };
        return promise;
    }
    async clear(storeName) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        return promise;
    }
    async count(storeName) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return promise;
    }
    async addToSyncQueue(operation) {
        const db = await this.open();
        const { promise, resolve, reject } = Promise.withResolvers();
        const transaction = db.transaction('_sync_queue', 'readwrite');
        const store = transaction.objectStore('_sync_queue');
        const request = store.add(operation);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        return promise;
    }
    async getSyncQueue() {
        return this.getAll('_sync_queue');
    }
    async getPendingSyncOperations() {
        return this.query('_sync_queue', 'status', 'pending');
    }
    async updateSyncOperation(operation) {
        await this.put('_sync_queue', operation, false);
    }
    async removeSyncOperation(id) {
        await this.delete('_sync_queue', id, false);
    }
    async setMetadata(key, value) {
        await this.put('_metadata', { key, value, updatedAt: Date.now() }, false);
    }
    async getMetadata(key) {
        const result = await this.get('_metadata', key);
        return result?.value;
    }
    close() {
        this.db?.close();
        this.db = null;
    }
}
// ============================================================================
// Sync Manager
// ============================================================================
export class SyncManager {
    db;
    config;
    syncInterval = null;
    isSyncing = false;
    listeners = new Set();
    constructor(db, config = {}) {
        this.db = db;
        this.config = {
            dbName: config.dbName ?? 'philjs_offline',
            dbVersion: config.dbVersion ?? 1,
            syncInterval: config.syncInterval ?? 30000,
            maxRetries: config.maxRetries ?? 3,
            conflictStrategy: config.conflictStrategy ?? 'last-write-wins'
        };
    }
    async start() {
        // Initial sync
        await this.sync();
        // Set up periodic sync
        this.syncInterval = setInterval(() => {
            this.sync();
        }, this.config.syncInterval);
        // Listen for online events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
        }
    }
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    async sync() {
        if (this.isSyncing || !navigator.onLine)
            return;
        this.isSyncing = true;
        this.notifyListeners('started');
        try {
            const operations = await this.db.getPendingSyncOperations();
            for (const operation of operations) {
                await this.processOperation(operation);
            }
            this.notifyListeners('completed');
        }
        catch (error) {
            console.error('Sync failed:', error);
            this.notifyListeners('failed');
        }
        finally {
            this.isSyncing = false;
        }
    }
    async processOperation(operation) {
        const store = this.db.stores.get(operation.store);
        if (!store?.syncEndpoint) {
            // No sync endpoint, just mark as completed
            await this.db.removeSyncOperation(operation.id);
            return;
        }
        operation.status = 'syncing';
        await this.db.updateSyncOperation(operation);
        try {
            const method = operation.type === 'delete' ? 'DELETE' :
                operation.type === 'create' ? 'POST' : 'PUT';
            const response = await fetch(store.syncEndpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(store.transform ? store.transform(operation.data) : operation.data)
            });
            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }
            // Handle server response
            if (operation.type !== 'delete') {
                const serverData = await response.json();
                await this.handleServerResponse(operation, serverData);
            }
            await this.db.removeSyncOperation(operation.id);
        }
        catch (error) {
            operation.retries++;
            operation.error = error.message;
            if (operation.retries >= this.config.maxRetries) {
                operation.status = 'failed';
            }
            else {
                operation.status = 'pending';
            }
            await this.db.updateSyncOperation(operation);
        }
    }
    async handleServerResponse(operation, serverData) {
        const store = this.db.stores.get(operation.store);
        if (!store)
            return;
        const localData = await this.db.get(operation.store, operation.data[store.keyPath]);
        if (localData) {
            // Check for conflicts
            const localTimestamp = localData._updatedAt ?? 0;
            const serverTimestamp = serverData._updatedAt ?? 0;
            if (serverTimestamp > localTimestamp) {
                // Server has newer data
                switch (this.config.conflictStrategy) {
                    case 'server-wins':
                        await this.db.put(operation.store, serverData, false);
                        break;
                    case 'client-wins':
                        // Keep local data, do nothing
                        break;
                    case 'last-write-wins':
                        await this.db.put(operation.store, serverData, false);
                        break;
                    case 'merge':
                        const merged = this.mergeData(localData, serverData);
                        await this.db.put(operation.store, merged, false);
                        break;
                    case 'manual':
                        // Emit conflict event for manual resolution
                        break;
                }
            }
        }
    }
    mergeData(local, server) {
        // Simple shallow merge - server wins for conflicting keys
        return { ...local, ...server, _updatedAt: Date.now() };
    }
    onSync(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    notifyListeners(status) {
        this.listeners.forEach(cb => cb(status));
    }
    async getPendingCount() {
        const operations = await this.db.getPendingSyncOperations();
        return operations.length;
    }
    async getFailedOperations() {
        return this.db.query('_sync_queue', 'status', 'failed');
    }
    async retryFailed() {
        const failed = await this.getFailedOperations();
        for (const operation of failed) {
            operation.status = 'pending';
            operation.retries = 0;
            await this.db.updateSyncOperation(operation);
        }
        await this.sync();
    }
}
// ============================================================================
// Network Status Monitor
// ============================================================================
export class NetworkMonitor {
    listeners = new Set();
    currentStatus = { online: true };
    constructor() {
        this.updateStatus();
        this.setupListeners();
    }
    updateStatus() {
        if (typeof navigator === 'undefined') {
            this.currentStatus = { online: true };
            return;
        }
        const connection = navigator.connection;
        this.currentStatus = {
            online: navigator.onLine,
            effectiveType: connection?.effectiveType,
            downlink: connection?.downlink,
            rtt: connection?.rtt,
            saveData: connection?.saveData
        };
    }
    setupListeners() {
        if (typeof window === 'undefined')
            return;
        window.addEventListener('online', () => {
            this.updateStatus();
            this.notifyListeners();
        });
        window.addEventListener('offline', () => {
            this.updateStatus();
            this.notifyListeners();
        });
        const connection = navigator.connection;
        if (connection) {
            connection.addEventListener('change', () => {
                this.updateStatus();
                this.notifyListeners();
            });
        }
    }
    getStatus() {
        return { ...this.currentStatus };
    }
    isOnline() {
        return this.currentStatus.online;
    }
    isSlowConnection() {
        return this.currentStatus.effectiveType === 'slow-2g' ||
            this.currentStatus.effectiveType === '2g';
    }
    shouldSaveData() {
        return this.currentStatus.saveData ?? false;
    }
    subscribe(callback) {
        this.listeners.add(callback);
        callback(this.currentStatus);
        return () => this.listeners.delete(callback);
    }
    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentStatus));
    }
}
// ============================================================================
// Cache Manager
// ============================================================================
export class CacheManager {
    cacheName;
    strategies = new Map();
    constructor(cacheName = 'philjs_cache') {
        this.cacheName = cacheName;
    }
    registerStrategy(pattern, strategy) {
        this.strategies.set(pattern, strategy);
    }
    async get(request) {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(request);
        return response ?? undefined;
    }
    async put(request, response) {
        const cache = await caches.open(this.cacheName);
        await cache.put(request, response.clone());
    }
    async delete(request) {
        const cache = await caches.open(this.cacheName);
        return cache.delete(request);
    }
    async clear() {
        await caches.delete(this.cacheName);
    }
    async fetch(request, strategy) {
        const url = typeof request === 'string' ? request : request.url;
        const strat = strategy ?? this.getStrategyForUrl(url);
        switch (strat.strategy) {
            case 'cache-first':
                return this.cacheFirst(request, strat);
            case 'network-first':
                return this.networkFirst(request, strat);
            case 'stale-while-revalidate':
                return this.staleWhileRevalidate(request, strat);
            case 'cache-only':
                return this.cacheOnly(request);
            case 'network-only':
                return this.networkOnly(request);
            default:
                return this.networkFirst(request, strat);
        }
    }
    getStrategyForUrl(url) {
        for (const [pattern, strategy] of this.strategies) {
            if (new RegExp(pattern).test(url)) {
                return strategy;
            }
        }
        // Default strategy
        return { name: 'default', strategy: 'network-first' };
    }
    async cacheFirst(request, strategy) {
        const cached = await this.get(request);
        if (cached && this.isValid(cached, strategy.maxAge)) {
            return cached;
        }
        const response = await fetch(request);
        await this.put(request, response);
        return response;
    }
    async networkFirst(request, strategy) {
        try {
            const response = await fetch(request);
            await this.put(request, response);
            return response;
        }
        catch {
            const cached = await this.get(request);
            if (cached)
                return cached;
            throw new Error('Network request failed and no cache available');
        }
    }
    async staleWhileRevalidate(request, _strategy) {
        const cached = await this.get(request);
        // Revalidate in background
        const fetchPromise = fetch(request).then(response => {
            this.put(request, response);
            return response;
        });
        return cached ?? fetchPromise;
    }
    async cacheOnly(request) {
        const cached = await this.get(request);
        if (!cached) {
            throw new Error('No cache available');
        }
        return cached;
    }
    async networkOnly(request) {
        return fetch(request);
    }
    isValid(response, maxAge) {
        if (!maxAge)
            return true;
        const dateHeader = response.headers.get('date');
        if (!dateHeader)
            return true;
        const date = new Date(dateHeader).getTime();
        const now = Date.now();
        return (now - date) < maxAge;
    }
}
// ============================================================================
// Offline Store Factory
// ============================================================================
export function createOfflineStore(db, store) {
    db.registerStore(store);
    return {
        get: (key) => db.get(store.name, key),
        getAll: () => db.getAll(store.name),
        query: (indexName, query) => db.query(store.name, indexName, query),
        put: (data) => db.put(store.name, { ...data, _updatedAt: Date.now() }),
        add: (data) => db.add(store.name, { ...data, _createdAt: Date.now(), _updatedAt: Date.now() }),
        delete: (key) => db.delete(store.name, key),
        clear: () => db.clear(store.name),
        count: () => db.count(store.name)
    };
}
// ============================================================================
// React-style Hooks
// ============================================================================
// Singleton instances
let globalDB = null;
let globalSyncManager = null;
let globalNetworkMonitor = null;
let globalCacheManager = null;
function getDB(config) {
    if (!globalDB) {
        globalDB = new OfflineDB(config?.dbName, config?.dbVersion);
    }
    return globalDB;
}
function getSyncManager(config) {
    if (!globalSyncManager) {
        globalSyncManager = new SyncManager(getDB(config), config);
    }
    return globalSyncManager;
}
function getNetworkMonitor() {
    if (!globalNetworkMonitor) {
        globalNetworkMonitor = new NetworkMonitor();
    }
    return globalNetworkMonitor;
}
function getCacheManager() {
    if (!globalCacheManager) {
        globalCacheManager = new CacheManager();
    }
    return globalCacheManager;
}
// State helper
function createState(initial) {
    let value = initial;
    return [() => value, (newValue) => { value = newValue; }];
}
/**
 * Hook for offline data
 */
export function useOfflineData(storeName, storeConfig) {
    const db = getDB();
    const store = createOfflineStore(db, { name: storeName, ...storeConfig });
    const [getData, setData] = createState([]);
    const [getLoading, setLoading] = createState(true);
    const refresh = async () => {
        setLoading(true);
        const all = await store.getAll();
        setData(all);
        setLoading(false);
    };
    // Initial load
    refresh();
    return {
        data: getData(),
        get: store.get,
        add: async (item) => {
            const key = await store.add(item);
            await refresh();
            return key;
        },
        update: async (item) => {
            const key = await store.put(item);
            await refresh();
            return key;
        },
        remove: async (key) => {
            await store.delete(key);
            await refresh();
        },
        refresh,
        loading: getLoading()
    };
}
/**
 * Hook for network status
 */
export function useNetworkStatus() {
    const monitor = getNetworkMonitor();
    const [getStatus, setStatus] = createState(monitor.getStatus());
    monitor.subscribe(setStatus);
    const status = getStatus();
    return {
        online: status.online,
        status,
        isSlowConnection: monitor.isSlowConnection(),
        shouldSaveData: monitor.shouldSaveData()
    };
}
/**
 * Hook for sync management
 */
export function useSync(config) {
    const syncManager = getSyncManager(config);
    const [getPending, setPending] = createState(0);
    const [getSyncing, setSyncing] = createState(false);
    syncManager.onSync((status) => {
        setSyncing(status === 'started');
        if (status === 'completed') {
            syncManager.getPendingCount().then(setPending);
        }
    });
    // Initial count
    syncManager.getPendingCount().then(setPending);
    return {
        sync: () => syncManager.sync(),
        pendingCount: getPending(),
        isSyncing: getSyncing(),
        startAutoSync: () => syncManager.start(),
        stopAutoSync: () => syncManager.stop(),
        retryFailed: () => syncManager.retryFailed()
    };
}
/**
 * Hook for caching
 */
export function useCache() {
    const cache = getCacheManager();
    return {
        get: (url) => cache.get(url),
        put: (url, response) => cache.put(url, response),
        delete: (url) => cache.delete(url),
        fetch: (url, strategy) => cache.fetch(url, strategy),
        clear: () => cache.clear()
    };
}
// ============================================================================
// Default Export
// ============================================================================
export default {
    OfflineDB,
    SyncManager,
    NetworkMonitor,
    CacheManager,
    createOfflineStore,
    useOfflineData,
    useNetworkStatus,
    useSync,
    useCache
};
//# sourceMappingURL=index.js.map