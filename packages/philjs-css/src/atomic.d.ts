import type { AtomicConfig, CSSStyleObject, CSSResult } from './types.js';
/**
 * Atomic CSS class registry
 */
declare class AtomicRegistry {
    private atomicClasses;
    register(key: string, style: CSSStyleObject): CSSResult;
    get(key: string): CSSResult | undefined;
    clear(): void;
    getAll(): Map<string, CSSResult>;
}
export declare const atomicRegistry: AtomicRegistry;
/**
 * Generate atomic utility classes
 *
 * @example
 * ```ts
 * const utilities = generateAtomicClasses({
 *   properties: ['margin', 'padding', 'color'],
 *   values: {
 *     '0': '0',
 *     '1': '0.25rem',
 *     '2': '0.5rem',
 *     '4': '1rem',
 *     'blue': '#3b82f6',
 *     'red': '#ef4444'
 *   }
 * });
 *
 * // Access: utilities.m1, utilities.p2, utilities.colorBlue
 * ```
 */
export declare function generateAtomicClasses(config: AtomicConfig): Record<string, string>;
/**
 * Create spacing utilities (margin and padding)
 *
 * @example
 * ```ts
 * const spacing = createSpacingUtilities({
 *   0: '0',
 *   1: '0.25rem',
 *   2: '0.5rem',
 *   4: '1rem',
 *   8: '2rem'
 * });
 *
 * // spacing.m4, spacing.p2, spacing.mt1, etc.
 * ```
 */
export declare function createSpacingUtilities(scale: Record<string, string | number>): Record<string, string>;
/**
 * Create color utilities
 *
 * @example
 * ```ts
 * const colors = createColorUtilities({
 *   blue: '#3b82f6',
 *   red: '#ef4444',
 *   green: '#10b981'
 * });
 *
 * // colors.textBlue, colors.bgRed, colors.borderGreen
 * ```
 */
export declare function createColorUtilities(palette: Record<string, string>): Record<string, string>;
/**
 * Create typography utilities
 *
 * @example
 * ```ts
 * const typography = createTypographyUtilities({
 *   fontSize: { sm: '14px', base: '16px', lg: '18px' },
 *   fontWeight: { normal: 400, bold: 700 },
 *   lineHeight: { tight: 1.25, normal: 1.5 }
 * });
 * ```
 */
export declare function createTypographyUtilities(config: {
    fontSize?: Record<string, string | number>;
    fontWeight?: Record<string, string | number>;
    lineHeight?: Record<string, string | number>;
    letterSpacing?: Record<string, string | number>;
}): Record<string, string>;
/**
 * Create layout utilities
 *
 * @example
 * ```ts
 * const layout = createLayoutUtilities();
 * // layout.flex, layout.grid, layout.block, layout.hidden, etc.
 * ```
 */
export declare function createLayoutUtilities(): Record<string, string>;
/**
 * Create a complete atomic CSS system
 *
 * @example
 * ```ts
 * const atoms = createAtomicSystem({
 *   spacing: { 0: '0', 1: '4px', 2: '8px', 4: '16px' },
 *   colors: { blue: '#3b82f6', red: '#ef4444' },
 *   fontSize: { sm: '14px', base: '16px', lg: '18px' }
 * });
 *
 * // atoms.m4, atoms.p2, atoms.textBlue, atoms.bgRed, atoms.textSm, etc.
 * ```
 */
export declare function createAtomicSystem(config: {
    spacing?: Record<string, string | number>;
    colors?: Record<string, string>;
    fontSize?: Record<string, string | number>;
    fontWeight?: Record<string, string | number>;
    lineHeight?: Record<string, string | number>;
    letterSpacing?: Record<string, string | number>;
    breakpoints?: Record<string, string>;
}): Record<string, string>;
/**
 * Extract all atomic CSS
 */
export declare function extractAtomicCSS(): string;
/**
 * Reset atomic registry
 */
export declare function resetAtomicRegistry(): void;
export {};
//# sourceMappingURL=atomic.d.ts.map