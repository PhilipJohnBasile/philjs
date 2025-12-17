/**
 * PhilJS Database Utilities
 *
 * Common database utilities and patterns.
 */
import type { DatabaseConfig, Repository, PaginationOptions, PaginatedResult } from './types';
/**
 * Create a database connection based on config
 */
export declare function createDatabaseConnection(config: DatabaseConfig): Promise<any>;
/**
 * Transaction wrapper
 */
export declare function withTransaction<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T>;
/**
 * Create a repository with common CRUD operations
 */
export declare function createRepository<T extends {
    id: string | number;
}>(db: any, tableName: string): Repository<T>;
/**
 * Pagination helper
 */
export declare function paginate<T>(db: any, tableName: string, options: PaginationOptions): Promise<PaginatedResult<T>>;
/**
 * Soft delete helper
 */
export declare function softDelete(db: any, tableName: string, id: string | number): Promise<void>;
/**
 * Restore soft deleted record
 */
export declare function restore(db: any, tableName: string, id: string | number): Promise<void>;
/**
 * Database health check
 */
export declare function healthCheck(db: any): Promise<{
    healthy: boolean;
    latency: number;
}>;
//# sourceMappingURL=utils.d.ts.map