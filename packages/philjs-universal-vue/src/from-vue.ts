/**
 * Convert Vue 3 components to Universal Component Protocol
 *
 * This module provides the `fromVue()` function that wraps Vue components
 * for use across any framework through the Universal Component Protocol.
 *
 * @example
 * ```ts
 * import { fromVue } from '@philjs/universal-vue';
 * import MyVueComponent from './MyVueComponent.vue';
 *
 * const UniversalMyComponent = fromVue(MyVueComponent, {
 *   name: 'MyComponent',
 * });
 *
 * // Use in PhilJS or any other framework
 * const instance = UniversalMyComponent.mount(container, { message: 'Hello' });
 * ```
 */

import { createApp, h, shallowRef, type App, type Component } from 'vue';
import type {
  VueComponent,
  FromVueOptions,
  UniversalComponent,
  UniversalInstance,
  Signal,
  Memo,
} from './types.js';
import { isPhilJSSignal, isPhilJSMemo, isPhilJSReactive } from './types.js';

/**
 * Generate a unique component ID
 */
function generateComponentId(name: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `vue-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomPart}`;
}

/**
 * Extract component name from Vue component definition
 */
function extractComponentName(component: VueComponent): string {
  if (component && typeof component === 'object') {
    const comp = component as Record<string, unknown>;
    if ('name' in comp && typeof comp['name'] === 'string') {
      return comp['name'];
    }
    if ('__name' in comp && typeof comp['__name'] === 'string') {
      return comp['__name'];
    }
  }
  return 'VueComponent';
}

/**
 * Convert a props object, unwrapping any PhilJS signals to their values
 * and returning a reactive props object for Vue
 */
function createReactiveProps<P extends Record<string, unknown>>(
  props: P,
  onPropsChange: (callback: (newProps: P) => void) => () => void
): { propsRef: { value: P }; cleanup: () => void } {
  const propsRef = shallowRef({} as P) as { value: P };
  const cleanups: Array<() => void> = [];

  // Function to resolve all props to their current values
  function resolveAllProps(inputProps: P): P {
    const resolved = {} as Record<string, unknown>;

    for (const [key, value] of Object.entries(inputProps)) {
      if (isPhilJSReactive(value)) {
        // Get current value from signal/memo
        resolved[key] = value();
      } else {
        resolved[key] = value;
      }
    }

    return resolved as P;
  }

  // Initial resolution
  propsRef.value = resolveAllProps(props);

  // Subscribe to each signal prop for real-time updates
  for (const [key, value] of Object.entries(props)) {
    if (isPhilJSSignal(value) || isPhilJSMemo(value)) {
      const unsubscribe = value.subscribe((newValue: unknown) => {
        // Update just this prop in the reactive object
        propsRef.value = {
          ...propsRef.value,
          [key]: newValue,
        };
      });
      cleanups.push(unsubscribe);
    }
  }

  // Also listen for bulk prop updates from the Universal component
  const unsubscribeBulk = onPropsChange((newProps: P) => {
    // Clear existing signal subscriptions before setting up new ones
    // This happens in the update() call of UniversalInstance
    propsRef.value = resolveAllProps(newProps);
  });
  cleanups.push(unsubscribeBulk);

  return {
    propsRef,
    cleanup: () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    },
  };
}

/**
 * Simple event tunnel implementation
 */
interface EventTunnel {
  emit(eventName: string, detail: unknown): void;
}

function createEventTunnel(): EventTunnel {
  return {
    emit(eventName: string, detail: unknown) {
      // In a full implementation, this would dispatch to parent components
      // For now, we just log for debugging
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`philjs:${eventName}`, { detail }));
      }
    },
  };
}

/**
 * Convert a Vue 3 component to a Universal Component.
 *
 * This function wraps a Vue component so it can be used across different
 * frameworks through the Universal Component Protocol. Signal props are
 * automatically converted to Vue refs for seamless reactivity.
 *
 * @param VueComponentDef - The Vue component to wrap
 * @param options - Configuration options
 * @returns A Universal Component that wraps the Vue component
 *
 * @example
 * ```ts
 * import { fromVue } from '@philjs/universal-vue';
 * import Counter from './Counter.vue';
 *
 * const UniversalCounter = fromVue(Counter, {
 *   name: 'Counter',
 *   convertSignals: true,
 * });
 *
 * // Mount with regular props
 * UniversalCounter.mount(container, { count: 0 });
 *
 * // Mount with signal props - they sync automatically
 * import { signal } from '@philjs/core';
 * const count = signal(0);
 * UniversalCounter.mount(container, { count });
 * count.set(10); // Vue component updates automatically
 * ```
 */
