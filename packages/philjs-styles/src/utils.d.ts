/**
 * PhilJS Styles - Utilities
 */
import type { CSSProperties } from './types.js';
/**
 * Generate a short hash from a string
 */
export declare function generateHash(str: string): string;
/**
 * Inject styles into the document
 */
export declare function injectStyles(css: string, id: string): void;
/**
 * Remove injected styles
 */
export declare function removeStyles(id: string): void;
/**
 * Convert CSS property to string
 */
export declare function cssPropertyToString(property: string, value: unknown): string;
/**
 * Combine class names (clsx/classnames compatible)
 */
export declare function cx(...args: (string | undefined | null | false | Record<string, boolean>)[]): string;
export declare const clsx: typeof cx;
export declare const classNames: typeof cx;
/**
 * Merge style objects
 */
export declare function mergeStyles(...styles: (CSSProperties | undefined | null)[]): CSSProperties;
/**
 * Extract critical CSS for SSR
 */
export declare function extractCriticalCSS(): string;
/**
 * Get all injected style IDs
 */
export declare function getInjectedStyles(): string[];
/**
 * Clear all injected styles
 */
export declare function clearAllStyles(): void;
/**
 * Media query helper
 */
export declare function media(breakpoint: string, styles: CSSProperties): Record<string, CSSProperties>;
/**
 * Responsive styles helper
 */
export declare function responsive(styles: {
    base?: CSSProperties;
    sm?: CSSProperties;
    md?: CSSProperties;
    lg?: CSSProperties;
    xl?: CSSProperties;
    '2xl'?: CSSProperties;
}): CSSProperties;
/**
 * Create CSS custom property getter
 */
export declare function cssVar(name: string, fallback?: string): string;
/**
 * Create hover styles
 */
export declare function hover(styles: CSSProperties): Record<string, CSSProperties>;
/**
 * Create focus styles
 */
export declare function focus(styles: CSSProperties): Record<string, CSSProperties>;
/**
 * Create active styles
 */
export declare function active(styles: CSSProperties): Record<string, CSSProperties>;
/**
 * Create disabled styles
 */
export declare function disabled(styles: CSSProperties): Record<string, CSSProperties>;
//# sourceMappingURL=utils.d.ts.map