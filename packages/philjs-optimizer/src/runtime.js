/**
 * Runtime for lazy loading symbols
 */
/**
 * Symbol loader class
 */
export class SymbolLoader {
    manifest;
    baseUrl;
    loadedChunks = new Set();
    loadingChunks = new Map();
    symbols = new Map();
    prefetching = new Set();
    customLoader;
    constructor(config) {
        this.manifest = config.manifest;
        this.baseUrl = config.baseUrl || '';
        this.customLoader = config.loader;
        // Auto-prefetch if enabled
        if (config.prefetch) {
            this.prefetchAll();
        }
    }
    /**
     * Load a symbol by ID
     */
    async load(symbolId) {
        // Return if already loaded
        if (this.symbols.has(symbolId)) {
            return this.symbols.get(symbolId);
        }
        // Use custom loader if provided
        if (this.customLoader) {
            const symbol = await this.customLoader(symbolId);
            this.symbols.set(symbolId, symbol);
            return symbol;
        }
        // Get chunk path from manifest
        const chunkPath = this.manifest.symbols[symbolId];
        if (!chunkPath) {
            throw new Error(`Symbol ${symbolId} not found in manifest`);
        }
        // Load the chunk
        await this.loadChunk(chunkPath);
        // Get the symbol from the loaded chunk
        const symbol = this.symbols.get(symbolId);
        if (!symbol) {
            throw new Error(`Symbol ${symbolId} not found after loading chunk`);
        }
        return symbol;
    }
    /**
     * Load a chunk
     */
    async loadChunk(chunkPath) {
        // Return if already loaded
        if (this.loadedChunks.has(chunkPath)) {
            return;
        }
        // Wait if already loading
        const loading = this.loadingChunks.get(chunkPath);
        if (loading) {
            return loading;
        }
        // Start loading
        const loadPromise = this.doLoadChunk(chunkPath);
        this.loadingChunks.set(chunkPath, loadPromise);
        try {
            await loadPromise;
            this.loadedChunks.add(chunkPath);
        }
        finally {
            this.loadingChunks.delete(chunkPath);
        }
    }
    /**
     * Actually load a chunk
     */
    async doLoadChunk(chunkPath) {
        const url = this.resolveUrl(chunkPath);
        try {
            // Dynamic import
            const module = await import(/* @vite-ignore */ url);
            // Extract symbols from the module
            const symbolIds = this.manifest.chunks[chunkPath] || [];
            for (const symbolId of symbolIds) {
                // Try to get the symbol from the module
                const symbol = module[symbolId] || module.default;
                if (symbol) {
                    this.symbols.set(symbolId, symbol);
                }
            }
        }
        catch (error) {
            console.error(`Failed to load chunk ${chunkPath}:`, error);
            throw error;
        }
    }
    /**
     * Resolve URL for a chunk
     */
    resolveUrl(chunkPath) {
        // Remove leading slash from chunkPath if present
        const cleanPath = chunkPath.startsWith('/') ? chunkPath.slice(1) : chunkPath;
        // Join with base URL
        if (this.baseUrl) {
            return `${this.baseUrl}/${cleanPath}`;
        }
        return `/${cleanPath}`;
    }
    /**
     * Prefetch a symbol
     */
    async prefetch(symbolId) {
        // Skip if already prefetching or loaded
        if (this.prefetching.has(symbolId) || this.symbols.has(symbolId)) {
            return;
        }
        this.prefetching.add(symbolId);
        try {
            await this.load(symbolId);
        }
        catch (error) {
            console.error(`Failed to prefetch symbol ${symbolId}:`, error);
        }
        finally {
            this.prefetching.delete(symbolId);
        }
    }
    /**
     * Prefetch multiple symbols
     */
    async prefetchMany(symbolIds) {
        await Promise.all(symbolIds.map((id) => this.prefetch(id)));
    }
    /**
     * Prefetch all symbols
     */
    async prefetchAll() {
        const symbolIds = Object.keys(this.manifest.symbols);
        await this.prefetchMany(symbolIds);
    }
    /**
     * Check if a symbol is loaded
     */
    isLoaded(symbolId) {
        return this.symbols.has(symbolId);
    }
    /**
     * Get all loaded symbols
     */
    getLoadedSymbols() {
        return Array.from(this.symbols.keys());
    }
    /**
     * Clear loaded symbols
     */
    clear() {
        this.symbols.clear();
        this.loadedChunks.clear();
        this.loadingChunks.clear();
        this.prefetching.clear();
    }
}
/**
 * Global symbol loader instance
 */
