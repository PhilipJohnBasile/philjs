import type { Theme, ThemeTokens } from './types.js';
/**
 * Create a type-safe theme with design tokens
 *
 * @example
 * ```ts
 * const theme = createTheme({
 *   colors: {
 *     primary: '#3b82f6',
 *     secondary: '#10b981',
 *     danger: '#ef4444'
 *   },
 *   spacing: {
 *     xs: '4px',
 *     sm: '8px',
 *     md: '16px',
 *     lg: '24px',
 *     xl: '32px'
 *   },
 *   fontSize: {
 *     sm: '14px',
 *     base: '16px',
 *     lg: '18px',
 *     xl: '24px'
 *   }
 * });
 * ```
 */
export declare function createTheme<T extends ThemeTokens>(tokens: T): Theme & {
    colors: T['colors'] extends Record<string, string> ? T['colors'] : never;
    spacing: T['spacing'] extends Record<string, string | number> ? T['spacing'] : never;
    fontSize: T['fontSize'] extends Record<string, string | number> ? T['fontSize'] : never;
    fontFamily: T['fontFamily'] extends Record<string, string> ? T['fontFamily'] : never;
    fontWeight: T['fontWeight'] extends Record<string, string | number> ? T['fontWeight'] : never;
    lineHeight: T['lineHeight'] extends Record<string, string | number> ? T['lineHeight'] : never;
    letterSpacing: T['letterSpacing'] extends Record<string, string> ? T['letterSpacing'] : never;
    borderRadius: T['borderRadius'] extends Record<string, string | number> ? T['borderRadius'] : never;
    borderWidth: T['borderWidth'] extends Record<string, string | number> ? T['borderWidth'] : never;
    shadows: T['shadows'] extends Record<string, string> ? T['shadows'] : never;
    zIndex: T['zIndex'] extends Record<string, number> ? T['zIndex'] : never;
    breakpoints: T['breakpoints'] extends Record<string, string> ? T['breakpoints'] : never;
    transitions: T['transitions'] extends Record<string, string> ? T['transitions'] : never;
};
/**
 * Get the current active theme
 */
export declare function getTheme(): Theme | null;
/**
 * Generate CSS variable declarations for theme
 *
 * @example
 * ```ts
 * const css = generateThemeCSS(theme);
 * // :root {
 * //   --colors-primary: #3b82f6;
 * //   --spacing-md: 16px;
 * // }
 * ```
 */
export declare function generateThemeCSS(theme: Theme, selector?: string): string;
/**
 * Create a theme variant (e.g., dark mode)
 *
 * @example
 * ```ts
 * const darkTheme = createThemeVariant(theme, 'dark', {
 *   colors: {
 *     primary: '#60a5fa',
 *     background: '#1f2937'
 *   }
 * });
 * ```
 */
export declare function createThemeVariant<T extends ThemeTokens>(baseTheme: Theme, name: string, overrides: Partial<T>): Theme;
/**
 * CSS variable reference helper
 *
 * @example
 * ```ts
 * const buttonStyle = css({
 *   color: cssVar('colors-primary'),
 *   padding: cssVar('spacing-md')
 * });
 * ```
 */
export declare function cssVar(name: string): string;
/**
 * Type-safe CSS variable reference
 *
 * @example
 * ```ts
 * const buttonStyle = css({
 *   color: themeVar('colors', 'primary'),
 *   padding: themeVar('spacing', 'md')
 * });
 * ```
 */
export declare function themeVar(category: string, key: string): string;
/**
 * Create responsive breakpoint utilities
 *
 * @example
 * ```ts
 * const breakpoints = createBreakpoints({
 *   sm: '640px',
 *   md: '768px',
 *   lg: '1024px',
 *   xl: '1280px'
 * });
 *
 * const responsive = css({
 *   width: '100%',
 *   [breakpoints.md]: { width: '50%' },
 *   [breakpoints.lg]: { width: '33.333%' }
 * });
 * ```
 */
export declare function createBreakpoints<T extends Record<string, string>>(breakpoints: T): {
    [K in keyof T]: string;
};
/**
 * Default theme with sensible defaults
 */
export declare const defaultTheme: Theme & {
    colors: {
        white: string;
        black: string;
        gray50: string;
        gray100: string;
        gray200: string;
        gray300: string;
        gray400: string;
        gray500: string;
        gray600: string;
        gray700: string;
        gray800: string;
        gray900: string;
        blue500: string;
        blue600: string;
        green500: string;
        green600: string;
        red500: string;
        red600: string;
        yellow500: string;
        yellow600: string;
    };
    spacing: {
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        8: string;
        10: string;
        12: string;
        16: string;
        20: string;
        24: string;
    };
    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
    };
    fontFamily: never;
    fontWeight: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };
    lineHeight: {
        tight: number;
        normal: number;
        relaxed: number;
    };
    letterSpacing: never;
    borderRadius: {
        none: string;
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        full: string;
    };
    borderWidth: never;
    shadows: {
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
    };
    zIndex: never;
    breakpoints: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
    transitions: {
        fast: string;
        base: string;
        slow: string;
    };
};
//# sourceMappingURL=theme.d.ts.map