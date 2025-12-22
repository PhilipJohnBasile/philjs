/**
 * SolidStart-style Route Groups for PhilJS Router.
 * Allows organizing routes without affecting the URL structure.
 *
 * @example
 * ```
 * routes/
 *   (marketing)/
 *     about.tsx      -> /about
 *     contact.tsx    -> /contact
 *     layout.tsx     -> shared layout for marketing pages
 *   (dashboard)/
 *     settings.tsx   -> /settings
 *     profile.tsx    -> /profile
 *     layout.tsx     -> shared layout for dashboard pages
 * ```
 */

import type { JSXElement, VNode } from "philjs-core";
import type { RouteComponent } from "./nested.js";
import type { LoaderFunction, LoaderFunctionContext } from "./loader.js";
import type { ActionFunction, ActionFunctionContext } from "./action.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Route group definition.
 */
export type RouteGroup = {
  /** Group name (from folder name without the URL path) */
  name: string;
  /** Shared layout component for all routes in this group */
  layout?: RouteComponent;
  /** Shared loader for the group */
  loader?: LoaderFunction;
  /** Shared action for the group */
  action?: ActionFunction;
  /** Middleware functions for the group */
  middleware?: RouteGroupMiddleware[];
  /** Child routes in this group */
  routes: GroupRoute[];
  /** Metadata for the group */
  meta?: RouteGroupMeta;
  /** Error boundary for the group */
  errorBoundary?: RouteComponent;
  /** Whether this group should be lazy loaded */
  lazy?: boolean;
};

/**
 * Route within a group.
 */
export type GroupRoute = {
  /** Route path (will not include group prefix) */
  path: string;
  /** Route component */
  component: RouteComponent;
  /** Route-specific loader */
  loader?: LoaderFunction;
  /** Route-specific action */
  action?: ActionFunction;
  /** Child routes */
  children?: GroupRoute[];
  /** Route ID */
  id?: string;
  /** Route metadata */
  meta?: Record<string, unknown>;
};

/**
 * Middleware function for route groups.
 */
export type RouteGroupMiddleware = (
  context: MiddlewareContext
) => Promise<MiddlewareResult> | MiddlewareResult;

/**
 * Context passed to middleware.
 */
export type MiddlewareContext = {
  /** Current URL */
  url: URL;
  /** Route parameters */
  params: Record<string, string>;
  /** Request object */
  request: Request;
  /** Route group name */
  groupName: string;
  /** Route path within the group */
  routePath: string;
};

/**
 * Result from middleware execution.
 */
export type MiddlewareResult = {
  /** Whether to allow the navigation */
  allow: boolean;
  /** Redirect to a different URL */
  redirect?: string;
  /** Additional data to pass to the route */
  data?: Record<string, unknown>;
  /** Modify the request */
  modifiedRequest?: Request;
};

/**
 * Metadata for route groups.
 */
export type RouteGroupMeta = {
  /** Display name for the group */
  displayName?: string;
  /** Description of the group's purpose */
  description?: string;
  /** Whether this group requires authentication */
  requiresAuth?: boolean;
  /** Required permissions */
  permissions?: string[];
  /** Custom metadata */
  [key: string]: unknown;
};

/**
 * Configuration for route group processing.
 */
export type RouteGroupConfig = {
  /** Pattern to identify route groups (default: /^\(.*\)$/) */
  groupPattern?: RegExp;
  /** Whether to automatically discover groups from file structure */
  autoDiscover?: boolean;
  /** Base directory for route discovery */
  baseDir?: string;
};

/**
 * Processed route with group information.
 */
export type ProcessedGroupRoute = {
  /** Final route path (without group prefix) */
  path: string;
  /** Route component with group layout applied */
  component: RouteComponent;
  /** Combined loader (group + route) */
  loader?: LoaderFunction;
  /** Combined action (group + route) */
  action?: ActionFunction;
  /** Group this route belongs to */
  group: string;
  /** Applied middleware */
  middleware: RouteGroupMiddleware[];
  /** Route ID */
  id: string;
  /** Error boundary */
  errorBoundary?: RouteComponent;
};

// ============================================================================
// Route Group Processing
// ============================================================================

/**
 * Parse a route path to extract group information.
 */
