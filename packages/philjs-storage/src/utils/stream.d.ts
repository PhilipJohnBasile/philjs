/**
 * Streaming Upload Utilities
 *
 * Helpers for streaming file uploads with progress tracking,
 * chunked transfers, and abort handling.
 */
import type { UploadProgress } from '../index.js';
/**
 * Streaming upload options
 */
export interface StreamingUploadOptions {
    /** Chunk size in bytes (default: 64KB) */
    chunkSize?: number;
    /** Progress callback */
    onProgress?: (progress: UploadProgress) => void;
    /** Abort signal for cancellation */
    signal?: AbortSignal;
    /** Total size if known (enables percentage calculation) */
    totalSize?: number;
}
/**
 * Chunked upload state
 */
export interface ChunkedUploadState {
    /** Upload ID for resumable uploads */
    uploadId: string;
    /** Uploaded parts */
    parts: UploadedPart[];
    /** Total bytes uploaded */
    uploadedBytes: number;
    /** Total size (if known) */
    totalSize?: number;
    /** Start time */
    startTime: number;
}
/**
 * Uploaded part info
 */
export interface UploadedPart {
    /** Part number (1-based) */
    partNumber: number;
    /** ETag of the uploaded part */
    etag: string;
    /** Size of the part in bytes */
    size: number;
}
/**
 * Create a streaming upload that processes data in chunks
 *
 * @param stream - Input ReadableStream
 * @param processor - Function to process each chunk
 * @param options - Upload options
 * @returns Final result from processor
 */
export declare function createStreamingUpload<T>(stream: ReadableStream<Uint8Array>, processor: (chunks: AsyncGenerator<Uint8Array, void, unknown>) => Promise<T>, options?: StreamingUploadOptions): Promise<T>;
/**
 * Convert a ReadableStream to a Buffer
 *
 * @param stream - Input stream
 * @param options - Options with optional progress tracking
 * @returns Buffer containing all stream data
 */
export declare function streamToBuffer(stream: ReadableStream<Uint8Array>, options?: StreamingUploadOptions): Promise<Buffer>;
/**
 * Convert a Buffer to a ReadableStream
 *
 * @param buffer - Input buffer
 * @param chunkSize - Size of each chunk (default: 64KB)
 * @returns ReadableStream of the buffer data
 */
export declare function bufferToStream(buffer: Buffer, chunkSize?: number): ReadableStream<Uint8Array>;
/**
 * Create a transform stream that tracks progress
 *
 * @param options - Progress tracking options
 * @returns TransformStream that passes through data while tracking progress
 */
export declare function createProgressStream(options: StreamingUploadOptions): TransformStream<Uint8Array, Uint8Array>;
/**
 * Split a stream into fixed-size chunks for multipart uploads
 *
 * @param stream - Input stream
 * @param partSize - Size of each part in bytes
 * @returns AsyncGenerator yielding parts
 */
export declare function splitIntoParts(stream: ReadableStream<Uint8Array>, partSize: number): AsyncGenerator<{
    partNumber: number;
    data: Uint8Array;
}, void, unknown>;
/**
 * Combine multiple ReadableStreams into one
 *
 * @param streams - Array of streams to combine
 * @returns Combined stream
 */
export declare function combineStreams(streams: ReadableStream<Uint8Array>[]): ReadableStream<Uint8Array>;
/**
 * Create a limited stream that only reads up to maxBytes
 *
 * @param stream - Input stream
 * @param maxBytes - Maximum bytes to read
 * @returns Limited stream
 */
export declare function limitStream(stream: ReadableStream<Uint8Array>, maxBytes: number): ReadableStream<Uint8Array>;
/**
 * Create a tee that duplicates a stream for multiple consumers
 *
 * @param stream - Input stream
 * @returns Tuple of two streams with the same data
 */
export declare function teeStream(stream: ReadableStream<Uint8Array>): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>];
/**
 * Calculate MD5 hash of a stream (for integrity checking)
 *
 * @param stream - Input stream
 * @returns MD5 hash as hex string
 */
export declare function hashStream(stream: ReadableStream<Uint8Array>): Promise<string>;
/**
 * Estimate upload time based on current progress
 *
 * @param bytesUploaded - Bytes uploaded so far
 * @param totalBytes - Total bytes to upload
 * @param elapsedMs - Elapsed time in milliseconds
 * @returns Estimated remaining time in seconds
 */
export declare function estimateRemainingTime(bytesUploaded: number, totalBytes: number, elapsedMs: number): number;
/**
 * Format bytes as human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export declare function formatBytes(bytes: number): string;
/**
 * Format upload speed as human-readable string
 *
 * @param bytesPerSecond - Upload speed in bytes per second
 * @returns Formatted string (e.g., "1.5 MB/s")
 */
export declare function formatSpeed(bytesPerSecond: number): string;
//# sourceMappingURL=stream.d.ts.map