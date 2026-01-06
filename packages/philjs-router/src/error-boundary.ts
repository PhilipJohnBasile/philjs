/**
 * Route error boundaries for PhilJS Router.
 * Provides Remix-style error handling per route segment.
 *
 * @example
 * ```tsx
 * // routes/users/[id].tsx
 * export async function loader({ params }) {
 *   const user = await fetchUser(params.id);
 *   if (!user) {
 *     throw new Response("Not Found", { status: 404 });
 *   }
 *   return { user };
 * }
 *
 * export function ErrorBoundary() {
 *   const error = useRouteError();
 *
 *   if (isRouteErrorResponse(error)) {
 *     return (
 *       <div>
 *         <h1>{error.status} {error.statusText}</h1>
 *         <p>{error.data}</p>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Something went wrong!</h1>
 *       <p>{error.message}</p>
 *     </div>
 *   );
 * }
 *
 * export default function UserDetail() {
 *   const { user } = useLoaderData();
 *   return <UserProfile user={user} />;
 * }
 * ```
 */

import { signal } from "@philjs/core";
import type { JSXElement, VNode } from "@philjs/core";

// ============================================================================
// Types
// ============================================================================

/**
 * Error response thrown from loaders/actions.
 */
export type RouteErrorResponse = {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response data (usually error message) */
  data: unknown;
  /** Whether this is an internal error (not from Response) */
  internal: boolean;
};

/**
 * Error that can be caught by route error boundaries.
 */
export type RouteError = Error | RouteErrorResponse;

/**
 * Error boundary component props.
 */
export type ErrorBoundaryProps = {
  /** The caught error */
  error: RouteError;
  /** Reset the error boundary */
  reset?: () => void;
  /** Route params */
  params?: Record<string, string>;
  /** Children (rendered when no error) */
  children?: VNode | JSXElement | string | null;
};

/**
 * Error boundary component type.
 */
export type ErrorBoundaryComponent = (
  props: ErrorBoundaryProps
) => VNode | JSXElement | string | null;

/**
 * Error context for a route.
 */
export type RouteErrorContext = {
  /** Route ID where error occurred */
  routeId: string;
  /** The error */
  error: RouteError;
  /** Whether this error has been handled */
  handled: boolean;
};

// ============================================================================
// State Management
// ============================================================================

/**
 * Global error store keyed by route ID.
 */
const routeErrorsSignal = signal<Map<string, RouteErrorContext>>(new Map());

/**
 * Current route's error for useRouteError hook.
 */
const currentRouteErrorSignal = signal<RouteError | null>(null);

/**
 * Stack of error contexts for the current route hierarchy.
 */
const errorStackSignal = signal<RouteErrorContext[]>([]);

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Check if an error is a RouteErrorResponse.
 */
export function isRouteErrorResponse(error: unknown): error is RouteErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "statusText" in error &&
    "data" in error &&
    typeof (error as RouteErrorResponse).status === "number"
  );
}

/**
 * Create a RouteErrorResponse from a Response object.
 */
export async function createRouteErrorResponse(
  response: Response
): Promise<RouteErrorResponse> {
  let data: unknown;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data,
    internal: false,
  };
}

/**
 * Create a RouteErrorResponse from an Error.
 */
export function createErrorResponse(
  error: Error,
  status: number = 500
): RouteErrorResponse {
  return {
    status,
    statusText: getStatusText(status),
    data: error.message,
    internal: true,
  };
}

/**
 * Throw a Response as an error (Remix-style).
 */
export function throwResponse(
  data: unknown,
  init?: ResponseInit | number
): never {
  const status = typeof init === "number" ? init : init?.status ?? 500;
  const statusText = getStatusText(status);

  const error: RouteErrorResponse = {
    status,
    statusText,
    data,
    internal: false,
  };

  throw error;
}

/**
 * Throw a 404 Not Found error.
 */
export function throwNotFound(message?: string): never {
  throwResponse(message || "Not Found", 404);
}

