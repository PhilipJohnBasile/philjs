/**
 * @philjs/nexus - Sync Engine
 *
 * Local-first sync engine with CRDT support and multi-backend sync
 */

import type {
  LocalConfig,
  RemoteConfig,
  SyncStatus,
  SyncEvent,
  SyncEventListener,
  ConflictMetadata,
} from '../types.js';

// ============================================================================
// Storage Adapter Interface
// ============================================================================

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

// ============================================================================
// IndexedDB Adapter
// ============================================================================

/**
 * IndexedDB storage adapter for browser environments
 */
export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private collections: Set<string> = new Set();

  constructor(dbName: string = 'philjs-nexus') {
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
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

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_data', 'readonly');
      const store = tx.objectStore('_data');
      const request = store.get([collection, key]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.value as T | undefined);
      };
    });
  }

  async getAll<T>(collection: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_data', 'readonly');
      const store = tx.objectStore('_data');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = (request.result as Array<{ collection: string; key: string; value: T }>)
          .filter((item) => item.collection === collection)
          .map((item) => item.value);
        resolve(results);
      };
    });
  }

  async set<T>(collection: string, key: string, value: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_data', 'readwrite');
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

  async delete(collection: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_data', 'readwrite');
      const store = tx.objectStore('_data');
      const request = store.delete([collection, key]);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(collection: string): Promise<void> {
    const keys = await this.keys(collection);
    for (const key of keys) {
      await this.delete(collection, key);
    }
  }

  async keys(collection: string): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_data', 'readonly');
      const store = tx.objectStore('_data');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const keys = (request.result as Array<{ collection: string; key: string }>)
          .filter((item) => item.collection === collection)
          .map((item) => item.key);
        resolve(keys);
      };
    });
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

  // Pending changes queue for offline sync
  async addPendingChange(change: PendingChange): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_pending', 'readwrite');
      const store = tx.objectStore('_pending');
      const request = store.add(change);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_pending', 'readonly');
      const store = tx.objectStore('_pending');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as PendingChange[]);
    });
  }

  async clearPendingChanges(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('_pending', 'readwrite');
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
export class MemoryAdapter implements StorageAdapter {
  private data: Map<string, Map<string, unknown>> = new Map();
  private pending: PendingChange[] = [];

  async init(): Promise<void> {
    // No initialization needed
  }

  async get<T>(collection: string, key: string): Promise<T | undefined> {
    return this.data.get(collection)?.get(key) as T | undefined;
  }

  async getAll<T>(collection: string): Promise<T[]> {
    const col = this.data.get(collection);
    return col ? (Array.from(col.values()) as T[]) : [];
  }

  async set<T>(collection: string, key: string, value: T): Promise<void> {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }
    this.data.get(collection)!.set(key, value);
  }

  async delete(collection: string, key: string): Promise<void> {
    this.data.get(collection)?.delete(key);
  }

  async clear(collection: string): Promise<void> {
    this.data.delete(collection);
  }

  async keys(collection: string): Promise<string[]> {
    const col = this.data.get(collection);
    return col ? Array.from(col.keys()) : [];
  }

  async close(): Promise<void> {
    this.data.clear();
  }
}

// ============================================================================
// Remote Sync Adapter Interface
// ============================================================================

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
export class SupabaseSyncAdapter implements RemoteSyncAdapter {
  private url: string;
  private apiKey: string;
  private connected: boolean = false;
  private ws: WebSocket | null = null;
  private subscribers: Set<(changes: SyncChange[]) => void> = new Set();

  constructor(config: RemoteConfig) {
    if (config.adapter !== 'supabase') {
      throw new Error('SupabaseSyncAdapter requires supabase adapter config');
    }
    this.url = config.url;
    this.apiKey = config.auth?.apiKey || config.auth?.token || '';
  }

  async connect(): Promise<void> {
    // Initialize Supabase realtime connection
    const wsUrl = this.url.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${this.apiKey}`);

    return new Promise((resolve, reject) => {
      this.ws!.onopen = () => {
        this.connected = true;
        // Subscribe to changes
        this.ws!.send(JSON.stringify({
          topic: 'realtime:nexus_sync',
          event: 'phx_join',
          payload: {},
          ref: '1',
        }));
        resolve();
      };

      this.ws!.onerror = (error) => {
        reject(new Error('WebSocket connection failed'));
      };

      this.ws!.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'sync_changes') {
            const changes = data.payload.changes as SyncChange[];
            for (const subscriber of this.subscribers) {
              subscriber(changes);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.ws!.onclose = () => {
        this.connected = false;
      };
    });
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  async push(changes: SyncChange[]): Promise<SyncResult> {
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

  async pull(since: number): Promise<SyncChange[]> {
    const response = await fetch(
      `${this.url}/rest/v1/nexus_sync?updated_at=gte.${new Date(since).toISOString()}`,
      {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pull failed: ${response.statusText}`);
    }

    return response.json();
  }

  subscribe(callback: (changes: SyncChange[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// Sync Engine
// ============================================================================

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
export class SyncEngine {
  private local: StorageAdapter;
  private remote: RemoteSyncAdapter | null = null;
  private status: SyncStatus;
  private listeners: Set<SyncEventListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private config: SyncEngineConfig;

  constructor(config: SyncEngineConfig) {
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
  async init(): Promise<void> {
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
      } catch (error) {
        console.warn('Failed to connect to remote:', error);
        this.emit({ type: 'offline' });
      }
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get a value from local storage
   */
  async get<T>(collection: string, key: string): Promise<T | undefined> {
    return this.local.get<T>(collection, key);
  }

  /**
   * Get all values from a collection
   */
  async getAll<T>(collection: string): Promise<T[]> {
    return this.local.getAll<T>(collection);
  }

  /**
   * Set a value (writes locally, queues for sync)
   */
  async set<T>(collection: string, key: string, value: T): Promise<void> {
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
  async delete(collection: string, key: string): Promise<void> {
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
  async sync(): Promise<SyncResult> {
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
      let pendingChanges: PendingChange[] = [];
      if (this.local instanceof IndexedDBAdapter) {
        pendingChanges = await this.local.getPendingChanges();
      }

      // Push pending changes
      if (pendingChanges.length > 0) {
        const result = await this.remote.push(
          pendingChanges.map((c) => ({
            collection: c.collection,
            key: c.key,
            operation: c.operation,
            value: c.value,
            timestamp: c.timestamp,
          }))
        );

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
    } catch (error) {
      this.status.state = 'error';
      this.status.error = error as Error;
      this.emit({ type: 'sync-error', error: error as Error });

      return {
        success: false,
        error: error as Error,
        synced: 0,
        conflicts: [],
      };
    }
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Close the sync engine
   */
  async close(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    await this.remote?.disconnect();
    await this.local.close();
  }

  private async applyRemoteChanges(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      if (change.operation === 'set') {
        await this.local.set(change.collection, change.key, change.value);
      } else if (change.operation === 'delete') {
        await this.local.delete(change.collection, change.key);
      }
      this.emit({ type: 'document-change', documentId: `${change.collection}/${change.key}` });
    }
  }

  private handleOnline(): void {
    this.status.isOnline = true;
    this.emit({ type: 'online' });
    // Trigger sync when coming back online
    this.sync();
  }

  private handleOffline(): void {
    this.status.isOnline = false;
    this.emit({ type: 'offline' });
  }

  private emit(event: SyncEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/**
 * Create a new sync engine
 */
export function createSyncEngine(config: SyncEngineConfig): SyncEngine {
  return new SyncEngine(config);
}
