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
import type { JSXElement, VNode } from "@philjs/core";
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
export type ErrorBoundaryComponent = (props: ErrorBoundaryProps) => VNode | JSXElement | string | null;
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
/**
 * Check if an error is a RouteErrorResponse.
 */
export declare function isRouteErrorResponse(error: unknown): error is RouteErrorResponse;
/**
 * Create a RouteErrorResponse from a Response object.
 */
export declare function createRouteErrorResponse(response: Response): Promise<RouteErrorResponse>;
/**
 * Create a RouteErrorResponse from an Error.
 */
export declare function createErrorResponse(error: Error, status?: number): RouteErrorResponse;
/**
 * Throw a Response as an error (Remix-style).
 */
export declare function throwResponse(data: unknown, init?: ResponseInit | number): never;
/**
 * Throw a 404 Not Found error.
 */
export declare function throwNotFound(message?: string): never;
/**
 * Throw a 401 Unauthorized error.
 */
export declare function throwUnauthorized(message?: string): never;
/**
 * Throw a 403 Forbidden error.
 */
export declare function throwForbidden(message?: string): never;
/**
 * Throw a 400 Bad Request error.
 */
export declare function throwBadRequest(message?: string): never;
/**
 * Throw a 500 Internal Server Error.
 */
export declare function throwServerError(message?: string): never;
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
export declare function useRouteError(): RouteError;
/**
 * Hook to access error for a specific route.
 */
export declare function useRouteErrorById(routeId: string): RouteError | undefined;
/**
 * Hook to check if the current route has an error.
 */
export declare function useHasRouteError(): boolean;
/**
 * Hook to get all route errors in the hierarchy.
 */
export declare function useRouteErrors(): RouteErrorContext[];
/**
 * Set an error for a route.
 */
export declare function setRouteError(routeId: string, error: RouteError): void;
/**
 * Set the current route's error for useRouteError.
 */
export declare function setCurrentRouteError(error: RouteError | null): void;
/**
 * Clear error for a route.
 */
export declare function clearRouteError(routeId: string): void;
/**
 * Clear all route errors.
 */
export declare function clearAllRouteErrors(): void;
/**
 * Mark an error as handled.
 */
export declare function markErrorHandled(routeId: string): void;
/**
 * Set the error stack for the current route hierarchy.
 */
export declare function setErrorStack(stack: RouteErrorContext[]): void;
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
export declare function RouteErrorBoundary(props: RouteErrorBoundaryProps): VNode | JSXElement | string | null;
/**
 * Default error boundary component.
 */
export declare function DefaultErrorBoundary(props: Pick<ErrorBoundaryProps, "error">): VNode;
/**
 * Wrap an async function with error catching.
 */
export declare function catchRouteError<T>(routeId: string, fn: () => Promise<T>): Promise<T | undefined>;
/**
 * Handle an error and determine which route should render the error boundary.
 */
export declare function handleRouteError(error: unknown, matches: Array<{
    id: string;
    route: {
        errorElement?: ErrorBoundaryComponent;
    };
}>): {
    routeId: string;
    error: RouteError;
} | null;
/**
 * Check if status code indicates a client error (4xx).
 */
export declare function isClientError(status: number): boolean;
/**
 * Check if status code indicates a server error (5xx).
 */
export declare function isServerError(status: number): boolean;
/**
 * Check if status code indicates success (2xx).
 */
export declare function isSuccessStatus(status: number): boolean;
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
export declare function withErrorRecovery<T>(fn: () => Promise<T>, options?: ErrorRecoveryOptions): Promise<T>;
/**
 * Create a retry handler for specific error types.
 */
export declare function createRetryHandler(statusCodes: number[]): (error: RouteError) => boolean;
//# sourceMappingURL=error-boundary.d.ts.map