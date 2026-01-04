// @ts-nocheck
/**
 * PhilJS Meta - Data Loading System
 *
 * Implements Remix/Next.js-style data loading with:
 * - loader() function for SSR data fetching
 * - action() function for form mutations
 * - useLoaderData() hook
 * - useActionData() hook
 */
/**
 * Loader data store (for SSR/hydration)
 */
class LoaderDataStore {
    data = new Map();
    promises = new Map();
    errors = new Map();
    set(key, data) {
        this.data.set(key, data);
        this.promises.delete(key);
        this.errors.delete(key);
    }
    get(key) {
        return this.data.get(key);
    }
    setPromise(key, promise) {
        this.promises.set(key, promise);
    }
    getPromise(key) {
        return this.promises.get(key);
    }
    setError(key, error) {
        this.errors.set(key, error);
        this.promises.delete(key);
    }
    getError(key) {
        return this.errors.get(key);
    }
    has(key) {
        return this.data.has(key);
    }
    clear(key) {
        this.data.delete(key);
        this.promises.delete(key);
        this.errors.delete(key);
    }
    clearAll() {
        this.data.clear();
        this.promises.clear();
        this.errors.clear();
    }
    serialize() {
        const result = {};
        for (const [key, value] of this.data) {
            result[key] = value;
        }
        return result;
    }
    hydrate(data) {
        for (const [key, value] of Object.entries(data)) {
            this.data.set(key, value);
        }
    }
}
/**
 * Action data store
 */
class ActionDataStore {
    data = new Map();
    submitting = new Map();
    set(key, response) {
        this.data.set(key, response);
        this.submitting.set(key, false);
    }
    get(key) {
        return this.data.get(key);
    }
    setSubmitting(key, submitting) {
        this.submitting.set(key, submitting);
    }
    isSubmitting(key) {
        return this.submitting.get(key) || false;
    }
    clear(key) {
        this.data.delete(key);
        this.submitting.delete(key);
    }
    clearAll() {
        this.data.clear();
        this.submitting.clear();
    }
}
// Global stores
const loaderStore = new LoaderDataStore();
const actionStore = new ActionDataStore();
// Current route context (for hooks)
let currentRouteKey = '';
let currentLoaderContext = null;
let currentActionContext = null;
/**
 * Set the current route context
 */
export function setRouteContext(routeKey, loaderContext, actionContext) {
    currentRouteKey = routeKey;
    if (loaderContext)
        currentLoaderContext = loaderContext;
    if (actionContext)
        currentActionContext = actionContext;
}
/**
 * Get current route key
 */
export function getRouteKey() {
    return currentRouteKey;
}
/**
 * Define a loader function for a route
 */
export function defineLoader(loader) {
    return loader;
}
/**
 * Define an action function for a route
 */
export function defineAction(action) {
    return action;
}
/**
 * Execute a loader function
 */
export async function executeLoader(routeKey, loader, context) {
    try {
        loaderStore.setPromise(routeKey, Promise.resolve());
        const data = await loader(context);
        loaderStore.set(routeKey, data);
        return data;
    }
    catch (error) {
        if (error instanceof Response) {
            throw error; // Re-throw redirect/error responses
        }
        const err = error instanceof Error ? error : new Error(String(error));
        loaderStore.setError(routeKey, err);
        throw err;
    }
}
/**
 * Execute an action function
 */
export async function executeAction(routeKey, action, context) {
    try {
        actionStore.setSubmitting(routeKey, true);
        const data = await action(context);
        const response = {
            data,
            success: true,
        };
        actionStore.set(routeKey, response);
        return response;
    }
    catch (error) {
        if (error instanceof Response) {
            throw error; // Re-throw redirect/error responses
        }
        const response = {
            errors: {
                _form: error instanceof Error ? error.message : String(error),
            },
            success: false,
        };
        actionStore.set(routeKey, response);
        return response;
    }
    finally {
        actionStore.setSubmitting(routeKey, false);
    }
}
/**
 * Hook to access loader data in components
 */
export function useLoaderData() {
    const data = loaderStore.get(currentRouteKey);
    if (data === undefined) {
        const error = loaderStore.getError(currentRouteKey);
        if (error) {
            throw error;
        }
        throw new Error(`No loader data found for route "${currentRouteKey}". ` +
            'Make sure the loader has completed before rendering.');
    }
    return data;
}
/**
 * Hook to access action data in components
 */
export function useActionData() {
    return actionStore.get(currentRouteKey);
}
/**
 * Hook to check if an action is submitting
 */
export function useIsSubmitting() {
    return actionStore.isSubmitting(currentRouteKey);
}
/**
 * Hook to access route parameters
 */
export function useParams() {
    if (!currentLoaderContext) {
        throw new Error('useParams must be used within a route context');
    }
    return currentLoaderContext.params;
}
/**
 * Hook to access search parameters
 */
export function useSearchParams() {
    if (!currentLoaderContext) {
        throw new Error('useSearchParams must be used within a route context');
    }
    return currentLoaderContext.searchParams;
}
/**
 * Create a form action handler
 */
