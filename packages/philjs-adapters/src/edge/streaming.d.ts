/**
 * PhilJS Edge Streaming - Edge-Optimized Streaming Responses
 *
 * Provides optimized streaming capabilities for edge runtimes:
 * - Server-Sent Events (SSE)
 * - Chunked transfer encoding
 * - Progressive HTML streaming
 * - Edge-Side Includes (ESI)
 */
export interface StreamingConfig {
    /** Enable compression for streaming responses */
    compress?: boolean;
    /** Buffer size for chunks (bytes) */
    bufferSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
    /** Headers to include in streaming response */
    headers?: Record<string, string>;
}
export interface SSEMessage {
    /** Event type */
    event?: string;
    /** Message data */
    data: string | object;
    /** Optional event ID */
    id?: string;
    /** Retry interval in milliseconds */
    retry?: number;
}
export interface ESIFragment {
    /** Fragment URL to fetch */
    src: string;
    /** Fallback content if fetch fails */
    alt?: string;
    /** TTL for caching the fragment */
    ttl?: number;
    /** Whether to fetch in parallel */
    parallel?: boolean;
}
export interface StreamingWriter {
    /** Write a chunk to the stream */
    write(chunk: string | Uint8Array): Promise<void>;
    /** Write multiple chunks */
    writeAll(chunks: Array<string | Uint8Array>): Promise<void>;
    /** Flush buffered content */
    flush(): Promise<void>;
    /** Close the stream */
    close(): Promise<void>;
    /** Check if stream is closed */
    readonly closed: boolean;
}
/**
 * Create a ReadableStream with a controller for writing
 */
export declare function createWritableStream(): {
    readable: ReadableStream<Uint8Array>;
    writer: StreamingWriter;
};
/**
 * Create a streaming response with proper headers
 */
export declare function createStreamingResponse(readable: ReadableStream, config?: StreamingConfig): Response;
/**
 * Create an SSE stream for real-time updates
 */
export declare function createSSEStream(): {
    response: Response;
    send: (message: SSEMessage) => Promise<void>;
    close: () => Promise<void>;
};
/**
 * Create an SSE event handler for edge runtimes
 */
export declare function createSSEHandler(handler: (send: (message: SSEMessage) => Promise<void>, request: Request) => Promise<void>): (request: Request) => Promise<Response>;
export interface HTMLStreamOptions {
    /** Document shell (before content) */
    shell: string;
    /** Document footer (after content) */
    footer: string;
    /** Placeholder for streaming content */
    contentPlaceholder?: string;
}
/**
 * Create a progressive HTML streaming response
 */
export declare function createHTMLStream(options: HTMLStreamOptions): {
    response: Response;
    writeChunk: (html: string) => Promise<void>;
    writeSuspenseFallback: (id: string, fallback: string) => Promise<void>;
    resolveSuspense: (id: string, content: string) => Promise<void>;
    close: () => Promise<void>;
};
/**
 * Parse ESI tags from HTML content
 */
export declare function parseESITags(html: string): ESIFragment[];
/**
 * Process ESI includes in HTML content
 */
export declare function processESI(html: string, options?: {
    /** Base URL for relative includes */
    baseUrl?: string;
    /** Timeout for fetching includes (ms) */
    timeout?: number;
    /** Custom fetch function */
    fetch?: typeof globalThis.fetch;
    /** Cache for ESI fragments */
    cache?: Map<string, {
        content: string;
        expires: number;
    }>;
}): Promise<string>;
/**
 * Create an ESI processor middleware
 */
export declare function createESIMiddleware(options: {
    baseUrl?: string;
    timeout?: number;
    cacheSize?: number;
}): (response: Response) => Promise<Response>;
/**
 * Stream a fetch response through to the client
 */
export declare function streamThrough(response: Response, transform?: (chunk: Uint8Array) => Uint8Array | Promise<Uint8Array>): Promise<Response>;
/**
 * Merge multiple streams into one
 */
export declare function mergeStreams(streams: ReadableStream<Uint8Array>[], options?: {
    sequential?: boolean;
}): ReadableStream<Uint8Array>;
/**
 * Create a tee that allows streaming to multiple destinations
 */
export declare function createStreamTee(source: ReadableStream<Uint8Array>, count?: number): ReadableStream<Uint8Array>[];
declare const _default: {
    createWritableStream: typeof createWritableStream;
    createStreamingResponse: typeof createStreamingResponse;
    createSSEStream: typeof createSSEStream;
    createSSEHandler: typeof createSSEHandler;
    createHTMLStream: typeof createHTMLStream;
    parseESITags: typeof parseESITags;
    processESI: typeof processESI;
    createESIMiddleware: typeof createESIMiddleware;
    streamThrough: typeof streamThrough;
    mergeStreams: typeof mergeStreams;
    createStreamTee: typeof createStreamTee;
};
export default _default;
//# sourceMappingURL=streaming.d.ts.map