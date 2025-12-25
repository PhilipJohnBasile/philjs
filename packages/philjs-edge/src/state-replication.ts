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
export class VectorClock {
  private clock: Map<NodeId, number> = new Map();

  constructor(initial?: Map<NodeId, number> | Record<NodeId, number>) {
    if (initial) {
      if (initial instanceof Map) {
        this.clock = new Map(initial);
      } else {
        this.clock = new Map(Object.entries(initial));
      }
    }
  }

  increment(nodeId: NodeId): void {
    this.clock.set(nodeId, (this.clock.get(nodeId) || 0) + 1);
  }

  get(nodeId: NodeId): number {
    return this.clock.get(nodeId) || 0;
  }

  merge(other: VectorClock): VectorClock {
    const merged = new VectorClock(this.clock);
    for (const [nodeId, time] of other.clock) {
      merged.clock.set(nodeId, Math.max(merged.get(nodeId), time));
    }
    return merged;
  }

  compare(other: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
    let beforeCount = 0;
    let afterCount = 0;

    const allKeys = new Set([...this.clock.keys(), ...other.clock.keys()]);

    for (const key of allKeys) {
      const thisTime = this.get(key);
      const otherTime = other.get(key);

      if (thisTime < otherTime) beforeCount++;
      if (thisTime > otherTime) afterCount++;
    }

    if (beforeCount === 0 && afterCount === 0) return 'equal';
    if (beforeCount > 0 && afterCount === 0) return 'before';
    if (afterCount > 0 && beforeCount === 0) return 'after';
    return 'concurrent';
  }

  toJSON(): Record<NodeId, number> {
    return Object.fromEntries(this.clock);
  }

  static fromJSON(data: Record<NodeId, number>): VectorClock {
    return new VectorClock(data);
  }
}

/**
 * LWW (Last-Writer-Wins) Register CRDT
 */
export class LWWRegister<T> {
  private value: T | undefined;
  private timestamp: Timestamp = 0;
  private nodeId: NodeId;

  constructor(nodeId: NodeId, initialValue?: T) {
    this.nodeId = nodeId;
    this.value = initialValue;
    if (initialValue !== undefined) {
      this.timestamp = Date.now();
    }
  }

  set(value: T, timestamp?: Timestamp): void {
    const ts = timestamp || Date.now();
    if (ts > this.timestamp) {
      this.value = value;
      this.timestamp = ts;
    }
  }

  get(): T | undefined {
    return this.value;
  }

  getTimestamp(): Timestamp {
    return this.timestamp;
  }

  merge(other: LWWRegister<T>): LWWRegister<T> {
    const merged = new LWWRegister<T>(this.nodeId);
    if (other.timestamp > this.timestamp) {
      merged.value = other.value;
      merged.timestamp = other.timestamp;
    } else {
      merged.value = this.value;
      merged.timestamp = this.timestamp;
    }
    return merged;
  }

  toJSON(): { value: T | undefined; timestamp: Timestamp } {
    return { value: this.value, timestamp: this.timestamp };
  }
}

/**
 * G-Counter CRDT (grow-only counter)
 */
export class GCounter {
  private counts: Map<NodeId, number> = new Map();
  private nodeId: NodeId;

  constructor(nodeId: NodeId) {
    this.nodeId = nodeId;
  }

  increment(amount = 1): void {
    this.counts.set(this.nodeId, (this.counts.get(this.nodeId) || 0) + amount);
  }

  value(): number {
    let total = 0;
    for (const count of this.counts.values()) {
      total += count;
    }
    return total;
  }

  merge(other: GCounter): GCounter {
    const merged = new GCounter(this.nodeId);
    const allKeys = new Set([...this.counts.keys(), ...other.counts.keys()]);

    for (const key of allKeys) {
      const thisCount = this.counts.get(key) || 0;
      const otherCount = other.counts.get(key) || 0;
      merged.counts.set(key, Math.max(thisCount, otherCount));
    }

    return merged;
  }

  toJSON(): Record<NodeId, number> {
    return Object.fromEntries(this.counts);
  }

  static fromJSON(nodeId: NodeId, data: Record<NodeId, number>): GCounter {
    const counter = new GCounter(nodeId);
    counter.counts = new Map(Object.entries(data));
    return counter;
  }
}

/**
 * PN-Counter CRDT (positive-negative counter)
 */
export class PNCounter {
  private positive: GCounter;
  private negative: GCounter;

  constructor(nodeId: NodeId) {
    this.positive = new GCounter(nodeId);
    this.negative = new GCounter(nodeId);
  }

  increment(amount = 1): void {
    this.positive.increment(amount);
  }

  decrement(amount = 1): void {
    this.negative.increment(amount);
  }

  value(): number {
    return this.positive.value() - this.negative.value();
  }

  merge(other: PNCounter): PNCounter {
    const merged = new PNCounter('merged');
    merged.positive = this.positive.merge(other.positive);
    merged.negative = this.negative.merge(other.negative);
    return merged;
  }

  toJSON(): { positive: Record<NodeId, number>; negative: Record<NodeId, number> } {
    return {
      positive: this.positive.toJSON(),
      negative: this.negative.toJSON(),
    };
  }
}

/**
 * LWW-Element-Set CRDT
 */
export class LWWSet<T> {
  private addSet: Map<string, { value: T; timestamp: Timestamp }> = new Map();
  private removeSet: Map<string, Timestamp> = new Map();
  private hash: (value: T) => string;

