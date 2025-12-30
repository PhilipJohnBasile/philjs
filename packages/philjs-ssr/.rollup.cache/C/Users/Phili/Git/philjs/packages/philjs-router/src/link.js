/**
 * Enhanced Link Component with Qwik-style Prefetch Modes
 *
 * Prefetch modes:
 * - hover: Prefetch on hover (after configurable delay)
 * - visible: Prefetch when link enters viewport (Intersection Observer)
 * - intent: Prefetch on hover + focus (user intent signals)
 * - render: Prefetch immediately on render (critical paths)
 * - none: No prefetch (for external links or heavy pages)
 */
import { getPrefetchManager, prefetchRoute, prefetchRouteWithData } from './prefetch.js';
import { createIntersectionObserver, observeElement, unobserveElement } from './intersection.js';
/**
 * Default prefetch configuration by mode
 */
const MODE_DEFAULTS = {
    hover: { mode: 'hover', delay: 100, priority: 'low' },
    visible: { mode: 'visible', priority: 'medium' },
    intent: { mode: 'intent', delay: 50, priority: 'medium' },
    render: { mode: 'render', priority: 'high' },
    none: { mode: 'none', priority: 'idle' },
};
/**
 * Check if URL is external
 */
function isExternalUrl(href) {
    if (typeof window === 'undefined')
        return false;
    try {
        const url = new URL(href, window.location.origin);
        return url.origin !== window.location.origin;
    }
    catch {
        return false;
    }
}
/**
 * Normalize prefetch options
 */
function normalizePrefetchOptions(prefetch, isExternal) {
    // External links default to 'none'
    if (isExternal && prefetch === undefined) {
        return MODE_DEFAULTS.none;
    }
    // Default to 'hover' for internal links
    if (prefetch === undefined) {
        return MODE_DEFAULTS.hover;
    }
    // String mode
    if (typeof prefetch === 'string') {
        return MODE_DEFAULTS[prefetch] || MODE_DEFAULTS.hover;
    }
    // Full options object
    return {
        ...MODE_DEFAULTS[prefetch.mode || 'hover'],
        ...prefetch,
    };
}
/**
 * Create hover prefetch handlers
 */
function createHoverHandlers(href, options) {
    let hoverTimer = null;
    const onMouseEnter = () => {
        const delay = options.delay ?? 100;
        hoverTimer = setTimeout(() => {
            if (options.withData || options.preload) {
                const prefetchOpts = {};
                if (options.preload !== undefined)
                    prefetchOpts.preload = options.preload;
                if (options.params !== undefined)
                    prefetchOpts.params = options.params;
                prefetchRouteWithData(href, prefetchOpts);
            }
            else {
                prefetchRoute(href, options.mode);
            }
        }, delay);
    };
    const onMouseLeave = () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    };
    return { onMouseEnter, onMouseLeave };
}
/**
 * Create intent prefetch handlers (hover + focus)
 */
function createIntentHandlers(href, options) {
    let intentTimer = null;
    let hasPrefetched = false;
    const triggerPrefetch = () => {
        if (hasPrefetched)
            return;
        const delay = options.delay ?? 50;
        intentTimer = setTimeout(() => {
            hasPrefetched = true;
            if (options.withData || options.preload) {
                const prefetchOpts = {};
                if (options.preload !== undefined)
                    prefetchOpts.preload = options.preload;
                if (options.params !== undefined)
                    prefetchOpts.params = options.params;
                prefetchRouteWithData(href, prefetchOpts);
            }
            else {
                prefetchRoute(href, 'intent');
            }
        }, delay);
    };
    const cancelPrefetch = () => {
        if (intentTimer) {
            clearTimeout(intentTimer);
            intentTimer = null;
        }
    };
    return {
        onMouseEnter: triggerPrefetch,
        onMouseLeave: cancelPrefetch,
        onFocus: triggerPrefetch,
        onBlur: cancelPrefetch,
    };
}
/**
 * Setup visibility-based prefetching
 */
function setupVisibilityPrefetch(element, href, options) {
    const observer = createIntersectionObserver({
        rootMargin: '50px',
        threshold: 0.1,
        onIntersect: (entry) => {
            if (entry.isIntersecting) {
                if (options.withData || options.preload) {
                    const prefetchOpts = {};
                    if (options.preload !== undefined)
                        prefetchOpts.preload = options.preload;
                    if (options.params !== undefined)
                        prefetchOpts.params = options.params;
                    prefetchRouteWithData(href, prefetchOpts);
                }
                else {
                    prefetchRoute(href, 'visible');
                }
                // Stop observing after prefetch
                unobserveElement(element);
            }
        },
    });
    observeElement(element, observer);
    return () => unobserveElement(element);
}
/**
 * Trigger immediate prefetch (render mode)
 */
