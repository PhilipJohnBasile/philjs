/**
 * Dimensions API
 *
 * Get screen and window dimensions with reactive updates.
 */
import { type Signal } from 'philjs-core';
/**
 * Dimension metrics
 */
export interface DimensionMetrics {
    /**
     * Width in density-independent pixels
     */
    width: number;
    /**
     * Height in density-independent pixels
     */
    height: number;
    /**
     * Pixel density scale factor
     */
    scale: number;
    /**
     * Font scale factor (for accessibility)
     */
    fontScale: number;
}
/**
 * All dimension types
 */
export interface DimensionsData {
    /**
     * Window dimensions (excludes system bars on some platforms)
     */
    window: DimensionMetrics;
    /**
     * Screen dimensions (full screen including system bars)
     */
    screen: DimensionMetrics;
}
/**
 * Dimension change event handler
 */
export type DimensionChangeHandler = (dimensions: DimensionsData) => void;
/**
 * Dimensions API for getting screen/window size
 */
export declare const Dimensions: {
    /**
     * Get dimensions for a specific dimension type
     */
    get(dim: "window" | "screen"): DimensionMetrics;
    /**
     * Set custom dimensions (useful for testing)
     */
    set(dimensions: Partial<DimensionsData>): void;
    /**
     * Add event listener for dimension changes
     */
    addEventListener(type: "change", handler: DimensionChangeHandler): void;
    /**
     * Remove event listener
     */
    removeEventListener(type: "change", handler: DimensionChangeHandler): void;
};
/**
 * Hook to get window dimensions
 */
export declare function useWindowDimensions(): DimensionMetrics;
/**
 * Hook to get screen dimensions
 */
export declare function useScreenDimensions(): DimensionMetrics;
/**
 * Hook to get all dimensions
 */
export declare function useDimensions(): DimensionsData;
/**
 * Reactive window dimensions signal
 */
export declare const windowDimensions: Signal<DimensionMetrics>;
/**
 * Reactive screen dimensions signal
 */
export declare const screenDimensions: Signal<DimensionMetrics>;
/**
 * Check if device is in landscape orientation
 */
export declare function isLandscape(): boolean;
/**
 * Check if device is in portrait orientation
 */
export declare function isPortrait(): boolean;
/**
 * Get current orientation
 */
export declare function getOrientation(): 'portrait' | 'landscape';
/**
 * Reactive orientation signal
 */
export declare const orientation: Signal<'portrait' | 'landscape'>;
/**
 * Hook to get orientation
 */
export declare function useOrientation(): 'portrait' | 'landscape';
/**
 * Get device type based on dimensions
 */
export declare function getDeviceType(): 'phone' | 'tablet' | 'desktop';
/**
 * Reactive device type signal
 */
export declare const deviceType: Signal<'phone' | 'tablet' | 'desktop'>;
/**
 * Hook to get device type
 */
export declare function useDeviceType(): 'phone' | 'tablet' | 'desktop';
/**
 * Default breakpoints
 */
export declare const defaultBreakpoints: {
    readonly xs: 0;
    readonly sm: 576;
    readonly md: 768;
    readonly lg: 992;
    readonly xl: 1200;
    readonly xxl: 1400;
};
/**
 * Get current breakpoint
 */
export declare function getBreakpoint(breakpoints?: Record<string, number>): string;
/**
 * Reactive breakpoint signal
 */
export declare const breakpoint: Signal<string>;
/**
 * Hook to get current breakpoint
 */
export declare function useBreakpoint(customBreakpoints?: Record<string, number>): string;
/**
 * Check if current width is at least a breakpoint
 */
export declare function isBreakpointUp(bp: string, breakpoints?: Record<string, number>): boolean;
/**
 * Check if current width is below a breakpoint
 */
export declare function isBreakpointDown(bp: string, breakpoints?: Record<string, number>): boolean;
/**
 * Get pixel ratio
 */
export declare function getPixelRatio(): number;
/**
 * Reactive pixel ratio signal
 */
export declare const pixelRatio: Signal<number>;
/**
 * Hook to get pixel ratio
 */
export declare function usePixelRatio(): number;
/**
 * Round to nearest pixel
 */
export declare function roundToNearestPixel(value: number): number;
/**
 * Get font scale
 */
export declare function getFontScaleValue(): number;
/**
 * Hook to get font scale
 */
export declare function useFontScale(): number;
export default Dimensions;
//# sourceMappingURL=Dimensions.d.ts.map