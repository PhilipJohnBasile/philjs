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
// Types
// ============================================================================

export interface OfflineConfig {
  dbName?: string;
  dbVersion?: number;
  syncInterval?: number;
  maxRetries?: number;
  conflictStrategy?: ConflictStrategy;
}

export type ConflictStrategy =
  | 'client-wins'
  | 'server-wins'
  | 'last-write-wins'
  | 'merge'
  | 'manual';

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

// ============================================================================
// IndexedDB Wrapper
// ============================================================================

export class OfflineDB {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;
  private stores: Map<string, OfflineStore<any>> = new Map();

  constructor(dbName: string = 'philjs_offline', dbVersion: number = 1) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve(this.db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

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

  registerStore<T>(store: OfflineStore<T>): void {
    this.stores.set(store.name, store);
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    const { promise, resolve, reject } = Promise.withResolvers<T | undefined>();

    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    return promise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    const { promise, resolve, reject } = Promise.withResolvers<T[]>();

    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    return promise;
  }

  async query<T>(
    storeName: string,
    indexName: string,
    query: IDBKeyRange | IDBValidKey
  ): Promise<T[]> {
    const db = await this.open();
    const { promise, resolve, reject } = Promise.withResolvers<T[]>();

    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(query);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    return promise;
  }

  async put<T>(storeName: string, data: T, addToSyncQueue = true): Promise<IDBValidKey> {
    const db = await this.open();
    const { promise, resolve, reject } = Promise.withResolvers<IDBValidKey>();

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

  async add<T>(storeName: string, data: T, addToSyncQueue = true): Promise<IDBValidKey> {
    const db = await this.open();
    const { promise, resolve, reject } = Promise.withResolvers<IDBValidKey>();

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

  async delete(storeName: string, key: IDBValidKey, addToSyncQueue = true): Promise<void> {
    const db = await this.open();

    // Get the data before deleting for sync queue
    const data = addToSyncQueue ? await this.get(storeName, key) : null;

    return new Promise((resolve, reject) => {
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
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async addToSyncQueue(operation: SyncOperation): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('_sync_queue', 'readwrite');
      const store = transaction.objectStore('_sync_queue');
      const request = store.add(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    return this.getAll<SyncOperation>('_sync_queue');
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    return this.query<SyncOperation>('_sync_queue', 'status', 'pending');
  }

  async updateSyncOperation(operation: SyncOperation): Promise<void> {
    await this.put('_sync_queue', operation, false);
  }

  async removeSyncOperation(id: string): Promise<void> {
    await this.delete('_sync_queue', id, false);
  }

  async setMetadata(key: string, value: any): Promise<void> {
    await this.put('_metadata', { key, value, updatedAt: Date.now() }, false);
  }

  async getMetadata<T>(key: string): Promise<T | undefined> {
    const result = await this.get<{ key: string; value: T }>('_metadata', key);
    return result?.value;
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

// ============================================================================
// Sync Manager
// ============================================================================

export class SyncManager {
  private db: OfflineDB;
  private config: Required<OfflineConfig>;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private listeners: Set<(status: 'started' | 'completed' | 'failed') => void> = new Set();

  constructor(db: OfflineDB, config: OfflineConfig = {}) {
    this.db = db;
    this.config = {
      dbName: config.dbName ?? 'philjs_offline',
      dbVersion: config.dbVersion ?? 1,
      syncInterval: config.syncInterval ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      conflictStrategy: config.conflictStrategy ?? 'last-write-wins'
    };
  }

  async start(): Promise<void> {
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

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    this.notifyListeners('started');

    try {
      const operations = await this.db.getPendingSyncOperations();

      for (const operation of operations) {
        await this.processOperation(operation);
      }

      this.notifyListeners('completed');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners('failed');
    } finally {
      this.isSyncing = false;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const store = (this.db as any).stores.get(operation.store);
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
    } catch (error: any) {
      operation.retries++;
      operation.error = error.message;

      if (operation.retries >= this.config.maxRetries) {
        operation.status = 'failed';
      } else {
        operation.status = 'pending';
      }

      await this.db.updateSyncOperation(operation);
    }
  }

  private async handleServerResponse(operation: SyncOperation, serverData: any): Promise<void> {
    const store = (this.db as any).stores.get(operation.store);
    if (!store) return;

    const localData = await this.db.get(operation.store, operation.data[store.keyPath]);

    if (localData) {
      // Check for conflicts
      const localTimestamp = (localData as any)._updatedAt ?? 0;
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

  private mergeData(local: any, server: any): any {
    // Simple shallow merge - server wins for conflicting keys
    return { ...local, ...server, _updatedAt: Date.now() };
  }

  onSync(callback: (status: 'started' | 'completed' | 'failed') => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: 'started' | 'completed' | 'failed'): void {
    this.listeners.forEach(cb => cb(status));
  }

  async getPendingCount(): Promise<number> {
    const operations = await this.db.getPendingSyncOperations();
    return operations.length;
  }

  async getFailedOperations(): Promise<SyncOperation[]> {
    return this.db.query<SyncOperation>('_sync_queue', 'status', 'failed');
  }

  async retryFailed(): Promise<void> {
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
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = { online: true };

  constructor() {
    this.updateStatus();
    this.setupListeners();
  }

  private updateStatus(): void {
    if (typeof navigator === 'undefined') {
      this.currentStatus = { online: true };
      return;
    }

    const connection = (navigator as any).connection;

    this.currentStatus = {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData
    };
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.updateStatus();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.updateStatus();
      this.notifyListeners();
    });

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.updateStatus();
        this.notifyListeners();
      });
    }
  }

  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  isOnline(): boolean {
    return this.currentStatus.online;
  }

  isSlowConnection(): boolean {
    return this.currentStatus.effectiveType === 'slow-2g' ||
           this.currentStatus.effectiveType === '2g';
  }

  shouldSaveData(): boolean {
    return this.currentStatus.saveData ?? false;
  }

  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentStatus);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentStatus));
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

export class CacheManager {
  private cacheName: string;
  private strategies: Map<string, CacheStrategy> = new Map();

  constructor(cacheName: string = 'philjs_cache') {
    this.cacheName = cacheName;
  }

  registerStrategy(pattern: string, strategy: CacheStrategy): void {
    this.strategies.set(pattern, strategy);
  }

  async get(request: Request | string): Promise<Response | undefined> {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(request);
    return response ?? undefined;
  }

  async put(request: Request | string, response: Response): Promise<void> {
    const cache = await caches.open(this.cacheName);
    await cache.put(request, response.clone());
  }

  async delete(request: Request | string): Promise<boolean> {
    const cache = await caches.open(this.cacheName);
    return cache.delete(request);
  }

  async clear(): Promise<void> {
    await caches.delete(this.cacheName);
  }

  async fetch(request: Request | string, strategy?: CacheStrategy): Promise<Response> {
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

  private getStrategyForUrl(url: string): CacheStrategy {
    for (const [pattern, strategy] of this.strategies) {
      if (new RegExp(pattern).test(url)) {
        return strategy;
      }
    }

    // Default strategy
    return { name: 'default', strategy: 'network-first' };
  }

  private async cacheFirst(request: Request | string, strategy: CacheStrategy): Promise<Response> {
    const cached = await this.get(request);

    if (cached && this.isValid(cached, strategy.maxAge)) {
      return cached;
    }

    const response = await fetch(request);
    await this.put(request, response);
    return response;
  }

  private async networkFirst(request: Request | string, strategy: CacheStrategy): Promise<Response> {
    try {
      const response = await fetch(request);
      await this.put(request, response);
      return response;
    } catch {
      const cached = await this.get(request);
      if (cached) return cached;
      throw new Error('Network request failed and no cache available');
    }
  }

  private async staleWhileRevalidate(request: Request | string, _strategy: CacheStrategy): Promise<Response> {
    const cached = await this.get(request);

    // Revalidate in background
    const fetchPromise = fetch(request).then(response => {
      this.put(request, response);
      return response;
    });

    return cached ?? fetchPromise;
  }

  private async cacheOnly(request: Request | string): Promise<Response> {
    const cached = await this.get(request);
    if (!cached) {
      throw new Error('No cache available');
    }
    return cached;
  }

  private async networkOnly(request: Request | string): Promise<Response> {
    return fetch(request);
  }

  private isValid(response: Response, maxAge?: number): boolean {
    if (!maxAge) return true;

    const dateHeader = response.headers.get('date');
    if (!dateHeader) return true;

    const date = new Date(dateHeader).getTime();
    const now = Date.now();

    return (now - date) < maxAge;
  }
}

// ============================================================================
// Offline Store Factory
// ============================================================================

export function createOfflineStore<T extends Record<string, any>>(
  db: OfflineDB,
  store: OfflineStore<T>
): {
  get: (key: IDBValidKey) => Promise<T | undefined>;
  getAll: () => Promise<T[]>;
  query: (indexName: string, query: IDBKeyRange | IDBValidKey) => Promise<T[]>;
  put: (data: T) => Promise<IDBValidKey>;
  add: (data: T) => Promise<IDBValidKey>;
  delete: (key: IDBValidKey) => Promise<void>;
  clear: () => Promise<void>;
  count: () => Promise<number>;
} {
  db.registerStore(store);

  return {
    get: (key) => db.get<T>(store.name, key),
    getAll: () => db.getAll<T>(store.name),
    query: (indexName, query) => db.query<T>(store.name, indexName, query),
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
let globalDB: OfflineDB | null = null;
let globalSyncManager: SyncManager | null = null;
let globalNetworkMonitor: NetworkMonitor | null = null;
let globalCacheManager: CacheManager | null = null;

function getDB(config?: OfflineConfig): OfflineDB {
  if (!globalDB) {
    globalDB = new OfflineDB(config?.dbName, config?.dbVersion);
  }
  return globalDB;
}

function getSyncManager(config?: OfflineConfig): SyncManager {
  if (!globalSyncManager) {
    globalSyncManager = new SyncManager(getDB(config), config);
  }
  return globalSyncManager;
}

function getNetworkMonitor(): NetworkMonitor {
  if (!globalNetworkMonitor) {
    globalNetworkMonitor = new NetworkMonitor();
  }
  return globalNetworkMonitor;
}

function getCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager();
  }
  return globalCacheManager;
}

// State helper
function createState<T>(initial: T): [() => T, (value: T) => void] {
  let value = initial;
  return [() => value, (newValue: T) => { value = newValue; }];
}

/**
 * Hook for offline data
 */
export function useOfflineData<T extends Record<string, any>>(
  storeName: string,
  storeConfig: Omit<OfflineStore<T>, 'name'>
): {
  data: T[];
  get: (key: IDBValidKey) => Promise<T | undefined>;
  add: (item: T) => Promise<IDBValidKey>;
  update: (item: T) => Promise<IDBValidKey>;
  remove: (key: IDBValidKey) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
} {
  const db = getDB();
  const store = createOfflineStore<T>(db, { name: storeName, ...storeConfig });
  const [getData, setData] = createState<T[]>([]);
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
export function useNetworkStatus(): {
  online: boolean;
  status: NetworkStatus;
  isSlowConnection: boolean;
  shouldSaveData: boolean;
} {
  const monitor = getNetworkMonitor();
  const [getStatus, setStatus] = createState<NetworkStatus>(monitor.getStatus());

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
export function useSync(config?: OfflineConfig): {
  sync: () => Promise<void>;
  pendingCount: number;
  isSyncing: boolean;
  startAutoSync: () => Promise<void>;
  stopAutoSync: () => void;
  retryFailed: () => Promise<void>;
} {
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
export function useCache(): {
  get: (url: string) => Promise<Response | undefined>;
  put: (url: string, response: Response) => Promise<void>;
  delete: (url: string) => Promise<boolean>;
  fetch: (url: string, strategy?: CacheStrategy) => Promise<Response>;
  clear: () => Promise<void>;
} {
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
// Exports
// ============================================================================

export {
  OfflineDB,
  SyncManager,
  NetworkMonitor,
  CacheManager,
  createOfflineStore
};

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
