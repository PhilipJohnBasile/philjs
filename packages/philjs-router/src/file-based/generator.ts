/**
 * Route configuration generator for PhilJS Router.
 * Converts scanned file structure to route definitions.
 */

import { dirname, basename, relative } from "node:path";
import type { NestedRouteDefinition, RouteComponent } from "../nested.js";
import type { LoaderFunction } from "../loader.js";
import type { ActionFunction } from "../action.js";
import type { SlotDefinition, ParallelRouteConfig } from "../parallel-routes.js";
import type { RouteGroup, GroupRoute } from "../route-groups.js";
import {
  parseFilePath,
  patternToRegex,
  calculateRoutePriority,
  type ParsedFilePath,
  type RouteConfig,
  type RouteMetadata,
} from "./conventions.js";
import {
  scanDirectory,
  flattenRouteTree,
  getLayoutChain,
  type ScanResult,
  type ScannedFile,
  type RouteNode,
  type ScannerConfig,
} from "./scanner.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Route module exports.
 */
export type RouteModule = {
  /** Default export - the page/layout component */
  default?: RouteComponent;
  /** Data loader function */
  loader?: LoaderFunction;
  /** Form action function */
  action?: ActionFunction;
  /** Error boundary component */
  ErrorBoundary?: RouteComponent;
  /** Loading component */
  Loading?: RouteComponent;
  /** Not found component */
  NotFound?: RouteComponent;
  /** Route configuration */
  config?: RouteConfig;
  /** Route metadata */
  metadata?: RouteMetadata;
  /** Middleware function */
  middleware?: (request: Request) => Response | void | Promise<Response | void>;
  /** Generate static params for dynamic routes */
  generateStaticParams?: () => Promise<Record<string, string>[]>;
  /** Generate metadata dynamically */
  generateMetadata?: (params: Record<string, string>) => Promise<RouteMetadata>;
};

/**
 * Generated route configuration.
 */
export type GeneratedRoute = {
  /** Route ID */
  id: string;
  /** URL pattern */
  path: string;
  /** File path relative to routes directory */
  filePath: string;
  /** Absolute file path */
  absolutePath: string;
  /** Import path for dynamic import */
  importPath: string;
  /** Parameter names */
  params: string[];
  /** Route groups this route belongs to */
  groups: string[];
  /** Parallel slot if applicable */
  slot?: string;
  /** Parent route ID */
  parentId?: string;
  /** Child route IDs */
  childIds: string[];
  /** Layout chain (file paths) */
  layoutChain: string[];
  /** Whether this is an index route */
  isIndex: boolean;
  /** Whether this is a catch-all route */
  isCatchAll: boolean;
  /** Whether this is an optional catch-all */
  isOptionalCatchAll: boolean;
  /** Priority for route matching */
  priority: number;
  /** Has loader */
  hasLoader: boolean;
  /** Has action */
  hasAction: boolean;
  /** Has error boundary */
  hasErrorBoundary: boolean;
  /** Has loading state */
  hasLoading: boolean;
  /** Route configuration from file */
  config?: RouteConfig;
};

/**
 * Generated route manifest.
 */
export type RouteManifest = {
  /** All routes */
  routes: GeneratedRoute[];
  /** Route tree for nested routing */
  tree: NestedRouteDefinition[];
  /** Parallel route configuration */
  parallelRoutes: ParallelRouteConfig | null;
  /** Route groups */
  groups: RouteGroup[];
  /** Type definitions for routes */
  types: string;
  /** Import statements for all route modules */
  imports: string[];
  /** Map of route ID to import variable */
  importMap: Map<string, string>;
};

/**
 * Configuration for route generation.
 */
export type GeneratorConfig = ScannerConfig & {
  /** Base path for all routes */
  basePath?: string;
  /** Whether to generate lazy imports */
  lazy?: boolean;
  /** Custom import path transformer */
  importTransformer?: (absolutePath: string, relativePath: string) => string;
  /** Whether to include type generation */
  generateTypes?: boolean;
  /** Module name for type declarations */
  typesModuleName?: string;
};

// ============================================================================
// Generator Implementation
// ============================================================================

/**
 * Generate route configuration from a directory.
 */
