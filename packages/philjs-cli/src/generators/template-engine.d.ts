/**
 * PhilJS CLI - Template Engine
 *
 * Simple Handlebars-like template engine for code generation
 */
export interface TemplateContext {
    name: string;
    pascalName: string;
    camelName: string;
    kebabName: string;
    typescript: boolean;
    withTest: boolean;
    withStyles: boolean;
    styleType?: 'css-modules' | 'tailwind' | 'styled' | 'none';
    [key: string]: unknown;
}
/**
 * Simple template engine with Handlebars-like syntax
 */
export declare function renderTemplate(template: string, context: TemplateContext): string;
/**
 * Load a template file from the templates directory
 */
export declare function loadTemplate(generator: string, templateName: string): Promise<string>;
/**
 * Check if templates directory exists
 */
export declare function templatesExist(): Promise<boolean>;
/**
 * String transformation helpers
 */
export declare function toPascalCase(str: string): string;
export declare function toCamelCase(str: string): string;
export declare function toKebabCase(str: string): string;
export declare function toSnakeCase(str: string): string;
/**
 * Create template context with common transformations
 */
export declare function createContext(name: string, options?: Partial<TemplateContext>): TemplateContext;
/**
 * Extract route parameters from a path
 * e.g., "users/[id]" -> ["id"]
 */
export declare function extractRouteParams(routePath: string): string[];
/**
 * Check if a route path is dynamic
 */
export declare function isDynamicRoute(routePath: string): boolean;
//# sourceMappingURL=template-engine.d.ts.map