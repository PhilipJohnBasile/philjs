/**
 * PhilJS Testing - Snapshot Testing Utilities
 */
import { prettyDOM } from './debug.js';
/**
 * Take a snapshot of a DOM element
 */
export function takeSnapshot(element, options = {}) {
    const { maxLength = 10000, includeSignals = true, serializer } = options;
    if (!element) {
        element = document.body;
    }
    let snapshot;
    if (serializer) {
        snapshot = serializer(element);
    }
    else {
        snapshot = prettyDOM(element, maxLength) || '';
        if (includeSignals) {
            const signalData = extractSignalData(element);
            if (signalData.length > 0) {
                snapshot += '\n\n<!-- Signal State -->\n';
                signalData.forEach(({ name, value }) => {
                    snapshot += `<!-- ${name}: ${value} -->\n`;
                });
            }
        }
    }
    return {
        snapshot,
        toMatch(expected) {
            return normalizeSnapshot(snapshot) === normalizeSnapshot(expected);
        },
        diff(expected) {
            return computeDiff(normalizeSnapshot(snapshot), normalizeSnapshot(expected));
        },
    };
}
/**
 * Extract signal data from DOM
 */
function extractSignalData(element) {
    const signals = [];
    const signalElements = element.querySelectorAll('[data-signal]');
    signalElements.forEach((el) => {
        const name = el.getAttribute('data-signal') || 'unknown';
        const value = el.textContent || '';
        signals.push({ name, value });
    });
    return signals;
}
/**
 * Normalize snapshot for comparison
 */
function normalizeSnapshot(snapshot) {
    return snapshot
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\s+$/gm, '')
        .replace(/^\s+$/gm, '');
}
/**
 * Compute diff between two snapshots
 */
function computeDiff(actual, expected) {
    const actualLines = actual.split('\n');
    const expectedLines = expected.split('\n');
    const maxLines = Math.max(actualLines.length, expectedLines.length);
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
        const actualLine = actualLines[i] || '';
        const expectedLine = expectedLines[i] || '';
        if (actualLine !== expectedLine) {
            diff.push(`Line ${i + 1}:`);
            if (expectedLine) {
                diff.push(`  - ${expectedLine}`);
            }
            else {
                diff.push(`  - (missing)`);
            }
            if (actualLine) {
                diff.push(`  + ${actualLine}`);
            }
            else {
                diff.push(`  + (extra)`);
            }
        }
    }
    return diff.join('\n');
}
/**
 * Snapshot matcher for testing frameworks
 */
export class SnapshotMatcher {
    snapshots = new Map();
    updateMode = false;
    constructor(options = {}) {
        this.updateMode = options.updateMode || false;
    }
    /**
     * Match a snapshot by name
     */
    matchSnapshot(name, element, options) {
        const result = takeSnapshot(element, options);
        if (this.updateMode) {
            // Update mode - save the snapshot
            this.snapshots.set(name, result.snapshot);
            return;
        }
        const existingSnapshot = this.snapshots.get(name);
        if (!existingSnapshot) {
            // First time - save it
            this.snapshots.set(name, result.snapshot);
            return;
        }
        // Compare
        if (!result.toMatch(existingSnapshot)) {
            const diff = result.diff(existingSnapshot);
            throw new Error(`Snapshot mismatch for "${name}"\n\n${diff}\n\n` +
                `Run with UPDATE_SNAPSHOTS=true to update snapshots.`);
        }
    }
    /**
     * Get all snapshots
     */
    getSnapshots() {
        return Object.fromEntries(this.snapshots);
    }
    /**
     * Load snapshots from data
     */
    loadSnapshots(data) {
        this.snapshots = new Map(Object.entries(data));
    }
    /**
     * Clear all snapshots
     */
    clear() {
        this.snapshots.clear();
    }
}
/**
 * Create a snapshot matcher instance
 */
export function createSnapshotMatcher(options) {
    return new SnapshotMatcher(options);
}
/**
 * Snapshot a component's state
 */
export function snapshotSignalState(signals) {
    const state = {};
    for (const [name, signal] of Object.entries(signals)) {
        state[name] = signal.get();
    }
    return JSON.stringify(state, null, 2);
}
/**
 * Compare signal state snapshots
 */
export function compareSignalSnapshots(actual, expected) {
    const actualState = {};
    for (const [name, signal] of Object.entries(actual)) {
        actualState[name] = signal.get();
    }
    const differences = [];
    // Check all keys in expected
    for (const key of Object.keys(expected)) {
        if (!(key in actualState)) {
            differences.push(`Missing signal: ${key}`);
        }
        else if (actualState[key] !== expected[key]) {
            differences.push(`Signal "${key}" mismatch:\n` +
                `  Expected: ${JSON.stringify(expected[key])}\n` +
                `  Actual: ${JSON.stringify(actualState[key])}`);
        }
    }
    // Check for extra keys in actual
    for (const key of Object.keys(actualState)) {
        if (!(key in expected)) {
            differences.push(`Extra signal: ${key} = ${JSON.stringify(actualState[key])}`);
        }
    }
    return {
        match: differences.length === 0,
        diff: differences.join('\n\n'),
    };
}
//# sourceMappingURL=snapshot.js.map