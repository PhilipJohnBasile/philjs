import type { CSSStyleObject, CSSResult, CSSProperties } from './types.js';
/**
 * Global stylesheet registry
 */
declare class StyleRegistry {
    private styles;
    private counter;
    /**
     * Register a style and return a unique class name
     */
    register(css: string): string;
    /**
     * Get all registered styles as CSS string
     */
    getStyles(): string;
    /**
     * Clear all styles
     */
    reset(): void;
    /**
     * Get style for specific class
     */
    getStyle(className: string): string | undefined;
}
export declare const styleRegistry: StyleRegistry;
/**
 * Core css() function for creating type-safe styles
 *
 * @example
 * ```ts
 * const button = css({
 *   padding: '10px 20px',
 *   backgroundColor: '#3b82f6',
 *   color: 'white',
 *   borderRadius: '4px',
 *   '&:hover': {
 *     backgroundColor: '#2563eb'
 *   }
 * });
 *
 * // Use in component
 * <button class={button}>Click me</button>
 * ```
 */
export declare function css(styleObj: CSSStyleObject): CSSResult;
/**
 * Compose multiple CSS results
 *
 * @example
 * ```ts
 * const base = css({ padding: '10px' });
 * const primary = css({ backgroundColor: 'blue' });
 * const button = compose(base, primary);
 * ```
 */
export declare function compose(...styles: (CSSResult | string | undefined | null | false)[]): string;
/**
 * Conditional class helper
 *
 * @example
 * ```ts
 * const className = cx(
 *   'base-class',
 *   isActive && 'active',
 *   isDisabled && 'disabled',
 *   conditionalClass
 * );
 * ```
 */
export declare function cx(...classNames: (string | undefined | null | false)[]): string;
/**
 * Global styles helper
 *
 * @example
 * ```ts
 * globalStyle('body', {
 *   margin: 0,
 *   padding: 0,
 *   fontFamily: 'system-ui, sans-serif'
 * });
 * ```
 */
export declare function globalStyle(selector: string, styles: CSSStyleObject): void;
/**
 * Keyframe animation helper
 *
 * @example
 * ```ts
 * const fadeIn = keyframes({
 *   from: { opacity: 0 },
 *   to: { opacity: 1 }
 * });
 *
 * const animated = css({
 *   animation: `${fadeIn} 300ms ease-in`
 * });
 * ```
 */
export declare function keyframes(frames: Record<string, CSSProperties>): string;
/**
 * Create a CSS style factory with default props
 *
 * @example
 * ```ts
 * const createButton = styleFactory({
 *   padding: '10px 20px',
 *   borderRadius: '4px'
 * });
 *
 * const primaryButton = createButton({
 *   backgroundColor: 'blue',
 *   color: 'white'
 * });
 * ```
 */
export declare function styleFactory(defaults: CSSStyleObject): (overrides?: CSSStyleObject) => CSSResult;
/**
 * Batch create multiple styles at once
 *
 * @example
 * ```ts
 * const styles = createStyles({
 *   container: { maxWidth: '1200px', margin: '0 auto' },
 *   header: { fontSize: '24px', fontWeight: 'bold' },
 *   button: { padding: '10px 20px', borderRadius: '4px' }
 * });
 * ```
 */
export declare function createStyles<T extends Record<string, CSSStyleObject>>(styles: T): {
    [K in keyof T]: CSSResult;
};
/**
 * Extract all registered CSS
 */
export declare function extractCSS(): string;
/**
 * Reset the style registry (useful for testing)
 */
export declare function resetStyles(): void;
export {};
//# sourceMappingURL=css.d.ts.map