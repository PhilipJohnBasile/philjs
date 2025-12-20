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
  fontSize?: Record<string, [string, { lineHeight: string }]>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  boxShadow?: Record<string, string>;
  screens?: Record<string, string>;
  extend?: Record<string, any>;
}

/**
 * Generate color palette from base color
 */
export function generateColorPalette(baseColor: string): ColorPalette {
  // This is a simplified version - in production, use a color library like chroma-js
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const adjust = (value: number, factor: number): number => {
    return Math.round(Math.min(255, Math.max(0, value + (255 - value) * factor)));
  };

  const darken = (value: number, factor: number): number => {
    return Math.round(Math.max(0, value * factor));
  };

  const toHex = (r: number, g: number, b: number): string => {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
  };

  return {
    50: toHex(adjust(r, 0.95), adjust(g, 0.95), adjust(b, 0.95)),
    100: toHex(adjust(r, 0.9), adjust(g, 0.9), adjust(b, 0.9)),
    200: toHex(adjust(r, 0.75), adjust(g, 0.75), adjust(b, 0.75)),
    300: toHex(adjust(r, 0.5), adjust(g, 0.5), adjust(b, 0.5)),
    400: toHex(adjust(r, 0.25), adjust(g, 0.25), adjust(b, 0.25)),
    500: baseColor,
    600: toHex(darken(r, 0.9), darken(g, 0.9), darken(b, 0.9)),
    700: toHex(darken(r, 0.75), darken(g, 0.75), darken(b, 0.75)),
    800: toHex(darken(r, 0.6), darken(g, 0.6), darken(b, 0.6)),
    900: toHex(darken(r, 0.45), darken(g, 0.45), darken(b, 0.45)),
    950: toHex(darken(r, 0.3), darken(g, 0.3), darken(b, 0.3)),
  };
}

/**
 * Generate theme from brand colors
 */
export function generateBrandTheme(colors: {
  primary: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
}): ThemeConfig {
  const theme: ThemeConfig = {
    colors: {
      primary: generateColorPalette(colors.primary),
    },
  };

  if (colors.secondary) {
    theme.colors!.secondary = generateColorPalette(colors.secondary);
  }

  if (colors.accent) {
    theme.colors!.accent = generateColorPalette(colors.accent);
  }

  if (colors.neutral) {
    theme.colors!.neutral = generateColorPalette(colors.neutral);
  }

  return theme;
}

/**
 * Typography scale generator
 */
export function generateTypographyScale(
  baseSize: number = 16,
  ratio: number = 1.25
): ThemeConfig["fontSize"] {
  const scale: ThemeConfig["fontSize"] = {};
  const sizes = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
  const baseIndex = 2; // "base" is at index 2

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const factor = Math.pow(ratio, i - baseIndex);
    const fontSize = `${(baseSize * factor) / 16}rem`;
    const lineHeight = i < baseIndex ? "1.5" : i === baseIndex ? "1.5" : "1.2";

    scale[size] = [fontSize, { lineHeight }];
  }

  return scale;
}

/**
 * Spacing scale generator
 */
export function generateSpacingScale(baseUnit: number = 4): ThemeConfig["spacing"] {
  const scale: ThemeConfig["spacing"] = {};
  const multipliers = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64];

  for (const multiplier of multipliers) {
    const value = baseUnit * multiplier;
    scale[multiplier.toString()] = `${value / 16}rem`;
  }

  // Add fractional values
  scale["0.5"] = `${baseUnit * 0.5 / 16}rem`;
  scale["1.5"] = `${baseUnit * 1.5 / 16}rem`;
  scale["2.5"] = `${baseUnit * 2.5 / 16}rem`;
  scale["3.5"] = `${baseUnit * 3.5 / 16}rem`;

  // Add px value
  scale.px = "1px";

  return scale;
}

/**
 * Border radius scale generator
 */
export function generateBorderRadiusScale(): ThemeConfig["borderRadius"] {
  return {
    none: "0",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  };
}

/**
 * Shadow scale generator
 */
export function generateShadowScale(): ThemeConfig["boxShadow"] {
  return {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  };
}

/**
 * Breakpoint generator
 */
