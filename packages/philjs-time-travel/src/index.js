/**
 * @philjs/time-travel - Visual Time-Travel Debugging
 *
 * Go back and forth through your application's state history:
 * - Record all state changes with timestamps
 * - Visual timeline of component renders
 * - Step through state changes frame by frame
 * - Branch from any point in history
 * - Diff viewer for state changes
 * - Export/import state snapshots
 * - Persist debug sessions across reloads
 *
 * SUPERIOR TO ELM AND REDUX DEVTOOLS.
 */
// ============================================================================
// State Differ
// ============================================================================
export function diffStates(oldState, newState, path = '') {
    const diffs = [];
    const allKeys = new Set([
        ...Object.keys(oldState || {}),
        ...Object.keys(newState || {})
    ]);
    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const oldValue = oldState?.[key];
        const newValue = newState?.[key];
        if (!(key in (oldState || {}))) {
            diffs.push({ path: currentPath, oldValue: undefined, newValue, type: 'add' });
        }
        else if (!(key in (newState || {}))) {
            diffs.push({ path: currentPath, oldValue, newValue: undefined, type: 'remove' });
        }
        else if (typeof oldValue === 'object' && typeof newValue === 'object' &&
            oldValue !== null && newValue !== null &&
            !Array.isArray(oldValue) && !Array.isArray(newValue)) {
            diffs.push(...diffStates(oldValue, newValue, currentPath));
        }
        else if (!deepEqual(oldValue, newValue)) {
            diffs.push({ path: currentPath, oldValue, newValue, type: 'change' });
        }
    }
    return diffs;
}
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (a === null || b === null)
        return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        return a.every((item, i) => deepEqual(item, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        return keysA.every(key => deepEqual(a[key], b[key]));
    }
    return false;
}
// ============================================================================
// Time Travel Engine
// ============================================================================
export class TimeTravelEngine {
    config;
    state;
    stateGetters = new Map();
    stateSetters = new Map();
    subscribers = new Set();
    componentRegistry = new Map();
    constructor(config = {}) {
        this.config = {
            maxSnapshots: config.maxSnapshots ?? 1000,
            autoRecord: config.autoRecord ?? true,
            persist: config.persist ?? false,
            storageKey: config.storageKey ?? 'philjs-time-travel',
            captureComponents: config.captureComponents ?? true,
            captureNetwork: config.captureNetwork ?? true,
            captureConsole: config.captureConsole ?? true,
            compress: config.compress ?? true
        };
        this.state = {
            snapshots: [],
            currentIndex: -1,
            branches: new Map(),
            isRecording: this.config.autoRecord,
            isPaused: false
        };
        if (this.config.persist) {
            this.loadFromStorage();
        }
        if (this.config.captureNetwork) {
            this.interceptNetwork();
        }
        if (this.config.captureConsole) {
            this.interceptConsole();
        }
    }
    // State Registration
    registerState(key, getter, setter) {
        this.stateGetters.set(key, getter);
        this.stateSetters.set(key, setter);
        return () => {
            this.stateGetters.delete(key);
            this.stateSetters.delete(key);
        };
    }
    registerComponent(id, snapshot) {
        this.componentRegistry.set(id, snapshot);
    }
    unregisterComponent(id) {
        this.componentRegistry.delete(id);
    }
    // Recording
    record(action) {
        if (!this.state.isRecording || this.state.isPaused) {
            return this.state.snapshots[this.state.currentIndex];
        }
        // If we're not at the end, create a new branch
        if (this.state.currentIndex < this.state.snapshots.length - 1) {
            this.createBranch();
        }
        const snapshot = this.captureSnapshot(action);
        // Trim old snapshots if needed
        if (this.state.snapshots.length >= this.config.maxSnapshots) {
            this.state.snapshots.shift();
        }
        this.state.snapshots.push(snapshot);
        this.state.currentIndex = this.state.snapshots.length - 1;
        this.notifySubscribers();
        this.persistIfEnabled();
        return snapshot;
    }
    captureSnapshot(action) {
        const state = {};
        for (const [key, getter] of this.stateGetters) {
            try {
                state[key] = structuredClone(getter());
            }
            catch {
                state[key] = getter();
            }
        }
        const snapshot = {
            id: this.generateId(),
            timestamp: Date.now(),
            state,
            metadata: {
                branch: 'main'
            }
        };
        if (action !== undefined) {
            snapshot.action = action;
        }
        if (this.config.captureComponents) {
            snapshot.componentTree = this.captureComponentTree();
        }
        return snapshot;
    }
    captureComponentTree() {
        return Array.from(this.componentRegistry.values());
    }
    // Navigation
    goTo(index) {
        if (index < 0 || index >= this.state.snapshots.length) {
            return false;
        }
        const snapshot = this.state.snapshots[index];
        this.restoreState(snapshot);
        this.state.currentIndex = index;
        this.notifySubscribers();
        return true;
    }
    goToSnapshot(snapshotId) {
        const index = this.state.snapshots.findIndex(s => s.id === snapshotId);
        return this.goTo(index);
    }
    stepBack() {
        return this.goTo(this.state.currentIndex - 1);
    }
    stepForward() {
        return this.goTo(this.state.currentIndex + 1);
    }
    goToStart() {
        return this.goTo(0);
    }
    goToEnd() {
        return this.goTo(this.state.snapshots.length - 1);
    }
    restoreState(snapshot) {
        for (const [key, value] of Object.entries(snapshot.state)) {
            const setter = this.stateSetters.get(key);
            if (setter) {
                try {
                    setter(structuredClone(value));
                }
                catch {
                    setter(value);
                }
            }
        }
    }
    // Branching
    createBranch(name) {
        const branchName = name || `branch-${Date.now()}`;
        const branchSnapshots = this.state.snapshots.slice(this.state.currentIndex + 1);
        this.state.branches.set(branchName, branchSnapshots);
        this.state.snapshots = this.state.snapshots.slice(0, this.state.currentIndex + 1);
        return branchName;
    }
    switchToBranch(name) {
        const branchSnapshots = this.state.branches.get(name);
        if (!branchSnapshots)
            return false;
        // Save current branch
        const currentBranch = this.state.snapshots.slice(this.state.currentIndex + 1);
        if (currentBranch.length > 0) {
            this.state.branches.set('previous', currentBranch);
        }
        // Switch to new branch
        this.state.snapshots = [
            ...this.state.snapshots.slice(0, this.state.currentIndex + 1),
            ...branchSnapshots
        ];
        this.notifySubscribers();
        return true;
    }
    getBranches() {
        return Array.from(this.state.branches.keys());
    }
    // Playback
    async play(speed = 1, onFrame) {
        const startIndex = this.state.currentIndex;
        for (let i = startIndex; i < this.state.snapshots.length; i++) {
            if (this.state.isPaused)
                break;
            this.goTo(i);
            onFrame?.(this.state.snapshots[i]);
            if (i < this.state.snapshots.length - 1) {
                const currentTime = this.state.snapshots[i].timestamp;
                const nextTime = this.state.snapshots[i + 1].timestamp;
                const delay = (nextTime - currentTime) / speed;
                await this.sleep(Math.min(delay, 1000));
            }
        }
    }
    pause() {
        this.state.isPaused = true;
        this.notifySubscribers();
    }
    resume() {
        this.state.isPaused = false;
        this.notifySubscribers();
    }
    // Recording Controls
    startRecording() {
        this.state.isRecording = true;
        this.notifySubscribers();
    }
    stopRecording() {
        this.state.isRecording = false;
        this.notifySubscribers();
    }
    clear() {
        this.state.snapshots = [];
        this.state.currentIndex = -1;
        this.state.branches.clear();
        this.notifySubscribers();
        this.persistIfEnabled();
    }
    // Labeling & Tagging
    labelSnapshot(snapshotId, label) {
        const snapshot = this.state.snapshots.find(s => s.id === snapshotId);
        if (snapshot) {
            snapshot.metadata.label = label;
            this.notifySubscribers();
        }
    }
    tagSnapshot(snapshotId, tag) {
        const snapshot = this.state.snapshots.find(s => s.id === snapshotId);
        if (snapshot) {
            snapshot.metadata.tags = snapshot.metadata.tags || [];
            if (!snapshot.metadata.tags.includes(tag)) {
                snapshot.metadata.tags.push(tag);
            }
            this.notifySubscribers();
        }
    }
    findByLabel(label) {
        return this.state.snapshots.find(s => s.metadata.label === label);
    }
    findByTag(tag) {
        return this.state.snapshots.filter(s => s.metadata.tags?.includes(tag));
    }
    // Diffing
    getDiff(fromIndex, toIndex) {
        const fromSnapshot = this.state.snapshots[fromIndex];
        const toSnapshot = this.state.snapshots[toIndex];
        if (!fromSnapshot || !toSnapshot)
            return [];
        return diffStates(fromSnapshot.state, toSnapshot.state);
    }
    getDiffFromCurrent(snapshotId) {
        const targetIndex = this.state.snapshots.findIndex(s => s.id === snapshotId);
        return this.getDiff(this.state.currentIndex, targetIndex);
    }
    // Export/Import
    exportSession() {
        const data = {
            version: '1.0.0',
            snapshots: this.state.snapshots,
            branches: Array.from(this.state.branches.entries()),
            currentIndex: this.state.currentIndex,
            exportedAt: Date.now()
        };
        if (this.config.compress) {
            return this.compress(JSON.stringify(data));
        }
        return JSON.stringify(data);
    }
    importSession(data) {
        try {
            let parsed;
            try {
                parsed = JSON.parse(this.decompress(data));
            }
            catch {
                parsed = JSON.parse(data);
            }
            this.state.snapshots = parsed.snapshots;
            this.state.branches = new Map(parsed.branches);
            this.state.currentIndex = parsed.currentIndex;
            this.notifySubscribers();
            return true;
        }
        catch {
            return false;
        }
    }
    exportSnapshot(snapshotId) {
        const snapshot = this.state.snapshots.find(s => s.id === snapshotId);
        if (!snapshot)
            return null;
        return JSON.stringify(snapshot);
    }
    // Subscription
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    notifySubscribers() {
        for (const callback of this.subscribers) {
            callback(this.state);
        }
    }
    // State Access
    getState() {
        return { ...this.state };
    }
    getCurrentSnapshot() {
        return this.state.snapshots[this.state.currentIndex] || null;
    }
    getSnapshotCount() {
        return this.state.snapshots.length;
    }
    // Network Interception
    interceptNetwork() {
        if (typeof window === 'undefined')
            return;
        const originalFetch = window.fetch;
        const engine = this;
        window.fetch = async function (input, init) {
            const id = engine.generateId();
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            const method = init?.method || 'GET';
            const timestamp = Date.now();
            const request = {
                id,
                url,
                method,
                timestamp,
                requestBody: init?.body
            };
            try {
                const response = await originalFetch(input, init);
                request.status = response.status;
                request.duration = Date.now() - timestamp;
                // Clone response to read body
                const clone = response.clone();
                try {
                    request.responseBody = await clone.json();
                }
                catch {
                    request.responseBody = await clone.text();
                }
                return response;
            }
            catch (error) {
                request.status = 0;
                request.duration = Date.now() - timestamp;
                throw error;
            }
        };
    }
    // Console Interception
    interceptConsole() {
        if (typeof console === 'undefined')
            return;
        const levels = ['log', 'warn', 'error', 'info', 'debug'];
        for (const level of levels) {
            const original = console[level];
            console[level] = (...args) => {
                // Still call original
                original.apply(console, args);
                // Record for time travel
                const currentSnapshot = this.getCurrentSnapshot();
                if (currentSnapshot) {
                    currentSnapshot.consoleLogs = currentSnapshot.consoleLogs || [];
                    currentSnapshot.consoleLogs.push({
                        level,
                        message: args.map(a => String(a)).join(' '),
                        timestamp: Date.now(),
                        args
                    });
                }
            };
        }
    }
    // Persistence
    persistIfEnabled() {
        if (!this.config.persist)
            return;
        try {
            const data = this.exportSession();
            localStorage.setItem(this.config.storageKey, data);
        }
        catch (error) {
            console.warn('Failed to persist time travel state:', error);
        }
    }
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (data) {
                this.importSession(data);
            }
        }
        catch (error) {
            console.warn('Failed to load time travel state:', error);
        }
    }
    // Utilities
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    compress(data) {
        // Simple base64 encoding as placeholder
        // In production, use proper compression like lz-string
        if (typeof btoa !== 'undefined') {
            return btoa(encodeURIComponent(data));
        }
        return data;
    }
    decompress(data) {
        if (typeof atob !== 'undefined') {
            try {
                return decodeURIComponent(atob(data));
            }
            catch {
                return data;
            }
        }
        return data;
    }
}
// ============================================================================
// React-like Hooks
// ============================================================================
let globalEngine = null;
export function initTimeTravel(config) {
    globalEngine = new TimeTravelEngine(config);
    return globalEngine;
}
export function getTimeTravelEngine() {
    return globalEngine;
}
export function useTimeTravel() {
    const engine = globalEngine;
    return {
        record: (action) => engine?.record(action),
        stepBack: () => engine?.stepBack() || false,
        stepForward: () => engine?.stepForward() || false,
        goTo: (index) => engine?.goTo(index) || false,
        getCurrentSnapshot: () => engine?.getCurrentSnapshot() || null,
        getSnapshotCount: () => engine?.getSnapshotCount() || 0,
        isRecording: engine?.getState().isRecording || false,
        currentIndex: engine?.getState().currentIndex || -1
    };
}
export function useTimeTravelState(key, initialValue) {
    let value = initialValue;
    const setter = (newValue) => {
        value = newValue;
        globalEngine?.record({ type: 'SET_STATE', payload: { key, value: newValue }, source: key });
    };
    globalEngine?.registerState(key, () => value, setter);
    return [value, setter];
}
export function useStateDiff(fromIndex, toIndex) {
    return globalEngine?.getDiff(fromIndex, toIndex) || [];
}
// ============================================================================
// Additional Exports
// ============================================================================
export { deepEqual };
//# sourceMappingURL=index.js.map