/**
 * Convert Universal Components to Vue 3 Components
 *
 * This module provides the `toVue()` function that wraps Universal components
 * for use within Vue applications.
 *
 * @example
 * ```ts
 * import { toVue } from '@philjs/universal-vue';
 * import { MyUniversalComponent } from '@mylib/components';
 *
 * const MyVueComponent = toVue(MyUniversalComponent);
 *
 * // Use in Vue template
 * // <MyVueComponent :message="msg" @universal:click="handleClick" />
 * ```
 */

import {
  defineComponent,
  h,
  ref,
  shallowRef,
  onMounted,
  onBeforeUnmount,
  watch,
  inject,
  type DefineComponent,
  type PropType,
} from 'vue';
import type { UniversalComponent, UniversalInstance, ToVueOptions } from './types.js';

/**
 * Symbol for PhilJS context injection
 */
export const PHILJS_CONTEXT_KEY = Symbol('philjs-context');

/**
 * Lifecycle events
 */
type LifecycleEvent =
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'beforeUnmount'
  | 'unmounted'
  | 'error';

/**
 * Convert a Universal Component to a Vue 3 component.
 *
 * This function creates a Vue component that wraps a Universal component,
 * enabling seamless integration of cross-framework components in Vue apps.
 *
 * @param component - The Universal component to wrap
 * @param options - Configuration options
 * @returns A Vue 3 component
 *
 * @example
 * ```ts
 * import { toVue } from '@philjs/universal-vue';
 *
 * const VueCounter = toVue(UniversalCounter);
 *
 * // In Vue component:
 * // <VueCounter :count="0" @universal:updated="onUpdate" />
 * ```
 */
export function toVue<P extends Record<string, unknown>>(
  component: UniversalComponent<P>,
  options: ToVueOptions = {}
): DefineComponent {
  const {
    useProvideInject = true,
    transformEventName = (name: string) => `universal:${name}`,
  } = options;

  // Create the Vue component definition
  return defineComponent({
    name: `Universal${component.name}`,

    // Allow any attributes to pass through
    inheritAttrs: false,

    emits: [
      // Lifecycle events
      transformEventName('beforeMount'),
      transformEventName('mounted'),
      transformEventName('beforeUpdate'),
      transformEventName('updated'),
      transformEventName('beforeUnmount'),
      transformEventName('unmounted'),
      transformEventName('error'),
      // Generic event for any custom events
      'universalEvent',
    ],

    setup(_, { emit, attrs, expose }) {
      // Ref to the container element
      const containerRef = ref<HTMLElement | null>(null);

      // Store the Universal instance
      const instanceRef = shallowRef<UniversalInstance<P> | null>(null);

      // Track mounted state
      const isMounted = ref(false);

      // Cleanup functions for lifecycle subscriptions
      const cleanupFns: Array<() => void> = [];

      // Get any provided PhilJS context
      const philjsContext = useProvideInject
        ? inject(PHILJS_CONTEXT_KEY, null)
        : null;

      // Mount the Universal component when Vue component mounts
      onMounted(() => {
        if (!containerRef.value) {
          console.error(`[toVue: ${component.name}] Container element not found`);
          return;
        }

        try {
          // Mount the Universal component
          instanceRef.value = component.mount(containerRef.value, attrs as P);
          isMounted.value = true;

          // Subscribe to lifecycle events and forward to Vue emits
          const lifecycleEvents: LifecycleEvent[] = [
            'beforeMount',
            'mounted',
            'beforeUpdate',
            'updated',
            'beforeUnmount',
            'unmounted',
            'error',
          ];

          for (const event of lifecycleEvents) {
            const unsubscribe = instanceRef.value.on(event, () => {
              emit(transformEventName(event));
            });
            cleanupFns.push(unsubscribe);
          }

          // Subscribe to errors specifically
          const unsubscribeError = instanceRef.value.onError((error: Error) => {
            emit(transformEventName('error'), error);
            console.error(`[toVue: ${component.name}] Error:`, error);
          });
          cleanupFns.push(unsubscribeError);

        } catch (error) {
          console.error(`[toVue: ${component.name}] Failed to mount:`, error);
          emit(transformEventName('error'), error);
        }
      });

      // Watch for prop changes and update the Universal instance
      watch(
        () => ({ ...attrs }),
        (newProps: Record<string, unknown>) => {
          if (instanceRef.value && isMounted.value) {
            try {
              instanceRef.value.update(newProps as Partial<P>);
            } catch (error) {
              console.error(`[toVue: ${component.name}] Failed to update:`, error);
              emit(transformEventName('error'), error);
            }
          }
        },
        { deep: true }
      );

      // Cleanup when Vue component unmounts
      onBeforeUnmount(() => {
        // Run all cleanup functions
        for (const cleanup of cleanupFns) {
          cleanup();
        }
        cleanupFns.length = 0;

        // Unmount the Universal instance
        if (instanceRef.value) {
          try {
            instanceRef.value.unmount();
          } catch (error) {
            console.error(`[toVue: ${component.name}] Failed to unmount:`, error);
          }
          instanceRef.value = null;
        }

        isMounted.value = false;
      });

      // Expose the Universal instance for advanced usage
      expose({
        getInstance: () => instanceRef.value,
        getElement: () => instanceRef.value?.getElement() ?? containerRef.value,
      });

      // Render function - creates the container element
      return () => {
        return h('div', {
          ref: containerRef,
          'data-universal-component': component.name,
          'data-universal-id': component.id,
          class: 'universal-component-container',
        });
      };
    },
  }) as DefineComponent;
}

