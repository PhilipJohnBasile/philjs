/**
 * Type-safe Link component for navigation
 */

import type { z } from "zod";
import type { VNode } from "philjs-core";
import type {
  RouteDefinition,
  PathParams,
  HasParams,
  LinkPropsWithRoute,
  LinkPropsWithPath,
} from "./types.js";
import { getRouterContext } from "./context.js";
import { buildPath, serializeSearchParams, matchRoutes } from "./route.js";

/**
 * Check if the 'to' prop is a route definition or a string path.
 */
function isRouteDefinition(
  to: RouteDefinition<string, z.ZodType | undefined, unknown> | string
): to is RouteDefinition<string, z.ZodType | undefined, unknown> {
  return typeof to === "object" && "path" in to && "id" in to;
}

/**
 * Build the full href from route + params + search.
 */
function buildHref<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined
>(options: {
  to: RouteDefinition<TPath, TSearchSchema, unknown> | string;
  params?: PathParams<TPath> | Record<string, string>;
  search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : Record<string, unknown>;
  hash?: string;
}): string {
  let path: string;

  if (isRouteDefinition(options.to)) {
    // Build path from route definition
    const route = options.to;
    const params = (options.params ?? {}) as PathParams<TPath>;
    path = buildPath(route.fullPath as TPath, params);
  } else {
    // Use string path directly, optionally substituting params
    path = options.to;
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        path = path.replace(`$${key}`, encodeURIComponent(String(value)));
      }
    }
  }

  // Add search params
  let search = "";
  if (options.search && Object.keys(options.search).length > 0) {
    if (isRouteDefinition(options.to) && options.to.validateSearch) {
      search = serializeSearchParams(options.search, options.to.validateSearch);
    } else {
      const urlSearchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.search)) {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            urlSearchParams.set(key, JSON.stringify(value));
          } else {
            urlSearchParams.set(key, String(value));
          }
        }
      }
      const searchStr = urlSearchParams.toString();
      search = searchStr ? `?${searchStr}` : "";
    }
  }

  // Add hash
  const hash = options.hash ? `#${options.hash.replace(/^#/, "")}` : "";

  return `${path}${search}${hash}`;
}

/**
 * Type-safe Link component.
 *
 * When using a route definition, params and search are type-checked:
 * ```typescript
 * <Link
 *   to={userRoute}
 *   params={{ userId: '123' }}
 *   search={{ tab: 'posts' }}
 * >
 *   View User
 * </Link>
 * ```
 *
 * Can also use string paths:
 * ```typescript
 * <Link to="/about">About</Link>
 * ```
 */
export function Link<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined
>(
  props: LinkPropsWithRoute<TPath, TSearchSchema> | LinkPropsWithPath
): VNode {
  const {
    to,
    params,
    search,
    hash,
    replace = false,
    prefetch = false,
    children,
    className,
    activeClassName,
    inactiveClassName,
    style,
    activeStyle,
    inactiveStyle,
    disabled = false,
    target,
    ...rest
  } = props;

  // Build href
  const href = buildHref({
    to: to as RouteDefinition<TPath, TSearchSchema, unknown> | string,
    params: params as PathParams<TPath> | Record<string, string>,
    search: search as TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : Record<string, unknown>,
    hash,
  });

  // Check if this link is active
  const isActive = checkIsActive(to, href);

  // Merge class names and styles based on active state
  const mergedClassName = [
    className,
    isActive ? activeClassName : inactiveClassName,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const mergedStyle = {
    ...style,
    ...(isActive ? activeStyle : inactiveStyle),
  };

  // Handle click
  const handleClick = (event: MouseEvent) => {
    // Call any existing onClick handler
    if (typeof rest.onClick === "function") {
      rest.onClick(event);
    }

    // Don't handle if:
    // - Default prevented
    // - Not left click
    // - Modifier keys pressed
    // - Target is external
    // - Disabled
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      target === "_blank" ||
      disabled
    ) {
      return;
    }

    event.preventDefault();

    const context = getRouterContext();
    if (context) {
      void context.navigate(href, { replace });
    }
  };

  // Handle prefetch on hover/focus
  const handlePrefetch = () => {
    if (!prefetch || disabled) {
      return;
    }

    // Prefetch strategies
    if (prefetch === true || prefetch === "intent") {
      // Prefetch on hover/focus
      void prefetchRoute(to, params);
    }
  };

  // Build props
  const linkProps: Record<string, unknown> = {
    href,
    className: mergedClassName,
    style: Object.keys(mergedStyle).length > 0 ? mergedStyle : undefined,
    "data-router-link": "",
    "data-active": isActive ? "" : undefined,
    "aria-current": isActive ? "page" : undefined,
    "aria-disabled": disabled ? "true" : undefined,
    onClick: handleClick,
    onMouseEnter: handlePrefetch,
    onFocus: handlePrefetch,
    ...rest,
    children,
  };

  if (target) {
    linkProps.target = target;
    if (target === "_blank") {
      linkProps.rel = "noopener noreferrer";
    }
  }

  return {
    type: "a",
    props: linkProps,
  };
}