function triggerRenderPrefetch(href, options) {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    schedule(() => {
        if (options.withData || options.preload) {
            const prefetchOpts = { preload: true };
            if (options.params !== undefined)
                prefetchOpts.params = options.params;
            prefetchRouteWithData(href, prefetchOpts);
        }
        else {
            prefetchRoute(href, 'render');
        }
    });
}
/**
 * Enhanced Link component with Qwik-style prefetching
 *
 * @example
 * ```tsx
 * // Prefetch on hover (default, after 100ms delay)
 * <Link href="/dashboard" prefetch="hover">Dashboard</Link>
 *
 * // Prefetch when visible (Intersection Observer)
 * <Link href="/about" prefetch="visible">About</Link>
 *
 * // Prefetch on intent (hover + focus)
 * <Link href="/users" prefetch="intent">Users</Link>
 *
 * // Prefetch immediately on render
 * <Link href="/critical" prefetch="render">Critical</Link>
 *
 * // No prefetch
 * <Link href="/heavy" prefetch="none">Heavy Page</Link>
 *
 * // With data prefetching
 * <Link href="/users/123" prefetch={{ mode: 'hover', withData: true }}>
 *   User 123
 * </Link>
 * ```
 */
export function EnhancedLink(props) {
    const { href, prefetch, replace, children, className, ...rest } = props;
    const isExternal = isExternalUrl(href);
    const prefetchOptions = normalizePrefetchOptions(prefetch, isExternal);
    // Collect event handlers based on mode
    const eventHandlers = {};
    let cleanupFn = null;
    if (prefetchOptions.mode === 'hover') {
        const { onMouseEnter, onMouseLeave } = createHoverHandlers(href, prefetchOptions);
        eventHandlers['onMouseEnter'] = onMouseEnter;
        eventHandlers['onMouseLeave'] = onMouseLeave;
    }
    else if (prefetchOptions.mode === 'intent') {
        const handlers = createIntentHandlers(href, prefetchOptions);
        eventHandlers['onMouseEnter'] = handlers.onMouseEnter;
        eventHandlers['onMouseLeave'] = handlers.onMouseLeave;
        eventHandlers['onFocus'] = handlers.onFocus;
        eventHandlers['onBlur'] = handlers.onBlur;
    }
    // Handle click for internal navigation
    const handleClick = (event) => {
        // Call original onClick if provided
        if (rest['onClick']) {
            rest['onClick'](event);
        }
        // Skip if:
        // - Default was prevented
        // - Not left click
        // - Modifier key was pressed
        // - External link
        if (event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey ||
            isExternal) {
            return;
        }
        event.preventDefault();
        // Navigate using history API
        const url = new URL(href, window.location.origin);
        if (replace) {
            window.history.replaceState({}, '', url.toString());
        }
        else {
            window.history.pushState({}, '', url.toString());
        }
        // Dispatch popstate for router to pick up
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
    // Build props
    const linkProps = {
        href,
        className,
        'data-prefetch': prefetchOptions.mode,
        'data-router-link': '',
        ...rest,
        ...eventHandlers,
        onClick: handleClick,
        children,
    };
    // Handle visibility and render modes via ref callback
    if (prefetchOptions.mode === 'visible' || prefetchOptions.mode === 'render') {
        linkProps['ref'] = (element) => {
            if (!element) {
                cleanupFn?.();
                return;
            }
            if (prefetchOptions.mode === 'visible') {
                cleanupFn = setupVisibilityPrefetch(element, href, prefetchOptions);
            }
            else if (prefetchOptions.mode === 'render') {
                triggerRenderPrefetch(href, prefetchOptions);
            }
        };
    }
    return {
        type: 'a',
        props: linkProps,
    };
}
/**
 * Alias for backward compatibility
 */
export const PrefetchLink = EnhancedLink;
/**
 * Hook for manual prefetch control
 *
 * @example
 * ```tsx
 * function NavLink({ href, children }) {
 *   const { prefetch, handlers, isPrefetched } = usePrefetchLink(href, {
 *     mode: 'hover',
 *     withData: true,
 *   });
 *
 *   return (
 *     <a
 *       href={href}
 *       {...handlers}
 *       data-prefetched={isPrefetched}
 *     >
 *       {children}
 *     </a>
 *   );
 * }
 * ```
 */
export function usePrefetchLink(href, options = {}) {
    const manager = getPrefetchManager();
    const prefetchOptions = normalizePrefetchOptions(options, isExternalUrl(href));
    // Track state
    let isPrefetched = manager?.isPrefetched(href) ?? false;
    let isLoading = manager?.isLoading(href) ?? false;
    // Manual prefetch trigger
    const triggerPrefetch = async () => {
        if (options.withData || options.preload) {
            const prefetchOpts = {};
            if (options.preload !== undefined)
                prefetchOpts.preload = options.preload;
            if (options.params !== undefined)
                prefetchOpts.params = options.params;
            await prefetchRouteWithData(href, prefetchOpts);
        }
        else {
            await prefetchRoute(href, options.mode);
        }
        isPrefetched = true;
        isLoading = false;
    };
    // Build handlers based on mode
    let handlers = {};
    if (prefetchOptions.mode === 'hover') {
        const hoverHandlers = createHoverHandlers(href, prefetchOptions);
        handlers = {
            onMouseEnter: hoverHandlers.onMouseEnter,
            onMouseLeave: hoverHandlers.onMouseLeave,
        };
    }
    else if (prefetchOptions.mode === 'intent') {
        const intentHandlers = createIntentHandlers(href, prefetchOptions);
        handlers = intentHandlers;
    }
    // Immediate prefetch
    if (options.immediate && !isPrefetched) {
        triggerPrefetch();
    }
    return {
        prefetch: triggerPrefetch,
        isPrefetched,
        isLoading,
        handlers,
    };
}
//# sourceMappingURL=link.js.map