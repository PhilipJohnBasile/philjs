/**
 * SQLite Sync Engine
 * Synchronization between local SQLite and remote server
 */

import type { SQLiteDB, Row, TableChangeEvent } from '../db/sqlite-wasm.js';

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
export class SQLiteSyncEngine {
  private db: SQLiteDB;
  private config: SyncConfig;
  private changesTable = '_sync_changes';
  private metaTable = '_sync_meta';
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private unsubscribes: Array<() => void> = [];
  private syncing = false;

  constructor(db: SQLiteDB, config: SyncConfig) {
    this.db = db;
    this.config = {
      syncInterval: 0,
      ...config,
    };
  }

  /**
   * Initialize sync engine
   */
  async initialize(): Promise<void> {
    // Create sync tracking tables
    this.createSyncTables();

    // Subscribe to changes on tracked tables
    this.subscribeToChanges();

    // Start sync interval if configured
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.startSyncInterval();
    }
  }

  /**
   * Create sync tracking tables
   */
  private createSyncTables(): void {
    // Changes tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.changesTable} (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_changes_synced
      ON ${this.changesTable}(synced, timestamp)
    `);

    // Sync metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.metaTable} (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  /**
   * Subscribe to changes on tracked tables
   */
  private subscribeToChanges(): void {
    for (const table of this.config.tables) {
      const unsubscribe = this.db.onTableChange(table, (event) => {
        this.recordChange(event);
      });
      this.unsubscribes.push(unsubscribe);
    }
  }

  /**
   * Record a change for sync
   */
  private recordChange(event: TableChangeEvent): void {
    // Get the row data (for INSERT/UPDATE)
    let data: Row | null = null;
    if (event.operation !== 'DELETE') {
      const rows = this.db.query(`SELECT * FROM ${event.table} WHERE rowid = ?`, [event.rowId]);
      data = rows[0] ?? null;
    }

    const change: ChangeRecord = {
      id: crypto.randomUUID(),
      table: event.table,
      operation: event.operation,
      rowId: event.rowId,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    this.db.exec(
      `INSERT INTO ${this.changesTable} (id, table_name, operation, row_id, data, timestamp, synced) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [change.id, change.table, change.operation, change.rowId, JSON.stringify(change.data), change.timestamp, 0]
    );
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): ChangeRecord[] {
    const rows = this.db.query<Row>(
      `SELECT * FROM ${this.changesTable} WHERE synced = 0 ORDER BY timestamp`
    );

    return rows.map((row) => ({
      id: row.id as string,
      table: row.table_name as string,
      operation: row.operation as 'INSERT' | 'UPDATE' | 'DELETE',
      rowId: row.row_id as number,
      data: row.data ? JSON.parse(row.data as string) : null,
      timestamp: row.timestamp as number,
      synced: Boolean(row.synced),
    }));
  }

  /**
   * Sync with remote server
   */
  async sync(): Promise<SyncResult> {
    if (this.syncing) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
        duration: 0,
      };
    }

    this.syncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let pushed = 0;
    let pulled = 0;
    let conflicts = 0;

    try {
      // Get pending changes
      const pendingChanges = this.getPendingChanges();

      if (this.config.endpoint) {
        // Push changes to server
        const pushResult = await this.pushChanges(pendingChanges);
        pushed = pushResult.pushed;
        errors.push(...pushResult.errors);

        // Pull changes from server
        const pullResult = await this.pullChanges();
        pulled = pullResult.pulled;
        conflicts = pullResult.conflicts;
        errors.push(...pullResult.errors);
      } else {
        // No endpoint - just mark changes as synced (local-only mode)
        this.markChangesSynced(pendingChanges.map((c) => c.id));
        pushed = pendingChanges.length;
      }

      const result: SyncResult = {
        success: errors.length === 0,
        pushed,
        pulled,
        conflicts,
        errors,
        duration: Date.now() - startTime,
      };

      this.config.onSyncComplete?.(result);
      return result;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Push changes to server
   */
  private async pushChanges(changes: ChangeRecord[]): Promise<{ pushed: number; errors: string[] }> {
    if (changes.length === 0) {
      return { pushed: 0, errors: [] };
    }

    const errors: string[] = [];
    let pushed = 0;

    try {
      const token = await this.config.getAuthToken?.();

      const response = await fetch(`${this.config.endpoint}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ changes }),
      });

      if (!response.ok) {
        errors.push(`Push failed: ${response.statusText}`);
        return { pushed, errors };
      }

      const result = await response.json() as { accepted: string[]; rejected: Array<{ id: string; reason: string }> };

      // Mark accepted changes as synced
      if (result.accepted && result.accepted.length > 0) {
        this.markChangesSynced(result.accepted);
        pushed = result.accepted.length;
      }

      // Log rejected changes
      if (result.rejected) {
        for (const reject of result.rejected) {
          errors.push(`Change ${reject.id} rejected: ${reject.reason}`);
        }
      }
    } catch (err) {
      errors.push(`Push error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return { pushed, errors };
  }

  /**
   * Pull changes from server
   */
  private async pullChanges(): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
    const errors: string[] = [];
    let pulled = 0;
    let conflicts = 0;

    try {
      const token = await this.config.getAuthToken?.();
      const lastSync = this.getLastSyncTimestamp();

      const response = await fetch(`${this.config.endpoint}/pull?since=${lastSync}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        errors.push(`Pull failed: ${response.statusText}`);
        return { pulled, conflicts, errors };
      }

      const result = await response.json() as { changes: ChangeRecord[]; timestamp: number };

      // Apply changes
      for (const change of result.changes) {
        try {
          const conflictResult = await this.applyRemoteChange(change);
          if (conflictResult === 'applied') {
            pulled++;
          } else if (conflictResult === 'conflict') {
            conflicts++;
          }
        } catch (err) {
          errors.push(`Apply change error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update last sync timestamp
      this.setLastSyncTimestamp(result.timestamp);
    } catch (err) {
      errors.push(`Pull error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return { pulled, conflicts, errors };
  }

  /**
   * Apply a remote change
   */
  private async applyRemoteChange(change: ChangeRecord): Promise<'applied' | 'conflict' | 'skipped'> {
    // Check for conflict
    const localRow = this.db.queryOne(`SELECT * FROM ${change.table} WHERE rowid = ?`, [change.rowId]);

    if (localRow && change.operation !== 'DELETE') {
      // Potential conflict
      const conflict: SyncConflict = {
        table: change.table,
        rowId: change.rowId,
        localData: localRow,
        remoteData: change.data!,
        localTimestamp: Date.now(), // Would need to track this properly
        remoteTimestamp: change.timestamp,
      };

      const resolution = await this.resolveConflict(conflict);

      switch (resolution.action) {
        case 'use-local':
          return 'skipped';
        case 'use-remote':
          // Apply remote change
          break;
        case 'use-merged':
          change.data = resolution.mergedData!;
          break;
      }
    }

    // Apply the change
    switch (change.operation) {
      case 'INSERT':
        if (change.data) {
          const columns = Object.keys(change.data);
          const values = Object.values(change.data);
          const placeholders = columns.map(() => '?').join(', ');
          this.db.exec(
            `INSERT OR REPLACE INTO ${change.table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
        break;

      case 'UPDATE':
        if (change.data) {
          const sets = Object.keys(change.data).map((k) => `${k} = ?`).join(', ');
          const values = [...Object.values(change.data), change.rowId];
          this.db.exec(`UPDATE ${change.table} SET ${sets} WHERE rowid = ?`, values);
        }
        break;

      case 'DELETE':
        this.db.exec(`DELETE FROM ${change.table} WHERE rowid = ?`, [change.rowId]);
        break;
    }

    return 'applied';
  }

  /**
   * Resolve a conflict based on strategy
   */
  private async resolveConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    switch (this.config.conflictStrategy) {
      case 'client-wins':
        return { action: 'use-local' };

      case 'server-wins':
        return { action: 'use-remote' };

      case 'last-write-wins':
        return conflict.localTimestamp > conflict.remoteTimestamp
          ? { action: 'use-local' }
          : { action: 'use-remote' };

      case 'merge':
        // Simple merge: combine all fields, prefer remote for conflicts
        const merged = { ...conflict.localData, ...conflict.remoteData };
        return { action: 'use-merged', mergedData: merged };

      case 'manual':
        if (this.config.onConflict) {
          return await this.config.onConflict(conflict);
        }
        return { action: 'use-remote' };

      default:
        return { action: 'use-remote' };
    }
  }

  /**
   * Mark changes as synced
   */
  private markChangesSynced(ids: string[]): void {
    if (ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(', ');
    this.db.exec(`UPDATE ${this.changesTable} SET synced = 1 WHERE id IN (${placeholders})`, ids);
  }

  /**
   * Get last sync timestamp
   */
  private getLastSyncTimestamp(): number {
    const row = this.db.queryOne<{ value: string }>(
      `SELECT value FROM ${this.metaTable} WHERE key = 'last_sync'`
    );
    return row ? parseInt(row.value, 10) : 0;
  }

  /**
   * Set last sync timestamp
   */
  private setLastSyncTimestamp(timestamp: number): void {
    this.db.exec(
      `INSERT OR REPLACE INTO ${this.metaTable} (key, value) VALUES ('last_sync', ?)`,
      [String(timestamp)]
    );
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      this.sync().catch((err) => {
        if (this.config.debug) {
          console.error('Sync error:', err);
        }
      });
    }, this.config.syncInterval);
  }

  /**
   * Stop sync interval
   */
  stopSyncInterval(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * Get sync status
   */
  getStatus(): { pendingChanges: number; lastSync: number; syncing: boolean } {
    const pending = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.changesTable} WHERE synced = 0`
    );

    return {
      pendingChanges: pending?.count ?? 0,
      lastSync: this.getLastSyncTimestamp(),
      syncing: this.syncing,
    };
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopSyncInterval();
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
    this.unsubscribes = [];
  }
}

/**
 * Create a sync engine
 */
export function createSyncEngine(db: SQLiteDB, config: SyncConfig): SQLiteSyncEngine {
  return new SQLiteSyncEngine(db, config);
}
