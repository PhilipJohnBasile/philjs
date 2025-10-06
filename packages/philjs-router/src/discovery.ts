/**
 * File-based route discovery.
 * Scans a routes directory and generates route patterns.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type RoutePattern = {
  /** File path pattern (e.g., "/products/[id]") */
  pattern: string;
  /** Regex for matching URLs */
  regex: RegExp;
  /** Parameter names in order */
  params: string[];
  /** File path relative to routes dir */
  filePath: string;
  /** Priority for matching (more specific = higher) */
  priority: number;
};

/**
 * Discover routes from a directory.
 * @param routesDir - Absolute path to routes directory
 * @returns Array of route patterns sorted by priority
 */
export function discoverRoutes(routesDir: string): RoutePattern[] {
  const routes: RoutePattern[] = [];

  function scan(dir: string, prefix: string = "") {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        scan(fullPath, join(prefix, entry));
      } else if (entry.endsWith(".tsx") || entry.endsWith(".ts") || entry.endsWith(".jsx") || entry.endsWith(".js")) {
        // Process route files
        const fileName = entry.replace(/\.(tsx?|jsx?)$/, "");

        // Skip files starting with _ (layouts, components)
        if (fileName.startsWith("_")) continue;

        const routePath = join(prefix, fileName);
        const pattern = filePathToRoutePattern(routePath);
        const filePath = relative(routesDir, fullPath);

        routes.push(createRoutePattern(pattern, filePath));
      }
    }
  }

  scan(routesDir);

  // Sort by priority (more specific routes first)
  return routes.sort((a, b) => b.priority - a.priority);
}

/**
 * Convert a file path to a route pattern.
 * Examples:
 *   index -> /
 *   about -> /about
 *   products/[id] -> /products/:id
 *   blog/[...slug] -> /blog/*
 */
function filePathToRoutePattern(filePath: string): string {
  // Normalize path separators
  const normalized = filePath.split(sep).join("/");

  // Handle index routes
  if (normalized === "index" || normalized.endsWith("/index")) {
    return normalized === "index" ? "/" : "/" + normalized.replace(/\/index$/, "");
  }

  // Convert [param] to :param
  let pattern = normalized.replace(/\[([^\]]+)\]/g, (_, param) => {
    // [...slug] becomes * (catch-all)
    if (param.startsWith("...")) {
      return "*";
    }
    // [id] becomes :id (dynamic segment)
    return `:${param}`;
  });

  return "/" + pattern;
}

/**
 * Create a route pattern object with regex and metadata.
 */
function createRoutePattern(pattern: string, filePath: string): RoutePattern {
  const params: string[] = [];
  let priority = 0;

  // Build regex from pattern
  let regexPattern = pattern
    .split("/")
    .map((segment, index) => {
      if (segment === "") return "";

      // Catch-all segment
      if (segment === "*") {
        params.push("*");
        priority -= 1000; // Low priority for catch-alls
        return "(.*)";
      }

      // Dynamic segment
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1);
        params.push(paramName);
        priority += 10; // Medium priority
        return "([^/]+)";
      }

      // Static segment
      priority += 100; // High priority for static segments
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  // Exact match for non-catch-all routes
  if (!pattern.includes("*")) {
    regexPattern += "$";
  }

  const regex = new RegExp("^" + regexPattern);

  return {
    pattern,
    regex,
    params,
    filePath,
    priority,
  };
}

/**
 * Match a URL against route patterns.
 * @param url - URL pathname to match
 * @param routes - Available route patterns
 * @returns Matched route with extracted params, or null
 */
export function matchRoute(
  url: string,
  routes: RoutePattern[]
): { route: RoutePattern; params: Record<string, string> } | null {
  for (const route of routes) {
    const match = route.regex.exec(url);
    if (match) {
      const params: Record<string, string> = {};

      // Extract parameters
      route.params.forEach((paramName, index) => {
        params[paramName] = match[index + 1];
      });

      return { route, params };
    }
  }

  return null;
}
