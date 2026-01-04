/**
 * @philjs/nexus - Sync Engine
 *
 * Local-first sync engine with CRDT support and multi-backend sync
 */
// ============================================================================
// IndexedDB Adapter
// ============================================================================
/**
 * IndexedDB storage adapter for browser environments
 */
export class IndexedDBAdapter {
    db = null;
    dbName;
    collections = new Set();
    constructor(dbName = 'philjs-nexus') {
        this.dbName = dbName;
    }
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create a generic store for all collections
                if (!db.objectStoreNames.contains('_data')) {
                    db.createObjectStore('_data', { keyPath: ['collection', 'key'] });
                }
                if (!db.objectStoreNames.contains('_meta')) {
                    db.createObjectStore('_meta', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('_pending')) {
                    db.createObjectStore('_pending', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }
    async get(collection, key) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_data', 'readonly');
            const store = tx.objectStore('_data');
            const request = store.get([collection, key]);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                resolve(request.result?.value);
            };
        });
    }
    async getAll(collection) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_data', 'readonly');
            const store = tx.objectStore('_data');
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const results = request.result
                    .filter((item) => item.collection === collection)
                    .map((item) => item.value);
                resolve(results);
            };
        });
    }
    async set(collection, key, value) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_data', 'readwrite');
            const store = tx.objectStore('_data');
            const request = store.put({
                collection,
                key,
                value,
                updatedAt: Date.now(),
            });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async delete(collection, key) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_data', 'readwrite');
            const store = tx.objectStore('_data');
            const request = store.delete([collection, key]);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async clear(collection) {
        const keys = await this.keys(collection);
        for (const key of keys) {
            await this.delete(collection, key);
        }
    }
    async keys(collection) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_data', 'readonly');
            const store = tx.objectStore('_data');
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const keys = request.result
                    .filter((item) => item.collection === collection)
                    .map((item) => item.key);
                resolve(keys);
            };
        });
    }
    async close() {
        this.db?.close();
        this.db = null;
    }
    // Pending changes queue for offline sync
    async addPendingChange(change) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_pending', 'readwrite');
            const store = tx.objectStore('_pending');
            const request = store.add(change);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async getPendingChanges() {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_pending', 'readonly');
            const store = tx.objectStore('_pending');
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async clearPendingChanges() {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('_pending', 'readwrite');
            const store = tx.objectStore('_pending');
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}
// ============================================================================
// Memory Adapter (for testing/SSR)
// ============================================================================
/**
 * In-memory storage adapter
 */
export class MemoryAdapter {
    data = new Map();
    pending = [];
    async init() {
        // No initialization needed
    }
    async get(collection, key) {
        return this.data.get(collection)?.get(key);
    }
    async getAll(collection) {
        const col = this.data.get(collection);
        return col ? Array.from(col.values()) : [];
    }
    async set(collection, key, value) {
        if (!this.data.has(collection)) {
            this.data.set(collection, new Map());
        }
        this.data.get(collection).set(key, value);
    }
    async delete(collection, key) {
        this.data.get(collection)?.delete(key);
    }
    async clear(collection) {
        this.data.delete(collection);
    }
    async keys(collection) {
        const col = this.data.get(collection);
        return col ? Array.from(col.keys()) : [];
    }
    async close() {
        this.data.clear();
    }
}
/**
 * Supabase sync adapter
 */
export class SupabaseSyncAdapter {
    url;
    apiKey;
    connected = false;
    ws = null;
    subscribers = new Set();
    constructor(config) {
        if (config.adapter !== 'supabase') {
            throw new Error('SupabaseSyncAdapter requires supabase adapter config');
        }
        this.url = config.url;
        this.apiKey = config.auth?.apiKey || config.auth?.token || '';
    }
    async connect() {
        // Initialize Supabase realtime connection
        const wsUrl = this.url.replace('https://', 'wss://').replace('http://', 'ws://');
        this.ws = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${this.apiKey}`);
        return new Promise((resolve, reject) => {
            this.ws.onopen = () => {
                this.connected = true;
                // Subscribe to changes
                this.ws.send(JSON.stringify({
                    topic: 'realtime:nexus_sync',
                    event: 'phx_join',
                    payload: {},
                    ref: '1',
                }));
                resolve();
            };
            this.ws.onerror = (error) => {
                reject(new Error('WebSocket connection failed'));
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'sync_changes') {
                        const changes = data.payload.changes;
                        for (const subscriber of this.subscribers) {
                            subscriber(changes);
                        }
                    }
                }
                catch {
                    // Ignore parse errors
                }
            };
            this.ws.onclose = () => {
                this.connected = false;
            };
        });
    }
    async disconnect() {
        this.ws?.close();
        this.ws = null;
        this.connected = false;
    }
    async push(changes) {
        const response = await fetch(`${this.url}/rest/v1/nexus_sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey,
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({ changes }),
        });
        if (!response.ok) {
            return {
                success: false,
                error: new Error(`Sync failed: ${response.statusText}`),
                synced: 0,
                conflicts: [],
            };
        }
        const result = await response.json();
        return {
            success: true,
            synced: changes.length,
            conflicts: result.conflicts || [],
        };
    }
    async pull(since) {
        const response = await fetch(`${this.url}/rest/v1/nexus_sync?updated_at=gte.${new Date(since).toISOString()}`, {
            headers: {
                'apikey': this.apiKey,
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Pull failed: ${response.statusText}`);
        }
        return response.json();
    }
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    isConnected() {
        return this.connected;
    }
}
/**
 * Main sync engine class
 */
export class SyncEngine {
    local;
    remote = null;
    status;
    listeners = new Set();
    syncInterval = null;
    config;
    constructor(config) {
        this.config = config;
        // Initialize local adapter
        switch (config.local.adapter) {
            case 'indexeddb':
                this.local = new IndexedDBAdapter(config.local.dbName);
                break;
            case 'memory':
                this.local = new MemoryAdapter();
                break;
            case 'sqlite':
                // SQLite would require a different implementation
                throw new Error('SQLite adapter not yet implemented');
            default:
                throw new Error(`Unknown local adapter: ${config.local.adapter}`);
        }
        // Initialize remote adapter if configured
        if (config.remote) {
            switch (config.remote.adapter) {
                case 'supabase':
                    this.remote = new SupabaseSyncAdapter(config.remote);
                    break;
                default:
                    throw new Error(`Unknown remote adapter: ${config.remote.adapter}`);
            }
        }
        // Initialize status
        this.status = {
            state: 'idle',
            lastSyncedAt: null,
            pendingChanges: 0,
            error: null,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        };
        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }
    }
    /**
     * Initialize the sync engine
     */
    async init() {
        await this.local.init();
        if (this.remote) {
            try {
                await this.remote.connect();
                this.emit({ type: 'online' });
                // Subscribe to remote changes
                this.remote.subscribe((changes) => {
                    this.applyRemoteChanges(changes);
                });
                // Start sync interval if polling
                if (this.config.remote?.syncStrategy === 'polling') {
                    const interval = this.config.remote.pollInterval || 30000;
                    this.syncInterval = setInterval(() => this.sync(), interval);
                }
            }
            catch (error) {
                console.warn('Failed to connect to remote:', error);
                this.emit({ type: 'offline' });
            }
        }
    }
    /**
     * Get current sync status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get a value from local storage
     */
    async get(collection, key) {
        return this.local.get(collection, key);
    }
    /**
     * Get all values from a collection
     */
    async getAll(collection) {
        return this.local.getAll(collection);
    }
    /**
     * Set a value (writes locally, queues for sync)
     */
    async set(collection, key, value) {
        // Write to local storage
        await this.local.set(collection, key, value);
        // Queue for remote sync if remote is configured
        if (this.remote && this.local instanceof IndexedDBAdapter) {
            await this.local.addPendingChange({
                collection,
                key,
                operation: 'set',
                value,
                timestamp: Date.now(),
            });
            this.status.pendingChanges++;
            // Trigger immediate sync if online
            if (this.status.isOnline) {
                this.sync();
            }
        }
    }
    /**
     * Delete a value
     */
    async delete(collection, key) {
        await this.local.delete(collection, key);
        if (this.remote && this.local instanceof IndexedDBAdapter) {
            await this.local.addPendingChange({
                collection,
                key,
                operation: 'delete',
                timestamp: Date.now(),
            });
            this.status.pendingChanges++;
            if (this.status.isOnline) {
                this.sync();
            }
        }
    }
    /**
     * Manually trigger a sync
     */
    async sync() {
        if (!this.remote) {
            return { success: true, synced: 0, conflicts: [] };
        }
        if (!this.remote.isConnected()) {
            return {
                success: false,
                error: new Error('Not connected to remote'),
                synced: 0,
                conflicts: [],
            };
        }
        this.status.state = 'syncing';
        this.emit({ type: 'sync-start' });
        try {
            // Get pending changes
            let pendingChanges = [];
            if (this.local instanceof IndexedDBAdapter) {
                pendingChanges = await this.local.getPendingChanges();
            }
            // Push pending changes
            if (pendingChanges.length > 0) {
                const result = await this.remote.push(pendingChanges.map((c) => ({
                    collection: c.collection,
                    key: c.key,
                    operation: c.operation,
                    value: c.value,
                    timestamp: c.timestamp,
                })));
                if (result.success && this.local instanceof IndexedDBAdapter) {
                    await this.local.clearPendingChanges();
                    this.status.pendingChanges = 0;
                }
                if (!result.success) {
                    throw result.error;
                }
            }
            // Pull remote changes
            const lastSync = this.status.lastSyncedAt || 0;
            const remoteChanges = await this.remote.pull(lastSync);
            await this.applyRemoteChanges(remoteChanges);
            // Update status
            this.status.state = 'idle';
            this.status.lastSyncedAt = Date.now();
            this.status.error = null;
            this.emit({ type: 'sync-complete', changes: remoteChanges.length });
            return {
                success: true,
                synced: pendingChanges.length + remoteChanges.length,
                conflicts: [],
            };
        }
        catch (error) {
            this.status.state = 'error';
            this.status.error = error;
            this.emit({ type: 'sync-error', error: error });
            return {
                success: false,
                error: error,
                synced: 0,
                conflicts: [],
            };
        }
    }
    /**
     * Subscribe to sync events
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Close the sync engine
     */
    async close() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        await this.remote?.disconnect();
        await this.local.close();
    }
    async applyRemoteChanges(changes) {
        for (const change of changes) {
            if (change.operation === 'set') {
                await this.local.set(change.collection, change.key, change.value);
            }
            else if (change.operation === 'delete') {
                await this.local.delete(change.collection, change.key);
            }
            this.emit({ type: 'document-change', documentId: `${change.collection}/${change.key}` });
        }
    }
    handleOnline() {
        this.status.isOnline = true;
        this.emit({ type: 'online' });
        // Trigger sync when coming back online
        this.sync();
    }
    handleOffline() {
        this.status.isOnline = false;
        this.emit({ type: 'offline' });
    }
    emit(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}
/**
 * Create a new sync engine
 */
export function createSyncEngine(config) {
    return new SyncEngine(config);
}
//# sourceMappingURL=index.js.map