export function generateRoutes(config: GeneratorConfig): RouteManifest {
  // Scan the directory
  const scanResult = scanDirectory(config);

  // Generate routes from scan result
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
  const importMap = new Map<string, string>();
  const imports: string[] = [];
  let importCounter = 0;

  // Process each page route
  for (const file of scanResult.routes) {
    const route = generateRouteFromFile(file, scanResult.tree, config, basePath);
    routes.push(route);

    // Generate import
    const importVar = `Route${importCounter++}`;
    const importPath = config.importTransformer
      ? config.importTransformer(file.absolutePath, file.relativePath)
      : getImportPath(file.absolutePath, config.dir);

    if (config.lazy) {
      imports.push(`const ${importVar} = () => import('${importPath}');`);
    } else {
      imports.push(`import * as ${importVar} from '${importPath}';`);
    }

    importMap.set(route.id, importVar);
  }

  // Build route tree
  const tree = buildRouteTree(routes, scanResult.tree, config);

  // Build parallel routes configuration
  const parallelRoutes = buildParallelRoutes(scanResult.tree, routes, config);

  // Build route groups
  const groups = buildRouteGroups(routes, scanResult.tree);

  // Generate types
  const types = config.generateTypes
    ? generateRouteTypes(routes, config.typesModuleName)
    : "";

  return {
    routes,
    tree,
    parallelRoutes,
    groups,
    types,
    imports,
    importMap,
  };
}

/**
 * Generate a route from a scanned file.
 */
function generateRouteFromFile(
  file: ScannedFile,
  tree: RouteNode,
  config: GeneratorConfig,
  basePath: string
): GeneratedRoute {
  const parsed = file.parsed;
  const layoutChain = getLayoutChain(tree, dirname(file.relativePath));

  // Determine path with base
  let path = parsed.urlPattern;
  if (basePath && basePath !== "/") {
    path = basePath + (path === "/" ? "" : path);
  }

  // Check for index routes
  const isIndex = basename(file.relativePath).replace(/\.(tsx?|jsx?|js)$/, "") === "index" ||
    basename(file.relativePath).replace(/\.(tsx?|jsx?|js)$/, "") === "page";

  // Determine catch-all status
  const isCatchAll = parsed.segments.some((s) => s.type === "catch-all");
  const isOptionalCatchAll = parsed.segments.some((s) => s.type === "optional-catch-all");

  return {
    id: file.id,
    path,
    filePath: file.relativePath,
    absolutePath: file.absolutePath,
    importPath: getImportPath(file.absolutePath, config.dir),
    params: parsed.params,
    groups: parsed.groups,
    slot: parsed.slots[0],
    parentId: getParentRouteId(file, tree),
    childIds: getChildRouteIds(file, tree),
    layoutChain: layoutChain.map((l) => l.relativePath),
    isIndex,
    isCatchAll,
    isOptionalCatchAll,
    priority: file.priority,
    hasLoader: false, // Will be determined at runtime
    hasAction: false,
    hasErrorBoundary: !!file.associated.error,
    hasLoading: !!file.associated.loading,
  };
}

/**
 * Build nested route tree.
 */
function buildRouteTree(
  routes: GeneratedRoute[],
  scanTree: RouteNode,
  config: GeneratorConfig
): NestedRouteDefinition[] {
  return buildTreeRecursive(scanTree, routes, config);
}

/**
 * Recursively build route tree.
 */
function buildTreeRecursive(
  node: RouteNode,
  routes: GeneratedRoute[],
  config: GeneratorConfig,
  parentPath: string = ""
): NestedRouteDefinition[] {
  const result: NestedRouteDefinition[] = [];

  // Check if this node has a page
  if (node.page) {
    const route = routes.find((r) => r.id === node.page!.id);
    if (route) {
      const definition: NestedRouteDefinition = {
        path: route.path,
        id: route.id,
      };

      // Add children from child nodes
      const children: NestedRouteDefinition[] = [];
      for (const child of node.children.values()) {
        children.push(...buildTreeRecursive(child, routes, config, route.path));
      }

      if (children.length > 0) {
        definition.children = children;
      }

      result.push(definition);
    }
  } else {
    // No page at this node, but might have children
    for (const child of node.children.values()) {
      result.push(...buildTreeRecursive(child, routes, config, parentPath));
    }
  }

  return result;
}

