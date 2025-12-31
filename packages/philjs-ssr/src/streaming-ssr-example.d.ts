/**
 * Example usage of streaming SSR with selective hydration.
 *
 * This demonstrates the new streaming SSR features:
 * - renderToStream for immediate TTFB
 * - Suspense boundaries for async content
 * - Selective hydration for interactive islands
 * - Multiple hydration strategies
 */
import type { IncomingMessage, ServerResponse } from "http";
/**
 * Simple streaming SSR example.
 */
export declare function basicStreamingExample(): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>;
/**
 * Page with Suspense boundary for async content.
 */
export declare function suspenseBoundaryExample(userId: string): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Page with selective hydration - only Counter is interactive.
 */
export declare function selectiveHydrationExample(): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Client-side hydration setup for selective hydration.
 */
export declare function clientHydrationSetup(): void;
/**
 * Dashboard with multiple independent async sections.
 */
export declare function multipleSuspenseExample(): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Integrate streaming SSR with Node.js HTTP server.
 */
export declare function createStreamingHandler(): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * Page with explicit island boundaries.
 */
export declare function explicitIslandsExample(): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Client-side setup for explicit islands.
 */
export declare function clientIslandSetup(): void;
/**
 * Optimized streaming with performance monitoring.
 */
export declare function performanceOptimizedExample(): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Page with error handling.
 */
export declare function errorHandlingExample(): ReadableStream<Uint8Array<ArrayBufferLike>>;
/**
 * Quick reference for using streaming SSR:
 *
 * 1. Server-side rendering:
 *    ```ts
 *    const stream = renderToStream(jsx(App, {}), options);
 *    const nodeStream = webStreamToNodeStream(stream);
 *    nodeStream.pipe(res);
 *    ```
 *
 * 2. Add Suspense boundaries:
 *    ```ts
 *    jsx(Suspense, {
 *      fallback: jsx("div", { children: "Loading..." }),
 *      children: jsx(AsyncComponent, {})
 *    })
 *    ```
 *
 * 3. Mark interactive components:
 *    ```ts
 *    renderToStream(jsx(App, {}), {
 *      selectiveHydration: true,
 *      interactiveComponents: new Set([Counter, SearchBox])
 *    })
 *    ```
 *
 * 4. Client-side hydration:
 *    ```ts
 *    registerIsland("Counter", Counter);
 *    autoHydrateIslands(HydrationStrategy.VISIBLE);
 *    ```
 *
 * Performance benefits:
 * - 50%+ faster TTFB (Time-to-First-Byte)
 * - Progressive rendering of async content
 * - Reduced JavaScript bundle size (selective hydration)
 * - Better Core Web Vitals scores
 */
//# sourceMappingURL=streaming-ssr-example.d.ts.map