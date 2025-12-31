/**
 * Schema Diff Generator
 * Compares current database schema with target schema
 */
import type { MigrationConfig, SchemaDiff } from './types.js';
export declare class SchemaDiffGenerator {
    private config;
    constructor(config: MigrationConfig);
    /**
     * Generate schema diff between current and target
     */
    generate(): Promise<SchemaDiff>;
    /**
     * Get current database schema
     */
    private getCurrentSchema;
    /**
     * Get target schema from schema file or models
     */
    private getTargetSchema;
    /**
     * Compare two schemas and generate diff
     */
    private compareSchemas;
    /**
     * Compare two tables
     */
    private compareTable;
    /**
     * Check if two columns are equal
     */
    private columnsEqual;
    /**
     * Check if modification has any changes
     */
    private hasChanges;
    /**
     * Get PostgreSQL schema
     */
    private getPostgresSchema;
    /**
     * Get MySQL schema
     */
    private getMySQLSchema;
    /**
     * Get SQLite schema
     */
    private getSQLiteSchema;
    /**
     * Load schema from file
     */
    private loadSchemaFile;
    /**
     * Parse schema from models/entities
     */
    private parseModelsSchema;
    /**
     * Generate SQL for schema diff
     */
    generateSQL(diff: SchemaDiff): string[];
    private generateDropTableSQL;
    private generateCreateTableSQL;
    private generateAlterTableSQL;
    private generateAddColumnSQL;
    private generateDropColumnSQL;
    private generateModifyColumnSQL;
}
//# sourceMappingURL=schema-diff.d.ts.map