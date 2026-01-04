/**
 * Streaming SSR with Suspense boundaries.
 */
import type { VNode } from "@philjs/core";
export type StreamContext = {
    /** Unique ID generator for suspense boundaries */
    suspenseId: number;
    /** Pending suspense boundaries */
    pending: Map<string, Promise<VNode>>;
    /** Resolved boundaries ready to inject */
    resolved: Map<string, string>;
};
/**
 * Render to a streaming response with progressive enhancement.
 */
export declare function renderToStreamingResponse(vnode: VNode, options?: {
    onShellReady?: () => void;
    onComplete?: () => void;
}): Promise<ReadableStream<Uint8Array>>;
/**
 * Suspense component for lazy loading.
 */
export declare function Suspense(props: {
    children: VNode;
    fallback?: VNode;
}): VNode;
//# sourceMappingURL=streaming.d.ts.map