/**
 * Preact Framework Adapter for PhilJS Islands
 * Handles Preact component hydration and lifecycle
 */

import type { FrameworkAdapter, IslandProps, HydrationStrategy } from './types.js';

export interface PreactComponent {
  (props: any): any;
  displayName?: string;
}

export interface PreactModule {
  default?: PreactComponent;
  [key: string]: any;
}

/**
 * Preact framework adapter
 * Lightweight React alternative with similar API
 */
export const preactAdapter: FrameworkAdapter = {
  name: 'preact',

  /**
   * Detect if a component is a Preact component
   */
  detect(component: any): boolean {
    if (!component) return false;

    // Preact components are functions or classes
    return (
      typeof component === 'function' ||
      (typeof component === 'object' &&
       (component.$$typeof?.toString() === 'Symbol(react.element)' ||
        component.__v !== undefined)) // Preact VNode marker
    );
  },

  /**
   * Hydrate a Preact component into the DOM
   */
  async hydrate(
    element: HTMLElement,
    component: PreactComponent,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void> {
    try {
      // Dynamic import to avoid bundling Preact if not used
      const { h, render, hydrate: preactHydrate } = await import('preact');

      // Parse props from data attributes
      const parsedProps = parseProps(element, props);

      // Check if we should hydrate existing content
      const shouldHydrate = element.hasAttribute('data-server-rendered') ||
                           element.innerHTML.trim().length > 0;

      // Create Preact VNode
      const vnode = h(component, parsedProps);

      // Hydrate or render
      if (shouldHydrate && preactHydrate) {
        preactHydrate(vnode, element);
      } else {
        render(vnode, element);
      }

      // Mark as hydrated
      element.setAttribute('data-framework', 'preact');
      element.setAttribute('data-hydrated', 'true');

      // Dispatch hydration event
      element.dispatchEvent(
        new CustomEvent('phil:island-hydrated', {
          bubbles: true,
          detail: {
            framework: 'preact',
            component: component.displayName || component.name,
            props: parsedProps,
            strategy,
            hydrated: shouldHydrate
          }
        })
      );
    } catch (error) {
      console.error('[PhilJS Islands] Preact hydration failed:', error);
      throw error;
    }
  },

  /**
   * Unmount a Preact component
   */
  async unmount(element: HTMLElement): Promise<void> {
    try {
      const { render } = await import('preact');

      // Render null to unmount
      render(null, element);

      element.removeAttribute('data-framework');
      element.removeAttribute('data-hydrated');
    } catch (error) {
      console.error('[PhilJS Islands] Preact unmount failed:', error);
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
    return ['preact'];
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
 * Create a Preact island component wrapper with error boundary
 */
export function createPreactIsland(Component: PreactComponent) {
  return function PreactIsland(props: any) {
    const preact = require('preact');
    const { useState, useEffect } = require('preact/hooks');

    const [error, setError] = useState<Error | null>(null);

    // Error boundary effect
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (event.error) {
          setError(event.error);
        }
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (error) {
      return preact.h('div', {
        class: 'philjs-island-error',
        'data-error': error.message
      }, `Error: ${error.message}`);
    }

    try {
      return preact.h(Component, props);
    } catch (err) {
      console.error('[PhilJS Islands] Preact component error:', err);
      return preact.h('div', {
        class: 'philjs-island-error',
        'data-error': (err as Error).message
      }, `Error: ${(err as Error).message}`);
    }
  };
}

/**
 * Preact signals integration for reactive state
 * Creates a signal that can be shared across islands
 */
export function createPreactSignal<T>(initialValue: T) {
  try {
    const { signal } = require('@preact/signals');
    return signal(initialValue);
  } catch {
    console.warn('[PhilJS Islands] @preact/signals not installed, falling back to basic state');
    // Fallback to basic implementation
    let value = initialValue;
    const listeners = new Set<(value: T) => void>();

    return {
      value,
      get peek() { return value; },
      subscribe(fn: (value: T) => void) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      set(newValue: T) {
        value = newValue;
        listeners.forEach(fn => fn(value));
      }
    };
  }
}

export default preactAdapter;