export function parseRouteGroup(
  path: string,
  config: RouteGroupConfig = {}
): { group: string | null; cleanPath: string } {
  const pattern = config.groupPattern || /\(([^)]+)\)/g;
  const parts = path.split("/").filter(Boolean);
  const cleanParts: string[] = [];
  let group: string | null = null;

  for (const part of parts) {
    const match = part.match(/^\(([^)]+)\)$/);
    if (match) {
      // This is a group - don't include in path, but remember it
      if (!group) {
        group = match[1];
      }
    } else {
      cleanParts.push(part);
    }
  }

  const cleanPath = "/" + cleanParts.join("/");
  return { group, cleanPath };
}

/**
 * Create a route group.
 */
export function createRouteGroup(
  name: string,
  options: {
    layout?: RouteComponent;
    loader?: LoaderFunction;
    action?: ActionFunction;
    middleware?: RouteGroupMiddleware[];
    routes?: GroupRoute[];
    meta?: RouteGroupMeta;
    errorBoundary?: RouteComponent;
    lazy?: boolean;
  } = {}
): RouteGroup {
  return {
    name,
    layout: options.layout,
    loader: options.loader,
    action: options.action,
    middleware: options.middleware || [],
    routes: options.routes || [],
    meta: options.meta,
    errorBoundary: options.errorBoundary,
    lazy: options.lazy,
  };
}

/**
 * Add a route to a group.
 */
export function addRouteToGroup(
  group: RouteGroup,
  route: GroupRoute
): RouteGroup {
  return {
    ...group,
    routes: [...group.routes, route],
  };
}

/**
 * Process route groups into flat route definitions.
 */
export function processRouteGroups(
  groups: RouteGroup[]
): ProcessedGroupRoute[] {
  const processed: ProcessedGroupRoute[] = [];

  for (const group of groups) {
    for (const route of group.routes) {
      processed.push(...processGroupRoute(group, route, []));
    }
  }

  return processed;
}

/**
 * Process a single route within a group.
 */
function processGroupRoute(
  group: RouteGroup,
  route: GroupRoute,
  parentPath: string[]
): ProcessedGroupRoute[] {
  const fullPath = [...parentPath, route.path].filter(Boolean).join("/");
  const cleanPath = "/" + fullPath.replace(/^\//, "");

  // Combine loaders (group loader runs first, then route loader)
  const combinedLoader: LoaderFunction | undefined =
    group.loader || route.loader
      ? async (context: LoaderFunctionContext) => {
          const groupData = group.loader
            ? await group.loader(context)
            : undefined;
          const routeData = route.loader
            ? await route.loader(context)
            : undefined;

          return {
            ...(groupData || {}),
            ...(routeData || {}),
          };
        }
      : undefined;

  // Combine actions (group action as fallback)
  const combinedAction: ActionFunction | undefined =
    route.action || group.action;

  // Wrap component with group layout
  const wrappedComponent: RouteComponent = group.layout
    ? (props) => {
        const Layout = group.layout!;
        const Component = route.component;
        return Layout({
          ...props,
          children: Component(props),
        });
      }
    : route.component;

  const processed: ProcessedGroupRoute = {
    path: cleanPath,
    component: wrappedComponent,
    loader: combinedLoader,
    action: combinedAction,
    group: group.name,
    middleware: group.middleware || [],
    id: route.id || `${group.name}:${cleanPath}`,
    errorBoundary: group.errorBoundary,
  };

  const results: ProcessedGroupRoute[] = [processed];

  // Process child routes recursively
  if (route.children) {
    for (const child of route.children) {
      results.push(...processGroupRoute(group, child, [fullPath]));
    }
  }

  return results;
}

/**
 * Execute group middleware for a route.
 */
export async function executeGroupMiddleware(
  middleware: RouteGroupMiddleware[],
  context: MiddlewareContext
): Promise<MiddlewareResult> {
  let result: MiddlewareResult = { allow: true };

  for (const mw of middleware) {
    const mwResult = await mw(context);

    // If any middleware denies access, stop
    if (!mwResult.allow) {
      return mwResult;
    }

    // Merge data from all middleware
    if (mwResult.data) {
      result.data = { ...result.data, ...mwResult.data };
    }

    // Use the last redirect if any
    if (mwResult.redirect) {
      result.redirect = mwResult.redirect;
    }

    // Use the modified request if any
    if (mwResult.modifiedRequest) {
      context.request = mwResult.modifiedRequest;
      result.modifiedRequest = mwResult.modifiedRequest;
    }
  }

  return result;
}

// ============================================================================
// Common Middleware
// ============================================================================

/**
 * Create authentication middleware.
 */
export function createAuthMiddleware(
  checkAuth: (request: Request) => Promise<boolean> | boolean,
  redirectTo: string = "/login"
): RouteGroupMiddleware {
  return async (context) => {
    const isAuthenticated = await checkAuth(context.request);

    if (!isAuthenticated) {
      return {
        allow: false,
        redirect: `${redirectTo}?redirect=${encodeURIComponent(
          context.url.pathname
        )}`,
      };
    }

    return { allow: true };
  };
}

/**
 * Create permission-based middleware.
 */
export function createPermissionMiddleware(
  requiredPermissions: string[],
  getPermissions: (request: Request) => Promise<string[]> | string[],
  redirectTo: string = "/unauthorized"
): RouteGroupMiddleware {
  return async (context) => {
    const userPermissions = await getPermissions(context.request);
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return {
        allow: false,
        redirect: redirectTo,
      };
    }

    return { allow: true };
  };
}

