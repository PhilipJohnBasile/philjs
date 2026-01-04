/**
 * Edge State Replication for PhilJS
 *
 * Distributed state synchronization across edge nodes using:
 * - CRDTs (Conflict-free Replicated Data Types)
 * - Vector clocks for causality
 * - Gossip protocol for propagation
 * - Eventual consistency guarantees
 */
export type NodeId = string;
export type Timestamp = number;
/**
 * Vector clock for tracking causality
 */
export declare class VectorClock {
    private clock;
    constructor(initial?: Map<NodeId, number> | Record<NodeId, number>);
    increment(nodeId: NodeId): void;
    get(nodeId: NodeId): number;
    merge(other: VectorClock): VectorClock;
    compare(other: VectorClock): 'before' | 'after' | 'concurrent' | 'equal';
    toJSON(): Record<NodeId, number>;
    static fromJSON(data: Record<NodeId, number>): VectorClock;
}
/**
 * LWW (Last-Writer-Wins) Register CRDT
 */
export declare class LWWRegister<T> {
    private value;
    private timestamp;
    private nodeId;
    constructor(nodeId: NodeId, initialValue?: T);
    set(value: T, timestamp?: Timestamp): void;
    get(): T | undefined;
    getTimestamp(): Timestamp;
    merge(other: LWWRegister<T>): LWWRegister<T>;
    toJSON(): {
        value: T | undefined;
        timestamp: Timestamp;
    };
}
/**
 * G-Counter CRDT (grow-only counter)
 */
export declare class GCounter {
    private counts;
    private nodeId;
    constructor(nodeId: NodeId);
    increment(amount?: number): void;
    value(): number;
    merge(other: GCounter): GCounter;
    toJSON(): Record<NodeId, number>;
    static fromJSON(nodeId: NodeId, data: Record<NodeId, number>): GCounter;
}
/**
 * PN-Counter CRDT (positive-negative counter)
 */
export declare class PNCounter {
    private positive;
    private negative;
    constructor(nodeId: NodeId);
    increment(amount?: number): void;
    decrement(amount?: number): void;
    value(): number;
    merge(other: PNCounter): PNCounter;
    toJSON(): {
        positive: Record<NodeId, number>;
        negative: Record<NodeId, number>;
    };
}
/**
 * LWW-Element-Set CRDT
 */
export declare class LWWSet<T> {
    private addSet;
    private removeSet;
    private hash;
    constructor(hashFn?: (value: T) => string);
    add(value: T, timestamp?: Timestamp): void;
    remove(value: T, timestamp?: Timestamp): void;
    has(value: T): boolean;
    values(): T[];
    merge(other: LWWSet<T>): LWWSet<T>;
}
/**
 * Edge state store with automatic replication
 */
export interface ReplicationConfig {
    nodeId: NodeId;
    peers: string[];
    syncInterval: number;
    conflictResolution: 'lww' | 'custom';
    onConflict?: (key: string, local: unknown, remote: unknown) => unknown;
}
export interface StateUpdate<T = unknown> {
    key: string;
    value: T;
    clock: VectorClock;
    timestamp: Timestamp;
    nodeId: NodeId;
}
export declare class ReplicatedState {
    private state;
    private config;
    private syncTimer;
    private pendingUpdates;
    private listeners;
    constructor(config: ReplicationConfig);
    /**
     * Start automatic synchronization
     */
    startSync(): void;
    /**
     * Stop synchronization
     */
    stopSync(): void;
    /**
     * Set a value
     */
    set<T>(key: string, value: T): void;
    /**
     * Get a value
     */
    get<T>(key: string): T | undefined;
    /**
     * Delete a value
     */
    delete(key: string): void;
    /**
     * Subscribe to changes
     */
    subscribe(key: string, callback: (value: unknown) => void): () => void;
    /**
     * Apply an update (local or remote)
     */
    applyUpdate(update: StateUpdate): boolean;
    /**
     * Resolve conflicts between concurrent updates
     */
    private resolveConflict;
    /**
     * Notify listeners of state change
     */
    private notifyListeners;
    /**
     * Sync with peer nodes
     */
    syncWithPeers(): Promise<void>;
    /**
     * Sync with a single peer
     */
    private syncWithPeer;
    /**
     * Handle incoming sync request from peer
     */
    handleSyncRequest(remoteNodeId: NodeId, remoteUpdates: Array<{
        key: string;
        value: unknown;
        clock: Record<NodeId, number>;
        timestamp: Timestamp;
        nodeId: NodeId;
    }>): StateUpdate[];
    /**
     * Get all state for persistence/debugging
     */
    getSnapshot(): Record<string, unknown>;
    /**
     * Load state from snapshot
     */
    loadSnapshot(snapshot: Record<string, unknown>): void;
}
/**
 * Create a replicated state instance
 */
export declare function createReplicatedState(config: ReplicationConfig): ReplicatedState;
/**
 * Create sync request handler
 */
export declare function createSyncHandler(state: ReplicatedState): (request: Request) => Promise<Response>;
//# sourceMappingURL=state-replication.d.ts.map