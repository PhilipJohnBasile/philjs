/**
 * State Serialization for Resumability
 *
 * This module handles serializing component state, signals, and QRLs
 * into HTML that can be resumed on the client without JavaScript execution.
 *
 * @example
 * ```typescript
 * // Server-side
 * const state = createSerializationContext();
 * const html = serializeToHTML(vnode, state);
 * const script = generateResumableScript(state);
 *
 * // Renders:
 * // <div data-qid="q0" data-qstate="...">Content</div>
 * // <script id="__PHIL_STATE__">...</script>
 * ```
 */
import type { QRL } from './qrl.js';
/**
 * Serialized signal state
 */
export interface SerializedSignal {
    /** Unique signal ID */
    id: string;
    /** Serialized value */
    value: SerializedValue;
    /** Subscribers (element IDs that use this signal) */
    subscribers: string[];
}
/**
 * Serialized value with type information
 */
export interface SerializedValue {
    /** Type discriminator */
    type: 'primitive' | 'object' | 'array' | 'date' | 'map' | 'set' | 'signal' | 'qrl' | 'undefined' | 'regexp' | 'bigint' | 'error';
    /** Serialized data */
    data: unknown;
}
/**
 * Serialized event handler
 */
export interface SerializedHandler {
    /** QRL string for the handler */
    qrl: string;
    /** Event type (e.g., 'click', 'input') */
    event: string;
    /** Whether to prevent default */
    preventDefault?: boolean;
    /** Whether to stop propagation */
    stopPropagation?: boolean;
}
/**
 * Serialized element state
 */
export interface SerializedElement {
    /** Element ID */
    id: string;
    /** Event handlers */
    handlers: SerializedHandler[];
    /** Signal bindings (signal ID -> attribute/property name) */
    bindings: Record<string, string>;
    /** Inline state for this element */
    state?: Record<string, SerializedValue>;
}
/**
 * Complete serialization context
 */
export interface SerializationContext {
    /** Counter for generating unique IDs */
    nextId: number;
    /** Serialized signals */
    signals: Map<string, SerializedSignal>;
    /** Serialized elements */
    elements: Map<string, SerializedElement>;
    /** QRL references for later resolution */
    qrls: Map<string, string>;
    /** Captured closures for handlers */
    closures: Map<string, SerializedValue[]>;
    /** Component boundaries */
    components: Map<string, {
        props: Record<string, SerializedValue>;
        qrl: string;
    }>;
    /** Streaming chunks (for out-of-order SSR) */
    chunks: string[];
    /** Development mode flag */
    isDev: boolean;
}
/**
 * Create a new serialization context
 */
export declare function createSerializationContext(options?: {
    isDev?: boolean;
}): SerializationContext;
/**
 * Get the current serialization context
 */
export declare function getSerializationContext(): SerializationContext | null;
/**
 * Run a function with a serialization context
 */
export declare function withSerializationContext<T>(ctx: SerializationContext, fn: () => T): T;
/**
 * Generate a unique element ID
 */
export declare function generateId(ctx?: SerializationContext): string;
/**
 * Serialize any JavaScript value to a portable format
 */
export declare function serializeValue(value: unknown): SerializedValue;
/**
 * Deserialize a value back to JavaScript
 */
export declare function deserializeValue(serialized: SerializedValue): unknown;
/**
 * Register an element with handlers and bindings
 */
export declare function registerElement(id: string, options: {
    handlers?: SerializedHandler[];
    bindings?: Record<string, string>;
    state?: Record<string, unknown>;
}, ctx?: SerializationContext): void;
/**
 * Register a signal for serialization
 */
export declare function registerSignal(id: string, value: unknown, ctx?: SerializationContext): void;
/**
 * Add a subscriber to a signal
 */
export declare function addSignalSubscriber(signalId: string, elementId: string, ctx?: SerializationContext): void;
/**
 * Register a component boundary
 */
export declare function registerComponent(id: string, qrl: QRL | string, props: Record<string, unknown>, ctx?: SerializationContext): void;
/**
 * Generate the resumable state script tag
 */
export declare function generateStateScript(ctx: SerializationContext): string;
/**
 * Generate inline script for immediate handler attachment
 */
export declare function generateBootstrapScript(options?: {
    /** Custom chunk base path */
    basePath?: string;
    /** Inline the resume runtime */
    inlineRuntime?: boolean;
}): string;
/**
 * Generate HTML attributes for a resumable element
 */
export declare function generateElementAttributes(id: string, ctx: SerializationContext): Record<string, string>;
/**
 * Create a streaming serialization context
 */
export declare function createStreamingContext(): SerializationContext & {
    flush(): string;
    finalize(): string;
};
/**
 * Add a streaming chunk
 */
export declare function addStreamingChunk(html: string, ctx?: SerializationContext): void;
/**
 * Serialize state to a compact string for HTML attributes
 */
export declare function serializeToAttribute(value: unknown): string;
/**
 * Deserialize from a compact attribute string
 */
export declare function deserializeFromAttribute(attr: string): unknown;
/**
 * Serialize state inline in the element (for small state)
 */
export declare function generateInlineState(state: Record<string, unknown>): string;
//# sourceMappingURL=serializer.d.ts.map