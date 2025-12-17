/**
 * PhilJS Styles - Type Definitions
 */
import type { CSSProperties as ReactCSSProperties } from 'react';
export type CSSProperties = ReactCSSProperties & {
    [key: `--${string}`]: string | number;
};
export interface StyleObject {
    [selector: string]: CSSProperties | StyleObject;
}
export interface Theme {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        foreground: string;
        muted: string;
        mutedForeground: string;
        border: string;
        error: string;
        warning: string;
        success: string;
        info: string;
        [key: string]: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        [key: string]: string;
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
        [key: string]: string;
    };
    fontWeight: {
        thin: number;
        light: number;
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
        extrabold: number;
        [key: string]: number;
    };
    borderRadius: {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
        [key: string]: string;
    };
    shadows: {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        [key: string]: string;
    };
    breakpoints: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        [key: string]: string;
    };
    transitions: {
        fast: string;
        normal: string;
        slow: string;
        [key: string]: string;
    };
    zIndex: {
        dropdown: number;
        sticky: number;
        fixed: number;
        modal: number;
        popover: number;
        tooltip: number;
        [key: string]: number;
    };
}
export interface ThemeConfig {
    defaultTheme?: 'light' | 'dark' | 'system';
    themes?: {
        light?: Partial<Theme>;
        dark?: Partial<Theme>;
        [key: string]: Partial<Theme> | undefined;
    };
    cssVariablePrefix?: string;
}
export interface StyleVariant<Props = {}> {
    base: CSSProperties;
    variants?: {
        [key: string]: {
            [value: string]: CSSProperties;
        };
    };
    compoundVariants?: Array<{
        [key: string]: string | boolean;
        css: CSSProperties;
    }>;
    defaultVariants?: {
        [key: string]: string | boolean;
    };
}
export interface ScopedStylesConfig {
    /** Hash prefix for scoped class names */
    prefix?: string;
    /** Hash length */
    hashLength?: number;
    /** Include source file in hash */
    includeSourceFile?: boolean;
}
export interface CSSModuleConfig {
    /** Generate scoped class names */
    scopeBehaviour?: 'local' | 'global';
    /** Class name pattern */
    localIdentName?: string;
    /** Export class names */
    exportLocalsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';
}
//# sourceMappingURL=types.d.ts.map