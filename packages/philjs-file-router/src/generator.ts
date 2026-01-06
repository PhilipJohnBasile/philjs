/**
 * Route configuration generator for PhilJS File-based Router.
 *
 * Converts scanned file structure to route definitions compatible with @philjs/router.
 * Generates:
 * - Route manifest
 * - TypeScript types
 * - Import statements
 */

import { dirname, relative, basename } from "node:path";
import type {
  GeneratorConfig,
  GeneratedRoute,
  RouteManifest,
  RouteTreeNode,
  ScannedFile,
  ScanResult,
} from "./types.js";
import { scanDirectory, getLayoutChain } from "./scanner.js";
import { patternToRegex, calculateRoutePriority, getRouteId } from "./parser.js";

// ============================================================================
// Generator Implementation
// ============================================================================

/**
 * Generate route configuration from a directory.
 */
export function generateRoutes(config: GeneratorConfig): RouteManifest {
  const scanResult = scanDirectory(config);
  return generateFromScanResult(scanResult, config);
}

/**
 * Generate routes from a scan result.
 */
export function generateFromScanResult(
  scanResult: ScanResult,
  config: GeneratorConfig
): RouteManifest {
  const basePath = config.basePath || "";
  const routes: GeneratedRoute[] = [];
  const imports: string[] = [];
  let importCounter = 0;

  // Process each page route
  for (const page of scanResult.pages) {
    const route = generateRouteFromFile(page, scanResult.tree, config, basePath);
    routes.push(route);

    // Generate import statement
    const importVar = `Route${importCounter++}`;
    const importPath = config.importTransformer
      ? config.importTransformer(page.absolutePath, page.relativePath)
      : getImportPath(page.absolutePath, config.routesDir);

    if (config.lazy) {
      imports.push(`const ${importVar} = () => import('${importPath}');`);
    } else {
      imports.push(`import * as ${importVar} from '${importPath}';`);
    }

    // Store import variable for later use
    (route as any).importVar = importVar;
  }

  // Sort routes by priority
  routes.sort((a, b) => b.priority - a.priority);

  // Generate TypeScript types
  const types = config.generateTypes
    ? generateTypeDefinitions(routes)
    : "";

  return {
    routes,
    tree: scanResult.tree,
    types,
    imports,
  };
}

/**
 * Generate a route from a scanned file.
 */
function generateRouteFromFile(
  file: ScannedFile,
  tree: RouteTreeNode,
  config: GeneratorConfig,
  basePath: string
): GeneratedRoute {
  const parsed = file.parsed;
  const fileDir = dirname(file.relativePath);
  const layoutChain = getLayoutChain(tree, fileDir);

  // Build final path with base
  let path = parsed.urlPattern;
  if (basePath && basePath !== "/") {
    path = basePath + (path === "/" ? "" : path);
  }

  // Determine if index route
  const fileName = basename(file.relativePath).replace(/\.[tj]sx?$/, "");
  const isIndex = fileName === "index" || fileName === "page";

  // Determine catch-all status
  const isCatchAll = parsed.segments.some(
    (s) => s.type === "catch-all" || s.type === "optional-catch-all"
  );

  // Get associated files
  const loadingPath = (file as any).loadingFile?.relativePath;
  const errorPath = (file as any).errorFile?.relativePath;
  const notFoundPath = (file as any).notFoundFile?.relativePath;

  return {
    id: file.id,
    path,
    filePath: file.relativePath,
    absolutePath: file.absolutePath,
    params: parsed.params,
    groups: parsed.groups,
    slot: parsed.slots[0],
    parentId: getParentRouteId(file, tree),
    childIds: getChildRouteIds(file, tree),
    layoutChain: layoutChain.map((l) => l.relativePath),
    loadingPath,
    errorPath,
    notFoundPath,
    isIndex,
    isCatchAll,
    priority: file.priority,
  };
}

/**
 * Get the import path for a file.
 */
