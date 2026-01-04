/**
 * Tailwind theme generator
 * Generates theme configurations from various sources
 */
/**
 * Color palette generator
 */
export interface ColorPalette {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
}
/**
 * Theme configuration
 */
export interface ThemeConfig {
    colors?: Record<string, string | ColorPalette>;
    fontFamily?: Record<string, string[]>;
    fontSize?: Record<string, [string, {
        lineHeight: string;
    }]>;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
    boxShadow?: Record<string, string>;
    screens?: Record<string, string>;
    extend?: Record<string, any>;
}
/**
 * Generate color palette from base color
 */
export declare function generateColorPalette(baseColor: string): ColorPalette;
/**
 * Generate theme from brand colors
 */
export declare function generateBrandTheme(colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
}): ThemeConfig;
/**
 * Typography scale generator
 */
export declare function generateTypographyScale(baseSize?: number, ratio?: number): ThemeConfig["fontSize"];
/**
 * Spacing scale generator
 */
export declare function generateSpacingScale(baseUnit?: number): ThemeConfig["spacing"];
/**
 * Border radius scale generator
 */
export declare function generateBorderRadiusScale(): ThemeConfig["borderRadius"];
/**
 * Shadow scale generator
 */
export declare function generateShadowScale(): ThemeConfig["boxShadow"];
/**
 * Breakpoint generator
 */
export declare function generateBreakpoints(type?: "mobile-first" | "desktop-first"): ThemeConfig["screens"];
/**
 * Font family generator
 */
export declare function generateFontFamilies(options?: {
    sans?: string[];
    serif?: string[];
    mono?: string[];
}): ThemeConfig["fontFamily"];
/**
 * Complete theme generator
 */
export declare function generateCompleteTheme(options?: {
    brandColors?: {
        primary: string;
        secondary?: string;
        accent?: string;
    };
    typography?: {
        baseSize?: number;
        ratio?: number;
    };
    spacing?: {
        baseUnit?: number;
    };
    fonts?: {
        sans?: string[];
        serif?: string[];
        mono?: string[];
    };
}): ThemeConfig;
/**
 * Convert CSS variables to Tailwind theme
 */
export declare function cssVarsToTheme(cssVars: Record<string, string>): ThemeConfig;
/**
 * Merge multiple theme configs
 */
export declare function mergeThemes(...themes: ThemeConfig[]): ThemeConfig;
/**
 * Preset themes
 */
export declare const presetThemes: {
    modern: ThemeConfig;
    minimal: ThemeConfig;
    vibrant: ThemeConfig;
};
//# sourceMappingURL=theme-generator.d.ts.map