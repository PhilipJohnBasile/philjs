/**
 * Appearance API
 *
 * Handle light/dark mode and other appearance settings.
 */
import { type Signal } from 'philjs-core';
/**
 * Color scheme type
 */
export type ColorScheme = 'light' | 'dark';
/**
 * Appearance preferences
 */
export interface AppearancePreferences {
    /**
     * Current color scheme
     */
    colorScheme: ColorScheme;
    /**
     * Whether reduced motion is enabled
     */
    reduceMotion: boolean;
    /**
     * Whether reduced transparency is enabled
     */
    reduceTransparency: boolean;
    /**
     * Whether high contrast is enabled
     */
    highContrast: boolean;
    /**
     * Whether to prefer cross-fade transitions
     */
    prefersCrossFade: boolean;
    /**
     * Whether dark mode is on
     */
    isDarkMode: boolean;
}
/**
 * Appearance change handler
 */
export type AppearanceChangeHandler = (preferences: AppearancePreferences) => void;
/**
 * Appearance API
 */
export declare const Appearance: {
    /**
     * Get the current color scheme
     */
    getColorScheme(): ColorScheme;
    /**
     * Set the color scheme (override system preference)
     */
    setColorScheme(colorScheme: ColorScheme | null): void;
    /**
     * Add event listener for appearance changes
     */
    addChangeListener(handler: AppearanceChangeHandler): void;
    /**
     * Remove event listener
     */
    removeChangeListener(handler: AppearanceChangeHandler): void;
};
/**
 * Hook to get color scheme
 */
export declare function useColorScheme(): ColorScheme;
/**
 * Hook to check if dark mode
 */
export declare function useIsDarkMode(): boolean;
/**
 * Hook to get all appearance preferences
 */
export declare function useAppearance(): AppearancePreferences;
/**
 * Hook to check if reduced motion is preferred
 */
export declare function useReducedMotion(): boolean;
/**
 * Hook to check if high contrast is preferred
 */
export declare function useHighContrast(): boolean;
/**
 * Reactive color scheme signal
 */
export declare const colorScheme: Signal<ColorScheme>;
/**
 * Reactive dark mode signal
 */
export declare const isDarkMode: Signal<boolean>;
/**
 * Reactive reduced motion signal
 */
export declare const reducedMotion: Signal<boolean>;
/**
 * Reactive high contrast signal
 */
export declare const highContrast: Signal<boolean>;
/**
 * Toggle color scheme
 */
export declare function toggleColorScheme(): void;
/**
 * Reset to system color scheme
 */
export declare function resetColorScheme(): void;
/**
 * Get color based on current scheme
 */
export declare function colorForScheme<T>(lightValue: T, darkValue: T): T;
/**
 * Create a dynamic color that changes with scheme
 */
export declare function dynamicColor(light: string, dark: string): Signal<string>;
/**
 * System color definitions
 */
export declare const SystemColors: {
    label: Signal<string>;
    secondaryLabel: Signal<string>;
    tertiaryLabel: Signal<string>;
    quaternaryLabel: Signal<string>;
    systemBackground: Signal<string>;
    secondarySystemBackground: Signal<string>;
    tertiarySystemBackground: Signal<string>;
    systemGroupedBackground: Signal<string>;
    secondarySystemGroupedBackground: Signal<string>;
    tertiarySystemGroupedBackground: Signal<string>;
    systemFill: Signal<string>;
    secondarySystemFill: Signal<string>;
    tertiarySystemFill: Signal<string>;
    quaternarySystemFill: Signal<string>;
    separator: Signal<string>;
    opaqueSeparator: Signal<string>;
    link: Signal<string>;
    systemRed: Signal<string>;
    systemOrange: Signal<string>;
    systemYellow: Signal<string>;
    systemGreen: Signal<string>;
    systemMint: Signal<string>;
    systemTeal: Signal<string>;
    systemCyan: Signal<string>;
    systemBlue: Signal<string>;
    systemIndigo: Signal<string>;
    systemPurple: Signal<string>;
    systemPink: Signal<string>;
    systemBrown: Signal<string>;
    systemGray: Signal<string>;
    systemGray2: Signal<string>;
    systemGray3: Signal<string>;
    systemGray4: Signal<string>;
    systemGray5: Signal<string>;
    systemGray6: Signal<string>;
};
export default Appearance;
//# sourceMappingURL=Appearance.d.ts.map