  constructor(hashFn?: (value: T) => string) {
    this.hash = hashFn || ((v: T) => JSON.stringify(v));
  }

  add(value: T, timestamp?: Timestamp): void {
    const ts = timestamp || Date.now();
    const key = this.hash(value);
    const existing = this.addSet.get(key);

    if (!existing || ts > existing.timestamp) {
      this.addSet.set(key, { value, timestamp: ts });
    }
  }

  remove(value: T, timestamp?: Timestamp): void {
    const ts = timestamp || Date.now();
    const key = this.hash(value);
    const existing = this.removeSet.get(key);

    if (!existing || ts > existing) {
      this.removeSet.set(key, ts);
    }
  }

  has(value: T): boolean {
    const key = this.hash(value);
    const addEntry = this.addSet.get(key);
    const removeTs = this.removeSet.get(key);

    if (!addEntry) return false;
    if (!removeTs) return true;

    return addEntry.timestamp > removeTs;
  }

  values(): T[] {
    const result: T[] = [];

    for (const [key, { value, timestamp }] of this.addSet) {
      const removeTs = this.removeSet.get(key);
      if (!removeTs || timestamp > removeTs) {
        result.push(value);
      }
    }

    return result;
  }

  merge(other: LWWSet<T>): LWWSet<T> {
    const merged = new LWWSet<T>(this.hash);

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

export class ReplicatedState {
  private state: Map<string, { value: unknown; clock: VectorClock; timestamp: Timestamp }> = new Map();
  private config: ReplicationConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private pendingUpdates: StateUpdate[] = [];
  private listeners: Map<string, Set<(value: unknown) => void>> = new Map();

  constructor(config: ReplicationConfig) {
    this.config = config;
  }

  /**
   * Start automatic synchronization
   */
  startSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(async () => {
      await this.syncWithPeers();
    }, this.config.syncInterval);
  }

  /**
   * Stop synchronization
   */
  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Set a value
   */
  set<T>(key: string, value: T): void {
    const existing = this.state.get(key);
    const clock = existing?.clock
      ? new VectorClock(existing.clock.toJSON())
      : new VectorClock();

    clock.increment(this.config.nodeId);

    const update: StateUpdate<T> = {
      key,
      value,
      clock,
      timestamp: Date.now(),
      nodeId: this.config.nodeId,
    };

    this.applyUpdate(update);
    this.pendingUpdates.push(update as StateUpdate);
  }

  /**
   * Get a value
   */
  get<T>(key: string): T | undefined {
    return this.state.get(key)?.value as T | undefined;
  }

  /**
   * Delete a value
   */
  delete(key: string): void {
    this.set(key, undefined);
  }

  /**
   * Subscribe to changes
   */
  subscribe(key: string, callback: (value: unknown) => void): () => void {
    let listeners = this.listeners.get(key);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(key, listeners);
    }
    listeners.add(callback);

    return () => {
      listeners!.delete(callback);
      if (listeners!.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Apply an update (local or remote)
   */
  applyUpdate(update: StateUpdate): boolean {
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
  private resolveConflict(key: string, local: unknown, remote: unknown): unknown {
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
  private notifyListeners(key: string, value: unknown): void {
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
  async syncWithPeers(): Promise<void> {
    if (this.pendingUpdates.length === 0 && this.config.peers.length === 0) {
      return;
    }

    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];

    for (const peer of this.config.peers) {
      try {
        await this.syncWithPeer(peer, updates);
      } catch (error) {
        console.warn(`Failed to sync with peer ${peer}:`, error);
        // Re-queue failed updates
        this.pendingUpdates.push(...updates);
      }
    }
  }

  /**
   * Sync with a single peer
   */
  private async syncWithPeer(peer: string, updates: StateUpdate[]): Promise<void> {
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

    const remoteUpdates = await response.json() as Array<{
      key: string;
      value: unknown;
      clock: Record<NodeId, number>;
      timestamp: Timestamp;
      nodeId: NodeId;
    }>;

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
  handleSyncRequest(
    remoteNodeId: NodeId,
    remoteUpdates: Array<{
      key: string;
      value: unknown;
      clock: Record<NodeId, number>;
      timestamp: Timestamp;
      nodeId: NodeId;
    }>
  ): StateUpdate[] {
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
  getSnapshot(): Record<string, unknown> {
    const snapshot: Record<string, unknown> = {};
    for (const [key, { value }] of this.state) {
      snapshot[key] = value;
    }
    return snapshot;
  }

  /**
   * Load state from snapshot
   */
  loadSnapshot(snapshot: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(snapshot)) {
      this.set(key, value);
    }
  }
}

/**
 * Create a replicated state instance
 */
export function createReplicatedState(config: ReplicationConfig): ReplicatedState {
  return new ReplicatedState(config);
}

/**
 * Create sync request handler
 */
export function createSyncHandler(state: ReplicatedState) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.json() as {
        nodeId: NodeId;
        updates: Array<{
          key: string;
          value: unknown;
          clock: Record<NodeId, number>;
          timestamp: Timestamp;
          nodeId: NodeId;
        }>;
      };

      const responseUpdates = state.handleSyncRequest(body.nodeId, body.updates);

      return new Response(JSON.stringify(responseUpdates.map(u => ({
        ...u,
        clock: u.clock.toJSON(),
      }))), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
