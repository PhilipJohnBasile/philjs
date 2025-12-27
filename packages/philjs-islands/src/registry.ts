/**
 * Island Registry - Central registry for island components
 */

import type { IslandConfig, IslandInstance, RegistryEntry } from './types.js';

/**
 * Global registry for island components
 */
export class IslandRegistry {
  private _entries = new Map<string, RegistryEntry>();
  private static _instance: IslandRegistry | null = null;

  static getInstance(): IslandRegistry {
    if (!IslandRegistry._instance) {
      IslandRegistry._instance = new IslandRegistry();
    }
    return IslandRegistry._instance;
  }

  /**
   * Register an island component
   */
  register(config: IslandConfig): void {
    if (this._entries.has(config.name)) {
      console.warn(`[PhilJS Islands] Island "${config.name}" already registered, overwriting`);
    }

    this._entries.set(config.name, {
      config,
      instances: new Set()
    });
  }

  /**
   * Get an island entry by name
   */
  get(name: string): RegistryEntry | undefined {
    return this._entries.get(name);
  }

  /**
   * Check if an island is registered
   */
  has(name: string): boolean {
    return this._entries.has(name);
  }

  /**
   * Unregister an island
   */
  unregister(name: string): boolean {
    return this._entries.delete(name);
  }

  /**
   * Get all registered island names
   */
  names(): string[] {
    return Array.from(this._entries.keys());
  }

  /**
   * Get all entries
   */
  entries(): IterableIterator<[string, RegistryEntry]> {
    return this._entries.entries();
  }

  /**
   * Track an island instance
   */
  trackInstance(name: string, instance: IslandInstance): void {
    const entry = this._entries.get(name);
    if (entry) {
      entry.instances.add(instance);
    }
  }

  /**
   * Untrack an island instance
   */
  untrackInstance(name: string, instance: IslandInstance): void {
    const entry = this._entries.get(name);
    if (entry) {
      entry.instances.delete(instance);
    }
  }

  /**
   * Get all instances of an island
   */
  getInstances(name: string): IslandInstance[] {
    const entry = this._entries.get(name);
    return entry ? Array.from(entry.instances) : [];
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this._entries.clear();
  }

  /**
   * Get total count of registered islands
   */
  get size(): number {
    return this._entries.size;
  }
}

/**
 * Get the global island registry
 */
export function getRegistry(): IslandRegistry {
  return IslandRegistry.getInstance();
}
