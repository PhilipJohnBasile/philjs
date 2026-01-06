/**
 * File-based routing conventions for PhilJS Router.
 * Follows Next.js/Nuxt-style file naming patterns.
 *
 * Supported conventions:
 * - page.tsx - Route component
 * - layout.tsx - Layout wrapper
 * - loading.tsx - Loading state
 * - error.tsx - Error boundary
 * - [param].tsx or [param]/page.tsx - Dynamic params
 * - [...slug].tsx - Catch-all routes
 * - [[...slug]].tsx - Optional catch-all routes
 * - (group)/ - Route groups (no URL segment)
 * - @slot/ - Parallel routes (slots)
 * - _components/ - Ignored folders (underscore prefix)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * File types recognized by the router.
 */
export type RouteFileType =
  | "page"
  | "layout"
  | "loading"
  | "error"
  | "template"
  | "default"
  | "route"
  | "middleware"
  | "not-found";

/**
 * Segment types in route paths.
 */
export type SegmentType =
  | "static"
  | "dynamic"
  | "catch-all"
  | "optional-catch-all"
  | "group"
  | "parallel"
  | "intercepting";

/**
 * Parsed segment information.
 */
export type ParsedSegment = {
  /** Original segment text */
  raw: string;
  /** Segment type */
  type: SegmentType;
  /** Parameter name (for dynamic segments) */
  param?: string;
  /** Group name (for route groups) */
  group?: string;
  /** Slot name (for parallel routes) */
  slot?: string;
  /** Whether this segment should be included in the URL */
  includeInUrl: boolean;
  /** Interception level (for intercepting routes) */
  interceptionLevel?: number;
};

/**
 * Parsed file path information.
 */
export type ParsedFilePath = {
  /** Original file path */
  filePath: string;
  /** File type */
  fileType: RouteFileType | null;
  /** Parsed segments */
  segments: ParsedSegment[];
  /** Generated URL pattern */
  urlPattern: string;
  /** Parameter names in order */
  params: string[];
  /** Route groups this file belongs to */
  groups: string[];
  /** Parallel slots this file belongs to */
  slots: string[];
  /** Whether this file should be ignored */
  ignored: boolean;
  /** Interception configuration if this is an intercepting route */
  interception?: {
    level: number;
    type: "(.)" | "(..)" | "(..)(..)" | "(...)";
  };
};

/**
 * Route configuration extracted from file exports.
 */
export type RouteConfig = {
  /** Route path pattern */
  path?: string;
  /** Whether to revalidate on navigation */
  revalidate?: number | false;
  /** Dynamic rendering mode */
  dynamic?: "auto" | "force-dynamic" | "force-static" | "error";
  /** Preferred region for execution */
  preferredRegion?: string | string[];
  /** Runtime environment */
  runtime?: "nodejs" | "edge";
  /** Maximum duration for server operations */
  maxDuration?: number;
  /** Custom metadata */
  [key: string]: unknown;
};

/**
 * Route metadata that can be exported from route files.
 */
export type RouteMetadata = {
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Open Graph metadata */
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
  };
  /** Custom metadata */
  [key: string]: unknown;
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Reserved file names and their types.
 */
export const RESERVED_FILE_NAMES: Record<string, RouteFileType> = {
  page: "page",
  layout: "layout",
  loading: "loading",
  error: "error",
  template: "template",
  default: "default",
  route: "route",
  middleware: "middleware",
  "not-found": "not-found",
};

/**
 * File extensions to consider as route files.
 */
export const ROUTE_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

/**
 * Patterns to ignore.
 */
export const IGNORE_PATTERNS = [
  /^_/, // Underscore prefix
  /^\./, // Hidden files/folders
  /\.test\.(tsx?|jsx?)$/, // Test files
  /\.spec\.(tsx?|jsx?)$/, // Spec files
  /\.d\.ts$/, // Type declarations
  /__tests__/, // Test directories
  /__mocks__/, // Mock directories
  /node_modules/, // Dependencies
];

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Check if a path segment should be ignored.
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
 * Parse a single path segment.
 */