let globalLoader = null;
/**
 * Initialize the symbol loader
 */
export function initSymbolLoader(config) {
    globalLoader = new SymbolLoader(config);
    return globalLoader;
}
/**
 * Get the global symbol loader
 */
export function getSymbolLoader() {
    if (!globalLoader) {
        throw new Error('Symbol loader not initialized. Call initSymbolLoader() first.');
    }
    return globalLoader;
}
/**
 * Load a symbol using the global loader
 */
export async function loadSymbol(symbolId) {
    const loader = getSymbolLoader();
    return loader.load(symbolId);
}
/**
 * Prefetch a symbol using the global loader
 */
export async function prefetchSymbol(symbolId) {
    const loader = getSymbolLoader();
    return loader.prefetch(symbolId);
}
/**
 * Handler registration with error boundaries
 */
export class HandlerRunner {
    errorHandlers = new Map();
    retryCount = new Map();
    maxRetries = 3;
    /**
     * Execute a lazy handler with error handling
     */
    async execute(symbolId, args, context) {
        try {
            // Load the handler
            const handler = await loadSymbol(symbolId);
            if (typeof handler !== 'function') {
                throw new Error(`Symbol ${symbolId} is not a function`);
            }
            // Execute with context
            return context ? handler.apply(context, args) : handler(...args);
        }
        catch (error) {
            return this.handleError(symbolId, error, args, context);
        }
    }
    /**
     * Handle execution errors
     */
    async handleError(symbolId, error, args, context) {
        // Check retry count
        const retries = this.retryCount.get(symbolId) || 0;
        if (retries < this.maxRetries) {
            // Retry
            console.warn(`Retrying handler ${symbolId} (attempt ${retries + 1})`);
            this.retryCount.set(symbolId, retries + 1);
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
            return this.execute(symbolId, args, context);
        }
        // Call error handler if registered
        const errorHandler = this.errorHandlers.get(symbolId);
        if (errorHandler) {
            errorHandler(error);
        }
        // Reset retry count
        this.retryCount.set(symbolId, 0);
        // Rethrow
        throw error;
    }
    /**
     * Register an error handler for a symbol
     */
    onError(symbolId, handler) {
        this.errorHandlers.set(symbolId, handler);
    }
    /**
     * Set max retries
     */
    setMaxRetries(count) {
        this.maxRetries = count;
    }
    /**
     * Clear error handlers
     */
    clearErrorHandlers() {
        this.errorHandlers.clear();
        this.retryCount.clear();
    }
}
/**
 * Global handler runner
 */
let globalRunner = null;
/**
 * Get the global handler runner
 */
export function getHandlerRunner() {
    if (!globalRunner) {
        globalRunner = new HandlerRunner();
    }
    return globalRunner;
}
/**
 * Execute a handler with error boundaries
 */
export async function executeHandler(symbolId, args, context) {
    const runner = getHandlerRunner();
    return runner.execute(symbolId, args, context);
}
/**
 * Deferred execution queue
 */
export class DeferredQueue {
    queue = [];
    processing = false;
    /**
     * Add a deferred handler to the queue
     */
    defer(symbolId, args) {
        return new Promise((resolve, reject) => {
            this.queue.push({ symbolId, args, resolve, reject });
            if (!this.processing) {
                this.process();
            }
        });
    }
    /**
     * Process the queue
     */
    async process() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (!item)
                break;
            try {
                const result = await executeHandler(item.symbolId, item.args);
                item.resolve(result);
            }
            catch (error) {
                item.reject(error);
            }
        }
        this.processing = false;
    }
    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
        this.processing = false;
    }
    /**
     * Get queue length
     */
    get length() {
        return this.queue.length;
    }
}
/**
 * Global deferred queue
 */
let globalQueue = null;
/**
 * Get the global deferred queue
 */
export function getDeferredQueue() {
    if (!globalQueue) {
        globalQueue = new DeferredQueue();
    }
    return globalQueue;
}
/**
 * Defer handler execution
 */
export function deferHandler(symbolId, args) {
    const queue = getDeferredQueue();
    return queue.defer(symbolId, args);
}
//# sourceMappingURL=runtime.js.map