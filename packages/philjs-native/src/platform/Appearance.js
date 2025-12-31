/**
 * Appearance API
 *
 * Handle light/dark mode and other appearance settings.
 */
import { signal, effect } from 'philjs-core';
import { Platform } from './Platform.js';
// ============================================================================
// Initial Values
// ============================================================================
/**
 * Get initial color scheme
 */
function getInitialColorScheme() {
    if (typeof window === 'undefined')
        return 'light';
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}
/**
 * Check if reduced motion is preferred
 */
function getReduceMotion() {
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
/**
 * Check if reduced transparency is preferred
 */
function getReduceTransparency() {
    if (typeof window === 'undefined')
        return false;
    return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
}
/**
 * Check if high contrast is preferred
 */
function getHighContrast() {
    if (typeof window === 'undefined')
        return false;
    // Windows high contrast mode
    const forcedColors = window.matchMedia('(forced-colors: active)').matches;
    // macOS increase contrast
    const moreContrast = window.matchMedia('(prefers-contrast: more)').matches;
    return forcedColors || moreContrast;
}
/**
 * Check if cross-fade is preferred
 */
function getPrefersCrossFade() {
    if (typeof window === 'undefined')
        return false;
    // This is an iOS-specific preference
    return globalThis.__PHILJS_PREFERS_CROSS_FADE__ === true;
}
/**
 * Get all appearance preferences
 */
function getAppearancePreferences() {
    const colorScheme = getInitialColorScheme();
    return {
        colorScheme,
        reduceMotion: getReduceMotion(),
        reduceTransparency: getReduceTransparency(),
        highContrast: getHighContrast(),
        prefersCrossFade: getPrefersCrossFade(),
        isDarkMode: colorScheme === 'dark',
    };
}
// ============================================================================
// State
// ============================================================================
/**
 * Current color scheme signal
 */
const colorSchemeSignal = signal(getInitialColorScheme());
/**
 * Appearance preferences signal
 */
const appearanceSignal = signal(getAppearancePreferences());
/**
 * User override for color scheme (null = follow system)
 */
let userColorSchemeOverride = null;
/**
 * Change subscribers
 */
const subscribers = new Set();
// ============================================================================
// Event Handling
// ============================================================================
/**
 * Update appearance and notify subscribers
 */
function updateAppearance() {
    const prefs = getAppearancePreferences();
    // Apply user override if set
    if (userColorSchemeOverride !== null) {
        prefs.colorScheme = userColorSchemeOverride;
        prefs.isDarkMode = userColorSchemeOverride === 'dark';
    }
    colorSchemeSignal.set(prefs.colorScheme);
    appearanceSignal.set(prefs);
    subscribers.forEach(handler => {
        try {
            handler(prefs);
        }
        catch (error) {
            console.error('Error in appearance change handler:', error);
        }
    });
}
// Set up listeners
if (typeof window !== 'undefined') {
    // Color scheme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (userColorSchemeOverride === null) {
            updateAppearance();
        }
    });
    // Reduced motion change
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        updateAppearance();
    });
    // Reduced transparency change
    window.matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', () => {
        updateAppearance();
    });
    // High contrast change
    window.matchMedia('(prefers-contrast: more)').addEventListener('change', () => {
        updateAppearance();
    });
    window.matchMedia('(forced-colors: active)').addEventListener('change', () => {
        updateAppearance();
    });
}
// ============================================================================
// Appearance API
// ============================================================================
/**
 * Appearance API
 */
