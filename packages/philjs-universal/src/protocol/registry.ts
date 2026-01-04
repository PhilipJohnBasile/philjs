/**
 * Component Registry
 * Central registry for discovering and managing universal components.
 */

import type {
  UniversalComponent,
  UniversalInstance,
  ComponentRegistry,
  RegistryEntry,
  FrameworkSource,
} from '../types.js';

/**
 * Implementation of ComponentRegistry
 */
export class ComponentRegistryImpl implements ComponentRegistry {
  private entries = new Map<string, RegistryEntry<unknown>>();

  register<Props>(
    component: UniversalComponent<Props>,
    metadata?: Record<string, unknown>
  ): void {
    if (this.entries.has(component.id)) {
      console.warn(`[Registry] Component "${component.id}" already registered, updating...`);
    }

    const entry: RegistryEntry<Props> = {
      component,
      instances: new Set(),
      registeredAt: Date.now(),
      metadata,
    };

    this.entries.set(component.id, entry as RegistryEntry<unknown>);
  }

  unregister(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }

    // Warn if there are active instances
    if (entry.instances.size > 0) {
      console.warn(
        `[Registry] Unregistering component "${id}" with ${entry.instances.size} active instances`
      );
    }

    return this.entries.delete(id);
  }

  get<Props = Record<string, unknown>>(id: string): UniversalComponent<Props> | undefined {
    const entry = this.entries.get(id);
    return entry?.component as UniversalComponent<Props> | undefined;
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  list(): string[] {
    return Array.from(this.entries.keys());
  }

  listBySource(source: FrameworkSource): string[] {
    const result: string[] = [];
    for (const [id, entry] of this.entries) {
      if (entry.component.source === source) {
        result.push(id);
      }
    }
    return result;
  }

  getInstances<Props = Record<string, unknown>>(
    id: string
  ): Set<UniversalInstance<Props>> {
    const entry = this.entries.get(id);
    if (!entry) {
      return new Set();
    }
    return entry.instances as Set<UniversalInstance<Props>>;
  }

  trackInstance<Props>(
    componentId: string,
    instance: UniversalInstance<Props>
  ): void {
    const entry = this.entries.get(componentId);
    if (!entry) {
      console.warn(`[Registry] Cannot track instance - component "${componentId}" not registered`);
      return;
    }
    (entry.instances as Set<UniversalInstance<Props>>).add(instance);
  }

  untrackInstance<Props>(
    componentId: string,
    instance: UniversalInstance<Props>
  ): void {
    const entry = this.entries.get(componentId);
    if (entry) {
      (entry.instances as Set<UniversalInstance<Props>>).delete(instance);
    }
  }

  getEntry<Props = Record<string, unknown>>(id: string): RegistryEntry<Props> | undefined {
    return this.entries.get(id) as RegistryEntry<Props> | undefined;
  }

  getMetadata(id: string): Record<string, unknown> | undefined {
    return this.entries.get(id)?.metadata;
  }

  setMetadata(id: string, metadata: Record<string, unknown>): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.metadata = { ...entry.metadata, ...metadata };
    }
  }

  getStats(): {
    totalComponents: number;
    totalInstances: number;
    bySource: Record<FrameworkSource, number>;
  } {
    const bySource: Record<FrameworkSource, number> = {
      philjs: 0,
      react: 0,
      vue: 0,
      svelte: 0,
      angular: 0,
      solid: 0,
      custom: 0,
    };

    let totalInstances = 0;

    for (const entry of this.entries.values()) {
      bySource[entry.component.source]++;
      totalInstances += entry.instances.size;
    }

    return {
      totalComponents: this.entries.size,
      totalInstances,
      bySource,
    };
  }

  clear(): void {
    this.entries.clear();
  }
}

/**
 * Global component registry
 */
let globalRegistry: ComponentRegistryImpl | null = null;

export function getGlobalRegistry(): ComponentRegistryImpl {
  if (!globalRegistry) {
    globalRegistry = new ComponentRegistryImpl();
  }
  return globalRegistry;
}

/**
 * Create a scoped registry (for testing or isolation)
 */
export function createScopedRegistry(): ComponentRegistryImpl {
  return new ComponentRegistryImpl();
}

/**
 * Register a component in the global registry
 */
export function registerComponent<Props>(
  component: UniversalComponent<Props>,
  metadata?: Record<string, unknown>
): void {
  getGlobalRegistry().register(component, metadata);
}

/**
 * Get a component from the global registry
 */
export function getComponent<Props = Record<string, unknown>>(
  id: string
): UniversalComponent<Props> | undefined {
  return getGlobalRegistry().get<Props>(id);
}

/**
 * Check if a component is registered
 */
export function hasComponent(id: string): boolean {
  return getGlobalRegistry().has(id);
}
