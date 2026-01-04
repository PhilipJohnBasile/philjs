/**
 * Floating tooltip UI for component details
 */
import type { ComponentInfo } from './component-info.js';
/**
 * Show tooltip for component
 */
export declare function showTooltip(componentInfo: ComponentInfo, position?: {
    x: number;
    y: number;
}): void;
/**
 * Hide tooltip
 */
export declare function hideTooltip(): void;
/**
 * Update tooltip content
 */
export declare function updateTooltip(componentInfo: ComponentInfo): void;
/**
 * Get current tooltip component
 */
export declare function getCurrentTooltipComponent(): ComponentInfo | null;
/**
 * Check if tooltip is visible
 */
export declare function isTooltipVisible(): boolean;
//# sourceMappingURL=tooltip.d.ts.map