/**
 * Create multiple Vue components from a record of Universal components.
 * Useful for batch conversion of Universal component libraries.
 *
 * @param components - Record of Universal components keyed by name
 * @param options - Shared options applied to all components
 * @returns Record of Vue components with the same keys
 *
 * @example
 * ```ts
 * import { toVueMultiple } from '@philjs/universal-vue';
 * import * as UniversalComponents from '@mylib/universal';
 *
 * const vueComponents = toVueMultiple(UniversalComponents);
 * ```
 */
export function toVueMultiple<T extends Record<string, UniversalComponent>>(
  components: T,
  options: ToVueOptions = {}
): { [K in keyof T]: DefineComponent } {
  const result = {} as { [K in keyof T]: DefineComponent };

  for (const [key, component] of Object.entries(components)) {
    result[key as keyof T] = toVue(component as UniversalComponent, options);
  }

  return result;
}

/**
 * Higher-order component that wraps a Universal component with
 * additional Vue-specific features like v-model support.
 *
 * @param component - The Universal component to enhance
 * @param modelProp - The prop name to use for v-model (default: 'modelValue')
 * @returns A Vue component with v-model support
 */
export function toVueWithModel<P extends Record<string, unknown>>(
  component: UniversalComponent<P>,
  modelProp: keyof P = 'modelValue' as keyof P,
  options: ToVueOptions = {}
): DefineComponent {
  const baseVueComponent = toVue(component, options);

  return defineComponent({
    name: `${component.name}WithModel`,

    props: {
      [modelProp]: {
        type: [String, Number, Boolean, Object, Array] as PropType<unknown>,
        default: undefined,
      },
    },

    emits: [`update:${String(modelProp)}`],

    setup(props, { emit, attrs, slots, expose }) {
      // Merge props with attrs for the base component
      const mergedAttrs = { ...attrs, [modelProp]: props[modelProp as keyof typeof props] };

      // Watch for value changes and emit update events for v-model
      watch(
        () => props[modelProp as keyof typeof props],
        (newValue: unknown) => {
          emit(`update:${String(modelProp)}`, newValue);
        }
      );

      return () => h(baseVueComponent, mergedAttrs, slots);
    },
  }) as DefineComponent;
}
