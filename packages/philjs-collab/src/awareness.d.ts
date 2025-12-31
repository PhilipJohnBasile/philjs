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
export declare class Awareness {
    private localClientId;
    private localClock;
    private localState;
    private remoteStates;
    private listeners;
    private config;
    private gcTimer;
    private onUpdate?;
    constructor(config: AwarenessConfig);
    /**
     * Start awareness protocol
     */
    start(onUpdate: (update: AwarenessState) => void): void;
    /**
     * Stop awareness protocol
     */
    stop(): void;
    /**
     * Set local awareness state
     */
    setLocalState(state: Record<string, unknown>): void;
    /**
     * Update local awareness state (merge with existing)
     */
    updateLocalState(partial: Record<string, unknown>): void;
    /**
     * Get local awareness state
     */
    getLocalState(): Record<string, unknown>;
    /**
     * Get remote awareness state
     */
    getRemoteState(clientId: string): Record<string, unknown> | undefined;
    /**
     * Get all states (including local)
     */
    getAllStates(): Map<string, Record<string, unknown>>;
    /**
     * Handle remote awareness update
     */
    handleRemoteUpdate(update: AwarenessState): void;
    /**
     * Handle client leaving
     */
    handleClientLeave(clientId: string): void;
    /**
     * Subscribe to awareness changes
     */
    subscribe(listener: (update: AwarenessUpdate) => void): () => void;
    /**
     * Get active client count
     */
    getClientCount(): number;
    /**
     * Check if a client is active
     */
    isClientActive(clientId: string): boolean;
    /**
     * Encode awareness state for transmission
     */
    encode(): AwarenessState;
    /**
     * Encode full awareness state (all clients)
     */
    encodeAll(): AwarenessState[];
    /**
     * Apply encoded awareness states
     */
    applyStates(states: AwarenessState[]): void;
    private emitLocalState;
    private notifyListeners;
    private garbageCollect;
}
/**
 * Create an awareness instance
 */
export declare function createAwareness(config: AwarenessConfig): Awareness;
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
        anchor: {
            line: number;
            column: number;
        };
        head: {
            line: number;
            column: number;
        };
    };
    typing?: boolean;
    lastActivity?: number;
    viewportStart?: number;
    viewportEnd?: number;
}
/**
 * Type-safe awareness state setter
 */
export declare function createTypedAwareness<T extends Record<string, unknown>>(awareness: Awareness): {
    setLocalState: (state: T) => void;
    updateLocalState: (partial: Partial<T>) => void;
    getLocalState: () => T;
    getRemoteState: (clientId: string) => T | undefined;
    getAllStates: () => Map<string, T>;
};
//# sourceMappingURL=awareness.d.ts.map