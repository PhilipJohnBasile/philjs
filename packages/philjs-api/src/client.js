/**
 * PhilJS API Client
 *
 * Type-safe API client for calling PhilJS API routes.
 */
/**
 * Create an API client
 */
export function createAPIClient(options = {}) {
    const { baseURL = '', headers: defaultHeaders = {}, timeout: defaultTimeout = 30000, retry = { count: 0, delay: 1000 }, credentials = 'same-origin', } = options;
    async function request(endpoint, fetchOptions = {}) {
        const { query, json, timeout = defaultTimeout, ...init } = fetchOptions;
        // Build URL with query params
        let url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
        if (query) {
            const params = new URLSearchParams();
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
            const queryString = params.toString();
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }
        // Build headers
        const headers = new Headers({
            ...defaultHeaders,
            ...init.headers,
        });
        // Handle JSON body
        let body = init.body;
        if (json !== undefined) {
            headers.set('Content-Type', 'application/json');
            body = JSON.stringify(json);
        }
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        let lastError = null;
        let attempts = 0;
        while (attempts <= retry.count) {
            try {
                const response = await fetch(url, {
                    ...init,
                    headers,
                    body,
                    credentials,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new APIError(errorData.message || response.statusText, response.status, errorData);
                }
                // Parse response
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    return response.json();
                }
                return response.text();
            }
            catch (error) {
                lastError = error;
                attempts++;
                if (attempts <= retry.count) {
                    await new Promise((resolve) => setTimeout(resolve, retry.delay));
                }
            }
        }
        clearTimeout(timeoutId);
        throw lastError;
    }
    return {
        /** GET request */
        get(endpoint, options) {
            return request(endpoint, { ...options, method: 'GET' });
        },
        /** POST request */
        post(endpoint, data, options) {
            return request(endpoint, { ...options, method: 'POST', json: data });
        },
        /** PUT request */
        put(endpoint, data, options) {
            return request(endpoint, { ...options, method: 'PUT', json: data });
        },
        /** PATCH request */
        patch(endpoint, data, options) {
            return request(endpoint, { ...options, method: 'PATCH', json: data });
        },
        /** DELETE request */
        delete(endpoint, options) {
            return request(endpoint, { ...options, method: 'DELETE' });
        },
        /** Raw request */
        request,
    };
}
/**
 * Default API client instance
 */
export const apiClient = createAPIClient();
/**
 * API Error class
 */
export class APIError extends Error {
    status;
    data;
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}
/**
 * Hook for fetching data (works with PhilJS signals)
 */
export function useFetch(endpoint, options = {}) {
    const { immediate = true, ...fetchOptions } = options;
    let data = null;
    let error = null;
    let loading = false;
    async function execute() {
        const url = typeof endpoint === 'function' ? endpoint() : endpoint;
        if (!url)
            return null;
        loading = true;
        error = null;
        try {
            data = await apiClient.get(url, fetchOptions);
            return data;
        }
        catch (e) {
            error = e;
            return null;
        }
        finally {
            loading = false;
        }
    }
    if (immediate) {
        execute();
    }
    return {
        get data() { return data; },
        get error() { return error; },
        get loading() { return loading; },
        execute,
        refetch: execute,
    };
}
/**
 * Hook for mutations
 */
export function useMutation(mutationFn) {
    let data = null;
    let error = null;
    let loading = false;
    async function mutate(variables) {
        loading = true;
        error = null;
        try {
            data = await mutationFn(variables);
            return data;
        }
        catch (e) {
            error = e;
            return null;
        }
        finally {
            loading = false;
        }
    }
    function reset() {
        data = null;
        error = null;
        loading = false;
    }
    return {
        get data() { return data; },
        get error() { return error; },
        get loading() { return loading; },
        mutate,
        reset,
    };
}
//# sourceMappingURL=client.js.map