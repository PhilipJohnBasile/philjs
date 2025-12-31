/**
 * PhilJS Meta - Build System
 *
 * Implements build system with:
 * - Route manifest generation
 * - Code splitting per route
 * - Static page generation
 * - Bundle optimization
 */
import type { RouteManifest, RouteDefinition } from '../router/file-based';
import type { PhilJSConfig } from '../config';
/**
 * Build options
 */
export interface BuildOptions {
    /** Root directory of the project */
    rootDir: string;
    /** Output directory */
    outDir: string;
    /** Pages directory */
    pagesDir: string;
    /** Public assets directory */
    publicDir: string;
    /** Source directory */
    srcDir: string;
    /** Enable minification */
    minify: boolean;
    /** Enable source maps */
    sourcemap: boolean;
    /** Target environment */
    target: 'node' | 'browser' | 'neutral';
    /** SSR mode */
    ssr: boolean;
    /** Static generation mode */
    ssg: boolean;
    /** Environment variables to include */
    env: Record<string, string>;
    /** Custom esbuild plugins */
    plugins?: BuildPlugin[];
    /** Analyze bundle size */
    analyze?: boolean;
}
/**
 * Build plugin interface
 */
export interface BuildPlugin {
    name: string;
    setup(build: BuildContext): void | Promise<void>;
}
/**
 * Build context for plugins
 */
export interface BuildContext {
    options: BuildOptions;
    manifest: RouteManifest;
    onBuildStart(callback: () => void | Promise<void>): void;
    onBuildEnd(callback: (result: BuildResult) => void | Promise<void>): void;
    onRouteBundle(callback: (route: RouteDefinition, bundle: RouteBundle) => void | Promise<void>): void;
}
/**
 * Build result
 */
export interface BuildResult {
    /** Build success status */
    success: boolean;
    /** Build duration in milliseconds */
    duration: number;
    /** Generated bundles */
    bundles: BundleInfo[];
    /** Generated static pages */
    staticPages: StaticPageInfo[];
    /** Route manifest */
    manifest: RouteManifest;
    /** Errors if any */
    errors: BuildError[];
    /** Warnings */
    warnings: string[];
}
/**
 * Bundle information
 */
export interface BundleInfo {
    /** Bundle name */
    name: string;
    /** Output file path */
    path: string;
    /** Bundle size in bytes */
    size: number;
    /** Gzipped size in bytes */
    gzipSize: number;
    /** Entry points */
    entryPoints: string[];
    /** Dependencies */
    dependencies: string[];
    /** Is client bundle */
    isClient: boolean;
    /** Is server bundle */
    isServer: boolean;
}
/**
 * Route bundle
 */
export interface RouteBundle {
    /** Route pattern */
    pattern: string;
    /** Client bundle path */
    clientBundle: string;
    /** Server bundle path */
    serverBundle?: string;
    /** CSS bundle path */
    cssBundle?: string;
    /** Preload assets */
    preload: string[];
    /** Module ID */
    moduleId: string;
}
/**
 * Static page information
 */
export interface StaticPageInfo {
    /** Route pattern */
    pattern: string;
    /** Output HTML file path */
    htmlPath: string;
    /** Generation time */
    generatedAt: number;
    /** Page data used */
    data?: unknown;
}
/**
 * Build error
 */
export interface BuildError {
    message: string;
    file?: string;
    line?: number;
    column?: number;
    stack?: string;
}
/**
 * Compiler class
 */
export declare class Compiler {
    private options;
    private manifest;
    private plugins;
    private buildStartCallbacks;
    private buildEndCallbacks;
    private routeBundleCallbacks;
    constructor(options?: Partial<BuildOptions>);
    /**
     * Generate route manifest
     */
    generateManifest(): RouteManifest;
    /**
     * Write route manifest to disk
     */
    writeManifest(): void;
    /**
     * Build the application
     */
    build(): Promise<BuildResult>;
    /**
     * Build a single route
     */
    private buildRoute;
    /**
     * Build an API route
     */
    private buildApiRoute;
    /**
     * Generate static page
     */
    private generateStaticPage;
    /**
     * Copy public assets
     */
    private copyPublicAssets;
    /**
     * Generate client route map
     */
    private generateClientRouteMap;
    /**
     * Get route file name
     */
    private getRouteFileName;
    /**
     * Get module ID for route
     */
    private getModuleId;
    /**
     * Generate client bundle code
     */
    private generateClientBundle;
    /**
     * Generate server bundle code
     */
    private generateServerBundle;
    /**
     * Generate API bundle code
     */
    private generateApiBundle;
    /**
     * Generate static HTML
     */
    private generateStaticHtml;
}
/**
 * Create a compiler instance
 */
export declare function createCompiler(options?: Partial<BuildOptions>): Compiler;
/**
 * Create compiler from config
 */
export declare function createCompilerFromConfig(config: PhilJSConfig): Compiler;
/**
 * Bundle analyzer plugin
 */
export declare function analyzerPlugin(): BuildPlugin;
/**
 * Static export plugin
 */
export declare function staticExportPlugin(options?: StaticExportOptions): BuildPlugin;
export interface StaticExportOptions {
    routes?: string[];
    fallback?: boolean;
}
//# sourceMappingURL=compiler.d.ts.map