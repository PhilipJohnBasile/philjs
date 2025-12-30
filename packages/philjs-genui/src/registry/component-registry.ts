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
export type ComponentRenderer = (
  component: A2UIComponent,
  context: RenderContext
) => HTMLElement | null;

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
  emitToAgent: (actionId: string, event: { type: string; data?: unknown }) => void;
}

/**
 * Registry entry
 */
interface RegistryEntry {
  capability: ComponentCapability;
  renderer: ComponentRenderer;
}

/**
 * Component Registry
 * Manages the registration and lookup of UI components
 */
export class ComponentRegistry {
  private entries: Map<string, RegistryEntry> = new Map();
  private allowedTypes: Set<string> = new Set();

  /**
   * Register a component with its capability and renderer
   */
  register(capability: ComponentCapability, renderer: ComponentRenderer): void {
    this.entries.set(capability.type, { capability, renderer });
    this.allowedTypes.add(capability.type);
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    this.allowedTypes.delete(type);
    return this.entries.delete(type);
  }

  /**
   * Check if a component type is allowed
   */
  isAllowed(type: string): boolean {
    return this.allowedTypes.has(type);
  }

  /**
   * Get capability for a component type
   */
  getCapability(type: string): ComponentCapability | undefined {
    return this.entries.get(type)?.capability;
  }

  /**
   * Get renderer for a component type
   */
  getRenderer(type: string): ComponentRenderer | undefined {
    return this.entries.get(type)?.renderer;
  }

  /**
   * Get all capabilities (for LLM querying)
   */
  getCapabilities(): ComponentCapability[] {
    return Array.from(this.entries.values()).map((e) => e.capability);
  }

  /**
   * Get capabilities by category
   */
  getCapabilitiesByCategory(category: ComponentCapability['category']): ComponentCapability[] {
    return this.getCapabilities().filter((c) => c.category === category);
  }

  /**
   * Search capabilities by tags or text
   */
  searchCapabilities(query: string): ComponentCapability[] {
    const lowerQuery = query.toLowerCase();
    return this.getCapabilities().filter((c) => {
      return (
        c.type.toLowerCase().includes(lowerQuery) ||
        c.displayName.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Generate capability manifest for LLM
   * This is a JSON-serializable summary of all components
   */
  generateManifest(): ComponentManifest {
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
  generateCompactManifest(): CompactManifest {
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
  private getCategorySummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const entry of this.entries.values()) {
      const cat = entry.capability.category;
      summary[cat] = (summary[cat] || 0) + 1;
    }
    return summary;
  }

  /**
   * Get all registered types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.entries.clear();
    this.allowedTypes.clear();
  }
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
    t: string; // type
    d: string; // description (truncated)
    cat: string; // category
    p: string[]; // required props
  }>;
}

/**
 * Create a new component registry
 */
export function createRegistry(): ComponentRegistry {
  return new ComponentRegistry();
}

/**
 * Default singleton registry
 */
let defaultRegistry: ComponentRegistry | null = null;

/**
 * Get the default registry (creates one if needed)
 */
export function getDefaultRegistry(): ComponentRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createRegistry();
  }
  return defaultRegistry;
}

/**
 * Set the default registry
 */
export function setDefaultRegistry(registry: ComponentRegistry): void {
  defaultRegistry = registry;
}
