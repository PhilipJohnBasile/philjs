/**
 * SSR request handler - executes loaders and renders routes.
 */
export type VNode = any;
import type { Loader, Action } from "./types.js";
import type { RouteMatcher } from "philjs-router";
export type RouteModule = {
    loader?: Loader<any>;
    action?: Action<any>;
    default: (props: {
        data?: any;
        error?: any;
        params: Record<string, string>;
    }) => VNode;
};
export type RequestContext = {
    /** Original request object */
    request: Request;
    /** Request URL */
    url: URL;
    /** HTTP method */
    method: string;
    /** Request headers */
    headers: Headers;
    /** Route parameters */
    params: Record<string, string>;
    /** Form data (for POST requests) */
    formData?: FormData;
};
export type RenderOptions = {
    /** Function to match a pathname to a route module */
    match: RouteMatcher;
    /** Base URL for the application */
    baseUrl?: string;
    /** Custom renderer (defaults to philjs-core renderToString) */
    render?: (component: VNode) => Promise<string> | string;
};
/**
 * Handle an SSR request - match route, execute loader, render component.
 */
export declare function handleRequest(request: Request, options: RenderOptions): Promise<Response>;
//# sourceMappingURL=request-handler.d.ts.map