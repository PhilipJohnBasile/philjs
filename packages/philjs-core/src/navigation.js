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
import { signal, effect } from './signals.js';
import { startViewTransition } from './view-transitions.js';
// ============================================================================
// Feature Detection
// ============================================================================
/**
 * Check if the Navigation API is supported.
 */
export function supportsNavigationAPI() {
    return typeof window !== 'undefined' && 'navigation' in window;
}
// ============================================================================
// Route Matching
// ============================================================================
/**
 * Compile a route pattern to a RegExp.
 */
function compilePattern(pattern) {
    const keys = [];
    const regexPattern = pattern
        .replace(/\//g, '\\/')
        .replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return '([^\\/]+)';
    })
        .replace(/\*/g, '(.*)');
    return {
        regex: new RegExp(`^${regexPattern}$`),
        keys,
    };
}
/**
 * Match a path against a route pattern.
 */
function matchRoute(path, pattern) {
    const { regex, keys } = compilePattern(pattern);
    const match = path.match(regex);
    if (!match)
        return null;
    const params = {};
    keys.forEach((key, i) => {
        params[key] = match[i + 1] ?? '';
    });
    return params;
}
// ============================================================================
// Router Implementation
// ============================================================================
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
export function createRouter(routes, options = {}) {
    const { base = '', viewTransitions = true, scrollRestoration = 'auto', notFound, } = options;
    const current = signal(null);
    const result = signal(null);
    const guards = [];
    const callbacks = [];
    let started = false;
    let cleanup = null;
    // Compile routes
    const compiledRoutes = Object.entries(routes).map(([pattern, handler]) => ({
        pattern: base + pattern,
        handler,
        compiled: compilePattern(base + pattern),
    }));
    /**
     * Find matching route for a path.
     */
    function findRoute(path) {
        for (const route of compiledRoutes) {
            const params = matchRoute(path, route.pattern);
            if (params !== null) {
                return [route.handler, params];
            }
        }
        return [(notFound ?? null), {}];
    }
    /**
     * Handle navigation to a URL.
     */
    async function handleNavigation(url, options = {}) {
        const path = url.pathname;
        const [handler, params] = findRoute(path);
        const to = {
            path,
            params,
            query: url.searchParams,
            hash: url.hash,
        };
        const from = current();
        // Run guards
        for (const guard of guards) {
            const result = await guard(to, from);
            if (result === false) {
                return false;
            }
            if (typeof result === 'string') {
                // Redirect
                await navigate(result, { replace: true });
                return true;
            }
        }
        // Update current route
        const updateFn = () => {
            current.set(to);
            if (handler) {
                result.set(handler(to));
            }
            else {
                result.set(null);
            }
        };
        // Apply view transition
        const useTransition = options.transition ?? viewTransitions;
        if (useTransition) {
            const transitionOptions = typeof useTransition === 'object' ? useTransition : {};
            await startViewTransition(updateFn, transitionOptions);
        }
        else {
            updateFn();
        }
        // Handle scroll
        if (options.scroll !== false) {
            const { x = 0, y = 0 } = options.scroll ?? {};
            window.scrollTo(x, y);
        }
        // Run callbacks
        for (const callback of callbacks) {
            await callback(to, from);
        }
        return true;
    }
    /**
     * Navigate to a URL.
     */
    async function navigate(url, options = {}) {
        const fullUrl = new URL(url, window.location.origin);
        if (supportsNavigationAPI()) {
            // Use Navigation API
            const nav = window.navigation;
            if (options.replace) {
                await nav.navigate(fullUrl.href, {
                    state: options.state,
                    history: 'replace',
                }).finished;
            }
            else {
                await nav.navigate(fullUrl.href, {
                    state: options.state,
                }).finished;
            }
        }
        else {
            // Fallback to History API
            if (options.replace) {
                window.history.replaceState(options.state, '', fullUrl.href);
            }
            else {
                window.history.pushState(options.state, '', fullUrl.href);
            }
            await handleNavigation(fullUrl, options);
        }
    }
    /**
     * Start the router.
     */
    function start() {
        if (started)
            return;
        started = true;
        // Set scroll restoration
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = scrollRestoration;
        }
        if (supportsNavigationAPI()) {
            // Use Navigation API
            const nav = window.navigation;
            const handleNavigate = (event) => {
                // Only handle same-origin navigations
                if (!event.canIntercept)
                    return;
                if (event.hashChange)
                    return;
                if (event.downloadRequest)
                    return;
                const url = new URL(event.destination.url);
                // Check if this is a route we handle
                const [handler] = findRoute(url.pathname);
                if (!handler && !notFound)
                    return;
                event.intercept({
                    handler: async () => {
                        await handleNavigation(url, {
                            state: event.destination.getState(),
                        });
                    },
                });
            };
            nav.addEventListener('navigate', handleNavigate);
            cleanup = () => {
                nav.removeEventListener('navigate', handleNavigate);
            };
        }
        else {
            // Fallback to popstate
            const handlePopState = () => {
                handleNavigation(new URL(window.location.href));
            };
            window.addEventListener('popstate', handlePopState);
            cleanup = () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
        // Handle initial route
        handleNavigation(new URL(window.location.href));
    }
    /**
     * Stop the router.
     */
    function stop() {
        if (!started)
            return;
        started = false;
        cleanup?.();
        cleanup = null;
    }
    return {
        start,
        stop,
        navigate,
        replace: (url, opts) => navigate(url, { ...opts, replace: true }),
        back: () => window.history.back(),
        forward: () => window.history.forward(),
        go: (delta) => window.history.go(delta),
        current,
        result,
        beforeEach: (guard) => {
            guards.push(guard);
            return () => {
                const i = guards.indexOf(guard);
                if (i >= 0)
                    guards.splice(i, 1);
            };
        },
        afterEach: (callback) => {
            callbacks.push(callback);
            return () => {
                const i = callbacks.indexOf(callback);
                if (i >= 0)
                    callbacks.splice(i, 1);
            };
        },
    };
}
// ============================================================================
// Standalone Navigation Functions
// ============================================================================
/**
 * Navigate to a URL (uses Navigation API if available).
 *
 * @example
 * ```ts
 * await navigate('/about');
 * await navigate('/users/123', { state: { from: 'home' } });
 * ```
 */
