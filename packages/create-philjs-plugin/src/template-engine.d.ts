/**
 * Template engine for plugin generation
 */
export interface TemplateContext {
    [key: string]: string | number | boolean | undefined;
}
export interface GeneratorContext {
    pluginName: string;
    pascalName: string;
    camelName: string;
    kebabName: string;
    description?: string;
    author?: string;
    license?: string;
    typescript: boolean;
    testing: boolean;
    features: string[];
    type: TemplateType;
}
/**
 * Simple template engine
 */
export declare function renderTemplate(template: string, context: TemplateContext): string;
export declare function toPascalCase(input: string): string;
export declare function toCamelCase(input: string): string;
export declare function toKebabCase(input: string): string;
export declare function createContext(pluginName: string, options?: Partial<GeneratorContext>): GeneratorContext;
export declare function generateImports(features: string[], typescript: boolean): string;
export declare function generateConfigInterface(context: GeneratorContext): string;
export declare function generateTestTemplate(context: GeneratorContext): string;
/**
 * Parse a template file
 */
export declare function parseTemplate(content: string): {
    frontmatter: Record<string, string>;
    body: string;
};
/**
 * Available template types
 */
export type TemplateType = 'basic' | 'vite' | 'full' | 'minimal';
/**
 * Template registry
 */
export declare const templates: Record<TemplateType, string>;
/**
 * Get template by type
 */
export declare function getTemplate(type: TemplateType): string;
//# sourceMappingURL=template-engine.d.ts.map