/**
 * Throw a 401 Unauthorized error.
 */
export function throwUnauthorized(message?: string): never {
  throwResponse(message || "Unauthorized", 401);
}

/**
 * Throw a 403 Forbidden error.
 */
export function throwForbidden(message?: string): never {
  throwResponse(message || "Forbidden", 403);
}

/**
 * Throw a 400 Bad Request error.
 */
export function throwBadRequest(message?: string): never {
  throwResponse(message || "Bad Request", 400);
}

/**
 * Throw a 500 Internal Server Error.
 */
export function throwServerError(message?: string): never {
  throwResponse(message || "Internal Server Error", 500);
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the current route's error.
 *
 * @example
 * ```tsx
 * export function ErrorBoundary() {
 *   const error = useRouteError();
 *
 *   if (isRouteErrorResponse(error)) {
 *     return <h1>{error.status}: {error.data}</h1>;
 *   }
 *
 *   return <h1>Error: {error.message}</h1>;
 * }
 * ```
 */
export function useRouteError(): RouteError {
  const error = currentRouteErrorSignal();

  if (!error) {
    throw new Error(
      "[PhilJS Router] useRouteError must be used inside an ErrorBoundary component."
    );
  }

  return error;
}

/**
 * Hook to access error for a specific route.
 */
export function useRouteErrorById(routeId: string): RouteError | undefined {
  const errors = routeErrorsSignal();
  return errors.get(routeId)?.error;
}

/**
 * Hook to check if the current route has an error.
 */
export function useHasRouteError(): boolean {
  return currentRouteErrorSignal() !== null;
}

/**
 * Hook to get all route errors in the hierarchy.
 */
export function useRouteErrors(): RouteErrorContext[] {
  return errorStackSignal();
}

// ============================================================================
// Error Management
// ============================================================================

/**
 * Set an error for a route.
 */
export function setRouteError(routeId: string, error: RouteError): void {
  const errors = new Map(routeErrorsSignal());
  errors.set(routeId, { routeId, error, handled: false });
  routeErrorsSignal.set(errors);
}

/**
 * Set the current route's error for useRouteError.
 */
export function setCurrentRouteError(error: RouteError | null): void {
  currentRouteErrorSignal.set(error);
}

/**
 * Clear error for a route.
 */
export function clearRouteError(routeId: string): void {
  const errors = new Map(routeErrorsSignal());
  errors.delete(routeId);
  routeErrorsSignal.set(errors);
}

/**
 * Clear all route errors.
 */
export function clearAllRouteErrors(): void {
  routeErrorsSignal.set(new Map());
  currentRouteErrorSignal.set(null);
  errorStackSignal.set([]);
}

/**
 * Mark an error as handled.
 */
export function markErrorHandled(routeId: string): void {
  const errors = new Map(routeErrorsSignal());
  const context = errors.get(routeId);
  if (context) {
    errors.set(routeId, { ...context, handled: true });
    routeErrorsSignal.set(errors);
  }
}

/**
 * Set the error stack for the current route hierarchy.
 */
export function setErrorStack(stack: RouteErrorContext[]): void {
  errorStackSignal.set(stack);
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Props for the RouteErrorBoundary component.
 */
export type RouteErrorBoundaryProps = {
  /** Route ID for this boundary */
  routeId: string;
  /** Error boundary component to render on error */
  errorElement?: ErrorBoundaryComponent;
  /** Default error element if no custom one provided */
  fallback?: VNode | JSXElement | string | null;
  /** Children to render when no error */
  children?: VNode | JSXElement | string | null;
  /** Route params */
  params?: Record<string, string>;
};

/**
 * Route error boundary component.
 * Catches errors in child components and renders error UI.
 *
 * @example
 * ```tsx
 * <RouteErrorBoundary
 *   routeId="users/:id"
 *   errorElement={UserErrorBoundary}
 * >
 *   <UserDetail />
 * </RouteErrorBoundary>
 * ```
 */
export function RouteErrorBoundary(
  props: RouteErrorBoundaryProps
): VNode | JSXElement | string | null {
  const { routeId, errorElement, fallback, children, params } = props;

  const errors = routeErrorsSignal();
  const context = errors.get(routeId);

  if (context && !context.handled) {
    // Set current error for useRouteError hook
    setCurrentRouteError(context.error);
    markErrorHandled(routeId);

    if (errorElement) {
      const props: ErrorBoundaryProps = {
        error: context.error,
        reset: () => clearRouteError(routeId),
      };
      if (params !== undefined) {
        props.params = params;
      }
      return errorElement(props);
    }

    if (fallback) {
      return fallback;
    }

    // Default error UI
    return DefaultErrorBoundary({ error: context.error });
  }

  // No error, render children
  setCurrentRouteError(null);
  return children || null;
}

/**
 * Default error boundary component.
 */
export function DefaultErrorBoundary(
  props: Pick<ErrorBoundaryProps, "error">
): VNode {
  const { error } = props;

  if (isRouteErrorResponse(error)) {
    return {
      type: "div",
      props: {
        className: "philjs-route-error",
        style: "padding: 20px; text-align: center;",
        children: [
          {
            type: "h1",
            props: {
              style: "color: #e53e3e;",
              children: `${error.status} ${error.statusText}`,
            },
          },
          {
            type: "p",
            props: {
              children: String(error.data),
            },
          },
        ],
      },
    };
  }

  const message = error instanceof Error ? error.message : String(error);

  return {
    type: "div",
    props: {
      className: "philjs-route-error",
      style: "padding: 20px; text-align: center;",
      children: [
        {
          type: "h1",
          props: {
            style: "color: #e53e3e;",
            children: "Something went wrong",
          },
        },
        {
          type: "p",
          props: {
            children: message,
          },
        },
        {
          type: "pre",
          props: {
            style:
              "text-align: left; background: #f7fafc; padding: 16px; border-radius: 4px; overflow: auto;",
            children: error instanceof Error ? error.stack : "",
          },
        },
      ],
    },
  };
}

// ============================================================================
// Error Catching Utilities
// ============================================================================

/**
 * Wrap an async function with error catching.
 */
export async function catchRouteError<T>(
  routeId: string,
  fn: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Response) {
      const errorResponse = await createRouteErrorResponse(error);
      setRouteError(routeId, errorResponse);
    } else if (isRouteErrorResponse(error)) {
      setRouteError(routeId, error);
    } else if (error instanceof Error) {
      setRouteError(routeId, error);
    } else {
      setRouteError(routeId, new Error(String(error)));
    }
    return undefined;
  }
}