/**
 * Build parallel routes configuration.
 */
function buildParallelRoutes(
  tree: RouteNode,
  routes: GeneratedRoute[],
  config: GeneratorConfig
): ParallelRouteConfig | null {
  if (!config.parallel) {
    return null;
  }

  const slots: SlotDefinition[] = [];

  // Collect all slots from the tree
  collectSlots(tree, routes, slots, "");

  if (slots.length === 0) {
    return null;
  }

  return {
    basePath: config.basePath || "",
    slots,
    mainSlot: "children",
    softNavigation: true,
  };
}

/**
 * Recursively collect slots from the tree.
 */
function collectSlots(
  node: RouteNode,
  routes: GeneratedRoute[],
  slots: SlotDefinition[],
  parentPath: string
): void {
  // Check for slots at this node
  for (const [slotName, slotNode] of node.slots) {
    const slotRoutes = routes.filter((r) => r.slot === slotName);

    if (slotRoutes.length > 0) {
      const slotDef: SlotDefinition = {
        name: `@${slotName}`,
        path: parentPath || "/",
        id: `slot:${slotName}`,
        optional: true,
      };

      slots.push(slotDef);
    }
  }

  // Check children
  for (const child of node.children.values()) {
    const childPath = parentPath
      ? `${parentPath}/${child.segment}`
      : `/${child.segment}`;
    collectSlots(child, routes, slots, childPath);
  }
}

/**
 * Build route groups.
 */
