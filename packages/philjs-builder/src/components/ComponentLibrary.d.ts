/**
 * Component Library for the visual builder
 * Provides a registry of all available components for the palette
 */
import type { ComponentDefinition, ComponentCategory } from '../types.js';
export declare const componentCategories: ComponentCategory[];
export declare const allComponents: ComponentDefinition[];
/**
 * Get a component definition by type
 */
export declare function getComponentDefinition(type: string): ComponentDefinition | undefined;
/**
 * Get all components in a category
 */
export declare function getComponentsByCategory(categoryId: string): ComponentDefinition[];
/**
 * Register all built-in components with a store
 */
export declare function registerBuiltInComponents(registerFn: (component: ComponentDefinition) => void): void;
//# sourceMappingURL=ComponentLibrary.d.ts.map