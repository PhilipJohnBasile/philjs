/**
 * Server-side rendering: JSX → HTML string.
 */
import type { VNode } from "./jsx-runtime.js";
/**
 * Render a JSX element to an HTML string.
 */
export declare function renderToString(vnode: VNode): string;
/**
 * Render to a readable stream (for streaming SSR).
 *
 * Note: Currently yields the complete string. Future enhancement could add
 * Suspense-aware streaming for progressive rendering of async boundaries.
 */
export declare function renderToStream(vnode: VNode): AsyncGenerator<string>;
//# sourceMappingURL=render-to-string.d.ts.map