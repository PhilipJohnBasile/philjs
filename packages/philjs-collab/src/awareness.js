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
/**
 * Awareness Manager
 *
 * Manages ephemeral state that doesn't need to be persisted
 * but needs to be synchronized in real-time.
 */
export class Awareness {
    localClientId;
    localClock = 0;
    localState = {};
    remoteStates = new Map();
    listeners = new Set();
    config;
    gcTimer = null;
    onUpdate;
    constructor(config) {
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
    start(onUpdate) {
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
    stop() {
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
    setLocalState(state) {
        this.localState = state;
        this.localClock++;
        this.emitLocalState();
    }
    /**
     * Update local awareness state (merge with existing)
     */
    updateLocalState(partial) {
        this.localState = { ...this.localState, ...partial };
        this.localClock++;
        this.emitLocalState();
    }
    /**
     * Get local awareness state
     */
    getLocalState() {
        return { ...this.localState };
    }
    /**
     * Get remote awareness state
     */
    getRemoteState(clientId) {
        return this.remoteStates.get(clientId)?.state;
    }
    /**
     * Get all states (including local)
     */
    getAllStates() {
        const states = new Map();
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
    handleRemoteUpdate(update) {
        if (update.clientId === this.localClientId)
            return;
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
    handleClientLeave(clientId) {
        if (this.remoteStates.has(clientId)) {
            const state = this.remoteStates.get(clientId);
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
    subscribe(listener) {
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
    getClientCount() {
        return this.remoteStates.size + 1; // +1 for local
    }
    /**
     * Check if a client is active
     */
    isClientActive(clientId) {
        if (clientId === this.localClientId)
            return true;
        return this.remoteStates.has(clientId);
    }
    /**
     * Encode awareness state for transmission
     */
    encode() {
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
    encodeAll() {
        const states = [this.encode()];
        for (const state of this.remoteStates.values()) {
            states.push(state);
        }
        return states;
    }
    /**
     * Apply encoded awareness states
     */
    applyStates(states) {
        const added = [];
        const updated = [];
        for (const state of states) {
            if (state.clientId === this.localClientId)
                continue;
            const existing = this.remoteStates.get(state.clientId);
            if (!existing) {
                added.push(state.clientId);
                this.remoteStates.set(state.clientId, state);
            }
            else if (state.clock > existing.clock) {
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
    emitLocalState() {
        if (this.onUpdate) {
            this.onUpdate(this.encode());
        }
    }
    notifyListeners(update) {
        for (const listener of this.listeners) {
            listener(update);
        }
    }
    garbageCollect() {
        const now = Date.now();
        const removed = [];
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
export function createAwareness(config) {
    return new Awareness(config);
}
/**
 * Type-safe awareness state setter
 */
export function createTypedAwareness(awareness) {
    return {
        setLocalState: (state) => awareness.setLocalState(state),
        updateLocalState: (partial) => awareness.updateLocalState(partial),
        getLocalState: () => awareness.getLocalState(),
        getRemoteState: (clientId) => awareness.getRemoteState(clientId),
        getAllStates: () => awareness.getAllStates(),
    };
}
//# sourceMappingURL=awareness.js.map