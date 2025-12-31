/**
 * PhilJS Rocket Templates
 *
 * Template integration for PhilJS with Rocket.
 * Supports Tera, Handlebars, and PhilJS component templates.
 */
import type { TemplateContext, TemplateHelper } from './types.js';
/**
 * Template engine type
 */
export type TemplateEngineType = 'tera' | 'handlebars' | 'philjs';
/**
 * Template engine configuration
 */
export interface TemplateEngineConfig {
    /** Engine type */
    engine: TemplateEngineType;
    /** Template directory */
    templateDir: string;
    /** File extension */
    extension: string;
    /** Enable caching */
    cache: boolean;
    /** Auto reload in development */
    autoReload: boolean;
    /** Custom helpers */
    helpers: Map<string, TemplateHelper>;
    /** Global context data */
    globals: Record<string, unknown>;
}
/**
 * PhilJS Template Engine
 */
export declare class TemplateEngine {
    private config;
    private templates;
    constructor(options?: Partial<TemplateEngineConfig>);
    /**
     * Register built-in template helpers
     */
    private registerBuiltinHelpers;
    /**
     * Register a custom helper
     */
    registerHelper(name: string, helper: TemplateHelper): this;
    /**
     * Set global context data
     */
    setGlobal(key: string, value: unknown): this;
    /**
     * Render a template
     */
    render(templateName: string, context: TemplateContext): string;
    /**
     * Internal template rendering
     */
    private renderTemplate;
    /**
     * Get default template for a name
     */
    private getDefaultTemplate;
    /**
     * Process template variables
     */
    private processTemplate;
    /**
     * Generate Rust template code
     */
    toRustCode(): string;
}
/**
 * Layout configuration
 */
export interface LayoutConfig {
    /** Layout name */
    name: string;
    /** Header template */
    header?: string;
    /** Footer template */
    footer?: string;
    /** Sidebar template */
    sidebar?: string;
    /** Navigation template */
    navigation?: string;
}
/**
 * Layout builder for composing page layouts
 */
export declare class LayoutBuilder {
    private layouts;
    private defaultLayout;
    /**
     * Register a layout
     */
    register(config: LayoutConfig): this;
    /**
     * Set default layout
     */
    setDefault(name: string): this;
    /**
     * Get a layout
     */
    get(name?: string): LayoutConfig | undefined;
    /**
     * Apply layout to content
     */
    apply(content: string, layoutName?: string, context?: TemplateContext): string;
    /**
     * Generate Rust layout code
     */
    toRustCode(): string;
}
/**
 * Component template definition
 */
export interface ComponentTemplate {
    name: string;
    render: (props: Record<string, unknown>) => string;
}
/**
 * Component template registry
 */
export declare class ComponentRegistry {
    private components;
    /**
     * Register a component
     */
    register(component: ComponentTemplate): this;
    /**
     * Render a component
     */
    render(name: string, props?: Record<string, unknown>): string;
    /**
     * Get a component
     */
    get(name: string): ComponentTemplate | undefined;
    /**
     * Check if a component exists
     */
    has(name: string): boolean;
}
/**
 * Flash messages component
 */
export declare const FlashMessages: ComponentTemplate;
/**
 * CSRF field component
 */
export declare const CSRFField: ComponentTemplate;
/**
 * Pagination component
 */
export declare const Pagination: ComponentTemplate;
/**
 * Form errors component
 */
export declare const FormErrors: ComponentTemplate;
/**
 * Create a new template engine
 */
export declare function createTemplateEngine(options?: Partial<TemplateEngineConfig>): TemplateEngine;
/**
 * Create a new layout builder
 */
export declare function createLayoutBuilder(): LayoutBuilder;
/**
 * Create a new component registry
 */
export declare function createComponentRegistry(): ComponentRegistry;
//# sourceMappingURL=templates.d.ts.map