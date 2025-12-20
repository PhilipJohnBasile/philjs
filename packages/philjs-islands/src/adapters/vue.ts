/**
 * Vue Framework Adapter for PhilJS Islands
 * Handles Vue component hydration and lifecycle
 */

import type { FrameworkAdapter, IslandProps, HydrationStrategy } from './types.js';

export interface VueComponent {
  name?: string;
  props?: any;
  setup?: (props: any, context: any) => any;
  render?: (props: any) => any;
  template?: string;
  [key: string]: any;
}

export interface VueModule {
  default?: VueComponent;
  [key: string]: any;
}

/**
 * Vue framework adapter
 * Supports both Vue 3 and Vue 2 (with compatibility layer)
 */
export const vueAdapter: FrameworkAdapter = {
  name: 'vue',

  /**
   * Detect if a component is a Vue component
   */
  detect(component: any): boolean {
    if (!component) return false;

    // Vue 3 component detection
    if (typeof component === 'object') {
      return !!(
        component.setup ||
        component.render ||
        component.template ||
        component.__vccOpts || // Vue 3 SFC compiled output
        component._compiled // Vue 2 compiled component
      );
    }

    // Vue 3 functional component
    if (typeof component === 'function') {
      return component.length <= 2; // Vue functional components have (props, context)
    }

    return false;
  },

  /**
   * Hydrate a Vue component into the DOM
   */
  async hydrate(
    element: HTMLElement,
    component: VueComponent,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void> {
    try {
      // Try Vue 3 first
      const Vue = await import('vue');

      // Parse props from data attributes
      const parsedProps = parseProps(element, props);

      let app: any;

      // Check if we should hydrate or mount
      const shouldHydrate = element.hasAttribute('data-server-rendered') ||
                           element.innerHTML.trim().length > 0;

      if (shouldHydrate && Vue.createSSRApp) {
        // Vue 3 SSR hydration
        app = Vue.createSSRApp(component, parsedProps);
      } else if (Vue.createApp) {
        // Vue 3 client-side mount
        app = Vue.createApp(component, parsedProps);
      } else {
        // Fallback to Vue 2
        return hydrateVue2(element, component, parsedProps, strategy);
      }

      // Store app instance for cleanup
      (element as any).__vueApp = app;

      // Mount or hydrate the app
      if (shouldHydrate) {
        app.mount(element, true); // true = hydrate mode
      } else {
        app.mount(element);
      }

      // Mark as hydrated
      element.setAttribute('data-framework', 'vue');
      element.setAttribute('data-hydrated', 'true');

      // Dispatch hydration event
      element.dispatchEvent(
        new CustomEvent('phil:island-hydrated', {
          bubbles: true,
          detail: {
            framework: 'vue',
            component: component.name || 'AnonymousComponent',
            props: parsedProps,
            strategy
          }
        })
      );
    } catch (error) {
      console.error('[PhilJS Islands] Vue hydration failed:', error);
      throw error;
    }
  },

  /**
   * Unmount a Vue component
   */
  async unmount(element: HTMLElement): Promise<void> {
    try {
      const app = (element as any).__vueApp;
      if (app && typeof app.unmount === 'function') {
        app.unmount();
        delete (element as any).__vueApp;
      }

      element.removeAttribute('data-framework');
      element.removeAttribute('data-hydrated');
    } catch (error) {
      console.error('[PhilJS Islands] Vue unmount failed:', error);
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
    return ['vue'];
  }
};

/**
 * Vue 2 hydration fallback
 */
async function hydrateVue2(
  element: HTMLElement,
  component: VueComponent,
  props: Record<string, any>,
  strategy: HydrationStrategy
): Promise<void> {
  try {
    const Vue = await import('vue') as any;

    // Create Vue 2 instance
    const instance = new Vue.default({
      ...component,
      propsData: props,
      el: element
    });

    // Store instance for cleanup
    (element as any).__vueInstance = instance;

    element.setAttribute('data-framework', 'vue');
    element.setAttribute('data-hydrated', 'true');

    element.dispatchEvent(
      new CustomEvent('phil:island-hydrated', {
        bubbles: true,
        detail: {
          framework: 'vue',
          component: component.name || 'AnonymousComponent',
          props,
          strategy,
          version: 2
        }
      })
    );
  } catch (error) {
    console.error('[PhilJS Islands] Vue 2 hydration failed:', error);
    throw error;
  }
}

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
 * Create a Vue island component wrapper with error handling
 */
export function createVueIsland(component: VueComponent) {
  return {
    name: `Island_${component.name || 'Anonymous'}`,
    props: component.props,
    setup(props: any, context: any) {
      const Vue = require('vue');
      const error = Vue.ref(null);

      const handleError = (err: Error) => {
        console.error('[PhilJS Islands] Vue component error:', err);
        error.value = err;
      };

      Vue.onErrorCaptured((err: Error) => {
        handleError(err);
        return false; // Prevent propagation
      });

      if (component.setup) {
        try {
          return component.setup(props, context);
        } catch (err) {
          handleError(err as Error);
          return { error };
        }
      }

      return { error };
    },
    render(ctx: any) {
      const Vue = require('vue');

      if (ctx.error) {
        return Vue.h('div', {
          class: 'philjs-island-error',
          'data-error': ctx.error.message
        }, `Error: ${ctx.error.message}`);
      }

      if (component.render) {
        return component.render.call(this, ctx);
      }

      return null;
    },
    template: component.template
  };
}

export default vueAdapter;
