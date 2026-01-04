/**
 * Resumability - Qwik-style State Serialization
 *
 * Eliminates hydration overhead by serializing application state and event handlers
 * to the DOM, allowing the client to "resume" instead of "hydrate".
 *
 * Key Benefits:
 * - Zero hydration cost
 * - Instant interactivity
 * - Progressive loading of event handlers
 * - Smaller initial JavaScript bundles
 *
 * Key Concepts:
 * - Components don't re-run on client
 * - Event handlers are serialized as QRLs (references)
 * - State is embedded in HTML as JSON
 * - Only the code needed for an interaction is loaded
 *
 * @see https://qwik.builder.io/docs/concepts/resumable/
 */
import { type Signal } from '@philjs/core';
export interface ResumableState {
    /**
     * Unique ID for this state
     */
    id: string;
    /**
     * State data
     */
    data: any;
    /**
     * State type (signal, computed, etc.)
     */
    type: 'signal' | 'computed' | 'effect' | 'store';
    /**
     * Dependencies (for computed values)
     */
    deps?: string[];
    /**
     * Timestamp when serialized
     */
    timestamp: number;
}
export interface ResumableListener {
    /**
     * Event type (click, submit, etc.)
     */
    event: string;
    /**
     * Handler module path
     */
    module: string;
    /**
     * Handler function name
     */
    handler: string;
    /**
     * Element selector
     */
    selector: string;
    /**
     * Capture phase
     */
    capture?: boolean;
}
export interface ResumableContext {
    /**
     * All serialized state
     */
    state: Map<string, ResumableState>;
    /**
     * All event listeners
     */
    listeners: ResumableListener[];
    /**
     * Component boundaries
     */
    components: Map<string, ComponentBoundary>;
    /**
     * Lazy imports map
     */
    imports: Map<string, () => Promise<any>>;
    /**
     * QRL registry
     */
    qrls: Map<string, QRL<any>>;
}
export interface ComponentBoundary {
    id: string;
    type: string;
    props: Record<string, any>;
    children?: string[];
}
export interface ResumabilityOptions {
    /**
     * Enable state serialization
     */
    serializeState?: boolean;
    /**
     * Enable listener serialization
     */
    serializeListeners?: boolean;
    /**
     * Enable component boundaries
     */
    componentBoundaries?: boolean;
    /**
     * Custom state serializer
     */
    serializer?: (value: any) => string;
    /**
     * Custom state deserializer
     */
    deserializer?: (value: string) => any;
    /**
     * Maximum state size (bytes)
     */
    maxStateSize?: number;
    /**
     * Enable closure serialization
     */
    serializeClosures?: boolean;
    /**
     * Module base path for QRLs
     */
    moduleBasePath?: string;
}
/**
 * QRL - A lazy-loadable reference to a function or value
 * Similar to Qwik's QRL, enables code splitting per handler
 */
export interface QRL<T extends (...args: any[]) => any = (...args: any[]) => any> {
    /** Symbol ID for lazy loading */
    __qrl__: true;
    /** Unique symbol for this QRL */
    symbol: string;
    /** Module path for dynamic import */
    chunk: string;
    /** Export name in the module */
    exportName: string;
    /** Captured closure state */
    capturedState?: Record<string, any>;
    /** The resolved function (after loading) */
    resolved?: T;
    /** Hash of the QRL for caching */
    hash: string;
}
/**
 * QRL Registry for tracking all lazy-loadable references
 */
declare class QRLRegistry {
    private qrls;
    private loadedModules;
    private symbolCounter;
    /**
     * Register a QRL
     */
    register<T extends (...args: any[]) => any>(fn: T, options?: {
        symbol?: string;
        chunk?: string;
        exportName?: string;
        capturedState?: Record<string, any>;
    }): QRL<T>;
    /**
     * Resolve a QRL to its function
     */
    resolve<T extends (...args: any[]) => any>(qrl: QRL<T>): Promise<T>;
    /**
     * Get a QRL by symbol
     */
    get(symbol: string): QRL<any> | undefined;
    /**
     * Serialize all QRLs
     */
    serialize(): Array<{
        symbol: string;
        chunk: string;
        exportName: string;
        capturedState?: Record<string, any>;
    }>;
    /**
     * Restore QRLs from serialized data
     */
    restore(data: Array<{
        symbol: string;
        chunk: string;
        exportName: string;
        capturedState?: Record<string, any>;
    }>): void;
    /**
     * Generate a hash for a QRL
     */
    private generateHash;
    /**
     * Clear all QRLs
     */
    clear(): void;
}
/**
 * Global QRL registry
 */
