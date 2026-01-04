/**
 * GenUI Hydrator
 * Converts A2UI messages into live DOM elements
 */
import type { A2UIMessage } from '../protocol/a2ui-schema.js';
import type { ComponentRegistry } from '../registry/component-registry.js';
import { type SandboxConfig } from '../sandbox/ast-validator.js';
/**
 * Hydration result
 */
export interface HydrationResult {
    /** Whether hydration succeeded */
    success: boolean;
    /** Root element if successful */
    element?: HTMLElement;
    /** Errors if failed */
    errors?: Array<{
        code: string;
        message: string;
    }>;
    /** Cleanup function */
    cleanup?: () => void;
    /** Component map for updates */
    componentMap?: Map<string, HTMLElement>;
}
/**
 * Hydrator options
 */
export interface HydratorOptions {
    /** Sandbox configuration */
    sandbox?: Partial<SandboxConfig>;
    /** Callback when agent receives action */
    onAgentAction?: (actionId: string, event: {
        type: string;
        data?: unknown;
    }) => void;
    /** Signal store for reactive bindings */
    signals?: Map<string, {
        get: () => unknown;
        set: (value: unknown) => void;
    }>;
    /** Whether to animate transitions */
    animateTransitions?: boolean;
}
/**
 * GenUI Hydrator
 * Converts validated A2UI messages into live DOM
 */
export declare class GenUIHydrator {
    private registry;
    private validator;
    private options;
    private componentMap;
    private cleanupFunctions;
    constructor(registry: ComponentRegistry, options?: HydratorOptions);
    /**
     * Hydrate an A2UI message into a container
     */
    hydrate(message: A2UIMessage, container: HTMLElement): HydrationResult;
    /**
     * Hydrate a render payload
     */
    private hydrateRenderPayload;
    /**
     * Hydrate an update payload
     */
    private hydrateUpdatePayload;
    /**
     * Create a layout wrapper element
     */
    private createLayoutElement;
    /**
     * Create render context for component rendering
     */
    private createRenderContext;
    /**
     * Render a single component
     */
    private renderComponent;
    /**
     * Apply data bindings
     */
    private applyBindings;
    /**
     * Setup action handlers
     */
    private setupActions;
    /**
     * Execute an action handler
     */
    private executeAction;
    /**
     * Emit event to agent
     */
    private emitToAgent;
    /**
     * Resolve a path in the signals store
     */
    private resolvePath;
    /**
     * Evaluate a condition expression (safely)
     */
    private evaluateCondition;
    /**
     * Evaluate a transform expression (safely)
     */
    private evaluateTransform;
    /**
     * Set a property on an element
     */
    private setElementProperty;
    /**
     * Apply class, style, and accessibility metadata to a rendered element.
     */
    private applyComponentDecorations;
    /**
     * Apply animation to element
     */
    private applyAnimation;
    /**
     * Debounce helper
     */
    private debounce;
    /**
     * Throttle helper
     */
    private throttle;
    /**
     * Cleanup all resources
     */
    cleanup(): void;
}
/**
 * Create a new hydrator
 */
export declare function createHydrator(registry: ComponentRegistry, options?: HydratorOptions): GenUIHydrator;
//# sourceMappingURL=hydrator.d.ts.map