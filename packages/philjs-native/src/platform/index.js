/**
 * PhilJS Native Platform APIs
 *
 * Platform detection, dimensions, and appearance.
 */
// Platform
export { Platform, platformOS, platformVersion, usePlatform, useIsPlatform, usePlatformValue, isIOS, isAndroid, isWeb, isNative, isDesktop, isDevelopment, isProduction, } from './Platform.js';
// Dimensions
export { Dimensions, useWindowDimensions, useScreenDimensions, useDimensions, windowDimensions, screenDimensions, isLandscape, isPortrait, getOrientation, orientation, useOrientation, getDeviceType, deviceType, useDeviceType, defaultBreakpoints, getBreakpoint, breakpoint, useBreakpoint, isBreakpointUp, isBreakpointDown, getPixelRatio, pixelRatio, usePixelRatio, roundToNearestPixel, getFontScaleValue, useFontScale, } from './Dimensions.js';
// Appearance
export { Appearance, useColorScheme, useIsDarkMode, useAppearance, useReducedMotion, useHighContrast, colorScheme, isDarkMode, reducedMotion, highContrast, toggleColorScheme, resetColorScheme, colorForScheme, dynamicColor, SystemColors, } from './Appearance.js';
//# sourceMappingURL=index.js.map