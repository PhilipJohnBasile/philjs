/**
 * GraphQL Optimistic Updates Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOptimisticUpdateManager,
  buildOptimisticResponse,
  createMutationQueue,
  LastWriteWinsResolver,
  FirstWriteWinsResolver,
  CustomConflictResolver,
} from './optimistic';
import { gql } from './index';

// Mock cache store
class MockCacheStore {
  private cache = new Map<string, any>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any) {
    this.cache.set(key, value);
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

describe('OptimisticUpdateManager', () => {
  let cache: MockCacheStore;

  beforeEach(() => {
    cache = new MockCacheStore();
  });

  it('should create an optimistic update manager', () => {
    const manager = createOptimisticUpdateManager();

    expect(manager).toBeDefined();
    expect(manager.queueSize()).toBe(0);
    expect(manager.pendingMutations()).toBe(0);
  });

  it('should create a mutation', () => {
    const manager = createOptimisticUpdateManager();

    const mutation = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    expect(mutation).toBeDefined();
    expect(mutation.id).toBeDefined();
    expect(mutation.status).toBe('pending');
  });

  it('should apply optimistic update', () => {
    const manager = createOptimisticUpdateManager();

    const optimisticResponse = { addMessage: { id: 'temp', text: 'Hello' } };
    const updateFn = vi.fn();

    const mutation = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' },
      optimisticResponse,
      updateFn
    );

    const snapshot = manager.applyOptimistic(mutation.id, cache as any);

    expect(snapshot).toBeDefined();
    expect(updateFn).toHaveBeenCalled();
    expect(mutation.status).toBe('optimistic');
  });

  it('should commit mutation on success', () => {
    const manager = createOptimisticUpdateManager();

    const optimisticResponse = { addMessage: { id: 'temp', text: 'Hello' } };
    const updateFn = vi.fn();

    const mutation = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' },
      optimisticResponse,
      updateFn
    );

    manager.applyOptimistic(mutation.id, cache as any);

    const realResponse = { addMessage: { id: '1', text: 'Hello' } };
    manager.commit(mutation.id, cache as any, realResponse);

    expect(mutation.status).toBe('completed');
    expect(updateFn).toHaveBeenCalledTimes(2); // Once for optimistic, once for real
  });

  it('should rollback mutation on failure', () => {
    const manager = createOptimisticUpdateManager();

    const optimisticResponse = { addMessage: { id: 'temp', text: 'Hello' } };
    const updateFn = vi.fn();

    const mutation = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' },
      optimisticResponse,
      updateFn
    );

    manager.applyOptimistic(mutation.id, cache as any);

    const error = new Error('Mutation failed');
    manager.rollback(mutation.id, cache as any, error);

    expect(mutation.status).toBe('rolled-back');
    expect(mutation.error).toBe(error);
  });

  it('should queue mutations', () => {
    const manager = createOptimisticUpdateManager({
      queueMutations: true,
    });

    const mutation = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    const queued = manager.queueMutation(mutation);

    expect(queued).toBe(true);
    expect(manager.queueSize()).toBe(1);
  });

  it('should get pending mutations', () => {
    const manager = createOptimisticUpdateManager();

    const mutation1 = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    const mutation2 = manager.createMutation(
      gql`mutation { addMessage(text: "World") { id text } }`,
      { text: 'World' }
    );

    const pending = manager.getPendingMutations();

    expect(pending.length).toBe(2);
    expect(pending).toContain(mutation1);
    expect(pending).toContain(mutation2);
  });

  it('should clear completed mutations', () => {
    const manager = createOptimisticUpdateManager();

    const mutation1 = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    const mutation2 = manager.createMutation(
      gql`mutation { addMessage(text: "World") { id text } }`,
      { text: 'World' }
    );

    manager.commit(mutation1.id, cache as any, {});

    manager.clearCompleted();

    const all = manager.getAllMutations();
    expect(all.length).toBe(1);
    expect(all[0]).toBe(mutation2);
  });

  it('should get statistics', () => {
    const manager = createOptimisticUpdateManager();

    const mutation1 = manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    const mutation2 = manager.createMutation(
      gql`mutation { addMessage(text: "World") { id text } }`,
      { text: 'World' }
    );

    manager.commit(mutation1.id, cache as any, {});

    const stats = manager.getStats();

    expect(stats.totalMutations).toBe(2);
    expect(stats.pendingMutations).toBe(1);
    expect(stats.completedMutations).toBe(1);
  });

  it('should clear all mutations', () => {
    const manager = createOptimisticUpdateManager();

    manager.createMutation(
      gql`mutation { addMessage(text: "Hello") { id text } }`,
      { text: 'Hello' }
    );

    expect(manager.getAllMutations().length).toBe(1);

    manager.clear();

    expect(manager.getAllMutations().length).toBe(0);
    expect(manager.queueSize()).toBe(0);
  });
});

describe('OptimisticResponseBuilder', () => {
  it('should build optimistic response', () => {
    const response = buildOptimisticResponse<{ id: string; name: string }>()
      .set('id', 'temp-1')
      .set('name', 'Test')
      .build();

    expect(response).toEqual({
      id: 'temp-1',
      name: 'Test',
    });
  });

  it('should merge data into response', () => {
    const response = buildOptimisticResponse<{ id: string; name: string; email: string }>()
      .set('id', 'temp-1')
      .merge({ name: 'Test', email: 'test@example.com' })
      .build();

    expect(response).toEqual({
      id: 'temp-1',
      name: 'Test',
      email: 'test@example.com',
    });
  });

  it('should set typename', () => {
    const response = buildOptimisticResponse<any>()
      .typename('User')
      .set('id', 'temp-1')
      .build();

    expect(response.__typename).toBe('User');
  });
});

describe('MutationQueue', () => {
  it('should create a mutation queue', () => {
    const queue = createMutationQueue();

    expect(queue).toBeDefined();
    expect(queue.size).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should enqueue mutations', () => {
    const queue = createMutationQueue();

    const mutation = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation);

    expect(queue.size).toBe(1);
    expect(queue.isEmpty()).toBe(false);
  });

  it('should dequeue mutations', () => {
    const queue = createMutationQueue();

    const mutation = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation);

    const dequeued = queue.dequeue();

    expect(dequeued).toBe(mutation);
    expect(queue.size).toBe(0);
  });

  it('should respect priority order', () => {
    const queue = createMutationQueue();

    const mutation1 = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    const mutation2 = {
      id: '2',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    const mutation3 = {
      id: '3',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation1, 1);
    queue.enqueue(mutation2, 3);
    queue.enqueue(mutation3, 2);

    expect(queue.dequeue()?.id).toBe('2'); // Highest priority
    expect(queue.dequeue()?.id).toBe('3');
    expect(queue.dequeue()?.id).toBe('1'); // Lowest priority
  });

  it('should peek without removing', () => {
    const queue = createMutationQueue();

    const mutation = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation);

    const peeked = queue.peek();

    expect(peeked).toBe(mutation);
    expect(queue.size).toBe(1); // Still in queue
  });

  it('should clear the queue', () => {
    const queue = createMutationQueue();

    const mutation = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation);

    expect(queue.size).toBe(1);

    queue.clear();

    expect(queue.size).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should get all mutations', () => {
    const queue = createMutationQueue();

    const mutation1 = {
      id: '1',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    const mutation2 = {
      id: '2',
      mutation: gql`mutation { addMessage { id } }`,
      status: 'pending' as const,
      timestamp: Date.now(),
    };

    queue.enqueue(mutation1);
    queue.enqueue(mutation2);

    const all = queue.getAll();

    expect(all.length).toBe(2);
  });
});

describe('Conflict Resolvers', () => {
  const createMockMutation = (id: string, timestamp: number) => ({
    id,
    mutation: gql`mutation { addMessage { id } }`,
    status: 'pending' as const,
    timestamp,
  });

  it('should resolve with last write wins', () => {
    const resolver = new LastWriteWinsResolver();

    const current = createMockMutation('1', 1000);
    const incoming = createMockMutation('2', 2000);

    const result = resolver.resolve(current, incoming);

    expect(result).toBe(incoming);
  });

  it('should resolve with first write wins', () => {
    const resolver = new FirstWriteWinsResolver();

    const current = createMockMutation('1', 1000);
    const incoming = createMockMutation('2', 2000);

    const result = resolver.resolve(current, incoming);

    expect(result).toBe(current);
  });

  it('should use custom resolver', () => {
    const resolver = new CustomConflictResolver((current, incoming) => {
      return current.id === '1' ? current : incoming;
    });

    const current = createMockMutation('1', 1000);
    const incoming = createMockMutation('2', 2000);

    const result = resolver.resolve(current, incoming);

    expect(result).toBe(current);
  });
});
