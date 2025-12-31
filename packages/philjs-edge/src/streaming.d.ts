/**
 * Edge Streaming for PhilJS
 *
 * Optimized streaming capabilities for edge computing:
 * - Chunked transfer encoding
 * - Server-Sent Events (SSE)
 * - WebSocket over edge
 * - Streaming HTML rendering
 */
export interface StreamConfig {
    highWaterMark?: number;
    chunkSize?: number;
    flushInterval?: number;
    compression?: 'gzip' | 'deflate' | 'br' | 'none';
}
export interface SSEEvent {
    id?: string;
    event?: string;
    data: string | object;
    retry?: number;
}
/**
 * Create a streaming response builder
 */
export declare class StreamingResponse {
    private encoder;
    private controller;
    private stream;
    private headers;
    private config;
    private flushed;
    constructor(config?: StreamConfig);
    /**
     * Write data to the stream
     */
    write(data: string | Uint8Array): void;
    /**
     * Write and immediately flush
     */
    writeAndFlush(data: string | Uint8Array): void;
    /**
     * Flush the stream (trigger browser render)
     */
    flush(): void;
    /**
     * Close the stream
     */
    close(): void;
    /**
     * Set response header
     */
    setHeader(name: string, value: string): void;
    /**
     * Get the Response object
     */
    getResponse(status?: number): Response;
}
/**
 * Server-Sent Events stream
 */
export declare class SSEStream {
    private encoder;
    private controller;
    private stream;
    private headers;
    private eventId;
    private heartbeatInterval;
    constructor(options?: {
        heartbeatInterval?: number;
    });
    /**
     * Send an SSE event
     */
    send(event: SSEEvent): void;
    /**
     * Send a comment (for keepalive)
     */
    sendComment(comment: string): void;
    /**
     * Close the stream
     */
    close(): void;
    private cleanup;
    /**
     * Get the Response object
     */
    getResponse(): Response;
}
/**
 * Create a streaming HTML response with shell and content
 */
export declare function createStreamingHTML(options: {
    shell: {
        head: string;
        bodyStart: string;
        bodyEnd: string;
    };
    renderContent: () => AsyncIterable<string>;
    scripts?: string[];
}): Response;
/**
 * Transform stream that chunks data
 */
export declare function createChunkedStream(chunkSize?: number): TransformStream<Uint8Array, Uint8Array>;
/**
 * Stream JSON array items one by one
 */
export declare function streamJSONArray<T>(items: AsyncIterable<T> | Iterable<T>): AsyncGenerator<string>;
/**
 * Stream NDJSON (newline-delimited JSON)
 */
export declare function streamNDJSON<T>(items: AsyncIterable<T> | Iterable<T>): AsyncGenerator<string>;
/**
 * Create a streaming fetch that processes response in chunks
 */
export declare function streamingFetch(url: string, options?: RequestInit): AsyncGenerator<Uint8Array>;
/**
 * Pipe multiple streams together
 */
export declare function pipeStreams(...streams: Array<TransformStream<Uint8Array, Uint8Array>>): TransformStream<Uint8Array, Uint8Array>;
/**
 * Create an edge-optimized SSE broadcaster
 */
export declare class SSEBroadcaster {
    private clients;
    private lastEventId;
    private eventHistory;
    private maxHistory;
    constructor(options?: {
        maxHistory?: number;
    });
    /**
     * Add a new client
     */
    addClient(clientId: string, stream: SSEStream, lastEventId?: number): void;
    /**
     * Remove a client
     */
    removeClient(clientId: string): void;
    /**
     * Broadcast an event to all clients
     */
    broadcast(event: Omit<SSEEvent, 'id'>): void;
    /**
     * Send event to specific client
     */
    sendTo(clientId: string, event: SSEEvent): void;
    /**
     * Get client count
     */
    get clientCount(): number;
    /**
     * Close all connections
     */
    closeAll(): void;
}
/**
 * Create progressive HTML streaming with suspense boundaries
 */
export declare function createProgressiveHTML(options: {
    shell: string;
    fallback: string;
    renderAsync: () => Promise<string>;
    boundaryId: string;
}): Response;
//# sourceMappingURL=streaming.d.ts.map