/**
 * Solid Framework Adapter for PhilJS Islands
 * Handles Solid.js component hydration and lifecycle
 */

import type { FrameworkAdapter, IslandProps, HydrationStrategy } from './types.js';

export interface SolidComponent {
  (props: any): any;
  displayName?: string;
}

export interface SolidModule {
  default?: SolidComponent;
  [key: string]: any;
}

/**
 * Solid framework adapter
 * Supports Solid.js with fine-grained reactivity
 */
export const solidAdapter: FrameworkAdapter = {
  name: 'solid',

  /**
   * Detect if a component is a Solid component
   */
  detect(component: any): boolean {
    if (!component) return false;

    // Solid components are functions
    // They typically create reactive primitives (signals, memos, etc.)
    if (typeof component === 'function') {
      // Check function body for Solid-specific patterns
      const fnString = component.toString();
      return (
        fnString.includes('createSignal') ||
        fnString.includes('createMemo') ||
        fnString.includes('createEffect') ||
        fnString.includes('createResource')
      );
    }

    return false;
  },

  /**
   * Hydrate a Solid component into the DOM
   */
  async hydrate(
    element: HTMLElement,
    component: SolidComponent,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void> {
    try {
      // Dynamic import to avoid bundling Solid if not used
      const { render, hydrate: solidHydrate } = await import('solid-js/web');

      // Parse props from data attributes
      const parsedProps = parseProps(element, props);

      // Check if we should hydrate existing content
      const shouldHydrate = element.hasAttribute('data-server-rendered') ||
                           element.innerHTML.trim().length > 0;

      // Dispose function for cleanup
      let dispose: () => void;

      // Create wrapper to catch errors
      const SafeComponent = () => {
        try {
          return component(parsedProps);
        } catch (error) {
          console.error('[PhilJS Islands] Solid component error:', error);
          return `Error: ${(error as Error).message}`;
        }
      };

      // Hydrate or render
      if (shouldHydrate && solidHydrate) {
        dispose = solidHydrate(SafeComponent, element);
      } else {
        dispose = render(SafeComponent, element);
      }

      // Store dispose function for cleanup
      (element as any).__solidDispose = dispose;

      // Mark as hydrated
      element.setAttribute('data-framework', 'solid');
      element.setAttribute('data-hydrated', 'true');

      // Dispatch hydration event
      element.dispatchEvent(
        new CustomEvent('phil:island-hydrated', {
          bubbles: true,
          detail: {
            framework: 'solid',
            component: component.displayName || component.name,
            props: parsedProps,
            strategy,
            hydrated: shouldHydrate
          }
        })
      );
    } catch (error) {
      console.error('[PhilJS Islands] Solid hydration failed:', error);
      throw error;
    }
  },

  /**
   * Unmount a Solid component
   */
  async unmount(element: HTMLElement): Promise<void> {
    try {
      const dispose = (element as any).__solidDispose;
      if (typeof dispose === 'function') {
        dispose();
        delete (element as any).__solidDispose;
      }

      element.removeAttribute('data-framework');
      element.removeAttribute('data-hydrated');
    } catch (error) {
      console.error('[PhilJS Islands] Solid unmount failed:', error);
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
      // Solid signals/stores
      if (value && typeof value === 'function' && value.name?.includes('readSignal')) {
        return undefined; // Can't serialize signals
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
    return ['solid-js'];
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
 * Create a Solid island component wrapper with error boundary
 */
export function createSolidIsland(Component: SolidComponent) {
  return function SolidIsland(props: any) {
    const solid = require('solid-js');
    const [error, setError] = (solid.createSignal as (initial: Error | null) => [() => Error | null, (value: Error | null) => void])(null);

    // Create error boundary
    const SafeComponent = () => {
      try {
        return Component(props);
      } catch (err) {
        console.error('[PhilJS Islands] Solid component error:', err);
        setError(err as Error);
        return null;
      }
    };

    return solid.createMemo(() => {
      const currentError = error();
      if (currentError) {
        const { h } = require('solid-js/h');
        return h('div', {
          class: 'philjs-island-error',
          'data-error': currentError.message
        }, `Error: ${currentError.message}`);
      }
      return SafeComponent();
    });
  };
}

/**
 * Create a Solid store for shared state across islands
 */
export function createSolidStore<T extends object>(initialState: T) {
  try {
    const { createStore } = require('solid-js/store');
    return createStore(initialState);
  } catch {
    console.warn('[PhilJS Islands] solid-js/store not available, falling back to signal');
    const { createSignal } = require('solid-js');
    const [get, set] = createSignal(initialState);
    return [get, (updates: Partial<T>) => set({ ...get(), ...updates })];
  }
}

/**
 * Create a Solid resource for async data loading
 */
export function createSolidResource<T>(
  fetcher: () => Promise<T>,
  options?: { initialValue?: T }
) {
  const { createResource } = require('solid-js');
  return createResource(fetcher, options);
}

/**
 * Solid context bridge for sharing data between islands
 */
export function createSolidContext<T>(defaultValue: T) {
  const { createContext, useContext } = require('solid-js');
  const Context = createContext(defaultValue);

  return {
    Provider: Context.Provider,
    use: () => useContext(Context)
  };
}

export default solidAdapter;
