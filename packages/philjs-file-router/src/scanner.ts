/**
 * File system scanner for PhilJS File-based Router.
 *
 * Scans a directory for route files and builds a route tree.
 * Supports:
 * - pages/ or routes/ directory convention
 * - Nested directories
 * - Dynamic routes [id]
 * - Catch-all routes [...slug]
 * - Route groups (group)
 * - Parallel routes @slot
 * - Special files (_layout, _loading, _error, _404)
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import type {
  ScannerConfig,
  ScanResult,
  ScannedFile,
  RouteTreeNode,
  ParsedSegment,
} from "./types.js";
import {
  parseFilePath,
  parseSegment,
  segmentToUrlPattern,
  isRouteFile,
  shouldIgnoreSegment,
  calculateRoutePriority,
  getRouteId,
  ROUTE_EXTENSIONS,
} from "./parser.js";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<ScannerConfig, "routesDir">> = {
  extensions: ROUTE_EXTENSIONS,
  ignore: [],
  layouts: true,
  loading: true,
  errors: true,
  groups: true,
  parallel: true,
};

// ============================================================================
// Scanner Implementation
// ============================================================================

/**
 * Scan a directory for route files and build the route tree.
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

  const { routesDir } = mergedConfig;

  // Validate directory exists
  if (!existsSync(routesDir)) {
    throw new Error(`Routes directory does not exist: ${routesDir}`);
  }

  const stat = statSync(routesDir);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${routesDir}`);
  }

  // Initialize collections
  const allFiles: ScannedFile[] = [];
  const pages: ScannedFile[] = [];
  const layouts: ScannedFile[] = [];
  const loadings: ScannedFile[] = [];
  const errors: ScannedFile[] = [];
  const notFounds: ScannedFile[] = [];

  // Create root node
  const rootNode = createRouteNode("", "/", []);

  // Recursively scan
  scanDirectoryRecursive(
    routesDir,
    "",
    mergedConfig,
    allFiles,
    rootNode,
    warnings
  );

  // Categorize files
  for (const file of allFiles) {
    switch (file.parsed.fileType) {
      case "page":
        pages.push(file);
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
      case "not-found":
        notFounds.push(file);
        break;
    }
  }

  // Sort pages by priority (higher first)
  pages.sort((a, b) => b.priority - a.priority);

  // Associate special files with routes
  associateSpecialFiles(pages, layouts, loadings, errors, notFounds);

  const duration = performance.now() - startTime;

  return {
    files: allFiles,
    tree: rootNode,
    pages,
    layouts,
    loadings,
    errors,
    notFounds,
    duration,
    warnings,
  };
}

/**
 * Recursively scan a directory.
 */
