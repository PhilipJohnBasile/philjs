/**
 * React Framework Adapter for PhilJS Islands
 * Handles React component hydration and lifecycle
 */

import type { FrameworkAdapter, IslandProps, HydrationStrategy } from './types.js';

export interface ReactComponent {
  (props: any): any;
  displayName?: string;
}

export interface ReactModule {
  default?: ReactComponent;
  [key: string]: any;
}

/**
 * React framework adapter
 * Handles hydration of React components in island architecture
 */
export const reactAdapter: FrameworkAdapter = {
  name: 'react',

  /**
   * Detect if a component is a React component
   */
  detect(component: any): boolean {
    if (!component) return false;

    // Check for React component patterns
    return (
      typeof component === 'function' ||
      (typeof component === 'object' &&
       (component.$$typeof?.toString() === 'Symbol(react.element)' ||
        component.$$typeof?.toString() === 'Symbol(react.forward_ref)' ||
        component.$$typeof?.toString() === 'Symbol(react.memo)'))
    );
  },

  /**
   * Hydrate a React component into the DOM
   */
  async hydrate(
    element: HTMLElement,
    component: ReactComponent,
    props: IslandProps,
    strategy: HydrationStrategy
  ): Promise<void> {
    // Dynamic import to avoid bundling React if not used
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');

    // Parse props from data attributes
    const parsedProps = parseProps(element, props);

    // Get hydration method based on strategy
    const hydrateMethod = getHydrateMethod(strategy);

    try {
      if (hydrateMethod === 'createRoot') {
        // React 18+ concurrent features
        const root = ReactDOM.createRoot(element);
        root.render(React.createElement(component, parsedProps));
      } else if (hydrateMethod === 'hydrateRoot') {
        // React 18+ hydration
        ReactDOM.hydrateRoot(element, React.createElement(component, parsedProps));
      } else {
        // Fallback for older React versions
        const legacyReactDOM = ReactDOM as any;
        if (legacyReactDOM.hydrate) {
          legacyReactDOM.hydrate(
            React.createElement(component, parsedProps),
            element
          );
        } else {
          legacyReactDOM.render(
            React.createElement(component, parsedProps),
            element
          );
        }
      }

      // Mark as hydrated
      element.setAttribute('data-framework', 'react');
      element.setAttribute('data-hydrated', 'true');

      // Dispatch hydration event
      element.dispatchEvent(
        new CustomEvent('phil:island-hydrated', {
          bubbles: true,
          detail: {
            framework: 'react',
            component: component.displayName || component.name,
            props: parsedProps,
            strategy
          }
        })
      );
    } catch (error) {
      console.error('[PhilJS Islands] React hydration failed:', error);
      throw error;
    }
  },

  /**
   * Unmount a React component
   */
  async unmount(element: HTMLElement): Promise<void> {
    try {
      const ReactDOM = await import('react-dom/client');

      // Try React 18+ unmount
      const root = (element as any)._reactRootContainer;
      if (root) {
        if (typeof root.unmount === 'function') {
          root.unmount();
        }
      } else {
        // Fallback for older React versions
        const legacyReactDOM = ReactDOM as any;
        if (legacyReactDOM.unmountComponentAtNode) {
          legacyReactDOM.unmountComponentAtNode(element);
        }
      }

      element.removeAttribute('data-framework');
      element.removeAttribute('data-hydrated');
    } catch (error) {
      console.error('[PhilJS Islands] React unmount failed:', error);
    }
  },

  /**
   * Serialize props for SSR
   */
  serializeProps(props: Record<string, any>): string {
    return JSON.stringify(props, (key, value) => {
      // Handle special React types
      if (typeof value === 'function') {
        return undefined; // Functions can't be serialized
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
    return ['react', 'react-dom'];
  }
};

/**
 * Parse props from element data attributes and merge with provided props
 */
function parseProps(element: HTMLElement, additionalProps: IslandProps): Record<string, any> {
  const props: Record<string, any> = { ...additionalProps };

  // Parse data-prop-* attributes
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-prop-')) {
      const propName = attr.name.slice(10); // Remove 'data-prop-' prefix
      try {
        // Try to parse as JSON first
        props[propName] = JSON.parse(attr.value);
      } catch {
        // If not JSON, use as string
        props[propName] = attr.value;
      }
    }
  });

  // Parse data-props attribute (bulk props as JSON)
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
 * Determine hydration method based on strategy
 */
function getHydrateMethod(strategy: HydrationStrategy): 'createRoot' | 'hydrateRoot' | 'legacy' {
  if (strategy === 'immediate' || strategy === 'visible') {
    return 'hydrateRoot'; // Use hydration for pre-rendered content
  }
  return 'createRoot'; // Use createRoot for client-only rendering
}

/**
 * Create a React island component wrapper
 * Adds error boundary and suspense support
 */
export function createReactIsland(Component: ReactComponent) {
  return async function ReactIsland(props: any) {
    const React = await import('react');

    // Error boundary wrapper
    class IslandErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean; error?: Error }
    > {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: any) {
        console.error('[PhilJS Islands] React component error:', error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return React.createElement('div', {
            className: 'philjs-island-error',
            'data-error': this.state.error?.message
          }, `Error: ${this.state.error?.message}`);
        }

        return this.props.children;
      }
    }

    return React.createElement(
      IslandErrorBoundary,
      null,
      React.createElement(Component, props)
    );
  };
}

export default reactAdapter;