export function parseSegment(segment: string): ParsedSegment {
  // Route group: (group-name)
  if (/^\([^)]+\)$/.test(segment)) {
    const group = segment.slice(1, -1);

    // Check for interception pattern
    if (group === ".") {
      return {
        raw: segment,
        type: "intercepting",
        includeInUrl: false,
        interceptionLevel: 0,
      };
    }
    if (group === "..") {
      return {
        raw: segment,
        type: "intercepting",
        includeInUrl: false,
        interceptionLevel: 1,
      };
    }
    if (group === "..(..)") {
      return {
        raw: segment,
        type: "intercepting",
        includeInUrl: false,
        interceptionLevel: 2,
      };
    }
    if (group === "...") {
      return {
        raw: segment,
        type: "intercepting",
        includeInUrl: false,
        interceptionLevel: Infinity,
      };
    }

    return {
      raw: segment,
      type: "group",
      group,
      includeInUrl: false,
    };
  }

  // Parallel slot: @slot-name
  if (segment.startsWith("@")) {
    return {
      raw: segment,
      type: "parallel",
      slot: segment.slice(1),
      includeInUrl: false,
    };
  }

  // Optional catch-all: [[...param]]
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(segment)) {
    const param = segment.slice(5, -2);
    return {
      raw: segment,
      type: "optional-catch-all",
      param,
      includeInUrl: true,
    };
  }

  // Catch-all: [...param]
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) {
    const param = segment.slice(4, -1);
    return {
      raw: segment,
      type: "catch-all",
      param,
      includeInUrl: true,
    };
  }

  // Dynamic segment: [param]
  if (/^\[[^\]]+\]$/.test(segment)) {
    const param = segment.slice(1, -1);
    return {
      raw: segment,
      type: "dynamic",
      param,
      includeInUrl: true,
    };
  }

  // Static segment
  return {
    raw: segment,
    type: "static",
    includeInUrl: true,
  };
}

/**
 * Get the file type from a file name.
 */
export function getFileType(fileName: string): RouteFileType | null {
  // Remove extension
  const baseName = fileName.replace(/\.(tsx?|jsx?|js)$/, "");

  // Check if it's a reserved file name
  if (baseName in RESERVED_FILE_NAMES) {
    return RESERVED_FILE_NAMES[baseName]!;
  }

  // Check for index files (treated as page)
  if (baseName === "index") {
    return "page";
  }

  return null;
}

/**
 * Parse a file path into route information.
 */
export function parseFilePath(filePath: string): ParsedFilePath {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Check if file should be ignored
  if (shouldIgnoreFile(normalizedPath)) {
    return {
      filePath,
      fileType: null,
      segments: [],
      urlPattern: "",
      params: [],
      groups: [],
      slots: [],
      ignored: true,
    };
  }

  // Split into directory and file name
  const parts = normalizedPath.split("/");
  const fileName = parts.pop() || "";
  const directoryPath = parts;

  // Get file type
  const fileType = getFileType(fileName);

  // Parse directory segments
  const segments: ParsedSegment[] = directoryPath
    .filter((segment) => segment !== "" && !shouldIgnoreSegment(segment))
    .map(parseSegment);

  // If this isn't a reserved file, treat the file name as a segment
  if (!fileType && fileName) {
    const baseFileName = fileName.replace(/\.(tsx?|jsx?|js)$/, "");
    if (baseFileName !== "index") {
      segments.push(parseSegment(baseFileName));
    }
  }

  // Extract information from segments
  const params: string[] = [];
  const groups: string[] = [];
  const slots: string[] = [];
  const urlParts: string[] = [];
  let interception: ParsedFilePath["interception"] | undefined;

  for (const segment of segments) {
    if (segment.param) {
      params.push(segment.param);
    }
    if (segment.group) {
      groups.push(segment.group);
    }
    if (segment.slot) {
      slots.push(segment.slot);
    }
    if (segment.type === "intercepting" && segment.interceptionLevel !== undefined) {
      const level = segment.interceptionLevel;
      interception = {
        level,
        type:
          level === 0
            ? "(.)"
            : level === 1
              ? "(..)"
              : level === 2
                ? "(..)(..)"
                : "(...)",
      };
    }

    // Build URL pattern
    if (segment.includeInUrl) {
      switch (segment.type) {
        case "dynamic":
          urlParts.push(`:${segment.param}`);
          break;
        case "catch-all":
          urlParts.push(`*${segment.param}`);
          break;
        case "optional-catch-all":
          urlParts.push(`*${segment.param}?`);
          break;
        case "static":
          urlParts.push(segment.raw);
          break;
      }
    }
  }

  const urlPattern = "/" + urlParts.join("/");

  return {
    filePath,
    fileType,
    segments,
    urlPattern: urlPattern === "/" ? "/" : urlPattern.replace(/\/$/, ""),
    params,
    groups,
    slots,
    ignored: false,
    interception,
  };
}