export declare const qrlRegistry: QRLRegistry;
/**
 * Create a QRL (Qwik Resource Locator) - a lazy-loadable function reference
 *
 * @example
 * ```tsx
 * // Create a QRL for a click handler
 * const handleClick = qrl(() => console.log('clicked'), 'handleClick');
 *
 * // With captured closure state
 * const handleSubmit = qrl(
 *   (data) => submitForm(data),
 *   'handleSubmit',
 *   { formId: 'myForm' }
 * );
 * ```
 */
export declare function qrl<T extends (...args: any[]) => any>(fn: T, symbol: string, capturedState?: Record<string, any>): QRL<T>;
/**
 * Create a QRL with a specific module path for code splitting
 */
export declare function qrlChunk<T extends (...args: any[]) => any>(chunk: string, exportName: string, symbol?: string, capturedState?: Record<string, any>): QRL<T>;
/**
 * Check if a value is a QRL
 */
export declare function isQRL(value: any): value is QRL<any>;
/**
 * Resolve a QRL to its function
 */
export declare function resolveQRL<T extends (...args: any[]) => any>(qrl: QRL<T>): Promise<T>;
/**
 * $ - Mark a function as lazy-loadable (Qwik-style)
 *
 * The $ suffix is a convention from Qwik that marks functions
 * that can be serialized and lazy-loaded.
 *
 * @example
 * ```tsx
 * // Mark a click handler as lazy-loadable
 * <button onClick={$(() => console.log('clicked'))}>
 *   Click me
 * </button>
 *
 * // With closure variables
 * const count = useResumable(0);
 * <button onClick={$(() => count.set(count() + 1))}>
 *   Increment: {count()}
 * </button>
 * ```
 */
export declare function $<T extends (...args: any[]) => any>(fn: T): QRL<T>;
/**
 * $$ - Mark a function with an explicit symbol name
 *
 * @example
 * ```tsx
 * const onClick = $$('handleClick', () => console.log('clicked'));
 * ```
 */
export declare function $$<T extends (...args: any[]) => any>(symbol: string, fn: T): QRL<T>;
/**
 * $closure - Mark a function with captured closure state
 *
 * @example
 * ```tsx
 * const userId = 123;
 * const onClick = $closure(() => fetchUser(userId), { userId });
 * ```
 */
export declare function $closure<T extends (...args: any[]) => any>(fn: T, capturedState: Record<string, any>): QRL<T>;
/**
 * Register a signal for resumability
 */
export declare function resumable<T>(initialValue: T | (() => T), options?: {
    id?: string;
}): Signal<T>;
/**
 * useResumable - Hook-style API for resumable signals
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const count = useResumable(0, { id: 'counter' });
 *
 *   return (
 *     <button onClick={$(() => count.set(count() + 1))}>
 *       Count: {count()}
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useResumable<T>(initialValue: T, options?: {
    id?: string;
}): Signal<T>;
/**
 * Create a resumable computed value
 * Returns a Signal that wraps the computed value for consistent API
 */
export declare function resumableComputed<T>(fn: () => T, deps: Signal<any>[], options?: {
    id?: string;
}): Signal<T>;
/**
 * Serialize all registered state
 */
export declare function serializeState(options?: ResumabilityOptions): string;
/**
 * Deserialize and restore state
 */
export declare function deserializeState(serialized: string, options?: ResumabilityOptions): void;
/**
 * Resume app from serialized state
 *
 * @example
 * ```tsx
 * // On client-side
 * const serializedState = document.getElementById('__PHILJS_STATE__')?.textContent;
 * if (serializedState) {
 *   await resumeFromState(serializedState);
 * }
 * ```
 */
export declare function resumeFromState(serializedState: string, options?: ResumabilityOptions): Promise<void>;
/**
 * Clear serialized state from memory
 */
export declare function clearSerializedState(): void;
/**
 * Register an event listener for lazy loading
 */
