/**
 * Prisma Migration Integration
 */
import type { MigrationConfig, Migration } from '../types.js';
export declare class PrismaMigrationIntegration {
    /**
     * Convert Prisma migrations to PhilJS format
     */
    static importPrismaMigrations(prismaDir: string): Promise<Migration[]>;
    /**
     * Generate Prisma schema from PhilJS migrations
     */
    static exportToPrismaSchema(migrations: Migration[]): Promise<string>;
    /**
     * Sync PhilJS migrations with Prisma
     */
    static syncWithPrisma(config: MigrationConfig): Promise<void>;
    /**
     * Run Prisma migrations using PhilJS
     */
    static runPrismaMigrations(prismaClient: any): Promise<void>;
}
/**
 * Prisma Schema Parser
 */
export declare class PrismaSchemaParser {
    /**
     * Parse Prisma schema file
     */
    static parse(schemaPath: string): Promise<PrismaSchema>;
    /**
     * Convert Prisma model to migration
     */
    static modelToMigration(model: PrismaModel): Migration;
    private static fieldToColumn;
}
interface PrismaSchema {
    models: PrismaModel[];
    enums: PrismaEnum[];
    datasource: Record<string, any>;
}
interface PrismaModel {
    name: string;
    fields: PrismaField[];
    indexes: PrismaIndex[];
}
interface PrismaField {
    name: string;
    type: string;
    isRequired: boolean;
    isId: boolean;
    isUnique: boolean;
    default?: any;
    relation?: string;
}
interface PrismaEnum {
    name: string;
    values: string[];
}
interface PrismaIndex {
    fields: string[];
    unique: boolean;
}
export {};
//# sourceMappingURL=prisma.d.ts.map