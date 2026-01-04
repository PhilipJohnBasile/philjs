/**
 * PhilJS GraphQL Persisted Queries
 *
 * Provides Automatic Persisted Queries (APQ) support:
 * - SHA-256 hash generation for queries
 * - Automatic fallback to full query on hash miss
 * - Integration with CDN and HTTP caching
 * - Query document registry
 * - Performance optimization for repeated queries
 */
import type { DocumentNode } from 'graphql';
export interface PersistedQueryConfig {
    /** Enable automatic persisted queries (default: true) */
    enabled?: boolean;
    /** Hash algorithm (default: 'sha256') */
    hashAlgorithm?: 'sha256';
    /** Use GET requests for persisted queries (default: false) */
    useGETForHashedQueries?: boolean;
    /** Custom hash function (optional) */
    generateHash?: (query: string) => Promise<string> | string;
    /** Whether to include the full query on first request (default: false) */
    includeQueryOnFirstRequest?: boolean;
}
export interface PersistedQueryLink {
    /** Extension object to add to GraphQL request */
    extensions: {
        persistedQuery: {
            version: number;
            sha256Hash: string;
        };
    };
    /** Whether to include the full query in this request */
    includeQuery: boolean;
}
/**
 * Persisted Query Manager
 * Handles query hashing and APQ protocol
 */
export declare class PersistedQueryManager {
    private config;
    private hashCache;
    private knownHashes;
    constructor(config?: PersistedQueryConfig);
    /**
     * Generate persisted query link for a query
     */
    createPersistedQueryLink(query: string | DocumentNode, includeQuery?: boolean): Promise<PersistedQueryLink>;
    /**
     * Mark a hash as successfully registered with the server
     */
    markHashAsKnown(hash: string): void;
    /**
     * Check if a hash is known to the server
     */
    isHashKnown(hash: string): boolean;
    /**
     * Get or generate hash for a query
     */
    getOrCreateHash(query: string): Promise<string>;
    /**
     * Generate SHA-256 hash using Web Crypto API or Node crypto
     */
    private generateSHA256Hash;
    /**
     * Simple hash function fallback (not cryptographically secure)
     */
    private simpleHash;
    /**
     * Convert DocumentNode to string if needed
     */
    private documentToString;
    /**
     * Clear the hash cache
     */
    clearCache(): void;
    /**
     * Clear known hashes
     */
    clearKnownHashes(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        hashCacheSize: number;
        knownHashesSize: number;
    };
}
/**
 * Persisted Query Registry
 * Pre-register queries with known hashes
 */
export declare class PersistedQueryRegistry {
    private registry;
    /**
     * Register a query with its hash
     */
    register(queryName: string, query: string | DocumentNode, hash: string): void;
    /**
     * Get hash for a registered query
     */
    getHash(queryName: string): string | undefined;
    /**
     * Check if a query is registered
     */
    has(queryName: string): boolean;
    /**
     * Get all registered queries
     */
    getAll(): Map<string, string>;
    /**
     * Load registry from manifest
     */
    loadFromManifest(manifest: Record<string, string>): void;
    /**
     * Export registry as manifest
     */
    exportManifest(): Record<string, string>;
    /**
     * Clear the registry
     */
    clear(): void;
    /**
     * Get registry size
     */
    get size(): number;
}
/**
 * Create a persisted query manager
 */
export declare function createPersistedQueryManager(config?: PersistedQueryConfig): PersistedQueryManager;
/**
 * Create a persisted query registry
 */
export declare function createPersistedQueryRegistry(): PersistedQueryRegistry;
/**
 * Helper to handle persisted query errors
 * Returns true if should retry with full query
 */
export declare function shouldRetryWithFullQuery(error: any, response: Response | null): boolean;
/**
 * Build GraphQL request with persisted query support
 */
export declare function buildPersistedQueryRequest(manager: PersistedQueryManager, query: string | DocumentNode, variables?: any, operationName?: string, retryWithFullQuery?: boolean): Promise<{
    query?: string;
    variables?: any;
    operationName?: string;
    extensions?: any;
}>;
/**
 * Extract query hash from a GraphQL document
 * Useful for pre-computing hashes at build time
 */
export declare function extractQueryHash(query: string | DocumentNode, manager?: PersistedQueryManager): Promise<string>;
/**
 * Generate manifest file for persisted queries
 * Useful for build-time generation
 */
export declare function generatePersistedQueryManifest(queries: Record<string, string | DocumentNode>, manager?: PersistedQueryManager): Promise<Record<string, string>>;
//# sourceMappingURL=persisted.d.ts.map