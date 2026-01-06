/**
 * File name parser for PhilJS File-based Router.
 *
 * Converts file system paths to URL patterns following Next.js/Nuxt conventions:
 * - [id].tsx -> /users/:id
 * - [...slug].tsx -> /docs/*slug
 * - [[...slug]].tsx -> /docs/*slug? (optional)
 * - (group)/ -> route group (no URL segment)
 * - @slot/ -> parallel route slot
 * - _layout.tsx -> layout wrapper
 * - _loading.tsx -> loading state
 * - _error.tsx -> error boundary
 * - _404.tsx -> not found page
 */

import type {
  ParsedSegment,
  ParsedFilePath,
  SpecialFileType,
  SegmentType,
} from "./types.js";

// ============================================================================
// Constants
// ============================================================================

/**
 * File extensions recognized as route files.
 */
export const ROUTE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

/**
 * Special file names and their types.
 */
export const SPECIAL_FILES: Record<string, SpecialFileType> = {
  index: "page",
  page: "page",
  "_layout": "layout",
  layout: "layout",
  "_loading": "loading",
  loading: "loading",
  "_error": "error",
  error: "error",
  "_404": "not-found",
  "not-found": "not-found",
  "_template": "template",
  template: "template",
  "_default": "default",
  default: "default",
  "_middleware": "middleware",
  middleware: "middleware",
  route: "route",
};

/**
 * Patterns to ignore.
 */
export const IGNORE_PATTERNS: RegExp[] = [
  /^_(?!layout|loading|error|404|template|default|middleware)/, // Underscore prefix (except special files)
  /^\./,                          // Hidden files
  /\.test\.[tj]sx?$/,            // Test files
  /\.spec\.[tj]sx?$/,            // Spec files
  /\.d\.ts$/,                    // Type declarations
  /__tests__/,                   // Test directories
  /__mocks__/,                   // Mock directories
  /node_modules/,                // Dependencies
  /\.stories\.[tj]sx?$/,         // Storybook files
];

// ============================================================================
// Segment Parsing
// ============================================================================

/**
 * Parse a single path segment into structured information.
 */
export function parseSegment(segment: string): ParsedSegment {
  // Route group: (group-name)
  if (/^\([^)]+\)$/.test(segment)) {
    const groupName = segment.slice(1, -1);
    return {
      raw: segment,
      type: "group",
      groupName,
      inUrl: false,
    };
  }

  // Parallel slot: @slot-name
  if (segment.startsWith("@")) {
    const slotName = segment.slice(1);
    return {
      raw: segment,
      type: "parallel",
      slotName,
      inUrl: false,
    };
  }

  // Optional catch-all: [[...param]]
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(segment)) {
    const paramName = segment.slice(5, -2);
    return {
      raw: segment,
      type: "optional-catch-all",
      paramName,
      inUrl: true,
    };
  }

  // Catch-all: [...param]
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) {
    const paramName = segment.slice(4, -1);
    return {
      raw: segment,
      type: "catch-all",
      paramName,
      inUrl: true,
    };
  }

  // Dynamic segment: [param]
  if (/^\[[^\]]+\]$/.test(segment)) {
    const paramName = segment.slice(1, -1);
    return {
      raw: segment,
      type: "dynamic",
      paramName,
      inUrl: true,
    };
  }

  // Static segment
  return {
    raw: segment,
    type: "static",
    inUrl: true,
  };
}

/**
 * Convert a parsed segment to its URL pattern equivalent.
 */
export function segmentToUrlPattern(segment: ParsedSegment): string {
  switch (segment.type) {
    case "dynamic":
      return `:${segment.paramName}`;
    case "catch-all":
      return `*${segment.paramName}`;
    case "optional-catch-all":
      return `*${segment.paramName}?`;
    case "static":
      return segment.raw;
    case "group":
    case "parallel":
      return ""; // Not included in URL
    default:
      return segment.raw;
  }
}

// ============================================================================
// File Type Detection
// ============================================================================

/**
 * Get the file type from a file name.
 */
export function getFileType(fileName: string): SpecialFileType | "component" {
  // Remove extension
  const baseName = fileName.replace(/\.[tj]sx?$/, "");

  // Check for special files
  if (baseName in SPECIAL_FILES) {
    return SPECIAL_FILES[baseName]!;
  }

  // Regular component file
  return "component";
}

/**
 * Check if a segment should be ignored.
 */
export function shouldIgnoreSegment(segment: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => pattern.test(segment));
}

/**
 * Check if a file should be ignored.
 */
export function shouldIgnoreFile(filePath: string): boolean {
  const segments = filePath.split(/[/\\]/);
  return segments.some((segment) => shouldIgnoreSegment(segment));
}

/**
 * Check if a file is a valid route file.
 */
