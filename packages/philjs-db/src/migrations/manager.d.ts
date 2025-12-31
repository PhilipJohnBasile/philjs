/**
 * PhilJS Database Migration Manager
 * Core migration orchestration and execution
 */
import type { MigrationConfig, MigrationStatus, MigrationResult } from './types.js';
export declare class MigrationManager {
    private config;
    private connection;
    constructor(config: MigrationConfig);
    /**
     * Initialize migration system
     */
    initialize(): Promise<void>;
    /**
     * Create migrations tracking table
     */
    private createMigrationsTable;
    /**
     * Get migration status
     */
    getStatus(): Promise<MigrationStatus>;
    /**
     * Run pending migrations
     */
    migrate(options?: {
        to?: string;
        step?: number;
    }): Promise<MigrationResult>;
    /**
     * Rollback migrations
     */
    rollback(options?: {
        to?: string;
        step?: number;
        batch?: number;
    }): Promise<MigrationResult>;
    /**
     * Reset database (rollback all, then migrate)
     */
    reset(): Promise<MigrationResult>;
    /**
     * Fresh database (drop all tables, then migrate)
     */
    fresh(): Promise<MigrationResult>;
    /**
     * Create a new migration file
     */
    create(name: string, options?: {
        template?: string;
    }): Promise<string>;
    /**
     * Run a single migration
     */
    private runMigration;
    /**
     * Load migration from file
     */
    private loadMigration;
    /**
     * Create migration context
     */
    private createMigrationContext;
    /**
     * Get executed migrations
     */
    private getExecutedMigrations;
    /**
     * Get migration files from directory
     */
    private getMigrationFiles;
    /**
     * Find specific migration file
     */
    private findMigrationFile;
    /**
     * Detect migration conflicts
     */
    private detectConflicts;
    /**
     * Record migration execution
     */
    private recordMigration;
    /**
     * Delete migration record
     */
    private deleteMigrationRecord;
    /**
     * Get next batch number
     */
    private getNextBatch;
    /**
     * Create database backup
     */
    private createBackup;
    /**
     * Drop all tables
     */
    private dropAllTables;
    /**
     * Execute function in transaction
     */
    private withTransaction;
    /**
     * Generate timestamp for migration version
     */
    private generateTimestamp;
    /**
     * Sanitize migration name
     */
    private sanitizeName;
    /**
     * Generate SQL for creating migrations table
     */
    private generateCreateTableSQL;
    /**
     * Get migration template
     */
    private getMigrationTemplate;
    private getDefaultMigrationTemplate;
    private getTableMigrationTemplate;
    private getAlterMigrationTemplate;
    private getDataMigrationTemplate;
}
//# sourceMappingURL=manager.d.ts.map