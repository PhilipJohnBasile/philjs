/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 *
 * Enhanced with Remix-style nested routes with parallel data loading.
 */
import type { JSXElement, VNode } from "philjs-core";
import { type ErrorBoundaryComponent } from "./error-boundary.js";
export type RouteComponent<Props = any> = (props: Props) => VNode | JSXElement | string | null | undefined;
export type RouteDefinition = {
    /** Route path pattern (e.g., "/users/:id") */
    path: string;
    /** Route component */
    component: RouteComponent<RouteComponentProps>;
    /** Data loader function */
    loader?: (context: LoaderContext) => Promise<any>;
    /** Action function for mutations */
    action?: (context: ActionContext) => Promise<Response | void>;
    /** Child routes for nesting */
    children?: RouteDefinition[];
    /** Layout component that wraps children */
    layout?: RouteComponent<LayoutComponentProps>;
    /** Error boundary component */
    errorBoundary?: ErrorBoundaryComponent;
    /** Route transition configuration */
    transition?: RouteTransitionOptions;
    /** Prefetch configuration */
    prefetch?: PrefetchOptions;
    /** Route ID for loader data access */
    id?: string;
    /** Handle object for useMatches */
    handle?: unknown;
    /** Additional route configuration */
    config?: Record<string, unknown>;
};
export type RouteComponentProps = {
    /** Route parameters extracted from the URL */
    params: Record<string, string>;
    /** Loader data */
    data?: any;
    /** Error from loader or action */
    error?: any;
    /** Current URL */
    url: URL;
    /** Navigation function */
    navigate: NavigateFunction;
    /** URL search params */
    searchParams?: URLSearchParams;
    /** Child outlet content (for nested routes) */
    outlet?: VNode | JSXElement | string | null;
};
export type LayoutComponentProps = RouteComponentProps & {
    /** Child content to render inside layout */
    children: VNode | JSXElement | string | null | undefined;
};
export type LoaderContext = {
    params: Record<string, string>;
    request: Request;
};
export type ActionContext = LoaderContext & {
    formData: FormData;
};
export type PrefetchOptions = boolean | {
    strategy?: "hover" | "visible" | "intent" | "eager" | "manual";
    intentThreshold?: number;
    priority?: "high" | "low" | "auto";
};
export type RouteTransitionOptions = boolean | {
    type?: "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "scale" | "custom";
    duration?: number;
    easing?: string;
    customCSS?: string;
};
export type RouterOptions = {
    routes: RouteDefinition[];
    base?: string;
    transitions?: boolean | RouteTransitionOptions;
    prefetch?: boolean | PrefetchOptions;
    target?: string | HTMLElement;
};
export type RouteManifestOptions = {
    base?: string;
};
export type RouteTypeGenerationOptions = RouteManifestOptions & {
    moduleName?: string;
};
export type RouteMatcher = (pathname: string) => MatchedRoute | null;
export type NavigateFunction = (to: string, options?: {
    replace?: boolean;
    state?: any;
}) => Promise<void>;
export type RouteModule = {
    loader?: RouteDefinition["loader"];
    action?: RouteDefinition["action"];
    default: RouteComponent<RouteComponentProps>;
    config?: Record<string, unknown>;
};
export type MatchedRoute = {
    path: string;
    params: Record<string, string>;
    data?: any;
    error?: any;
    component: RouteComponent<RouteComponentProps>;
    module: RouteModule;
};
/**
 * Matched route in a hierarchy for nested routing.
 */
export type NestedMatchedRoute = MatchedRoute & {
    /** Route ID */
    id: string;
    /** Parent route ID */
    parentId?: string;
    /** Loader data */
    loaderData?: any;
    /** Action data */
    actionData?: any;
    /** Handle object */
    handle?: unknown;
};
type RouterState = {
    route: MatchedRoute | null;
    navigate: NavigateFunction;
    /** All matched routes in the hierarchy */
    matches: NestedMatchedRoute[];
};
export type HighLevelRouter = {
    manifest: Record<string, RouteModule>;
    navigate: NavigateFunction;
    dispose: () => void;
    getCurrentRoute: () => MatchedRoute | null;
    /** Get all matched routes in the current hierarchy */
    getMatches: () => NestedMatchedRoute[];
    /** Revalidate all loader data */
    revalidate: () => Promise<void>;
};
/**
 * Create a high-level router with declarative routes.
 * Supports Remix-style nested routes with parallel data loading.
 */
export declare function createAppRouter(options: RouterOptions): HighLevelRouter;
export declare function createRouteManifest(routes: RouteDefinition[], options?: RouteManifestOptions): Record<string, RouteModule>;
export declare function createRouteMatcher(routes: RouteDefinition[], options?: RouteManifestOptions): RouteMatcher;
export declare function generateRouteTypes(routes: RouteDefinition[], options?: RouteTypeGenerationOptions): string;
/**
 * Hook to access current router state (route + navigate).
 */
export declare function useRouter(): RouterState;
/**
 * Hook to access the current matched route detail.
 */
export declare function useRoute(): MatchedRoute | null;
/**
 * View component that renders the current route.
 */
export declare function RouterView(): VNode | JSXElement | string | null;
type LinkProps = {
    to: string;
    replace?: boolean;
    prefetch?: PrefetchOptions;
    children?: VNode | JSXElement | string;
    [key: string]: any;
};
/**
 * Declarative navigation component.
 */
export declare function Link(props: LinkProps): VNode;
export {};
//# sourceMappingURL=high-level.d.ts.map