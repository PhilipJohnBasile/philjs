/**
 * Dimensions API
 *
 * Get screen and window dimensions with reactive updates.
 */
import { signal, effect } from 'philjs-core';
import { Platform } from './Platform.js';
// ============================================================================
// Initial Values
// ============================================================================
/**
 * Get initial dimension metrics
 */
function getInitialDimensions() {
    if (typeof window === 'undefined') {
        // SSR defaults
        return {
            window: { width: 375, height: 812, scale: 2, fontScale: 1 },
            screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
        };
    }
    const scale = window.devicePixelRatio || 1;
    const fontScale = getFontScale();
    return {
        window: {
            width: window.innerWidth,
            height: window.innerHeight,
            scale,
            fontScale,
        },
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            scale,
            fontScale,
        },
    };
}
/**
 * Get font scale factor
 */
function getFontScale() {
    if (typeof window === 'undefined')
        return 1;
    // Try to detect font scale from CSS
    const testElement = document.createElement('div');
    testElement.style.cssText = 'font-size: 16px; position: absolute; visibility: hidden;';
    document.body.appendChild(testElement);
    const computedSize = parseFloat(getComputedStyle(testElement).fontSize);
    document.body.removeChild(testElement);
    return computedSize / 16;
}
// ============================================================================
// State
// ============================================================================
/**
 * Current dimensions signal
 */
const dimensionsSignal = signal(getInitialDimensions());
/**
 * Dimension change subscribers
 */
const subscribers = new Set();
// ============================================================================
// Event Handling
// ============================================================================
/**
 * Update dimensions and notify subscribers
 */
function updateDimensions() {
    const newDimensions = getInitialDimensions();
    dimensionsSignal.set(newDimensions);
    subscribers.forEach(handler => {
        try {
            handler(newDimensions);
        }
        catch (error) {
            console.error('Error in dimension change handler:', error);
        }
    });
}
// Set up listeners
if (typeof window !== 'undefined') {
    // Resize event
    window.addEventListener('resize', updateDimensions);
    // Orientation change
    window.addEventListener('orientationchange', () => {
        // Delay to get accurate dimensions after orientation change
        setTimeout(updateDimensions, 100);
    });
    // Visual viewport changes (for keyboard, etc.)
    if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateDimensions);
    }
}
// ============================================================================
// Dimensions API
// ============================================================================
/**
 * Dimensions API for getting screen/window size
 */
