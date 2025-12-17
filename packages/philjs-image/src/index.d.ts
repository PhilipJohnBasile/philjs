/**
 * PhilJS Image Optimization
 *
 * Automatic image optimization with format conversion,
 * responsive sizing, lazy loading, and blur placeholders.
 */
export { Image, default } from './Image';
export type { ImageProps, ImageFormat, ImageFit, ImagePosition, LoadingStrategy, PlaceholderType, ImageOptimizationConfig, OptimizedImage, ImageMetadata, ImageTransformOptions, ImageCache, } from './types';
export { isExternalUrl, generateSrcSet, getOptimizedUrl, generateBlurDataURL, getFormatFromSrc, calculateAspectRatio, getResponsiveSizes, isValidFormat, getDominantColor, createCacheKey, } from './utils';
export { configure, getConfig, optimizeImage, getMetadata, generateBlurPlaceholder, generateResponsiveSet, extractDominantColor, isSharpAvailable, } from './optimizer';
//# sourceMappingURL=index.d.ts.map