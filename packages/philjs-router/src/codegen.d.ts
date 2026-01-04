/**
 * Code generation for file-based routes
 *
 * Generates TypeScript types and route manifest from file structure
 */
import type { RoutePattern } from './discovery.js';
export interface CodegenOptions {
    /**
     * Routes directory
     */
    routesDir: string;
    /**
     * Output file for generated types
     */
    outputFile?: string;
    /**
     * Generate route manifest
     */
    generateManifest?: boolean;
    /**
     * Watch mode for development
     */
    watch?: boolean;
}
export interface GeneratedRoute {
    path: string;
    pattern: string;
    params: string[];
    component: string;
    loader?: string;
    action?: string;
}
/**
 * Generate TypeScript types from route files
 */
export declare function generateRouteTypes(options: CodegenOptions): Promise<string>;
/**
 * Generate route manifest JSON
 */
export declare function generateRouteManifest(options: CodegenOptions): Promise<GeneratedRoute[]>;
/**
 * Generate runtime route matcher
 */
export declare function generateRouteMatcher(routes: RoutePattern[]): string;
/**
 * Watch routes directory and regenerate types on changes
 */
export declare function watchRoutes(options: CodegenOptions): Promise<() => void>;
/**
 * CLI command to generate route types
 */
export declare function codegenCommand(args: string[]): Promise<void>;
//# sourceMappingURL=codegen.d.ts.map