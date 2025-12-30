/**
 * Ambient module declaration for @philjs/router
 * This provides type definitions for the router package when building
 * in isolation or when workspace dependencies are not fully resolved.
 */

declare module '@philjs/router' {
  export type RouteComponent<Props = any> = (props: Props) => any;

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
    errorBoundary?: any;
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
    params: Record<string, string>;
    data?: any;
    error?: any;
    url: URL;
    navigate: NavigateFunction;
    searchParams?: URLSearchParams;
    outlet?: any;
  };

  export type LayoutComponentProps = RouteComponentProps & {
    children: any;
  };

  export type LoaderContext = {
    params: Record<string, string>;
    request: Request;
  };

  export type ActionContext = LoaderContext & {
    formData: FormData;
  };

  export type PrefetchOptions =
    | boolean
    | {
        strategy?: 'hover' | 'visible' | 'intent' | 'eager' | 'manual';
        intentThreshold?: number;
        priority?: 'high' | 'low' | 'auto';
      };

  export type RouteTransitionOptions =
    | boolean
    | {
        type?: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'scale' | 'custom';
        duration?: number;
        easing?: string;
        customCSS?: string;
      };

  export type NavigateFunction = (
    to: string,
    options?: { replace?: boolean; state?: any }
  ) => Promise<void>;

  export type RouteManifestOptions = {
    base?: string;
  };

  export type RouteTypeGenerationOptions = RouteManifestOptions & {
    moduleName?: string;
  };

  export type RouteModule = {
    loader?: RouteDefinition['loader'];
    action?: RouteDefinition['action'];
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

  export type RouterOptions = {
    routes: RouteDefinition[];
    base?: string;
    transitions?: boolean | RouteTransitionOptions;
    prefetch?: boolean | PrefetchOptions;
    target?: string | HTMLElement;
  };

  export type RouteMatcher = (pathname: string) => MatchedRoute | null;

  /**
   * Generate TypeScript type definitions for routes.
   */
  export function generateRouteTypes(
    routes: RouteDefinition[],
    options?: RouteTypeGenerationOptions
  ): string;

  /**
   * Create a route manifest from route definitions.
   */
  export function createRouteManifest(
    routes: RouteDefinition[],
    options?: RouteManifestOptions
  ): Record<string, RouteModule>;

  /**
   * Create a route matcher function.
   */
  export function createRouteMatcher(
    routes: RouteDefinition[],
    options?: RouteManifestOptions
  ): RouteMatcher;

  /**
   * Create a high-level router with declarative routes.
   */
  export function createAppRouter(options: RouterOptions): {
    manifest: Record<string, RouteModule>;
    navigate: NavigateFunction;
    dispose: () => void;
    getCurrentRoute: () => MatchedRoute | null;
    getMatches: () => any[];
    revalidate: () => Promise<void>;
  };

  /**
   * Create a router from a route manifest.
   */
  export function createRouter(manifest: Record<string, RouteModule>): {
    manifest: Record<string, RouteModule>;
  };

  /**
   * Declarative navigation component.
   */
  export function Link(props: {
    to: string;
    replace?: boolean;
    prefetch?: PrefetchOptions;
    children?: any;
    [key: string]: any;
  }): any;

  /**
   * Hook to access current router state.
   */
  export function useRouter(): {
    route: MatchedRoute | null;
    navigate: NavigateFunction;
    matches: any[];
  };

  /**
   * Hook to access the current matched route.
   */
  export function useRoute(): MatchedRoute | null;

  /**
   * View component that renders the current route.
   */
  export function RouterView(): any;
}
