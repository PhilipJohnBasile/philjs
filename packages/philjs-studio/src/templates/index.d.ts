import type { StudioSchema } from '../serialization/export.js';
export interface Template {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    thumbnail?: string;
    schema: StudioSchema;
}
export type TemplateCategory = 'landing' | 'dashboard' | 'form' | 'blog' | 'ecommerce' | 'custom';
export declare const templates: Template[];
export declare const getTemplateById: (id: string) => Template | undefined;
export declare const getTemplatesByCategory: (category: TemplateCategory) => Template[];
export declare const cloneTemplateSchema: (template: Template) => StudioSchema;
export default templates;
//# sourceMappingURL=index.d.ts.map