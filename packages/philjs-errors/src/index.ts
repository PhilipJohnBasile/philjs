/**
 * PhilJS Error Tracking
 *
 * Unified error tracking and monitoring for PhilJS applications.
 * Supports Sentry, LogRocket, Rollbar, and custom integrations.
 */

export interface ErrorContext {
  /** Component name where error occurred */
  component?: string;
  /** Signal name if error is signal-related */
  signal?: string;
  /** Route path */
  route?: string;
  /** User ID */
  userId?: string;
  /** Additional tags */
  tags?: Record<string, string>;
  /** Extra data */
  extra?: Record<string, unknown>;
}

export interface ErrorTracker {
  /** Initialize the tracker */
  init(options: TrackerOptions): void;
  /** Capture an error */
  captureError(error: Error, context?: ErrorContext): void;
  /** Capture a message */
  captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext): void;
  /** Set user context */
  setUser(user: UserContext | null): void;
  /** Add breadcrumb */
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  /** Start a transaction/span */
  startSpan(name: string, op: string): Span;
  /** Flush pending events */
  flush(timeout?: number): Promise<boolean>;
}

export interface TrackerOptions {
  /** DSN or API key */
  dsn: string;
  /** Environment name */
  environment?: string;
  /** Release version */
  release?: string;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Ignored errors */
  ignoreErrors?: (string | RegExp)[];
  /** Before send hook */
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface Breadcrumb {
  type?: 'navigation' | 'http' | 'ui' | 'user' | 'debug' | 'error';
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error' | 'debug';
  timestamp?: number;
}

export interface Span {
  name: string;
  op: string;
  finish(): void;
  setTag(key: string, value: string): void;
  setData(key: string, value: unknown): void;
}

export interface ErrorEvent {
  message?: string;
  error?: Error;
  context?: ErrorContext;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'fatal';
}

// Global error tracker instance
let globalTracker: ErrorTracker | null = null;

/**
 * Initialize error tracking
 */
export function initErrorTracking(tracker: ErrorTracker, options: TrackerOptions): void {
  globalTracker = tracker;
  tracker.init(options);
  setupGlobalHandlers();
}

/**
 * Get the current error tracker
 */
export function getErrorTracker(): ErrorTracker | null {
  return globalTracker;
}

/**
 * Capture an error
 */
export function captureError(error: Error, context?: ErrorContext): void {
  if (globalTracker) {
    globalTracker.captureError(error, context);
  } else {
    console.error('[PhilJS Error]', error, context);
  }
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  if (globalTracker) {
    globalTracker.captureMessage(message, level, context);
  } else {
    console.log(`[PhilJS ${level}]`, message, context);
  }
}

/**
 * Set user context
 */
export function setUser(user: UserContext | null): void {
  globalTracker?.setUser(user);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  globalTracker?.addBreadcrumb(breadcrumb);
}

/**
 * Create an error boundary wrapper
 */
export function createErrorBoundary(options: {
  fallback?: (error: Error) => any;
  onError?: (error: Error, context: ErrorContext) => void;
  componentName?: string;
}) {
  return function ErrorBoundary(props: { children: any }) {
    // This would integrate with PhilJS's component system
    return {
      type: 'error-boundary',
      props: {
        ...options,
        children: props.children,
      },
    };
  };
}

/**
 * Setup global error handlers
 */
function setupGlobalHandlers(): void {
  if (typeof window === 'undefined') return;

  // Unhandled errors
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    captureError(error, {
      tags: { type: 'unhandledrejection' },
    });
  });
}

/**
 * Performance monitoring
 */
export function startSpan(name: string, op: string): Span {
  if (globalTracker) {
    return globalTracker.startSpan(name, op);
  }

  // Fallback span
  const start = performance.now();
  return {
    name,
    op,
    finish() {
      const duration = performance.now() - start;
      console.log(`[PhilJS Span] ${name} (${op}): ${duration.toFixed(2)}ms`);
    },
    setTag() {},
    setData() {},
  };
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    const span = startSpan(fn.name || 'anonymous', 'function');
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, context);
      throw error;
    } finally {
      span.finish();
    }
  }) as T;
}

/**
 * Signal error wrapper
 */
export function trackSignalErrors<T>(
  signalName: string,
  getValue: () => T
): () => T {
  return () => {
    try {
      return getValue();
    } catch (error) {
      captureError(error as Error, {
        signal: signalName,
        tags: { type: 'signal-error' },
      });
      throw error;
    }
  };
}

// Re-export integrations
export { createSentryTracker } from './sentry';
export { createLogRocketTracker } from './logrocket';
export { createRollbarTracker } from './rollbar';
