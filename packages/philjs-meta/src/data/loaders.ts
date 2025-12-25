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
 * Loader function context
 */
export interface LoaderContext<Params = Record<string, string | string[]>> {
  /** Route parameters */
  params: Params;

  /** Request object (server-side) */
  request: Request;

  /** URL search parameters */
  searchParams: URLSearchParams;

  /** Abort signal for cancellation */
  signal: AbortSignal;

  /** Server context (cookies, headers, etc.) */
  serverContext: ServerContext;
}

/**
 * Server context available in loaders
 */
export interface ServerContext {
  /** Request cookies */
  cookies: CookieStore;

  /** Request headers */
  headers: Headers;

  /** Response headers to set */
  responseHeaders: Headers;

  /** Set a cookie */
  setCookie: (name: string, value: string, options?: CookieOptions) => void;

  /** Delete a cookie */
  deleteCookie: (name: string) => void;

  /** Redirect response */
  redirect: (url: string, status?: number) => never;

  /** Not found response */
  notFound: () => never;
}

/**
 * Cookie options
 */
export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Cookie store interface
 */
export interface CookieStore {
  get(name: string): string | undefined;
  getAll(): Record<string, string>;
  has(name: string): boolean;
}

/**
 * Loader function type
 */
export type LoaderFunction<Data = unknown, Params = Record<string, string | string[]>> = (
  context: LoaderContext<Params>
) => Data | Promise<Data>;

/**
 * Action function context
 */
export interface ActionContext<Params = Record<string, string | string[]>> {
  /** Route parameters */
  params: Params;

  /** Request object */
  request: Request;

  /** Form data from the request */
  formData: () => Promise<FormData>;

  /** JSON body from the request */
  json: <T = unknown>() => Promise<T>;

  /** Server context */
  serverContext: ServerContext;
}

/**
 * Action function type
 */
export type ActionFunction<Data = unknown, Params = Record<string, string | string[]>> = (
  context: ActionContext<Params>
) => Data | Promise<Data>;

/**
 * Action response type
 */
export interface ActionResponse<Data = unknown> {
  data?: Data;
  errors?: ActionErrors;
  success: boolean;
}

/**
 * Action errors type
 */
export interface ActionErrors {
  [field: string]: string | string[];
}

/**
 * Loader data store (for SSR/hydration)
 */
class LoaderDataStore {
  private data: Map<string, unknown> = new Map();
  private promises: Map<string, Promise<unknown>> = new Map();
  private errors: Map<string, Error> = new Map();

  set(key: string, data: unknown): void {
    this.data.set(key, data);
    this.promises.delete(key);
    this.errors.delete(key);
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  setPromise(key: string, promise: Promise<unknown>): void {
    this.promises.set(key, promise);
  }

  getPromise(key: string): Promise<unknown> | undefined {
    return this.promises.get(key);
  }

  setError(key: string, error: Error): void {
    this.errors.set(key, error);
    this.promises.delete(key);
  }

  getError(key: string): Error | undefined {
    return this.errors.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  clear(key: string): void {
    this.data.delete(key);
    this.promises.delete(key);
    this.errors.delete(key);
  }

  clearAll(): void {
    this.data.clear();
    this.promises.clear();
    this.errors.clear();
  }

  serialize(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.data) {
      result[key] = value;
    }
    return result;
  }

  hydrate(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      this.data.set(key, value);
    }
  }
}

/**
 * Action data store
 */
class ActionDataStore {
  private data: Map<string, ActionResponse> = new Map();
  private submitting: Map<string, boolean> = new Map();

  set(key: string, response: ActionResponse): void {
    this.data.set(key, response);
    this.submitting.set(key, false);
  }

  get<T>(key: string): ActionResponse<T> | undefined {
    return this.data.get(key) as ActionResponse<T> | undefined;
  }

  setSubmitting(key: string, submitting: boolean): void {
    this.submitting.set(key, submitting);
  }

  isSubmitting(key: string): boolean {
    return this.submitting.get(key) || false;
  }

  clear(key: string): void {
    this.data.delete(key);
    this.submitting.delete(key);
  }

  clearAll(): void {
    this.data.clear();
    this.submitting.clear();
  }
}

