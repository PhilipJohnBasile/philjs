/**
 * PhilJS GraphQL Optimistic Updates
 *
 * Provides optimistic update management:
 * - Automatic rollback on mutation failure
 * - Conflict resolution strategies
 * - Mutation queue management
 * - Snapshot-based state restoration
 * - Type-safe optimistic responses
 */

import { signal, batch, type Signal } from 'philjs-core';
import type { DocumentNode } from 'graphql';
import type { CacheStore } from './index.js';

export interface OptimisticUpdateConfig {
  /** Enable automatic rollback on error (default: true) */
  autoRollback?: boolean;
  /** Queue mutations instead of executing in parallel (default: false) */
  queueMutations?: boolean;
  /** Maximum queue size (default: 50) */
  maxQueueSize?: number;
  /** Conflict resolution strategy */
  conflictResolution?: 'reject' | 'queue' | 'override';
}

export interface OptimisticMutation<TData = any, TVariables = any> {
  /** Unique mutation ID */
  id: string;
  /** Mutation document */
  mutation: string | DocumentNode;
  /** Mutation variables */
  variables?: TVariables;
  /** Optimistic response data */
  optimisticResponse?: TData;
  /** Cache update function */
  update?: (cache: CacheStore, result: { data: TData }) => void;
  /** Rollback function */
  rollback?: () => void;
  /** Status */
  status: 'pending' | 'optimistic' | 'completed' | 'failed' | 'rolled-back';
  /** Timestamp */
  timestamp: number;
  /** Error if failed */
  error?: Error | undefined;
}

export interface OptimisticUpdateSnapshot {
  /** Snapshot ID */
  id: string;
  /** Mutation ID that created this snapshot */
  mutationId: string;
  /** Cache keys affected */
  cacheKeys: string[];
  /** Previous cache values */
  previousValues: Map<string, any>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Optimistic Update Manager
 * Manages optimistic mutations and rollback
 */
export class OptimisticUpdateManager {
  private config: Required<OptimisticUpdateConfig>;
  private mutations = new Map<string, OptimisticMutation>();
  private snapshots = new Map<string, OptimisticUpdateSnapshot>();
  private mutationQueue: OptimisticMutation[] = [];
  private mutationCounter = 0;
  private snapshotCounter = 0;
  private isProcessingQueue = false;

  // Signals for reactive state
  public queueSize = signal(0);
  public pendingMutations = signal(0);

  constructor(config: OptimisticUpdateConfig = {}) {
    this.config = {
      autoRollback: true,
      queueMutations: false,
      maxQueueSize: 50,
      conflictResolution: 'queue',
      ...config,
    };
  }

  /**
   * Create an optimistic mutation
   */
  createMutation<TData = any, TVariables = any>(
    mutation: string | DocumentNode,
    variables?: TVariables,
    optimisticResponse?: TData,
    update?: (cache: CacheStore, result: { data: TData }) => void
  ): OptimisticMutation<TData, TVariables> {
    const id = this.generateMutationId();

    const optimisticMutation: OptimisticMutation<TData, TVariables> = {
      id,
      mutation,
      status: 'pending',
      timestamp: Date.now(),
      ...(variables !== undefined && { variables }),
      ...(optimisticResponse !== undefined && { optimisticResponse }),
      ...(update !== undefined && { update }),
    };

    this.mutations.set(id, optimisticMutation);
    this.updateSignals();

    return optimisticMutation;
  }

  /**
   * Apply optimistic update to cache
   */
  applyOptimistic<TData = any>(
    mutationId: string,
    cache: CacheStore
  ): OptimisticUpdateSnapshot | null {
    const mutation = this.mutations.get(mutationId);
    if (!mutation || !mutation.optimisticResponse || !mutation.update) {
      return null;
    }

    // Create snapshot before applying update
    const snapshot = this.createSnapshot(mutationId, cache);

    // Apply optimistic update in a batch
    batch(() => {
      mutation.update!(cache, { data: mutation.optimisticResponse as TData });
      mutation.status = 'optimistic';
    });

    this.updateSignals();

    return snapshot;
  }

  /**
   * Commit a mutation (success)
   */
  commit<TData = any>(
    mutationId: string,
    cache: CacheStore,
    response: TData
  ): void {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) return;

    // Apply real update if provided
    if (mutation.update) {
      batch(() => {
        mutation.update!(cache, { data: response });
        mutation.status = 'completed';
      });
    } else {
      mutation.status = 'completed';
    }

    // Clean up snapshot
    const snapshot = this.findSnapshotByMutationId(mutationId);
    if (snapshot) {
      this.snapshots.delete(snapshot.id);
    }

