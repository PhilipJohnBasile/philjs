/**
 * Component lazy loading integration
 */

import type { LazyHandler } from '../types.js';
import { loadSymbol, prefetchSymbol } from '../runtime.js';

/**
 * Lazy component wrapper
 */
export interface LazyComponent<P = any> {
  symbolId: string;
  component?: (props: P) => any;
  loaded: boolean;
  fallback?: (props: P) => any;
}

/**
 * Create a lazy component
 */
export function lazy<P = any>(
  loader: () => Promise<any>,
  options?: {
    fallback?: (props: P) => any;
  }
): LazyComponent<P> {
  const symbolId = `lazy_component_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return {
    symbolId,
    loaded: false,
    ...(options?.fallback !== undefined && { fallback: options.fallback }),
  };
}

/**
 * Load a lazy component
 */
export async function loadComponent<P = any>(
  lazyComponent: LazyComponent<P>
): Promise<(props: P) => any> {
  if (lazyComponent.loaded && lazyComponent.component) {
    return lazyComponent.component;
  }

  const component = await loadSymbol(lazyComponent.symbolId);
  lazyComponent.component = component;
  lazyComponent.loaded = true;

  return component;
}

/**
 * Suspense-like component for lazy loading
 */
export function Suspense<P = any>(props: {
  children: any;
  fallback?: any;
  lazy?: LazyComponent<P>;
}) {
  const { children, fallback, lazy: lazyComponent } = props;

  if (!lazyComponent) {
    return children;
  }

  if (lazyComponent.loaded && lazyComponent.component) {
    return lazyComponent.component(props as unknown as P);
  }

  // Load the component
  loadComponent(lazyComponent).catch((error) => {
    console.error('Failed to load lazy component:', error);
  });

  return fallback || null;
}

/**
 * Prefetch a component
 */
export async function prefetchComponent<P = any>(
  lazyComponent: LazyComponent<P>
): Promise<void> {
  await loadComponent(lazyComponent);
}

/**
 * Component registry for tracking lazy components
 */
export class ComponentRegistry {
  private components = new Map<string, LazyComponent>();

  register<P = any>(component: LazyComponent<P>): void {
    this.components.set(component.symbolId, component);
  }

  get(symbolId: string): LazyComponent | undefined {
    return this.components.get(symbolId);
  }

  async loadAll(): Promise<void> {
    const promises = Array.from(this.components.values()).map((component) =>
      loadComponent(component)
    );
    await Promise.all(promises);
  }

  getLoadedCount(): number {
    return Array.from(this.components.values()).filter((c) => c.loaded).length;
  }

  getTotalCount(): number {
    return this.components.size;
  }
}

/**
 * Global component registry
 */
export const componentRegistry = new ComponentRegistry();
