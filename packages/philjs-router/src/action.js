/**
 * Remix-style route actions for PhilJS Router.
 * Handles form submissions and mutations with automatic revalidation.
 *
 * @example
 * ```tsx
 * // routes/users.tsx
 * export async function action({ request }) {
 *   const formData = await request.formData();
 *   await createUser(Object.fromEntries(formData));
 *   return redirect('/users');
 * }
 *
 * export default function UsersPage() {
 *   const actionData = useActionData();
 *   const navigation = useNavigation();
 *
 *   return (
 *     <Form method="post">
 *       <input name="name" />
 *       <button type="submit" disabled={navigation.state === 'submitting'}>
 *         Create User
 *       </button>
 *       {actionData?.error && <p>{actionData.error}</p>}
 *     </Form>
 *   );
 * }
 * ```
 */
import { signal } from "philjs-core";
import { redirect, isRedirectResponse, getRedirectLocation } from "./loader.js";
// Re-export redirect for convenience
export { redirect };
// ============================================================================
// State Management
// ============================================================================
/**
 * Global action data store.
 */
const actionDataSignal = signal(new Map());
/**
 * Navigation state signal.
 */
const navigationSignal = signal({
    state: "idle",
});
/**
 * Fetcher counter for unique keys.
 */
let fetcherCounter = 0;
/**
 * Active fetchers map.
 */
const fetchersSignal = signal(new Map());
// ============================================================================
// Action Execution
// ============================================================================
/**
 * Execute an action function.
 */
export async function executeAction(action, context) {
    try {
        const result = await action(context);
        // Handle Response objects
        if (result instanceof Response) {
            // Check for redirect
            if (isRedirectResponse(result)) {
                const location = getRedirectLocation(result);
                if (location) {
                    // Return the redirect as data for the router to handle
                    return {
                        data: { _redirect: location },
                        status: "success",
                    };
                }
            }
            // Try to parse JSON response
            const contentType = result.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const data = await result.json();
                return {
                    data,
                    status: "success",
                };
            }
            // Return raw response
            return {
                data: result,
                status: "success",
            };
        }
        return {
            data: result,
            status: "success",
        };
    }
    catch (error) {
        return {
            error: error instanceof Error ? error : new Error(String(error)),
            status: "error",
        };
    }
}
/**
 * Create a Request object for action context.
 */