/**
 * Handle an error and determine which route should render the error boundary.
 */
export function handleRouteError(
  error: unknown,
  matches: Array<{ id: string; route: { errorElement?: ErrorBoundaryComponent } }>
): { routeId: string; error: RouteError } | null {
  // Convert to RouteError
  let routeError: RouteError;

  if (isRouteErrorResponse(error)) {
    routeError = error;
  } else if (error instanceof Error) {
    routeError = error;
  } else {
    routeError = new Error(String(error));
  }

  // Find the closest error boundary (walking up from leaf to root)
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]!;
    if (match.route.errorElement) {
      setRouteError(match.id, routeError);
      return { routeId: match.id, error: routeError };
    }
  }

  // No error boundary found, use root
  if (matches.length > 0) {
    const rootMatch = matches[0]!;
    setRouteError(rootMatch.id, routeError);
    return { routeId: rootMatch.id, error: routeError };
  }

  return null;
}

// ============================================================================
// HTTP Status Helpers
// ============================================================================

/**
 * Get status text for an HTTP status code.
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    410: "Gone",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return statusTexts[status] || "Unknown";
}

/**
 * Check if status code indicates a client error (4xx).
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Check if status code indicates a server error (5xx).
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Check if status code indicates success (2xx).
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

// ============================================================================
// Error Recovery
// ============================================================================

/**
 * Options for error recovery.
 */
