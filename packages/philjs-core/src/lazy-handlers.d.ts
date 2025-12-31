/**
 * Qwik-style lazy event handlers
 * Enables automatic code splitting per handler with progressive enhancement
 */
/**
 * Lazy handler reference
 */
export interface LazyHandler<T extends (...args: any[]) => any = (...args: any[]) => any> {
    /** Symbol ID for lazy loading */
    symbolId: string;
    /** Original handler function (for server-side) */
    handler: T;
    /** Module path for dynamic import */
    modulePath?: string;
    /** Whether the handler has been loaded */
    loaded: boolean;
}
/**
 * Event handler registry
 */
declare class HandlerRegistry {
    private handlers;
    private pendingLoads;
    /**
     * Register a lazy handler
     */
    register<T extends (...args: any[]) => any>(symbolId: string, handler: T, modulePath?: string): void;
    /**
     * Get a handler by symbol ID
     */
    get(symbolId: string): LazyHandler | undefined;
    /**
     * Load a handler dynamically
     */
    load(symbolId: string): Promise<(...args: any[]) => any>;
    /**
     * Load a module dynamically
     */
    private loadModule;
    /**
     * Check if a handler is loaded
     */
    isLoaded(symbolId: string): boolean;
    /**
     * Clear all handlers
     */
    clear(): void;
    /**
     * Get all registered handlers
     */
    getAll(): LazyHandler[];
}
/**
 * Global handler registry
 */
export declare const handlerRegistry: HandlerRegistry;
/**
 * $ - Lazy handler wrapper (Qwik-style)
 * Wraps a function for automatic lazy loading
 *
 * @example
 * ```tsx
 * <button onClick={$(() => console.log('clicked'))}>
 *   Click me
 * </button>
 * ```
 */
export declare function $<T extends (...args: any[]) => any>(handler: T): LazyHandler<T>;
/**
 * $$() - Inline lazy handler with explicit symbol ID
 * Useful when you need to reference the same handler in multiple places
 *
 * @example
 * ```tsx
 * const onClick = $$('handleClick', () => console.log('clicked'));
 * <button onClick={onClick}>Click me</button>
 * ```
 */
export declare function $$<T extends (...args: any[]) => any>(symbolId: string, handler: T): LazyHandler<T>;
/**
 * Load and execute a lazy handler
 */
export declare function loadHandler(symbolId: string, ...args: any[]): Promise<any>;
/**
 * Create a lazy event handler that loads on interaction
 */
export declare function createLazyEventHandler(lazyHandler: LazyHandler): (event: Event) => void;
/**
 * Prefetch a lazy handler
 */
export declare function prefetchHandler(symbolId: string): Promise<void>;
/**
 * Check if a value is a lazy handler
 */
export declare function isLazyHandler(value: any): value is LazyHandler;
/**
 * Convert lazy handlers in props to actual event handlers
 */
export declare function resolveLazyHandlers<T extends Record<string, any>>(props: T): T;
/**
 * Server-side handler extraction
 * Extracts serializable handler references for SSR
 */
export declare function serializeLazyHandlers<T extends Record<string, any>>(props: T): {
    props: T;
    handlers: Record<string, string>;
};
/**
 * Client-side handler hydration
 * Reattaches lazy handlers during hydration
 */
export declare function hydrateLazyHandlers(element: Element): void;
/**
 * Progressive enhancement for forms
 * Enhances forms with lazy handlers while maintaining functionality
 */
export declare function enhanceForm(form: HTMLFormElement): void;
export {};
//# sourceMappingURL=lazy-handlers.d.ts.map