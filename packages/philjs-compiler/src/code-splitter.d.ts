/**
 * PhilJS Compiler - Automatic Code Splitting
 * Analyzes routes and creates optimal code splitting boundaries
 */
import type { CompilerConfig } from './types.js';
export interface CodeSplitBoundary {
    /** Route path */
    route: string;
    /** Component file path */
    filePath: string;
    /** Import statement to add */
    lazyImport: string;
    /** Estimated component size (lines of code) */
    estimatedSize: number;
    /** Dependencies this component needs */
    dependencies: string[];
    /** Priority (for preloading) */
    priority: 'high' | 'medium' | 'low';
}
export interface CodeSplitReport {
    boundaries: CodeSplitBoundary[];
    totalChunks: number;
    estimatedSavings: number;
    recommendations: string[];
}
export declare class CodeSplitter {
    private config;
    constructor(config?: CompilerConfig);
    /**
     * Analyze a routes directory and determine splitting boundaries
     */
    analyzeRoutes(routesDir: string, files: Map<string, string>): CodeSplitReport;
    /**
     * Analyze a single route component
     */
    private analyzeRouteComponent;
    /**
     * Determine if a route should be code-split
     */
    private shouldSplit;
    /**
     * Calculate priority for preloading
     */
    private calculatePriority;
    /**
     * Generate a lazy import statement
     */
    private generateLazyImport;
    /**
     * Convert route to component name
     */
    private routeToComponentName;
    /**
     * Convert file path to route
     */
    private filePathToRoute;
    /**
     * Check if file is a route file
     */
    private isRouteFile;
    /**
     * Calculate estimated bundle size savings
     */
    private calculateEstimatedSavings;
    /**
     * Generate rollup/vite manual chunks configuration
     */
    static generateManualChunks(boundaries: CodeSplitBoundary[]): Record<string, string[]>;
    /**
     * Generate vite dynamic import optimization
     */
    static generateViteDynamicImports(boundaries: CodeSplitBoundary[]): string[];
}
/**
 * Create a new code splitter instance
 */
export declare const createCodeSplitter: (config?: CompilerConfig) => CodeSplitter;
//# sourceMappingURL=code-splitter.d.ts.map