/**
 * State Serialization Utilities
 *
 * Provides comprehensive serialization/deserialization for PhilJS signals and state.
 * Supports multiple serialization strategies for different use cases:
 * - SSR hydration
 * - LocalStorage persistence
 * - URL state synchronization
 * - State debugging and devtools
 */
import { type Signal } from './signals.js';
export type SerializableValue = null | undefined | boolean | number | string | Date | RegExp | Error | SerializableArray | SerializableObject | Signal<any>;
export interface SerializableArray extends Array<SerializableValue> {
}
export interface SerializableObject {
    [key: string]: SerializableValue;
}
export interface SerializedState {
    type: 'signal' | 'computed' | 'primitive' | 'array' | 'object' | 'date' | 'regexp' | 'error' | 'undefined' | 'null';
    value: any;
    metadata?: {
        signalId?: string;
        deps?: string[];
        timestamp?: number;
    };
}
export interface SerializationOptions {
    /**
     * Include signals in serialization
     */
    signals?: boolean;
    /**
     * Include computed values in serialization
     */
    computed?: boolean;
    /**
     * Preserve types (Date, RegExp, Error, etc.)
     */
    preserveTypes?: boolean;
    /**
     * Include metadata (timestamps, dependencies)
     */
    metadata?: boolean;
    /**
     * Maximum depth for nested objects
     */
    maxDepth?: number;
    /**
     * Custom serializers by type
     */
    serializers?: Map<string, (value: any) => any>;
    /**
     * Custom deserializers by type
     */
    deserializers?: Map<string, (value: any) => any>;
    /**
     * Ignore these keys
     */
    ignore?: string[];
    /**
     * Pretty print JSON
     */
    pretty?: boolean;
}
export interface HydrationMap {
    [key: string]: any;
}
/**
 * Serialize any value to a transportable format
 */
export declare function serialize(value: any, options?: SerializationOptions, depth?: number): SerializedState;
/**
 * Deserialize a serialized value
 */
export declare function deserialize(serialized: SerializedState, options?: SerializationOptions): any;
/**
 * Serialize to JSON string
 */
export declare function toJSON(value: any, options?: SerializationOptions): string;
/**
 * Deserialize from JSON string
 */
export declare function fromJSON(json: string, options?: SerializationOptions): any;
/**
 * Serialize state for SSR hydration
 */
export declare function serializeForHydration(state: Record<string, any>, options?: SerializationOptions): string;
/**
 * Hydrate state from serialized SSR data
 */
export declare function hydrateFromSSR(serialized: string, options?: SerializationOptions): HydrationMap;
/**
 * Inject hydration data into HTML
 */
export declare function injectHydrationData(html: string, data: Record<string, any>, options?: SerializationOptions): string;
/**
 * Extract hydration data from HTML
 */
export declare function extractHydrationData(options?: SerializationOptions): HydrationMap | null;
/**
 * Persist state to localStorage
 */
export declare function persistToLocalStorage(key: string, value: any, options?: SerializationOptions): void;
/**
 * Restore state from localStorage
 */
export declare function restoreFromLocalStorage(key: string, options?: SerializationOptions): any;
/**
 * Create a persistent signal that syncs with localStorage
 */
export declare function persistentSignal<T>(key: string, initialValue: T, options?: SerializationOptions): Signal<T>;
/**
 * Serialize state to URL search params
 */
export declare function serializeToURL(state: Record<string, any>, options?: SerializationOptions): string;
/**
 * Deserialize state from URL search params
 */
export declare function deserializeFromURL(searchParams: string | URLSearchParams, options?: SerializationOptions): Record<string, any>;
/**
 * Create a signal that syncs with URL search params
 */
export declare function urlSignal<T>(key: string, initialValue: T, options?: SerializationOptions): Signal<T>;
/**
 * Clear all registered signals
 */
export declare function clearSignalRegistry(): void;
/**
 * Get serialization stats
 */
export declare function getSerializationStats(value: any): {
    size: number;
    signalCount: number;
    objectCount: number;
    arrayCount: number;
    depth: number;
};
/**
 * Deep clone a value using serialization
 */
export declare function deepClone<T>(value: T, options?: SerializationOptions): T;
/**
 * Compare two values for deep equality
 */
export declare function deepEqual(a: any, b: any): boolean;
//# sourceMappingURL=serialization.d.ts.map