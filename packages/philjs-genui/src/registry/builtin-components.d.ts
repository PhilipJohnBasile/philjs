/**
 * Built-in component registrations
 * These are safe, basic components that come pre-registered
 */
import type { ComponentCapability, ComponentRenderer } from './component-registry.js';
/**
 * Built-in layout components
 */
export declare const layoutComponents: Array<{
    capability: ComponentCapability;
    renderer: ComponentRenderer;
}>;
/**
 * Built-in text components
 */
export declare const textComponents: Array<{
    capability: ComponentCapability;
    renderer: ComponentRenderer;
}>;
/**
 * Built-in input components
 */
export declare const inputComponents: Array<{
    capability: ComponentCapability;
    renderer: ComponentRenderer;
}>;
/**
 * Built-in feedback components
 */
export declare const feedbackComponents: Array<{
    capability: ComponentCapability;
    renderer: ComponentRenderer;
}>;
/**
 * All built-in components
 */
export declare const builtinComponents: {
    capability: ComponentCapability;
    renderer: ComponentRenderer;
}[];
/**
 * Register all built-in components to a registry
 */
export declare function registerBuiltins(registry: {
    register: (capability: ComponentCapability, renderer: ComponentRenderer) => void;
}): void;
//# sourceMappingURL=builtin-components.d.ts.map