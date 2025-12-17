/**
 * PhilJS CLI - Code Generators
 *
 * Generate components, routes, pages, and more with best practices built-in.
 */
export interface GeneratorOptions {
    name: string;
    directory?: string;
    typescript?: boolean;
    withTest?: boolean;
    withStyles?: boolean;
}
/**
 * Component Generator
 */
export declare function generateComponent(options: GeneratorOptions): Promise<void>;
/**
 * Route Generator
 */
export declare function generateRoute(options: GeneratorOptions): Promise<void>;
/**
 * Page Generator
 */
export declare function generatePage(options: GeneratorOptions): Promise<void>;
/**
 * Hook Generator
 */
export declare function generateHook(options: GeneratorOptions): Promise<void>;
/**
 * Store Generator
 */
export declare function generateStore(options: GeneratorOptions): Promise<void>;
//# sourceMappingURL=generators.d.ts.map