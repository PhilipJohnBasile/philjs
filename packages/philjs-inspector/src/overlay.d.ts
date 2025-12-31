/**
 * DOM overlay rendering for visual inspection
 */
import type { ComponentInfo } from './component-info.js';
export interface HighlightOptions {
    color?: string;
    showLabel?: boolean;
    showMetrics?: boolean;
}
/**
 * Initialize overlay
 */
export declare function initOverlay(): HTMLElement;
/**
 * Destroy overlay
 */
export declare function destroyOverlay(): void;
/**
 * Get overlay root element
 */
export declare function getOverlayRoot(): HTMLElement | null;
/**
 * Highlight element on hover
 */
export declare function highlightElementHover(element: Element, componentInfo?: ComponentInfo): void;
/**
 * Remove hover highlight
 */
export declare function removeHoverHighlight(): void;
/**
 * Highlight element (selected)
 */
export declare function highlightElement(element: Element, componentInfo?: ComponentInfo, options?: HighlightOptions): void;
/**
 * Remove highlight
 */
export declare function removeHighlight(): void;
/**
 * Update highlight position (on scroll/resize)
 */
export declare function updateHighlightPosition(): void;
/**
 * Get currently highlighted element
 */
export declare function getCurrentHighlightedElement(): Element | null;
/**
 * Flash highlight animation
 */
export declare function flashHighlight(element: Element, color?: string): void;
/**
 * Create measurement overlay (padding, margin, border)
 */
export declare function showElementMeasurements(element: Element): HTMLElement;
//# sourceMappingURL=overlay.d.ts.map