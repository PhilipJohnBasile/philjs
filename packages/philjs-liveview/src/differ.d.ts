/**
 * PhilJS LiveView - DOM Differ
 *
 * Computes minimal DOM patches between two HTML strings.
 * Uses morphdom concepts for efficient updates.
 */
import type { DOMPatch } from './types.js';
export interface Differ {
    /** Compute patches between old and new HTML */
    diff(oldHtml: string, newHtml: string): DOMPatch[];
    /** Apply patches to get new HTML (for testing) */
    patch(html: string, patches: DOMPatch[]): string;
}
/**
 * Create a new differ instance
 */
export declare function createDiffer(): Differ;
interface VNode {
    type: 'element' | 'text' | 'comment';
    tag?: string | undefined;
    attributes?: Record<string, string> | undefined;
    children?: VNode[] | undefined;
    content?: string | undefined;
    key?: string | undefined;
}
/**
 * Parse HTML string into virtual DOM
 */
declare function parseHtml(html: string): VNode;
/**
 * Convert VNode back to HTML string
 */
declare function vnodeToHtml(node: VNode): string;
/**
 * Apply DOM patches using morphdom (client-side)
 * This is a wrapper that works with morphdom library
 */
export declare function applyPatches(container: HTMLElement, patches: DOMPatch[]): void;
export { parseHtml, vnodeToHtml };
export type { VNode };
//# sourceMappingURL=differ.d.ts.map