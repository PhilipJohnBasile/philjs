/**
 * Client-side hydration runtime.
 * Attaches event handlers and initializes reactivity on server-rendered HTML.
 */
import type { VNode } from "./jsx-runtime.js";
/**
 * Hydrate a server-rendered DOM tree with interactivity.
 * @param vnode - The JSX element to hydrate
 * @param container - The DOM container that was server-rendered
 */
export declare function hydrate(vnode: VNode, container: Element): void;
/**
 * Create a client-side element (for client-only components).
 */
export declare function render(vnode: VNode, container: Element): void;
//# sourceMappingURL=hydrate.d.ts.map