export function fromVue<P extends Record<string, unknown>>(
  VueComponentDef: VueComponent<P>,
  options: FromVueOptions = {}
): UniversalComponent<P> {
  const componentName = options.name ?? extractComponentName(VueComponentDef as VueComponent);
  const {
    id = generateComponentId(componentName),
    version,
    convertSignals = true,
    transformProps,
    transformEventName = (eventName: string) => `vue:${eventName}`,
    exposeInstance = false,
  } = options;

  const component = {
    id,
    name: componentName,
    source: 'vue',
    ...(version !== undefined ? { version } : {}),

    mount(container: HTMLElement, props: P): UniversalInstance<P> {
      const eventTunnel = createEventTunnel();
      const propChangeCallbacks = new Set<(newProps: P) => void>();
      const lifecycleCallbacks = new Map<string, Set<() => void>>();
      const errorCallbacks = new Set<(error: Error) => void>();

      // Create reactive props from potentially signal-containing props
      const { propsRef, cleanup: propsCleanup } = convertSignals
        ? createReactiveProps(props, (callback) => {
            propChangeCallbacks.add(callback);
            return () => propChangeCallbacks.delete(callback);
          })
        : { propsRef: shallowRef(props) as { value: P }, cleanup: () => {} };

      // Store the app instance for later unmounting
      let app: App | null = null;
      let currentProps = props;

      const emitLifecycle = (event: string) => {
        const callbacks = lifecycleCallbacks.get(event);
        if (callbacks) {
          callbacks.forEach((cb) => cb());
        }
      };

      try {
        // Create the Vue app with a wrapper component
        app = createApp({
          name: `${name}Wrapper`,

          setup() {
            return () => {
              const currentPropsValue = transformProps
                ? transformProps(propsRef.value)
                : propsRef.value;

              // Create event handlers that forward to the event tunnel
              const eventHandlers: Record<string, (...args: unknown[]) => void> = {};

              // Listen for common Vue events
              const commonEvents = [
                'click',
                'input',
                'change',
                'submit',
                'focus',
                'blur',
                'update:modelValue',
              ];

              for (const eventName of commonEvents) {
                const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
                eventHandlers[handlerName] = (...args: unknown[]) => {
                  eventTunnel.emit(transformEventName(eventName), args.length === 1 ? args[0] : args);
                };
              }

              // Render the wrapped Vue component
              return h(
                VueComponentDef as Component,
                {
                  ...currentPropsValue,
                  ...eventHandlers,
                },
              );
            };
          },

          mounted() {
            emitLifecycle('mounted');
          },

          beforeUnmount() {
            emitLifecycle('beforeUnmount');
          },
        });

        // Mount the Vue app
        app.mount(container);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errorCallbacks.forEach((cb) => cb(err));
        throw error;
      }

      // Create instance
      const instance: UniversalInstance<P> = {
        get props() {
          return currentProps;
        },

        get element() {
          return container;
        },

        update(newProps: Partial<P>) {
          emitLifecycle('beforeUpdate');

          // Merge props
          currentProps = { ...currentProps, ...newProps };

          // Update the reactive props ref
          if (convertSignals) {
            // Resolve signal values
            const resolved = {} as Record<string, unknown>;
            for (const [key, value] of Object.entries(currentProps)) {
              if (isPhilJSReactive(value)) {
                resolved[key] = value();
              } else {
                resolved[key] = value;
              }
            }
            propsRef.value = { ...propsRef.value, ...resolved } as P;
          } else {
            propsRef.value = { ...propsRef.value, ...currentProps } as P;
          }

          // Notify prop change callbacks
          for (const callback of propChangeCallbacks) {
            callback(currentProps);
          }

          emitLifecycle('updated');
        },

        unmount() {
          emitLifecycle('beforeUnmount');

          // Cleanup props subscriptions
          propsCleanup();

          // Clear callbacks
          propChangeCallbacks.clear();

          // Unmount the Vue app
          if (app) {
            try {
              app.unmount();
            } catch (error) {
              console.error(`[fromVue: ${name}] Error unmounting Vue app:`, error);
            }
            app = null;
          }

          // Clear the container
          container.innerHTML = '';

          emitLifecycle('unmounted');
        },

        on(event: string, handler: () => void): () => void {
          if (!lifecycleCallbacks.has(event)) {
            lifecycleCallbacks.set(event, new Set());
          }
          lifecycleCallbacks.get(event)!.add(handler);
          return () => lifecycleCallbacks.get(event)?.delete(handler);
        },

        onError(handler: (error: Error) => void): () => void {
          errorCallbacks.add(handler);
          return () => errorCallbacks.delete(handler);
        },

        getElement(): HTMLElement {
          return container.firstElementChild as HTMLElement ?? container;
        },
      };

      return instance;
    },
  } as UniversalComponent<P>;

  return component;
}

/**
 * Create multiple Universal components from a record of Vue components.
 * Useful for batch conversion of component libraries.
 *
 * @param components - Record of Vue components keyed by name
 * @param options - Shared options applied to all components
 * @returns Record of Universal components with the same keys
 *
 * @example
 * ```ts
 * import { fromVueMultiple } from '@philjs/universal-vue';
 * import * as VueComponents from './components';
 *
 * const universalComponents = fromVueMultiple(VueComponents);
 * ```
 */
export function fromVueMultiple<
  T extends Record<string, VueComponent>,
>(
  components: T,
  options: Omit<FromVueOptions, 'id' | 'name'> = {}
): { [K in keyof T]: UniversalComponent<Record<string, unknown>> } {
  const result = {} as { [K in keyof T]: UniversalComponent<Record<string, unknown>> };

  for (const [key, component] of Object.entries(components)) {
    result[key as keyof T] = fromVue(component as VueComponent<Record<string, unknown>>, {
      ...options,
      name: key,
    });
  }

  return result;
}
