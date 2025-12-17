/**
 * PhilJS UI - Theme Provider
 *
 * Provides theming context including dark mode support
 */
import { JSX } from 'philjs-core';
import { type Theme } from './tokens';
type ColorMode = 'light' | 'dark' | 'system';
interface ThemeContextValue {
    theme: Theme;
    colorMode: () => ColorMode;
    setColorMode: (mode: ColorMode) => void;
    isDark: () => boolean;
    toggleColorMode: () => void;
}
interface ThemeProviderProps {
    children: JSX.Element;
    theme?: Partial<Theme>;
    defaultColorMode?: ColorMode;
    storageKey?: string;
}
export declare function ThemeProvider(props: ThemeProviderProps): import("philjs-core").JSXElement;
/**
 * Hook to access theme context
 */
export declare function useTheme(): ThemeContextValue;
/**
 * Hook for color mode only
 */
export declare function useColorMode(): {
    colorMode: () => ColorMode;
    setColorMode: (mode: ColorMode) => void;
    isDark: () => boolean;
    toggleColorMode: () => void;
};
/**
 * CSS custom properties for theming
 */
export declare function generateCSSVariables(theme: Theme): string;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map