function getImportPath(absolutePath: string, routesDir: string): string {
  let relativePath = relative(routesDir, absolutePath);
  // Normalize to forward slashes and remove extension
  relativePath = relativePath.replace(/\\/g, "/").replace(/\.[tj]sx?$/, "");

  // Ensure relative import
  if (!relativePath.startsWith(".") && !relativePath.startsWith("/")) {
    relativePath = "./" + relativePath;
  }

  return relativePath;
}

/**
 * Get parent route ID.
 */
function getParentRouteId(file: ScannedFile, tree: RouteTreeNode): string | undefined {
  const parentDir = dirname(file.relativePath);
  if (parentDir === "." || parentDir === "") {
    return undefined;
  }

  const parts = parentDir.split(/[/\\]/).filter(Boolean);
  let current = tree;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const child = current.children.get(part);
    if (!child) break;
    current = child;
  }

  return current.page?.id;
}

/**
 * Get child route IDs.
 */
function getChildRouteIds(file: ScannedFile, tree: RouteTreeNode): string[] {
  const dir = dirname(file.relativePath);
  const parts = dir === "." ? [] : dir.split(/[/\\]/).filter(Boolean);

  let current = tree;
  for (const part of parts) {
    const child = current.children.get(part);
    if (!child) return [];
    current = child;
  }

  const childIds: string[] = [];
  for (const child of current.children.values()) {
    if (child.page) {
      childIds.push(child.page.id);
    }
  }

  return childIds;
}

// ============================================================================
// Type Generation
// ============================================================================

/**
 * Generate TypeScript type definitions for routes.
 */
export function generateTypeDefinitions(routes: GeneratedRoute[]): string {
  const lines: string[] = [];

  // Route params interface
  lines.push("/**");
  lines.push(" * Route parameter types.");
  lines.push(" * Auto-generated by @philjs/file-router");
  lines.push(" */");
  lines.push("export interface RouteParams {");

  for (const route of routes) {
    if (route.params.length === 0) {
      lines.push(`  ${JSON.stringify(route.path)}: Record<string, never>;`);
    } else {
      lines.push(`  ${JSON.stringify(route.path)}: {`);
      for (const param of route.params) {
        if (param.startsWith("...")) {
          // Catch-all param returns array
          const name = param.slice(3);
          lines.push(`    ${JSON.stringify(name)}: string[];`);
        } else {
          lines.push(`    ${JSON.stringify(param)}: string;`);
        }
      }
      lines.push(`  };`);
    }
  }

  lines.push("}");
  lines.push("");

  // Route path type
  lines.push("/**");
  lines.push(" * All available route paths.");
  lines.push(" */");
  lines.push("export type RoutePath = keyof RouteParams;");
  lines.push("");

  // Route ID type
  lines.push("/**");
  lines.push(" * All route IDs.");
  lines.push(" */");
  lines.push("export type RouteId =");
  const routeIds = routes.map((r) => `  | ${JSON.stringify(r.id)}`);
  lines.push(routeIds.join("\n") + ";");
  lines.push("");

  // Helper type for params
  lines.push("/**");
  lines.push(" * Get params type for a specific route.");
  lines.push(" */");
  lines.push("export type ParamsFor<P extends RoutePath> = RouteParams[P];");

  return lines.join("\n");
}

/**
 * Generate the route manifest code.
 */
