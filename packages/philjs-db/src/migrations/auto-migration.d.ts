/**
 * Auto Migration Generator
 * Generates migrations from model changes
 */
import type { MigrationConfig, AutoMigrationOptions, DryRunResult, SchemaDiff } from './types.js';
export declare class AutoMigrationGenerator {
    private config;
    private diffGenerator;
    constructor(config: MigrationConfig);
    /**
     * Generate migration from schema changes
     */
    generate(options?: AutoMigrationOptions): Promise<DryRunResult>;
    /**
     * Analyze changes and generate warnings
     */
    private analyzeChanges;
    /**
     * Estimate migration duration
     */
    private estimateDuration;
    /**
     * Generate migration code
     */
    generateMigrationCode(diff: SchemaDiff): string;
    private generateCreateTableCode;
    private generateDropTableCode;
    private generateAlterTableCode;
    private getColumnMethodCall;
    private generateMigrationTemplate;
}
/**
 * Backup utilities
 */
export declare class BackupManager {
    private config;
    constructor(config: MigrationConfig);
    /**
     * Create database backup
     */
    createBackup(filename?: string): Promise<string>;
    /**
     * Restore database from backup
     */
    restoreBackup(filepath: string): Promise<void>;
    private backupPostgres;
    private backupMySQL;
    private backupSQLite;
    private restorePostgres;
    private restoreMySQL;
    private restoreSQLite;
}
/**
 * Data migration helpers
 */
export declare class DataMigrationHelper {
    /**
     * Transform data during migration
     */
    static transformData(table: string, transformer: (row: any) => any, batchSize?: number): Promise<void>;
    /**
     * Copy data between tables
     */
    static copyData(source: string, target: string, columns?: string[]): Promise<void>;
    /**
     * Migrate data with validation
     */
    static migrateWithValidation(table: string, validator: (row: any) => boolean, onInvalid?: (row: any) => void): Promise<void>;
}
//# sourceMappingURL=auto-migration.d.ts.map