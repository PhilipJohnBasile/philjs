/**
 * Link - Navigation component for file-based routing
 *
 * Provides client-side navigation with prefetching support.
 */

import { signal, effect } from '@philjs/core';
import { navigate, routerState } from './FileRouter.js';

export interface LinkProps {
  /** Target path */
  href: string;
  /** Link content/children */
  children?: unknown;
  /** CSS class */
  class?: string;
  /** Additional CSS class when route is active */
  activeClass?: string;
  /** Whether to replace history entry instead of push */
  replace?: boolean;
  /** Prefetch behavior */
  prefetch?: 'intent' | 'render' | 'none';
  /** Whether to scroll to top on navigation */
  scroll?: boolean;
  /** Target for external links */
  target?: string;
  /** Rel attribute for external links */
  rel?: string;
  /** Click handler */
  onClick?: (event: MouseEvent) => void;
  /** Title attribute */
  title?: string;
  /** Aria label */
  'aria-label'?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom styles */
  style?: string | Record<string, string>;
}

// Track prefetched routes
const prefetchedRoutes = new Set<string>();

// Prefetch queue for intent-based prefetching
const prefetchQueue: string[] = [];
let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Prefetch a route's component and data
 */
export async function prefetch(href: string): Promise<void> {
  if (prefetchedRoutes.has(href)) return;

  try {
    // Add to browser's prefetch hints
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }

    prefetchedRoutes.add(href);
  } catch {
    // Silently fail prefetch
  }
}

/**
 * Schedule prefetch on intent (hover/focus)
 */
function schedulePrefetch(href: string): void {
  if (prefetchedRoutes.has(href)) return;

  prefetchQueue.push(href);

  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }

  // Delay prefetch slightly to avoid unnecessary requests
  prefetchTimeout = setTimeout(() => {
    while (prefetchQueue.length > 0) {
      const url = prefetchQueue.shift();
      if (url) prefetch(url);
    }
  }, 100);
}

/**
 * Cancel scheduled prefetch
 */
function cancelPrefetch(href: string): void {
  const index = prefetchQueue.indexOf(href);
  if (index > -1) {
    prefetchQueue.splice(index, 1);
  }
}

/**
 * Check if a path is external
 */
function isExternalUrl(href: string): boolean {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    if (typeof window !== 'undefined') {
      const url = new URL(href, window.location.origin);
      return url.origin !== window.location.origin;
    }
    return true;
  }
  return href.startsWith('mailto:') || href.startsWith('tel:');
}

/**
 * Check if the current path matches the link href
 */
function isActive(href: string, currentPath: string): boolean {
  // Exact match
  if (href === currentPath) return true;

  // Remove trailing slashes for comparison
  const normalizedHref = href.replace(/\/$/, '') || '/';
  const normalizedPath = currentPath.replace(/\/$/, '') || '/';

  return normalizedHref === normalizedPath;
}

/**
 * Check if the current path starts with the link href (for nested routes)
 */
function isActivePrefix(href: string, currentPath: string): boolean {
  if (href === '/') return currentPath === '/';

  const normalizedHref = href.replace(/\/$/, '');
  const normalizedPath = currentPath.replace(/\/$/, '');

  return normalizedPath.startsWith(normalizedHref);
}

/**
 * Link component - client-side navigation
 */
export function Link(props: LinkProps): unknown {
  const {
    href,
    children,
    class: className,
    activeClass = 'active',
    replace = false,
    prefetch: prefetchMode = 'intent',
    scroll = true,
    target,
    rel,
    onClick,
    title,
    'aria-label': ariaLabel,
    disabled = false,
    style,
  } = props;

  // Check if external
  const isExternal = isExternalUrl(href);

  // Compute active state
  const active = signal(false);

  effect(() => {
    const currentPath = routerState.get().path;
    active.set(isActive(href, currentPath));
  });

  // Handle click
  const handleClick = (event: MouseEvent): void => {
    // Call custom onClick if provided
    onClick?.(event);

    // Don't handle if:
    // - Default was prevented by onClick
    // - Meta/Ctrl key is pressed (open in new tab)
    // - It's an external link
    // - Link has a target
    // - Link is disabled
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      isExternal ||
      target ||
      disabled
    ) {
      return;
    }

    event.preventDefault();
    navigate(href, { replace, scroll });
  };

  // Handle mouse enter for prefetch
  const handleMouseEnter = (): void => {
    if (prefetchMode === 'intent' && !isExternal && !disabled) {
      schedulePrefetch(href);
    }
  };

  // Handle mouse leave to cancel prefetch
  const handleMouseLeave = (): void => {
    if (prefetchMode === 'intent') {
      cancelPrefetch(href);
    }
  };

  // Handle focus for accessibility
  const handleFocus = (): void => {
    if (prefetchMode === 'intent' && !isExternal && !disabled) {
      schedulePrefetch(href);
    }
  };

  // Prefetch on render if configured
  if (prefetchMode === 'render' && !isExternal && typeof window !== 'undefined') {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        () => prefetch(href)
      );
    } else {
      setTimeout(() => prefetch(href), 0);
    }
  }

  // Build class list
  const computedClass = (): string => {
    const classes: string[] = [];
    if (className) classes.push(className);
    if (active.get() && activeClass) classes.push(activeClass);
    if (disabled) classes.push('disabled');
    return classes.join(' ');
  };

  // Build rel attribute
  const computedRel = (): string | undefined => {
    if (rel) return rel;
    if (isExternal && target === '_blank') {
      return 'noopener noreferrer';
    }
    return undefined;
  };

  // Return element representation
  return {
    type: 'a',
    props: {
      href,
      class: computedClass(),
      target: target || (isExternal ? '_blank' : undefined),
      rel: computedRel(),
      title,
      'aria-label': ariaLabel,
      'aria-current': active.get() ? 'page' : undefined,
      'aria-disabled': disabled || undefined,
      style,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      children,
    },
  };
}

/**
 * NavLink - Link with additional active state features
 *
 * Useful for navigation menus where you need to highlight the current route.
 */
export function NavLink(
  props: LinkProps & {
    /** Match mode for active state */
    match?: 'exact' | 'prefix';
  }
): unknown {
  const { match = 'exact', ...linkProps } = props;

  // Override active class logic based on match mode
  const activeSignal = signal(false);

  effect(() => {
    const currentPath = routerState.get().path;
    if (match === 'prefix') {
      activeSignal.set(isActivePrefix(linkProps.href, currentPath));
    } else {
      activeSignal.set(isActive(linkProps.href, currentPath));
    }
  });

  return Link({
    ...linkProps,
    class: `${linkProps.class || ''} ${activeSignal.get() ? linkProps.activeClass || 'active' : ''}`.trim(),
  });
}

// Export utilities
export { prefetch, isExternalUrl, isActive, isActivePrefix };
