/**
 * Content path detection for Tailwind CSS
 * Automatically detects content paths based on project structure
 */

import * as fs from "fs/promises";
import * as path from "path";

/**
 * Content detection options
 */
export interface ContentDetectorOptions {
  /** Root directory to scan */
  rootDir: string;
  /** Additional patterns to include */
  include?: string[];
  /** Patterns to exclude */
  exclude?: string[];
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Detected content info
 */
export interface DetectedContent {
  /** Content patterns found */
  patterns: string[];
  /** Directories scanned */
  directories: string[];
  /** Framework detected */
  framework?: "react" | "vue" | "svelte" | "solid" | "preact";
}

/**
 * Content detector class
 */
export class ContentDetector {
  private rootDir: string;
  private include: string[];
  private exclude: string[];
  private verbose: boolean;

  constructor(options: ContentDetectorOptions) {
    this.rootDir = options.rootDir;
    this.include = options.include || [];
    this.exclude = options.exclude || ["node_modules", "dist", "build", ".git"];
    this.verbose = options.verbose || false;
  }

  /**
   * Detect content paths
   */
  async detect(): Promise<DetectedContent> {
    const directories: string[] = [];
    const patterns: string[] = [];

    // Common directory names to check
    const commonDirs = [
      "src",
      "app",
      "pages",
      "components",
      "lib",
      "layouts",
      "routes",
      "views",
    ];

    // Check which directories exist
    for (const dir of commonDirs) {
      const fullPath = path.join(this.rootDir, dir);
      if (await this.exists(fullPath)) {
        directories.push(dir);
        this.log(`Found directory: ${dir}`);
      }
    }

    // Detect framework
    const framework = await this.detectFramework();
    this.log(`Detected framework: ${framework || "none"}`);

    // Generate patterns based on detected directories and framework
    const extensions = this.getExtensions(framework);

    for (const dir of directories) {
      patterns.push(`./${dir}/**/*.{${extensions.join(",")}}`);
    }

    // Include root HTML files
    const rootFiles = await this.getRootFiles();
    patterns.push(...rootFiles);

    // Add custom includes
    patterns.push(...this.include);

    // Remove duplicates
    const uniquePatterns = [...new Set(patterns)];

    return {
      patterns: uniquePatterns,
      directories,
      framework,
    };
  }

  /**
   * Detect framework from package.json
   */
  private async detectFramework(): Promise<DetectedContent["framework"]> {
    try {
      const pkgPath = path.join(this.rootDir, "package.json");
      const content = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);

      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      if (deps.react || deps["react-dom"]) return "react";
      if (deps.vue || deps["@vue/runtime-core"]) return "vue";
      if (deps.svelte) return "svelte";
      if (deps["solid-js"]) return "solid";
      if (deps.preact) return "preact";
    } catch {
      // package.json not found or invalid
    }

    return undefined;
  }

  /**
   * Get file extensions based on framework
   */
  private getExtensions(framework?: DetectedContent["framework"]): string[] {
    const base = ["html", "js", "ts", "jsx", "tsx"];

    switch (framework) {
      case "vue":
        return [...base, "vue"];
      case "svelte":
        return [...base, "svelte"];
      default:
        return base;
    }
  }

  /**
   * Get root HTML/template files
   */
  private async getRootFiles(): Promise<string[]> {
    const patterns: string[] = [];
    const rootFiles = ["index.html", "app.html", "template.html"];

    for (const file of rootFiles) {
      const fullPath = path.join(this.rootDir, file);
      if (await this.exists(fullPath)) {
        patterns.push(`./${file}`);
        this.log(`Found root file: ${file}`);
      }
    }

    return patterns;
  }

  /**
   * Check if path exists
   */
  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Log message if verbose
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[ContentDetector] ${message}`);
    }
  }
}

/**
 * Quick content detection function
 */
export async function detectContentPaths(
  rootDir: string,
  options?: Partial<ContentDetectorOptions>
): Promise<string[]> {
  const detector = new ContentDetector({
    rootDir,
    ...options,
  });

  const result = await detector.detect();
  return result.patterns;
}

/**
 * Validate content patterns
 */
export function validateContentPatterns(patterns: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const pattern of patterns) {
    if (isValidGlobPattern(pattern)) {
      valid.push(pattern);
    } else {
      invalid.push(pattern);
    }
  }

  return { valid, invalid };
}

/**
 * Check if glob pattern is valid
 */
function isValidGlobPattern(pattern: string): boolean {
  // Basic validation
  if (!pattern || typeof pattern !== "string") return false;

  // Check for invalid characters
  const invalidChars = /[<>:"|?]/;
  if (invalidChars.test(pattern)) return false;

  // Must have some path component
  if (pattern.trim().length === 0) return false;

  return true;
}

/**
 * Expand content patterns with common variations
 */
export function expandContentPatterns(patterns: string[]): string[] {
  const expanded: string[] = [...patterns];

  for (const pattern of patterns) {
    // If pattern is a directory, add common file patterns
    if (!pattern.includes("*") && !pattern.includes(".")) {
      expanded.push(`${pattern}/**/*.{js,jsx,ts,tsx,html}`);
    }
  }

  return [...new Set(expanded)];
}

/**
 * Optimize content patterns
 * Removes redundant patterns
 */
export function optimizeContentPatterns(patterns: string[]): string[] {
  const optimized: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    // Normalize pattern
    const normalized = pattern.replace(/\\/g, "/");

    // Skip if we've seen this pattern
    if (seen.has(normalized)) continue;

    // Check if this pattern is covered by a broader pattern
    const isCovered = optimized.some((existing) => {
      if (existing.includes("**") && normalized.startsWith(existing.split("**")[0])) {
        return true;
      }
      return false;
    });

    if (!isCovered) {
      optimized.push(normalized);
      seen.add(normalized);
    }
  }

  return optimized;
}