export function isRouteFile(fileName: string): boolean {
  return ROUTE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

// ============================================================================
// File Path Parsing
// ============================================================================

/**
 * Parse a complete file path into route information.
 */
export function parseFilePath(filePath: string): ParsedFilePath {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Check if file should be ignored
  if (shouldIgnoreFile(normalizedPath)) {
    return {
      filePath,
      fileType: "component",
      segments: [],
      urlPattern: "",
      params: [],
      groups: [],
      slots: [],
      ignored: true,
    };
  }

  // Split path into directory and file
  const parts = normalizedPath.split("/");
  const fileName = parts.pop() || "";
  const directorySegments = parts.filter((p) => p !== "");

  // Get file type
  const fileType = getFileType(fileName);

  // Parse directory segments
  const segments: ParsedSegment[] = [];
  for (const seg of directorySegments) {
    if (!shouldIgnoreSegment(seg)) {
      segments.push(parseSegment(seg));
    }
  }

  // If this is a regular component (not a special file), add file name as segment
  if (fileType === "component" && fileName) {
    const baseName = fileName.replace(/\.[tj]sx?$/, "");
    if (baseName !== "index") {
      segments.push(parseSegment(baseName));
    }
  }

  // Extract params, groups, slots
  const params: string[] = [];
  const groups: string[] = [];
  const slots: string[] = [];
  const urlParts: string[] = [];

  for (const segment of segments) {
    // Collect params
    if (segment.paramName) {
      params.push(segment.paramName);
    }

    // Collect groups
    if (segment.groupName) {
      groups.push(segment.groupName);
    }

    // Collect slots
    if (segment.slotName) {
      slots.push(segment.slotName);
    }

    // Build URL pattern
    if (segment.inUrl) {
      const urlPart = segmentToUrlPattern(segment);
      if (urlPart) {
        urlParts.push(urlPart);
      }
    }
  }

  // Construct final URL pattern
  let urlPattern = "/" + urlParts.join("/");
  if (urlPattern !== "/" && urlPattern.endsWith("/")) {
    urlPattern = urlPattern.slice(0, -1);
  }

  return {
    filePath,
    fileType,
    segments,
    urlPattern,
    params,
    groups,
    slots,
    ignored: false,
  };
}

// ============================================================================
// URL Pattern Utilities
// ============================================================================

/**
 * Convert a URL pattern to a regular expression.
 */
export function patternToRegex(pattern: string): RegExp {
  const regexParts = pattern
    .split("/")
    .map((segment) => {
      if (segment === "") return "";

      // Optional catch-all: *param?
      if (segment.endsWith("?") && segment.startsWith("*")) {
        return "(.*)?";
      }

      // Catch-all: *param
      if (segment.startsWith("*")) {
        return "(.+)";
      }

      // Dynamic segment: :param
      if (segment.startsWith(":")) {
        return "([^/]+)";
      }

      // Escape special regex characters for static segments
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  // Handle optional trailing parts
  let finalPattern = regexParts;
  if (pattern.endsWith("?")) {
    finalPattern = finalPattern.replace(/\(\.\*\)\?$/, "(?:/(.*))?");
  }

  return new RegExp("^" + finalPattern + "$");
}

/**
 * Extract parameters from a URL using a pattern.
 */
export function extractParamsFromUrl(
  url: string,
  pattern: string,
  paramNames: string[]
): Record<string, string> | null {
  const regex = patternToRegex(pattern);
  const match = url.match(regex);

  if (!match) {
    return null;
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    const value = match[index + 1];
    if (value !== undefined) {
      params[name] = decodeURIComponent(value);
    }
  });

  return params;
}

/**
 * Generate a URL from a pattern and parameters.
 */
export function generateUrl(
  pattern: string,
  params: Record<string, string | string[]> = {}
): string {
  return pattern
    .split("/")
    .map((segment) => {
      // Optional catch-all
      if (segment.endsWith("?") && segment.startsWith("*")) {
        const paramName = segment.slice(1, -1);
        const value = params[paramName];
        if (value === undefined) return "";
        return Array.isArray(value) ? value.join("/") : value;
      }

      // Catch-all
      if (segment.startsWith("*")) {
        const paramName = segment.slice(1);
        const value = params[paramName];
        if (value === undefined) return segment;
        return Array.isArray(value) ? value.join("/") : value;
      }

      // Dynamic segment
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1);
        const value = params[paramName];
        if (value === undefined) return segment;
        return encodeURIComponent(String(value));
      }

      return segment;
    })
    .filter((segment) => segment !== "")
    .join("/")
    .replace(/^(?!\/)/, "/");
}

// ============================================================================
// Priority Calculation
// ============================================================================

/**
 * Calculate route priority for matching order.
 * Higher priority = matched first.
 *
 * Priority rules:
 * 1. Static segments have highest priority
 * 2. Dynamic segments have medium priority
 * 3. Catch-all segments have lowest priority
 * 4. More specific routes (more segments) are prioritized
 */
export function calculateRoutePriority(segments: ParsedSegment[]): number {
  let priority = 0;
  const segmentCount = segments.length;

  for (let i = 0; i < segmentCount; i++) {
    const segment = segments[i]!;
    // Position weight: earlier segments matter more
    const positionWeight = (segmentCount - i) * 10;

    switch (segment.type) {
      case "static":
        priority += 1000 + positionWeight;
        break;
      case "dynamic":
        priority += 100 + positionWeight;
        break;
      case "catch-all":
        priority += 10;
        break;
      case "optional-catch-all":
        priority += 1;
        break;
      case "group":
      case "parallel":
        // Groups and slots don't affect priority
        break;
    }
  }

  // Bonus for more segments (more specific routes)
  priority += segmentCount * 5;

  return priority;
}

/**
 * Generate a route ID from a file path.
 */
export function getRouteId(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/\.[tj]sx?$/, "")
    .replace(/\/page$/, "")
    .replace(/\/index$/, "")
    .replace(/^\//, "")
    .replace(/\//g, ":")
    || "root";
}

/**
 * Compare two routes for sorting (higher priority first).
 */
export function compareRoutes(a: { priority: number }, b: { priority: number }): number {
  return b.priority - a.priority;
}
