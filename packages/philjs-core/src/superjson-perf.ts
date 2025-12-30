/**
 * Performance optimizations for SuperJSON
 * - Lazy deserialization
 * - Streaming support
 * - Compression for large payloads
 */

import {
  serialize,
  deserialize,
  type SuperJSONResult,
  type SerializeOptions,
  type DeserializeOptions,
} from './superjson.js';

// ============================================================================
// Compression Support
// ============================================================================

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
  compressed: number[]; // Array representation of Uint8Array for JSON compatibility
  /** Compression algorithm used */
  algorithm: string;
  /** Original size (for metrics) */
  originalSize?: number;
}

/**
 * Check if a result is compressed.
 */
export function isCompressed(
  result: unknown
): result is CompressedSuperJSONResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'compressed' in result &&
    'algorithm' in result &&
    Array.isArray((result as CompressedSuperJSONResult).compressed)
  );
}

/**
 * Built-in compression using native browser APIs (when available).
 */
export const NativeCompression: CompressionAlgorithm = {
  name: 'gzip',

  async compress(data: string): Promise<Uint8Array> {
    // Check for CompressionStream API (modern browsers)
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([data]).stream();
      const compressedStream = stream.pipeThrough(
        new CompressionStream('gzip')
      );
      const blob = await new Response(compressedStream).blob();
      return new Uint8Array(await blob.arrayBuffer());
    }

    // Fallback: No compression
    const encoder = new TextEncoder();
    return encoder.encode(data);
  },

  async decompress(data: Uint8Array): Promise<string> {
    // Check for DecompressionStream API (modern browsers)
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([data as BlobPart]).stream();
      const decompressedStream = stream.pipeThrough(
        new DecompressionStream('gzip')
      );
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
export const LZCompression: CompressionAlgorithm = {
  name: 'lz',

  compress(data: string): Uint8Array {
    // Simple LZ77-like compression
    const dict: Record<string, number> = {};
    const result: number[] = [];
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
      } else {
        result.push(dict[current]!);
        dict[combined] = dictSize++;
        current = char!;
      }
    }

    if (current) {
      result.push(dict[current]!);
    }

    // Convert to Uint8Array (simple 16-bit encoding)
    const compressed = new Uint8Array(result.length * 2);
    for (let i = 0; i < result.length; i++) {
      compressed[i * 2] = result[i]! & 0xff;
      compressed[i * 2 + 1] = (result[i]! >> 8) & 0xff;
    }

    return compressed;
  },

  decompress(data: Uint8Array): string {
    // Decode 16-bit values
    const codes: number[] = [];
    for (let i = 0; i < data.length; i += 2) {
      codes.push(data[i]! | (data[i + 1]! << 8));
    }

    const dict: Record<number, string> = {};
    let dictSize = 256;

    // Initialize dictionary
    for (let i = 0; i < 256; i++) {
      dict[i] = String.fromCharCode(i);
    }

    let result = dict[codes[0]!]!;
    let current = result;

    for (let i = 1; i < codes.length; i++) {
      const code = codes[i]!;
      let entry: string;

      if (dict[code] !== undefined) {
        entry = dict[code]!;
      } else if (code === dictSize) {
        entry = current + current[0];
      } else {
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
export async function serializeWithCompression(
  data: unknown,
  options?: SerializeOptions & {
    compression?: CompressionAlgorithm;
    /** Minimum size to compress (bytes, default: 1024) */
    minCompressSize?: number;
  }
): Promise<CompressedSuperJSONResult | SuperJSONResult> {
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
export async function deserializeWithDecompression<T = unknown>(
  result: CompressedSuperJSONResult | SuperJSONResult,
  options?: DeserializeOptions & {
    compression?: CompressionAlgorithm;
  }
): Promise<T> {
  const { compression, ...deserializeOptions } = options || {};

  // Check if compressed
  if (isCompressed(result)) {
    if (!compression) {
      throw new Error(
        `Data is compressed with ${result.algorithm} but no compression algorithm provided`
      );
    }

    // Decompress
    const compressed = new Uint8Array(result.compressed);
    const json = await compression.decompress(compressed);
    const serialized = JSON.parse(json) as SuperJSONResult;

    return deserialize<T>(serialized, deserializeOptions);
  }

  // Not compressed, deserialize directly
  return deserialize<T>(result as SuperJSONResult, deserializeOptions);
}

// ============================================================================
// Streaming Deserialization
// ============================================================================

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
export class StreamingDeserializer<T> {
  private chunks = new Map<string, unknown>();
  private options: DeserializeOptions;

  constructor(options: DeserializeOptions = {}) {
    this.options = options;
  }

  /**
   * Add a chunk to the deserializer.
   */
  addChunk(chunk: StreamChunk): void {
    const value = deserialize(chunk.value, this.options);
    const key = chunk.path.join('.');
    this.chunks.set(key, value);
  }

  /**
   * Get the current state (partial or complete).
   */
  getState(): Partial<T> {
    const result: any = {};

    for (const [path, value] of this.chunks.entries()) {
      const parts = path.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]!;
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]!] = value;
    }

    return result;
  }

  /**
   * Get a specific value by path.
   */
  get(path: string[]): unknown | undefined {
    return this.chunks.get(path.join('.'));
  }

  /**
   * Check if a path has been received.
   */
  has(path: string[]): boolean {
    return this.chunks.has(path.join('.'));
  }

  /**
   * Clear all chunks.
   */
  clear(): void {
    this.chunks.clear();
  }
}

/**
 * Create a streaming serializer.
 */
export class StreamingSerializer {
  private options: SerializeOptions;

  constructor(options: SerializeOptions = {}) {
    this.options = options;
  }

  /**
   * Serialize data into chunks.
   */
  *serialize(data: unknown, chunkSize = 10): Generator<StreamChunk> {
    // For objects, yield each top-level property
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data);

      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i]!;
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
export class LazyValue<T> {
  private deserialized?: T;
  private readonly serialized: SuperJSONResult;
  private readonly options: DeserializeOptions;

  constructor(serialized: SuperJSONResult, options: DeserializeOptions = {}) {
    this.serialized = serialized;
    this.options = options;
  }

  /**
   * Get the deserialized value (deserializes on first access).
   */
  get(): T {
    if (this.deserialized === undefined) {
      this.deserialized = deserialize<T>(this.serialized, this.options);
    }
    return this.deserialized;
  }

  /**
   * Check if the value has been deserialized.
   */
  isDeserialized(): boolean {
    return this.deserialized !== undefined;
  }

  /**
   * Get the serialized form.
   */
  getSerialized(): SuperJSONResult {
    return this.serialized;
  }

  /**
   * Pre-deserialize the value.
   */
  preload(): void {
    this.get();
  }
}

/**
 * Create a lazy value.
 */
export function lazy<T>(
  serialized: SuperJSONResult,
  options?: DeserializeOptions
): LazyValue<T> {
  return new LazyValue<T>(serialized, options);
}

/**
 * Create a lazy object with lazy properties.
 */
export function lazyObject<T extends Record<string, unknown>>(
  serialized: Record<string, SuperJSONResult>,
  options?: DeserializeOptions
): Record<keyof T, LazyValue<T[keyof T]>> {
  const result: any = {};

  for (const [key, value] of Object.entries(serialized)) {
    result[key] = lazy(value, options);
  }

  return result;
}

// ============================================================================
// Performance Metrics
// ============================================================================

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
export async function serializeWithMetrics(
  data: unknown,
  options?: SerializeOptions & { compression?: CompressionAlgorithm }
): Promise<{
  result: CompressedSuperJSONResult | SuperJSONResult;
  metrics: PerformanceMetrics;
}> {
  const startTime = performance.now();

  const result = await serializeWithCompression(data, options);

  const serializeTime = performance.now() - startTime;
  const serializedSize = JSON.stringify(result).length;

  const metrics: PerformanceMetrics = {
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
export async function deserializeWithMetrics<T = unknown>(
  result: CompressedSuperJSONResult | SuperJSONResult,
  options?: DeserializeOptions & { compression?: CompressionAlgorithm }
): Promise<{
  data: T;
  metrics: PerformanceMetrics;
}> {
  const startTime = performance.now();

  const data = await deserializeWithDecompression<T>(result, options);

  const deserializeTime = performance.now() - startTime;

  const metrics: PerformanceMetrics = {
    deserializeTime,
  };

  return { data, metrics };
}
