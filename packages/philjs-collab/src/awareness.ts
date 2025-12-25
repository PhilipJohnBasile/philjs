/**
 * Awareness Protocol for PhilJS Collab
 *
 * Ephemeral state synchronization for:
 * - User presence
 * - Cursor positions
 * - Selection ranges
 * - Typing indicators
 * - Custom ephemeral state
 */

export interface AwarenessState {
  clientId: string;
  clock: number;
  state: Record<string, unknown>;
  timestamp: number;
}

export interface AwarenessUpdate {
  added: string[];
  updated: string[];
  removed: string[];
  states: AwarenessState[];
}

export interface AwarenessConfig {
  clientId: string;
  timeout?: number;
  gcInterval?: number;
}

/**
 * Awareness Manager
 *
 * Manages ephemeral state that doesn't need to be persisted
 * but needs to be synchronized in real-time.
 */
export class Awareness {
  private localClientId: string;
  private localClock = 0;
  private localState: Record<string, unknown> = {};
  private remoteStates: Map<string, AwarenessState> = new Map();
  private listeners: Set<(update: AwarenessUpdate) => void> = new Set();
  private config: Required<AwarenessConfig>;
  private gcTimer: ReturnType<typeof setInterval> | null = null;
  private onUpdate?: (update: AwarenessState) => void;

  constructor(config: AwarenessConfig) {
    this.localClientId = config.clientId;
    this.config = {
      clientId: config.clientId,
      timeout: config.timeout ?? 30000,
      gcInterval: config.gcInterval ?? 15000,
    };
  }

  /**
   * Start awareness protocol
   */
  start(onUpdate: (update: AwarenessState) => void): void {
    this.onUpdate = onUpdate;

    // Start garbage collection timer
    this.gcTimer = setInterval(() => {
      this.garbageCollect();
    }, this.config.gcInterval);

    // Emit initial state
    this.emitLocalState();
  }

  /**
   * Stop awareness protocol
   */
  stop(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }

