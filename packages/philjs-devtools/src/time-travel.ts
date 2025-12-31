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

import { signal, type Signal } from "@philjs/core";

export type StateSnapshot<T = any> = {
  id: string;
  timestamp: number;
  state: T;
  action?: string;
  metadata?: Record<string, any>;
  parentId?: string; // For branching
};

export type TimelineNode<T = any> = {
  snapshot: StateSnapshot<T>;
  children: TimelineNode<T>[];
  parent?: TimelineNode<T>;
};

export type TimeTravelConfig = {
  maxSnapshots?: number; // Max history size (default 100)
  captureInterval?: number; // Min ms between snapshots (default 0)
  enableBranching?: boolean; // Allow timeline branching (default true)
  captureActions?: boolean; // Track action names (default true)
};

// ============================================================================
// State Diff
// ============================================================================

export type DiffType = "added" | "removed" | "modified" | "unchanged";

export type StateDiff = {
  path: string[];
  type: DiffType;
  oldValue?: any;
  newValue?: any;
};

/**
 * Calculate diff between two states
 */
export function diffState(
  oldState: any,
  newState: any,
  path: string[] = []
): StateDiff[] {
  const diffs: StateDiff[] = [];

  // Handle primitives
  if (
    typeof oldState !== "object" ||
    typeof newState !== "object" ||
    oldState === null ||
    newState === null
  ) {
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
      } else if (i >= newState.length) {
        diffs.push({
          path: [...path, String(i)],
          type: "removed",
          oldValue: oldState[i],
        });
      } else {
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
    } else if (!(key in newState)) {
      diffs.push({
        path: [...path, key],
        type: "removed",
        oldValue: oldState[key],
      });
    } else {
      diffs.push(...diffState(oldState[key], newState[key], [...path, key]));
    }
  }

  return diffs;
}

// ============================================================================
// Time Travel Debugger
// ============================================================================

export class TimeTravelDebugger<T = any> {
  private history: StateSnapshot<T>[] = [];
  private timeline: TimelineNode<T> | null = null;
  private currentNode: TimelineNode<T> | null = null;
  private currentIndex = signal<number>(-1);
  private lastCaptureTime = 0;
  private config: Required<TimeTravelConfig>;

  public isTimeTraveling = signal<boolean>(false);
  public canUndo = signal<boolean>(false);
  public canRedo = signal<boolean>(false);

