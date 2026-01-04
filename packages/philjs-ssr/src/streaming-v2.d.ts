/**
 * Streaming SSR V2 for PhilJS
 *
 * Next-generation streaming server-side rendering with:
 * - Out-of-order streaming (send completed chunks immediately)
 * - Selective hydration (hydrate only interactive parts)
 * - Concurrent rendering (parallel async rendering)
 * - Priority-based streaming (critical content first)
 * - Resumability (serialize and resume state)
 */
import type { VNode } from "@philjs/core";
export interface StreamingV2Config {
    /** Enable out-of-order streaming */
    outOfOrder?: boolean;
    /** Enable selective hydration */
    selectiveHydration?: boolean;
    /** Enable concurrent rendering */
    concurrent?: boolean;
    /** Shell timeout in ms */
    shellTimeout?: number;
    /** Boundary timeout in ms */
    boundaryTimeout?: number;
    /** Enable resumability */
    resumable?: boolean;
    /** Chunk priority mode */
    priority?: 'fifo' | 'priority' | 'completion';
    /** Maximum concurrent boundaries */
    maxConcurrent?: number;
}
export interface StreamingV2Context {
    config: Required<StreamingV2Config>;
    boundaryId: number;
    boundaries: Map<string, BoundaryState>;
    completed: string[];
    hydrationTargets: Set<string>;
    serializedState: Map<string, unknown>;
    encoder: TextEncoder;
}
export interface BoundaryState {
    id: string;
    priority: number;
    status: 'pending' | 'rendering' | 'complete' | 'error';
    promise: Promise<string>;
    fallback: string;
    html?: string;
    error?: Error;
    startTime: number;
    requiresHydration: boolean;
}
export interface StreamChunk {
    type: 'shell' | 'boundary' | 'script' | 'end';
    content: string;
    boundaryId?: string;
    priority?: number;
}
/**
 * Create a streaming V2 renderer
 */
export declare function createStreamingRenderer(config?: StreamingV2Config): {
    /**
     * Render to a streaming response
     */
    renderToStream: (rootNode: VNode, options?: {
        shell?: ShellConfig;
        onShellReady?: () => void;
        onBoundaryReady?: (id: string) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
    }) => ReadableStream<Uint8Array>;
    /**
     * Render to a streaming response with selective hydration
     */
    renderSelectiveHydration: (rootNode: VNode, interactiveIds: string[]) => ReadableStream<Uint8Array>;
    /**
     * Get resumability script
     */
    getResumabilityScript: (ctx: StreamingV2Context) => string;
};
export interface ShellConfig {
    doctype?: string;
    htmlAttributes?: Record<string, string>;
    head?: string;
    bodyAttributes?: Record<string, string>;
    scripts?: string[];
    styles?: string[];
}
export { createStreamingRenderer as default };
//# sourceMappingURL=streaming-v2.d.ts.map