export type ErrorRecoveryOptions = {
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Errors that should trigger retry */
  retryOn?: (error: RouteError) => boolean;
};

/**
 * Retry a function with error recovery.
 */
export async function withErrorRecovery<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    retryOn = () => true,
  } = options;

  let lastError: RouteError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const routeError = isRouteErrorResponse(error)
        ? error
        : error instanceof Error
        ? error
        : new Error(String(error));

      lastError = routeError;

      if (attempt < maxRetries && retryOn(routeError)) {
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Create a retry handler for specific error types.
 */
export function createRetryHandler(
  statusCodes: number[]
): (error: RouteError) => boolean {
  return (error: RouteError) => {
    if (isRouteErrorResponse(error)) {
      return statusCodes.includes(error.status);
    }
    return false;
  };
}

// ============================================================================
// Enhanced Nested Error Boundaries (P4 Feature)
// ============================================================================

/**
 * Configuration for nested error boundaries.
 */
export type NestedErrorBoundaryConfig = {
  /** Recovery strategy when error occurs */
  recoveryStrategy?: 'retry' | 'fallback' | 'redirect' | 'bubble';
  /** Redirect path for redirect strategy */
  redirectTo?: string;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay between retries */
  retryDelay?: number;
  /** Whether to reset on route change */
  resetOnRouteChange?: boolean;
  /** Custom error transformer */
  transformError?: (error: RouteError) => RouteError;
  /** Error filter - return true to handle, false to bubble */
  shouldCatch?: (error: RouteError) => boolean;
  /** Callback when error is caught */
  onError?: (error: RouteError, routeId: string) => void;
  /** Callback when error is recovered */
  onRecovery?: (routeId: string) => void;
};

/**
 * Creates an enhanced nested error boundary with recovery strategies.
 */
export function createNestedErrorBoundary(config: NestedErrorBoundaryConfig = {}) {
  const {
    recoveryStrategy = 'fallback',
    redirectTo,
    maxRetries = 3,
    retryDelay = 1000,
    resetOnRouteChange = true,
    transformError,
    shouldCatch = () => true,
    onError,
    onRecovery,
  } = config;

  const retryCountMap = new Map<string, number>();

  return function NestedErrorBoundary(props: {
    routeId: string;
    errorElement?: ErrorBoundaryComponent;
    children?: VNode | JSXElement | string | null;
    params?: Record<string, string>;
  }) {
    const { routeId, errorElement, children, params } = props;

    const errors = routeErrorsSignal();
    const context = errors.get(routeId);

    if (context && !context.handled) {
      let error = context.error;

      // Check if we should catch this error
      if (!shouldCatch(error)) {
        // Bubble up to parent
        return bubbleError(routeId, error);
      }

      // Transform error if needed
      if (transformError) {
        error = transformError(error);
      }

      // Call error callback
      onError?.(error, routeId);

      // Handle recovery strategy
      switch (recoveryStrategy) {
        case 'retry': {
          const retryCount = retryCountMap.get(routeId) || 0;
          if (retryCount < maxRetries) {
            retryCountMap.set(routeId, retryCount + 1);
            setTimeout(() => {
              clearRouteError(routeId);
              onRecovery?.(routeId);
            }, retryDelay * Math.pow(2, retryCount));
          }
          break;
        }

        case 'redirect':
          if (redirectTo && typeof window !== 'undefined') {
            window.location.href = redirectTo;
            return null;
          }
          break;

        case 'bubble':
          return bubbleError(routeId, error);

        case 'fallback':
        default:
          // Continue to render error element
          break;
      }

      // Set current error for useRouteError hook
      setCurrentRouteError(error);
      markErrorHandled(routeId);

      if (errorElement) {
        return errorElement({
          error,
          reset: () => {
            retryCountMap.delete(routeId);
            clearRouteError(routeId);
            onRecovery?.(routeId);
          },
          params,
        });
      }

      return DefaultErrorBoundary({ error });
    }

    // No error, reset retry count and render children
    retryCountMap.delete(routeId);
    setCurrentRouteError(null);
    return children || null;
  };
}

/**
 * Bubble an error up to the parent route.
 */
function bubbleError(routeId: string, error: RouteError): null {
  // Find parent route and set error there
  const parts = routeId.split('/');
  if (parts.length > 1) {
    parts.pop();
    const parentId = parts.join('/') || '/';
    setRouteError(parentId, error);
  }
  clearRouteError(routeId);
  return null;
}

/**
 * HOC to wrap components with nested error boundary.
 */
export function withNestedErrorBoundary<P extends Record<string, unknown>>(
  Component: (props: P) => VNode | JSXElement | string | null,
  config: NestedErrorBoundaryConfig & { routeId: string }
) {
  const NestedBoundary = createNestedErrorBoundary(config);

  return function WrappedComponent(props: P) {
    return NestedBoundary({
      routeId: config.routeId,
      children: Component(props),
      params: (props as { params?: Record<string, string> }).params,
    });
  };
}

/**
 * Error aggregator for collecting errors from multiple nested routes.
 */
export class ErrorAggregator {
  private errors: Map<string, RouteError> = new Map();
  private listeners: Set<(errors: Map<string, RouteError>) => void> = new Set();

  add(routeId: string, error: RouteError): void {
    this.errors.set(routeId, error);
    this.notify();
  }

  remove(routeId: string): void {
    this.errors.delete(routeId);
    this.notify();
  }

  clear(): void {
    this.errors.clear();
    this.notify();
  }

  get(routeId: string): RouteError | undefined {
    return this.errors.get(routeId);
  }

  getAll(): Map<string, RouteError> {
    return new Map(this.errors);
  }

  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  subscribe(listener: (errors: Map<string, RouteError>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.getAll());
    }
  }
}

