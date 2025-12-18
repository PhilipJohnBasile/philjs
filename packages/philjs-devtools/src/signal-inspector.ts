/**
 * Signal Inspection Utilities
 *
 * Provides tools for inspecting and debugging PhilJS signals:
 * - Signal value tracking and history
 * - Dependency graph visualization
 * - Signal subscription monitoring
 * - Signal performance metrics
 */

import type { Signal } from "philjs-core";

// ============================================================================
// Types
// ============================================================================

export type SignalMetadata = {
  id: string;
  name: string;
  value: any;
  type: "signal" | "memo" | "linkedSignal" | "resource";
  createdAt: number;
  lastUpdated: number;
  updateCount: number;
  subscribers: number;
  dependencies: string[];
};

export type SignalUpdate = {
  signalId: string;
  timestamp: number;
  oldValue: any;
  newValue: any;
  stackTrace?: string;
};

export type SignalDependencyGraph = {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
};

export type SignalInspectorConfig = {
  maxHistorySize?: number; // Max updates to track per signal (default 50)
  captureStackTraces?: boolean; // Capture stack traces on updates (default false)
  trackDependencies?: boolean; // Track dependency relationships (default true)
};

// ============================================================================
// Signal Inspector
// ============================================================================

export class SignalInspector {
  private signals = new Map<string, SignalMetadata>();
  private updates = new Map<string, SignalUpdate[]>();
  private config: Required<SignalInspectorConfig>;
  private idCounter = 0;

