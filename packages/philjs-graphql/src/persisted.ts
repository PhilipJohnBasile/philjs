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
export class PersistedQueryManager {
  private config: Required<Omit<PersistedQueryConfig, 'generateHash'>> & {
    generateHash?: (query: string) => Promise<string> | string;
  };
  private hashCache = new Map<string, string>();
  private knownHashes = new Set<string>();

  constructor(config: PersistedQueryConfig = {}) {
    this.config = {
      enabled: true,
      hashAlgorithm: 'sha256',
      useGETForHashedQueries: false,
      includeQueryOnFirstRequest: false,
      ...config,
    };
  }

  /**
   * Generate persisted query link for a query
   */
  async createPersistedQueryLink(
    query: string | DocumentNode,
    includeQuery = false
  ): Promise<PersistedQueryLink> {
    if (!this.config.enabled) {
      return {
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: '',
          },
        },
        includeQuery: true,
      };
    }

    const queryString = this.documentToString(query);
    const hash = await this.getOrCreateHash(queryString);

    // Check if this hash is known to be registered with the server
    const isKnownHash = this.knownHashes.has(hash);

    return {
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: hash,
        },
      },
      includeQuery:
        includeQuery ||
        !isKnownHash ||
        this.config.includeQueryOnFirstRequest,
    };
  }

  /**
   * Mark a hash as successfully registered with the server
   */
  markHashAsKnown(hash: string): void {
    this.knownHashes.add(hash);
  }

  /**
   * Check if a hash is known to the server
   */
  isHashKnown(hash: string): boolean {
    return this.knownHashes.has(hash);
  }

  /**
   * Get or generate hash for a query
   */
  async getOrCreateHash(query: string): Promise<string> {
    // Check cache first
    const cached = this.hashCache.get(query);
    if (cached) {
      return cached;
    }

    // Generate new hash
    const hash = this.config.generateHash
      ? await this.config.generateHash(query)
      : await this.generateSHA256Hash(query);

    // Cache it
    this.hashCache.set(query, hash);

    return hash;
  }

  /**
   * Generate SHA-256 hash using Web Crypto API or Node crypto
   */
  private async generateSHA256Hash(query: string): Promise<string> {
    // Try Web Crypto API first (browser environment)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(query);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback to Node.js crypto (if available)
    try {
      const nodeCrypto = await import('crypto');
      return nodeCrypto.createHash('sha256').update(query).digest('hex');
    } catch {
      // If import is not available, use a simple hash
      return this.simpleHash(query);
    }
  }

  /**
   * Simple hash function fallback (not cryptographically secure)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Convert DocumentNode to string if needed
   */
  private documentToString(doc: string | DocumentNode): string {
    if (typeof doc === 'string') {
      return doc;
    }
    return (doc as any).loc?.source?.body || String(doc);
  }

  /**
   * Clear the hash cache
   */
  clearCache(): void {
    this.hashCache.clear();
  }

  /**
   * Clear known hashes
   */
  clearKnownHashes(): void {
    this.knownHashes.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hashCacheSize: number;
    knownHashesSize: number;
  } {
    return {
      hashCacheSize: this.hashCache.size,
      knownHashesSize: this.knownHashes.size,
    };
  }
}

/**
 * Persisted Query Registry
 * Pre-register queries with known hashes
 */
export class PersistedQueryRegistry {
  private registry = new Map<string, string>();

  /**
   * Register a query with its hash
   */
  register(queryName: string, query: string | DocumentNode, hash: string): void {
    this.registry.set(queryName, hash);
  }

  /**
   * Get hash for a registered query
   */
  getHash(queryName: string): string | undefined {
    return this.registry.get(queryName);
  }

  /**
   * Check if a query is registered
   */
  has(queryName: string): boolean {
    return this.registry.has(queryName);
  }

  /**
   * Get all registered queries
   */
  getAll(): Map<string, string> {
    return new Map(this.registry);
  }

  /**
   * Load registry from manifest
   */
  loadFromManifest(manifest: Record<string, string>): void {
    Object.entries(manifest).forEach(([name, hash]) => {
      this.registry.set(name, hash);
    });
  }

  /**
   * Export registry as manifest
   */
  exportManifest(): Record<string, string> {
    return Object.fromEntries(this.registry.entries());
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Get registry size
   */
  get size(): number {
    return this.registry.size;
  }
}

/**
 * Create a persisted query manager
 */
export function createPersistedQueryManager(
  config?: PersistedQueryConfig
): PersistedQueryManager {
  return new PersistedQueryManager(config);
}

/**
 * Create a persisted query registry
 */
export function createPersistedQueryRegistry(): PersistedQueryRegistry {
  return new PersistedQueryRegistry();
}

/**
 * Helper to handle persisted query errors
 * Returns true if should retry with full query
 */
export function shouldRetryWithFullQuery(
  error: any,
  response: Response | null
): boolean {
  // Check for APQ not supported error
  if (error?.message?.includes('PersistedQueryNotSupported')) {
    return false; // Server doesn't support APQ, don't retry
  }

  // Check for APQ not found error
  if (
    error?.message?.includes('PersistedQueryNotFound') ||
    (response?.status === 200 &&
      error?.extensions?.code === 'PERSISTED_QUERY_NOT_FOUND')
  ) {
    return true; // Retry with full query
  }

  return false;
}

/**
 * Build GraphQL request with persisted query support
 */
export async function buildPersistedQueryRequest(
  manager: PersistedQueryManager,
  query: string | DocumentNode,
  variables?: any,
  operationName?: string,
  retryWithFullQuery = false
): Promise<{
  query?: string;
  variables?: any;
  operationName?: string;
  extensions?: any;
}> {
  const queryString = typeof query === 'string' ? query : (query as any).loc?.source?.body || String(query);

  const persistedQueryLink = await manager.createPersistedQueryLink(
    queryString,
    retryWithFullQuery
  );

  const request: any = {
    variables,
    operationName,
  };

  // Only include query if required
  if (persistedQueryLink.includeQuery) {
    request.query = queryString;
  }

  // Add extensions
  if (persistedQueryLink.extensions) {
    request.extensions = persistedQueryLink.extensions;
  }

  return request;
}

/**
 * Extract query hash from a GraphQL document
 * Useful for pre-computing hashes at build time
 */
export async function extractQueryHash(
  query: string | DocumentNode,
  manager?: PersistedQueryManager
): Promise<string> {
  const mgr = manager || new PersistedQueryManager();
  const queryString = typeof query === 'string' ? query : (query as any).loc?.source?.body || String(query);
  return mgr.getOrCreateHash(queryString);
}

/**
 * Generate manifest file for persisted queries
 * Useful for build-time generation
 */
export async function generatePersistedQueryManifest(
  queries: Record<string, string | DocumentNode>,
  manager?: PersistedQueryManager
): Promise<Record<string, string>> {
  const mgr = manager || new PersistedQueryManager();
  const manifest: Record<string, string> = {};

  for (const [name, query] of Object.entries(queries)) {
    const hash = await extractQueryHash(query, mgr);
    manifest[name] = hash;
  }

  return manifest;
}
