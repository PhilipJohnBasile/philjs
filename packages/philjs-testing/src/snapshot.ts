/**
 * PhilJS Testing - Snapshot Testing Utilities
 */

import { prettyDOM } from './debug.js';

export interface SnapshotOptions {
  /**
   * Maximum number of characters to include in snapshot
   */
  maxLength?: number;
  /**
   * Whether to include signal values in snapshot
   */
  includeSignals?: boolean;
  /**
   * Custom serializer function
   */
  serializer?: (element: Element) => string;
}

export interface SnapshotResult {
  /**
   * The snapshot string
   */
  snapshot: string;
  /**
   * Match against expected snapshot
   */
  toMatch(expected: string): boolean;
  /**
   * Get differences from expected
   */
  diff(expected: string): string;
}

/**
 * Take a snapshot of a DOM element
 */
export function takeSnapshot(
  element: Element | null,
  options: SnapshotOptions = {}
): SnapshotResult {
  const { maxLength = 10000, includeSignals = true, serializer } = options;

  const target = element ?? document.body;
  const isBody = target === document.body;

  let snapshot: string;

  if (serializer) {
    snapshot = serializer(target);
  } else {
    snapshot = isBody ? target.innerHTML : (prettyDOM(target, maxLength) || '');
    if (snapshot.length > maxLength) {
      snapshot = `${snapshot.slice(0, maxLength)}...`;
    }

    if (includeSignals) {
      const signalData = extractSignalData(target);
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
    toMatch(expected: string): boolean {
      return normalizeSnapshot(snapshot) === normalizeSnapshot(expected);
    },
    diff(expected: string): string {
      return computeDiff(normalizeSnapshot(snapshot), normalizeSnapshot(expected));
    },
  };
}

/**
 * Extract signal data from DOM
 */
function extractSignalData(element: Element): Array<{ name: string; value: string }> {
  const signals: Array<{ name: string; value: string }> = [];
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
function normalizeSnapshot(snapshot: string): string {
  return snapshot
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/gm, '')
    .replace(/^\s+$/gm, '');
}

/**
 * Compute diff between two snapshots
 */
function computeDiff(actual: string, expected: string): string {
  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');

  const maxLines = Math.max(actualLines.length, expectedLines.length);
  const diff: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const actualLine = actualLines[i] || '';
    const expectedLine = expectedLines[i] || '';

    if (actualLine !== expectedLine) {
      diff.push(`Line ${i + 1}:`);
      if (expectedLine) {
        diff.push(`  - ${expectedLine}`);
      } else {
        diff.push(`  - (missing)`);
      }
      if (actualLine) {
        diff.push(`  + ${actualLine}`);
      } else {
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
  private snapshots: Map<string, string> = new Map();
  private updateMode: boolean = false;

  constructor(options: { updateMode?: boolean } = {}) {
    this.updateMode = options.updateMode || false;
  }

  /**
   * Match a snapshot by name
   */
  matchSnapshot(name: string, element: Element | null, options?: SnapshotOptions): void {
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
      throw new Error(
        `Snapshot mismatch for "${name}"\n\n${diff}\n\n` +
        `Run with UPDATE_SNAPSHOTS=true to update snapshots.`
      );
    }
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): Record<string, string> {
    return Object.fromEntries(this.snapshots);
  }

  /**
   * Load snapshots from data
   */
  loadSnapshots(data: Record<string, string>): void {
    this.snapshots = new Map(Object.entries(data));
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
  }
}

/**
 * Create a snapshot matcher instance
 */
export function createSnapshotMatcher(options?: { updateMode?: boolean }): SnapshotMatcher {
  return new SnapshotMatcher(options);
}

/**
 * Snapshot a component's state
 */
export function snapshotSignalState(signals: Record<string, { get(): any }>): string {
  const state: Record<string, any> = {};

  for (const [name, signal] of Object.entries(signals)) {
    state[name] = signal.get();
  }

  return JSON.stringify(state, null, 2);
}

/**
 * Compare signal state snapshots
 */
export function compareSignalSnapshots(
  actual: Record<string, { get(): any }>,
  expected: Record<string, any>
): { match: boolean; diff: string } {
  const actualState: Record<string, any> = {};

  for (const [name, signal] of Object.entries(actual)) {
    actualState[name] = signal.get();
  }

  const differences: string[] = [];

  // Check all keys in expected
  for (const key of Object.keys(expected)) {
    if (!(key in actualState)) {
      differences.push(`Missing signal: ${key}`);
    } else if (actualState[key] !== expected[key]) {
      differences.push(
        `Signal "${key}" mismatch:\n` +
        `  Expected: ${JSON.stringify(expected[key])}\n` +
        `  Actual: ${JSON.stringify(actualState[key])}`
      );
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
