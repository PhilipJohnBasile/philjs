/**
 * Partial Prerendering (PPR) Renderer
 *
 * Combines static shell prerendering with dynamic content streaming,
 * inspired by Next.js 14's Partial Prerendering feature.
 *
 * Key concepts:
 * - Static shell: Prerendered at build time, cached at edge
 * - Dynamic boundaries: Rendered at request time, streamed to client
 * - Suspense integration: Use Suspense for async content
 * - Dynamic component: Explicitly mark request-time content
 */
import type { VNode } from "@philjs/core";
import type { PPRContext, PPRConfig, StaticShell, DynamicBoundary, RequestTimeData, BoundaryResolution } from "./ppr-types.js";
/**
 * Create a new PPR rendering context
 */
export declare function createPPRContext(mode: "build" | "request", options?: {
    placeholderPrefix?: string;
    requestData?: RequestTimeData;
}): PPRContext;
/**
 * Render a component tree to a static shell at build time.
 * Dynamic boundaries are replaced with placeholder comments.
 */
export declare function renderToStaticShell(vnode: VNode, path: string, config?: PPRConfig): Promise<StaticShell>;
/**
 * Render a single dynamic boundary at request time
 */
export declare function renderDynamicContent(boundary: DynamicBoundary, ctx: PPRContext): Promise<BoundaryResolution>;
/**
 * Render all dynamic boundaries for a shell
 */
export declare function renderAllDynamicContent(shell: StaticShell, requestData: RequestTimeData, originalVNode: VNode): Promise<Map<string, BoundaryResolution>>;
/**
 * Inject dynamic content into a static shell
 */
export declare function injectDynamicContent(shell: StaticShell, resolutions: Map<string, BoundaryResolution>): string;
/**
 * Generate a complete response with PPR.
 * Sends static shell immediately, then streams dynamic content.
 */
export declare function generatePPRResponse(shell: StaticShell, vnode: VNode, request: Request, options?: {
    onShellSent?: () => void;
    onBoundaryResolved?: (id: string) => void;
    onComplete?: () => void;
    timeout?: number;
}): Promise<ReadableStream<Uint8Array>>;
export { Suspense } from "./streaming.js";
//# sourceMappingURL=ppr.d.ts.map