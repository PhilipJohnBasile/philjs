/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 */
import type { JSXElement, VNode } from "philjs-core";
export type RouteComponent<Props = any> = (props: Props) => VNode | JSXElement | string | null | undefined;
export type RouteDefinition = {
    path: string;
    component: RouteComponent<RouteComponentProps>;
    loader?: (context: LoaderContext) => Promise<any>;
    action?: (context: ActionContext) => Promise<Response | void>;
    children?: RouteDefinition[];
    layout?: RouteComponent<LayoutComponentProps>;
    transition?: RouteTransitionOptions;
    prefetch?: PrefetchOptions;
    config?: Record<string, unknown>;
};
export type RouteComponentProps = {
    params: Record<string, string>;
    data?: any;
    error?: any;
    url: URL;
    navigate: NavigateFunction;
};
export type LayoutComponentProps = RouteComponentProps & {
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
type RouterState = {
    route: MatchedRoute | null;
    navigate: NavigateFunction;
};
export type HighLevelRouter = {
    manifest: Record<string, RouteModule>;
    navigate: NavigateFunction;
    dispose: () => void;
    getCurrentRoute: () => MatchedRoute | null;
};
/**
 * Create a high-level router with declarative routes.
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