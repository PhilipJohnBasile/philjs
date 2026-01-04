/**
 * QRL (Quick Resource Locator) - Lazy references for resumability.
 *
 * QRLs are the fundamental building block of resumability. They allow
 * serializing references to functions, components, and resources as URLs
 * that can be lazily loaded when needed.
 *
 * @example
 * ```typescript
 * // Create a lazy handler reference
 * const handler = $(() => console.log('clicked'));
 *
 * // Use in JSX
 * <button onClick$={handler}>Click me</button>
 *
 * // The handler is not loaded until the button is clicked
 * ```
 */
/**
 * A QRL (Quick Resource Locator) is a lazy reference to a resource.
 * It can represent functions, components, or any other JavaScript values.
 */
export interface QRL<T = unknown> {
    /** The unique identifier for this QRL */
    readonly $id$: string;
    /** The chunk/module path containing the resource */
    readonly $chunk$: string;
    /** The symbol/export name within the chunk */
    readonly $symbol$: string;
    /** Captured closure variables */
    readonly $capture$: unknown[];
    /** Captured closure variable names (for debugging) */
    readonly $captureNames$?: string[] | undefined;
    /** Resolved value (cached after first load) */
    $resolved$?: T | undefined;
    /** Whether this QRL has been resolved */
    $isResolved$: boolean;
    /** Resolve and return the referenced value */
    resolve(): Promise<T>;
    /** Get the serialized form of this QRL */
    serialize(): string;
    /** Invoke if this is a function QRL */
    invoke(...args: T extends (...args: infer A) => unknown ? A : never[]): Promise<T extends (...args: unknown[]) => infer R ? R : never>;
}
/**
 * Options for creating a QRL
 */
export interface QRLOptions<T = unknown> {
    /** The chunk/module path */
    chunk: string;
    /** The export symbol name */
    symbol: string;
    /** Captured closure variables */
    capture?: unknown[];
    /** Captured variable names (for debugging) */
    captureNames?: string[];
    /** Pre-resolved value (for development/testing) */
    resolved?: T;
}
/**
 * A lazy event handler that will be loaded on first interaction
 */
export type QRLEventHandler<E extends Event = Event> = QRL<(event: E) => void | Promise<void>>;
/**
 * A lazy component that will be loaded when rendered
 */
export type QRLComponent<P = Record<string, unknown>> = QRL<(props: P) => unknown>;
/**
 * Configure the QRL registry
 */
export declare function configureQRL(options: {
    basePath?: string;
    resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}): void;
/**
 * Clear the QRL registry (for testing)
 */
export declare function clearQRLRegistry(): void;
/**
 * Register a chunk loader
 */
export declare function registerChunk(chunkPath: string, loader: () => Promise<Record<string, unknown>>): void;
/**
 * Register multiple chunk loaders
 */
export declare function registerChunks(chunks: Record<string, () => Promise<Record<string, unknown>>>): void;
/**
 * Create a QRL from options
 */
export declare function createQRL<T>(options: QRLOptions<T>): QRL<T>;
/**
 * The $ function - creates a lazy QRL reference.
 * This is the primary API for creating resumable code.
 *
 * @example
 * ```typescript
 * // Lazy event handler
 * const onClick = $(() => console.log('clicked'));
 *
 * // Lazy handler with captured state
 * const count = signal(0);
 * const increment = $((captures) => captures.count.set(c => c + 1), [count]);
 * ```
 */
export declare function $<T extends Function>(fn: T, captures?: unknown[], captureNames?: string[]): QRL<T>;
/**
 * Create a lazy component QRL
 */
export declare function component$<P = Record<string, unknown>>(component: (props: P) => unknown): QRLComponent<P>;
/**
 * Parse a serialized QRL string back into a QRL object
 */
export declare function parseQRL<T = unknown>(serialized: string): QRL<T>;
/**
 * Create a QRL event handler with type safety
 */
export declare function event$<E extends Event>(handler: (event: E) => void | Promise<void>, captures?: unknown[], captureNames?: string[]): QRLEventHandler<E>;
/**
 * Common event handler types
 */
export declare const onClick$: <T = HTMLElement>(handler: (event: MouseEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<MouseEvent>;
export declare const onInput$: <T = HTMLInputElement>(handler: (event: InputEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<InputEvent>;
export declare const onChange$: <T = HTMLInputElement>(handler: (event: Event, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<Event>;
export declare const onSubmit$: <T = HTMLFormElement>(handler: (event: SubmitEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<SubmitEvent>;
export declare const onKeyDown$: <T = HTMLElement>(handler: (event: KeyboardEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<KeyboardEvent>;
export declare const onKeyUp$: <T = HTMLElement>(handler: (event: KeyboardEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<KeyboardEvent>;
export declare const onFocus$: <T = HTMLElement>(handler: (event: FocusEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<FocusEvent>;
export declare const onBlur$: <T = HTMLElement>(handler: (event: FocusEvent, el?: T) => void | Promise<void>, captures?: unknown[]) => QRLEventHandler<FocusEvent>;
/**
 * Check if a value is a QRL
 */
export declare function isQRL(value: unknown): value is QRL;
/**
 * Get the serialized form of a QRL for embedding in HTML
 */
export declare function getQRLAttribute(qrl: QRL): string;
/**
 * Prefetch a QRL's chunk without resolving
 */
export declare function prefetchQRL(qrl: QRL): Promise<void>;
/**
 * Prefetch multiple QRLs in parallel
 */
export declare function prefetchQRLs(qrls: QRL[]): Promise<void>;
/**
 * Create a QRL that references an external module
 */
export declare function qrl<T>(chunk: string, symbol: string, captures?: unknown[]): QRL<T>;
/**
 * Inline a QRL - useful for SSR where we want immediate execution
 */
export declare function inlineQRL<T>(value: T): QRL<T>;
/**
 * Create a lazy signal reference
 */
export declare function signal$<T>(initialValue: T): QRL<{
    value: T;
    set: (v: T | ((prev: T) => T)) => void;
}>;
/**
 * Create a lazy computed/memo reference
 */
export declare function computed$<T>(computation: () => T, captures?: unknown[]): QRL<{
    (): T;
}>;
/**
 * Create a lazy task that runs on the server
 */
export declare function server$<T extends (...args: unknown[]) => unknown>(fn: T): QRL<T>;
/**
 * Create a lazy task that runs on the client
 */
export declare function browser$<T extends (...args: unknown[]) => unknown>(fn: T): QRL<T>;
/**
 * Create a lazy effect that runs after hydration
 */
export declare function useVisibleTask$<T>(fn: () => T | Promise<T>): QRL<() => T | Promise<T>>;
/**
 * Create a lazy task that runs on the server during SSR
 */
export declare function useTask$<T>(fn: () => T | Promise<T>): QRL<() => T | Promise<T>>;
//# sourceMappingURL=qrl.d.ts.map