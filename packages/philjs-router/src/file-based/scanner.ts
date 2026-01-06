/**
 * File-based route scanner for PhilJS Router.
 * Scans a directory for route files and builds a route tree.
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, basename, extname } from "node:path";
import {
  parseFilePath,
  shouldIgnoreFile,
  isRouteFile,
  getRouteId,
  calculateRoutePriority,
  RESERVED_FILE_NAMES,
  ROUTE_FILE_EXTENSIONS,
  type ParsedFilePath,
  type RouteFileType,
  type ParsedSegment,
} from "./conventions.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for the route scanner.
 */
export type ScannerConfig = {
  /** Root directory to scan for routes */
  dir: string;
  /** File extensions to consider as route files */
  extensions?: string[];
  /** Patterns to ignore */
  ignore?: (string | RegExp)[];
  /** Whether to include layouts */
  layouts?: boolean;
  /** Whether to include loading states */
  loading?: boolean;
  /** Whether to include error boundaries */
  errors?: boolean;
  /** Whether to include parallel routes */
  parallel?: boolean;
  /** Whether to include route groups */
  groups?: boolean;
  /** Custom file type detection */
  fileTypeDetector?: (filePath: string) => RouteFileType | null;
};

/**
 * A scanned route file.
 */
export type ScannedFile = {
  /** Absolute file path */
  absolutePath: string;
  /** Relative file path from routes directory */
  relativePath: string;
  /** Parsed file information */
  parsed: ParsedFilePath;
  /** Route ID */
  id: string;
  /** Route priority for matching order */
  priority: number;
  /** Parent directory path */
  parentDir: string;
  /** Associated files (layout, loading, error) */
  associated: {
    layout?: ScannedFile;
    loading?: ScannedFile;
    error?: ScannedFile;
    template?: ScannedFile;
    default?: ScannedFile;
  };
};

/**
 * A route tree node.
 */
export type RouteNode = {
  /** Route segment */
  segment: string;
  /** Parsed segment info */
  parsedSegment: ParsedSegment;
  /** Page file for this route */
  page?: ScannedFile;
  /** Layout file for this route */
  layout?: ScannedFile;
  /** Loading file for this route */
  loading?: ScannedFile;
  /** Error file for this route */
  error?: ScannedFile;
  /** Template file for this route */
  template?: ScannedFile;
  /** Default file for parallel routes */
  default?: ScannedFile;
  /** Middleware file */
  middleware?: ScannedFile;
  /** Not found file */
  notFound?: ScannedFile;
  /** API route file */
  route?: ScannedFile;
  /** Child routes */
  children: Map<string, RouteNode>;
  /** Parallel slots */
  slots: Map<string, RouteNode>;
  /** Full path to this node */
  path: string;
  /** URL pattern for this route */
  urlPattern: string;
  /** Route groups this node belongs to */
  groups: string[];
};

/**
 * Result of a directory scan.
 */