export declare function on<K extends keyof HTMLElementEventMap>(event: K, handler: (event: HTMLElementEventMap[K]) => void, options?: {
    module?: string;
    name?: string;
    capture?: boolean;
}): string;
/**
 * Serialize all registered listeners
 */
export declare function serializeListeners(): ResumableListener[];
/**
 * Resume event listeners from serialized data
 */
export declare function resumeListeners(listeners: ResumableListener[], importMap: Map<string, () => Promise<any>>): Promise<void>;
/**
 * Mark a component boundary for lazy loading
 */
export declare function boundary(id: string, type: string, props: Record<string, any>, children?: string[]): ComponentBoundary;
/**
 * Serialize component boundaries
 */
export declare function serializeBoundaries(): ComponentBoundary[];
/**
 * Get a component boundary by ID
 */
export declare function getBoundary(id: string): ComponentBoundary | undefined;
export interface ResumableAppOptions {
    /**
     * Module base path for code splitting
     */
    moduleBasePath?: string;
    /**
     * Enable automatic QRL extraction
     */
    autoQRL?: boolean;
    /**
     * Enable state serialization
     */
    serializeState?: boolean;
    /**
     * Import map for lazy loading
     */
    importMap?: Map<string, () => Promise<any>>;
}
export interface ResumableApp<T> {
    /**
     * The wrapped component
     */
    Component: T;
    /**
     * Render the app to HTML with embedded state
     */
    render: () => string;
    /**
     * Get the serialized state
     */
    getState: () => string;
    /**
     * Resume the app on the client
     */
    resume: () => Promise<void>;
    /**
     * Clean up resources
     */
    dispose: () => void;
}
/**
 * Create a resumable app wrapper
 *
 * This wraps a component to make it fully resumable, meaning:
 * - State is serialized to HTML
 * - Event handlers become QRLs
 * - No re-execution of component code on client
 *
 * @example
 * ```tsx
 * // Server-side
 * const app = createResumableApp(MyApp);
 * const html = app.render();
 *
 * // Client-side
 * const app = createResumableApp(MyApp);
 * await app.resume();
 * ```
 */
export declare function createResumableApp<T extends (...args: any[]) => any>(component: T, options?: ResumableAppOptions): ResumableApp<T>;
/**
 * Create a complete resumable context
 */
export declare function createResumableContext(importMap?: Map<string, () => Promise<any>>): ResumableContext;
/**
 * Serialize resumable context to JSON
 */
export declare function serializeContext(context: ResumableContext, options?: ResumabilityOptions): string;
/**
 * Deserialize and resume from context
 */
export declare function resumeContext(serialized: string, importMap: Map<string, () => Promise<any>>, options?: ResumabilityOptions): Promise<void>;
/**
 * Inject resumable state into HTML
 */
export declare function injectResumableState(html: string, context: ResumableContext, options?: ResumabilityOptions): string;
/**
 * Extract resumable state from HTML
 */
export declare function extractResumableState(): ResumableContext | null;
/**
 * Serialize a closure's captured variables
 *
 * This attempts to extract the variables captured by a closure.
 * In production, this would be handled by the compiler.
 */
export declare function serializeClosure(fn: Function, capturedVars: Record<string, any>): {
    code: string;
    captured: Record<string, any>;
};
/**
 * Deserialize closure variables
 */
export declare function deserializeClosureVars(vars: Record<string, any>): Record<string, any>;
/**
 * Get resumability stats
 */
export declare function getResumabilityStats(): {
    stateCount: number;
    listenerCount: number;
    componentCount: number;
    qrlCount: number;
    estimatedSize: number;
};
/**
 * Log resumability information
 */
export declare function logResumabilityInfo(): void;
/**
 * Check if app is currently resuming
 */
export declare function isResuming(): boolean;
/**
 * Check if app has resumed
 */
export declare function hasResumed(): boolean;
/**
 * Check if resumable state is available
 */
export declare function hasResumableState(): boolean;
/**
 * Enable resumability for an app
 */
export declare function enableResumability(options?: ResumabilityOptions): void;
/**
 * Wait for the app to resume
 */
export declare function onResume(callback: () => void): void;
export {};
//# sourceMappingURL=resumability.d.ts.map