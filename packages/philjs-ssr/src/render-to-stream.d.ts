/**
 * Advanced streaming SSR with selective hydration support.
 * Provides 50%+ faster Time-to-First-Byte compared to renderToString.
 */
import type { VNode } from "@philjs/core";
/**
 * Streaming context for managing suspense boundaries and hydration.
 */
export interface StreamContext {
    /** Counter for generating unique suspense boundary IDs */
    suspenseCounter: number;
    /** Map of pending async boundaries (ID -> Promise) */
    pendingBoundaries: Map<string, Promise<VNode>>;
    /** Set of component types that need hydration */
    interactiveComponents: Set<string | Function>;
    /** Counter for hydration island IDs */
    islandCounter: number;
    /** Encoder for converting strings to bytes */
    encoder: TextEncoder;
    /** Whether to enable selective hydration */
    selectiveHydration: boolean;
}
/**
 * Options for renderToStream.
 */
export interface RenderToStreamOptions {
    /** Callback when initial shell is ready */
    onShellReady?: () => void;
    /** Callback when all async content is complete */
    onAllReady?: () => void;
    /** Callback on error */
    onError?: (error: Error) => void;
    /** Enable selective hydration (default: true) */
    selectiveHydration?: boolean;
    /** Mark these component types as interactive (need hydration) */
    interactiveComponents?: Set<string | Function>;
    /** Bootstrap scripts to inject */
    bootstrapScripts?: string[];
    /** Bootstrap modules to inject */
    bootstrapModules?: string[];
}
/**
 * Suspense component for lazy loading and async data.
 */
export declare const Suspense: unique symbol;
/**
 * Island component for selective hydration boundaries.
 */
export declare const Island: unique symbol;
/**
 * Render JSX to a ReadableStream with progressive enhancement.
 * Starts sending HTML immediately for faster Time-to-First-Byte.
 */
export declare function renderToStream(vnode: VNode, options?: RenderToStreamOptions): ReadableStream<Uint8Array>;
//# sourceMappingURL=render-to-stream.d.ts.map