export type ScanResult = {
  /** All scanned files */
  files: ScannedFile[];
  /** Route tree */
  tree: RouteNode;
  /** Flat list of page routes */
  routes: ScannedFile[];
  /** All layouts */
  layouts: ScannedFile[];
  /** All loading states */
  loadings: ScannedFile[];
  /** All error boundaries */
  errors: ScannedFile[];
  /** All middleware files */
  middlewares: ScannedFile[];
  /** Scan duration in milliseconds */
  duration: number;
  /** Any warnings during scan */
  warnings: string[];
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<ScannerConfig, "dir" | "fileTypeDetector">> = {
  extensions: ROUTE_FILE_EXTENSIONS,
  ignore: [],
  layouts: true,
  loading: true,
  errors: true,
  parallel: true,
  groups: true,
};

// ============================================================================
// Scanner Implementation
// ============================================================================

/**
 * Scan a directory for route files.
 */
export function scanDirectory(config: ScannerConfig): ScanResult {
  const startTime = performance.now();
  const warnings: string[] = [];

  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    extensions: config.extensions || DEFAULT_CONFIG.extensions,
    ignore: [...DEFAULT_CONFIG.ignore, ...(config.ignore || [])],
  };

  const { dir } = mergedConfig;

  // Validate directory exists
  if (!existsSync(dir)) {
    throw new Error(`Routes directory does not exist: ${dir}`);
  }

  const stat = statSync(dir);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dir}`);
  }

  // Scan all files
  const allFiles: ScannedFile[] = [];
  const routes: ScannedFile[] = [];
  const layouts: ScannedFile[] = [];
  const loadings: ScannedFile[] = [];
  const errors: ScannedFile[] = [];
  const middlewares: ScannedFile[] = [];

  // Create root node
  const rootNode: RouteNode = createRouteNode("", "/", []);

  // Recursively scan directory
  scanDir(dir, "", mergedConfig, allFiles, rootNode, warnings);

  // Categorize files
  for (const file of allFiles) {
    switch (file.parsed.fileType) {
      case "page":
        routes.push(file);
        break;
      case "layout":
        if (mergedConfig.layouts) layouts.push(file);
        break;
      case "loading":
        if (mergedConfig.loading) loadings.push(file);
        break;
      case "error":
        if (mergedConfig.errors) errors.push(file);
        break;
      case "middleware":
        middlewares.push(file);
        break;
    }
  }

  // Sort routes by priority
  routes.sort((a, b) => b.priority - a.priority);

  // Associate layouts, loading states, and error boundaries with pages
  associateFiles(routes, layouts, loadings, errors);

  const duration = performance.now() - startTime;

  return {
    files: allFiles,
    tree: rootNode,
    routes,
    layouts,
    loadings,
    errors,
    middlewares,
    duration,
    warnings,
  };
}

/**
 * Recursively scan a directory.
 */
function scanDir(
  absoluteDir: string,
  relativePath: string,
  config: Required<Omit<ScannerConfig, "fileTypeDetector">> & { fileTypeDetector?: ScannerConfig["fileTypeDetector"] },
  allFiles: ScannedFile[],
  parentNode: RouteNode,
  warnings: string[]
): void {
  let entries: string[];

  try {
    entries = readdirSync(absoluteDir);
  } catch (error) {
    warnings.push(`Could not read directory: ${absoluteDir}`);
    return;
  }

  // Separate directories and files
  const directories: string[] = [];
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(absoluteDir, entry);

    // Check ignore patterns
    if (shouldIgnore(entry, config.ignore)) {
      continue;
    }

    try {
      const entryStat = statSync(fullPath);
      if (entryStat.isDirectory()) {
        directories.push(entry);
      } else if (entryStat.isFile()) {
        files.push(entry);
      }
    } catch (error) {
      warnings.push(`Could not stat: ${fullPath}`);
    }
  }

  // Process files first
  for (const file of files) {
    if (!isRouteFile(file)) {
      continue;
    }

    const fullPath = join(absoluteDir, file);
    const relPath = relativePath ? `${relativePath}/${file}` : file;

    const parsed = parseFilePath(relPath);

    if (parsed.ignored) {
      continue;
    }

    // Check for parallel routes
    if (parsed.slots.length > 0 && !config.parallel) {
      continue;
    }

    // Check for route groups
    if (parsed.groups.length > 0 && !config.groups) {
      continue;
    }

    const scannedFile: ScannedFile = {
      absolutePath: fullPath,
      relativePath: relPath,
      parsed,
      id: getRouteId(relPath),
      priority: calculateRoutePriority(parsed.segments),
      parentDir: relativePath,
      associated: {},
    };

    allFiles.push(scannedFile);

    // Add to tree
    addFileToNode(parentNode, scannedFile);
  }

  // Process directories
  for (const dir of directories) {
    const fullPath = join(absoluteDir, dir);
    const relPath = relativePath ? `${relativePath}/${dir}` : dir;

    // Check if this is a parallel slot
    if (dir.startsWith("@")) {
      if (!config.parallel) continue;

      const slotName = dir.slice(1);
      let slotNode = parentNode.slots.get(slotName);

      if (!slotNode) {
        const parsedSegment = {
          raw: dir,
          type: "parallel" as const,
          slot: slotName,
          includeInUrl: false,
        };
        slotNode = createRouteNode(dir, parentNode.urlPattern, [...parentNode.groups]);
        slotNode.parsedSegment = parsedSegment;
        parentNode.slots.set(slotName, slotNode);
      }

      scanDir(fullPath, relPath, config, allFiles, slotNode, warnings);
      continue;
    }

    // Check if this is a route group
    if (dir.startsWith("(") && dir.endsWith(")")) {
      if (!config.groups) continue;

      const groupName = dir.slice(1, -1);
      let childNode = parentNode.children.get(dir);

      if (!childNode) {
        const parsedSegment = {
          raw: dir,
          type: "group" as const,
          group: groupName,
          includeInUrl: false,
        };
        childNode = createRouteNode(dir, parentNode.urlPattern, [...parentNode.groups, groupName]);
        childNode.parsedSegment = parsedSegment;
        parentNode.children.set(dir, childNode);
      }

      scanDir(fullPath, relPath, config, allFiles, childNode, warnings);
      continue;
    }

    // Regular directory
    let childNode = parentNode.children.get(dir);

    if (!childNode) {
      const parsedSegment = {
        raw: dir,
        type: "static" as const,
        includeInUrl: true,
      };
      // Check for dynamic segments
      if (dir.startsWith("[") && dir.endsWith("]")) {
        if (dir.startsWith("[[...") && dir.endsWith("]]")) {
          const param = dir.slice(5, -2);
          parsedSegment.type = "optional-catch-all";
          (parsedSegment as any).param = param;
        } else if (dir.startsWith("[...") && dir.endsWith("]")) {
          const param = dir.slice(4, -1);
          parsedSegment.type = "catch-all";
          (parsedSegment as any).param = param;
        } else {
          const param = dir.slice(1, -1);
          parsedSegment.type = "dynamic";
          (parsedSegment as any).param = param;
        }
      }

      const urlSegment = getUrlSegment(parsedSegment);
      const newUrlPattern =
        parentNode.urlPattern === "/"
          ? `/${urlSegment}`
          : `${parentNode.urlPattern}/${urlSegment}`;

      childNode = createRouteNode(dir, urlSegment ? newUrlPattern : parentNode.urlPattern, [...parentNode.groups]);
      childNode.parsedSegment = parsedSegment;
      parentNode.children.set(dir, childNode);
    }

    scanDir(fullPath, relPath, config, allFiles, childNode, warnings);
  }
}

/**
 * Create a new route node.
 */
function createRouteNode(segment: string, urlPattern: string, groups: string[]): RouteNode {
  return {
    segment,
    parsedSegment: {
      raw: segment,
      type: "static",
      includeInUrl: true,
    },
    children: new Map(),
    slots: new Map(),
    path: segment,
    urlPattern,
    groups,
  };
}

/**
 * Get the URL segment for a parsed segment.
 */
function getUrlSegment(segment: ParsedSegment): string {
  switch (segment.type) {
    case "static":
      return segment.raw;
    case "dynamic":
      return `:${segment.param}`;
    case "catch-all":
      return `*${segment.param}`;
    case "optional-catch-all":
      return `*${segment.param}?`;
    case "group":
    case "parallel":
      return "";
    default:
      return segment.raw;
  }
}

/**
 * Add a scanned file to a route node.
 */
function addFileToNode(node: RouteNode, file: ScannedFile): void {
  switch (file.parsed.fileType) {
    case "page":
      node.page = file;
      break;
    case "layout":
      node.layout = file;
      break;
    case "loading":
      node.loading = file;
      break;
    case "error":
      node.error = file;
      break;
    case "template":
      node.template = file;
      break;
    case "default":
      node.default = file;
      break;
    case "middleware":
      node.middleware = file;
      break;
    case "not-found":
      node.notFound = file;
      break;
    case "route":
      node.route = file;
      break;
  }
}

/**
 * Check if a file/directory should be ignored.
 */
function shouldIgnore(name: string, patterns: (string | RegExp)[]): boolean {
  // Always ignore underscore-prefixed items
  if (name.startsWith("_")) return true;

  // Always ignore hidden files
  if (name.startsWith(".")) return true;

  // Check custom patterns
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      if (name === pattern) return true;
    } else if (pattern.test(name)) {
      return true;
    }
  }

  return false;
}

/**
 * Associate layouts, loading states, and error boundaries with page routes.
 */
function associateFiles(
  routes: ScannedFile[],
  layouts: ScannedFile[],
  loadings: ScannedFile[],
  errors: ScannedFile[]
): void {
  for (const route of routes) {
    // Find applicable layouts (from root to current directory)
    const applicableLayouts = findApplicableFiles(route, layouts);
    if (applicableLayouts.length > 0) {
      route.associated.layout = applicableLayouts[applicableLayouts.length - 1];
    }

    // Find applicable loading states
    const applicableLoadings = findApplicableFiles(route, loadings);
    if (applicableLoadings.length > 0) {
      route.associated.loading = applicableLoadings[applicableLoadings.length - 1];
    }

    // Find applicable error boundaries
    const applicableErrors = findApplicableFiles(route, errors);
    if (applicableErrors.length > 0) {
      route.associated.error = applicableErrors[applicableErrors.length - 1];
    }
  }
}

/**
 * Find files that apply to a route (from root to route's directory).
 */
function findApplicableFiles(route: ScannedFile, files: ScannedFile[]): ScannedFile[] {
  const routeDir = dirname(route.relativePath).replace(/\\/g, "/");
  const routeParts = routeDir.split("/").filter(Boolean);

  const applicable: ScannedFile[] = [];

  // Check root level
  const rootFile = files.find((f) => {
    const dir = dirname(f.relativePath).replace(/\\/g, "/");
    return dir === "." || dir === "";
  });
  if (rootFile) {
    applicable.push(rootFile);
  }

  // Check each level down to the route
  let currentPath = "";
  for (const part of routeParts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    const levelFile = files.find((f) => {
      const dir = dirname(f.relativePath).replace(/\\/g, "/");
      return dir === currentPath;
    });

    if (levelFile) {
      applicable.push(levelFile);
    }
  }

  return applicable;
}

// ============================================================================
// Tree Utilities
// ============================================================================

/**
 * Flatten the route tree to an array of routes.
 */
export function flattenRouteTree(node: RouteNode): ScannedFile[] {
  const routes: ScannedFile[] = [];

  if (node.page) {
    routes.push(node.page);
  }

  // Process children
  for (const child of node.children.values()) {
    routes.push(...flattenRouteTree(child));
  }

  // Process slots
  for (const slot of node.slots.values()) {
    routes.push(...flattenRouteTree(slot));
  }

  return routes;
}

/**
 * Find a node by path in the route tree.
 */
export function findNodeByPath(tree: RouteNode, path: string): RouteNode | null {
  const segments = path.split("/").filter(Boolean);

  let current: RouteNode | undefined = tree;

  for (const segment of segments) {
    // Check regular children
    let child = current.children.get(segment);

    // Check parallel slots
    if (!child && segment.startsWith("@")) {
      child = current.slots.get(segment.slice(1));
    }

    if (!child) {
      return null;
    }

    current = child;
  }

  return current;
}

/**
 * Get all layouts that apply to a route.
 */
export function getLayoutChain(tree: RouteNode, path: string): ScannedFile[] {
  const layouts: ScannedFile[] = [];
  const segments = path.split("/").filter(Boolean);

  let current: RouteNode | undefined = tree;

  // Check root layout
  if (current.layout) {
    layouts.push(current.layout);
  }

  for (const segment of segments) {
    let child = current.children.get(segment);

    if (!child && segment.startsWith("@")) {
      child = current.slots.get(segment.slice(1));
    }

    if (!child) {
      break;
    }

    if (child.layout) {
      layouts.push(child.layout);
    }

    current = child;
  }

  return layouts;
}

/**
 * Print the route tree for debugging.
 */
export function printRouteTree(node: RouteNode, indent: string = ""): string {
  const lines: string[] = [];

  const segment = node.segment || "(root)";
  const files: string[] = [];

  if (node.page) files.push("page");
  if (node.layout) files.push("layout");
  if (node.loading) files.push("loading");
  if (node.error) files.push("error");
  if (node.template) files.push("template");
  if (node.default) files.push("default");
  if (node.middleware) files.push("middleware");
  if (node.route) files.push("route");

  const fileInfo = files.length > 0 ? ` [${files.join(", ")}]` : "";
  const urlInfo = node.urlPattern ? ` -> ${node.urlPattern}` : "";

  lines.push(`${indent}${segment}${fileInfo}${urlInfo}`);

  // Print children
  for (const [name, child] of node.children) {
    lines.push(printRouteTree(child, indent + "  "));
  }

  // Print slots
  for (const [name, slot] of node.slots) {
    lines.push(`${indent}  @${name}`);
    lines.push(printRouteTree(slot, indent + "    "));
  }

  return lines.join("\n");
}

// ============================================================================
// Watch Helpers
// ============================================================================

/**
 * Check if a file change affects routes.
 */
export function isRouteFileChange(filePath: string, config: ScannerConfig): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const extensions = config.extensions || DEFAULT_CONFIG.extensions;

  // Check extension
  const ext = extname(normalized);
  if (!extensions.includes(ext)) {
    return false;
  }

  // Check ignore patterns
  if (shouldIgnoreFile(normalized)) {
    return false;
  }

  // Check if it's in the routes directory
  const routesDir = config.dir.replace(/\\/g, "/");
  if (!normalized.startsWith(routesDir)) {
    return false;
  }

  return true;
}

/**
 * Get the affected routes when a file changes.
 */
export function getAffectedRoutes(
  filePath: string,
  tree: RouteNode
): ScannedFile[] {
  const normalized = filePath.replace(/\\/g, "/");
  const parsed = parseFilePath(normalized);

  // If it's a page file, only that route is affected
  if (parsed.fileType === "page") {
    const node = findNodeByPath(tree, dirname(normalized));
    if (node?.page) {
      return [node.page];
    }
    return [];
  }

  // If it's a layout, loading, or error file, all child routes are affected
  if (["layout", "loading", "error"].includes(parsed.fileType || "")) {
    const node = findNodeByPath(tree, dirname(normalized));
    if (node) {
      return flattenRouteTree(node);
    }
  }

  return [];
}
