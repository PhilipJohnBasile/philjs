/**
 * PhilJS Image Optimization
 *
 * Automatic image optimization with format conversion,
 * responsive sizing, lazy loading, and blur placeholders.
 */
// Components
export { Image, default } from './Image';
// Utilities
export { isExternalUrl, generateSrcSet, getOptimizedUrl, generateBlurDataURL, getFormatFromSrc, calculateAspectRatio, getResponsiveSizes, isValidFormat, getDominantColor, createCacheKey, } from './utils';
// Server-side optimizer (only available in Node.js)
export { configure, getConfig, optimizeImage, getMetadata, generateBlurPlaceholder, generateResponsiveSet, extractDominantColor, isSharpAvailable, } from './optimizer';
//# sourceMappingURL=index.js.map