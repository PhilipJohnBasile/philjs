/**
 * SQLite Migrations
 * Schema migration management for SQLite
 */

import type { SQLiteDB } from './sqlite-wasm.js';

/**
 * Migration definition
 */
export interface Migration {
  /** Migration version (must be unique and sequential) */
  version: number;
  /** Migration name for logging */
  name: string;
  /** SQL to apply the migration */
  up: string;
  /** SQL to rollback the migration */
  down: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration succeeded */
  success: boolean;
  /** Applied migrations */
  applied: number[];
  /** Error if failed */
  error?: Error;
}

/**
 * Migration manager
 */
export class MigrationManager {
  private db: SQLiteDB;
  private migrations: Migration[] = [];
  private tableName: string;

  constructor(db: SQLiteDB, tableName = '_migrations') {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Add a migration
   */
  add(migration: Migration): void {
    this.migrations.push(migration);
    // Keep sorted by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Add multiple migrations
   */
  addAll(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.add(migration);
    }
  }

  /**
   * Initialize migrations table
   */
  private initMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * Get applied migration versions
   */
  getAppliedVersions(): number[] {
    this.initMigrationsTable();
    const results = this.db.query<{ version: number }>(
      `SELECT version FROM ${this.tableName} ORDER BY version`
    );
    return results.map((r) => r.version);
  }

  /**
   * Get pending migrations
   */
  getPending(): Migration[] {
    const applied = new Set(this.getAppliedVersions());
    return this.migrations.filter((m) => !applied.has(m.version));
  }

  /**
   * Run all pending migrations
   */
  migrate(): MigrationResult {
    this.initMigrationsTable();
    const pending = this.getPending();
    const applied: number[] = [];

    try {
      this.db.transaction(() => {
        for (const migration of pending) {
          // Run migration SQL
          this.db.exec(migration.up);

          // Record migration
          this.db.exec(
            `INSERT INTO ${this.tableName} (version, name) VALUES (?, ?)`,
            [migration.version, migration.name]
          );

          applied.push(migration.version);
        }
      });

      return { success: true, applied };
    } catch (error) {
      return {
        success: false,
        applied,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Run migrations up to a specific version
   */
  migrateTo(targetVersion: number): MigrationResult {
    this.initMigrationsTable();
    const applied = new Set(this.getAppliedVersions());
    const toApply = this.migrations.filter(
      (m) => m.version <= targetVersion && !applied.has(m.version)
    );
    const appliedVersions: number[] = [];

    try {
      this.db.transaction(() => {
        for (const migration of toApply) {
          this.db.exec(migration.up);
          this.db.exec(
            `INSERT INTO ${this.tableName} (version, name) VALUES (?, ?)`,
            [migration.version, migration.name]
          );
          appliedVersions.push(migration.version);
        }
      });

      return { success: true, applied: appliedVersions };
    } catch (error) {
      return {
        success: false,
        applied: appliedVersions,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Rollback last migration
   */
  rollback(): MigrationResult {
    this.initMigrationsTable();
    const appliedVersions = this.getAppliedVersions();

    if (appliedVersions.length === 0) {
      return { success: true, applied: [] };
    }

    const lastVersion = appliedVersions[appliedVersions.length - 1]!;
    const migration = this.migrations.find((m) => m.version === lastVersion);

    if (!migration) {
      return {
        success: false,
        applied: [],
        error: new Error(`Migration ${lastVersion} not found`),
      };
    }

    try {
      this.db.transaction(() => {
        this.db.exec(migration.down);
        this.db.exec(`DELETE FROM ${this.tableName} WHERE version = ?`, [lastVersion]);
      });

      return { success: true, applied: [lastVersion] };
    } catch (error) {
      return {
        success: false,
        applied: [],
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Rollback to a specific version
   */
  rollbackTo(targetVersion: number): MigrationResult {
    this.initMigrationsTable();
    const appliedVersions = this.getAppliedVersions();
    const toRollback = this.migrations
      .filter((m) => m.version > targetVersion && appliedVersions.includes(m.version))
      .sort((a, b) => b.version - a.version); // Descending order

    const rolledBack: number[] = [];

    try {
      this.db.transaction(() => {
        for (const migration of toRollback) {
          this.db.exec(migration.down);
          this.db.exec(`DELETE FROM ${this.tableName} WHERE version = ?`, [migration.version]);
          rolledBack.push(migration.version);
        }
      });

      return { success: true, applied: rolledBack };
    } catch (error) {
      return {
        success: false,
        applied: rolledBack,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Reset database (rollback all migrations)
   */
  reset(): MigrationResult {
    return this.rollbackTo(-1);
  }

  /**
   * Get current version
   */
  getCurrentVersion(): number {
    const versions = this.getAppliedVersions();
    return versions.length > 0 ? versions[versions.length - 1]! : 0;
  }

  /**
   * Get migration status
   */
  getStatus(): {
    current: number;
    latest: number;
    pending: number;
    applied: number;
  } {
    const applied = this.getAppliedVersions();
    const pending = this.getPending();
    const latest = this.migrations.length > 0 ? this.migrations[this.migrations.length - 1]!.version : 0;

    return {
      current: applied.length > 0 ? applied[applied.length - 1]! : 0,
      latest,
      pending: pending.length,
      applied: applied.length,
    };
  }
}

/**
 * Create a migration manager
 */
export function createMigrationManager(db: SQLiteDB, tableName?: string): MigrationManager {
  return new MigrationManager(db, tableName);
}

/**
 * Helper to define a migration
 */
export function defineMigration(migration: Migration): Migration {
  return migration;
}

/**
 * Create migrations from SQL files
 */
export function migrationsFromSQL(definitions: Array<{ version: number; name: string; up: string; down: string }>): Migration[] {
  return definitions.map(defineMigration);
}
