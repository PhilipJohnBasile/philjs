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

import type { VNode, JSXElement } from 'philjs-core';
import { getPrefetchManager, prefetchRoute, prefetchRouteWithData } from './prefetch.js';
import type { PrefetchMode, PrefetchPriority } from './prefetch.js';
import { createIntersectionObserver, observeElement, unobserveElement } from './intersection.js';

export type { PrefetchMode };

export interface LinkPrefetchOptions {
  /** Prefetch mode */
  mode?: PrefetchMode;
  /** Priority level */
  priority?: PrefetchPriority;
  /** Delay before prefetch starts (for hover mode) */
  delay?: number;
  /** Also prefetch route data (run loader) */
  withData?: boolean;
  /** Preload data immediately (for critical routes) */
  preload?: boolean;
  /** Custom params for data prefetch */
  params?: Record<string, string>;
}

export interface EnhancedLinkProps {
  /** Target URL */
  href: string;
  /** Prefetch mode or options */
  prefetch?: PrefetchMode | LinkPrefetchOptions;
  /** Replace history instead of push */
  replace?: boolean;
  /** Children to render */
  children?: VNode | JSXElement | string;
  /** CSS class name */
  className?: string;
  /** Additional props */
  [key: string]: any;
}

/**
 * Default prefetch configuration by mode
 */
const MODE_DEFAULTS: Record<PrefetchMode, LinkPrefetchOptions> = {
  hover: { mode: 'hover', delay: 100, priority: 'low' },
  visible: { mode: 'visible', priority: 'medium' },
  intent: { mode: 'intent', delay: 50, priority: 'medium' },
  render: { mode: 'render', priority: 'high' },
  none: { mode: 'none', priority: 'idle' },
};

/**
 * Check if URL is external
 */
function isExternalUrl(href: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Normalize prefetch options
 */
function normalizePrefetchOptions(
  prefetch: PrefetchMode | LinkPrefetchOptions | undefined,
  isExternal: boolean
): LinkPrefetchOptions {
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
function createHoverHandlers(
  href: string,
  options: LinkPrefetchOptions
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  const onMouseEnter = () => {
    const delay = options.delay ?? 100;

    hoverTimer = setTimeout(() => {
      if (options.withData || options.preload) {
        prefetchRouteWithData(href, {
          preload: options.preload,
          params: options.params,
        });
      } else {
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
function createIntentHandlers(
  href: string,
  options: LinkPrefetchOptions
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
} {
  let intentTimer: ReturnType<typeof setTimeout> | null = null;
  let hasPrefetched = false;

  const triggerPrefetch = () => {
    if (hasPrefetched) return;

    const delay = options.delay ?? 50;

    intentTimer = setTimeout(() => {
      hasPrefetched = true;
      if (options.withData || options.preload) {
        prefetchRouteWithData(href, {
          preload: options.preload,
          params: options.params,
        });
      } else {
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
function setupVisibilityPrefetch(
  element: HTMLAnchorElement,
  href: string,
  options: LinkPrefetchOptions
): () => void {
  const observer = createIntersectionObserver({
    rootMargin: '50px',
    threshold: 0.1,
    onIntersect: (entry) => {
      if (entry.isIntersecting) {
        if (options.withData || options.preload) {
          prefetchRouteWithData(href, {
            preload: options.preload,
            params: options.params,
          });
        } else {
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
function triggerRenderPrefetch(href: string, options: LinkPrefetchOptions): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedule = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));

  schedule(() => {
    if (options.withData || options.preload) {
      prefetchRouteWithData(href, {
        preload: true,
        params: options.params,
      });
    } else {
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
export function EnhancedLink(props: EnhancedLinkProps): VNode {
  const { href, prefetch, replace, children, className, ...rest } = props;

  const isExternal = isExternalUrl(href);
  const prefetchOptions = normalizePrefetchOptions(prefetch, isExternal);

  // Collect event handlers based on mode
  const eventHandlers: Record<string, (...args: any[]) => void> = {};
  let cleanupFn: (() => void) | null = null;

  if (prefetchOptions.mode === 'hover') {
    const { onMouseEnter, onMouseLeave } = createHoverHandlers(href, prefetchOptions);
    eventHandlers.onMouseEnter = onMouseEnter;
    eventHandlers.onMouseLeave = onMouseLeave;
  } else if (prefetchOptions.mode === 'intent') {
    const handlers = createIntentHandlers(href, prefetchOptions);
    eventHandlers.onMouseEnter = handlers.onMouseEnter;
    eventHandlers.onMouseLeave = handlers.onMouseLeave;
    eventHandlers.onFocus = handlers.onFocus;
    eventHandlers.onBlur = handlers.onBlur;
  }

  // Handle click for internal navigation
  const handleClick = (event: MouseEvent) => {
    // Call original onClick if provided
    if (rest.onClick) {
      rest.onClick(event);
    }

    // Skip if:
    // - Default was prevented
    // - Not left click
    // - Modifier key was pressed
    // - External link
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      isExternal
    ) {
      return;
    }

    event.preventDefault();

    // Navigate using history API
    const url = new URL(href, window.location.origin);
    if (replace) {
      window.history.replaceState({}, '', url.toString());
    } else {
      window.history.pushState({}, '', url.toString());
    }

    // Dispatch popstate for router to pick up
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Build props
  const linkProps: Record<string, any> = {
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
    linkProps.ref = (element: HTMLAnchorElement | null) => {
      if (!element) {
        cleanupFn?.();
        return;
      }

      if (prefetchOptions.mode === 'visible') {
        cleanupFn = setupVisibilityPrefetch(element, href, prefetchOptions);
      } else if (prefetchOptions.mode === 'render') {
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

// ============================================================================
// Hook for manual prefetch control
// ============================================================================

export interface UsePrefetchLinkOptions extends LinkPrefetchOptions {
  /** Start prefetch immediately */
  immediate?: boolean;
}

export interface UsePrefetchLinkResult {
  /** Trigger prefetch manually */
  prefetch: () => Promise<void>;
  /** Check if prefetched */
  isPrefetched: boolean;
  /** Check if loading */
  isLoading: boolean;
  /** Event handlers to spread on link element */
  handlers: {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
  };
}

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
export function usePrefetchLink(
  href: string,
  options: UsePrefetchLinkOptions = {}
): UsePrefetchLinkResult {
  const manager = getPrefetchManager();
  const prefetchOptions = normalizePrefetchOptions(options, isExternalUrl(href));

  // Track state
  let isPrefetched = manager?.isPrefetched(href) ?? false;
  let isLoading = manager?.isLoading(href) ?? false;

  // Manual prefetch trigger
  const triggerPrefetch = async () => {
    if (options.withData || options.preload) {
      await prefetchRouteWithData(href, {
        preload: options.preload,
        params: options.params,
      });
    } else {
      await prefetchRoute(href, options.mode);
    }
    isPrefetched = true;
    isLoading = false;
  };

  // Build handlers based on mode
  let handlers: UsePrefetchLinkResult['handlers'] = {};

  if (prefetchOptions.mode === 'hover') {
    const hoverHandlers = createHoverHandlers(href, prefetchOptions);
    handlers = {
      onMouseEnter: hoverHandlers.onMouseEnter,
      onMouseLeave: hoverHandlers.onMouseLeave,
    };
  } else if (prefetchOptions.mode === 'intent') {
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