    this.updateSignals();

    // Process next in queue if queueing is enabled
    if (this.config.queueMutations) {
      this.processNextInQueue();
    }
  }

  /**
   * Rollback a mutation (failure)
   */
  rollback(mutationId: string, cache: CacheStore, error?: Error): void {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) return;

    mutation.status = 'failed';
    mutation.error = error;

    // Find and apply snapshot
    const snapshot = this.findSnapshotByMutationId(mutationId);
    if (snapshot) {
      this.applySnapshot(snapshot, cache);
      this.snapshots.delete(snapshot.id);
      mutation.status = 'rolled-back';
    }

    // Call custom rollback if provided
    if (mutation.rollback) {
      mutation.rollback();
    }

    this.updateSignals();

    // Process next in queue if queueing is enabled
    if (this.config.queueMutations) {
      this.processNextInQueue();
    }
  }

  /**
   * Queue a mutation
   */
  queueMutation(mutation: OptimisticMutation): boolean {
    if (this.mutationQueue.length >= this.config.maxQueueSize) {
      console.warn('Mutation queue is full');
      return false;
    }

    this.mutationQueue.push(mutation);
    this.queueSize.set(this.mutationQueue.length);

    return true;
  }

  /**
   * Process next mutation in queue
   */
  private processNextInQueue(): void {
    if (this.isProcessingQueue || this.mutationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const next = this.mutationQueue.shift();

    if (next) {
      this.queueSize.set(this.mutationQueue.length);
      // Caller should execute this mutation
      // We just mark that we're processing
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get next queued mutation
   */
  getNextQueuedMutation(): OptimisticMutation | null {
    if (this.mutationQueue.length === 0) return null;

    const next = this.mutationQueue.shift();
    if (next) {
      this.queueSize.set(this.mutationQueue.length);
      return next;
    }

    return null;
  }

  /**
   * Get mutation by ID
   */
  getMutation(id: string): OptimisticMutation | undefined {
    return this.mutations.get(id);
  }

  /**
   * Get all mutations
   */
  getAllMutations(): OptimisticMutation[] {
    return Array.from(this.mutations.values());
  }

  /**
   * Get pending mutations
   */
  getPendingMutations(): OptimisticMutation[] {
    return Array.from(this.mutations.values()).filter(
      (m) => m.status === 'pending' || m.status === 'optimistic'
    );
  }

  /**
   * Clear completed and rolled-back mutations
   */
  clearCompleted(): void {
    const toDelete: string[] = [];

    this.mutations.forEach((mutation, id) => {
      if (mutation.status === 'completed' || mutation.status === 'rolled-back') {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => this.mutations.delete(id));
    this.updateSignals();
  }

  /**
   * Create a snapshot of cache state
   */
  private createSnapshot(
    mutationId: string,
    cache: CacheStore
  ): OptimisticUpdateSnapshot {
    const id = this.generateSnapshotId();
    const previousValues = new Map<string, any>();

    // Store current cache state
    // Note: This is a simplified implementation
    // In practice, you'd want to track specific keys affected by the update

    const snapshot: OptimisticUpdateSnapshot = {
      id,
      mutationId,
      cacheKeys: [],
      previousValues,
      timestamp: Date.now(),
    };

    this.snapshots.set(id, snapshot);

    return snapshot;
  }

  /**
   * Store cache value in snapshot
   */
  snapshotCacheKey(snapshotId: string, key: string, value: any): void {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return;

    if (!snapshot.cacheKeys.includes(key)) {
      snapshot.cacheKeys.push(key);
    }

    if (!snapshot.previousValues.has(key)) {
      snapshot.previousValues.set(key, value);
    }
  }

  /**
   * Apply a snapshot to restore cache state
   */
  private applySnapshot(
    snapshot: OptimisticUpdateSnapshot,
    cache: CacheStore
  ): void {
    batch(() => {
      snapshot.previousValues.forEach((value, key) => {
        if (value === undefined) {
          cache.delete(key);
        } else {
          cache.set(key, value);
        }
      });
    });
  }

  /**
   * Find snapshot by mutation ID
   */
  private findSnapshotByMutationId(
    mutationId: string
  ): OptimisticUpdateSnapshot | undefined {
    return Array.from(this.snapshots.values()).find(
      (s) => s.mutationId === mutationId
    );
  }

  /**
   * Generate unique mutation ID
   */
  private generateMutationId(): string {
    return `mutation_${++this.mutationCounter}_${Date.now()}`;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snapshot_${++this.snapshotCounter}_${Date.now()}`;
  }

  /**
   * Update reactive signals
   */
  private updateSignals(): void {
    this.pendingMutations.set(this.getPendingMutations().length);
  }

  /**
   * Clear all mutations and snapshots
   */
  clear(): void {
    this.mutations.clear();
    this.snapshots.clear();
    this.mutationQueue = [];
    this.updateSignals();
    this.queueSize.set(0);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalMutations: number;
    pendingMutations: number;
    completedMutations: number;
    failedMutations: number;
    queueSize: number;
    snapshotCount: number;
  } {
    const mutations = Array.from(this.mutations.values());

    return {
      totalMutations: mutations.length,
      pendingMutations: mutations.filter(
        (m) => m.status === 'pending' || m.status === 'optimistic'
      ).length,
      completedMutations: mutations.filter((m) => m.status === 'completed').length,
      failedMutations: mutations.filter(
        (m) => m.status === 'failed' || m.status === 'rolled-back'
      ).length,
      queueSize: this.mutationQueue.length,
      snapshotCount: this.snapshots.size,
    };
  }
}

/**
 * Create an optimistic update manager
 */
export function createOptimisticUpdateManager(
  config?: OptimisticUpdateConfig
): OptimisticUpdateManager {
  return new OptimisticUpdateManager(config);
}

/**
 * Optimistic response builder
 * Helps create type-safe optimistic responses
 */
export class OptimisticResponseBuilder<TData = any> {
  private response: Partial<TData> = {};

  /**
   * Set a field value
   */
  set<K extends keyof TData>(key: K, value: TData[K]): this {
    this.response[key] = value;
    return this;
  }

  /**
   * Merge an object into the response
   */
  merge(data: Partial<TData>): this {
    Object.assign(this.response, data);
    return this;
  }

  /**
   * Set typename (for GraphQL __typename field)
   */
  typename(typename: string): this {
    (this.response as any).__typename = typename;
    return this;
  }

  /**
   * Build the optimistic response
   */
  build(): TData {
    return this.response as TData;
  }
}

/**
 * Create an optimistic response builder
 */
export function buildOptimisticResponse<TData = any>(): OptimisticResponseBuilder<TData> {
  return new OptimisticResponseBuilder<TData>();
}

/**
 * Mutation queue with priority support
 */
export class MutationQueue {
  private queue: Array<{
    mutation: OptimisticMutation;
    priority: number;
    timestamp: number;
  }> = [];

  /**
   * Add mutation to queue with priority
   */
  enqueue(mutation: OptimisticMutation, priority = 0): void {
    this.queue.push({
      mutation,
      priority,
      timestamp: Date.now(),
    });

    // Sort by priority (higher first), then by timestamp (older first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Remove and return next mutation
   */
  dequeue(): OptimisticMutation | null {
    const item = this.queue.shift();
    return item ? item.mutation : null;
  }

  /**
   * Peek at next mutation without removing
   */
  peek(): OptimisticMutation | null {
    return this.queue[0]?.mutation || null;
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get all mutations in queue
   */
  getAll(): OptimisticMutation[] {
    return this.queue.map((item) => item.mutation);
  }
}

/**
 * Conflict resolver for concurrent mutations
 */
export interface ConflictResolver {
  /**
   * Resolve conflict between two mutations
   * Returns the mutation that should proceed, or null to reject both
   */
  resolve(
    current: OptimisticMutation,
    incoming: OptimisticMutation
  ): OptimisticMutation | null;
}

/**
 * Last-write-wins conflict resolver
 */
export class LastWriteWinsResolver implements ConflictResolver {
  resolve(
    current: OptimisticMutation,
    incoming: OptimisticMutation
  ): OptimisticMutation | null {
    return incoming.timestamp > current.timestamp ? incoming : current;
  }
}

/**
 * First-write-wins conflict resolver
 */
export class FirstWriteWinsResolver implements ConflictResolver {
  resolve(
    current: OptimisticMutation,
    incoming: OptimisticMutation
  ): OptimisticMutation | null {
    return current.timestamp < incoming.timestamp ? current : incoming;
  }
}

/**
 * Custom conflict resolver with predicate
 */
export class CustomConflictResolver implements ConflictResolver {
  constructor(
    private predicate: (
      current: OptimisticMutation,
      incoming: OptimisticMutation
    ) => OptimisticMutation | null
  ) {}

  resolve(
    current: OptimisticMutation,
    incoming: OptimisticMutation
  ): OptimisticMutation | null {
    return this.predicate(current, incoming);
  }
}

/**
 * Create a mutation queue
 */
export function createMutationQueue(): MutationQueue {
  return new MutationQueue();
}