export async function createActionRequest(url, formData, method = "POST") {
    const urlObj = typeof url === "string" ? new URL(url, "http://localhost") : url;
    return new Request(urlObj.toString(), {
        method: method.toUpperCase(),
        body: formData,
    });
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to access the result of the most recent action.
 *
 * @example
 * ```tsx
 * const actionData = useActionData<{ error?: string; success?: boolean }>();
 * ```
 */
export function useActionData() {
    const store = actionDataSignal();
    // Get action data for current route
    const routeId = typeof window !== "undefined"
        ? window.__PHILJS_ROUTE_INFO__?.current?.path
        : undefined;
    if (!routeId)
        return undefined;
    const result = store.get(routeId);
    if (!result || result.status === "idle")
        return undefined;
    if (result.error) {
        return { error: result.error.message };
    }
    return result.data;
}
/**
 * Hook to access the current navigation state.
 *
 * @example
 * ```tsx
 * const navigation = useNavigation();
 * const isSubmitting = navigation.state === 'submitting';
 * ```
 */
export function useNavigation() {
    return navigationSignal();
}
/**
 * Hook to programmatically submit a form.
 *
 * @example
 * ```tsx
 * const submit = useSubmit();
 *
 * const handleClick = () => {
 *   submit({ name: 'John' }, { method: 'post', action: '/users' });
 * };
 * ```
 */
export function useSubmit() {
    return async (target, options = {}) => {
        let formData;
        if (target instanceof FormData) {
            formData = target;
        }
        else if (target instanceof HTMLFormElement) {
            formData = new FormData(target);
        }
        else {
            formData = new FormData();
            for (const [key, value] of Object.entries(target)) {
                formData.append(key, value);
            }
        }
        const method = options.method || "post";
        const action = options.action || window.location.pathname;
        const url = new URL(action, window.location.origin);
        // Update navigation state
        navigationSignal.set({
            state: "submitting",
            formData,
            formMethod: method.toUpperCase(),
            formAction: action,
            formEncType: options.encType || "application/x-www-form-urlencoded",
            location: url,
        });
        try {
            // Dispatch action event for the router to handle
            const event = new CustomEvent("philjs:action", {
                detail: {
                    formData,
                    method,
                    action,
                    replace: options.replace,
                    preventScrollReset: options.preventScrollReset,
                },
            });
            window.dispatchEvent(event);
        }
        finally {
            navigationSignal.set({ state: "idle" });
        }
    };
}
/**
 * Hook for data mutations that don't navigate.
 * Useful for inline forms and optimistic UI.
 *
 * @example
 * ```tsx
 * const fetcher = useFetcher<{ success: boolean }>();
 *
 * return (
 *   <fetcher.Form method="post" action="/api/like">
 *     <input type="hidden" name="postId" value={postId} />
 *     <button type="submit" disabled={fetcher.state === 'submitting'}>
 *       {fetcher.data?.success ? 'Liked!' : 'Like'}
 *     </button>
 *   </fetcher.Form>
 * );
 * ```
 */
export function useFetcher() {
    const key = `fetcher-${++fetcherCounter}`;
    const initialState = {
        state: "idle",
        submit: async (target, options = {}) => {
            let formData;
            if (target instanceof FormData) {
                formData = target;
            }
            else if (target instanceof HTMLFormElement) {
                formData = new FormData(target);
            }
            else {
                formData = new FormData();
                for (const [k, v] of Object.entries(target)) {
                    formData.append(k, v);
                }
            }
            const fetchers = new Map(fetchersSignal());
            const currentFetcher = fetchers.get(key) || initialState;
            fetchers.set(key, {
                ...currentFetcher,
                state: "submitting",
                formData,
                formMethod: options.method?.toUpperCase() || "POST",
                formAction: options.action || window.location.pathname,
            });
            fetchersSignal.set(fetchers);
            try {
                const action = options.action || window.location.pathname;
                const response = await fetch(action, {
                    method: options.method?.toUpperCase() || "POST",
                    body: formData,
                });
                let data;
                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                    data = await response.json();
                }
                const updatedFetchers = new Map(fetchersSignal());
                updatedFetchers.set(key, {
                    ...currentFetcher,
                    state: "idle",
                    data,
                });
                fetchersSignal.set(updatedFetchers);
            }
            catch (error) {
                const updatedFetchers = new Map(fetchersSignal());
                updatedFetchers.set(key, {
                    ...currentFetcher,
                    state: "idle",
                    error: error instanceof Error ? error : new Error(String(error)),
                });
                fetchersSignal.set(updatedFetchers);
            }
        },
        load: async (href) => {
            const fetchers = new Map(fetchersSignal());
            const currentFetcher = fetchers.get(key) || initialState;
            fetchers.set(key, {
                ...currentFetcher,
                state: "loading",
            });
            fetchersSignal.set(fetchers);
            try {
                const response = await fetch(href);
                let data;
                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                    data = await response.json();
                }
                const updatedFetchers = new Map(fetchersSignal());
                updatedFetchers.set(key, {
                    ...currentFetcher,
                    state: "idle",
                    data,
                });
                fetchersSignal.set(updatedFetchers);
            }
            catch (error) {
                const updatedFetchers = new Map(fetchersSignal());
                updatedFetchers.set(key, {
                    ...currentFetcher,
                    state: "idle",
                    error: error instanceof Error ? error : new Error(String(error)),
                });
                fetchersSignal.set(updatedFetchers);
            }
        },
        Form: (props) => Form({ ...props, method: "post" }),
    };
    // Get current state or use initial
    const fetchers = fetchersSignal();
    return fetchers.get(key) || initialState;
}
/**
 * Hook to access all active fetchers.
 */