/**
 * Global error aggregator instance.
 */
export const globalErrorAggregator = new ErrorAggregator();

/**
 * Hook to use the error aggregator.
 */
export function useErrorAggregator(): ErrorAggregator {
  return globalErrorAggregator;
}

/**
 * Async error boundary for handling promise rejections in loaders.
 */
export async function asyncErrorBoundary<T>(
  routeId: string,
  promise: Promise<T>,
  options: {
    fallback?: T;
    transformError?: (error: unknown) => RouteError;
  } = {}
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    let routeError: RouteError;

    if (options.transformError) {
      routeError = options.transformError(error);
    } else if (error instanceof Response) {
      routeError = await createRouteErrorResponse(error);
    } else if (isRouteErrorResponse(error)) {
      routeError = error;
    } else if (error instanceof Error) {
      routeError = error;
    } else {
      routeError = new Error(String(error));
    }

    setRouteError(routeId, routeError);
    globalErrorAggregator.add(routeId, routeError);

    if (options.fallback !== undefined) {
      return options.fallback;
    }

    throw routeError;
  }
}

/**
 * Create a scoped error boundary that only catches specific error types.
 */
export function createScopedErrorBoundary(
  errorTypes: Array<new (...args: any[]) => Error>
) {
  return function ScopedErrorBoundary(props: RouteErrorBoundaryProps) {
    const { routeId, errorElement, fallback, children, params } = props;

    const errors = routeErrorsSignal();
    const context = errors.get(routeId);

    if (context && !context.handled) {
      const error = context.error;

      // Check if error matches any of the scoped types
      const shouldHandle = errorTypes.some(
        (ErrorType) => error instanceof ErrorType
      );

      if (!shouldHandle) {
        // Don't handle, let it bubble
        return children || null;
      }

      setCurrentRouteError(error);
      markErrorHandled(routeId);

      if (errorElement) {
        return errorElement({
          error,
          reset: () => clearRouteError(routeId),
          params,
        });
      }

      if (fallback) {
        return fallback;
      }

      return DefaultErrorBoundary({ error });
    }

    return children || null;
  };
}
