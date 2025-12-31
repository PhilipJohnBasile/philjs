/**
 * PhilJS Native Styling
 *
 * Type-safe styling system with flexbox layout.
 * Similar to React Native's StyleSheet.
 */
import { signal, memo } from 'philjs-core';
import { detectPlatform, platformInfo, platformSelect } from './runtime.js';
let styleIdCounter = 0;
/**
 * StyleSheet API
 */
export const StyleSheet = {
    /**
     * Create a StyleSheet
     */
    create(styles) {
        // In production, this would optimize and validate styles
        // For now, just return the styles with unique IDs
        const result = {};
        for (const key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
                const style = styles[key];
                result[key] = {
                    __styleId: ++styleIdCounter,
                    ...style,
                };
            }
        }
        return result;
    },
    /**
     * Flatten style array into single style object
     */
    flatten(style) {
        if (!style)
            return undefined;
        if (!Array.isArray(style))
            return style;
        return style.reduce((acc, s) => {
            if (!s)
                return acc;
            if (Array.isArray(s)) {
                return { ...acc, ...this.flatten(s) };
            }
            return { ...acc, ...s };
        }, {});
    },
    /**
     * Compose multiple styles
     */
    compose(style1, style2) {
        if (!style1 && !style2)
            return undefined;
        if (!style1)
            return style2;
        if (!style2)
            return style1;
        return [style1, style2];
    },
    /**
     * Absolute fill shorthand
     */
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    /**
     * Absolute fill object
     */
    absoluteFillObject: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    /**
     * Hairline width (1 pixel on all devices)
     */
    hairlineWidth: typeof window !== 'undefined'
        ? 1 / (window.devicePixelRatio || 1)
        : 1,
};
/**
 * Current color scheme signal
 */
export const colorScheme = signal(getInitialColorScheme());
/**
 * Get initial color scheme
 */
function getInitialColorScheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}
// Listen for color scheme changes
if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        colorScheme.set(e.matches ? 'dark' : 'light');
    });
}
/**
 * Hook to get color scheme
 */
export function useColorScheme() {
    return colorScheme();
}
// ============================================================================
// Platform-specific Styling
// ============================================================================
/**
 * Platform-specific style selection
 */
export function platformStyles(options) {
    const platform = detectPlatform();
    if (platform === 'ios' && options.ios) {
        return { ...options.default, ...options.ios };
    }
    if (platform === 'android' && options.android) {
        return { ...options.default, ...options.android };
    }
    if (platform === 'web' && options.web) {
        return { ...options.default, ...options.web };
    }
    if (platform !== 'web' && options.native) {
        return { ...options.default, ...options.native };
    }
    return options.default;
}
/**
 * Default light theme
 */
export const lightTheme = {
    colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        error: '#FF3B30',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#000000',
        onSurface: '#000000',
        onError: '#FFFFFF',
        text: '#000000',
        textSecondary: '#8E8E93',
        border: '#C6C6C8',
        disabled: '#C7C7CC',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    typography: {
        h1: { fontSize: 34, fontWeight: 'bold', letterSpacing: 0.25 },
        h2: { fontSize: 28, fontWeight: 'bold', letterSpacing: 0 },
        h3: { fontSize: 22, fontWeight: '600', letterSpacing: 0.15 },
        h4: { fontSize: 20, fontWeight: '600', letterSpacing: 0.15 },
        h5: { fontSize: 17, fontWeight: '600', letterSpacing: 0.15 },
        h6: { fontSize: 15, fontWeight: '600', letterSpacing: 0.15 },
        body1: { fontSize: 17, fontWeight: 'normal', letterSpacing: 0.5 },
        body2: { fontSize: 15, fontWeight: 'normal', letterSpacing: 0.25 },
        caption: { fontSize: 13, fontWeight: 'normal', letterSpacing: 0.4 },
        button: { fontSize: 17, fontWeight: '600', letterSpacing: 0.5, textTransform: 'none' },
        overline: { fontSize: 11, fontWeight: '500', letterSpacing: 1.5, textTransform: 'uppercase' },
    },
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 16,
        full: 9999,
    },
};
/**
 * Default dark theme
 */
export const darkTheme = {
    ...lightTheme,
    colors: {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        background: '#000000',
        surface: '#1C1C1E',
        error: '#FF453A',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#FFFFFF',
        onSurface: '#FFFFFF',
        onError: '#FFFFFF',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        border: '#38383A',
        disabled: '#48484A',
    },
};
/**
 * Current theme signal
 */
export const currentTheme = signal(lightTheme);
/**
 * Set theme
 */
export function setTheme(theme) {
    currentTheme.set(theme);
}
/**
 * Hook to get current theme
 */
export function useTheme() {
    return currentTheme();
}
/**
 * Hook to get themed styles
 */
export function useThemedStyles(createStyles) {
    const theme = useTheme();
    return memo(() => createStyles(theme))();
}
// ============================================================================
// Responsive Utilities
// ============================================================================
/**
 * Breakpoints
 */
export const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};
/**
 * Current breakpoint
 */
export const currentBreakpoint = signal(getBreakpoint());
function getBreakpoint() {
    if (typeof window === 'undefined')
        return 'md';
    const width = window.innerWidth;
    if (width < breakpoints.sm)
        return 'xs';
    if (width < breakpoints.md)
        return 'sm';
    if (width < breakpoints.lg)
        return 'md';
    if (width < breakpoints.xl)
        return 'lg';
    if (width < breakpoints.xxl)
        return 'xl';
    return 'xxl';
}
// Update breakpoint on resize
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        currentBreakpoint.set(getBreakpoint());
    });
}
/**
 * Responsive style based on breakpoint
 */
export function responsive(options) {
    const bp = currentBreakpoint();
    const bpOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = bpOrder.indexOf(bp);
    // Find the closest defined value
    for (let i = currentIndex; i >= 0; i--) {
        const key = bpOrder[i];
        if (key !== undefined && options[key] !== undefined) {
            return options[key];
        }
    }
    return undefined;
}
// ============================================================================
// Common Style Patterns
// ============================================================================
/**
 * Common style patterns
 */
export const commonStyles = StyleSheet.create({
    // Flex patterns
    row: {
        flexDirection: 'row',
    },
    column: {
        flexDirection: 'column',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceBetween: {
        justifyContent: 'space-between',
    },
    wrap: {
        flexWrap: 'wrap',
    },
    // Fill patterns
    fill: {
        flex: 1,
    },
    fillAbsolute: StyleSheet.absoluteFillObject,
    // Shadow patterns
    shadow: platformStyles({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 3,
        },
        default: {},
    }),
    shadowLarge: platformStyles({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        android: {
            elevation: 6,
        },
        default: {},
    }),
});
//# sourceMappingURL=styles.js.map