function buildRouteGroups(
  routes: GeneratedRoute[],
  tree: RouteNode
): RouteGroup[] {
  const groupMap = new Map<string, RouteGroup>();

  for (const route of routes) {
    for (const groupName of route.groups) {
      let group = groupMap.get(groupName);

      if (!group) {
        group = {
          name: groupName,
          routes: [],
          middleware: [],
        };
        groupMap.set(groupName, group);
      }

      const groupRoute: GroupRoute = {
        path: route.path,
        component: undefined as any, // Will be set at runtime
        id: route.id,
      };

      group.routes.push(groupRoute);
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Generate TypeScript type definitions for routes.
 */
export function generateRouteTypes(
  routes: GeneratedRoute[],
  moduleName?: string
): string {
  const lines: string[] = [];

  if (moduleName) {
    lines.push(`declare module "${moduleName}" {`);
    lines.push("  export interface RouteParams {");
  } else {
    lines.push("export interface RouteParams {");
  }

  const indent = moduleName ? "    " : "  ";

  for (const route of routes) {
    if (route.params.length === 0) {
      lines.push(`${indent}${JSON.stringify(route.path)}: {};`);
    } else {
      lines.push(`${indent}${JSON.stringify(route.path)}: {`);
      for (const param of route.params) {
        if (param.startsWith("...")) {
          // Catch-all param
          const name = param.slice(3);
          lines.push(`${indent}  ${JSON.stringify(name)}: string[];`);
        } else {
          lines.push(`${indent}  ${JSON.stringify(param)}: string;`);
        }
      }
      lines.push(`${indent}};`);
    }
  }

  if (moduleName) {
    lines.push("  }");
    lines.push("");
    lines.push("  export type RoutePath = keyof RouteParams;");
    lines.push("}");
  } else {
    lines.push("}");
    lines.push("");
    lines.push("export type RoutePath = keyof RouteParams;");
  }

  // Generate route ID type
  lines.push("");
  if (moduleName) {
    lines.push(`declare module "${moduleName}" {`);
    lines.push("  export type RouteId =");
  } else {
    lines.push("export type RouteId =");
  }

  const routeIds = routes.map((r) => `    | ${JSON.stringify(r.id)}`);
  lines.push(routeIds.join("\n") + ";");

  if (moduleName) {
    lines.push("}");
  }

  return lines.join("\n");
}

/**
 * Generate a route manifest file content.
 */
export function generateManifestCode(
  manifest: RouteManifest,
  config: GeneratorConfig
): string {
  const lines: string[] = [];

  // Add header
  lines.push("// Auto-generated route manifest");
  lines.push("// Do not edit manually");
  lines.push("");

  // Add imports
  lines.push(...manifest.imports);
  lines.push("");

  // Generate route definitions
  lines.push("export const routes = [");

  for (const route of manifest.routes) {
    const importVar = manifest.importMap.get(route.id);
    lines.push("  {");
    lines.push(`    id: ${JSON.stringify(route.id)},`);
    lines.push(`    path: ${JSON.stringify(route.path)},`);
    lines.push(`    filePath: ${JSON.stringify(route.filePath)},`);

    if (config.lazy) {
      lines.push(`    lazy: ${importVar},`);
    } else {
      lines.push(`    component: ${importVar}.default,`);
      lines.push(`    loader: ${importVar}.loader,`);
      lines.push(`    action: ${importVar}.action,`);
      lines.push(`    ErrorBoundary: ${importVar}.ErrorBoundary,`);
      lines.push(`    config: ${importVar}.config,`);
    }

    if (route.params.length > 0) {
      lines.push(`    params: ${JSON.stringify(route.params)},`);
    }

    if (route.layoutChain.length > 0) {
      lines.push(`    layoutChain: ${JSON.stringify(route.layoutChain)},`);
    }

    lines.push(`    priority: ${route.priority},`);
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  // Generate route tree
  lines.push("export const routeTree = ");
  lines.push(JSON.stringify(manifest.tree, null, 2) + ";");
  lines.push("");

  // Generate types export
  if (manifest.types) {
    lines.push("// Type definitions");
    lines.push(manifest.types);
  }

  return lines.join("\n");
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the import path for a file.
 */
function getImportPath(absolutePath: string, routesDir: string): string {
  const relativePath = relative(routesDir, absolutePath);
  // Normalize to forward slashes and remove extension
  let importPath = relativePath.replace(/\\/g, "/").replace(/\.(tsx?|jsx?|js)$/, "");

  // Ensure relative import
  if (!importPath.startsWith(".")) {
    importPath = "./" + importPath;
  }

  return importPath;
}

/**
 * Get the parent route ID for a file.
 */
function getParentRouteId(file: ScannedFile, tree: RouteNode): string | undefined {
  const parentDir = dirname(file.relativePath);
  if (parentDir === "." || parentDir === "") {
    return undefined;
  }

  const parts = parentDir.split(/[/\\]/).filter(Boolean);
  let current = tree;

  for (const part of parts.slice(0, -1)) {
    const child = current.children.get(part);
    if (!child) {
      break;
    }
    current = child;
  }

  if (current.page) {
    return current.page.id;
  }

  return undefined;
}

/**
 * Get child route IDs for a file.
 */
function getChildRouteIds(file: ScannedFile, tree: RouteNode): string[] {
  const dir = dirname(file.relativePath);
  const parts = dir.split(/[/\\]/).filter(Boolean);

  let current = tree;
  for (const part of parts) {
    const child = current.children.get(part);
    if (!child) {
      return [];
    }
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
// Runtime Route Loading
// ============================================================================

/**
 * Create a route loader function for runtime use.
 */
export function createRouteLoader(
  manifest: RouteManifest,
  importMap: Map<string, () => Promise<RouteModule>>
): (routeId: string) => Promise<RouteModule | null> {
  return async (routeId: string) => {
    const importFn = importMap.get(routeId);
    if (!importFn) {
      return null;
    }
    return importFn();
  };
}

/**
 * Match a URL to a route in the manifest.
 */
export function matchRouteFromManifest(
  url: string,
  manifest: RouteManifest
): GeneratedRoute | null {
  const pathname = new URL(url, "http://localhost").pathname;

  // Routes are sorted by priority, so first match wins
  for (const route of manifest.routes) {
    const regex = patternToRegex(route.path);
    if (regex.test(pathname)) {
      return route;
    }
  }

  return null;
}

/**
 * Extract params from a URL using a route.
 */
export function extractRouteParams(
  url: string,
  route: GeneratedRoute
): Record<string, string> | null {
  const pathname = new URL(url, "http://localhost").pathname;
  const regex = patternToRegex(route.path);
  const match = pathname.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  route.params.forEach((param, index) => {
    const value = match[index + 1];
    if (value !== undefined) {
      if (param.startsWith("...")) {
        // Catch-all - split into array
        params[param.slice(3)] = value;
      } else {
        params[param] = decodeURIComponent(value);
      }
    }
  });

  return params;
}
