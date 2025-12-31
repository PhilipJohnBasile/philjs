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
export declare class MigrationManager {
    private db;
    private migrations;
    private tableName;
    constructor(db: SQLiteDB, tableName?: string);
    /**
     * Add a migration
     */
    add(migration: Migration): void;
    /**
     * Add multiple migrations
     */
    addAll(migrations: Migration[]): void;
    /**
     * Initialize migrations table
     */
    private initMigrationsTable;
    /**
     * Get applied migration versions
     */
    getAppliedVersions(): number[];
    /**
     * Get pending migrations
     */
    getPending(): Migration[];
    /**
     * Run all pending migrations
     */
    migrate(): MigrationResult;
    /**
     * Run migrations up to a specific version
     */
    migrateTo(targetVersion: number): MigrationResult;
    /**
     * Rollback last migration
     */
    rollback(): MigrationResult;
    /**
     * Rollback to a specific version
     */
    rollbackTo(targetVersion: number): MigrationResult;
    /**
     * Reset database (rollback all migrations)
     */
    reset(): MigrationResult;
    /**
     * Get current version
     */
    getCurrentVersion(): number;
    /**
     * Get migration status
     */
    getStatus(): {
        current: number;
        latest: number;
        pending: number;
        applied: number;
    };
}
/**
 * Create a migration manager
 */
export declare function createMigrationManager(db: SQLiteDB, tableName?: string): MigrationManager;
/**
 * Helper to define a migration
 */
export declare function defineMigration(migration: Migration): Migration;
/**
 * Create migrations from SQL files
 */
export declare function migrationsFromSQL(definitions: Array<{
    version: number;
    name: string;
    up: string;
    down: string;
}>): Migration[];
//# sourceMappingURL=migrations.d.ts.map