export const Appearance = {
    /**
     * Get the current color scheme
     */
    getColorScheme() {
        if (userColorSchemeOverride !== null) {
            return userColorSchemeOverride;
        }
        return getInitialColorScheme();
    },
    /**
     * Set the color scheme (override system preference)
     */
    setColorScheme(colorScheme) {
        userColorSchemeOverride = colorScheme;
        updateAppearance();
        // Apply to document for CSS
        if (typeof document !== 'undefined') {
            if (colorScheme === null) {
                document.documentElement.removeAttribute('data-theme');
                document.documentElement.style.colorScheme = '';
            }
            else {
                document.documentElement.setAttribute('data-theme', colorScheme);
                document.documentElement.style.colorScheme = colorScheme;
            }
        }
    },
    /**
     * Add event listener for appearance changes
     */
    addChangeListener(handler) {
        subscribers.add(handler);
    },
    /**
     * Remove event listener
     */
    removeChangeListener(handler) {
        subscribers.delete(handler);
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get color scheme
 */
export function useColorScheme() {
    return colorSchemeSignal();
}
/**
 * Hook to check if dark mode
 */
export function useIsDarkMode() {
    return colorSchemeSignal() === 'dark';
}
/**
 * Hook to get all appearance preferences
 */
export function useAppearance() {
    return appearanceSignal();
}
/**
 * Hook to check if reduced motion is preferred
 */
export function useReducedMotion() {
    return appearanceSignal().reduceMotion;
}
/**
 * Hook to check if high contrast is preferred
 */
export function useHighContrast() {
    return appearanceSignal().highContrast;
}
// ============================================================================
// Signals
// ============================================================================
/**
 * Reactive color scheme signal
 */
export const colorScheme = colorSchemeSignal;
/**
 * Reactive dark mode signal
 */
export const isDarkMode = signal(colorSchemeSignal() === 'dark');
// Keep dark mode signal in sync
effect(() => {
    isDarkMode.set(colorSchemeSignal() === 'dark');
});
/**
 * Reactive reduced motion signal
 */
export const reducedMotion = signal(getReduceMotion());
// Keep reduced motion signal in sync
effect(() => {
    reducedMotion.set(appearanceSignal().reduceMotion);
});
/**
 * Reactive high contrast signal
 */
export const highContrast = signal(getHighContrast());
// Keep high contrast signal in sync
effect(() => {
    highContrast.set(appearanceSignal().highContrast);
});
// ============================================================================
// Utilities
// ============================================================================
/**
 * Toggle color scheme
 */
export function toggleColorScheme() {
    const current = Appearance.getColorScheme();
    Appearance.setColorScheme(current === 'dark' ? 'light' : 'dark');
}
/**
 * Reset to system color scheme
 */
export function resetColorScheme() {
    Appearance.setColorScheme(null);
}
/**
 * Get color based on current scheme
 */
export function colorForScheme(lightValue, darkValue) {
    return colorSchemeSignal() === 'dark' ? darkValue : lightValue;
}
/**
 * Create a dynamic color that changes with scheme
 */
export function dynamicColor(light, dark) {
    const colorSignal = signal(colorSchemeSignal() === 'dark' ? dark : light);
    effect(() => {
        colorSignal.set(colorSchemeSignal() === 'dark' ? dark : light);
    });
    return colorSignal;
}
// ============================================================================
// System Colors
// ============================================================================
/**
 * System color definitions
 */
export const SystemColors = {
    // Adaptable colors
    label: dynamicColor('rgba(0, 0, 0, 1)', 'rgba(255, 255, 255, 1)'),
    secondaryLabel: dynamicColor('rgba(60, 60, 67, 0.6)', 'rgba(235, 235, 245, 0.6)'),
    tertiaryLabel: dynamicColor('rgba(60, 60, 67, 0.3)', 'rgba(235, 235, 245, 0.3)'),
    quaternaryLabel: dynamicColor('rgba(60, 60, 67, 0.18)', 'rgba(235, 235, 245, 0.16)'),
    // Backgrounds
    systemBackground: dynamicColor('#FFFFFF', '#000000'),
    secondarySystemBackground: dynamicColor('#F2F2F7', '#1C1C1E'),
    tertiarySystemBackground: dynamicColor('#FFFFFF', '#2C2C2E'),
    // Grouped backgrounds
    systemGroupedBackground: dynamicColor('#F2F2F7', '#000000'),
    secondarySystemGroupedBackground: dynamicColor('#FFFFFF', '#1C1C1E'),
    tertiarySystemGroupedBackground: dynamicColor('#F2F2F7', '#2C2C2E'),
    // Fill colors
    systemFill: dynamicColor('rgba(120, 120, 128, 0.2)', 'rgba(120, 120, 128, 0.36)'),
    secondarySystemFill: dynamicColor('rgba(120, 120, 128, 0.16)', 'rgba(120, 120, 128, 0.32)'),
    tertiarySystemFill: dynamicColor('rgba(118, 118, 128, 0.12)', 'rgba(118, 118, 128, 0.24)'),
    quaternarySystemFill: dynamicColor('rgba(116, 116, 128, 0.08)', 'rgba(118, 118, 128, 0.18)'),
    // Separator
    separator: dynamicColor('rgba(60, 60, 67, 0.29)', 'rgba(84, 84, 88, 0.6)'),
    opaqueSeparator: dynamicColor('#C6C6C8', '#38383A'),
    // Link
    link: dynamicColor('#007AFF', '#0A84FF'),
    // Tint colors
    systemRed: dynamicColor('#FF3B30', '#FF453A'),
    systemOrange: dynamicColor('#FF9500', '#FF9F0A'),
    systemYellow: dynamicColor('#FFCC00', '#FFD60A'),
    systemGreen: dynamicColor('#34C759', '#30D158'),
    systemMint: dynamicColor('#00C7BE', '#63E6E2'),
    systemTeal: dynamicColor('#30B0C7', '#40CBE0'),
    systemCyan: dynamicColor('#32ADE6', '#64D2FF'),
    systemBlue: dynamicColor('#007AFF', '#0A84FF'),
    systemIndigo: dynamicColor('#5856D6', '#5E5CE6'),
    systemPurple: dynamicColor('#AF52DE', '#BF5AF2'),
    systemPink: dynamicColor('#FF2D55', '#FF375F'),
    systemBrown: dynamicColor('#A2845E', '#AC8E68'),
    // Grays
    systemGray: dynamicColor('#8E8E93', '#8E8E93'),
    systemGray2: dynamicColor('#AEAEB2', '#636366'),
    systemGray3: dynamicColor('#C7C7CC', '#48484A'),
    systemGray4: dynamicColor('#D1D1D6', '#3A3A3C'),
    systemGray5: dynamicColor('#E5E5EA', '#2C2C2E'),
    systemGray6: dynamicColor('#F2F2F7', '#1C1C1E'),
};
export default Appearance;
//# sourceMappingURL=Appearance.js.map