// ============================================================================
// URL Pattern Utilities
// ============================================================================

/**
 * Convert a URL pattern to a regex.
 */
export function patternToRegex(pattern: string): RegExp {
  let regexPattern = pattern
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

      // Static segment
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  // Handle optional catch-all at end
  if (pattern.endsWith("?")) {
    regexPattern = regexPattern.replace(/\(\.\*\)\?$/, "(?:/(.*))?");
  }

  return new RegExp("^" + regexPattern + "$");
}

/**
 * Extract parameters from a URL using a pattern.
 */
export function extractParams(
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
 * Calculate route priority for matching order.
 * Higher priority = matched first.
 */
export function calculateRoutePriority(segments: ParsedSegment[]): number {
  let priority = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const positionWeight = (segments.length - i) * 10;

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

  return priority;
}

// ============================================================================
// Route Configuration Utilities
// ============================================================================

/**
 * Merge route configurations.
 */
export function mergeRouteConfig(
  base: RouteConfig,
  override: RouteConfig
): RouteConfig {
  return {
    ...base,
    ...override,
  };
}

/**
 * Validate route configuration.
 */
export function validateRouteConfig(config: RouteConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.revalidate !== undefined) {
    if (typeof config.revalidate !== "number" && config.revalidate !== false) {
      errors.push("revalidate must be a number or false");
    }
    if (typeof config.revalidate === "number" && config.revalidate < 0) {
      errors.push("revalidate must be a non-negative number");
    }
  }

  if (config.dynamic !== undefined) {
    const validDynamic = ["auto", "force-dynamic", "force-static", "error"];
    if (!validDynamic.includes(config.dynamic)) {
      errors.push(`dynamic must be one of: ${validDynamic.join(", ")}`);
    }
  }

  if (config.runtime !== undefined) {
    const validRuntime = ["nodejs", "edge"];
    if (!validRuntime.includes(config.runtime)) {
      errors.push(`runtime must be one of: ${validRuntime.join(", ")}`);
    }
  }

  if (config.maxDuration !== undefined) {
    if (typeof config.maxDuration !== "number" || config.maxDuration <= 0) {
      errors.push("maxDuration must be a positive number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Path Generation
// ============================================================================

/**
 * Generate a URL path from a pattern and parameters.
 */
export function generatePath(
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
// File Path Utilities
// ============================================================================

/**
 * Get the relative route path from a file path.
 * Removes the base routes directory and converts to URL pattern.
 */
export function getRoutePathFromFile(
  filePath: string,
  baseDir: string
): string {
  // Normalize paths
  const normalizedFile = filePath.replace(/\\/g, "/");
  const normalizedBase = baseDir.replace(/\\/g, "/").replace(/\/$/, "");

  // Remove base directory
  let relativePath = normalizedFile;
  if (relativePath.startsWith(normalizedBase)) {
    relativePath = relativePath.slice(normalizedBase.length);
  }

  // Parse and return URL pattern
  const parsed = parseFilePath(relativePath);
  return parsed.urlPattern;
}

/**
 * Check if a file is a valid route file based on extension.
 */
export function isRouteFile(fileName: string): boolean {
  return ROUTE_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

/**
 * Get the route ID from a file path.
 * Used for unique identification and data loading.
 */
export function getRouteId(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/\.(tsx?|jsx?|js)$/, "")
    .replace(/\/page$/, "")
    .replace(/\/index$/, "")
    .replace(/^\//, "")
    .replace(/\//g, ":");
}