function scanDirectoryRecursive(
  absoluteDir: string,
  relativePath: string,
  config: Required<Omit<ScannerConfig, "routesDir">> & { routesDir: string },
  allFiles: ScannedFile[],
  parentNode: RouteTreeNode,
  warnings: string[]
): void {
  let entries: string[];

  try {
    entries = readdirSync(absoluteDir);
  } catch (error) {
    warnings.push(`Could not read directory: ${absoluteDir}`);
    return;
  }

  // Separate files and directories
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
    };

    allFiles.push(scannedFile);
    addFileToNode(parentNode, scannedFile);
  }

  // Process directories
  for (const dir of directories) {
    const fullPath = join(absoluteDir, dir);
    const relPath = relativePath ? `${relativePath}/${dir}` : dir;

    // Check for parallel slot (@slot)
    if (dir.startsWith("@")) {
      if (!config.parallel) continue;

      const slotName = dir.slice(1);
      let slotNode = parentNode.slots.get(slotName);

      if (!slotNode) {
        const parsedSegment: ParsedSegment = {
          raw: dir,
          type: "parallel",
          slotName,
          inUrl: false,
        };
        slotNode = createRouteNode(dir, parentNode.urlPattern, [...parentNode.groups]);
        slotNode.parsedSegment = parsedSegment;
        parentNode.slots.set(slotName, slotNode);
      }

      scanDirectoryRecursive(fullPath, relPath, config, allFiles, slotNode, warnings);
      continue;
    }

    // Check for route group ((group))
    if (dir.startsWith("(") && dir.endsWith(")")) {
      if (!config.groups) continue;

      const groupName = dir.slice(1, -1);
      let groupNode = parentNode.children.get(dir);

      if (!groupNode) {
        const parsedSegment: ParsedSegment = {
          raw: dir,
          type: "group",
          groupName,
          inUrl: false,
        };
        groupNode = createRouteNode(dir, parentNode.urlPattern, [...parentNode.groups, groupName]);
        groupNode.parsedSegment = parsedSegment;
        parentNode.children.set(dir, groupNode);
      }

      scanDirectoryRecursive(fullPath, relPath, config, allFiles, groupNode, warnings);
      continue;
    }

    // Regular directory
    let childNode = parentNode.children.get(dir);

    if (!childNode) {
      const parsedSegment = parseSegment(dir);
      const urlSegment = segmentToUrlPattern(parsedSegment);
      const newUrlPattern =
        parentNode.urlPattern === "/"
          ? urlSegment ? `/${urlSegment}` : "/"
          : urlSegment
            ? `${parentNode.urlPattern}/${urlSegment}`
            : parentNode.urlPattern;

      childNode = createRouteNode(dir, newUrlPattern, [...parentNode.groups]);
      childNode.parsedSegment = parsedSegment;
      parentNode.children.set(dir, childNode);
    }

    scanDirectoryRecursive(fullPath, relPath, config, allFiles, childNode, warnings);
  }
}

/**
 * Create a new route tree node.
 */
function createRouteNode(
  segment: string,
  urlPattern: string,
  groups: string[]
): RouteTreeNode {
  return {
    segment,
    parsedSegment: {
      raw: segment,
      type: "static",
      inUrl: true,
    },
    urlPattern,
    children: new Map(),
    slots: new Map(),
    groups,
  };
}

/**
 * Add a scanned file to a route tree node.
 */
function addFileToNode(node: RouteTreeNode, file: ScannedFile): void {
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
    case "not-found":
      node.notFound = file;
      break;
  }
}

/**
 * Check if a file/directory should be ignored.
 */
