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
import { signal } from "@philjs/core";
// ============================================================================
// Deferred Value Creation
// ============================================================================
let deferredIdCounter = 0;
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
export function defer(promise) {
    const id = Symbol(`deferred-${++deferredIdCounter}`);
    const subscribers = new Set();
    const deferred = {
        _id: id,
        _deferred: true,
        promise,
        status: "pending",
        subscribe: (callback) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
    };
    // Start resolving immediately
    const trackedPromise = promise
        .then((value) => {
        deferred.status = "resolved";
        deferred.value = value;
        subscribers.forEach((cb) => cb("resolved"));
        return value;
    })
        .catch((error) => {
        deferred.status = "rejected";
        deferred.error = error instanceof Error ? error : new Error(String(error));
        subscribers.forEach((cb) => cb("rejected"));
        throw deferred.error;
    });
    deferred.promise = trackedPromise;
    return deferred;
}
/**
 * Check if a value is a deferred value.
 */
export function isDeferred(value) {
    return (typeof value === "object" &&
        value !== null &&
        "_deferred" in value &&
        value._deferred === true);
}
/**
 * Resolve a deferred value or return the value if already resolved.
 */
export async function resolveDeferred(value) {
    if (isDeferred(value)) {
        if (value.status === "resolved") {
            return value.value;
        }
        if (value.status === "rejected") {
            throw value.error;
        }
        return value.promise;
    }
    if (value instanceof Promise) {
        return value;
    }
    return value;
}
// ============================================================================
// Await Component
// ============================================================================
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
export function Await(props) {
    const { resolve, children, errorElement } = props;
    // Handle deferred values
    if (isDeferred(resolve)) {
        switch (resolve.status) {
            case "resolved":
                return children(resolve.value);
            case "rejected":
                if (errorElement) {
                    return typeof errorElement === "function"
                        ? errorElement(resolve.error)
                        : errorElement;
                }
                throw resolve.error;
            case "pending":
                // Throw the promise for Suspense to catch
                throw resolve.promise;
        }
    }
    // Handle raw promises
    if (resolve instanceof Promise) {
        // Create a wrapper that tracks resolution
        const wrapper = createPromiseWrapper(resolve);
        if (wrapper.status === "resolved") {
            return children(wrapper.value);
        }
        if (wrapper.status === "rejected") {
            if (errorElement) {
                return typeof errorElement === "function"
                    ? errorElement(wrapper.error)
                    : errorElement;
            }
            throw wrapper.error;
        }
        // Throw for Suspense
        throw resolve;
    }
    // Value is already resolved
    return children(resolve);
}
const promiseCache = new WeakMap();
/**
 * Create a wrapper around a promise that can be used with Suspense.
 */
function createPromiseWrapper(promise) {
    const cached = promiseCache.get(promise);
    if (cached) {
        return cached;
    }
    const wrapper = {
        status: "pending",
    };
    promiseCache.set(promise, wrapper);
    promise
        .then((value) => {
        wrapper.status = "resolved";
        wrapper.value = value;
    })
        .catch((error) => {
        wrapper.status = "rejected";
        wrapper.error = error instanceof Error ? error : new Error(String(error));
    });
    return wrapper;
}
// ============================================================================
// Deferred Data Helpers
// ============================================================================
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
export function deferData(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Promise) {
            result[key] = defer(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Wait for all deferred values in an object to resolve.
 * Useful for SSR where you want to wait for all data.
 */
export async function awaitAllDeferred(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (isDeferred(value)) {
            try {
                result[key] = await value.promise;
            }
            catch (error) {
                result[key] = undefined;
            }
        }
        else if (value instanceof Promise) {
            result[key] = await value;
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Get the current state of all deferred values in an object.
 * Doesn't wait for pending values.
 */
export function getDeferredStates(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (isDeferred(value)) {
            const state = {
                status: value.status,
            };
            if (value.value !== undefined) {
                state.value = value.value;
            }
            if (value.error !== undefined) {
                state.error = value.error;
            }
            result[key] = state;
        }
    }
    return result;
}
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
export function streamDeferred(data, options) {
    const unsubscribes = [];
    let pendingCount = 0;
    for (const [key, value] of Object.entries(data)) {
        if (isDeferred(value)) {
            pendingCount++;
            const unsubscribe = value.subscribe((status) => {
                if (status === "resolved") {
                    options.onResolve?.(key, value.value);
                    pendingCount--;
                    if (pendingCount === 0) {
                        options.onComplete?.();
                    }
                }
                else if (status === "rejected") {
                    options.onReject?.(key, value.error);
                    pendingCount--;
                    if (pendingCount === 0) {
                        options.onComplete?.();
                    }
                }
            });
            unsubscribes.push(unsubscribe);
        }
    }
    // If no deferred values, complete immediately
    if (pendingCount === 0) {
        options.onComplete?.();
    }
    // Return cleanup function
    return () => {
        unsubscribes.forEach((unsub) => unsub());
    };
}
/**
 * Serialize deferred data for hydration.
 * Returns resolved values and promises status.
 */
export function serializeDeferred(data) {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
        if (isDeferred(value)) {
            serialized[key] = {
                resolved: value.status === "resolved",
                value: value.status === "resolved" ? value.value : undefined,
            };
        }
    }
    return JSON.stringify(serialized);
}
/**
 * Hydrate deferred data from serialized state.
 */
export function hydrateDeferred(serialized, fetchers) {
    const parsed = JSON.parse(serialized);
    const result = {};
    for (const [key, state] of Object.entries(parsed)) {
        if (state.resolved) {
            // Create an already-resolved deferred
            result[key] = defer(Promise.resolve(state.value));
        }
        else if (fetchers[key]) {
            // Re-fetch deferred data
            result[key] = defer(fetchers[key]());
        }
    }
    return result;
}
//# sourceMappingURL=defer.js.map