  constructor(config: SignalInspectorConfig = {}) {
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 50,
      captureStackTraces: config.captureStackTraces ?? false,
      trackDependencies: config.trackDependencies ?? true,
    };
  }

  /**
   * Register a signal for inspection
   */
  public register<T>(
    sig: Signal<T>,
    name: string,
    type: SignalMetadata["type"] = "signal"
  ): string {
    const id = `signal-${this.idCounter++}`;

    this.signals.set(id, {
      id,
      name,
      value: sig(),
      type,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      updateCount: 0,
      subscribers: 0,
      dependencies: [],
    });

    // Wrap the signal's set method to track updates
    this.wrapSignal(sig, id);

    return id;
  }

  /**
   * Unregister a signal
   */
  public unregister(signalId: string): void {
    this.signals.delete(signalId);
    this.updates.delete(signalId);
  }

  /**
   * Get metadata for a signal
   */
  public getMetadata(signalId: string): SignalMetadata | undefined {
    return this.signals.get(signalId);
  }

  /**
   * Get all registered signals
   */
  public getAllSignals(): SignalMetadata[] {
    return Array.from(this.signals.values());
  }

  /**
   * Get update history for a signal
   */
  public getUpdateHistory(signalId: string): SignalUpdate[] {
    return this.updates.get(signalId) || [];
  }

  /**
   * Get current value of a signal
   */
  public getValue(signalId: string): any {
    const metadata = this.signals.get(signalId);
    return metadata?.value;
  }

  /**
   * Track a dependency relationship between signals
   */
  public trackDependency(dependentId: string, dependencyId: string): void {
    if (!this.config.trackDependencies) return;

    const dependent = this.signals.get(dependentId);
    if (dependent && !dependent.dependencies.includes(dependencyId)) {
      dependent.dependencies.push(dependencyId);
    }
  }

  /**
   * Get dependency graph for all signals
   */
  public getDependencyGraph(): SignalDependencyGraph {
    const nodes = Array.from(this.signals.values()).map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
    }));

    const edges: Array<{ from: string; to: string }> = [];

    for (const signal of this.signals.values()) {
      for (const depId of signal.dependencies) {
        edges.push({
          from: signal.id,
          to: depId,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get signals that depend on a given signal
   */
  public getDependents(signalId: string): SignalMetadata[] {
    const dependents: SignalMetadata[] = [];

    for (const signal of this.signals.values()) {
      if (signal.dependencies.includes(signalId)) {
        dependents.push(signal);
      }
    }

    return dependents;
  }

  /**
   * Get signals that a given signal depends on
   */
  public getDependencies(signalId: string): SignalMetadata[] {
    const signal = this.signals.get(signalId);
    if (!signal) return [];

    return signal.dependencies
      .map((id) => this.signals.get(id))
      .filter((s): s is SignalMetadata => s !== undefined);
  }

  /**
   * Get performance metrics for a signal
   */
  public getMetrics(signalId: string): {
    updateCount: number;
    averageUpdateInterval: number;
    lastUpdateTime: number;
    totalLifetime: number;
  } | null {
    const metadata = this.signals.get(signalId);
    const updates = this.updates.get(signalId) || [];

    if (!metadata) return null;

    const now = Date.now();
    const totalLifetime = now - metadata.createdAt;

    let averageUpdateInterval = 0;
    if (updates.length > 1) {
      const intervals = [];
      for (let i = 1; i < updates.length; i++) {
        intervals.push(updates[i].timestamp - updates[i - 1].timestamp);
      }
      averageUpdateInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      updateCount: metadata.updateCount,
      averageUpdateInterval,
      lastUpdateTime: metadata.lastUpdated,
      totalLifetime,
    };
  }

  /**
   * Clear all tracked data
   */
  public clear(): void {
    this.signals.clear();
    this.updates.clear();
    this.idCounter = 0;
  }

  /**
   * Export inspector state as JSON
   */
  public export(): string {
    return JSON.stringify({
      signals: Array.from(this.signals.entries()),
      updates: Array.from(this.updates.entries()),
      exportedAt: new Date().toISOString(),
    });
  }

  /**
   * Import inspector state from JSON
   */
  public import(json: string): void {
    try {
      const data = JSON.parse(json);
      this.signals = new Map(data.signals);
      this.updates = new Map(data.updates);
    } catch (error) {
      console.error("Failed to import inspector state:", error);
    }
  }

  // Private methods

  private wrapSignal<T>(sig: Signal<T>, id: string): void {
    const originalSet = sig.set;
    const inspector = this;

    sig.set = function (next: T | ((prev: T) => T)) {
      const oldValue = sig();
      originalSet.call(sig, next);
      const newValue = sig();

      inspector.recordUpdate(id, oldValue, newValue);
    };
  }

  private recordUpdate(signalId: string, oldValue: any, newValue: any): void {
    const metadata = this.signals.get(signalId);
    if (!metadata) return;

    // Update metadata
    metadata.value = newValue;
    metadata.lastUpdated = Date.now();
    metadata.updateCount++;

    // Record update
    const update: SignalUpdate = {
      signalId,
      timestamp: Date.now(),
      oldValue,
      newValue,
    };

    if (this.config.captureStackTraces) {
      try {
        throw new Error();
      } catch (e) {
        update.stackTrace = (e as Error).stack;
      }
    }

    const history = this.updates.get(signalId) || [];
    history.push(update);

    // Maintain max size
    if (history.length > this.config.maxHistorySize) {
      history.shift();
    }

    this.updates.set(signalId, history);
  }
}

// ============================================================================
// Global Instance & Utilities
// ============================================================================

let globalInspector: SignalInspector | null = null;

export function initSignalInspector(
  config?: SignalInspectorConfig
): SignalInspector {
  if (!globalInspector) {
    globalInspector = new SignalInspector(config);
  }
  return globalInspector;
}

export function getSignalInspector(): SignalInspector | null {
  return globalInspector;
}

/**
 * Create an inspectable signal wrapper
 */
export function inspectSignal<T>(
  sig: Signal<T>,
  name: string,
  type: SignalMetadata["type"] = "signal"
): Signal<T> {
  const inspector = getSignalInspector();
  if (inspector) {
    inspector.register(sig, name, type);
  }
  return sig;
}

/**
 * Format signal value for display
 */
export function formatSignalValue(value: any, maxLength = 100): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "function") {
    return "[Function]";
  }

  if (typeof value === "object") {
    const json = JSON.stringify(value, null, 2);
    if (json.length > maxLength) {
      return json.slice(0, maxLength) + "...";
    }
    return json;
  }

  const str = String(value);
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + "...";
  }
  return str;
}

/**
 * Compare two signal values and determine if they are different
 */
export function signalValuesChanged(oldValue: any, newValue: any): boolean {
  // Reference equality for objects
  if (typeof oldValue === "object" && typeof newValue === "object") {
    return oldValue !== newValue;
  }

  // Value equality for primitives
  return oldValue !== newValue;
}
