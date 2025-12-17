/**
 * Resumability system for zero-hydration interactivity.
 * Serializes event handlers and state on the server,
 * then lazily loads them on interaction.
 */
import type { VNode } from "./jsx-runtime.js";
export type SerializedHandler = {
    /** Module containing the handler */
    module: string;
    /** Export name in the module */
    export: string;
    /** Captured closure variables */
    closure?: Record<string, any>;
};
export type ResumableState = {
    /** Map of element IDs to their handlers */
    handlers: Map<string, Map<string, SerializedHandler>>;
    /** Map of element IDs to their state */
    state: Map<string, any>;
    /** Counter for generating unique IDs */
    nextId: number;
};
/**
 * Initialize resumability context for SSR.
 */
export declare function initResumability(): ResumableState;
/**
 * Get current resumability context.
 */
export declare function getResumableState(): ResumableState | null;
/**
 * Generate a unique element ID.
 */
export declare function generateElementId(): string;
/**
 * Serialize a function reference for resumability.
 */
export declare function serializeHandler(fn: Function, module: string, exportName: string, closure?: Record<string, any>): SerializedHandler;
/**
 * Register a handler for an element during SSR.
 */
export declare function registerHandler(elementId: string, eventName: string, handler: SerializedHandler): void;
/**
 * Register state for an element during SSR.
 */
export declare function registerState(elementId: string, state: any): void;
/**
 * Serialize resumable state to JSON for embedding in HTML.
 */
export declare function serializeResumableState(): string;
/**
 * Client-side: Resume interactivity from serialized state.
 */
export declare function resume(): void;
/**
 * Make a component resumable by wrapping its event handlers.
 */
export declare function resumable<T extends Record<string, any>>(Component: (props: T) => VNode, options: {
    module: string;
    handlers?: Record<string, string>;
}): (props: T) => VNode;
//# sourceMappingURL=resumability.d.ts.map