/**
 * Create logging middleware.
 */
export function createLoggingMiddleware(
  logger?: (context: MiddlewareContext) => void
): RouteGroupMiddleware {
  return (context) => {
    const log = logger || console.log;
    log({
      group: context.groupName,
      path: context.routePath,
      url: context.url.pathname,
      timestamp: new Date().toISOString(),
    });

    return { allow: true };
  };
}

/**
 * Create rate limiting middleware.
 */
export function createRateLimitMiddleware(
  options: {
    maxRequests: number;
    windowMs: number;
    keyFn?: (context: MiddlewareContext) => string;
  }
): RouteGroupMiddleware {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return (context) => {
    const key =
      options.keyFn?.(context) ||
      `${context.groupName}:${context.url.pathname}`;
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now > record.resetAt) {
      requests.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return { allow: true };
    }

    if (record.count >= options.maxRequests) {
      return {
        allow: false,
        data: {
          error: "Rate limit exceeded",
          retryAfter: record.resetAt - now,
        },
      };
    }

    record.count++;
    return { allow: true };
  };
}

/**
 * Create header injection middleware.
 */
export function createHeaderMiddleware(
  headers: Record<string, string>
): RouteGroupMiddleware {
  return (context) => {
    const modifiedRequest = new Request(context.request, {
      headers: {
        ...Object.fromEntries(context.request.headers.entries()),
        ...headers,
      },
    });

    return {
      allow: true,
      modifiedRequest,
    };
  };
}

// ============================================================================
// File-based Route Group Discovery
// ============================================================================

/**
 * Discover route groups from a file structure.
 * This would typically be used with a bundler plugin.
 */
export function discoverRouteGroups(
  files: Record<string, any>,
  config: RouteGroupConfig = {}
): RouteGroup[] {
  const groups = new Map<string, RouteGroup>();

  for (const [filepath, module] of Object.entries(files)) {
    const { group, cleanPath } = parseRouteGroup(filepath, config);

    if (group) {
      // Check if this is a layout file
      if (filepath.endsWith("layout.tsx") || filepath.endsWith("layout.ts")) {
        if (!groups.has(group)) {
          groups.set(
            group,
            createRouteGroup(group, {
              layout: module.default,
              loader: module.loader,
              action: module.action,
              middleware: module.middleware,
              meta: module.meta,
              errorBoundary: module.ErrorBoundary,
            })
          );
        } else {
          const existing = groups.get(group)!;
          groups.set(group, {
            ...existing,
            layout: module.default,
            loader: module.loader || existing.loader,
            action: module.action || existing.action,
            middleware: module.middleware || existing.middleware,
            meta: module.meta || existing.meta,
          });
        }
      } else {
        // Regular route file
        const route: GroupRoute = {
          path: cleanPath,
          component: module.default,
          loader: module.loader,
          action: module.action,
          id: module.id,
          meta: module.meta,
        };

        if (!groups.has(group)) {
          groups.set(group, createRouteGroup(group, { routes: [route] }));
        } else {
          const existing = groups.get(group)!;
          groups.set(group, addRouteToGroup(existing, route));
        }
      }
    }
  }

  return Array.from(groups.values());
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a path contains a route group.
 */
export function isGroupPath(path: string): boolean {
  return /\([^)]+\)/.test(path);
}