export function generateManifestCode(
  manifest: RouteManifest,
  config: GeneratorConfig
): string {
  const lines: string[] = [];

  // Header
  lines.push("/**");
  lines.push(" * Auto-generated route manifest");
  lines.push(" * Do not edit manually - generated by @philjs/file-router");
  lines.push(" */");
  lines.push("");

  // Imports
  lines.push(...manifest.imports);
  lines.push("");

  // Routes array
  lines.push("export const routes = [");

  for (const route of manifest.routes) {
    const importVar = (route as any).importVar;
    lines.push("  {");
    lines.push(`    id: ${JSON.stringify(route.id)},`);
    lines.push(`    path: ${JSON.stringify(route.path)},`);
    lines.push(`    filePath: ${JSON.stringify(route.filePath)},`);
    lines.push(`    params: ${JSON.stringify(route.params)},`);
    lines.push(`    priority: ${route.priority},`);

    if (config.lazy) {
      lines.push(`    lazy: ${importVar},`);
    } else {
      lines.push(`    component: ${importVar}.default,`);
      lines.push(`    loader: ${importVar}.loader,`);
      lines.push(`    action: ${importVar}.action,`);
      lines.push(`    ErrorBoundary: ${importVar}.ErrorBoundary,`);
      lines.push(`    Loading: ${importVar}.Loading,`);
    }

    if (route.layoutChain.length > 0) {
      lines.push(`    layoutChain: ${JSON.stringify(route.layoutChain)},`);
    }

    if (route.groups.length > 0) {
      lines.push(`    groups: ${JSON.stringify(route.groups)},`);
    }

    if (route.slot) {
      lines.push(`    slot: ${JSON.stringify(route.slot)},`);
    }

    if (route.isIndex) {
      lines.push(`    isIndex: true,`);
    }

    if (route.isCatchAll) {
      lines.push(`    isCatchAll: true,`);
    }

    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  // Route matching function
  lines.push(`
/**
 * Match a pathname to a route.
 */
export function matchRoute(pathname: string) {
  for (const route of routes) {
    const pattern = route.path
      .replace(/:\\w+/g, '([^/]+)')
      .replace(/\\*\\w+\\??/g, '(.*)');
    const regex = new RegExp('^' + pattern + '$');
    const match = pathname.match(regex);
    if (match) {
      const params: Record<string, string> = {};
      route.params.forEach((param, index) => {
        params[param.startsWith('...') ? param.slice(3) : param] = match[index + 1] || '';
      });
      return { route, params };
    }
  }
  return null;
}
`);

  // Route loading function
  lines.push(`
/**
 * Load a route module by ID.
 */
export async function loadRoute(routeId: string) {
  const route = routes.find(r => r.id === routeId);
  if (!route || !route.lazy) {
    return null;
  }
  return route.lazy();
}
`);

  // Type definitions
  if (manifest.types) {
    lines.push("");
    lines.push("// Type definitions");
    lines.push(manifest.types);
  }

  return lines.join("\n");
}

// ============================================================================
// Route Matching
// ============================================================================

/**
 * Match a URL to a route in the manifest.
 */
export function matchRouteFromManifest(
  pathname: string,
  manifest: RouteManifest
): GeneratedRoute | null {
  // Routes are sorted by priority, first match wins
  for (const route of manifest.routes) {
    const regex = patternToRegex(route.path);
    if (regex.test(pathname)) {
      return route;
    }
  }

  return null;
}

/**
 * Extract parameters from a URL using a route.
 */
export function extractRouteParams(
  pathname: string,
  route: GeneratedRoute
): Record<string, string> | null {
  const regex = patternToRegex(route.path);
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  route.params.forEach((param, index) => {
    const value = match[index + 1];
    if (value !== undefined) {
      // Handle catch-all params
      const paramName = param.startsWith("...") ? param.slice(3) : param;
      params[paramName] = decodeURIComponent(value);
    }
  });

  return params;
}

// ============================================================================
// Integration with @philjs/router
// ============================================================================

/**
 * Convert generated routes to @philjs/router RouteDefinition format.
 */
export function toRouterDefinitions(manifest: RouteManifest): object[] {
  return manifest.routes.map((route) => ({
    path: route.path,
    id: route.id,
    children: route.childIds.length > 0
      ? route.childIds.map((childId) => {
          const child = manifest.routes.find((r) => r.id === childId);
          return child ? { path: child.path, id: child.id } : null;
        }).filter(Boolean)
      : undefined,
  }));
}

/**
 * Create a route loader function for runtime use.
 */
export function createRouteLoader(
  manifest: RouteManifest,
  moduleLoader: (path: string) => Promise<unknown>
): (routeId: string) => Promise<unknown> {
  const routeMap = new Map(manifest.routes.map((r) => [r.id, r]));

  return async (routeId: string) => {
    const route = routeMap.get(routeId);
    if (!route) {
      return null;
    }
    return moduleLoader(route.absolutePath);
  };
}