export const Dimensions = {
    /**
     * Get dimensions for a specific dimension type
     */
    get(dim) {
        return dimensionsSignal()[dim];
    },
    /**
     * Set custom dimensions (useful for testing)
     */
    set(dimensions) {
        const current = dimensionsSignal();
        dimensionsSignal.set({
            window: dimensions.window || current.window,
            screen: dimensions.screen || current.screen,
        });
    },
    /**
     * Add event listener for dimension changes
     */
    addEventListener(type, handler) {
        subscribers.add(handler);
    },
    /**
     * Remove event listener
     */
    removeEventListener(type, handler) {
        subscribers.delete(handler);
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get window dimensions
 */
export function useWindowDimensions() {
    return dimensionsSignal().window;
}
/**
 * Hook to get screen dimensions
 */
export function useScreenDimensions() {
    return dimensionsSignal().screen;
}
/**
 * Hook to get all dimensions
 */
export function useDimensions() {
    return dimensionsSignal();
}
// ============================================================================
// Signals
// ============================================================================
/**
 * Reactive window dimensions signal
 */
export const windowDimensions = signal(getInitialDimensions().window);
/**
 * Reactive screen dimensions signal
 */
export const screenDimensions = signal(getInitialDimensions().screen);
// Keep signals in sync
effect(() => {
    const dims = dimensionsSignal();
    windowDimensions.set(dims.window);
    screenDimensions.set(dims.screen);
});
// ============================================================================
// Utilities
// ============================================================================
/**
 * Check if device is in landscape orientation
 */
export function isLandscape() {
    const dims = dimensionsSignal().window;
    return dims.width > dims.height;
}
/**
 * Check if device is in portrait orientation
 */
export function isPortrait() {
    return !isLandscape();
}
/**
 * Get current orientation
 */
export function getOrientation() {
    return isLandscape() ? 'landscape' : 'portrait';
}
/**
 * Reactive orientation signal
 */
export const orientation = signal(getOrientation());
// Update orientation signal
effect(() => {
    const dims = dimensionsSignal().window;
    orientation.set(dims.width > dims.height ? 'landscape' : 'portrait');
});
/**
 * Hook to get orientation
 */
export function useOrientation() {
    return orientation();
}
/**
 * Get device type based on dimensions
 */
export function getDeviceType() {
    const dims = dimensionsSignal().window;
    const shortDimension = Math.min(dims.width, dims.height);
    if (shortDimension < 600) {
        return 'phone';
    }
    else if (shortDimension < 960) {
        return 'tablet';
    }
    return 'desktop';
}
/**
 * Reactive device type signal
 */
export const deviceType = signal(getDeviceType());
// Update device type signal
effect(() => {
    dimensionsSignal();
    deviceType.set(getDeviceType());
});
/**
 * Hook to get device type
 */
export function useDeviceType() {
    return deviceType();
}
// ============================================================================
// Breakpoints
// ============================================================================
/**
 * Default breakpoints
 */
export const defaultBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};
/**
 * Get current breakpoint
 */
export function getBreakpoint(breakpoints = defaultBreakpoints) {
    const width = dimensionsSignal().window.width;
    const sortedBreakpoints = Object.entries(breakpoints).sort(([, a], [, b]) => b - a);
    for (const [name, minWidth] of sortedBreakpoints) {
        if (width >= minWidth) {
            return name;
        }
    }
    return Object.keys(breakpoints)[0] ?? 'xs';
}
/**
 * Reactive breakpoint signal
 */
export const breakpoint = signal(getBreakpoint());
// Update breakpoint signal
effect(() => {
    dimensionsSignal();
    breakpoint.set(getBreakpoint());
});
/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(customBreakpoints) {
    if (customBreakpoints) {
        dimensionsSignal(); // Subscribe to changes
        return getBreakpoint(customBreakpoints);
    }
    return breakpoint();
}
/**
 * Check if current width is at least a breakpoint
 */
export function isBreakpointUp(bp, breakpoints = defaultBreakpoints) {
    const width = dimensionsSignal().window.width;
    const breakpointWidth = breakpoints[bp];
    return breakpointWidth !== undefined && width >= breakpointWidth;
}
/**
 * Check if current width is below a breakpoint
 */
export function isBreakpointDown(bp, breakpoints = defaultBreakpoints) {
    return !isBreakpointUp(bp, breakpoints);
}
// ============================================================================
// Pixel Ratio Utilities
// ============================================================================
/**
 * Get pixel ratio
 */
export function getPixelRatio() {
    return dimensionsSignal().window.scale;
}
/**
 * Reactive pixel ratio signal
 */
export const pixelRatio = signal(getPixelRatio());
// Update pixel ratio signal
effect(() => {
    dimensionsSignal();
    pixelRatio.set(getPixelRatio());
});
/**
 * Hook to get pixel ratio
 */
export function usePixelRatio() {
    return pixelRatio();
}
/**
 * Round to nearest pixel
 */
export function roundToNearestPixel(value) {
    const ratio = getPixelRatio();
    return Math.round(value * ratio) / ratio;
}
/**
 * Get font scale
 */
export function getFontScaleValue() {
    return dimensionsSignal().window.fontScale;
}
/**
 * Hook to get font scale
 */
export function useFontScale() {
    return dimensionsSignal().window.fontScale;
}
export default Dimensions;
//# sourceMappingURL=Dimensions.js.map