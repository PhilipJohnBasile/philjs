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
export type LoaderFunction<Data = unknown, Params = Record<string, string | string[]>> = (context: LoaderContext<Params>) => Data | Promise<Data>;
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
export type ActionFunction<Data = unknown, Params = Record<string, string | string[]>> = (context: ActionContext<Params>) => Data | Promise<Data>;
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
 * Set the current route context
 */
export declare function setRouteContext(routeKey: string, loaderContext?: LoaderContext, actionContext?: ActionContext): void;
/**
 * Get current route key
 */
export declare function getRouteKey(): string;
/**
 * Define a loader function for a route
 */
export declare function defineLoader<Data = unknown, Params = Record<string, string | string[]>>(loader: LoaderFunction<Data, Params>): LoaderFunction<Data, Params>;
/**
 * Define an action function for a route
 */
export declare function defineAction<Data = unknown, Params = Record<string, string | string[]>>(action: ActionFunction<Data, Params>): ActionFunction<Data, Params>;
/**
 * Execute a loader function
 */
export declare function executeLoader<Data = unknown>(routeKey: string, loader: LoaderFunction<Data>, context: LoaderContext): Promise<Data>;
/**
 * Execute an action function
 */
export declare function executeAction<Data = unknown>(routeKey: string, action: ActionFunction<Data>, context: ActionContext): Promise<ActionResponse<Data>>;
/**
 * Hook to access loader data in components
 */
export declare function useLoaderData<Data = unknown>(): Data;
/**
 * Hook to access action data in components
 */
export declare function useActionData<Data = unknown>(): ActionResponse<Data> | undefined;
/**
 * Hook to check if an action is submitting
 */
export declare function useIsSubmitting(): boolean;
/**
 * Hook to access route parameters
 */
export declare function useParams<Params = Record<string, string | string[]>>(): Params;
/**
 * Hook to access search parameters
 */
export declare function useSearchParams(): URLSearchParams;
/**
 * Create a form action handler
 */
export declare function createFormAction<Data = unknown>(routeKey: string, action: ActionFunction<Data>): FormActionHandler<Data>;
export interface FormActionHandler<Data = unknown> {
    submit(formData: FormData): Promise<ActionResponse<Data>>;
    isSubmitting(): boolean;
    getData(): ActionResponse<Data> | undefined;
    reset(): void;
}
/**
 * Create server-side server context
 */
export declare function createServerContext(request: Request): ServerContext;
/**
 * Redirect response class
 */
export declare class RedirectResponse extends Response {
    constructor(url: string, status?: number);
}
/**
 * Not found response class
 */
export declare class NotFoundResponse extends Response {
    constructor();
}
/**
 * JSON response helper
 */
export declare function json<Data>(data: Data, init?: ResponseInit): Response;
/**
 * Redirect helper
 */
export declare function redirect(url: string, status?: number): never;
/**
 * Defer helper for streaming data
 */
export declare function defer<Data extends Record<string, unknown>>(data: Data): DeferredData<Data>;
/**
 * Deferred data class for streaming
 */
export declare class DeferredData<Data extends Record<string, unknown>> {
    private data;
    private resolved;
    constructor(data: Data);
    get<K extends keyof Data>(key: K): Data[K];
    isResolved(key: keyof Data): boolean;
    resolveAll(): Promise<{
        [K in keyof Data]: Awaited<Data[K]>;
    }>;
}
/**
 * Hydration utilities
 */
export declare const hydration: {
    /**
     * Get serialized loader data for hydration script
     */
    getHydrationScript(): string;
    /**
     * Hydrate loader data from window
     */
    hydrate(): void;
    /**
     * Clear all loader and action data
     */
    clear(): void;
};
//# sourceMappingURL=loaders.d.ts.map