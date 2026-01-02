/**
 * @philjs/nexus - Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createNexusApp,
  NexusApp,
  MemoryAdapter,
  createSyncEngine,
} from '../index.js';

describe('NexusApp', () => {
  let app: NexusApp;

  beforeEach(() => {
    app = createNexusApp({
      local: { adapter: 'memory' },
    });
  });

  afterEach(async () => {
    await app.disconnect();
  });

  describe('createNexusApp', () => {
    it('creates a NexusApp instance', () => {
      expect(app).toBeInstanceOf(NexusApp);
    });

    it('is not connected initially', () => {
      expect(app.isConnected()).toBe(false);
    });

    it('connects successfully', async () => {
      await app.connect();
      expect(app.isConnected()).toBe(true);
    });
  });

  describe('Documents', () => {
    beforeEach(async () => {
      await app.connect();
    });

    it('creates and retrieves a document', async () => {
      const doc = app.useDocument<{ title: string }>('test-doc');

      await doc.set({ title: 'Hello World' });

      // Subscribe to get the value
      let value: { title: string } | undefined;
      const unsubscribe = doc.subscribe((v) => {
        value = v;
      });

      // Wait for subscription to fire
      await new Promise((r) => setTimeout(r, 10));

      expect(value).toEqual({ title: 'Hello World' });
      unsubscribe();
    });
  });

  describe('Collections', () => {
    beforeEach(async () => {
      await app.connect();
    });

    it('adds and retrieves items from a collection', async () => {
      const collection = app.useCollection<{ id?: string; name: string }>('users');

      const id = await collection.add({ name: 'Alice' });
      expect(id).toBeTruthy();

      const user = await collection.get(id);
      expect(user).toEqual({ id, name: 'Alice' });
    });

    it('queries items in a collection', async () => {
      const collection = app.useCollection<{ id?: string; name: string; age: number }>('users');

      await collection.add({ name: 'Alice', age: 25 });
      await collection.add({ name: 'Bob', age: 30 });
      await collection.add({ name: 'Charlie', age: 25 });

      const results = await collection.query((u) => u.age === 25);
      expect(results).toHaveLength(2);
      expect(results.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie']);
    });
  });

  describe('Sync Status', () => {
    beforeEach(async () => {
      await app.connect();
    });

    it('returns sync status', () => {
      const status = app.getSyncStatus();

      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('pendingChanges');
    });

    it('starts in idle state', () => {
      const status = app.getSyncStatus();
      expect(status.state).toBe('idle');
    });
  });

  describe('Events', () => {
    it('emits connected event on connect', async () => {
      const events: string[] = [];

      app.subscribe((event) => {
        events.push(event.type);
      });

      await app.connect();

      expect(events).toContain('connected');
    });

    it('emits disconnected event on disconnect', async () => {
      const events: string[] = [];

      await app.connect();

      app.subscribe((event) => {
        events.push(event.type);
      });

      await app.disconnect();

      expect(events).toContain('disconnected');
    });
  });
});

describe('SyncEngine', () => {
  describe('MemoryAdapter', () => {
    let adapter: MemoryAdapter;

    beforeEach(async () => {
      adapter = new MemoryAdapter();
      await adapter.init();
    });

    afterEach(async () => {
      await adapter.close();
    });

    it('stores and retrieves values', async () => {
      await adapter.set('test', 'key1', { value: 'hello' });

      const result = await adapter.get<{ value: string }>('test', 'key1');
      expect(result).toEqual({ value: 'hello' });
    });

    it('returns undefined for missing keys', async () => {
      const result = await adapter.get('test', 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('gets all values in a collection', async () => {
      await adapter.set('users', 'a', { name: 'Alice' });
      await adapter.set('users', 'b', { name: 'Bob' });
      await adapter.set('other', 'c', { name: 'Charlie' });

      const users = await adapter.getAll<{ name: string }>('users');
      expect(users).toHaveLength(2);
    });

    it('deletes values', async () => {
      await adapter.set('test', 'key1', { value: 'hello' });
      await adapter.delete('test', 'key1');

      const result = await adapter.get('test', 'key1');
      expect(result).toBeUndefined();
    });

    it('clears a collection', async () => {
      await adapter.set('test', 'key1', { value: '1' });
      await adapter.set('test', 'key2', { value: '2' });

      await adapter.clear('test');

      const keys = await adapter.keys('test');
      expect(keys).toHaveLength(0);
    });

    it('lists keys in a collection', async () => {
      await adapter.set('test', 'a', {});
      await adapter.set('test', 'b', {});
      await adapter.set('test', 'c', {});

      const keys = await adapter.keys('test');
      expect(keys.sort()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('createSyncEngine', () => {
    it('creates a sync engine with memory adapter', () => {
      const engine = createSyncEngine({
        local: { adapter: 'memory' },
      });

      expect(engine).toBeDefined();
    });

    it('throws for unsupported adapters', () => {
      expect(() => {
        createSyncEngine({
          local: { adapter: 'sqlite' },
        });
      }).toThrow('SQLite adapter not yet implemented');
    });
  });
});

describe('AI Features', () => {
  it('throws when AI is not configured', async () => {
    const app = createNexusApp({
      local: { adapter: 'memory' },
      // No AI config
    });

    await app.connect();

    await expect(app.generate('Hello')).rejects.toThrow('AI not configured');

    await app.disconnect();
  });

  it('tracks AI usage', async () => {
    const app = createNexusApp({
      local: { adapter: 'memory' },
      ai: {
        provider: 'anthropic',
        apiKey: 'test-key',
      },
    });

    await app.connect();

    const usage = app.getAIUsage();
    expect(usage).toEqual({ totalTokens: 0, totalCost: 0 });

    await app.disconnect();
  });
});

describe('Collaboration Features', () => {
  it('returns empty presence when not connected', async () => {
    const app = createNexusApp({
      local: { adapter: 'memory' },
    });

    await app.connect();

    const presence = app.getPresence();
    expect(presence).toEqual([]);

    await app.disconnect();
  });
});
