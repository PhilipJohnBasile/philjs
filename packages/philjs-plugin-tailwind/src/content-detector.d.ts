/**
 * Content path detection for Tailwind CSS
 * Automatically detects content paths based on project structure
 */
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
export declare class ContentDetector {
    private rootDir;
    private include;
    private exclude;
    private verbose;
    constructor(options: ContentDetectorOptions);
    /**
     * Detect content paths
     */
    detect(): Promise<DetectedContent>;
    /**
     * Detect framework from package.json
     */
    private detectFramework;
    /**
     * Get file extensions based on framework
     */
    private getExtensions;
    /**
     * Get root HTML/template files
     */
    private getRootFiles;
    /**
     * Check if path exists
     */
    private exists;
    /**
     * Log message if verbose
     */
    private log;
}
/**
 * Quick content detection function
 */
export declare function detectContentPaths(rootDir: string, options?: Partial<ContentDetectorOptions>): Promise<string[]>;
/**
 * Validate content patterns
 */
export declare function validateContentPatterns(patterns: string[]): {
    valid: string[];
    invalid: string[];
};
/**
 * Expand content patterns with common variations
 */
export declare function expandContentPatterns(patterns: string[]): string[];
/**
 * Optimize content patterns
 * Removes redundant patterns
 */
export declare function optimizeContentPatterns(patterns: string[]): string[];
//# sourceMappingURL=content-detector.d.ts.map