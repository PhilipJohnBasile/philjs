/**
 * Signal Subscriber for React Components.
 * Handles subscription to PhilJS signals and triggers React re-renders.
 */

import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Signal, Memo } from '@philjs/core';
import type { ReactComponent, SignalAwareProps } from '../types.js';
import { isReactive, resolveSignalProps } from '../types.js';

/**
 * Props for the SignalSubscriber component.
 */
export interface SignalSubscriberProps<P extends Record<string, unknown>> {
  /** The React component to render */
  component: ReactComponent<P>;

  /** Props that may contain signals */
  signalAwareProps: SignalAwareProps<P>;

  /** Component display name for debugging */
  displayName?: string;
}

/**
 * Internal store for managing signal subscriptions.
 */
interface SignalStore<P> {
  /** Current resolved props */
  props: P;

  /** Subscribe to all signal changes */
  subscribe: (callback: () => void) => () => void;

  /** Get current snapshot of props */
  getSnapshot: () => P;

  /** Get server snapshot (same as getSnapshot for SSR) */
  getServerSnapshot: () => P;
}

/**
 * Create a signal store for a set of props.
 * Uses useSyncExternalStore pattern for React 18+ concurrent mode safety.
 */
function createSignalStore<P extends Record<string, unknown>>(
  signalAwareProps: SignalAwareProps<P>
): SignalStore<P> {
  // Resolve initial props
  let currentProps = resolveSignalProps(signalAwareProps);

  // Track subscribers
  const subscribers = new Set<() => void>();

  // Collect all reactive values from props
  const reactiveValues: Array<Signal<unknown> | Memo<unknown>> = [];
  for (const value of Object.values(signalAwareProps)) {
    if (isReactive(value)) {
      reactiveValues.push(value as Signal<unknown> | Memo<unknown>);
    }
  }

  // Subscribe function
  const subscribe = (callback: () => void): (() => void) => {
    subscribers.add(callback);

    // Subscribe to all reactive values
    const unsubscribes: Array<() => void> = [];

    for (const reactive of reactiveValues) {
      if (reactive.subscribe) {
        const unsubscribe = reactive.subscribe(() => {
          // Re-resolve props when any signal changes
          currentProps = resolveSignalProps(signalAwareProps);
          // Notify all subscribers
          for (const subscriber of subscribers) {
            subscriber();
          }
        });
        unsubscribes.push(unsubscribe);
      }
    }

    // Return cleanup function
    return () => {
      subscribers.delete(callback);
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  };

  // Snapshot function
  const getSnapshot = (): P => currentProps;

  // Server snapshot (same as getSnapshot for SSR)
  const getServerSnapshot = (): P => resolveSignalProps(signalAwareProps);

  return {
    props: currentProps,
    subscribe,
    getSnapshot,
    getServerSnapshot,
  };
}

/**
 * SignalSubscriber component.
 * Wraps a React component and subscribes to all signal props.
 * Uses useSyncExternalStore for concurrent-safe updates.
 */
export function SignalSubscriber<P extends Record<string, unknown>>({
  component: Component,
  signalAwareProps,
  displayName,
}: SignalSubscriberProps<P>): ReactNode {
  // Create a stable store reference
  const storeRef = useRef<SignalStore<P> | null>(null);

  // Initialize or update store when props change
  if (!storeRef.current) {
    storeRef.current = createSignalStore(signalAwareProps);
  }

  // Use useSyncExternalStore for concurrent-safe subscription
  const resolvedProps = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getServerSnapshot
  );

  // Update store when signalAwareProps reference changes
  useEffect(() => {
    storeRef.current = createSignalStore(signalAwareProps);
  }, [signalAwareProps]);

  // Render the component with resolved props
  return createElement(Component, resolvedProps);
}

/**
 * Higher-order component that wraps a component with signal subscription.
 */
export function withSignalSubscription<P extends Record<string, unknown>>(
  WrappedComponent: ReactComponent<P>
): ReactComponent<SignalAwareProps<P>> {
  const displayName =
    (WrappedComponent as { displayName?: string }).displayName ||
    WrappedComponent.name ||
    'Component';

  function WithSignalSubscription(props: SignalAwareProps<P>): ReactNode {
    return createElement(SignalSubscriber, {
      component: WrappedComponent,
      signalAwareProps: props,
      displayName,
    });
  }

  WithSignalSubscription.displayName = `WithSignalSubscription(${displayName})`;

  return WithSignalSubscription as ReactComponent<SignalAwareProps<P>>;
}

/**
 * Hook to create a stable callback that uses signal values.
 * Ensures the callback always uses the latest signal values without
 * causing unnecessary re-renders.
 */
export function useSignalCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  signals: Array<Signal<unknown> | Memo<unknown>>
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Subscribe to signals to ensure freshness
  useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const unsubscribes = signals.map((signal) =>
          signal.subscribe ? signal.subscribe(notify) : () => {}
        );
        return () => {
          for (const unsubscribe of unsubscribes) {
            unsubscribe();
          }
        };
      },
      [signals]
    ),
    () => callbackRef.current,
    () => callbackRef.current
  );

  return useCallback(
    ((...args: unknown[]) => callbackRef.current(...args)) as T,
    []
  );
}
