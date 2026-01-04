/**
 * PhilJS Image Optimization
 *
 * Automatic image optimization with format conversion,
 * responsive sizing, lazy loading, and blur placeholders.
 */
// Components
export { Image, default } from './Image.js';
// Utilities
export { isExternalUrl, generateSrcSet, getOptimizedUrl, generateBlurDataURL, getFormatFromSrc, calculateAspectRatio, getResponsiveSizes, isValidFormat, getDominantColor, createCacheKey, } from './utils.js';
// Server-side optimizer (only available in Node.js)
export { configure, getConfig, optimizeImage, getMetadata, generateBlurPlaceholder, generateResponsiveSet, extractDominantColor, isSharpAvailable, } from './optimizer.js';
// Image Services
export { SharpImageService, CloudinaryImageService, ImgixImageService, ImageServiceRegistry, imageServiceRegistry, configureImageService, getImageService, selectOptimalFormat, getFormatPriority, } from './image-service.js';
//# sourceMappingURL=index.js.map