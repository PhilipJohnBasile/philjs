/**
 * Runtime for lazy loading symbols
 */

import type { RuntimeConfig, ChunkManifest, LazyHandler } from './types.js';

/**
 * Symbol loader class
 */
export class SymbolLoader {
  private manifest: ChunkManifest;
  private baseUrl: string;
  private loadedChunks = new Set<string>();
  private loadingChunks = new Map<string, Promise<void>>();
  private symbols = new Map<string, any>();
  private prefetching = new Set<string>();
  private customLoader?: ((symbolId: string) => Promise<any>) | undefined;

  constructor(config: RuntimeConfig) {
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
  async load(symbolId: string): Promise<any> {
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
  private async loadChunk(chunkPath: string): Promise<void> {
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
    } finally {
      this.loadingChunks.delete(chunkPath);
    }
  }

  /**
   * Actually load a chunk
   */
  private async doLoadChunk(chunkPath: string): Promise<void> {
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
    } catch (error) {
      console.error(`Failed to load chunk ${chunkPath}:`, error);
      throw error;
    }
  }

  /**
   * Resolve URL for a chunk
   */
  private resolveUrl(chunkPath: string): string {
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
  async prefetch(symbolId: string): Promise<void> {
    // Skip if already prefetching or loaded
    if (this.prefetching.has(symbolId) || this.symbols.has(symbolId)) {
      return;
    }

    this.prefetching.add(symbolId);

    try {
      await this.load(symbolId);
    } catch (error) {
      console.error(`Failed to prefetch symbol ${symbolId}:`, error);
    } finally {
      this.prefetching.delete(symbolId);
    }
  }

  /**
   * Prefetch multiple symbols
   */
  async prefetchMany(symbolIds: string[]): Promise<void> {
    await Promise.all(symbolIds.map((id) => this.prefetch(id)));
  }

  /**
   * Prefetch all symbols
   */
  async prefetchAll(): Promise<void> {
    const symbolIds = Object.keys(this.manifest.symbols);
    await this.prefetchMany(symbolIds);
  }

  /**
   * Check if a symbol is loaded
   */
  isLoaded(symbolId: string): boolean {
    return this.symbols.has(symbolId);
  }

  /**
   * Get all loaded symbols
   */
  getLoadedSymbols(): string[] {
    return Array.from(this.symbols.keys());
  }

  /**
   * Clear loaded symbols
   */
  clear(): void {
    this.symbols.clear();
    this.loadedChunks.clear();
    this.loadingChunks.clear();
    this.prefetching.clear();
  }
}

/**
 * Global symbol loader instance
 */
let globalLoader: SymbolLoader | null = null;

/**
 * Initialize the symbol loader
 */
export function initSymbolLoader(config: RuntimeConfig): SymbolLoader {
  globalLoader = new SymbolLoader(config);
  return globalLoader;
}

/**
 * Get the global symbol loader
 */
export function getSymbolLoader(): SymbolLoader {
  if (!globalLoader) {
    throw new Error('Symbol loader not initialized. Call initSymbolLoader() first.');
  }
  return globalLoader;
}

/**
 * Load a symbol using the global loader
 */
export async function loadSymbol(symbolId: string): Promise<any> {
  const loader = getSymbolLoader();
  return loader.load(symbolId);
}

/**
 * Prefetch a symbol using the global loader
 */
export async function prefetchSymbol(symbolId: string): Promise<void> {
  const loader = getSymbolLoader();
  return loader.prefetch(symbolId);
}

/**
 * Handler registration with error boundaries
 */
export class HandlerRunner {
  private errorHandlers = new Map<string, (error: Error) => void>();
  private retryCount = new Map<string, number>();
  private maxRetries = 3;

  /**
   * Execute a lazy handler with error handling
   */
  async execute(
    symbolId: string,
    args: any[],
    context?: any
  ): Promise<any> {
    try {
      // Load the handler
      const handler = await loadSymbol(symbolId);

      if (typeof handler !== 'function') {
        throw new Error(`Symbol ${symbolId} is not a function`);
      }

      // Execute with context
      return context ? handler.apply(context, args) : handler(...args);
    } catch (error) {
      return this.handleError(symbolId, error as Error, args, context);
    }
  }

  /**
   * Handle execution errors
   */
  private async handleError(
    symbolId: string,
    error: Error,
    args: any[],
    context?: any
  ): Promise<any> {
    // Check retry count
    const retries = this.retryCount.get(symbolId) || 0;

    if (retries < this.maxRetries) {
      // Retry
      console.warn(`Retrying handler ${symbolId} (attempt ${retries + 1})`);
      this.retryCount.set(symbolId, retries + 1);

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retries) * 100)
      );

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
  onError(symbolId: string, handler: (error: Error) => void): void {
    this.errorHandlers.set(symbolId, handler);
  }

  /**
   * Set max retries
   */
  setMaxRetries(count: number): void {
    this.maxRetries = count;
  }

  /**
   * Clear error handlers
   */
  clearErrorHandlers(): void {
    this.errorHandlers.clear();
    this.retryCount.clear();
  }
}

/**
 * Global handler runner
 */
let globalRunner: HandlerRunner | null = null;

/**
 * Get the global handler runner
 */
export function getHandlerRunner(): HandlerRunner {
  if (!globalRunner) {
    globalRunner = new HandlerRunner();
  }
  return globalRunner;
}

/**
 * Execute a handler with error boundaries
 */
export async function executeHandler(
  symbolId: string,
  args: any[],
  context?: any
): Promise<any> {
  const runner = getHandlerRunner();
  return runner.execute(symbolId, args, context);
}

/**
 * Deferred execution queue
 */
export class DeferredQueue {
  private queue: Array<{
    symbolId: string;
    args: any[];
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;

  /**
   * Add a deferred handler to the queue
   */
  defer(symbolId: string, args: any[]): Promise<any> {
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
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await executeHandler(item.symbolId, item.args);
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.processing = false;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }
}

/**
 * Global deferred queue
 */
let globalQueue: DeferredQueue | null = null;

/**
 * Get the global deferred queue
 */
export function getDeferredQueue(): DeferredQueue {
  if (!globalQueue) {
    globalQueue = new DeferredQueue();
  }
  return globalQueue;
}

/**
 * Defer handler execution
 */
export function deferHandler(symbolId: string, args: any[]): Promise<any> {
  const queue = getDeferredQueue();
  return queue.defer(symbolId, args);
}
