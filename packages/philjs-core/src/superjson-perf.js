/**
 * Performance optimizations for SuperJSON
 * - Lazy deserialization
 * - Streaming support
 * - Compression for large payloads
 */
import { serialize, deserialize, } from './superjson.js';
/**
 * Check if a result is compressed.
 */
export function isCompressed(result) {
    return (typeof result === 'object' &&
        result !== null &&
        'compressed' in result &&
        'algorithm' in result &&
        Array.isArray(result.compressed));
}
/**
 * Built-in compression using native browser APIs (when available).
 */
export const NativeCompression = {
    name: 'gzip',
    async compress(data) {
        // Check for CompressionStream API (modern browsers)
        if (typeof CompressionStream !== 'undefined') {
            const stream = new Blob([data]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
            const blob = await new Response(compressedStream).blob();
            return new Uint8Array(await blob.arrayBuffer());
        }
        // Fallback: No compression
        const encoder = new TextEncoder();
        return encoder.encode(data);
    },
    async decompress(data) {
        // Check for DecompressionStream API (modern browsers)
        if (typeof DecompressionStream !== 'undefined') {
            const stream = new Blob([data]).stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            return await new Response(decompressedStream).text();
        }
        // Fallback: No decompression
        const decoder = new TextDecoder();
        return decoder.decode(data);
    },
};
/**
 * Simple LZ-based compression (fallback for environments without native compression).
 */
export const LZCompression = {
    name: 'lz',
    compress(data) {
        // Simple LZ77-like compression
        const dict = {};
        const result = [];
        let dictSize = 256;
        // Initialize dictionary with single characters
        for (let i = 0; i < 256; i++) {
            dict[String.fromCharCode(i)] = i;
        }
        let current = '';
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            const combined = current + char;
            if (dict[combined] !== undefined) {
                current = combined;
            }
            else {
                result.push(dict[current]);
                dict[combined] = dictSize++;
                current = char;
            }
        }
        if (current) {
            result.push(dict[current]);
        }
        // Convert to Uint8Array (simple 16-bit encoding)
        const compressed = new Uint8Array(result.length * 2);
        for (let i = 0; i < result.length; i++) {
            compressed[i * 2] = result[i] & 0xff;
            compressed[i * 2 + 1] = (result[i] >> 8) & 0xff;
        }
        return compressed;
    },
    decompress(data) {
        // Decode 16-bit values
        const codes = [];
        for (let i = 0; i < data.length; i += 2) {
            codes.push(data[i] | (data[i + 1] << 8));
        }
        const dict = {};
        let dictSize = 256;
        // Initialize dictionary
        for (let i = 0; i < 256; i++) {
            dict[i] = String.fromCharCode(i);
        }
        let result = dict[codes[0]];
        let current = result;
        for (let i = 1; i < codes.length; i++) {
            const code = codes[i];
            let entry;
            if (dict[code] !== undefined) {
                entry = dict[code];
            }
            else if (code === dictSize) {
                entry = current + current[0];
            }
            else {
                throw new Error('Invalid compressed data');
            }
            result += entry;
            dict[dictSize++] = current + entry[0];
            current = entry;
        }
        return result;
    },
};
/**
 * Serialize with compression.
 */
export async function serializeWithCompression(data, options) {
    const { compression, minCompressSize = 1024, ...serializeOptions } = options || {};
    // Serialize first
    const serialized = serialize(data, serializeOptions);
    const json = JSON.stringify(serialized);
    // Check if compression is beneficial
    if (!compression || json.length < minCompressSize) {
        return serialized;
    }
    // Compress
    const compressed = await compression.compress(json);
    // Check if compression actually reduced size
    if (compressed.length >= json.length) {
        return serialized;
    }
    return {
        compressed: Array.from(compressed),
        algorithm: compression.name,
        originalSize: json.length,
    };
}
/**
 * Deserialize with decompression.
 */
export async function deserializeWithDecompression(result, options) {
    const { compression, ...deserializeOptions } = options || {};
    // Check if compressed
    if (isCompressed(result)) {
        if (!compression) {
            throw new Error(`Data is compressed with ${result.algorithm} but no compression algorithm provided`);
        }
        // Decompress
        const compressed = new Uint8Array(result.compressed);
        const json = await compression.decompress(compressed);
        const serialized = JSON.parse(json);
        return deserialize(serialized, deserializeOptions);
    }
    // Not compressed, deserialize directly
    return deserialize(result, deserializeOptions);
}
/**
 * Create a streaming deserializer.
 */
