/**
 * Streaming Utilities
 * Utilities for streaming large datasets during export
 */
export interface StreamOptions {
    /** Chunk size (number of items per chunk) */
    chunkSize?: number;
    /** High water mark for backpressure */
    highWaterMark?: number;
    /** Progress callback */
    onProgress?: (progress: StreamProgress) => void;
    /** Error callback */
    onError?: (error: Error) => void;
    /** Completion callback */
    onComplete?: (stats: StreamStats) => void;
    /** Abort signal */
    signal?: AbortSignal;
}
export interface StreamProgress {
    /** Progress as a fraction (0-1) */
    progress: number;
    /** Number of items processed */
    processedItems: number;
    /** Total items (if known) */
    totalItems?: number;
    /** Bytes written */
    bytesWritten: number;
    /** Elapsed time in ms */
    elapsedMs: number;
    /** Estimated time remaining in ms */
    estimatedRemainingMs?: number;
    /** Processing rate (items per second) */
    itemsPerSecond: number;
}
export interface StreamStats {
    /** Total items processed */
    totalItems: number;
    /** Total bytes written */
    totalBytes: number;
    /** Total time in ms */
    totalTimeMs: number;
    /** Average items per second */
    averageItemsPerSecond: number;
    /** Number of chunks */
    chunks: number;
}
/**
 * Create a progress tracker for streaming operations
 */
export declare function createProgressTracker(totalItems?: number, onProgress?: (progress: StreamProgress) => void): {
    update: (processedItems: number, bytesWritten: number) => void;
    complete: () => StreamStats;
};
/**
 * Chunk an array into smaller arrays
 */
export declare function chunkArray<T>(array: T[], chunkSize: number): Generator<T[]>;
/**
 * Chunk an async iterable into arrays
 */
export declare function chunkAsyncIterable<T>(iterable: AsyncIterable<T>, chunkSize: number): AsyncGenerator<T[]>;
/**
 * Create a readable stream from an async generator
 */
export declare function createReadableStream<T>(generator: AsyncGenerator<T>, options?: {
    signal?: AbortSignal;
}): ReadableStream<T>;
/**
 * Create a writable stream that collects chunks
 */
export declare function createCollectorStream<T>(): {
    stream: WritableStream<T>;
    getResult: () => T[];
};
/**
 * Pipe an async generator through a transform function
 */
export declare function transformStream<T, U>(source: AsyncIterable<T>, transform: (chunk: T) => U | Promise<U>): AsyncGenerator<U>;
/**
 * Concatenate string chunks into a single string
 */
export declare function concatStringStream(source: AsyncIterable<string>): Promise<string>;
/**
 * Create a Blob from a stream of string chunks
 */
export declare function streamToBlob(source: AsyncIterable<string>, mimeType: string): Promise<Blob>;
/**
 * Create a Blob from a stream of ArrayBuffer chunks
 */
export declare function streamToBlobFromBuffers(source: AsyncIterable<ArrayBuffer>, mimeType: string): Promise<Blob>;
/**
 * Rate limit an async generator
 */
export declare function rateLimitStream<T>(source: AsyncIterable<T>, itemsPerSecond: number): AsyncGenerator<T>;
/**
 * Add progress tracking to an async generator
 */
export declare function withProgress<T>(source: AsyncIterable<T>, options: {
    totalItems?: number;
    onProgress?: (progress: StreamProgress) => void;
}): AsyncGenerator<T>;
/**
 * Buffer chunks until a minimum size is reached
 */
export declare function bufferStream(source: AsyncIterable<string>, minBufferSize: number): AsyncGenerator<string>;
/**
 * Create an abort controller with timeout
 */
export declare function createTimeoutController(timeoutMs: number): AbortController;
//# sourceMappingURL=streaming.d.ts.map