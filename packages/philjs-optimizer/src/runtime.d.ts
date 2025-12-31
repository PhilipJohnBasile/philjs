/**
 * Runtime for lazy loading symbols
 */
import type { RuntimeConfig } from './types.js';
/**
 * Symbol loader class
 */
export declare class SymbolLoader {
    private manifest;
    private baseUrl;
    private loadedChunks;
    private loadingChunks;
    private symbols;
    private prefetching;
    private customLoader?;
    constructor(config: RuntimeConfig);
    /**
     * Load a symbol by ID
     */
    load(symbolId: string): Promise<any>;
    /**
     * Load a chunk
     */
    private loadChunk;
    /**
     * Actually load a chunk
     */
    private doLoadChunk;
    /**
     * Resolve URL for a chunk
     */
    private resolveUrl;
    /**
     * Prefetch a symbol
     */
    prefetch(symbolId: string): Promise<void>;
    /**
     * Prefetch multiple symbols
     */
    prefetchMany(symbolIds: string[]): Promise<void>;
    /**
     * Prefetch all symbols
     */
    prefetchAll(): Promise<void>;
    /**
     * Check if a symbol is loaded
     */
    isLoaded(symbolId: string): boolean;
    /**
     * Get all loaded symbols
     */
    getLoadedSymbols(): string[];
    /**
     * Clear loaded symbols
     */
    clear(): void;
}
/**
 * Initialize the symbol loader
 */
export declare function initSymbolLoader(config: RuntimeConfig): SymbolLoader;
/**
 * Get the global symbol loader
 */
export declare function getSymbolLoader(): SymbolLoader;
/**
 * Load a symbol using the global loader
 */
export declare function loadSymbol(symbolId: string): Promise<any>;
/**
 * Prefetch a symbol using the global loader
 */
export declare function prefetchSymbol(symbolId: string): Promise<void>;
/**
 * Handler registration with error boundaries
 */
export declare class HandlerRunner {
    private errorHandlers;
    private retryCount;
    private maxRetries;
    /**
     * Execute a lazy handler with error handling
     */
    execute(symbolId: string, args: any[], context?: any): Promise<any>;
    /**
     * Handle execution errors
     */
    private handleError;
    /**
     * Register an error handler for a symbol
     */
    onError(symbolId: string, handler: (error: Error) => void): void;
    /**
     * Set max retries
     */
    setMaxRetries(count: number): void;
    /**
     * Clear error handlers
     */
    clearErrorHandlers(): void;
}
/**
 * Get the global handler runner
 */
export declare function getHandlerRunner(): HandlerRunner;
/**
 * Execute a handler with error boundaries
 */
export declare function executeHandler(symbolId: string, args: any[], context?: any): Promise<any>;
/**
 * Deferred execution queue
 */
export declare class DeferredQueue {
    private queue;
    private processing;
    /**
     * Add a deferred handler to the queue
     */
    defer(symbolId: string, args: any[]): Promise<any>;
    /**
     * Process the queue
     */
    private process;
    /**
     * Clear the queue
     */
    clear(): void;
    /**
     * Get queue length
     */
    get length(): number;
}
/**
 * Get the global deferred queue
 */
export declare function getDeferredQueue(): DeferredQueue;
/**
 * Defer handler execution
 */
export declare function deferHandler(symbolId: string, args: any[]): Promise<any>;
//# sourceMappingURL=runtime.d.ts.map