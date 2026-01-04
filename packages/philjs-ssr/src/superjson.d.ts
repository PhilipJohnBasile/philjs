/**
 * SuperJSON integration for philjs-ssr
 * Enables automatic serialization/deserialization of complex types in loaders and SSR.
 */
import { type SuperJSONResult, type SerializeOptions, type DeserializeOptions, type CustomTypeHandler } from '@philjs/core/superjson';
import type { Loader, Action } from './types.js';
/**
 * Options for SSR SuperJSON integration.
 */
export interface SSRSuperJSONOptions {
    /** Enable SuperJSON serialization (default: true) */
    enabled?: boolean;
    /** Custom type handlers */
    customTypes?: CustomTypeHandler[];
    /** Serialization options */
    serializeOptions?: Omit<SerializeOptions, 'customTypes'>;
    /** Deserialization options */
    deserializeOptions?: Omit<DeserializeOptions, 'customTypes'>;
}
/**
 * Serialize loader data for SSR.
 */
export declare function serializeLoaderData<T>(data: T, options?: SSRSuperJSONOptions): SuperJSONResult;
/**
 * Deserialize loader data on the client.
 */
export declare function deserializeLoaderData<T>(data: SuperJSONResult | unknown, options?: SSRSuperJSONOptions): T;
/**
 * Wrap a loader to automatically serialize its output.
 */
export declare function wrapLoaderWithSuperJSON<T>(loader: Loader<T>, options?: SSRSuperJSONOptions): Loader<SuperJSONResult>;
/**
 * Wrap an action to automatically serialize its output.
 */
export declare function wrapActionWithSuperJSON<T>(action: Action<T>, options?: SSRSuperJSONOptions): Action<SuperJSONResult>;
/**
 * Generate a script tag to inject serialized data into the page.
 */
export declare function generateHydrationScript(id: string, data: SuperJSONResult, options?: {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
    /** Include script tag wrapper (default: true) */
    includeScriptTag?: boolean;
    /** Make script async (default: false) */
    async?: boolean;
}): string;
/**
 * Generate inline script to restore data on the client.
 */
export declare function generateHydrationRestoreScript(options?: {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
}): string;
/**
 * Extract hydration data from the page.
 */
export declare function extractHydrationData<T>(id: string, options?: SSRSuperJSONOptions & {
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
}): T | null;
/**
 * Inject loader data into HTML response.
 */
export declare function injectLoaderData(html: string, loaderData: Record<string, SuperJSONResult>, options?: {
    /** Where to inject (default: before </head>) */
    position?: 'head' | 'body-start' | 'body-end';
    /** Variable name in window object (default: '__LOADER_DATA__') */
    globalName?: string;
}): string;
/**
 * Create a loader data serializer for SSR.
 */
export declare function createLoaderDataSerializer(options?: SSRSuperJSONOptions): {
    /**
     * Add loader data to be serialized.
     */
    add<T>(id: string, data: T): void;
    /**
     * Get all loader data.
     */
    getAll(): Record<string, SuperJSONResult>;
    /**
     * Generate HTML script tags for all loader data.
     */
    toHTML(htmlOptions?: Parameters<typeof injectLoaderData>[2]): string;
    /**
     * Inject into HTML.
     */
    inject(html: string, htmlOptions?: Parameters<typeof injectLoaderData>[2]): string;
    /**
     * Clear all loader data.
     */
    clear(): void;
};
/**
 * Create a streaming loader data serializer.
 */
export declare function createStreamingLoaderSerializer(options?: SSRSuperJSONOptions): {
    /**
     * Serialize loader data as a stream chunk.
     */
    serializeChunk<T>(id: string, data: T): string;
    /**
     * Create a boundary marker for streaming.
     */
    createBoundary(id: string): {
        start: string;
        end: string;
    };
};
/**
 * Create a client-side loader data accessor.
 */
export declare function createLoaderDataAccessor(options?: SSRSuperJSONOptions): {
    /**
     * Get loader data by ID.
     */
    get<T>(id: string): T | null;
    /**
     * Set loader data (for client-side navigation).
     */
    set<T>(id: string, data: T): void;
    /**
     * Clear cache.
     */
    clear(): void;
    /**
     * Clear specific loader data.
     */
    delete(id: string): void;
};
/**
 * Symbol to mark loaders with SuperJSON enabled.
 */
export declare const SUPERJSON_LOADER: unique symbol;
/**
 * Mark a loader as using SuperJSON.
 */
export declare function superJSONLoader<T>(loader: Loader<T>, options?: SSRSuperJSONOptions): Loader<T> & {
    [SUPERJSON_LOADER]: SSRSuperJSONOptions;
};
/**
 * Mark an action as using SuperJSON.
 */
export declare function superJSONAction<T>(action: Action<T>, options?: SSRSuperJSONOptions): Action<T> & {
    [SUPERJSON_LOADER]: SSRSuperJSONOptions;
};
/**
 * Check if a loader has SuperJSON enabled.
 */
export declare function hasSuperJSONLoader(loader: Loader<unknown>): loader is Loader<unknown> & {
    [SUPERJSON_LOADER]: SSRSuperJSONOptions;
};
/**
 * Get SuperJSON options from a loader.
 */
export declare function getSuperJSONLoaderOptions(loader: Loader<unknown>): SSRSuperJSONOptions | null;
//# sourceMappingURL=superjson.d.ts.map