  constructor(config: TimeTravelConfig = {}) {
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
  public capture(
    state: T,
    action?: string,
    metadata?: Record<string, any>
  ): void {
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

    const snapshot: StateSnapshot<T> = {
      id: `snapshot-${now}-${Math.random().toString(36).slice(2)}`,
      timestamp: now,
      state: this.cloneState(state),
    };
    if (this.config.captureActions && action !== undefined) {
      snapshot.action = action;
    }
    if (metadata !== undefined) {
      snapshot.metadata = metadata;
    }

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
    } else if (this.config.enableBranching && this.currentNode) {
      // Check if we're branching from a past state
      if (
        this.currentIndex() >= 0 &&
        this.currentIndex() < this.history.length - 1
      ) {
        // Create branch
        snapshot.parentId = this.currentNode.snapshot.id;
        const branchNode: TimelineNode<T> = {
          snapshot,
          children: [],
          parent: this.currentNode,
        };
        this.currentNode.children.push(branchNode);
        this.currentNode = branchNode;
      } else {
        // Linear progression
        const newNode: TimelineNode<T> = {
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
  public undo(): StateSnapshot<T> | null {
    if (!this.canUndo()) return null;

    this.isTimeTraveling.set(true);
    const newIndex = this.currentIndex() - 1;
    this.currentIndex.set(newIndex);
    this.updateNavigation();

    // Move to parent node in timeline
    if (this.currentNode?.parent) {
      this.currentNode = this.currentNode.parent;
    }

    return this.history[newIndex] ?? null;
  }

  /**
   * Go forward in time (redo)
   */
  public redo(): StateSnapshot<T> | null {
    if (!this.canRedo()) return null;

    this.isTimeTraveling.set(true);
    const newIndex = this.currentIndex() + 1;
    this.currentIndex.set(newIndex);
    this.updateNavigation();

    // Move to first child in timeline (if exists)
    if (this.currentNode && this.currentNode.children.length > 0) {
      this.currentNode = this.currentNode.children[0] ?? null;
    }

    return this.history[newIndex] ?? null;
  }

  /**
   * Jump to specific snapshot
   */
  public jumpTo(snapshotId: string): StateSnapshot<T> | null {
    const index = this.history.findIndex((s) => s.id === snapshotId);
    if (index === -1) return null;

    this.isTimeTraveling.set(true);
    this.currentIndex.set(index);
    this.updateNavigation();

    // Find node in timeline
    this.currentNode = this.findNodeById(this.timeline!, snapshotId) ?? null;

    return this.history[index] ?? null;
  }

  /**
   * Get current snapshot
   */
  public getCurrent(): StateSnapshot<T> | null {
    const index = this.currentIndex();
    if (index < 0 || index >= this.history.length) return null;
    return this.history[index] ?? null;
  }

  /**
   * Get all snapshots
   */
  public getHistory(): StateSnapshot<T>[] {
    return this.history.slice();
  }

  /**
   * Get timeline tree
   */
  public getTimeline(): TimelineNode<T> | null {
    return this.timeline;
  }

  /**
   * Get diff between two snapshots
   */
  public getDiff(fromId: string, toId: string): StateDiff[] {
    const from = this.history.find((s) => s.id === fromId);
    const to = this.history.find((s) => s.id === toId);

    if (!from || !to) return [];

    return diffState(from.state, to.state);
  }

  /**
   * Stop time traveling (return to present)
   */
  public stopTimeTraveling(): void {
    this.isTimeTraveling.set(false);
    this.currentIndex.set(this.history.length - 1);
    const lastSnapshot = this.history[this.history.length - 1];
    this.currentNode = lastSnapshot
      ? this.findNodeById(this.timeline!, lastSnapshot.id)
      : null;
    this.updateNavigation();
  }

  /**
   * Clear history
   */
  public clear(): void {
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
  public exportSession(): string {
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
  public importSession(json: string): void {
    try {
      const data = JSON.parse(json);
      this.history = data.history || [];
      this.currentIndex.set(data.currentIndex ?? -1);

      // Rebuild timeline from history
      this.rebuildTimeline();

      this.updateNavigation();
    } catch (error) {
      console.error("Failed to import session:", error);
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    const firstSnapshot = this.history[0];
    const lastSnapshot = this.history[this.history.length - 1];
    return {
      totalSnapshots: this.history.length,
      currentIndex: this.currentIndex(),
      timeRange:
        this.history.length > 0 && firstSnapshot && lastSnapshot
          ? {
              start: new Date(firstSnapshot.timestamp),
              end: new Date(lastSnapshot.timestamp),
            }
          : null,
      branches: this.countBranches(this.timeline),
    };
  }

  // Private methods

  private cloneState(state: T): T {
    // ES2024: structuredClone() is faster and handles more types than JSON
    return structuredClone(state);
  }

  private updateNavigation(): void {
    const current = this.currentIndex();
    this.canUndo.set(current > 0);
    this.canRedo.set(current < this.history.length - 1);
  }

  private findNodeById(
    node: TimelineNode<T>,
    id: string
  ): TimelineNode<T> | null {
    if (node.snapshot.id === id) return node;

    for (const child of node.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }

    return null;
  }

  private rebuildTimeline(): void {
    if (this.history.length === 0) return;

    const firstSnapshot = this.history[0];
    if (!firstSnapshot) return;

    // Build timeline from parent relationships
    this.timeline = {
      snapshot: firstSnapshot,
      children: [],
    };

    let currentNode: TimelineNode<T> = this.timeline;

    for (let i = 1; i < this.history.length; i++) {
      const snapshot = this.history[i];
      if (!snapshot) continue;
      const newNode: TimelineNode<T> = {
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
      } else {
        // Linear progression
        currentNode.children.push(newNode);
        currentNode = newNode;
      }
    }

    this.currentNode = currentNode;
  }

  private countBranches(node: TimelineNode<T> | null): number {
    if (!node) return 0;

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

let globalDebugger: TimeTravelDebugger<any> | null = null;

export function initTimeTravel<T>(
  config?: TimeTravelConfig
): TimeTravelDebugger<T> {
  if (!globalDebugger) {
    globalDebugger = new TimeTravelDebugger<T>(config);
  }
  return globalDebugger as TimeTravelDebugger<T>;
}

export function getTimeTravelDebugger<T>(): TimeTravelDebugger<T> | null {
  return globalDebugger as TimeTravelDebugger<T> | null;
}

// ============================================================================
// Integration with Signals
// ============================================================================

export function debugSignal<T>(
  sig: Signal<T>,
  name: string,
  timeTravelDebugger?: TimeTravelDebugger<any>
): Signal<T> {
  const ttd = timeTravelDebugger || getTimeTravelDebugger();

  if (!ttd) return sig;

  // Intercept set operations
  const originalSet = sig.set;

  sig.set = (next: T | ((prev: T) => T)) => {
    const oldValue = sig();
    originalSet.call(sig, next);
    const newValue = sig();

    // Capture state change
    ttd.capture(
      { [name]: newValue },
      `set ${name}`,
      { oldValue, newValue }
    );
  };

  return sig;
}
