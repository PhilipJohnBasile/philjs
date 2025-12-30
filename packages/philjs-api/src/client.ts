/**
 * PhilJS API Client
 *
 * Type-safe API client for calling PhilJS API routes.
 */

export interface APIClientOptions {
  /** Base URL for API calls */
  baseURL?: string;
  /** Default headers */
  headers?: Record<string, string>;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    count: number;
    delay: number;
  };
  /** Credentials mode */
  credentials?: RequestCredentials;
}

export interface FetchOptions extends RequestInit {
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request body (auto-serialized) */
  json?: unknown;
  /** Timeout in ms */
  timeout?: number;
}

/**
 * Create an API client
 */
export function createAPIClient(options: APIClientOptions = {}) {
  const {
    baseURL = '',
    headers: defaultHeaders = {},
    timeout: defaultTimeout = 30000,
    retry = { count: 0, delay: 1000 },
    credentials = 'same-origin',
  } = options;

  async function request<T>(
    endpoint: string,
    fetchOptions: FetchOptions = {}
  ): Promise<T> {
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
      ...(init.headers as Record<string, string>),
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

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= retry.count) {
      try {
        // Build fetch options, excluding signal from init to use our controller
        const { signal: _ignored, ...restInit } = init;
        const response = await fetch(url, {
          ...restInit,
          headers,
          body: body ?? null,
          credentials,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new APIError(
            errorData.message || response.statusText,
            response.status,
            errorData
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return response.json();
        }
        return response.text() as unknown as T;
      } catch (error) {
        lastError = error as Error;
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
    get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'GET' });
    },

    /** POST request */
    post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'POST', json: data });
    },

    /** PUT request */
    put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'PUT', json: data });
    },

    /** PATCH request */
    patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'PATCH', json: data });
    },

    /** DELETE request */
    delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
      return request<T>(endpoint, { ...options, method: 'DELETE' });
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
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Hook for fetching data (works with PhilJS signals)
 */
export function useFetch<T>(
  endpoint: string | (() => string | null),
  options: FetchOptions & { immediate?: boolean } = {}
) {
  const { immediate = true, ...fetchOptions } = options;

  let data: T | null = null;
  let error: Error | null = null;
  let loading = false;

  async function execute(): Promise<T | null> {
    const url = typeof endpoint === 'function' ? endpoint() : endpoint;
    if (!url) return null;

    loading = true;
    error = null;

    try {
      data = await apiClient.get<T>(url, fetchOptions);
      return data;
    } catch (e) {
      error = e as Error;
      return null;
    } finally {
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
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  let data: TData | null = null;
  let error: Error | null = null;
  let loading = false;

  async function mutate(variables: TVariables): Promise<TData | null> {
    loading = true;
    error = null;

    try {
      data = await mutationFn(variables);
      return data;
    } catch (e) {
      error = e as Error;
      return null;
    } finally {
      loading = false;
    }
  }

  function reset(): void {
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
