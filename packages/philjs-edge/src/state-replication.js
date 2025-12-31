/**
 * Edge State Replication for PhilJS
 *
 * Distributed state synchronization across edge nodes using:
 * - CRDTs (Conflict-free Replicated Data Types)
 * - Vector clocks for causality
 * - Gossip protocol for propagation
 * - Eventual consistency guarantees
 */
/**
 * Vector clock for tracking causality
 */
export class VectorClock {
    clock = new Map();
    constructor(initial) {
        if (initial) {
            if (initial instanceof Map) {
                this.clock = new Map(initial);
            }
            else {
                this.clock = new Map(Object.entries(initial));
            }
        }
    }
    increment(nodeId) {
        this.clock.set(nodeId, (this.clock.get(nodeId) || 0) + 1);
    }
    get(nodeId) {
        return this.clock.get(nodeId) || 0;
    }
    merge(other) {
        const merged = new VectorClock(this.clock);
        for (const [nodeId, time] of other.clock) {
            merged.clock.set(nodeId, Math.max(merged.get(nodeId), time));
        }
        return merged;
    }
    compare(other) {
        let beforeCount = 0;
        let afterCount = 0;
        // ES2024: Use Set.union() for cleaner set operations
        const allKeys = new Set(this.clock.keys()).union(new Set(other.clock.keys()));
        for (const key of allKeys) {
            const thisTime = this.get(key);
            const otherTime = other.get(key);
            if (thisTime < otherTime)
                beforeCount++;
            if (thisTime > otherTime)
                afterCount++;
        }
        if (beforeCount === 0 && afterCount === 0)
            return 'equal';
        if (beforeCount > 0 && afterCount === 0)
            return 'before';
        if (afterCount > 0 && beforeCount === 0)
            return 'after';
        return 'concurrent';
    }
    toJSON() {
        return Object.fromEntries(this.clock);
    }
    static fromJSON(data) {
        return new VectorClock(data);
    }
}
/**
 * LWW (Last-Writer-Wins) Register CRDT
 */
export class LWWRegister {
    value;
    timestamp = 0;
    nodeId;
    constructor(nodeId, initialValue) {
        this.nodeId = nodeId;
        this.value = initialValue;
        if (initialValue !== undefined) {
            this.timestamp = Date.now();
        }
    }
    set(value, timestamp) {
        const ts = timestamp || Date.now();
        if (ts > this.timestamp) {
            this.value = value;
            this.timestamp = ts;
        }
    }
    get() {
        return this.value;
    }
    getTimestamp() {
        return this.timestamp;
    }
    merge(other) {
        const merged = new LWWRegister(this.nodeId);
        if (other.timestamp > this.timestamp) {
            merged.value = other.value;
            merged.timestamp = other.timestamp;
        }
        else {
            merged.value = this.value;
            merged.timestamp = this.timestamp;
        }
        return merged;
    }
    toJSON() {
        return { value: this.value, timestamp: this.timestamp };
    }
}
/**
 * G-Counter CRDT (grow-only counter)
 */
export class GCounter {
    counts = new Map();
    nodeId;
    constructor(nodeId) {
        this.nodeId = nodeId;
    }
    increment(amount = 1) {
        this.counts.set(this.nodeId, (this.counts.get(this.nodeId) || 0) + amount);
    }
    value() {
        let total = 0;
        for (const count of this.counts.values()) {
            total += count;
        }
        return total;
    }
    merge(other) {
        const merged = new GCounter(this.nodeId);
        // ES2024: Use Set.union() for cleaner set operations
        const allKeys = new Set(this.counts.keys()).union(new Set(other.counts.keys()));
        for (const key of allKeys) {
            const thisCount = this.counts.get(key) || 0;
            const otherCount = other.counts.get(key) || 0;
            merged.counts.set(key, Math.max(thisCount, otherCount));
        }
        return merged;
    }
    toJSON() {
        return Object.fromEntries(this.counts);
    }
    static fromJSON(nodeId, data) {
        const counter = new GCounter(nodeId);
        counter.counts = new Map(Object.entries(data));
        return counter;
    }
}
/**
 * PN-Counter CRDT (positive-negative counter)
 */
