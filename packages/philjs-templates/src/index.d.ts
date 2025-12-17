/**
 * PhilJS Templates
 *
 * Official starter templates for PhilJS applications.
 */
export interface Template {
    name: string;
    description: string;
    repo: string;
    tags: string[];
    features: string[];
    preview?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}
/**
 * Official PhilJS templates
 */
export declare const templates: Template[];
/**
 * Get all templates
 */
export declare function getTemplates(): Template[];
/**
 * Get template by name
 */
export declare function getTemplate(name: string): Template | undefined;
/**
 * Search templates
 */
export declare function searchTemplates(query: string): Template[];
/**
 * Get templates by tag
 */
export declare function getTemplatesByTag(tag: string): Template[];
/**
 * Get templates by difficulty
 */
export declare function getTemplatesByDifficulty(difficulty: Template['difficulty']): Template[];
/**
 * Get all unique tags
 */
export declare function getAllTags(): string[];
//# sourceMappingURL=index.d.ts.map