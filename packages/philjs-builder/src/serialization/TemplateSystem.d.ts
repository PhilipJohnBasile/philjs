/**
 * Template System - Save and load design templates
 */
import { signal } from 'philjs-core';
import type { ComponentNode, NodeId } from '../types.js';
export interface Template {
    id: string;
    name: string;
    description?: string;
    category: string;
    thumbnail?: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    author?: string;
    tags: string[];
    nodes: Record<NodeId, ComponentNode>;
    rootId: NodeId;
    metadata?: Record<string, any>;
}
export interface TemplateCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}
export interface TemplateManagerOptions {
    storage?: 'localStorage' | 'indexedDB' | 'none';
    storageKey?: string;
    onSave?: (template: Template) => void | Promise<void>;
    onLoad?: (template: Template) => void;
    onDelete?: (templateId: string) => void;
}
export interface TemplateManager {
    templates: ReturnType<typeof signal<Template[]>>;
    categories: ReturnType<typeof signal<TemplateCategory[]>>;
    saveTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<Template>;
    loadTemplate: (templateId: string) => Template | undefined;
    deleteTemplate: (templateId: string) => void;
    updateTemplate: (templateId: string, updates: Partial<Template>) => Template | undefined;
    duplicateTemplate: (templateId: string, newName?: string) => Template | undefined;
    exportTemplate: (templateId: string) => string;
    importTemplate: (json: string) => Template | undefined;
    getTemplatesByCategory: (categoryId: string) => Template[];
    searchTemplates: (query: string) => Template[];
    addCategory: (category: TemplateCategory) => void;
    removeCategory: (categoryId: string) => void;
    clearAllTemplates: () => void;
}
export declare const defaultCategories: TemplateCategory[];
export declare const builtInTemplates: Template[];
/**
 * Create a template manager
 */
export declare function createTemplateManager(options?: TemplateManagerOptions): TemplateManager;
/**
 * Apply a template to create nodes
 */
export declare function applyTemplate(template: Template, parentId?: NodeId | null): {
    nodes: Record<NodeId, ComponentNode>;
    rootId: NodeId;
};
declare const _default: {
    createTemplateManager: typeof createTemplateManager;
    applyTemplate: typeof applyTemplate;
    defaultCategories: TemplateCategory[];
    builtInTemplates: Template[];
};
export default _default;
//# sourceMappingURL=TemplateSystem.d.ts.map