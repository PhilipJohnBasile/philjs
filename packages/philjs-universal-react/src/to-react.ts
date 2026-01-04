/**
 * toReact - Convert Universal Components to React components.
 *
 * This module provides utilities for using Universal Components
 * within React applications.
 */

import {
  createElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
  type FC,
  type ReactNode,
  type ForwardedRef,
  type CSSProperties,
} from 'react';
import type { UniversalComponent, UniversalInstance, LifecycleEvent } from '@philjs/universal';
import type { ToReactOptions } from './types.js';

/**
 * Convert a Universal Component to a React component.
 *
 * This allows Universal Components (from PhilJS, Vue, Svelte, etc.)
 * to be used seamlessly within React applications.
 *
 * @param component - The Universal Component to convert
 * @param options - Configuration options
 * @returns A React functional component
 *
 * @example
 * ```tsx
 * import { toReact } from '@philjs/universal-react';
 * import { PhilJSButton } from '@my-org/philjs-components';
 *
 * // Convert the Universal Component to React
 * const Button = toReact(PhilJSButton);
 *
 * // Use in React like any other component
 * function App() {
 *   return (
 *     <div>
 *       <Button label="Click me" onClick={() => console.log('Clicked!')} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom container styling
 * const Card = toReact(UniversalCard, {
 *   className: 'card-container',
 *   style: { padding: '16px' },
 *   as: 'section',
 * });
 * ```
 */
export function toReact<P extends Record<string, unknown>>(
  component: UniversalComponent<P>,
  options: ToReactOptions = {}
): FC<P> {
  const {
    className,
    style,
    as = 'div',
  } = options;

  const displayName = component.name || 'UniversalComponent';

  function UniversalWrapper(props: P): ReactNode {
    const containerRef = useRef<HTMLElement | null>(null);
    const instanceRef = useRef<UniversalInstance<P> | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Mount the universal component when the container is ready
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      try {
        // Mount the universal component
        instanceRef.current = component.mount(container, props);

        // Subscribe to errors
        const unsubscribeError = instanceRef.current.onError((err) => {
          setError(err);
        });

        return () => {
          unsubscribeError();
          if (instanceRef.current) {
            instanceRef.current.unmount();
            instanceRef.current = null;
          }
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error(`[toReact] Failed to mount ${displayName}:`, error);
      }
    }, []);

    // Update props when they change
    useEffect(() => {
      if (instanceRef.current) {
        instanceRef.current.update(props);
      }
    }, [props]);

    // Show error state
    if (error) {
      return createElement(
        'div',
        {
          style: {
            padding: '8px',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
            color: '#c92a2a',
          },
        },
        `Error in ${displayName}: ${error.message}`
      );
    }

    // Render the container element
    return createElement(as, {
      ref: containerRef,
      className,
      style,
      'data-universal-component': component.id,
    });
  }

  UniversalWrapper.displayName = `Universal(${displayName})`;

  return UniversalWrapper as FC<P>;
}

/**
 * Convert a Universal Component to a React component with ref forwarding.
 *
 * This variant forwards the ref to the container element, allowing
 * parent components to access the DOM node.
 *
 * @param component - The Universal Component to convert
 * @param options - Configuration options
 * @returns A React component with ref forwarding
 *
 * @example
 * ```tsx
 * import { toReactWithRef } from '@philjs/universal-react';
 *
 * const Input = toReactWithRef(UniversalInput);
 *
 * function Form() {
 *   const inputRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     // Access the container element
 *     inputRef.current?.focus();
 *   }, []);
 *
 *   return <Input ref={inputRef} placeholder="Enter text..." />;
 * }
 * ```
 */