export function generateBreakpoints(
  type: "mobile-first" | "desktop-first" = "mobile-first"
): ThemeConfig["screens"] {
  if (type === "mobile-first") {
    return {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    };
  } else {
    return {
      "2xl": { max: "1535px" },
      xl: { max: "1279px" },
      lg: { max: "1023px" },
      md: { max: "767px" },
      sm: { max: "639px" },
    } as any;
  }
}

/**
 * Font family generator
 */
export function generateFontFamilies(options?: {
  sans?: string[];
  serif?: string[];
  mono?: string[];
}): ThemeConfig["fontFamily"] {
  return {
    sans: options?.sans || [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ],
    serif: options?.serif || [
      "Georgia",
      "Cambria",
      "Times New Roman",
      "Times",
      "serif",
    ],
    mono: options?.mono || [
      "JetBrains Mono",
      "Fira Code",
      "Consolas",
      "Monaco",
      "Courier New",
      "monospace",
    ],
  };
}

/**
 * Complete theme generator
 */
export function generateCompleteTheme(options?: {
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
}): ThemeConfig {
  const theme: ThemeConfig = {
    extend: {},
  };

  // Add brand colors
  if (options?.brandColors) {
    const brandTheme = generateBrandTheme(options.brandColors);
    theme.colors = brandTheme.colors;
  }

  // Add typography
  if (options?.typography) {
    theme.fontSize = generateTypographyScale(
      options.typography.baseSize,
      options.typography.ratio
    );
  }

  // Add spacing
  if (options?.spacing) {
    theme.spacing = generateSpacingScale(options.spacing.baseUnit);
  }

  // Add font families
  if (options?.fonts) {
    theme.fontFamily = generateFontFamilies(options.fonts);
  }

  // Add defaults
  theme.extend = {
    borderRadius: generateBorderRadiusScale(),
    boxShadow: generateShadowScale(),
    screens: generateBreakpoints(),
  };

  return theme;
}

/**
 * Convert CSS variables to Tailwind theme
 */
export function cssVarsToTheme(cssVars: Record<string, string>): ThemeConfig {
  const theme: ThemeConfig = {
    extend: {},
  };

  for (const [key, value] of Object.entries(cssVars)) {
    // Remove -- prefix
    const cleanKey = key.replace(/^--/, "");

    // Parse key path (e.g., "color-primary-500" -> ["color", "primary", "500"])
    const parts = cleanKey.split("-");

    // Categorize based on first part
    const category = parts[0];
    const path = parts.slice(1);

    if (!theme.extend![category]) {
      theme.extend![category] = {};
    }

    // Build nested structure
    let current = theme.extend![category];
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    // Set final value
    if (path.length > 0) {
      current[path[path.length - 1]] = value;
    } else {
      theme.extend![category] = value;
    }
  }

  return theme;
}

/**
 * Merge multiple theme configs
 */
export function mergeThemes(...themes: ThemeConfig[]): ThemeConfig {
  const merged: ThemeConfig = {
    extend: {},
  };

  for (const theme of themes) {
    // Merge top-level properties
    for (const [key, value] of Object.entries(theme)) {
      if (key === "extend") {
        // Merge extend separately
        merged.extend = {
          ...merged.extend,
          ...value,
        };
      } else if (typeof value === "object" && !Array.isArray(value)) {
        merged[key as keyof ThemeConfig] = {
          ...(merged[key as keyof ThemeConfig] || {}),
          ...value,
        } as any;
      } else {
        merged[key as keyof ThemeConfig] = value as any;
      }
    }
  }

  return merged;
}

/**
 * Preset themes
 */
export const presetThemes = {
  modern: generateCompleteTheme({
    brandColors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
    },
    typography: {
      baseSize: 16,
      ratio: 1.25,
    },
  }),

  minimal: generateCompleteTheme({
    brandColors: {
      primary: "#000000",
      secondary: "#666666",
    },
    typography: {
      baseSize: 15,
      ratio: 1.2,
    },
  }),

  vibrant: generateCompleteTheme({
    brandColors: {
      primary: "#ec4899",
      secondary: "#f59e0b",
      accent: "#10b981",
    },
    typography: {
      baseSize: 17,
      ratio: 1.33,
    },
  }),
};
