/**
 * Core Resumability Logic
 *
 * This module provides the core resumability implementation that enables
 * zero JavaScript execution until user interaction. It integrates with
 * QRLs, serialization, and hydration to create a complete resumability system.
 *
 * @example
 * ```typescript
 * // Define a resumable component
 * export const Counter = resumable$(() => {
 *   const count = useSignal(0);
 *   return (
 *     <button onClick$={() => count.value++}>
 *       Count: {count.value}
 *     </button>
 *   );
 * });
 *
 * // The component renders to HTML with serialized state
 * // No JavaScript runs until the button is clicked
 * ```
 */
import type { QRL } from './qrl.js';
import { type SerializationContext } from './serializer.js';
/**
 * Resumable component function
 */
export type ResumableComponent<P = Record<string, unknown>> = {
    (props: P): unknown;
    /** QRL for lazy loading */
    $qrl$: QRL<(props: P) => unknown>;
    /** Display name */
    displayName?: string;
};
/**
 * Resumable signal (serializable reactive state)
 */
export interface ResumableSignal<T> {
    /** Get the current value */
    (): T;
    /** Get value without tracking */
    peek(): T;
    /** Set a new value */
    set(value: T | ((prev: T) => T)): void;
    /** Unique signal ID for serialization */
    $id$: string;
    /** Subscribe to changes */
    subscribe(fn: (value: T) => void): () => void;
}
/**
 * Context for resumable rendering
 */
export interface ResumableContext {
    /** Serialization context */
    serialization: SerializationContext;
    /** Current component stack */
    componentStack: string[];
    /** Signal registry */
    signals: Map<string, ResumableSignal<unknown>>;
    /** Whether we're on the server */
    isServer: boolean;
    /** Whether we're hydrating */
    isHydrating: boolean;
}
/**
 * Resumable app configuration
 */
export interface ResumableConfig {
    /** Base path for chunk loading */
    basePath?: string;
    /** Development mode */
    isDev?: boolean;
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Custom chunk resolver */
    resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}
/**
 * Get the current resumable context
 */
export declare function getResumableContext(): ResumableContext | null;
/**
 * Run with a resumable context
 */
export declare function withResumableContext<T>(ctx: ResumableContext, fn: () => T): T;
/**
 * Create a resumable component.
 *
 * The component will:
 * 1. Render to HTML on the server with serialized state
 * 2. Not execute JavaScript on the client until interaction
 * 3. Lazy load the component code when needed
 *
 * @example
 * ```typescript
 * const Counter = resumable$(() => {
 *   const count = useSignal(0);
 *   return <button onClick$={() => count.value++}>{count.value}</button>;
 * });
 * ```
 */
export declare function resumable$<P = Record<string, unknown>>(component: (props: P) => unknown, options?: {
    /** Module path for the component */
    module?: string;
    /** Export name */
    symbol?: string;
}): ResumableComponent<P>;
/**
 * Create a resumable signal.
 *
 * Unlike regular signals, resumable signals:
 * 1. Serialize their value to HTML
 * 2. Restore from serialized state on hydration
 * 3. Can be referenced across lazy-loaded boundaries
 *
 * @example
 * ```typescript
 * const count = useSignal(0);
 * // Renders: <span data-qsignal="s0">0</span>
 * // Value is restored on hydration without running component code
 * ```
 */
export declare function useSignal<T>(initialValue: T): ResumableSignal<T>;
/**
 * Create a computed resumable value
 */
export declare function useComputed<T>(computation: () => T, deps?: unknown[]): ResumableSignal<T>;
/**
 * Create a resumable event handler.
 *
 * The handler is serialized as a QRL and only loaded when invoked.
 *
 * @example
 * ```typescript
 * const handleClick = $(() => console.log('clicked'));
 * <button onClick$={handleClick}>Click me</button>
 * ```
 */
export { $ } from './qrl.js';
/**
 * Create an event handler that captures local state
 */
export declare function handler$<T extends (...args: unknown[]) => unknown>(fn: T, captures?: unknown[], captureNames?: string[]): QRL<T>;
/**
 * Render a resumable app to HTML
 */
export declare function renderToResumableString(app: unknown, config?: ResumableConfig): Promise<string>;
/**
 * Resume an application on the client
 */
export declare function resume(config?: ResumableConfig): void;
/**
 * Create a streaming resumable renderer
 */
export declare function createStreamingRenderer(config?: ResumableConfig): {
    write: (chunk: unknown) => string;
    flush: () => string;
    end: () => string;
};
/**
 * Check if we're on the server
 */
export declare function isServer(): boolean;
/**
 * Check if we're in a resumable context
 */
export declare function isResumable(): boolean;
/**
 * Get the current component ID
 */
export declare function getCurrentComponentId(): string | undefined;
/**
 * Mark a component as static (never hydrate)
 */
export declare function static$<P>(component: (props: P) => unknown): (props: P) => unknown;
/**
 * Create a client-only component
 */
export declare function client$<P>(component: (props: P) => unknown, fallback?: unknown): (props: P) => unknown;
/**
 * Create a server-only component
 */
export declare function server$component<P>(component: (props: P) => unknown): (props: P) => unknown;
//# sourceMappingURL=resumable.d.ts.map