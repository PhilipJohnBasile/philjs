/**
 * PhilJS Image Optimization
 *
 * Automatic image optimization with format conversion,
 * responsive sizing, lazy loading, and blur placeholders.
 */
export { Image, default } from './Image.js';
export type { ImageProps, ImageFormat, ImageFit, ImagePosition, LoadingStrategy, PlaceholderType, ImageOptimizationConfig, OptimizedImage, ImageMetadata, ImageTransformOptions, ImageCache, ArtDirectionSource, LoadingAnimation, } from './types.js';
export { isExternalUrl, generateSrcSet, getOptimizedUrl, generateBlurDataURL, getFormatFromSrc, calculateAspectRatio, getResponsiveSizes, isValidFormat, getDominantColor, createCacheKey, } from './utils.js';
export { configure, getConfig, optimizeImage, getMetadata, generateBlurPlaceholder, generateResponsiveSet, extractDominantColor, isSharpAvailable, type BlurPlaceholderOptions, } from './optimizer.js';
export { type ImageService, type ImageServiceTransformOptions, type ImageServiceMetadata, SharpImageService, CloudinaryImageService, ImgixImageService, ImageServiceRegistry, imageServiceRegistry, configureImageService, getImageService, selectOptimalFormat, getFormatPriority, } from './image-service.js';
//# sourceMappingURL=index.d.ts.map