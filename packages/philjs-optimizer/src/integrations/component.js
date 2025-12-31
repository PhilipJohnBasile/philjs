/**
 * Component lazy loading integration
 */
import { loadSymbol, prefetchSymbol } from '../runtime.js';
/**
 * Create a lazy component
 */
export function lazy(loader, options) {
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
export async function loadComponent(lazyComponent) {
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
export function Suspense(props) {
    const { children, fallback, lazy: lazyComponent } = props;
    if (!lazyComponent) {
        return children;
    }
    if (lazyComponent.loaded && lazyComponent.component) {
        return lazyComponent.component(props);
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
export async function prefetchComponent(lazyComponent) {
    await loadComponent(lazyComponent);
}
/**
 * Component registry for tracking lazy components
 */
export class ComponentRegistry {
    components = new Map();
    register(component) {
        this.components.set(component.symbolId, component);
    }
    get(symbolId) {
        return this.components.get(symbolId);
    }
    async loadAll() {
        const promises = Array.from(this.components.values()).map((component) => loadComponent(component));
        await Promise.all(promises);
    }
    getLoadedCount() {
        return Array.from(this.components.values()).filter((c) => c.loaded).length;
    }
    getTotalCount() {
        return this.components.size;
    }
}
/**
 * Global component registry
 */
export const componentRegistry = new ComponentRegistry();
//# sourceMappingURL=component.js.map