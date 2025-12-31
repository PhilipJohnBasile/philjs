/**
 * Lazy Component Loader for Resumability
 *
 * This module handles lazy loading of component code on interaction.
 * Components are not loaded until the user interacts with them,
 * achieving zero JavaScript execution until interaction.
 *
 * @example
 * ```typescript
 * // Register components for lazy loading
 * registerLazyComponent('Counter', () => import('./Counter'));
 *
 * // On interaction, the loader fetches and hydrates
 * await loadComponent('Counter', element);
 * ```
 */
import type { QRL } from './qrl.js';
/**
 * A lazy component loader function
 */
export type ComponentLoader = () => Promise<{
    default?: unknown;
    [key: string]: unknown;
}>;
/**
 * Component definition with metadata
 */
export interface LazyComponent {
    /** Component identifier */
    id: string;
    /** Loader function */
    loader: ComponentLoader;
    /** Preloaded module (after prefetch) */
    preloaded?: Promise<unknown>;
    /** Resolved component */
    resolved?: unknown;
    /** Loading state */
    status: 'idle' | 'loading' | 'loaded' | 'error';
    /** Error if loading failed */
    error?: Error;
}
/**
 * Loader configuration
 */
export interface LoaderConfig {
    /** Base path for chunk loading */
    basePath: string;
    /** Custom chunk resolver */
    resolver?: (chunkPath: string) => Promise<Record<string, unknown>>;
    /** Enable prefetching on hover/focus */
    prefetchOnHover: boolean;
    /** Prefetch timeout in ms */
    prefetchTimeout: number;
    /** Maximum concurrent loads */
    maxConcurrent: number;
    /** Retry failed loads */
    retryOnError: boolean;
    /** Maximum retries */
    maxRetries: number;
    /** Retry delay in ms */
    retryDelay: number;
    /** Development mode */
    isDev: boolean;
}
/**
 * Configure the lazy loader
 */
export declare function configureLoader(options: Partial<LoaderConfig>): void;
/**
 * Get current loader configuration
 */
export declare function getLoaderConfig(): Readonly<LoaderConfig>;
/**
 * Register a component for lazy loading
 */
export declare function registerLazyComponent(id: string, loader: ComponentLoader): LazyComponent;
/**
 * Register multiple components
 */
export declare function registerLazyComponents(components: Record<string, ComponentLoader>): void;
/**
 * Get a registered component
 */
export declare function getLazyComponent(id: string): LazyComponent | undefined;
/**
 * Check if a component is registered
 */
export declare function hasLazyComponent(id: string): boolean;
/**
 * Prefetch a chunk without blocking
 */
export declare function prefetchChunk(chunkPath: string): void;
/**
 * Load a component by ID
 */
export declare function loadComponent(id: string): Promise<unknown>;
/**
 * Load a component from a QRL string
 */
export declare function loadFromQRL(qrl: string | QRL): Promise<unknown>;
/**
 * Load and hydrate an element.
 *
 * This function:
 * 1. Checks if the element is already hydrated
 * 2. Retrieves serialized state from the DOM
 * 3. Loads the component code lazily
 * 4. Deserializes props and state
 * 5. Hydrates the component into the element
 * 6. Marks the element as hydrated
 *
 * @param element - The DOM element to hydrate
 * @param options - Hydration options
 * @param options.force - Force reload even if already hydrated
 * @param options.state - Additional state to pass to the component
 *
 * @throws {Error} If component loading fails
 *
 * @example
 * ```typescript
 * const element = document.querySelector('[data-qid="q0"]');
 * await loadAndHydrate(element);
 * ```
 */
export declare function loadAndHydrate(element: Element, options?: {
    /** Force reload even if already hydrated */
    force?: boolean;
    /** State to pass to the component */
    state?: Record<string, unknown>;
}): Promise<void>;
/**
 * Prefetch a component for faster loading
 */
export declare function prefetchComponent(id: string): void;
/**
 * Prefetch all visible components
 */
export declare function prefetchVisibleComponents(): void;
/**
 * Load and invoke an event handler
 */
export declare function loadAndInvokeHandler(qrl: string, event: Event, element: Element): Promise<void>;
/**
 * Queue a component load
 */
export declare function queueLoad(id: string, element: Element, qrl: string): Promise<unknown>;
/**
 * Initialize the loader on the client
 */
export declare function initLoader(): void;
/**
 * Get loading statistics
 */
export declare function getLoaderStats(): {
    registered: number;
    loaded: number;
    loading: number;
    queued: number;
    cached: number;
};
/**
 * Clear all caches (useful for testing/HMR)
 */
export declare function clearLoaderCache(): void;
/**
 * Wait for all pending loads to complete
 */
export declare function waitForLoads(): Promise<void>;
//# sourceMappingURL=loader.d.ts.map