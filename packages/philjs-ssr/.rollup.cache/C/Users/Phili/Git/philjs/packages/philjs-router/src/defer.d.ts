/**
 * Deferred data loading for PhilJS Router.
 * Allows streaming slow data while rendering the page immediately.
 *
 * @example
 * ```tsx
 * export async function loader() {
 *   return {
 *     user: await fetchUser(), // blocks rendering
 *     posts: defer(fetchPosts()), // streams in later
 *   };
 * }
 *
 * function UserPage() {
 *   const { user, posts } = useLoaderData();
 *   return (
 *     <div>
 *       <UserHeader user={user} />
 *       <Suspense fallback={<Spinner />}>
 *         <Await resolve={posts}>
 *           {(posts) => <PostList posts={posts} />}
 *         </Await>
 *       </Suspense>
 *     </div>
 *   );
 * }
 * ```
 */
import type { JSXElement, VNode } from "philjs-core";
/**
 * Status of a deferred value.
 */
export type DeferredStatus = "pending" | "resolved" | "rejected";
/**
 * A deferred value that will resolve later.
 */
export type DeferredValue<T> = {
    /** Unique identifier for this deferred value */
    _id: symbol;
    /** Mark this as a deferred value */
    _deferred: true;
    /** The underlying promise */
    promise: Promise<T>;
    /** Current status */
    status: DeferredStatus;
    /** Resolved value (if resolved) */
    value?: T;
    /** Error (if rejected) */
    error?: Error;
    /** Subscribe to status changes */
    subscribe: (callback: (status: DeferredStatus) => void) => () => void;
};
/**
 * Props for the Await component.
 */
export type AwaitProps<T> = {
    /** The deferred value or promise to await */
    resolve: DeferredValue<T> | Promise<T>;
    /** Render function called with the resolved value */
    children: (value: T) => VNode | JSXElement | string | null;
    /** Optional error element or render function */
    errorElement?: VNode | JSXElement | ((error: Error) => VNode | JSXElement | string | null);
};
/**
 * Data containing both immediate and deferred values.
 */
export type DeferredData<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends Promise<infer U> ? DeferredValue<U> : T[K];
};
/**
 * Create a deferred value from a promise.
 * The promise starts executing immediately but doesn't block rendering.
 *
 * @example
 * ```tsx
 * export async function loader() {
 *   return {
 *     user: await fetchUser(), // This blocks
 *     posts: defer(fetchPosts()), // This streams in
 *     comments: defer(fetchComments()), // This also streams in
 *   };
 * }
 * ```
 */
export declare function defer<T>(promise: Promise<T>): DeferredValue<T>;
/**
 * Check if a value is a deferred value.
 */
export declare function isDeferred<T>(value: unknown): value is DeferredValue<T>;
/**
 * Resolve a deferred value or return the value if already resolved.
 */
export declare function resolveDeferred<T>(value: DeferredValue<T> | Promise<T> | T): Promise<T>;
/**
 * Component that renders deferred data with Suspense-like behavior.
 * Must be used with a Suspense boundary for proper loading states.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<Spinner />}>
 *   <Await resolve={posts}>
 *     {(resolvedPosts) => <PostList posts={resolvedPosts} />}
 *   </Await>
 * </Suspense>
 * ```
 */
export declare function Await<T>(props: AwaitProps<T>): VNode | JSXElement | string | null;
/**
 * Create a deferred data object from an object with promises.
 * Immediate values are passed through, promises are wrapped with defer().
 *
 * @example
 * ```tsx
 * export async function loader() {
 *   return deferData({
 *     user: await fetchUser(), // immediate
 *     posts: fetchPosts(), // deferred
 *     comments: fetchComments(), // deferred
 *   });
 * }
 * ```
 */
export declare function deferData<T extends Record<string, unknown>>(data: T): DeferredData<T>;
/**
 * Wait for all deferred values in an object to resolve.
 * Useful for SSR where you want to wait for all data.
 */
export declare function awaitAllDeferred<T extends Record<string, unknown>>(data: T): Promise<{
    [K in keyof T]: T[K] extends DeferredValue<infer U> ? U : T[K];
}>;
/**
 * Get the current state of all deferred values in an object.
 * Doesn't wait for pending values.
 */
export declare function getDeferredStates<T extends Record<string, unknown>>(data: T): Record<string, {
    status: DeferredStatus;
    value?: unknown;
    error?: Error;
}>;
/**
 * Options for streaming deferred data.
 */
export type StreamOptions = {
    /** Callback when a deferred value resolves */
    onResolve?: (key: string, value: unknown) => void;
    /** Callback when a deferred value rejects */
    onReject?: (key: string, error: Error) => void;
    /** Callback when all deferred values are settled */
    onComplete?: () => void;
};
/**
 * Stream deferred values as they resolve.
 * Useful for SSR streaming.
 *
 * @example
 * ```tsx
 * const data = deferData({ posts: fetchPosts() });
 * const unsubscribe = streamDeferred(data, {
 *   onResolve: (key, value) => {
 *     // Send resolved data to client
 *   },
 *   onComplete: () => {
 *     // Close the stream
 *   },
 * });
 * ```
 */
export declare function streamDeferred<T extends Record<string, unknown>>(data: T, options: StreamOptions): () => void;
/**
 * Serialize deferred data for hydration.
 * Returns resolved values and promises status.
 */
export declare function serializeDeferred<T extends Record<string, unknown>>(data: T): string;
/**
 * Hydrate deferred data from serialized state.
 */
export declare function hydrateDeferred<T extends Record<string, unknown>>(serialized: string, fetchers: Record<string, () => Promise<unknown>>): T;
//# sourceMappingURL=defer.d.ts.map