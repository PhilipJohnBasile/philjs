/**
 * GraphQL Persisted Queries Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPersistedQueryManager,
  createPersistedQueryRegistry,
  buildPersistedQueryRequest,
  extractQueryHash,
  generatePersistedQueryManifest,
  shouldRetryWithFullQuery,
} from './persisted';
import { gql } from './index';

describe('PersistedQueryManager', () => {
  it('should create a persisted query manager', () => {
    const manager = createPersistedQueryManager({
      enabled: true,
    });

    expect(manager).toBeDefined();
  });

  it('should generate hash for a query', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
        }
      }
    `;

    const hash = await manager.getOrCreateHash(query);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should cache query hashes', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;

    const hash1 = await manager.getOrCreateHash(query);
    const hash2 = await manager.getOrCreateHash(query);

    expect(hash1).toBe(hash2);
  });

  it('should create persisted query link', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;

    const link = await manager.createPersistedQueryLink(query);

    expect(link.extensions).toBeDefined();
    expect(link.extensions.persistedQuery).toBeDefined();
    expect(link.extensions.persistedQuery.version).toBe(1);
    expect(link.extensions.persistedQuery.sha256Hash).toBeDefined();
  });

  it('should not include query on first request by default', async () => {
    const manager = createPersistedQueryManager({
      includeQueryOnFirstRequest: false,
    });

    const query = gql`query { users { id } }`;

    // Mark hash as known so it doesn't include query
    const hash = await manager.getOrCreateHash(query);
    manager.markHashAsKnown(hash);

    const link = await manager.createPersistedQueryLink(query);

    expect(link.includeQuery).toBe(false);
  });

  it('should include query when explicitly requested', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;

    const link = await manager.createPersistedQueryLink(query, true);

    expect(link.includeQuery).toBe(true);
  });

  it('should mark hash as known', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;
    const hash = await manager.getOrCreateHash(query);

    expect(manager.isHashKnown(hash)).toBe(false);

    manager.markHashAsKnown(hash);

    expect(manager.isHashKnown(hash)).toBe(true);
  });

  it('should clear cache', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;
    await manager.getOrCreateHash(query);

    const stats = manager.getCacheStats();
    expect(stats.hashCacheSize).toBe(1);

    manager.clearCache();

    const statsAfter = manager.getCacheStats();
    expect(statsAfter.hashCacheSize).toBe(0);
  });

  it('should clear known hashes', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;
    const hash = await manager.getOrCreateHash(query);
    manager.markHashAsKnown(hash);

    const stats = manager.getCacheStats();
    expect(stats.knownHashesSize).toBe(1);

    manager.clearKnownHashes();

    const statsAfter = manager.getCacheStats();
    expect(statsAfter.knownHashesSize).toBe(0);
  });
});

describe('PersistedQueryRegistry', () => {
  it('should create a registry', () => {
    const registry = createPersistedQueryRegistry();

    expect(registry).toBeDefined();
    expect(registry.size).toBe(0);
  });

  it('should register a query', () => {
    const registry = createPersistedQueryRegistry();

    registry.register('GetUser', 'query { user { id } }', 'hash123');

    expect(registry.has('GetUser')).toBe(true);
    expect(registry.getHash('GetUser')).toBe('hash123');
    expect(registry.size).toBe(1);
  });

  it('should load from manifest', () => {
    const registry = createPersistedQueryRegistry();

    const manifest = {
      GetUser: 'hash123',
      GetPosts: 'hash456',
    };

    registry.loadFromManifest(manifest);

    expect(registry.size).toBe(2);
    expect(registry.getHash('GetUser')).toBe('hash123');
    expect(registry.getHash('GetPosts')).toBe('hash456');
  });

  it('should export manifest', () => {
    const registry = createPersistedQueryRegistry();

    registry.register('GetUser', 'query { user { id } }', 'hash123');
    registry.register('GetPosts', 'query { posts { id } }', 'hash456');

    const manifest = registry.exportManifest();

    expect(manifest).toEqual({
      GetUser: 'hash123',
      GetPosts: 'hash456',
    });
  });

  it('should clear registry', () => {
    const registry = createPersistedQueryRegistry();

    registry.register('GetUser', 'query { user { id } }', 'hash123');
    expect(registry.size).toBe(1);

    registry.clear();

    expect(registry.size).toBe(0);
  });

  it('should get all registered queries', () => {
    const registry = createPersistedQueryRegistry();

    registry.register('GetUser', 'query { user { id } }', 'hash123');
    registry.register('GetPosts', 'query { posts { id } }', 'hash456');

    const all = registry.getAll();

    expect(all.size).toBe(2);
    expect(all.get('GetUser')).toBe('hash123');
    expect(all.get('GetPosts')).toBe('hash456');
  });
});

describe('buildPersistedQueryRequest', () => {
  it('should build request with persisted query', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;

    const request = await buildPersistedQueryRequest(
      manager,
      query,
      { limit: 10 },
      'GetUsers'
    );

    expect(request.variables).toEqual({ limit: 10 });
    expect(request.operationName).toBe('GetUsers');
    expect(request.extensions).toBeDefined();
    expect(request.extensions.persistedQuery).toBeDefined();
  });

  it('should include query when retrying', async () => {
    const manager = createPersistedQueryManager();

    const query = gql`query { users { id } }`;

    const request = await buildPersistedQueryRequest(
      manager,
      query,
      undefined,
      undefined,
      true
    );

    expect(request.query).toBeDefined();
  });
});

describe('extractQueryHash', () => {
  it('should extract hash from query', async () => {
    const query = gql`query { users { id } }`;

    const hash = await extractQueryHash(query);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });
});

describe('generatePersistedQueryManifest', () => {
  it('should generate manifest from queries', async () => {
    const queries = {
      GetUser: gql`query { user { id } }`,
      GetPosts: gql`query { posts { id } }`,
    };

    const manifest = await generatePersistedQueryManifest(queries);

    expect(manifest).toBeDefined();
    expect(manifest.GetUser).toBeDefined();
    expect(manifest.GetPosts).toBeDefined();
  });
});

describe('shouldRetryWithFullQuery', () => {
  it('should return true for PersistedQueryNotFound error', () => {
    const error = {
      message: 'PersistedQueryNotFound',
      extensions: {
        code: 'PERSISTED_QUERY_NOT_FOUND',
      },
    };

    const shouldRetry = shouldRetryWithFullQuery(error, null);

    expect(shouldRetry).toBe(true);
  });

  it('should return false for PersistedQueryNotSupported error', () => {
    const error = {
      message: 'PersistedQueryNotSupported',
    };

    const shouldRetry = shouldRetryWithFullQuery(error, null);

    expect(shouldRetry).toBe(false);
  });

  it('should return false for other errors', () => {
    const error = {
      message: 'Internal server error',
    };

    const shouldRetry = shouldRetryWithFullQuery(error, null);

    expect(shouldRetry).toBe(false);
  });
});
