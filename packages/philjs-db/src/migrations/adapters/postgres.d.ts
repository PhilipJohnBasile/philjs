/**
 * PostgreSQL Migration Adapter
 */
import type { MigrationContext } from '../types.js';
export declare class PostgresMigrationAdapter {
    private db;
    private queries;
    constructor(db: any);
    createContext(): MigrationContext;
    sql(query: string, params?: unknown[]): Promise<unknown>;
    private createSchemaBuilder;
    private createDataHelpers;
    getQueries(): string[];
    clearQueries(): void;
}
//# sourceMappingURL=postgres.d.ts.map