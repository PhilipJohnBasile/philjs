/**
 * fromReact - Wrap React components for use in PhilJS.
 *
 * This is the main feature of the @philjs/universal-react package.
 * It converts React components into Universal Components that can be
 * used seamlessly across different frameworks.
 */

import {
  createElement,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { createUniversalComponent, isSignal, isMemo } from '@philjs/universal';
import type { UniversalComponent, UniversalInstance } from '@philjs/universal';
import type {
  FromReactOptions,
  SignalAwareProps,
  ReactComponent,
} from './types.js';
import { resolveSignalProps, hasSignalProps } from './types.js';
import { ErrorBoundary } from './internal/error-boundary.js';
import { SignalSubscriber } from './internal/signal-subscriber.js';

/**
 * Counter for generating unique component IDs.
 */
let componentIdCounter = 0;

/**
 * Generate a unique component ID.
 */
function generateComponentId(name: string): string {
  return `react-${name.toLowerCase().replace(/\s+/g, '-')}-${++componentIdCounter}`;
}

/**
 * Get the display name of a React component.
 */
function getComponentName(component: ComponentType<unknown>): string {
  return (
    (component as { displayName?: string }).displayName ||
    component.name ||
    'ReactComponent'
  );
}

/**
 * Dynamically import react-dom/client.
 * This allows the package to work even if react-dom isn't immediately available.
 */
async function getReactDOMClient(): Promise<{
  createRoot: (container: Element) => {
    render: (element: ReactNode) => void;
    unmount: () => void;
  };
}> {
  // Use dynamic import for react-dom/client
  const ReactDOM = await import('react-dom/client');
  return ReactDOM;
}

/**
 * Wrap a React component for use in PhilJS and other frameworks.
 *
 * This function converts a React component into a Universal Component
 * that follows the Universal Component Protocol. The wrapped component
 * can then be used in PhilJS, Vue, Svelte, or any other framework that
 * supports the Universal Component Protocol.
 *
 * @param ReactComponent - The React component to wrap
 * @param options - Configuration options for the wrapper
 * @returns A Universal Component that can be used across frameworks
 *
 * @example
 * ```tsx
 * import { fromReact } from '@philjs/universal-react';
 * import { signal } from '@philjs/core';
 *
 * // A regular React component
 * function Button({ label, onClick }) {
 *   return <button onClick={onClick}>{label}</button>;
 * }
 *
 * // Wrap it for universal use
 * const UniversalButton = fromReact(Button);
 *
 * // Use in PhilJS with signal props
 * const buttonLabel = signal('Click me');
 * const instance = UniversalButton.mount(container, {
 *   label: buttonLabel, // Signal prop - will auto-update!
 *   onClick: () => console.log('Clicked!'),
 * });
 *
 * // Later, update the signal - React component will re-render
 * buttonLabel.set('Click again!');
 *
 * // Clean up
 * instance.unmount();
 * ```
 *
 * @example
 * ```tsx
 * // With custom error handling
 * const SafeComponent = fromReact(DangerousComponent, {
 *   errorBoundary: true,
 *   errorFallback: ({ error, resetError }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetError}>Retry</button>
 *     </div>
 *   ),
 *   onError: (error, info) => {
 *     logToService(error, info);
 *   },
 * });
 * ```
 */
export function fromReact<P extends Record<string, unknown>>(
  ReactComponent: ReactComponent<P>,
  options: FromReactOptions<P> = {}
): UniversalComponent<SignalAwareProps<P>> {
  const {
    id = generateComponentId(getComponentName(ReactComponent)),
    name = getComponentName(ReactComponent),
    errorBoundary = true,
    errorFallback,
    onError,
    transformProps,
    subscribeToSignals = true,
    propsAreEqual,
  } = options;

  return createUniversalComponent<SignalAwareProps<P>>({
    id,
    name,
    source: 'react',

    mount(container, signalAwareProps, utils) {
      const { emitLifecycle, onPropsChange } = utils;

      // Track React root and cleanup
      let reactRoot: ReturnType<
        Awaited<ReturnType<typeof getReactDOMClient>>['createRoot']
      > | null = null;
      let mounted = false;
      let currentProps = signalAwareProps;
      const signalCleanups: Array<() => void> = [];

      /**
       * Resolve signal props to actual values.
       */
      function resolveProps(): P {
        const resolved = resolveSignalProps(currentProps);
        return transformProps ? transformProps(resolved) : resolved;
      }

      /**
       * Create the React element tree.
       */
      function createReactTree(): ReactNode {
        const resolvedProps = resolveProps();

        // Create the component element
        let element: ReactNode;

        if (subscribeToSignals && hasSignalProps(currentProps)) {
          // Use SignalSubscriber for automatic signal updates
          element = createElement(SignalSubscriber, {
            component: ReactComponent,
            signalAwareProps: currentProps,
            displayName: name,
          });
        } else {
          // No signal props, render directly
          element = createElement(ReactComponent, resolvedProps);
        }

        // Optionally wrap in error boundary
        if (errorBoundary) {
          element = createElement(
            ErrorBoundary,
            {
              fallback: errorFallback,
              onError: (error: Error, errorInfo: ErrorInfo) => {
                emitLifecycle('error', error);
                onError?.(error, errorInfo);
              },
            },
            element
          );
        }

        return element;
      }

      /**
       * Render the React component.
       */
      function render(): void {
        if (!reactRoot || !mounted) return;

        try {
          reactRoot.render(createReactTree());
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          emitLifecycle('error', err);
          onError?.(err, { componentStack: '' });
        }
      }

      /**
       * Set up signal subscriptions.
       */
      function setupSignalSubscriptions(): void {
        // Clear existing subscriptions
        for (const cleanup of signalCleanups) {
          cleanup();
        }
        signalCleanups.length = 0;

        if (!subscribeToSignals) return;

        // Subscribe to each signal prop
        for (const [key, value] of Object.entries(currentProps)) {
          if (isSignal(value) || isMemo(value)) {
            const unsubscribe = (value as { subscribe: (fn: () => void) => () => void }).subscribe(
              () => {
                // Re-render when signal changes
                render();
              }
            );
            signalCleanups.push(unsubscribe);
          }
        }
      }

      // Initialize React root asynchronously
      const initPromise = getReactDOMClient()
        .then((ReactDOM) => {
          if (!mounted) {
            // Create React root
            reactRoot = ReactDOM.createRoot(container);
            mounted = true;

            // Set up signal subscriptions
            setupSignalSubscriptions();

            // Initial render
            render();
          }
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          emitLifecycle('error', err);
          console.error('[fromReact] Failed to initialize React root:', error);
        });

      // Subscribe to prop changes from the universal component system
      const propsCleanup = onPropsChange((newProps) => {
        // Skip if props haven't actually changed
        if (propsAreEqual && propsAreEqual(resolveProps(), resolveSignalProps(newProps))) {
          return;
        }

        currentProps = newProps;
        setupSignalSubscriptions();
        render();
      });

      return {
        update(newProps: Record<string, unknown>) {
          // Skip if props haven't actually changed
          const resolvedNew = resolveSignalProps(newProps as SignalAwareProps<P>);
          if (propsAreEqual && propsAreEqual(resolveProps(), resolvedNew)) {
            return;
          }

          currentProps = { ...currentProps, ...newProps } as SignalAwareProps<P>;
          setupSignalSubscriptions();
          render();
        },

        cleanup() {
          // Clean up signal subscriptions
          for (const cleanup of signalCleanups) {
            cleanup();
          }
          signalCleanups.length = 0;

          // Clean up props change subscription
          propsCleanup();

          // Unmount React root
          mounted = false;
          if (reactRoot) {
            try {
              reactRoot.unmount();
            } catch (error) {
              console.error('[fromReact] Error unmounting React root:', error);
            }
            reactRoot = null;
          }
        },

        getElement() {
          return container;
        },
      };
    },

    serialize(props) {
      return {
        componentId: id,
        props: resolveSignalProps(props ?? ({} as SignalAwareProps<P>)),
        timestamp: Date.now(),
      };
    },
  });
}

/**
 * Batch wrap multiple React components.
 *
 * @param components - Object mapping names to React components
 * @param options - Shared options for all wrapped components
 * @returns Object mapping names to Universal Components
 *
 * @example
 * ```tsx
 * import { fromReactBatch } from '@philjs/universal-react';
 *
 * const universalComponents = fromReactBatch({
 *   Button: MyButton,
 *   Input: MyInput,
 *   Card: MyCard,
 * }, {
 *   errorBoundary: true,
 * });
 *
 * // Use individually
 * universalComponents.Button.mount(container, { label: 'Click' });
 * ```
 */
export function fromReactBatch<
  T extends Record<string, ReactComponent<Record<string, unknown>>>,
>(
  components: T,
  options: Omit<FromReactOptions<Record<string, unknown>>, 'id' | 'name'> = {}
): { [K in keyof T]: UniversalComponent<SignalAwareProps<Parameters<T[K]>[0]>> } {
  const result: Record<string, UniversalComponent<SignalAwareProps<Record<string, unknown>>>> = {};

  for (const [key, component] of Object.entries(components)) {
    result[key] = fromReact(component, {
      ...options,
      name: key,
    });
  }

  return result as { [K in keyof T]: UniversalComponent<SignalAwareProps<Parameters<T[K]>[0]>> };
}