    // Clear local state
    this.localState = {};
    this.localClock++;
    this.emitLocalState();
  }

  /**
   * Set local awareness state
   */
  setLocalState(state: Record<string, unknown>): void {
    this.localState = state;
    this.localClock++;
    this.emitLocalState();
  }

  /**
   * Update local awareness state (merge with existing)
   */
  updateLocalState(partial: Record<string, unknown>): void {
    this.localState = { ...this.localState, ...partial };
    this.localClock++;
    this.emitLocalState();
  }

  /**
   * Get local awareness state
   */
  getLocalState(): Record<string, unknown> {
    return { ...this.localState };
  }

  /**
   * Get remote awareness state
   */
  getRemoteState(clientId: string): Record<string, unknown> | undefined {
    return this.remoteStates.get(clientId)?.state;
  }

  /**
   * Get all states (including local)
   */
  getAllStates(): Map<string, Record<string, unknown>> {
    const states = new Map<string, Record<string, unknown>>();

    // Add local state
    states.set(this.localClientId, this.localState);

    // Add remote states
    for (const [clientId, awarenessState] of this.remoteStates) {
      states.set(clientId, awarenessState.state);
    }

    return states;
  }

  /**
   * Handle remote awareness update
   */
  handleRemoteUpdate(update: AwarenessState): void {
    if (update.clientId === this.localClientId) return;

    const existing = this.remoteStates.get(update.clientId);

    // Only accept updates with higher clock or first update
    if (!existing || update.clock > existing.clock) {
      const wasNew = !existing;

      this.remoteStates.set(update.clientId, update);

      this.notifyListeners({
        added: wasNew ? [update.clientId] : [],
        updated: wasNew ? [] : [update.clientId],
        removed: [],
        states: [update],
      });
    }
  }

  /**
   * Handle client leaving
   */
  handleClientLeave(clientId: string): void {
    if (this.remoteStates.has(clientId)) {
      const state = this.remoteStates.get(clientId)!;
      this.remoteStates.delete(clientId);

      this.notifyListeners({
        added: [],
        updated: [],
        removed: [clientId],
        states: [state],
      });
    }
  }

  /**
   * Subscribe to awareness changes
   */
  subscribe(listener: (update: AwarenessUpdate) => void): () => void {
    this.listeners.add(listener);

    // Send current state to new subscriber
    const states = Array.from(this.remoteStates.values());
    if (states.length > 0) {
      listener({
        added: states.map(s => s.clientId),
        updated: [],
        removed: [],
        states,
      });
    }

    return () => this.listeners.delete(listener);
  }

  /**
   * Get active client count
   */
  getClientCount(): number {
    return this.remoteStates.size + 1; // +1 for local
  }

  /**
   * Check if a client is active
   */
  isClientActive(clientId: string): boolean {
    if (clientId === this.localClientId) return true;
    return this.remoteStates.has(clientId);
  }

  /**
   * Encode awareness state for transmission
   */
  encode(): AwarenessState {
    return {
      clientId: this.localClientId,
      clock: this.localClock,
      state: { ...this.localState },
      timestamp: Date.now(),
    };
  }

  /**
   * Encode full awareness state (all clients)
   */
  encodeAll(): AwarenessState[] {
    const states: AwarenessState[] = [this.encode()];
    for (const state of this.remoteStates.values()) {
      states.push(state);
    }
    return states;
  }

  /**
   * Apply encoded awareness states
   */
  applyStates(states: AwarenessState[]): void {
    const added: string[] = [];
    const updated: string[] = [];

    for (const state of states) {
      if (state.clientId === this.localClientId) continue;

      const existing = this.remoteStates.get(state.clientId);

      if (!existing) {
        added.push(state.clientId);
        this.remoteStates.set(state.clientId, state);
      } else if (state.clock > existing.clock) {
        updated.push(state.clientId);
        this.remoteStates.set(state.clientId, state);
      }
    }

    if (added.length > 0 || updated.length > 0) {
      this.notifyListeners({
        added,
        updated,
        removed: [],
        states,
      });
    }
  }

  private emitLocalState(): void {
    if (this.onUpdate) {
      this.onUpdate(this.encode());
    }
  }

  private notifyListeners(update: AwarenessUpdate): void {
    for (const listener of this.listeners) {
      listener(update);
    }
  }

  private garbageCollect(): void {
    const now = Date.now();
    const removed: string[] = [];

    for (const [clientId, state] of this.remoteStates) {
      if (now - state.timestamp > this.config.timeout) {
        this.remoteStates.delete(clientId);
        removed.push(clientId);
      }
    }

    if (removed.length > 0) {
      this.notifyListeners({
        added: [],
        updated: [],
        removed,
        states: [],
      });
    }
  }
}

/**
 * Create an awareness instance
 */
export function createAwareness(config: AwarenessConfig): Awareness {
  return new Awareness(config);
}

/**
 * Common awareness state fields
 */
export interface StandardAwarenessState {
  user?: {
    id?: string;
    name?: string;
    color?: string;
    avatar?: string;
  };
  cursor?: {
    line: number;
    column: number;
    offset?: number;
  };
  selection?: {
    anchor: { line: number; column: number };
    head: { line: number; column: number };
  };
  typing?: boolean;
  lastActivity?: number;
  viewportStart?: number;
  viewportEnd?: number;
}

/**
 * Type-safe awareness state setter
 */
export function createTypedAwareness<T extends Record<string, unknown>>(awareness: Awareness) {
  return {
    setLocalState: (state: T) => awareness.setLocalState(state),
    updateLocalState: (partial: Partial<T>) => awareness.updateLocalState(partial),
    getLocalState: () => awareness.getLocalState() as T,
    getRemoteState: (clientId: string) => awareness.getRemoteState(clientId) as T | undefined,
    getAllStates: () => awareness.getAllStates() as Map<string, T>,
  };
}
