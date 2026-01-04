/**
 * Universal Component Implementation
 * Base utilities for creating universal components.
 */

import type {
  UniversalComponent,
  UniversalInstance,
  FrameworkSource,
  LifecycleEvent,
  LifecycleHandler,
  ErrorHandler,
  SerializedState,
} from '../types.js';
import { isSignal, isMemo } from '../types.js';
import { getGlobalRegistry } from './registry.js';
import {
  getGlobalLifecycleManager,
  generateInstanceId,
} from './lifecycle.js';
import { createScopedEventTunnel, type EventTunnelImpl } from '../bridge/event-bridge.js';
import { createScopedContextBridge, type ContextBridge } from '../bridge/context-bridge.js';
import { resolveProps } from '../bridge/signal-bridge.js';

/**
 * Options for creating a universal component
 */
export interface CreateComponentOptions<Props> {
  /** Unique identifier for the component */
  id: string;

  /** Display name */
  name: string;

  /** Source framework */
  source: FrameworkSource;

  /** Version (optional) */
  version?: string;

  /**
   * Mount function - called when the component is mounted to the DOM.
   * Receives the container, resolved props, and utilities.
   */
  mount: (
    container: HTMLElement,
    props: Props,
    utils: MountUtilities<Props>
  ) => MountResult | Promise<MountResult>;

  /**
   * Serialize function for SSR (optional)
   */
  serialize?: (props: Props) => SerializedState;
}

/**
 * Utilities provided to the mount function
 */
export interface MountUtilities<Props> {
  /** Event tunnel for this component */
  eventTunnel: EventTunnelImpl;

  /** Context bridge for this component */
  contextBridge: ContextBridge;

  /** Emit a lifecycle event */
  emitLifecycle: (event: LifecycleEvent, error?: Error) => void;

  /** Subscribe to prop changes (for signal props) */
  onPropsChange: (callback: (newProps: Props) => void) => () => void;

  /** Get current resolved props */
  getResolvedProps: () => Props;
}

/**
 * Result from the mount function
 */
export interface MountResult {
  /** Update the component with new props */
  update?: (props: Record<string, unknown>) => void;

  /** Cleanup function called on unmount */
  cleanup?: () => void;

  /** Get the root element (if different from container) */
  getElement?: () => HTMLElement;
}

/**
 * Create a universal component
 */
export function createUniversalComponent<Props extends Record<string, unknown>>(
  options: CreateComponentOptions<Props>
): UniversalComponent<Props> {
  const { id, name, source, version, mount: mountFn, serialize } = options;

  const component: UniversalComponent<Props> = {
    id,
    name,
    source,
    version,

    mount(container: HTMLElement, props: Props): UniversalInstance<Props> {
      const instanceId = generateInstanceId(name);
      const lifecycleManager = getGlobalLifecycleManager();
      const lifecycleHandle = lifecycleManager.register(instanceId);

      // Create scoped bridges
      const eventTunnel = createScopedEventTunnel(instanceId);
      const contextBridge = createScopedContextBridge();

      // Track current props and resolved props
      let currentProps = props;
      let resolvedProps = resolveProps(props) as Props;
      const propChangeCallbacks = new Set<(newProps: Props) => void>();

      // Set up signal subscriptions for reactive props
      const signalCleanups: Array<() => void> = [];

      function setupSignalSubscriptions(propsToWatch: Props): void {
        // Clear existing subscriptions
        for (const cleanup of signalCleanups) {
          cleanup();
        }
        signalCleanups.length = 0;

        // Subscribe to signal props
        for (const [key, value] of Object.entries(propsToWatch)) {
          if (isSignal(value) || isMemo(value)) {
            const unsubscribe = value.subscribe(() => {
              resolvedProps = resolveProps(currentProps) as Props;
              for (const callback of propChangeCallbacks) {
                callback(resolvedProps);
              }
            });
            signalCleanups.push(unsubscribe);
          }
        }
      }

      setupSignalSubscriptions(props);

      // Mount utilities
      const utils: MountUtilities<Props> = {
        eventTunnel,
        contextBridge,

        emitLifecycle: (event, error) => {
          lifecycleManager.emit(instanceId, event, error);
        },

        onPropsChange: (callback) => {
          propChangeCallbacks.add(callback);
          return () => propChangeCallbacks.delete(callback);
        },

        getResolvedProps: () => resolvedProps,
      };

      // Emit beforeMount
      lifecycleManager.emit(instanceId, 'beforeMount');

      // Call the mount function
      let mountResult: MountResult = {};
      let mountError: Error | null = null;

      try {
        const result = mountFn(container, resolvedProps, utils);
        if (result instanceof Promise) {
          // Handle async mount
          result
            .then((r) => {
              mountResult = r;
              lifecycleManager.emit(instanceId, 'mounted');
            })
            .catch((e) => {
              mountError = e instanceof Error ? e : new Error(String(e));
              lifecycleManager.emit(instanceId, 'error', mountError);
            });
        } else {
          mountResult = result;
          lifecycleManager.emit(instanceId, 'mounted');
        }
      } catch (e) {
        mountError = e instanceof Error ? e : new Error(String(e));
        lifecycleManager.emit(instanceId, 'error', mountError);
      }

      // Create instance
      const instance: UniversalInstance<Props> = {
        get props() {
          return currentProps;
        },

        get element() {
          return container;
        },

        get component() {
          return component;
        },

        update(newProps: Partial<Props>) {
          lifecycleManager.emit(instanceId, 'beforeUpdate');

          // Merge props
          currentProps = { ...currentProps, ...newProps };

          // Re-setup signal subscriptions
          setupSignalSubscriptions(currentProps);

          // Resolve new props
          resolvedProps = resolveProps(currentProps) as Props;

          // Call update if provided
          if (mountResult.update) {
            try {
              mountResult.update(resolvedProps);
            } catch (e) {
              const error = e instanceof Error ? e : new Error(String(e));
              lifecycleManager.emit(instanceId, 'error', error);
            }
          }

          // Notify prop change callbacks
          for (const callback of propChangeCallbacks) {
            callback(resolvedProps);
          }

          lifecycleManager.emit(instanceId, 'updated');
        },

        unmount() {
          lifecycleManager.emit(instanceId, 'beforeUnmount');

          // Cleanup signal subscriptions
          for (const cleanup of signalCleanups) {
            cleanup();
          }
          signalCleanups.length = 0;

          // Clear callbacks
          propChangeCallbacks.clear();

          // Call cleanup
          if (mountResult.cleanup) {
            try {
              mountResult.cleanup();
            } catch (e) {
              console.error(`[${name}] Cleanup error:`, e);
            }
          }

          // Dispose event tunnel
          eventTunnel.dispose();

          // Untrack from registry
          getGlobalRegistry().untrackInstance(id, instance);

          // Unregister lifecycle
          lifecycleManager.unregister(instanceId);

          lifecycleManager.emit(instanceId, 'unmounted');
        },

        on(event: LifecycleEvent, handler: LifecycleHandler): () => void {
          return lifecycleHandle.on(event, handler);
        },

        onError(handler: ErrorHandler): () => void {
          return lifecycleHandle.onError(handler);
        },

        getElement(): HTMLElement {
          if (mountResult.getElement) {
            return mountResult.getElement();
          }
          return container;
        },
      };

      // Track instance in registry
      getGlobalRegistry().trackInstance(id, instance);

      return instance;
    },

    serialize: serialize
      ? (props?: Props) => serialize(props ?? ({} as Props))
      : undefined,
  };

  return component;
}