/**
 * Check if a link is currently active.
 */
function checkIsActive(
  to: RouteDefinition<string, z.ZodType | undefined, unknown> | string,
  href: string
): boolean {
  const context = getRouterContext();
  if (!context) {
    return false;
  }

  const currentPath = context.location.pathname;

  if (isRouteDefinition(to)) {
    // Check if the route matches
    return context.matches.some((m) => m.route.id === to.id);
  }

  // For string paths, compare normalized paths
  const normalizedHref = new URL(href, "http://localhost").pathname;
  return currentPath === normalizedHref;
}

/**
 * Prefetch a route's data.
 */
async function prefetchRoute(
  to: RouteDefinition<string, z.ZodType | undefined, unknown> | string,
  params?: Record<string, string>
): Promise<void> {
  if (!isRouteDefinition(to)) {
    return;
  }

  if (!to.loader) {
    return;
  }

  const abortController = new AbortController();

  try {
    await to.loader({
      params: (params ?? {}) as PathParams<typeof to.path>,
      search: {} as z.infer<NonNullable<typeof to.validateSearch>>,
      request: new Request(to.fullPath),
      abortController,
    });
  } catch (error) {
    // Silently fail for prefetch errors
    console.debug("[philjs-router-typesafe] Prefetch failed:", error);
  }
}

/**
 * Navigate link - programmatic navigation helper that returns a VNode.
 * Useful for conditional rendering.
 *
 * @example
 * ```typescript
 * const link = createNavigateLink(userRoute, { userId: '123' }, { tab: 'posts' });
 * // Use link.href to get the URL
 * // Use link.navigate() to navigate programmatically
 * ```
 */
export function createNavigateLink<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined
>(
  route: RouteDefinition<TPath, TSearchSchema, unknown>,
  params: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined,
  search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never
): {
  href: string;
  navigate: (options?: { replace?: boolean; state?: unknown }) => Promise<void>;
} {
  const href = buildHref({
    to: route,
    params: params as PathParams<TPath>,
    search: search as TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : undefined,
  });

  return {
    href,
    navigate: async (options) => {
      const context = getRouterContext();
      if (context) {
        await context.navigate(href, options);
      }
    },
  };
}

/**
 * ActiveLink component - Link that automatically shows active state.
 *
 * @example
 * ```typescript
 * <ActiveLink
 *   to={aboutRoute}
 *   className="nav-link"
 *   activeClassName="nav-link--active"
 * >
 *   About
 * </ActiveLink>
 * ```
 */
export function ActiveLink<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined
>(
  props: LinkPropsWithRoute<TPath, TSearchSchema> | LinkPropsWithPath
): VNode {
  // ActiveLink is just Link with sensible defaults for active state handling
  return Link(props);
}

/**
 * NavLink component - Alias for ActiveLink.
 */
export const NavLink = ActiveLink;

/**
 * Redirect component - Performs navigation on mount.
 *
 * @example
 * ```typescript
 * function ProtectedRoute() {
 *   if (!isLoggedIn) {
 *     return <Redirect to={loginRoute} />;
 *   }
 *   return <Dashboard />;
 * }
 * ```
 */
export function Redirect<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined
>(props: {
  to: RouteDefinition<TPath, TSearchSchema, unknown> | string;
  params?: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined;
  search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
  replace?: boolean;
}): VNode | null {
  const { to, params, search, replace = true } = props;

  // Perform navigation
  const href = buildHref({
    to: to as RouteDefinition<TPath, TSearchSchema, unknown> | string,
    params: params as PathParams<TPath>,
    search: search as TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : undefined,
  });

  // Schedule navigation for next tick to avoid rendering issues
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      const context = getRouterContext();
      if (context) {
        void context.navigate(href, { replace });
      }
    });
  }

  return null;
}