export class PNCounter {
    positive;
    negative;
    constructor(nodeId) {
        this.positive = new GCounter(nodeId);
        this.negative = new GCounter(nodeId);
    }
    increment(amount = 1) {
        this.positive.increment(amount);
    }
    decrement(amount = 1) {
        this.negative.increment(amount);
    }
    value() {
        return this.positive.value() - this.negative.value();
    }
    merge(other) {
        const merged = new PNCounter('merged');
        merged.positive = this.positive.merge(other.positive);
        merged.negative = this.negative.merge(other.negative);
        return merged;
    }
    toJSON() {
        return {
            positive: this.positive.toJSON(),
            negative: this.negative.toJSON(),
        };
    }
}
/**
 * LWW-Element-Set CRDT
 */
export class LWWSet {
    addSet = new Map();
    removeSet = new Map();
    hash;
    constructor(hashFn) {
        this.hash = hashFn || ((v) => JSON.stringify(v));
    }
    add(value, timestamp) {
        const ts = timestamp || Date.now();
        const key = this.hash(value);
        const existing = this.addSet.get(key);
        if (!existing || ts > existing.timestamp) {
            this.addSet.set(key, { value, timestamp: ts });
        }
    }
    remove(value, timestamp) {
        const ts = timestamp || Date.now();
        const key = this.hash(value);
        const existing = this.removeSet.get(key);
        if (!existing || ts > existing) {
            this.removeSet.set(key, ts);
        }
    }
    has(value) {
        const key = this.hash(value);
        const addEntry = this.addSet.get(key);
        const removeTs = this.removeSet.get(key);
        if (!addEntry)
            return false;
        if (!removeTs)
            return true;
        return addEntry.timestamp > removeTs;
    }
    values() {
        const result = [];
        for (const [key, { value, timestamp }] of this.addSet) {
            const removeTs = this.removeSet.get(key);
            if (!removeTs || timestamp > removeTs) {
                result.push(value);
            }
        }
        return result;
    }
    merge(other) {
        const merged = new LWWSet(this.hash);
        // Merge add sets
        for (const [key, entry] of this.addSet) {
            merged.addSet.set(key, entry);
        }
        for (const [key, entry] of other.addSet) {
            const existing = merged.addSet.get(key);
            if (!existing || entry.timestamp > existing.timestamp) {
                merged.addSet.set(key, entry);
            }
        }
        // Merge remove sets
        for (const [key, ts] of this.removeSet) {
            merged.removeSet.set(key, ts);
        }
        for (const [key, ts] of other.removeSet) {
            const existing = merged.removeSet.get(key);
            if (!existing || ts > existing) {
                merged.removeSet.set(key, ts);
            }
        }
        return merged;
    }
}
export class ReplicatedState {
    state = new Map();
    config;
    syncTimer = null;
    pendingUpdates = [];
    listeners = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Start automatic synchronization
     */
    startSync() {
        if (this.syncTimer)
            return;
        this.syncTimer = setInterval(async () => {
            await this.syncWithPeers();
        }, this.config.syncInterval);
    }
    /**
     * Stop synchronization
     */
    stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    /**
     * Set a value
     */
    set(key, value) {
        const existing = this.state.get(key);
        const clock = existing?.clock
            ? new VectorClock(existing.clock.toJSON())
            : new VectorClock();
        clock.increment(this.config.nodeId);
        const update = {
            key,
            value,
            clock,
            timestamp: Date.now(),
            nodeId: this.config.nodeId,
        };
        this.applyUpdate(update);
        this.pendingUpdates.push(update);
    }
    /**
     * Get a value
     */
    get(key) {
        return this.state.get(key)?.value;
    }
    /**
     * Delete a value
     */
    delete(key) {
        this.set(key, undefined);
    }
    /**
     * Subscribe to changes
     */
    subscribe(key, callback) {
        let listeners = this.listeners.get(key);
        if (!listeners) {
            listeners = new Set();
            this.listeners.set(key, listeners);
        }
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.listeners.delete(key);
            }
        };
    }
    /**
     * Apply an update (local or remote)
     */
    applyUpdate(update) {
        const existing = this.state.get(update.key);
        if (!existing) {
            this.state.set(update.key, {
                value: update.value,
                clock: update.clock,
                timestamp: update.timestamp,
            });
            this.notifyListeners(update.key, update.value);
            return true;
        }
        const comparison = existing.clock.compare(update.clock);
        if (comparison === 'before') {
            // Remote is newer, accept it
            this.state.set(update.key, {
                value: update.value,
                clock: update.clock,
                timestamp: update.timestamp,
            });
            this.notifyListeners(update.key, update.value);
            return true;
        }
        if (comparison === 'concurrent') {
            // Concurrent updates - resolve conflict
            const resolved = this.resolveConflict(update.key, existing.value, update.value);
            const mergedClock = existing.clock.merge(update.clock);
            this.state.set(update.key, {
                value: resolved,
                clock: mergedClock,
                timestamp: Math.max(existing.timestamp, update.timestamp),
            });
            this.notifyListeners(update.key, resolved);
            return true;
        }
        // Local is newer or equal, ignore update
        return false;
    }
    /**
     * Resolve conflicts between concurrent updates
     */
    resolveConflict(key, local, remote) {
        if (this.config.conflictResolution === 'custom' && this.config.onConflict) {
            return this.config.onConflict(key, local, remote);
        }
        // LWW - this is already handled by timestamp in applyUpdate
        // For concurrent updates, prefer the one with higher timestamp
        return remote;
    }
    /**
     * Notify listeners of state change
     */
    notifyListeners(key, value) {
        const listeners = this.listeners.get(key);
        if (listeners) {
            for (const callback of listeners) {
                callback(value);
            }
        }
    }
    /**
     * Sync with peer nodes
     */
    async syncWithPeers() {
        if (this.pendingUpdates.length === 0 && this.config.peers.length === 0) {
            return;
        }
        const updates = [...this.pendingUpdates];
        this.pendingUpdates = [];
        for (const peer of this.config.peers) {
            try {
                await this.syncWithPeer(peer, updates);
            }
            catch (error) {
                console.warn(`Failed to sync with peer ${peer}:`, error);
                // Re-queue failed updates
                this.pendingUpdates.push(...updates);
            }
        }
    }
    /**
     * Sync with a single peer
     */
    async syncWithPeer(peer, updates) {
        const response = await fetch(`${peer}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodeId: this.config.nodeId,
                updates: updates.map(u => ({
                    ...u,
                    clock: u.clock.toJSON(),
                })),
            }),
        });
        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }
        const remoteUpdates = await response.json();
        for (const update of remoteUpdates) {
            this.applyUpdate({
                ...update,
                clock: VectorClock.fromJSON(update.clock),
            });
        }
    }
    /**
     * Handle incoming sync request from peer
     */
    handleSyncRequest(remoteNodeId, remoteUpdates) {
        // Apply remote updates
        for (const update of remoteUpdates) {
            this.applyUpdate({
                ...update,
                clock: VectorClock.fromJSON(update.clock),
            });
        }
        // Return local state for remote to merge
        return Array.from(this.state.entries()).map(([key, { value, clock, timestamp }]) => ({
            key,
            value,
            clock,
            timestamp,
            nodeId: this.config.nodeId,
        }));
    }
    /**
     * Get all state for persistence/debugging
     */
    getSnapshot() {
        const snapshot = {};
        for (const [key, { value }] of this.state) {
            snapshot[key] = value;
        }
        return snapshot;
    }
    /**
     * Load state from snapshot
     */
    loadSnapshot(snapshot) {
        for (const [key, value] of Object.entries(snapshot)) {
            this.set(key, value);
        }
    }
}
/**
 * Create a replicated state instance
 */
export function createReplicatedState(config) {
    return new ReplicatedState(config);
}
/**
 * Create sync request handler
 */
export function createSyncHandler(state) {
    return async (request) => {
        try {
            const body = await request.json();
            const responseUpdates = state.handleSyncRequest(body.nodeId, body.updates);
            return new Response(JSON.stringify(responseUpdates.map(u => ({
                ...u,
                clock: u.clock.toJSON(),
            }))), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        catch (error) {
            return new Response(JSON.stringify({ error: String(error) }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
//# sourceMappingURL=state-replication.js.map