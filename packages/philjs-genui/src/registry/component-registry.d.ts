/**
 * Component Registry
 * Manages available components for AI-driven UI composition
 */
import type { A2UIComponent } from '../protocol/a2ui-schema.js';
/**
 * Property definition for component capabilities
 */
export interface PropDefinition {
    /** Property name */
    name: string;
    /** Property type */
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
    /** Whether the property is required */
    required?: boolean;
    /** Default value */
    default?: unknown;
    /** Allowed values (for enums) */
    enum?: unknown[];
    /** Description for LLM */
    description?: string;
    /** Nested schema for objects/arrays */
    schema?: PropDefinition[];
}
/**
 * Slot definition
 */
export interface SlotDefinition {
    /** Slot name */
    name: string;
    /** Description */
    description?: string;
    /** Allowed component types in this slot */
    allowedTypes?: string[];
    /** Whether this slot accepts multiple children */
    multiple?: boolean;
}
/**
 * Event definition
 */
export interface EventDefinition {
    /** Event name */
    name: string;
    /** Description */
    description?: string;
    /** Payload schema */
    payload?: PropDefinition[];
}
/**
 * Example usage for LLM context
 */
export interface ComponentExample {
    /** Example description */
    description: string;
    /** Example A2UI component definition */
    component: A2UIComponent;
}
/**
 * Complete capability definition for a component
 */
export interface ComponentCapability {
    /** Component type identifier */
    type: string;
    /** Human-readable name */
    displayName: string;
    /** Description for LLM */
    description: string;
    /** Component category */
    category: 'layout' | 'input' | 'display' | 'navigation' | 'feedback' | 'data' | 'media';
    /** Available props */
    props: PropDefinition[];
    /** Available slots */
    slots?: SlotDefinition[];
    /** Emitted events */
    events?: EventDefinition[];
    /** Usage examples */
    examples?: ComponentExample[];
    /** Tags for search */
    tags?: string[];
    /** Accessibility notes */
    a11yNotes?: string;
    /** Whether component is deprecated */
    deprecated?: boolean;
    /** Deprecation message */
    deprecationMessage?: string;
}
/**
 * Component renderer function type
 */
export type ComponentRenderer = (component: A2UIComponent, context: RenderContext) => HTMLElement | null;
/**
 * Render context passed to renderers
 */
export interface RenderContext {
    /** Parent element */
    parent: HTMLElement | null;
    /** Signal store for bindings */
    signals: Map<string, unknown>;
    /** Action handlers */
    actions: Map<string, (event: Event) => void>;
    /** Child renderer */
    renderChild: (child: A2UIComponent) => HTMLElement | null;
    /** Get bound value */
    getBoundValue: (path: string) => unknown;
    /** Emit event to agent */
    emitToAgent: (actionId: string, event: {
        type: string;
        data?: unknown;
    }) => void;
}
/**
 * Component Registry
 * Manages the registration and lookup of UI components
 */
export declare class ComponentRegistry {
    private entries;
    private allowedTypes;
    /**
     * Register a component with its capability and renderer
     */
    register(capability: ComponentCapability, renderer: ComponentRenderer): void;
    /**
     * Unregister a component
     */
    unregister(type: string): boolean;
    /**
     * Check if a component type is allowed
     */
    isAllowed(type: string): boolean;
    /**
     * Get capability for a component type
     */
    getCapability(type: string): ComponentCapability | undefined;
    /**
     * Get renderer for a component type
     */
    getRenderer(type: string): ComponentRenderer | undefined;
    /**
     * Get all capabilities (for LLM querying)
     */
    getCapabilities(): ComponentCapability[];
    /**
     * Get capabilities by category
     */
    getCapabilitiesByCategory(category: ComponentCapability['category']): ComponentCapability[];
    /**
     * Search capabilities by tags or text
     */
    searchCapabilities(query: string): ComponentCapability[];
    /**
     * Generate capability manifest for LLM
     * This is a JSON-serializable summary of all components
     */
    generateManifest(): ComponentManifest;
    /**
     * Generate a compact manifest for token-constrained contexts
     */
    generateCompactManifest(): CompactManifest;
    /**
     * Get category summary
     */
    private getCategorySummary;
    /**
     * Get all registered types
     */
    getRegisteredTypes(): string[];
    /**
     * Clear all registrations
     */
    clear(): void;
}
/**
 * Component manifest for LLM context
 */
export interface ComponentManifest {
    version: string;
    componentCount: number;
    categories: Record<string, number>;
    components: Array<{
        type: string;
        displayName: string;
        description: string;
        category: string;
        props: Array<{
            name: string;
            type: string;
            required: boolean;
            description?: string;
            enum?: unknown[];
        }>;
        slots?: Array<{
            name: string;
            description?: string;
            allowedTypes?: string[];
        }>;
        events?: Array<{
            name: string;
            description?: string;
        }>;
        tags?: string[];
        deprecated?: boolean;
    }>;
}
/**
 * Compact manifest for token-constrained contexts
 */
export interface CompactManifest {
    v: string;
    c: Array<{
        t: string;
        d: string;
        cat: string;
        p: string[];
    }>;
}
/**
 * Create a new component registry
 */
export declare function createRegistry(): ComponentRegistry;
/**
 * Get the default registry (creates one if needed)
 */
export declare function getDefaultRegistry(): ComponentRegistry;
/**
 * Set the default registry
 */
export declare function setDefaultRegistry(registry: ComponentRegistry): void;
//# sourceMappingURL=component-registry.d.ts.map