/**
 * Extract all groups from a path.
 */
export function extractGroups(path: string): string[] {
  const matches = path.match(/\(([^)]+)\)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

/**
 * Remove all groups from a path.
 */
export function removeGroups(path: string): string {
  return path.replace(/\([^)]+\)\/?/g, "").replace(/\/+/g, "/") || "/";
}

/**
 * Get routes by group name.
 */
export function getRoutesByGroup(
  groups: RouteGroup[],
  groupName: string
): GroupRoute[] {
  const group = groups.find((g) => g.name === groupName);
  return group?.routes || [];
}

/**
 * Merge multiple route groups.
 */
export function mergeRouteGroups(...groups: RouteGroup[]): RouteGroup {
  if (groups.length === 0) {
    throw new Error("Cannot merge empty groups");
  }

  const [first, ...rest] = groups;
  let merged = { ...first };

  for (const group of rest) {
    merged = {
      ...merged,
      routes: [...merged.routes, ...group.routes],
      middleware: [...(merged.middleware || []), ...(group.middleware || [])],
      meta: { ...merged.meta, ...group.meta },
      // Layout and loaders from the last group take precedence
      layout: group.layout || merged.layout,
      loader: group.loader || merged.loader,
      action: group.action || merged.action,
    };
  }

  return merged;
}

/**
 * Create a nested group structure.
 */
export function createNestedGroups(
  parent: RouteGroup,
  children: RouteGroup[]
): RouteGroup {
  // Convert child groups into routes within the parent
  const childRoutes: GroupRoute[] = children.flatMap((child) =>
    child.routes.map((route) => ({
      ...route,
      path: `${child.name}/${route.path}`.replace(/\/+/g, "/"),
    }))
  );

  return {
    ...parent,
    routes: [...parent.routes, ...childRoutes],
  };
}

/**
 * Validate route group configuration.
 */
export function validateRouteGroup(group: RouteGroup): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!group.name) {
    errors.push("Group name is required");
  }

  if (group.name.includes("/")) {
    errors.push("Group name cannot contain slashes");
  }

  for (const route of group.routes) {
    if (!route.path) {
      errors.push(`Route in group "${group.name}" is missing path`);
    }

    if (!route.component) {
      errors.push(
        `Route "${route.path}" in group "${group.name}" is missing component`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Route Group Utilities for Debugging
// ============================================================================

/**
 * Get a visual representation of route groups.
 */
export function visualizeRouteGroups(groups: RouteGroup[]): string {
  const lines: string[] = ["Route Groups:", ""];

  for (const group of groups) {
    lines.push(`Group: (${group.name})`);
    if (group.meta?.displayName) {
      lines.push(`  Display: ${group.meta.displayName}`);
    }
    if (group.meta?.description) {
      lines.push(`  Description: ${group.meta.description}`);
    }
    if (group.layout) {
      lines.push(`  Layout: Yes`);
    }
    if (group.middleware && group.middleware.length > 0) {
      lines.push(`  Middleware: ${group.middleware.length} function(s)`);
    }
    lines.push(`  Routes:`);
    for (const route of group.routes) {
      lines.push(`    ${route.path}`);
      if (route.loader) lines.push(`      - loader`);
      if (route.action) lines.push(`      - action`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Export route groups as JSON.
 */
export function exportRouteGroups(groups: RouteGroup[]): string {
  return JSON.stringify(
    groups.map((group) => ({
      name: group.name,
      meta: group.meta,
      hasLayout: !!group.layout,
      hasLoader: !!group.loader,
      hasAction: !!group.action,
      middlewareCount: group.middleware?.length || 0,
      routes: group.routes.map((route) => ({
        path: route.path,
        id: route.id,
        hasLoader: !!route.loader,
        hasAction: !!route.action,
        meta: route.meta,
      })),
    })),
    null,
    2
  );
}
