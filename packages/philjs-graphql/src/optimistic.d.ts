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
import { type Signal } from '@philjs/core';
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
    update?: (cache: CacheStore, result: {
        data: TData;
    }) => void;
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
export declare class OptimisticUpdateManager {
    private config;
    private mutations;
    private snapshots;
    private mutationQueue;
    private mutationCounter;
    private snapshotCounter;
    private isProcessingQueue;
    queueSize: Signal<number>;
    pendingMutations: Signal<number>;
    constructor(config?: OptimisticUpdateConfig);
    /**
     * Create an optimistic mutation
     */
    createMutation<TData = any, TVariables = any>(mutation: string | DocumentNode, variables?: TVariables, optimisticResponse?: TData, update?: (cache: CacheStore, result: {
        data: TData;
    }) => void): OptimisticMutation<TData, TVariables>;
    /**
     * Apply optimistic update to cache
     */
    applyOptimistic<TData = any>(mutationId: string, cache: CacheStore): OptimisticUpdateSnapshot | null;
    /**
     * Commit a mutation (success)
     */
    commit<TData = any>(mutationId: string, cache: CacheStore, response: TData): void;
    /**
     * Rollback a mutation (failure)
     */
    rollback(mutationId: string, cache: CacheStore, error?: Error): void;
    /**
     * Queue a mutation
     */
    queueMutation(mutation: OptimisticMutation): boolean;
    /**
     * Process next mutation in queue
     */
    private processNextInQueue;
    /**
     * Get next queued mutation
     */
    getNextQueuedMutation(): OptimisticMutation | null;
    /**
     * Get mutation by ID
     */
    getMutation(id: string): OptimisticMutation | undefined;
    /**
     * Get all mutations
     */
    getAllMutations(): OptimisticMutation[];
    /**
     * Get pending mutations
     */
    getPendingMutations(): OptimisticMutation[];
    /**
     * Clear completed and rolled-back mutations
     */
    clearCompleted(): void;
    /**
     * Create a snapshot of cache state
     */
    private createSnapshot;
    /**
     * Store cache value in snapshot
     */
    snapshotCacheKey(snapshotId: string, key: string, value: any): void;
    /**
     * Apply a snapshot to restore cache state
     */
    private applySnapshot;
    /**
     * Find snapshot by mutation ID
     */
    private findSnapshotByMutationId;
    /**
     * Generate unique mutation ID
     */
    private generateMutationId;
    /**
     * Generate unique snapshot ID
     */
    private generateSnapshotId;
    /**
     * Update reactive signals
     */
    private updateSignals;
    /**
     * Clear all mutations and snapshots
     */
    clear(): void;
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
    };
}
/**
 * Create an optimistic update manager
 */
export declare function createOptimisticUpdateManager(config?: OptimisticUpdateConfig): OptimisticUpdateManager;
/**
 * Optimistic response builder
 * Helps create type-safe optimistic responses
 */
export declare class OptimisticResponseBuilder<TData = any> {
    private response;
    /**
     * Set a field value
     */
    set<K extends keyof TData>(key: K, value: TData[K]): this;
    /**
     * Merge an object into the response
     */
    merge(data: Partial<TData>): this;
    /**
     * Set typename (for GraphQL __typename field)
     */
    typename(typename: string): this;
    /**
     * Build the optimistic response
     */
    build(): TData;
}
/**
 * Create an optimistic response builder
 */
export declare function buildOptimisticResponse<TData = any>(): OptimisticResponseBuilder<TData>;
/**
 * Mutation queue with priority support
 */
export declare class MutationQueue {
    private queue;
    /**
     * Add mutation to queue with priority
     */
    enqueue(mutation: OptimisticMutation, priority?: number): void;
    /**
     * Remove and return next mutation
     */
    dequeue(): OptimisticMutation | null;
    /**
     * Peek at next mutation without removing
     */
    peek(): OptimisticMutation | null;
    /**
     * Get queue size
     */
    get size(): number;
    /**
     * Check if queue is empty
     */
    isEmpty(): boolean;
    /**
     * Clear the queue
     */
    clear(): void;
    /**
     * Get all mutations in queue
     */
    getAll(): OptimisticMutation[];
}
/**
 * Conflict resolver for concurrent mutations
 */
export interface ConflictResolver {
    /**
     * Resolve conflict between two mutations
     * Returns the mutation that should proceed, or null to reject both
     */
    resolve(current: OptimisticMutation, incoming: OptimisticMutation): OptimisticMutation | null;
}
/**
 * Last-write-wins conflict resolver
 */
export declare class LastWriteWinsResolver implements ConflictResolver {
    resolve(current: OptimisticMutation, incoming: OptimisticMutation): OptimisticMutation | null;
}
/**
 * First-write-wins conflict resolver
 */
export declare class FirstWriteWinsResolver implements ConflictResolver {
    resolve(current: OptimisticMutation, incoming: OptimisticMutation): OptimisticMutation | null;
}
/**
 * Custom conflict resolver with predicate
 */
export declare class CustomConflictResolver implements ConflictResolver {
    private predicate;
    constructor(predicate: (current: OptimisticMutation, incoming: OptimisticMutation) => OptimisticMutation | null);
    resolve(current: OptimisticMutation, incoming: OptimisticMutation): OptimisticMutation | null;
}
/**
 * Create a mutation queue
 */
export declare function createMutationQueue(): MutationQueue;
//# sourceMappingURL=optimistic.d.ts.map