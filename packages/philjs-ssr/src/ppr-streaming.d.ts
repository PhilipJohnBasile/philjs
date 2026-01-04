/**
 * Enhanced Streaming for Partial Prerendering (PPR)
 *
 * Provides advanced streaming capabilities for PPR, including:
 * - Priority-based boundary streaming
 * - Parallel resolution with concurrency control
 * - Progressive enhancement for slow connections
 * - Error recovery and fallback handling
 */
import type { VNode } from "@philjs/core";
import type { StaticShell, PPRStreamOptions } from "./ppr-types.js";
/**
 * Controller for PPR streaming with advanced features
 */
export declare class PPRStreamController {
    private shell;
    private requestData;
    private options;
    private resolvedBoundaries;
    private pendingBoundaries;
    private aborted;
    constructor(options: PPRStreamOptions);
    /**
     * Create a streaming response
     */
    createStream(): ReadableStream<Uint8Array>;
    /**
     * Stream content with priority-based ordering
     */
    private streamContent;
    /**
     * Stream boundaries with priority ordering and concurrency
     */
    private streamBoundaries;
    /**
     * Process a group of boundaries with controlled concurrency
     */
    private processBoundaryGroup;
    /**
     * Resolve a single boundary
     */
    private resolveBoundary;
    /**
     * Group boundaries by priority
     */
    private groupByPriority;
    /**
     * Generate HTML head section
     */
    private generateHead;
    /**
     * Generate asset preload tags
     */
    private generateAssetPreloads;
    /**
     * Generate PPR client runtime
     */
    private generatePPRRuntime;
    /**
     * Generate shell HTML with fallbacks
     */
    private generateShellHtml;
    /**
     * Generate script to register pending boundaries
     */
    private generatePendingScript;
    /**
     * Generate injection script for resolved boundary
     */
    private generateInjectionScript;
    /**
     * Generate error script
     */
    private generateErrorScript;
    /**
     * Generate footer
     */
    private generateFooter;
    /**
     * Escape string for use in JavaScript
     */
    private escapeForScript;
    /**
     * Abort streaming
     */
    abort(): void;
    /**
     * Get current status
     */
    getStatus(): {
        resolved: number;
        pending: number;
        aborted: boolean;
    };
}
/**
 * Create a PPR streaming response
 */
export declare function createPPRStream(options: PPRStreamOptions): ReadableStream<Uint8Array>;
/**
 * Stream PPR response with progressive enhancement
 * Falls back to full page if streaming is not supported
 */
export declare function streamPPRResponse(shell: StaticShell, vnode: VNode, request: Request, options?: Partial<PPRStreamOptions>): Promise<Response>;
export type { PPRStreamOptions } from "./ppr-types.js";
//# sourceMappingURL=ppr-streaming.d.ts.map