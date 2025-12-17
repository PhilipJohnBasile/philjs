/**
 * Time-Travel Debugging System
 *
 * Provides:
 * - State history tracking with snapshots
 * - Time-travel navigation (undo/redo)
 * - Timeline branching (explore "what if" scenarios)
 * - State diffing and visualization
 * - Export/import sessions for bug reports
 */
import { signal } from "philjs-core";
/**
 * Calculate diff between two states
 */
export function diffState(oldState, newState, path = []) {
    const diffs = [];
    // Handle primitives
    if (typeof oldState !== "object" ||
        typeof newState !== "object" ||
        oldState === null ||
        newState === null) {
        if (oldState !== newState) {
            diffs.push({
                path,
                type: "modified",
                oldValue: oldState,
                newValue: newState,
            });
        }
        return diffs;
    }
    // Handle arrays
    if (Array.isArray(oldState) && Array.isArray(newState)) {
        const maxLength = Math.max(oldState.length, newState.length);
        for (let i = 0; i < maxLength; i++) {
            if (i >= oldState.length) {
                diffs.push({
                    path: [...path, String(i)],
                    type: "added",
                    newValue: newState[i],
                });
            }
            else if (i >= newState.length) {
                diffs.push({
                    path: [...path, String(i)],
                    type: "removed",
                    oldValue: oldState[i],
                });
            }
            else {
                diffs.push(...diffState(oldState[i], newState[i], [...path, String(i)]));
            }
        }
        return diffs;
    }
    // Handle objects
    const allKeys = new Set([
        ...Object.keys(oldState),
        ...Object.keys(newState),
    ]);
    for (const key of allKeys) {
        if (!(key in oldState)) {
            diffs.push({
                path: [...path, key],
                type: "added",
                newValue: newState[key],
            });
        }
        else if (!(key in newState)) {
            diffs.push({
                path: [...path, key],
                type: "removed",
                oldValue: oldState[key],
            });
        }
        else {
            diffs.push(...diffState(oldState[key], newState[key], [...path, key]));
        }
    }
    return diffs;
}
// ============================================================================
// Time Travel Debugger
// ============================================================================
export class TimeTravelDebugger {
    history = [];
    timeline = null;
    currentNode = null;
    currentIndex = signal(-1);
    lastCaptureTime = 0;
    config;
    isTimeTraveling = signal(false);
    canUndo = signal(false);
    canRedo = signal(false);
    constructor(config = {}) {
        this.config = {
            maxSnapshots: config.maxSnapshots ?? 100,
            captureInterval: config.captureInterval ?? 0,
            enableBranching: config.enableBranching ?? true,
            captureActions: config.captureActions ?? true,
        };
    }
    /**
     * Capture current state snapshot
     */
    capture(state, action, metadata) {
        const now = Date.now();
        // Respect capture interval
        if (now - this.lastCaptureTime < this.config.captureInterval) {
            return;
        }
        this.lastCaptureTime = now;
        // Don't capture during time travel
        if (this.isTimeTraveling()) {
            return;
        }
        const snapshot = {
            id: `snapshot-${now}-${Math.random().toString(36).slice(2)}`,
            timestamp: now,
            state: this.cloneState(state),
            action: this.config.captureActions ? action : undefined,
            metadata,
        };
        // Add to linear history
        this.history.push(snapshot);
        // Maintain max size
        if (this.history.length > this.config.maxSnapshots) {
            this.history.shift();
        }
        // Build timeline tree
        if (!this.timeline) {
            this.timeline = {
                snapshot,
                children: [],
            };
            this.currentNode = this.timeline;
        }
        else if (this.config.enableBranching && this.currentNode) {
            // Check if we're branching from a past state
            if (this.currentIndex() >= 0 &&
                this.currentIndex() < this.history.length - 1) {
                // Create branch
                snapshot.parentId = this.currentNode.snapshot.id;
                const branchNode = {
                    snapshot,
                    children: [],
                    parent: this.currentNode,
                };
                this.currentNode.children.push(branchNode);
                this.currentNode = branchNode;
            }
            else {
                // Linear progression
                const newNode = {
                    snapshot,
                    children: [],
                    parent: this.currentNode,
                };
                this.currentNode.children.push(newNode);
                this.currentNode = newNode;
            }
        }
        this.currentIndex.set(this.history.length - 1);
        this.updateNavigation();
    }
    /**
     * Go back in time (undo)
     */
    undo() {
        if (!this.canUndo())
            return null;
        this.isTimeTraveling.set(true);
        const newIndex = this.currentIndex() - 1;
        this.currentIndex.set(newIndex);
        this.updateNavigation();
        // Move to parent node in timeline
        if (this.currentNode?.parent) {
            this.currentNode = this.currentNode.parent;
        }
        return this.history[newIndex];
    }
    /**
     * Go forward in time (redo)
     */
    redo() {
        if (!this.canRedo())
            return null;
        this.isTimeTraveling.set(true);
        const newIndex = this.currentIndex() + 1;
        this.currentIndex.set(newIndex);
        this.updateNavigation();
        // Move to first child in timeline (if exists)
        if (this.currentNode && this.currentNode.children.length > 0) {
            this.currentNode = this.currentNode.children[0];
        }
        return this.history[newIndex];
    }
    /**
     * Jump to specific snapshot
     */
    jumpTo(snapshotId) {
        const index = this.history.findIndex((s) => s.id === snapshotId);
        if (index === -1)
            return null;
        this.isTimeTraveling.set(true);
        this.currentIndex.set(index);
        this.updateNavigation();
        // Find node in timeline
        this.currentNode = this.findNodeById(this.timeline, snapshotId);
        return this.history[index];
    }
    /**
     * Get current snapshot
     */
    getCurrent() {
        const index = this.currentIndex();
        if (index < 0 || index >= this.history.length)
            return null;
        return this.history[index];
    }
    /**
     * Get all snapshots
     */
    getHistory() {
        return this.history.slice();
    }
    /**
     * Get timeline tree
     */
    getTimeline() {
        return this.timeline;
    }
    /**
     * Get diff between two snapshots
     */
    getDiff(fromId, toId) {
        const from = this.history.find((s) => s.id === fromId);
        const to = this.history.find((s) => s.id === toId);
        if (!from || !to)
            return [];
        return diffState(from.state, to.state);
    }
    /**
     * Stop time traveling (return to present)
     */
    stopTimeTraveling() {
        this.isTimeTraveling.set(false);
        this.currentIndex.set(this.history.length - 1);
        this.currentNode = this.findNodeById(this.timeline, this.history[this.history.length - 1].id);
        this.updateNavigation();
    }
    /**
     * Clear history
     */
    clear() {
        this.history = [];
        this.timeline = null;
        this.currentNode = null;
        this.currentIndex.set(-1);
        this.isTimeTraveling.set(false);
        this.updateNavigation();
    }
    /**
     * Export session for bug reports
     */
    exportSession() {
        return JSON.stringify({
            history: this.history,
            currentIndex: this.currentIndex(),
            config: this.config,
            exportedAt: new Date().toISOString(),
        });
    }
    /**
     * Import session from JSON
     */
    importSession(json) {
        try {
            const data = JSON.parse(json);
            this.history = data.history || [];
            this.currentIndex.set(data.currentIndex ?? -1);
            // Rebuild timeline from history
            this.rebuildTimeline();
            this.updateNavigation();
        }
        catch (error) {
            console.error("Failed to import session:", error);
        }
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalSnapshots: this.history.length,
            currentIndex: this.currentIndex(),
            timeRange: this.history.length > 0
                ? {
                    start: new Date(this.history[0].timestamp),
                    end: new Date(this.history[this.history.length - 1].timestamp),
                }
                : null,
            branches: this.countBranches(this.timeline),
        };
    }
    // Private methods
    cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }
    updateNavigation() {
        const current = this.currentIndex();
        this.canUndo.set(current > 0);
        this.canRedo.set(current < this.history.length - 1);
    }
    findNodeById(node, id) {
        if (node.snapshot.id === id)
            return node;
        for (const child of node.children) {
            const found = this.findNodeById(child, id);
            if (found)
                return found;
        }
        return null;
    }
    rebuildTimeline() {
        if (this.history.length === 0)
            return;
        // Build timeline from parent relationships
        this.timeline = {
            snapshot: this.history[0],
            children: [],
        };
        let currentNode = this.timeline;
        for (let i = 1; i < this.history.length; i++) {
            const snapshot = this.history[i];
            const newNode = {
                snapshot,
                children: [],
                parent: currentNode,
            };
            if (snapshot.parentId && snapshot.parentId !== currentNode.snapshot.id) {
                // Find parent and create branch
                const parent = this.findNodeById(this.timeline, snapshot.parentId);
                if (parent) {
                    newNode.parent = parent;
                    parent.children.push(newNode);
                }
            }
            else {
                // Linear progression
                currentNode.children.push(newNode);
                currentNode = newNode;
            }
        }
        this.currentNode = currentNode;
    }
    countBranches(node) {
        if (!node)
            return 0;
        let count = node.children.length > 1 ? 1 : 0;
        for (const child of node.children) {
            count += this.countBranches(child);
        }
        return count;
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalDebugger = null;
export function initTimeTravel(config) {
    if (!globalDebugger) {
        globalDebugger = new TimeTravelDebugger(config);
    }
    return globalDebugger;
}
export function getTimeTravelDebugger() {
    return globalDebugger;
}
// ============================================================================
// Integration with Signals
// ============================================================================
export function debugSignal(sig, name, timeTravelDebugger) {
    const ttd = timeTravelDebugger || getTimeTravelDebugger();
    if (!ttd)
        return sig;
    // Intercept set operations
    const originalSet = sig.set;
    sig.set = (next) => {
        const oldValue = sig();
        originalSet.call(sig, next);
        const newValue = sig();
        // Capture state change
        ttd.capture({ [name]: newValue }, `set ${name}`, { oldValue, newValue });
    };
    return sig;
}
//# sourceMappingURL=time-travel.js.map