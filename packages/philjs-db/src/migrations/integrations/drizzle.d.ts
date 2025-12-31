/**
 * Drizzle ORM Migration Integration
 */
import type { MigrationConfig, Migration } from '../types.js';
export declare class DrizzleMigrationIntegration {
    /**
     * Import Drizzle migrations
     */
    static importDrizzleMigrations(drizzleDir: string): Promise<Migration[]>;
    /**
     * Generate Drizzle schema from PhilJS migrations
     */
    static exportToDrizzleSchema(migrations: Migration[]): Promise<string>;
    /**
     * Convert Drizzle table definition to migration
     */
    static tableToMigration(tableDef: DrizzleTableDef): Migration;
    private static columnToBuilder;
    /**
     * Sync with Drizzle Kit
     */
    static syncWithDrizzleKit(config: MigrationConfig): Promise<void>;
    /**
     * Generate Drizzle migration from PhilJS migration
     */
    static generateDrizzleMigration(migration: Migration): Promise<string>;
}
/**
 * Drizzle Schema Parser
 */
export declare class DrizzleSchemaParser {
    /**
     * Parse Drizzle schema files
     */
    static parse(schemaPath: string): Promise<DrizzleSchema>;
    /**
     * Extract table definitions from schema
     */
    static extractTables(code: string): DrizzleTableDef[];
}
interface DrizzleSchema {
    tables: DrizzleTableDef[];
    relations: DrizzleRelation[];
}
interface DrizzleTableDef {
    name: string;
    columns: Record<string, DrizzleColumn>;
    indexes?: DrizzleIndex[];
    foreignKeys?: DrizzleForeignKey[];
}
interface DrizzleColumn {
    type: string;
    notNull?: boolean;
    default?: any;
    primaryKey?: boolean;
    unique?: boolean;
    length?: number;
    precision?: number;
    scale?: number;
}
interface DrizzleIndex {
    name: string;
    columns: string[];
    unique: boolean;
}
interface DrizzleForeignKey {
    columns: string[];
    references: {
        table: string;
        columns: string[];
    };
    onDelete?: string;
    onUpdate?: string;
}
interface DrizzleRelation {
    from: string;
    to: string;
    type: 'one' | 'many';
}
export {};
//# sourceMappingURL=drizzle.d.ts.map