/**
 * Svelte Framework Adapter for PhilJS Islands
 * Handles Svelte component hydration and lifecycle
 */

import type { FrameworkAdapter, IslandProps, HydrationStrategy } from './types.js';

export interface SvelteComponent {
  new (options: { target: HTMLElement; props?: any; hydrate?: boolean; intro?: boolean }): any;
  $$render?: any;
  render?: any;
}

export interface SvelteModule {
  default?: SvelteComponent;
  [key: string]: any;
}

/**
 * Svelte framework adapter
 * Supports both Svelte 3 and Svelte 4+
 */
export const svelteAdapter: FrameworkAdapter = {
  name: 'svelte',

  /**
   * Detect if a component is a Svelte component
   */
  detect(component: any): boolean {
    if (!component) return false;

    // Check for Svelte component class
    if (typeof component === 'function' && component.prototype) {
      return !!(
        component.prototype.$set ||
        component.prototype.$on ||
        component.prototype.$destroy ||
        component.$$render
      );
    }

    // Check for compiled Svelte component
    return !!(component.$$render || component.render);
  },

  /**
   * Hydrate a Svelte component into the DOM
   */
  async hydrate(
    element: HTMLElement,
    component: SvelteComponent,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void> {
    try {
      // Parse props from data attributes
      const parsedProps = parseProps(element, props);

      // Check if we should hydrate existing content
      const shouldHydrate = element.hasAttribute('data-server-rendered') ||
                           element.innerHTML.trim().length > 0;

      // Create Svelte component instance
      const instance = new component({
        target: element,
        props: parsedProps,
        hydrate: shouldHydrate,
        intro: true // Enable transitions
      });

      // Store instance for cleanup
      (element as any).__svelteInstance = instance;

      // Mark as hydrated
      element.setAttribute('data-framework', 'svelte');
      element.setAttribute('data-hydrated', 'true');

      // Dispatch hydration event
      element.dispatchEvent(
        new CustomEvent('phil:island-hydrated', {
          bubbles: true,
          detail: {
            framework: 'svelte',
            component: component.name || 'AnonymousComponent',
            props: parsedProps,
            strategy,
            hydrated: shouldHydrate
          }
        })
      );
    } catch (error) {
      console.error('[PhilJS Islands] Svelte hydration failed:', error);
      throw error;
    }
  },

  /**
   * Unmount a Svelte component
   */
  async unmount(element: HTMLElement): Promise<void> {
    try {
      const instance = (element as any).__svelteInstance;
      if (instance && typeof instance.$destroy === 'function') {
        instance.$destroy();
        delete (element as any).__svelteInstance;
      }

      element.removeAttribute('data-framework');
      element.removeAttribute('data-hydrated');
    } catch (error) {
      console.error('[PhilJS Islands] Svelte unmount failed:', error);
    }
  },

  /**
   * Serialize props for SSR
   */
  serializeProps(props: Record<string, any>): string {
    return JSON.stringify(props, (key, value) => {
      if (typeof value === 'function') {
        return undefined;
      }
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      if (value instanceof RegExp) {
        return { __type: 'RegExp', value: value.toString() };
      }
      // Svelte stores
      if (value && typeof value.subscribe === 'function') {
        return undefined; // Can't serialize stores
      }
      return value;
    });
  },

  /**
   * Deserialize props from SSR
   */
  deserializeProps(serialized: string): Record<string, any> {
    return JSON.parse(serialized, (key, value) => {
      if (value && typeof value === 'object') {
        if (value.__type === 'Date') {
          return new Date(value.value);
        }
        if (value.__type === 'RegExp') {
          const match = value.value.match(/\/(.*?)\/([gimuy]*)$/);
          return match ? new RegExp(match[1], match[2]) : value.value;
        }
      }
      return value;
    });
  },

  /**
   * Get required peer dependencies
   */
  getPeerDependencies(): string[] {
    return ['svelte'];
  }
};

/**
 * Parse props from element data attributes
 */
function parseProps(element: HTMLElement, additionalProps: IslandProps): Record<string, any> {
  const props: Record<string, any> = { ...additionalProps };

  // Parse data-prop-* attributes
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-prop-')) {
      const propName = attr.name.slice(10);
      try {
        props[propName] = JSON.parse(attr.value);
      } catch {
        props[propName] = attr.value;
      }
    }
  });

  // Parse data-props attribute
  const bulkProps = element.getAttribute('data-props');
  if (bulkProps) {
    try {
      Object.assign(props, JSON.parse(bulkProps));
    } catch (error) {
      console.warn('[PhilJS Islands] Failed to parse data-props:', error);
    }
  }

  return props;
}

/**
 * Update Svelte component props
 * Useful for reactive updates after initial hydration
 */
export function updateSvelteProps(element: HTMLElement, newProps: Record<string, any>): void {
  const instance = (element as any).__svelteInstance;
  if (instance && typeof instance.$set === 'function') {
    instance.$set(newProps);
  }
}

/**
 * Get Svelte component instance
 * Allows access to component methods and state
 */
export function getSvelteInstance(element: HTMLElement): any {
  return (element as any).__svelteInstance;
}

/**
 * Create a Svelte store bridge for sharing state
 */
export function createSvelteStoreBridge<T>(initialValue: T) {
  const subscribers = new Set<(value: T) => void>();
  let value = initialValue;

  return {
    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      callback(value); // Send initial value

      return () => {
        subscribers.delete(callback);
      };
    },
    set(newValue: T) {
      value = newValue;
      subscribers.forEach(callback => callback(value));
    },
    update(updater: (value: T) => T) {
      value = updater(value);
      subscribers.forEach(callback => callback(value));
    }
  };
}

export default svelteAdapter;
