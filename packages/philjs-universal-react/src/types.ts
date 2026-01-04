/**
 * Types for the React Universal Component Protocol adapter.
 * Provides type definitions for bridging React components with PhilJS.
 */

import type { ComponentType, ReactNode, ErrorInfo } from 'react';
import type { Signal, Memo } from '@philjs/core';
import type { UniversalComponent, UniversalInstance } from '@philjs/universal';

// ============================================================================
// React Component Types
// ============================================================================

/**
 * Generic React component type that can be wrapped.
 * Supports both function components and class components.
 */
export type ReactComponent<P = Record<string, unknown>> = ComponentType<P>;

/**
 * Props that can include PhilJS signals.
 * Allows passing signals directly to wrapped React components.
 */
export type SignalAwareProps<P> = {
  [K in keyof P]: P[K] | Signal<P[K]> | Memo<P[K]>;
};

/**
 * Extract raw prop types from signal-aware props.
 * Used internally to resolve signal values before passing to React.
 */
export type ExtractRawProps<P> = {
  [K in keyof P]: P[K] extends Signal<infer T>
    ? T
    : P[K] extends Memo<infer T>
      ? T
      : P[K];
};

// ============================================================================
// fromReact Options
// ============================================================================

/**
 * Options for wrapping a React component as a Universal Component.
 */
export interface FromReactOptions<P = Record<string, unknown>> {
  /**
   * Unique identifier for the universal component.
   * If not provided, a generated ID will be used.
   */
  id?: string;

  /**
   * Display name for the component.
   * Defaults to the React component's displayName or name.
   */
  name?: string;

  /**
   * Whether to wrap the component in an error boundary.
   * @default true
   */
  errorBoundary?: boolean;

  /**
   * Custom error fallback component.
   * Receives the error and a reset function.
   */
  errorFallback?: ComponentType<ErrorFallbackProps>;

  /**
   * Callback when an error occurs.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Props transformation function.
   * Called before props are passed to the React component.
   */
  transformProps?: (props: P) => P;

  /**
   * Whether to automatically subscribe to signal props.
   * @default true
   */
  subscribeToSignals?: boolean;

  /**
   * Custom comparison function for props.
   * Used to determine if props have changed.
   */
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean;
}

/**
 * Props passed to the error fallback component.
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;

  /** Error info from React */
  errorInfo?: ErrorInfo;

  /** Function to reset the error state and retry rendering */
  resetError: () => void;
}

// ============================================================================
// toReact Options
// ============================================================================

/**
 * Options for converting a Universal Component to a React component.
 */
export interface ToReactOptions {
  /**
   * Whether to forward refs to the universal component's container.
   * @default false
   */
  forwardRef?: boolean;

  /**
   * CSS class name for the container element.
   */
  className?: string;

  /**
   * Inline styles for the container element.
   */
  style?: React.CSSProperties;

  /**
   * Tag name for the container element.
   * @default 'div'
   */
  as?: keyof HTMLElementTagNameMap;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for the useSignal hook.
 */
export interface UseSignalOptions {
  /**
   * Custom equality function for change detection.
   */
  equals?: <T>(a: T, b: T) => boolean;
}

/**
 * Return type for useSignalState hook.
 */
export type SignalStateTuple<T> = [value: T, setValue: (value: T | ((prev: T) => T)) => void];

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Internal wrapper state for managing React component mounting.
 * @internal
 */
export interface ReactWrapperState<P> {
  /** Current resolved props */
  props: P;

  /** Signal subscriptions cleanup functions */
  cleanups: Array<() => void>;

  /** Whether the component is mounted */
  mounted: boolean;

  /** Error state */
  error: Error | null;
}

/**
 * Props for the internal signal subscriber wrapper.
 * @internal
 */
export interface SignalSubscriberProps<P> {
  /** The wrapped React component */
  component: ReactComponent<P>;

  /** Initial props (may contain signals) */
  signalAwareProps: SignalAwareProps<P>;

  /** Callback when resolved props change */
  onPropsChange?: (props: P) => void;
}

/**
 * Universal instance extended with React-specific data.
 * @internal
 */
export interface ReactUniversalInstance<P> extends UniversalInstance<P> {
  /** React root for the mounted component */
  readonly reactRoot: unknown; // React 18+ Root type
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a PhilJS signal.
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    'set' in value &&
    'subscribe' in value &&
    'peek' in value
  );
}

/**
 * Check if a value is a PhilJS memo/computed.
 */
export function isMemo<T>(value: unknown): value is Memo<T> {
  return (
    typeof value === 'function' &&
    'subscribe' in value &&
    !('set' in value)
  );
}

/**
 * Check if a value is reactive (signal or memo).
 */
export function isReactive<T>(value: unknown): value is Signal<T> | Memo<T> {
  return isSignal(value) || isMemo(value);
}

/**
 * Check if props contain any signals.
 */
export function hasSignalProps<P extends Record<string, unknown>>(
  props: P
): boolean {
  for (const value of Object.values(props)) {
    if (isReactive(value)) {
      return true;
    }
  }
  return false;
}

/**
 * Resolve signal-aware props to plain props.
 */
export function resolveSignalProps<P extends Record<string, unknown>>(
  props: SignalAwareProps<P>
): P {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (isReactive(value)) {
      // Use peek() to avoid tracking in the wrong context
      resolved[key] = (value as Signal<unknown> | Memo<unknown>).peek
        ? (value as Signal<unknown>).peek()
        : (value as Signal<unknown> | Memo<unknown>)();
    } else {
      resolved[key] = value;
    }
  }

  return resolved as P;
}
