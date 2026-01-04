/**
 * PhilJS UI Components integration for the visual builder
 */
import type { ComponentDefinition, ComponentCategory } from '../types.js';
export declare const philjsUICategories: ComponentCategory[];
export declare const philjsUIComponents: ComponentDefinition[];
/**
 * Get a PhilJS UI component definition by type
 */
export declare function getPhilJSUIComponent(type: string): ComponentDefinition | undefined;
/**
 * Get all PhilJS UI components in a category
 */
export declare function getPhilJSUIComponentsByCategory(categoryId: string): ComponentDefinition[];
/**
 * Register all PhilJS UI components with a store
 */
export declare function registerPhilJSUIComponents(registerFn: (component: ComponentDefinition) => void): void;
//# sourceMappingURL=PhilJSUIComponents.d.ts.map