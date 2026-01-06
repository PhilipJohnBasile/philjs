/**
 * Type-safe Link component for PhilJS File-based Router.
 *
 * Provides:
 * - Type-safe route paths with parameter inference
 * - Prefetch support (hover, visible, intent, render)
 * - Active state detection
 * - View transitions support
 *
 * @example
 * ```tsx
 * import { Link } from '@philjs/file-router/runtime';
 *
 * // Basic link
 * <Link to="/about">About</Link>
 *
 * // With params
 * <Link to="/users/:id" params={{ id: "123" }}>User 123</Link>
 *
 * // With prefetch
 * <Link to="/dashboard" prefetch="hover">Dashboard</Link>
 *
 * // With active class
 * <Link to="/home" activeClassName="active" exact>Home</Link>
 * ```
 */

import type { VNode, JSXElement } from "@philjs/core";
import type { TypeSafeLinkProps, GeneratedRoute } from "../types.js";
import { generateUrl } from "../parser.js";
import { getActiveRouter, getRouterState } from "./FileRouter.js";

// ============================================================================
// Types
// ============================================================================

export interface LinkProps {
  /** Target path (can include :param placeholders) */
  to: string;
  /** Route parameters to substitute */
  params?: Record<string, string | string[]>;
  /** Replace history instead of push */
  replace?: boolean;
  /** Prefetch mode */
  prefetch?: boolean | "hover" | "visible" | "intent" | "render" | "none";
  /** CSS class for active state */
  activeClassName?: string;
  /** Exact match for active (default: false for prefix matching) */
  exact?: boolean;
  /** CSS class name */
  className?: string;
  /** Children to render */
  children?: VNode | JSXElement | string;
  /** Use view transitions */
  viewTransition?: boolean;
  /** Scroll to top on navigation */
  scroll?: boolean;
  /** Additional HTML attributes */
  [key: string]: unknown;
}

// ============================================================================
// Prefetch State
// ============================================================================

const prefetchedPaths = new Set<string>();
let prefetchObserver: IntersectionObserver | null = null;

/**
 * Get or create the prefetch intersection observer.
 */
function getPrefetchObserver(): IntersectionObserver {
  if (!prefetchObserver) {
    prefetchObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");
            if (href && !prefetchedPaths.has(href)) {
              prefetchedPaths.add(href);
              const router = getActiveRouter();
              if (router) {
                router.prefetch(href);
              }
            }
            prefetchObserver?.unobserve(link);
          }
        }
      },
      { rootMargin: "50px" }
    );
  }
  return prefetchObserver;
}

// ============================================================================
// Link Component
// ============================================================================

/**
 * Type-safe Link component for navigation.
 */
