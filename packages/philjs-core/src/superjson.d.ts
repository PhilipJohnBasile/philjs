/**
 * SuperJSON-style serialization for PhilJS
 * Handles complex data types that JSON doesn't support natively:
 * - Date objects
 * - Map and Set
 * - RegExp
 * - BigInt
 * - undefined
 * - Binary data (Buffer, Uint8Array, etc.)
 * - Custom type registration
 *
 * @example
 * ```ts
 * import { serialize, deserialize } from '@philjs/core/superjson';
 *
 * const data = {
 *   date: new Date(),
 *   map: new Map([['key', 'value']]),
 *   regex: /test/gi,
 *   bigint: 9007199254740991n,
 *   undef: undefined,
 * };
 *
 * const serialized = serialize(data);
 * const deserialized = deserialize(serialized);
 * ```
 */
/**
 * Metadata about transformed values in the serialized output.
 */
export interface SerializationMeta {
    /** Map of JSON paths to type transformations */
    values?: Record<string, string | string[]>;
    /** Reference deduplication map */
    referenceMap?: Record<string, string[]>;
}
/**
 * Serialized data with metadata for restoration.
 */
export interface SuperJSONResult {
    /** The JSON-serializable data */
    json: unknown;
    /** Metadata about transformations */
    meta?: SerializationMeta;
}
/**
 * Options for serialization.
 */
export interface SerializeOptions {
    /** Enable reference deduplication (default: true) */
    dedupe?: boolean;
    /** Maximum depth to serialize (default: Infinity) */
    maxDepth?: number;
    /** Custom type handlers */
    customTypes?: CustomTypeHandler[];
}
/**
 * Options for deserialization.
 */
export interface DeserializeOptions {
    /** Custom type handlers */
    customTypes?: CustomTypeHandler[];
}
/**
 * Custom type handler for extending serialization.
 */
export interface CustomTypeHandler<T = unknown> {
    /** Unique name for this type */
    name: string;
    /** Check if value is of this type */
    isApplicable: (value: unknown) => value is T;
    /** Serialize the value */
    serialize: (value: T) => unknown;
    /** Deserialize the value */
    deserialize: (value: unknown) => T;
    /** Priority (higher = checked first, default: 0) */
    priority?: number;
}
/**
 * Serialize data with support for complex types.
 */
export declare function serialize(data: unknown, options?: SerializeOptions): SuperJSONResult;
/**
 * Deserialize data with type restoration.
 */
export declare function deserialize<T = unknown>(result: SuperJSONResult, options?: DeserializeOptions): T;
/**
 * Serialize and stringify to JSON string.
 */
export declare function stringify(data: unknown, options?: SerializeOptions): string;
/**
 * Parse JSON string and deserialize.
 */
export declare function parse<T = unknown>(json: string, options?: DeserializeOptions): T;
/**
 * Check if a value needs SuperJSON serialization.
 */
export declare function needsSerialization(value: unknown): boolean;
/**
 * Register a custom type handler globally.
 */
export declare function registerCustomType(handler: CustomTypeHandler): void;
/**
 * Get all registered custom type handlers.
 */
export declare function getCustomTypes(): CustomTypeHandler[];
/**
 * Clear all registered custom type handlers.
 */
export declare function clearCustomTypes(): void;
/**
 * Create a serializer/deserializer with custom types baked in.
 */
export declare function createSuperJSON(customTypes?: CustomTypeHandler[]): {
    serialize: (data: unknown, options?: Omit<SerializeOptions, "customTypes">) => SuperJSONResult;
    deserialize: <T = unknown>(result: SuperJSONResult, options?: Omit<DeserializeOptions, "customTypes">) => T;
    stringify: (data: unknown, options?: Omit<SerializeOptions, "customTypes">) => string;
    parse: <T = unknown>(json: string, options?: Omit<DeserializeOptions, "customTypes">) => T;
};
//# sourceMappingURL=superjson.d.ts.map