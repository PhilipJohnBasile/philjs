/**
 * Performance optimizations for SuperJSON
 * - Lazy deserialization
 * - Streaming support
 * - Compression for large payloads
 */
import { type SuperJSONResult, type SerializeOptions, type DeserializeOptions } from './superjson.js';
/**
 * Compression algorithm interface.
 */
export interface CompressionAlgorithm {
    /** Compress data */
    compress(data: string): Promise<Uint8Array> | Uint8Array;
    /** Decompress data */
    decompress(data: Uint8Array): Promise<string> | string;
    /** Algorithm name */
    name: string;
}
/**
 * Compressed SuperJSON result.
 */
export interface CompressedSuperJSONResult {
    /** Compressed data */
    compressed: number[];
    /** Compression algorithm used */
    algorithm: string;
    /** Original size (for metrics) */
    originalSize?: number;
}
/**
 * Check if a result is compressed.
 */
export declare function isCompressed(result: unknown): result is CompressedSuperJSONResult;
/**
 * Built-in compression using native browser APIs (when available).
 */
export declare const NativeCompression: CompressionAlgorithm;
/**
 * Simple LZ-based compression (fallback for environments without native compression).
 */
export declare const LZCompression: CompressionAlgorithm;
/**
 * Serialize with compression.
 */
export declare function serializeWithCompression(data: unknown, options?: SerializeOptions & {
    compression?: CompressionAlgorithm;
    /** Minimum size to compress (bytes, default: 1024) */
    minCompressSize?: number;
}): Promise<CompressedSuperJSONResult | SuperJSONResult>;
/**
 * Deserialize with decompression.
 */
export declare function deserializeWithDecompression<T = unknown>(result: CompressedSuperJSONResult | SuperJSONResult, options?: DeserializeOptions & {
    compression?: CompressionAlgorithm;
}): Promise<T>;
/**
 * Stream chunk for progressive deserialization.
 */
export interface StreamChunk {
    /** Path to the data in the object tree */
    path: string[];
    /** Serialized value */
    value: SuperJSONResult;
    /** Whether this is the final chunk */
    final?: boolean;
}
/**
 * Create a streaming deserializer.
 */
export declare class StreamingDeserializer<T> {
    private chunks;
    private options;
    constructor(options?: DeserializeOptions);
    /**
     * Add a chunk to the deserializer.
     */
    addChunk(chunk: StreamChunk): void;
    /**
     * Get the current state (partial or complete).
     */
    getState(): Partial<T>;
    /**
     * Get a specific value by path.
     */
    get(path: string[]): unknown | undefined;
    /**
     * Check if a path has been received.
     */
    has(path: string[]): boolean;
    /**
     * Clear all chunks.
     */
    clear(): void;
}
/**
 * Create a streaming serializer.
 */
export declare class StreamingSerializer {
    private options;
    constructor(options?: SerializeOptions);
    /**
     * Serialize data into chunks.
     */
    serialize(data: unknown, chunkSize?: number): Generator<StreamChunk>;
}
/**
 * Lazy-deserialized value wrapper.
 */
export declare class LazyValue<T> {
    private deserialized?;
    private readonly serialized;
    private readonly options;
    constructor(serialized: SuperJSONResult, options?: DeserializeOptions);
    /**
     * Get the deserialized value (deserializes on first access).
     */
    get(): T;
    /**
     * Check if the value has been deserialized.
     */
    isDeserialized(): boolean;
    /**
     * Get the serialized form.
     */
    getSerialized(): SuperJSONResult;
    /**
     * Pre-deserialize the value.
     */
    preload(): void;
}
/**
 * Create a lazy value.
 */
export declare function lazy<T>(serialized: SuperJSONResult, options?: DeserializeOptions): LazyValue<T>;
/**
 * Create a lazy object with lazy properties.
 */
export declare function lazyObject<T extends Record<string, unknown>>(serialized: Record<string, SuperJSONResult>, options?: DeserializeOptions): Record<keyof T, LazyValue<T[keyof T]>>;
/**
 * Performance metrics for serialization/deserialization.
 */
export interface PerformanceMetrics {
    /** Serialization time (ms) */
    serializeTime?: number;
    /** Deserialization time (ms) */
    deserializeTime?: number;
    /** Original data size (bytes) */
    originalSize?: number;
    /** Serialized size (bytes) */
    serializedSize?: number;
    /** Compressed size (bytes, if compression used) */
    compressedSize?: number;
    /** Compression ratio (if compression used) */
    compressionRatio?: number;
}
/**
 * Serialize with performance tracking.
 */
export declare function serializeWithMetrics(data: unknown, options?: SerializeOptions & {
    compression?: CompressionAlgorithm;
}): Promise<{
    result: CompressedSuperJSONResult | SuperJSONResult;
    metrics: PerformanceMetrics;
}>;
/**
 * Deserialize with performance tracking.
 */
export declare function deserializeWithMetrics<T = unknown>(result: CompressedSuperJSONResult | SuperJSONResult, options?: DeserializeOptions & {
    compression?: CompressionAlgorithm;
}): Promise<{
    data: T;
    metrics: PerformanceMetrics;
}>;
//# sourceMappingURL=superjson-perf.d.ts.map