// Global stores
const loaderStore = new LoaderDataStore();
const actionStore = new ActionDataStore();

// Current route context (for hooks)
let currentRouteKey: string = '';
let currentLoaderContext: LoaderContext | null = null;
let currentActionContext: ActionContext | null = null;

/**
 * Set the current route context
 */
export function setRouteContext(
  routeKey: string,
  loaderContext?: LoaderContext,
  actionContext?: ActionContext
): void {
  currentRouteKey = routeKey;
  if (loaderContext) currentLoaderContext = loaderContext;
  if (actionContext) currentActionContext = actionContext;
}

/**
 * Get current route key
 */
export function getRouteKey(): string {
  return currentRouteKey;
}

/**
 * Define a loader function for a route
 */
export function defineLoader<Data = unknown, Params = Record<string, string | string[]>>(
  loader: LoaderFunction<Data, Params>
): LoaderFunction<Data, Params> {
  return loader;
}

/**
 * Define an action function for a route
 */
export function defineAction<Data = unknown, Params = Record<string, string | string[]>>(
  action: ActionFunction<Data, Params>
): ActionFunction<Data, Params> {
  return action;
}

/**
 * Execute a loader function
 */
export async function executeLoader<Data = unknown>(
  routeKey: string,
  loader: LoaderFunction<Data>,
  context: LoaderContext
): Promise<Data> {
  try {
    loaderStore.setPromise(routeKey, Promise.resolve());

    const data = await loader(context);
    loaderStore.set(routeKey, data);

    return data;
  } catch (error) {
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
export async function executeAction<Data = unknown>(
  routeKey: string,
  action: ActionFunction<Data>,
  context: ActionContext
): Promise<ActionResponse<Data>> {
  try {
    actionStore.setSubmitting(routeKey, true);

    const data = await action(context);

    const response: ActionResponse<Data> = {
      data,
      success: true,
    };

    actionStore.set(routeKey, response);
    return response;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect/error responses
    }

    const response: ActionResponse<Data> = {
      errors: {
        _form: error instanceof Error ? error.message : String(error),
      },
      success: false,
    };

    actionStore.set(routeKey, response);
    return response;
  } finally {
    actionStore.setSubmitting(routeKey, false);
  }
}

/**
 * Hook to access loader data in components
 */
export function useLoaderData<Data = unknown>(): Data {
  const data = loaderStore.get<Data>(currentRouteKey);

  if (data === undefined) {
    const error = loaderStore.getError(currentRouteKey);
    if (error) {
      throw error;
    }

    throw new Error(
      `No loader data found for route "${currentRouteKey}". ` +
      'Make sure the loader has completed before rendering.'
    );
  }

  return data;
}

/**
 * Hook to access action data in components
 */
export function useActionData<Data = unknown>(): ActionResponse<Data> | undefined {
  return actionStore.get<Data>(currentRouteKey);
}

/**
 * Hook to check if an action is submitting
 */
export function useIsSubmitting(): boolean {
  return actionStore.isSubmitting(currentRouteKey);
}

/**
 * Hook to access route parameters
 */
export function useParams<Params = Record<string, string | string[]>>(): Params {
  if (!currentLoaderContext) {
    throw new Error('useParams must be used within a route context');
  }
  return currentLoaderContext.params as Params;
}

/**
 * Hook to access search parameters
 */
export function useSearchParams(): URLSearchParams {
  if (!currentLoaderContext) {
    throw new Error('useSearchParams must be used within a route context');
  }
  return currentLoaderContext.searchParams;
}

/**
 * Create a form action handler
 */
export function createFormAction<Data = unknown>(
  routeKey: string,
  action: ActionFunction<Data>
): FormActionHandler<Data> {
  return {
    async submit(formData: FormData): Promise<ActionResponse<Data>> {
      const request = new Request(window.location.href, {
        method: 'POST',
        body: formData,
      });

      const context: ActionContext = {
        params: {},
        request,
        formData: async () => formData,
        json: async () => {
          const obj: Record<string, unknown> = {};
          formData.forEach((value, key) => {
            obj[key] = value;
          });
          return obj as unknown;
        },
        serverContext: createClientServerContext(),
      };

      return executeAction(routeKey, action, context);
    },

    isSubmitting(): boolean {
      return actionStore.isSubmitting(routeKey);
    },

    getData(): ActionResponse<Data> | undefined {
      return actionStore.get<Data>(routeKey);
    },

    reset(): void {
      actionStore.clear(routeKey);
    },
  };
}

export interface FormActionHandler<Data = unknown> {
  submit(formData: FormData): Promise<ActionResponse<Data>>;
  isSubmitting(): boolean;
  getData(): ActionResponse<Data> | undefined;
  reset(): void;
}

/**
 * Create a client-side server context (for hydration)
 */
function createClientServerContext(): ServerContext {
  return {
    cookies: {
      get: (name) => {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? match[2] : undefined;
      },
      getAll: () => {
        const cookies: Record<string, string> = {};
        document.cookie.split(';').forEach((cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name) cookies[name] = value;
        });
        return cookies;
      },
      has: (name) => document.cookie.includes(`${name}=`),
    },
    headers: new Headers(),
    responseHeaders: new Headers(),
    setCookie: (name, value, options) => {
      let cookie = `${name}=${value}`;
      if (options?.path) cookie += `; path=${options.path}`;
      if (options?.domain) cookie += `; domain=${options.domain}`;
      if (options?.expires) cookie += `; expires=${options.expires.toUTCString()}`;
      if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
      if (options?.httpOnly) cookie += '; httpOnly';
      if (options?.secure) cookie += '; secure';
      if (options?.sameSite) cookie += `; sameSite=${options.sameSite}`;
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
export function createServerContext(request: Request): ServerContext {
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
      if (options?.path) cookie += `; Path=${options.path}`;
      if (options?.domain) cookie += `; Domain=${options.domain}`;
      if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
      if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
      if (options?.httpOnly) cookie += '; HttpOnly';
      if (options?.secure) cookie += '; Secure';
      if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
      responseHeaders.append('Set-Cookie', cookie);
    },
    deleteCookie: (name) => {
      responseHeaders.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      );
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
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

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
  constructor(url: string, status: number = 302) {
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
export function json<Data>(data: Data, init?: ResponseInit): Response {
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
export function redirect(url: string, status: number = 302): never {
  throw new RedirectResponse(url, status);
}

/**
 * Defer helper for streaming data
 */
export function defer<Data extends Record<string, unknown>>(data: Data): DeferredData<Data> {
  return new DeferredData(data);
}

/**
 * Deferred data class for streaming
 */
export class DeferredData<Data extends Record<string, unknown>> {
  private data: Data;
  private resolved: Map<keyof Data, boolean> = new Map();

  constructor(data: Data) {
    this.data = data;

    // Track promise resolution
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Promise) {
        this.resolved.set(key as keyof Data, false);
        value.then(() => this.resolved.set(key as keyof Data, true));
      } else {
        this.resolved.set(key as keyof Data, true);
      }
    }
  }

  get<K extends keyof Data>(key: K): Data[K] {
    return this.data[key];
  }

  isResolved(key: keyof Data): boolean {
    return this.resolved.get(key) || false;
  }

  async resolveAll(): Promise<{ [K in keyof Data]: Awaited<Data[K]> }> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(this.data)) {
      result[key] = value instanceof Promise ? await value : value;
    }

    return result as { [K in keyof Data]: Awaited<Data[K]> };
  }
}

/**
 * Hydration utilities
 */
export const hydration = {
  /**
   * Get serialized loader data for hydration script
   */
  getHydrationScript(): string {
    const data = loaderStore.serialize();
    return `window.__PHILJS_LOADER_DATA__ = ${JSON.stringify(data)};`;
  },

  /**
   * Hydrate loader data from window
   */
  hydrate(): void {
    if (typeof window !== 'undefined' && (window as WindowWithHydrationData).__PHILJS_LOADER_DATA__) {
      loaderStore.hydrate((window as WindowWithHydrationData).__PHILJS_LOADER_DATA__);
    }
  },

  /**
   * Clear all loader and action data
   */
  clear(): void {
    loaderStore.clearAll();
    actionStore.clearAll();
  },
};

interface WindowWithHydrationData extends Window {
  __PHILJS_LOADER_DATA__: Record<string, unknown>;
}