/**
 * Create a simple wrapper component for existing DOM manipulation code
 */
export function createSimpleComponent<Props extends Record<string, unknown>>(
  id: string,
  name: string,
  render: (container: HTMLElement, props: Props) => (() => void) | void
): UniversalComponent<Props> {
  return createUniversalComponent<Props>({
    id,
    name,
    source: 'philjs',

    mount(container, props) {
      const cleanup = render(container, props);
      return {
        cleanup: typeof cleanup === 'function' ? cleanup : undefined,
      };
    },
  });
}

/**
 * Create a lazy-loaded component
 */
export function createLazyComponent<Props extends Record<string, unknown>>(
  id: string,
  name: string,
  loader: () => Promise<UniversalComponent<Props>>
): UniversalComponent<Props> {
  let loadedComponent: UniversalComponent<Props> | null = null;
  let loadPromise: Promise<UniversalComponent<Props>> | null = null;

  return {
    id,
    name,
    source: 'custom',

    mount(container, props) {
      // Show loading placeholder
      const placeholder = document.createElement('div');
      placeholder.setAttribute('data-lazy-loading', name);
      container.appendChild(placeholder);

      let instance: UniversalInstance<Props> | null = null;
      let unmounted = false;

      // Load the component
      const load = async () => {
        if (!loadPromise) {
          loadPromise = loader();
        }
        loadedComponent = await loadPromise;

        if (!unmounted) {
          // Replace placeholder with actual component
          placeholder.remove();
          instance = loadedComponent.mount(container, props);
        }
      };

      load().catch((error) => {
        console.error(`[LazyComponent: ${name}] Failed to load:`, error);
        placeholder.textContent = `Failed to load ${name}`;
      });

      return {
        props,
        element: container,
        component: this,

        update(newProps) {
          if (instance) {
            instance.update(newProps);
          }
        },

        unmount() {
          unmounted = true;
          if (instance) {
            instance.unmount();
          }
          placeholder.remove();
        },

        on(event, handler) {
          if (instance) {
            return instance.on(event, handler);
          }
          return () => {};
        },

        onError(handler) {
          if (instance) {
            return instance.onError(handler);
          }
          return () => {};
        },

        getElement() {
          if (instance) {
            return instance.getElement();
          }
          return container;
        },
      } as UniversalInstance<Props>;
    },
  };
}