export function createFormAction(routeKey, action) {
    return {
        async submit(formData) {
            const request = new Request(window.location.href, {
                method: 'POST',
                body: formData,
            });
            const context = {
                params: {},
                request,
                formData: async () => formData,
                json: async () => {
                    const obj = {};
                    formData.forEach((value, key) => {
                        obj[key] = value;
                    });
                    return obj;
                },
                serverContext: createClientServerContext(),
            };
            return executeAction(routeKey, action, context);
        },
        isSubmitting() {
            return actionStore.isSubmitting(routeKey);
        },
        getData() {
            return actionStore.get(routeKey);
        },
        reset() {
            actionStore.clear(routeKey);
        },
    };
}
/**
 * Create a client-side server context (for hydration)
 */
function createClientServerContext() {
    return {
        cookies: {
            get: (name) => {
                const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
                return match ? match[2] : undefined;
            },
            getAll: () => {
                const cookies = {};
                document.cookie.split(';').forEach((cookie) => {
                    const [name, value] = cookie.trim().split('=');
                    if (name)
                        cookies[name] = value;
                });
                return cookies;
            },
            has: (name) => document.cookie.includes(`${name}=`),
        },
        headers: new Headers(),
        responseHeaders: new Headers(),
        setCookie: (name, value, options) => {
            let cookie = `${name}=${value}`;
            if (options?.path)
                cookie += `; path=${options.path}`;
            if (options?.domain)
                cookie += `; domain=${options.domain}`;
            if (options?.expires)
                cookie += `; expires=${options.expires.toUTCString()}`;
            if (options?.maxAge)
                cookie += `; max-age=${options.maxAge}`;
            if (options?.httpOnly)
                cookie += '; httpOnly';
            if (options?.secure)
                cookie += '; secure';
            if (options?.sameSite)
                cookie += `; sameSite=${options.sameSite}`;
            document.cookie = cookie;
        },
        deleteCookie: (name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
        redirect: (url) => {
            window.location.href = url;
            throw new Error('Redirect');
        },
        notFound: () => {
            throw new Error('Not Found');
        },
    };
}
/**
 * Create server-side server context
 */
export function createServerContext(request) {
    const responseHeaders = new Headers();
    const cookies = parseCookies(request.headers.get('cookie') || '');
    return {
        cookies: {
            get: (name) => cookies[name],
            getAll: () => cookies,
            has: (name) => name in cookies,
        },
        headers: request.headers,
        responseHeaders,
        setCookie: (name, value, options) => {
            let cookie = `${name}=${value}`;
            if (options?.path)
                cookie += `; Path=${options.path}`;
            if (options?.domain)
                cookie += `; Domain=${options.domain}`;
            if (options?.expires)
                cookie += `; Expires=${options.expires.toUTCString()}`;
            if (options?.maxAge)
                cookie += `; Max-Age=${options.maxAge}`;
            if (options?.httpOnly)
                cookie += '; HttpOnly';
            if (options?.secure)
                cookie += '; Secure';
            if (options?.sameSite)
                cookie += `; SameSite=${options.sameSite}`;
            responseHeaders.append('Set-Cookie', cookie);
        },
        deleteCookie: (name) => {
            responseHeaders.append('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        },
        redirect: (url, status = 302) => {
            throw new RedirectResponse(url, status);
        },
        notFound: () => {
            throw new NotFoundResponse();
        },
    };
}
/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies[name] = rest.join('=');
        }
    });
    return cookies;
}
/**
 * Redirect response class
 */
export class RedirectResponse extends Response {
    constructor(url, status = 302) {
        super(null, {
            status,
            headers: {
                Location: url,
            },
        });
    }
}
/**
 * Not found response class
 */
export class NotFoundResponse extends Response {
    constructor() {
        super('Not Found', { status: 404 });
    }
}
/**
 * JSON response helper
 */
export function json(data, init) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
        },
    });
}
/**
 * Redirect helper
 */
export function redirect(url, status = 302) {
    throw new RedirectResponse(url, status);
}
/**
 * Defer helper for streaming data
 */
export function defer(data) {
    return new DeferredData(data);
}
/**
 * Deferred data class for streaming
 */
export class DeferredData {
    data;
    resolved = new Map();
    constructor(data) {
        this.data = data;
        // Track promise resolution
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Promise) {
                this.resolved.set(key, false);
                value.then(() => this.resolved.set(key, true));
            }
            else {
                this.resolved.set(key, true);
            }
        }
    }
    get(key) {
        return this.data[key];
    }
    isResolved(key) {
        return this.resolved.get(key) || false;
    }
    async resolveAll() {
        const result = {};
        for (const [key, value] of Object.entries(this.data)) {
            result[key] = value instanceof Promise ? await value : value;
        }
        return result;
    }
}
/**
 * Hydration utilities
 */
export const hydration = {
    /**
     * Get serialized loader data for hydration script
     */
    getHydrationScript() {
        const data = loaderStore.serialize();
        return `window.__PHILJS_LOADER_DATA__ = ${JSON.stringify(data)};`;
    },
    /**
     * Hydrate loader data from window
     */
    hydrate() {
        if (typeof window !== 'undefined' && window.__PHILJS_LOADER_DATA__) {
            loaderStore.hydrate(window.__PHILJS_LOADER_DATA__);
        }
    },
    /**
     * Clear all loader and action data
     */
    clear() {
        loaderStore.clearAll();
        actionStore.clearAll();
    },
};
//# sourceMappingURL=loaders.js.map