export function toReactWithRef<P extends Record<string, unknown>>(
  component: UniversalComponent<P>,
  options: ToReactOptions = {}
): React.ForwardRefExoticComponent<P & React.RefAttributes<HTMLElement>> {
  const {
    className,
    style,
    as = 'div',
  } = options;

  const displayName = component.name || 'UniversalComponent';

  const UniversalWrapperWithRef = forwardRef<HTMLElement, P>(
    function UniversalWrapperWithRef(
      props: P,
      forwardedRef: ForwardedRef<HTMLElement>
    ): ReactNode {
      const containerRef = useRef<HTMLElement | null>(null);
      const instanceRef = useRef<UniversalInstance<P> | null>(null);
      const [error, setError] = useState<Error | null>(null);

      // Combine refs
      const setRefs = useCallback(
        (element: HTMLElement | null) => {
          containerRef.current = element;

          if (typeof forwardedRef === 'function') {
            forwardedRef(element);
          } else if (forwardedRef) {
            forwardedRef.current = element;
          }
        },
        [forwardedRef]
      );

      // Mount the universal component
      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        try {
          instanceRef.current = component.mount(container, props);

          const unsubscribeError = instanceRef.current.onError((err) => {
            setError(err);
          });

          return () => {
            unsubscribeError();
            if (instanceRef.current) {
              instanceRef.current.unmount();
              instanceRef.current = null;
            }
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
        }
      }, []);

      // Update props
      useEffect(() => {
        if (instanceRef.current) {
          instanceRef.current.update(props);
        }
      }, [props]);

      if (error) {
        return createElement(
          'div',
          { style: { color: 'red' } },
          `Error: ${error.message}`
        );
      }

      return createElement(as, {
        ref: setRefs,
        className,
        style,
        'data-universal-component': component.id,
      });
    }
  );

  UniversalWrapperWithRef.displayName = `Universal(${displayName})`;

  return UniversalWrapperWithRef;
}

/**
 * Hook to use a Universal Component instance imperatively.
 *
 * @param component - The Universal Component
 * @param props - Initial props
 * @returns Object with instance, mount, unmount, and update functions
 *
 * @example
 * ```tsx
 * import { useUniversalComponent } from '@philjs/universal-react';
 *
 * function DynamicComponent() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { instance, mount, unmount, update } = useUniversalComponent(
 *     UniversalWidget,
 *     { title: 'Hello' }
 *   );
 *
 *   useEffect(() => {
 *     if (containerRef.current) {
 *       mount(containerRef.current);
 *     }
 *     return () => unmount();
 *   }, [mount, unmount]);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 */
export function useUniversalComponent<P extends Record<string, unknown>>(
  component: UniversalComponent<P>,
  initialProps: P
): {
  instance: UniversalInstance<P> | null;
  mount: (container: HTMLElement) => void;
  unmount: () => void;
  update: (props: Partial<P>) => void;
} {
  const instanceRef = useRef<UniversalInstance<P> | null>(null);
  const propsRef = useRef(initialProps);

  const mount = useCallback(
    (container: HTMLElement) => {
      if (instanceRef.current) {
        instanceRef.current.unmount();
      }
      instanceRef.current = component.mount(container, propsRef.current);
    },
    [component]
  );

  const unmount = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.unmount();
      instanceRef.current = null;
    }
  }, []);

  const update = useCallback((props: Partial<P>) => {
    propsRef.current = { ...propsRef.current, ...props };
    if (instanceRef.current) {
      instanceRef.current.update(props);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount();
        instanceRef.current = null;
      }
    };
  }, []);

  return {
    instance: instanceRef.current,
    mount,
    unmount,
    update,
  };
}

/**
 * Hook to subscribe to Universal Component lifecycle events.
 *
 * @param instance - The Universal Component instance
 * @param event - The lifecycle event to listen for
 * @param callback - Callback function
 */
export function useUniversalLifecycle<P>(
  instance: UniversalInstance<P> | null,
  event: LifecycleEvent,
  callback: () => void
): void {
  useEffect(() => {
    if (!instance) return;
    return instance.on(event, callback);
  }, [instance, event, callback]);
}

/**
 * Batch convert multiple Universal Components to React components.
 *
 * @param components - Object mapping names to Universal Components
 * @param options - Shared options for all components
 * @returns Object mapping names to React components
 *
 * @example
 * ```tsx
 * import { toReactBatch } from '@philjs/universal-react';
 *
 * const components = toReactBatch({
 *   Button: UniversalButton,
 *   Input: UniversalInput,
 *   Card: UniversalCard,
 * });
 *
 * function App() {
 *   return (
 *     <components.Card>
 *       <components.Input placeholder="Name" />
 *       <components.Button label="Submit" />
 *     </components.Card>
 *   );
 * }
 * ```
 */
export function toReactBatch<
  T extends Record<string, UniversalComponent<Record<string, unknown>>>,
>(
  components: T,
  options: ToReactOptions = {}
): { [K in keyof T]: FC<T[K] extends UniversalComponent<infer P> ? P : never> } {
  const result: Record<string, FC<Record<string, unknown>>> = {};

  for (const [key, component] of Object.entries(components)) {
    result[key] = toReact(component, options);
  }

  return result as { [K in keyof T]: FC<T[K] extends UniversalComponent<infer P> ? P : never> };
}
