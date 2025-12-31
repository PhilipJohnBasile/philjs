/**
 * Navigation API Support for PhilJS
 *
 * The Navigation API provides a modern way to handle client-side navigation
 * with proper history management, navigation interception, and state handling.
 *
 * @see https://developer.chrome.com/docs/web-platform/navigation-api/
 *
 * @example
 * ```ts
 * import { createRouter, navigate, useLocation } from '@philjs/core/navigation';
 *
 * const router = createRouter({
 *   '/': () => html`<home-page></home-page>`,
 *   '/about': () => html`<about-page></about-page>`,
 *   '/users/:id': ({ params }) => html`<user-page id="${params.id}"></user-page>`,
 * });
 *
 * router.start();
 *
 * // Navigate programmatically
 * await navigate('/about');
 * ```
 */
import { type Signal } from './signals.js';
import { type ViewTransitionOptions } from './view-transitions.js';
export interface RouteParams {
    [key: string]: string;
}
export interface RouteMatch {
    path: string;
    params: RouteParams;
    query: URLSearchParams;
    hash: string;
}
export interface RouteHandler<T = unknown> {
    (match: RouteMatch): T;
}
export interface Routes<T = unknown> {
    [pattern: string]: RouteHandler<T>;
}
export interface RouterOptions {
    /**
     * Base path for all routes.
     * @default ''
     */
    base?: string;
    /**
     * Enable view transitions during navigation.
     * @default true
     */
    viewTransitions?: boolean | ViewTransitionOptions;
    /**
     * Scroll restoration behavior.
     * @default 'auto'
     */
    scrollRestoration?: ScrollRestoration;
    /**
     * Custom 404 handler.
     */
    notFound?: RouteHandler;
}
export interface Router<T = unknown> {
    /**
     * Start listening for navigation events.
     */
    start(): void;
    /**
     * Stop listening for navigation events.
     */
    stop(): void;
    /**
     * Navigate to a URL.
     */
    navigate(url: string, options?: NavigateOptions): Promise<void>;
    /**
     * Replace the current URL without adding to history.
     */
    replace(url: string, options?: NavigateOptions): Promise<void>;
    /**
     * Go back in history.
     */
    back(): void;
    /**
     * Go forward in history.
     */
    forward(): void;
    /**
     * Go to a specific history entry.
     */
    go(delta: number): void;
    /**
     * Get the current route.
     */
    current: Signal<RouteMatch | null>;
    /**
     * Get the current route result.
     */
    result: Signal<T | null>;
    /**
     * Add middleware to run before navigation.
     */
    beforeEach(guard: NavigationGuard): () => void;
    /**
     * Add middleware to run after navigation.
     */
    afterEach(callback: NavigationCallback): () => void;
}
export interface NavigateOptions {
    /**
     * State to associate with the history entry.
     */
    state?: unknown;
    /**
     * Whether to replace the current history entry.
     */
    replace?: boolean;
    /**
     * Scroll position after navigation.
     */
    scroll?: {
        x: number;
        y: number;
    } | false;
    /**
     * View transition options.
     */
    transition?: boolean | ViewTransitionOptions;
}
export type NavigationGuard = (to: RouteMatch, from: RouteMatch | null) => boolean | string | Promise<boolean | string>;
export type NavigationCallback = (to: RouteMatch, from: RouteMatch | null) => void | Promise<void>;
/**
 * Check if the Navigation API is supported.
 */
export declare function supportsNavigationAPI(): boolean;
/**
 * Create a router instance.
 *
 * @example
 * ```ts
 * const router = createRouter({
 *   '/': () => 'home',
 *   '/about': () => 'about',
 *   '/users/:id': ({ params }) => `user-${params.id}`,
 * });
 *
 * router.start();
 * ```
 */
export declare function createRouter<T>(routes: Routes<T>, options?: RouterOptions): Router<T>;
/**
 * Navigate to a URL (uses Navigation API if available).
 *
 * @example
 * ```ts
 * await navigate('/about');
 * await navigate('/users/123', { state: { from: 'home' } });
 * ```
 */
export declare function navigate(url: string, options?: NavigateOptions): Promise<void>;
/**
 * Create a reactive signal for the current location.
 *
 * @example
 * ```ts
 * const location = useLocation();
 *
 * effect(() => {
 *   console.log('Path changed:', location().pathname);
 * });
 * ```
 */
export declare function useLocation(): Signal<URL>;
/**
 * Create a reactive signal for URL search params.
 *
 * @example
 * ```ts
 * const params = useSearchParams();
 *
 * effect(() => {
 *   console.log('Search:', params().get('q'));
 * });
 * ```
 */
export declare function useSearchParams(): Signal<URLSearchParams>;
/**
 * Create a reactive signal for the URL hash.
 *
 * @example
 * ```ts
 * const hash = useHash();
 *
 * effect(() => {
 *   console.log('Hash:', hash());
 * });
 * ```
 */
export declare function useHash(): Signal<string>;
/**
 * Set up automatic link interception for SPA navigation.
 * Intercepts clicks on <a> elements with same-origin hrefs.
 *
 * @example
 * ```ts
 * const cleanup = interceptLinks({
 *   onNavigate: (url) => router.navigate(url),
 * });
 * ```
 */
export declare function interceptLinks(options: {
    onNavigate: (url: string) => void | Promise<void>;
    selector?: string;
    root?: Element | Document;
}): () => void;
//# sourceMappingURL=navigation.d.ts.map