export class StreamingDeserializer {
    chunks = new Map();
    options;
    constructor(options = {}) {
        this.options = options;
    }
    /**
     * Add a chunk to the deserializer.
     */
    addChunk(chunk) {
        const value = deserialize(chunk.value, this.options);
        const key = chunk.path.join('.');
        this.chunks.set(key, value);
    }
    /**
     * Get the current state (partial or complete).
     */
    getState() {
        const result = {};
        for (const [path, value] of this.chunks.entries()) {
            const parts = path.split('.');
            let current = result;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!(part in current)) {
                    current[part] = {};
                }
                current = current[part];
            }
            current[parts[parts.length - 1]] = value;
        }
        return result;
    }
    /**
     * Get a specific value by path.
     */
    get(path) {
        return this.chunks.get(path.join('.'));
    }
    /**
     * Check if a path has been received.
     */
    has(path) {
        return this.chunks.has(path.join('.'));
    }
    /**
     * Clear all chunks.
     */
    clear() {
        this.chunks.clear();
    }
}
/**
 * Create a streaming serializer.
 */
export class StreamingSerializer {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    /**
     * Serialize data into chunks.
     */
    *serialize(data, chunkSize = 10) {
        // For objects, yield each top-level property
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const entries = Object.entries(data);
            for (let i = 0; i < entries.length; i++) {
                const [key, value] = entries[i];
                const serialized = serialize(value, this.options);
                yield {
                    path: [key],
                    value: serialized,
                    final: i === entries.length - 1,
                };
            }
            return;
        }
        // For arrays, yield in chunks
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const serialized = serialize(chunk, this.options);
                yield {
                    path: [String(i)],
                    value: serialized,
                    final: i + chunkSize >= data.length,
                };
            }
            return;
        }
        // For primitives, yield as-is
        const serialized = serialize(data, this.options);
        yield {
            path: [],
            value: serialized,
            final: true,
        };
    }
}
// ============================================================================
// Lazy Deserialization
// ============================================================================
/**
 * Lazy-deserialized value wrapper.
 */
export class LazyValue {
    deserialized;
    serialized;
    options;
    constructor(serialized, options = {}) {
        this.serialized = serialized;
        this.options = options;
    }
    /**
     * Get the deserialized value (deserializes on first access).
     */
    get() {
        if (this.deserialized === undefined) {
            this.deserialized = deserialize(this.serialized, this.options);
        }
        return this.deserialized;
    }
    /**
     * Check if the value has been deserialized.
     */
    isDeserialized() {
        return this.deserialized !== undefined;
    }
    /**
     * Get the serialized form.
     */
    getSerialized() {
        return this.serialized;
    }
    /**
     * Pre-deserialize the value.
     */
    preload() {
        this.get();
    }
}
/**
 * Create a lazy value.
 */
export function lazy(serialized, options) {
    return new LazyValue(serialized, options);
}
/**
 * Create a lazy object with lazy properties.
 */
export function lazyObject(serialized, options) {
    const result = {};
    for (const [key, value] of Object.entries(serialized)) {
        result[key] = lazy(value, options);
    }
    return result;
}
/**
 * Serialize with performance tracking.
 */
export async function serializeWithMetrics(data, options) {
    const startTime = performance.now();
    const result = await serializeWithCompression(data, options);
    const serializeTime = performance.now() - startTime;
    const serializedSize = JSON.stringify(result).length;
    const metrics = {
        serializeTime,
        serializedSize,
    };
    if (isCompressed(result)) {
        metrics.compressedSize = result.compressed.length;
        if (result.originalSize !== undefined) {
            metrics.originalSize = result.originalSize;
            metrics.compressionRatio = result.originalSize / result.compressed.length;
        }
    }
    return { result, metrics };
}
/**
 * Deserialize with performance tracking.
 */
export async function deserializeWithMetrics(result, options) {
    const startTime = performance.now();
    const data = await deserializeWithDecompression(result, options);
    const deserializeTime = performance.now() - startTime;
    const metrics = {
        deserializeTime,
    };
    return { data, metrics };
}
//# sourceMappingURL=superjson-perf.js.map