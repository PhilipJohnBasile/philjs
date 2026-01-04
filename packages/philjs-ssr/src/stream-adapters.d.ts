/**
 * Adapters for converting Web Streams to Node.js streams and vice versa.
 */
import { Readable } from "stream";
/**
 * Convert a Web ReadableStream to a Node.js Readable stream.
 */
export declare function webStreamToNodeStream(webStream: ReadableStream<Uint8Array>): Readable;
/**
 * Convert a Node.js Readable stream to a Web ReadableStream.
 */
export declare function nodeStreamToWebStream(nodeStream: Readable): ReadableStream<Uint8Array>;
/**
 * Pipe a Web ReadableStream to a Node.js Writable stream.
 */
export declare function pipeWebStreamToNode(webStream: ReadableStream<Uint8Array>, nodeStream: NodeJS.WritableStream): Promise<void>;
/**
 * Create a transform stream that measures throughput.
 */
export declare function createThroughputMeasurer(): {
    stream: TransformStream<Uint8Array, Uint8Array>;
    getStats: () => {
        bytes: number;
        chunks: number;
        duration: number;
    };
};
/**
 * Create a transform stream that adds compression headers.
 */
export declare function createCompressionStream(encoding: "gzip" | "deflate" | "br"): TransformStream<Uint8Array, Uint8Array>;
/**
 * Create a multiplexed stream that sends chunks to multiple destinations.
 */
export declare function createMultiplexStream(destinations: WritableStream<Uint8Array>[]): WritableStream<Uint8Array>;
/**
 * Buffer stream chunks until a delimiter or size is reached.
 */
export declare function createBufferedStream(maxBufferSize?: number): TransformStream<Uint8Array, Uint8Array>;
/**
 * Add timing information to stream chunks.
 */
export interface TimedChunk {
    chunk: Uint8Array;
    timestamp: number;
    index: number;
}
export declare function createTimingStream(): TransformStream<Uint8Array, TimedChunk>;
/**
 * Rate limit a stream to a maximum bytes per second.
 */
export declare function createRateLimitedStream(bytesPerSecond: number): TransformStream<Uint8Array, Uint8Array>;
/**
 * Create a stream that only passes through chunks matching a predicate.
 */
export declare function createFilterStream(predicate: (chunk: Uint8Array) => boolean): TransformStream<Uint8Array, Uint8Array>;
/**
 * Tee a stream into two independent streams.
 */
export declare function teeStream<T>(stream: ReadableStream<T>): [ReadableStream<T>, ReadableStream<T>];
/**
 * Merge multiple streams into one.
 */
export declare function mergeStreams<T>(...streams: ReadableStream<T>[]): AsyncGenerator<T>;
//# sourceMappingURL=stream-adapters.d.ts.map