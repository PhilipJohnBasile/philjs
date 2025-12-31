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
import { signal, batch } from 'philjs-core';
/**
 * Optimistic Update Manager
 * Manages optimistic mutations and rollback
 */
export class OptimisticUpdateManager {
    config;
    mutations = new Map();
    snapshots = new Map();
    mutationQueue = [];
    mutationCounter = 0;
    snapshotCounter = 0;
    isProcessingQueue = false;
    // Signals for reactive state
    queueSize = signal(0);
    pendingMutations = signal(0);
    constructor(config = {}) {
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
    createMutation(mutation, variables, optimisticResponse, update) {
        const id = this.generateMutationId();
        const optimisticMutation = {
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
    applyOptimistic(mutationId, cache) {
        const mutation = this.mutations.get(mutationId);
        if (!mutation || !mutation.optimisticResponse || !mutation.update) {
            return null;
        }
        // Create snapshot before applying update
        const snapshot = this.createSnapshot(mutationId, cache);
        // Apply optimistic update in a batch
        batch(() => {
            mutation.update(cache, { data: mutation.optimisticResponse });
            mutation.status = 'optimistic';
        });
        this.updateSignals();
        return snapshot;
    }
    /**
     * Commit a mutation (success)
     */
    commit(mutationId, cache, response) {
        const mutation = this.mutations.get(mutationId);
        if (!mutation)
            return;
        // Apply real update if provided
        if (mutation.update) {
            batch(() => {
                mutation.update(cache, { data: response });
                mutation.status = 'completed';
            });
        }
        else {
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
    rollback(mutationId, cache, error) {
        const mutation = this.mutations.get(mutationId);
        if (!mutation)
            return;
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
    queueMutation(mutation) {
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
    processNextInQueue() {
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
    getNextQueuedMutation() {
        if (this.mutationQueue.length === 0)
            return null;
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
    getMutation(id) {
        return this.mutations.get(id);
    }
    /**
     * Get all mutations
     */
    getAllMutations() {
        return Array.from(this.mutations.values());
    }
    /**
     * Get pending mutations
     */
    getPendingMutations() {
        return Array.from(this.mutations.values()).filter((m) => m.status === 'pending' || m.status === 'optimistic');
    }
    /**
     * Clear completed and rolled-back mutations
     */
    clearCompleted() {
        const toDelete = [];
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
    createSnapshot(mutationId, cache) {
        const id = this.generateSnapshotId();
        const previousValues = new Map();
        // Store current cache state
        // Note: This is a simplified implementation
        // In practice, you'd want to track specific keys affected by the update
        const snapshot = {
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
    snapshotCacheKey(snapshotId, key, value) {
        const snapshot = this.snapshots.get(snapshotId);
        if (!snapshot)
            return;
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
    applySnapshot(snapshot, cache) {
        batch(() => {
            snapshot.previousValues.forEach((value, key) => {
                if (value === undefined) {
                    cache.delete(key);
                }
                else {
                    cache.set(key, value);
                }
            });
        });
    }
    /**
     * Find snapshot by mutation ID
     */
    findSnapshotByMutationId(mutationId) {
        return Array.from(this.snapshots.values()).find((s) => s.mutationId === mutationId);
    }
    /**
     * Generate unique mutation ID
     */
    generateMutationId() {
        return `mutation_${++this.mutationCounter}_${Date.now()}`;
    }
    /**
     * Generate unique snapshot ID
     */
    generateSnapshotId() {
        return `snapshot_${++this.snapshotCounter}_${Date.now()}`;
    }
    /**
     * Update reactive signals
     */
    updateSignals() {
        this.pendingMutations.set(this.getPendingMutations().length);
    }
    /**
     * Clear all mutations and snapshots
     */
    clear() {
        this.mutations.clear();
        this.snapshots.clear();
        this.mutationQueue = [];
        this.updateSignals();
        this.queueSize.set(0);
    }
    /**
     * Get statistics
     */
    getStats() {
        const mutations = Array.from(this.mutations.values());
        return {
            totalMutations: mutations.length,
            pendingMutations: mutations.filter((m) => m.status === 'pending' || m.status === 'optimistic').length,
            completedMutations: mutations.filter((m) => m.status === 'completed').length,
            failedMutations: mutations.filter((m) => m.status === 'failed' || m.status === 'rolled-back').length,
            queueSize: this.mutationQueue.length,
            snapshotCount: this.snapshots.size,
        };
    }
}
/**
 * Create an optimistic update manager
 */
export function createOptimisticUpdateManager(config) {
    return new OptimisticUpdateManager(config);
}
/**
 * Optimistic response builder
 * Helps create type-safe optimistic responses
 */
export class OptimisticResponseBuilder {
    response = {};
    /**
     * Set a field value
     */
    set(key, value) {
        this.response[key] = value;
        return this;
    }
    /**
     * Merge an object into the response
     */
    merge(data) {
        Object.assign(this.response, data);
        return this;
    }
    /**
     * Set typename (for GraphQL __typename field)
     */
    typename(typename) {
        this.response.__typename = typename;
        return this;
    }
    /**
     * Build the optimistic response
     */
    build() {
        return this.response;
    }
}
/**
 * Create an optimistic response builder
 */
export function buildOptimisticResponse() {
    return new OptimisticResponseBuilder();
}
/**
 * Mutation queue with priority support
 */
export class MutationQueue {
    queue = [];
    /**
     * Add mutation to queue with priority
     */
    enqueue(mutation, priority = 0) {
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
    dequeue() {
        const item = this.queue.shift();
        return item ? item.mutation : null;
    }
    /**
     * Peek at next mutation without removing
     */
    peek() {
        return this.queue[0]?.mutation || null;
    }
    /**
     * Get queue size
     */
    get size() {
        return this.queue.length;
    }
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.length === 0;
    }
    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
    }
    /**
     * Get all mutations in queue
     */
    getAll() {
        return this.queue.map((item) => item.mutation);
    }
}
/**
 * Last-write-wins conflict resolver
 */
export class LastWriteWinsResolver {
    resolve(current, incoming) {
        return incoming.timestamp > current.timestamp ? incoming : current;
    }
}
/**
 * First-write-wins conflict resolver
 */
export class FirstWriteWinsResolver {
    resolve(current, incoming) {
        return current.timestamp < incoming.timestamp ? current : incoming;
    }
}
/**
 * Custom conflict resolver with predicate
 */
export class CustomConflictResolver {
    predicate;
    constructor(predicate) {
        this.predicate = predicate;
    }
    resolve(current, incoming) {
        return this.predicate(current, incoming);
    }
}
/**
 * Create a mutation queue
 */
export function createMutationQueue() {
    return new MutationQueue();
}
//# sourceMappingURL=optimistic.js.map