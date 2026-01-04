/**
 * Component Registry
 * Manages available components for AI-driven UI composition
 */
/**
 * Component Registry
 * Manages the registration and lookup of UI components
 */
export class ComponentRegistry {
    entries = new Map();
    allowedTypes = new Set();
    /**
     * Register a component with its capability and renderer
     */
    register(capability, renderer) {
        this.entries.set(capability.type, { capability, renderer });
        this.allowedTypes.add(capability.type);
    }
    /**
     * Unregister a component
     */
    unregister(type) {
        this.allowedTypes.delete(type);
        return this.entries.delete(type);
    }
    /**
     * Check if a component type is allowed
     */
    isAllowed(type) {
        return this.allowedTypes.has(type);
    }
    /**
     * Get capability for a component type
     */
    getCapability(type) {
        return this.entries.get(type)?.capability;
    }
    /**
     * Get renderer for a component type
     */
    getRenderer(type) {
        return this.entries.get(type)?.renderer;
    }
    /**
     * Get all capabilities (for LLM querying)
     */
    getCapabilities() {
        return Array.from(this.entries.values()).map((e) => e.capability);
    }
    /**
     * Get capabilities by category
     */
    getCapabilitiesByCategory(category) {
        return this.getCapabilities().filter((c) => c.category === category);
    }
    /**
     * Search capabilities by tags or text
     */
    searchCapabilities(query) {
        const lowerQuery = query.toLowerCase();
        return this.getCapabilities().filter((c) => {
            return (c.type.toLowerCase().includes(lowerQuery) ||
                c.displayName.toLowerCase().includes(lowerQuery) ||
                c.description.toLowerCase().includes(lowerQuery) ||
                c.tags?.some((t) => t.toLowerCase().includes(lowerQuery)));
        });
    }
    /**
     * Generate capability manifest for LLM
     * This is a JSON-serializable summary of all components
     */
    generateManifest() {
        const capabilities = this.getCapabilities();
        return {
            version: '1.0',
            componentCount: capabilities.length,
            categories: this.getCategorySummary(),
            components: capabilities.map((c) => ({
                type: c.type,
                displayName: c.displayName,
                description: c.description,
                category: c.category,
                props: c.props.map((p) => ({
                    name: p.name,
                    type: p.type,
                    required: p.required ?? false,
                    description: p.description,
                    enum: p.enum,
                })),
                slots: c.slots?.map((s) => ({
                    name: s.name,
                    description: s.description,
                    allowedTypes: s.allowedTypes,
                })),
                events: c.events?.map((e) => ({
                    name: e.name,
                    description: e.description,
                })),
                tags: c.tags,
                deprecated: c.deprecated,
            })),
        };
    }
    /**
     * Generate a compact manifest for token-constrained contexts
     */
    generateCompactManifest() {
        const capabilities = this.getCapabilities();
        return {
            v: '1.0',
            c: capabilities.map((c) => ({
                t: c.type,
                d: c.description.substring(0, 100),
                cat: c.category,
                p: c.props
                    .filter((p) => p.required)
                    .map((p) => p.name),
            })),
        };
    }
    /**
     * Get category summary
     */
    getCategorySummary() {
        const summary = {};
        for (const entry of this.entries.values()) {
            const cat = entry.capability.category;
            summary[cat] = (summary[cat] || 0) + 1;
        }
        return summary;
    }
    /**
     * Get all registered types
     */
    getRegisteredTypes() {
        return Array.from(this.entries.keys());
    }
    /**
     * Clear all registrations
     */
    clear() {
        this.entries.clear();
        this.allowedTypes.clear();
    }
}
/**
 * Create a new component registry
 */
export function createRegistry() {
    return new ComponentRegistry();
}
/**
 * Default singleton registry
 */
let defaultRegistry = null;
/**
 * Get the default registry (creates one if needed)
 */
export function getDefaultRegistry() {
    if (!defaultRegistry) {
        defaultRegistry = createRegistry();
    }
    return defaultRegistry;
}
/**
 * Set the default registry
 */
export function setDefaultRegistry(registry) {
    defaultRegistry = registry;
}
//# sourceMappingURL=component-registry.js.map