export async function navigate(url, options = {}) {
    const fullUrl = new URL(url, window.location.origin);
    if (supportsNavigationAPI()) {
        const nav = window.navigation;
        await nav.navigate(fullUrl.href, {
            state: options.state,
            history: options.replace ? 'replace' : 'push',
        }).finished;
    }
    else {
        if (options.replace) {
            window.history.replaceState(options.state, '', fullUrl.href);
        }
        else {
            window.history.pushState(options.state, '', fullUrl.href);
        }
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}
// ============================================================================
// Reactive Location Signal
// ============================================================================
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
export function useLocation() {
    const location = signal(new URL(window.location.href));
    if (supportsNavigationAPI()) {
        const nav = window.navigation;
        nav.addEventListener('navigatesuccess', () => {
            location.set(new URL(window.location.href));
        });
    }
    else {
        window.addEventListener('popstate', () => {
            location.set(new URL(window.location.href));
        });
    }
    return location;
}
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
export function useSearchParams() {
    const params = signal(new URLSearchParams(window.location.search));
    if (supportsNavigationAPI()) {
        const nav = window.navigation;
        nav.addEventListener('navigatesuccess', () => {
            params.set(new URLSearchParams(window.location.search));
        });
    }
    else {
        window.addEventListener('popstate', () => {
            params.set(new URLSearchParams(window.location.search));
        });
    }
    return params;
}
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
export function useHash() {
    const hash = signal(window.location.hash);
    const update = () => {
        hash.set(window.location.hash);
    };
    window.addEventListener('hashchange', update);
    if (supportsNavigationAPI()) {
        const nav = window.navigation;
        nav.addEventListener('navigatesuccess', update);
    }
    else {
        window.addEventListener('popstate', update);
    }
    return hash;
}
// ============================================================================
// Link Interception
// ============================================================================
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
export function interceptLinks(options) {
    const { onNavigate, selector = 'a[href]', root = document, } = options;
    const handleClick = async (e) => {
        // Ignore if modifier keys are pressed
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)
            return;
        // Ignore non-primary clicks
        if (e.button !== 0)
            return;
        const link = e.target.closest(selector);
        if (!link)
            return;
        const href = link.getAttribute('href');
        if (!href)
            return;
        // Ignore external links
        if (link.origin !== window.location.origin)
            return;
        // Ignore links with target
        if (link.target && link.target !== '_self')
            return;
        // Ignore download links
        if (link.hasAttribute('download'))
            return;
        // Ignore links that opt out
        if (link.hasAttribute('data-native'))
            return;
        e.preventDefault();
        await onNavigate(href);
    };
    root.addEventListener('click', handleClick);
    return () => {
        root.removeEventListener('click', handleClick);
    };
}
//# sourceMappingURL=navigation.js.map