export function Link(props: LinkProps): VNode {
  const {
    to,
    params,
    replace = false,
    prefetch = "hover",
    activeClassName,
    exact = false,
    className,
    children,
    viewTransition = false,
    scroll = true,
    ...rest
  } = props;

  // Build the final href
  const href = params ? generateUrl(to, params) : to;

  // Check if this link is active
  const isActive = checkIsActive(href, exact);

  // Build class name
  const finalClassName = buildClassName(className, activeClassName, isActive);

  // Prefetch handlers
  const prefetchHandlers = createPrefetchHandlers(href, prefetch);

  // Click handler
  const handleClick = (event: MouseEvent) => {
    // Call original onClick if provided
    if (rest["onClick"]) {
      (rest["onClick"] as (e: MouseEvent) => void)(event);
    }

    // Skip if:
    // - Default prevented
    // - Not left click
    // - Modifier key pressed
    // - External link
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      isExternalLink(href)
    ) {
      return;
    }

    event.preventDefault();

    const router = getActiveRouter();
    if (router) {
      router.navigate(href, {
        replace,
        scroll,
      });
    } else {
      // Fallback to browser navigation
      if (replace) {
        window.history.replaceState({}, "", href);
      } else {
        window.history.pushState({}, "", href);
      }
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Build link props
  const linkProps: Record<string, unknown> = {
    href,
    className: finalClassName,
    "data-router-link": "",
    "data-prefetch": prefetch,
    ...rest,
    ...prefetchHandlers,
    onClick: handleClick,
    children,
  };

  // Handle ref for visible/render prefetch
  if (prefetch === "visible" || prefetch === "render") {
    linkProps["ref"] = (element: HTMLAnchorElement | null) => {
      if (!element) return;

      if (prefetch === "visible") {
        getPrefetchObserver().observe(element);
      } else if (prefetch === "render") {
        // Prefetch immediately on render
        if (!prefetchedPaths.has(href)) {
          prefetchedPaths.add(href);
          const router = getActiveRouter();
          if (router) {
            // Use requestIdleCallback if available
            const schedule = (window as any).requestIdleCallback || setTimeout;
            schedule(() => router.prefetch(href), { timeout: 1000 });
          }
        }
      }
    };
  }

  return {
    type: "a",
    props: linkProps,
  };
}

// ============================================================================
// NavLink Component
// ============================================================================

export interface NavLinkProps extends LinkProps {
  /** Render function for custom active styling */
  style?: ((isActive: boolean) => Record<string, string>) | Record<string, string>;
  /** Custom class render function */
  class?: ((isActive: boolean) => string) | string;
}

/**
 * NavLink component with active state awareness.
 */
export function NavLink(props: NavLinkProps): VNode {
  const {
    to,
    params,
    exact = false,
    style,
    class: classNameProp,
    ...rest
  } = props;

  const href = params ? generateUrl(to, params) : to;
  const isActive = checkIsActive(href, exact);

  // Compute style
  const computedStyle = typeof style === "function" ? style(isActive) : style;

  // Compute class
  const computedClass = typeof classNameProp === "function"
    ? classNameProp(isActive)
    : classNameProp;

  return Link({
    ...rest,
    to,
    params,
    exact,
    className: computedClass,
    style: computedStyle as unknown as string,
    "aria-current": isActive ? "page" : undefined,
  } as LinkProps);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a link is active.
 */
function checkIsActive(href: string, exact: boolean): boolean {
  if (typeof window === "undefined") return false;

  const currentPath = window.location.pathname;

  if (exact) {
    return currentPath === href;
  }

  // Prefix matching
  return currentPath === href || currentPath.startsWith(href + "/");
}

/**
 * Build the final class name.
 */
function buildClassName(
  className: string | undefined,
  activeClassName: string | undefined,
  isActive: boolean
): string {
  const classes: string[] = [];

  if (className) {
    classes.push(className);
  }

  if (isActive && activeClassName) {
    classes.push(activeClassName);
  }

  return classes.join(" ") || undefined as unknown as string;
}

/**
 * Check if a link is external.
 */
function isExternalLink(href: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const url = new URL(href, window.location.origin);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Create prefetch event handlers.
 */
function createPrefetchHandlers(
  href: string,
  prefetch: LinkProps["prefetch"]
): Record<string, (...args: any[]) => void> {
  if (!prefetch || prefetch === "none" || prefetch === "visible" || prefetch === "render") {
    return {};
  }

  const handlers: Record<string, (...args: any[]) => void> = {};
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerPrefetch = () => {
    if (prefetchedPaths.has(href)) return;

    const router = getActiveRouter();
    if (router) {
      prefetchedPaths.add(href);
      router.prefetch(href);
    }
  };

  if (prefetch === "hover" || prefetch === true) {
    handlers["onMouseEnter"] = () => {
      hoverTimer = setTimeout(triggerPrefetch, 100);
    };

    handlers["onMouseLeave"] = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };
  }

  if (prefetch === "intent") {
    handlers["onMouseEnter"] = () => {
      hoverTimer = setTimeout(triggerPrefetch, 50);
    };

    handlers["onMouseLeave"] = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };

    handlers["onFocus"] = () => {
      hoverTimer = setTimeout(triggerPrefetch, 50);
    };

    handlers["onBlur"] = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };
  }

  return handlers;
}

// ============================================================================
// Typed Link Factory
// ============================================================================

/**
 * Create a type-safe link factory with route definitions.
 *
 * @example
 * ```ts
 * const routes = [
 *   { path: '/', params: [] },
 *   { path: '/users/:id', params: ['id'] },
 *   { path: '/docs/*slug', params: ['slug'] },
 * ] as const;
 *
 * const { Link } = createTypedLinks<typeof routes>();
 *
 * // Type-safe usage
 * <Link to="/users/:id" params={{ id: "123" }}>User</Link>
 * ```
 */
export function createTypedLinks<
  Routes extends readonly { path: string; params: readonly string[] }[]
>(): {
  Link: <Path extends Routes[number]["path"]>(
    props: Omit<LinkProps, "to" | "params"> & {
      to: Path;
      params?: Record<Extract<Routes[number], { path: Path }>["params"][number], string>;
    }
  ) => VNode;
} {
  return {
    Link: Link as any,
  };
}

// ============================================================================
// Redirect Component
// ============================================================================

export interface RedirectProps {
  /** Target path */
  to: string;
  /** Route parameters */
  params?: Record<string, string | string[]>;
  /** Replace history */
  replace?: boolean;
}

/**
 * Redirect component - navigates on mount.
 */
export function Redirect(props: RedirectProps): null {
  const { to, params, replace = true } = props;
  const href = params ? generateUrl(to, params) : to;

  // Navigate on mount
  if (typeof window !== "undefined") {
    const router = getActiveRouter();
    if (router) {
      // Use microtask to avoid render loop
      queueMicrotask(() => {
        router.navigate(href, { replace });
      });
    } else {
      queueMicrotask(() => {
        if (replace) {
          window.history.replaceState({}, "", href);
        } else {
          window.history.pushState({}, "", href);
        }
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    }
  }

  return null;
}