function shouldIgnore(name: string, patterns: (string | RegExp)[]): boolean {
  // Always ignore underscore-prefixed directories (but not special files)
  if (name.startsWith("_") && !name.startsWith("_layout") &&
      !name.startsWith("_loading") && !name.startsWith("_error") &&
      !name.startsWith("_404") && !name.startsWith("_template") &&
      !name.startsWith("_default") && !name.startsWith("_middleware")) {
    return true;
  }

  // Always ignore hidden files
  if (name.startsWith(".")) {
    return true;
  }

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
 * Associate layouts, loading, and error files with page routes.
 */
function associateSpecialFiles(
  pages: ScannedFile[],
  layouts: ScannedFile[],
  loadings: ScannedFile[],
  errors: ScannedFile[],
  notFounds: ScannedFile[]
): void {
  for (const page of pages) {
    // Find applicable layouts (from root to page directory)
    const pageLayouts = findApplicableFiles(page, layouts);
    if (pageLayouts.length > 0) {
      // Store layout chain in page for later use
      (page as any).layouts = pageLayouts;
    }

    // Find applicable loading states
    const pageLoadings = findApplicableFiles(page, loadings);
    if (pageLoadings.length > 0) {
      (page as any).loadingFile = pageLoadings[pageLoadings.length - 1];
    }

    // Find applicable error boundaries
    const pageErrors = findApplicableFiles(page, errors);
    if (pageErrors.length > 0) {
      (page as any).errorFile = pageErrors[pageErrors.length - 1];
    }

    // Find applicable not found pages
    const pageNotFounds = findApplicableFiles(page, notFounds);
    if (pageNotFounds.length > 0) {
      (page as any).notFoundFile = pageNotFounds[pageNotFounds.length - 1];
    }
  }
}

/**
 * Find files that apply to a route (from root to route's directory).
 */
function findApplicableFiles(page: ScannedFile, files: ScannedFile[]): ScannedFile[] {
  const pageDir = dirname(page.relativePath).replace(/\\/g, "/");
  const pageParts = pageDir === "." ? [] : pageDir.split("/").filter(Boolean);
  const applicable: ScannedFile[] = [];

  // Check root level
  const rootFile = files.find((f) => {
    const dir = dirname(f.relativePath).replace(/\\/g, "/");
    return dir === "." || dir === "";
  });
  if (rootFile) {
    applicable.push(rootFile);
  }

  // Check each directory level
  let currentPath = "";
  for (const part of pageParts) {
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
 * Flatten the route tree to an array of page routes.
 */
export function flattenRouteTree(node: RouteTreeNode): ScannedFile[] {
  const pages: ScannedFile[] = [];

  if (node.page) {
    pages.push(node.page);
  }

  for (const child of node.children.values()) {
    pages.push(...flattenRouteTree(child));
  }

  for (const slot of node.slots.values()) {
    pages.push(...flattenRouteTree(slot));
  }

  return pages;
}

/**
 * Find a node by path in the route tree.
 */
export function findNodeByPath(tree: RouteTreeNode, path: string): RouteTreeNode | null {
  const segments = path.split("/").filter(Boolean);
  let current: RouteTreeNode | undefined = tree;

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
 * Get the layout chain for a route.
 */
export function getLayoutChain(tree: RouteTreeNode, path: string): ScannedFile[] {
  const layouts: ScannedFile[] = [];
  const segments = path.split("/").filter(Boolean);
  let current: RouteTreeNode | undefined = tree;

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
export function printRouteTree(node: RouteTreeNode, indent: string = ""): string {
  const lines: string[] = [];
  const segment = node.segment || "(root)";
  const files: string[] = [];

  if (node.page) files.push("page");
  if (node.layout) files.push("layout");
  if (node.loading) files.push("loading");
  if (node.error) files.push("error");
  if (node.notFound) files.push("404");

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
export function isRouteFileChange(
  filePath: string,
  routesDir: string,
  extensions: string[] = ROUTE_EXTENSIONS
): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const normalizedDir = routesDir.replace(/\\/g, "/");

  // Check if in routes directory
  if (!normalized.startsWith(normalizedDir)) {
    return false;
  }

  // Check extension
  const hasValidExt = extensions.some((ext) => normalized.endsWith(ext));
  if (!hasValidExt) {
    return false;
  }

  // Check if ignored
  if (shouldIgnoreSegment(basename(normalized))) {
    return false;
  }

  return true;
}

/**
 * Get affected routes when a file changes.
 */
export function getAffectedRoutes(
  filePath: string,
  tree: RouteTreeNode,
  routesDir: string
): ScannedFile[] {
  const normalized = filePath.replace(/\\/g, "/");
  const normalizedDir = routesDir.replace(/\\/g, "/");
  const relativePath = normalized.replace(normalizedDir + "/", "");
  const parsed = parseFilePath(relativePath);

  // If it's a page file, only that route is affected
  if (parsed.fileType === "page") {
    const node = findNodeByPath(tree, dirname(relativePath));
    if (node?.page) {
      return [node.page];
    }
    return [];
  }

  // If it's a layout, loading, or error file, all child routes are affected
  if (["layout", "loading", "error"].includes(parsed.fileType)) {
    const node = findNodeByPath(tree, dirname(relativePath));
    if (node) {
      return flattenRouteTree(node);
    }
  }

  return [];
}