export function useFetchers() {
    return Array.from(fetchersSignal().values());
}
// ============================================================================
// Form Component
// ============================================================================
/**
 * Enhanced form component that handles submissions via the router.
 *
 * @example
 * ```tsx
 * <Form method="post" action="/users">
 *   <input name="email" type="email" required />
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export function Form(props) {
    const { method = "post", action, encType = "application/x-www-form-urlencoded", replace = false, preventScrollReset = false, onSubmit, children, ...rest } = props;
    const submit = useSubmit();
    const handleSubmit = async (event) => {
        // Call custom handler first
        onSubmit?.(event);
        if (event.defaultPrevented)
            return;
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        await submit(formData, {
            method,
            action: action || form.action || window.location.pathname,
            encType,
            replace,
            preventScrollReset,
        });
    };
    return {
        type: "form",
        props: {
            method,
            action,
            encType,
            onSubmit: handleSubmit,
            children,
            ...rest,
        },
    };
}
// ============================================================================
// Action Data Management
// ============================================================================
/**
 * Set action data for a route.
 */
export function setActionData(routeId, result) {
    const store = new Map(actionDataSignal());
    store.set(routeId, result);
    actionDataSignal.set(store);
}
/**
 * Clear action data for a route.
 */
export function clearActionData(routeId) {
    if (routeId) {
        const store = new Map(actionDataSignal());
        store.delete(routeId);
        actionDataSignal.set(store);
    }
    else {
        actionDataSignal.set(new Map());
    }
}
/**
 * Set navigation state.
 */
export function setNavigationState(state) {
    navigationSignal.set(state);
}
// ============================================================================
// Form Utilities
// ============================================================================
/**
 * Parse form data into an object.
 */
export function formDataToObject(formData) {
    const result = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value !== "string")
            continue;
        const existing = result[key];
        if (existing !== undefined) {
            if (Array.isArray(existing)) {
                existing.push(value);
            }
            else {
                result[key] = [existing, value];
            }
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Create form data from an object.
 */
export function objectToFormData(obj) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null)
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                formData.append(key, String(item));
            }
        }
        else if (value instanceof File) {
            formData.append(key, value);
        }
        else if (value instanceof Blob) {
            formData.append(key, value);
        }
        else {
            formData.append(key, String(value));
        }
    }
    return formData;
}
export function validateFormData(formData, validator) {
    const data = formDataToObject(formData);
    return validator(data);
}
const optimisticUpdatesSignal = signal(new Map());
/**
 * Apply an optimistic update.
 */
export function applyOptimisticUpdate(id, data, submit) {
    const update = {
        id,
        data,
        pending: true,
        confirmed: false,
    };
    const updates = new Map(optimisticUpdatesSignal());
    updates.set(id, update);
    optimisticUpdatesSignal.set(updates);
    // Execute the actual mutation
    submit()
        .then(() => {
        const currentUpdates = new Map(optimisticUpdatesSignal());
        const current = currentUpdates.get(id);
        if (current) {
            currentUpdates.set(id, {
                ...current,
                pending: false,
                confirmed: true,
            });
            optimisticUpdatesSignal.set(currentUpdates);
        }
    })
        .catch((error) => {
        const currentUpdates = new Map(optimisticUpdatesSignal());
        const current = currentUpdates.get(id);
        if (current) {
            currentUpdates.set(id, {
                ...current,
                pending: false,
                confirmed: false,
                error: error instanceof Error ? error : new Error(String(error)),
            });
            optimisticUpdatesSignal.set(currentUpdates);
        }
    });
    return update;
}
/**
 * Get all optimistic updates.
 */
export function useOptimisticUpdates() {
    return Array.from(optimisticUpdatesSignal().values());
}
/**
 * Clear completed optimistic updates.
 */
export function clearOptimisticUpdates() {
    const updates = new Map(optimisticUpdatesSignal());
    for (const [id, update] of updates) {
        if (!update.pending) {
            updates.delete(id);
        }
    }
    optimisticUpdatesSignal.set(updates);
}
//# sourceMappingURL=action.js.map