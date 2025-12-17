/**
 * PhilJS Image - Utility Functions
 */
import type { ImageFormat, ImageTransformOptions, OptimizedImage } from './types';
/**
 * Check if URL is external
 */
export declare function isExternalUrl(url: string): boolean;
/**
 * Generate srcSet for responsive images
 */
export declare function generateSrcSet(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    formats?: ImageFormat[];
}): OptimizedImage | null;
/**
 * Get optimized image URL
 */
export declare function getOptimizedUrl(src: string, options: ImageTransformOptions): string;
/**
 * Generate blur placeholder data URL
 */
export declare function generateBlurDataURL(src: string, width?: number, height?: number): string;
/**
 * Get image format from source URL
 */
export declare function getFormatFromSrc(src: string): ImageFormat;
/**
 * Calculate aspect ratio
 */
export declare function calculateAspectRatio(width: number, height: number): number;
/**
 * Get responsive sizes string
 */
export declare function getResponsiveSizes(width: number): string;
/**
 * Validate image format
 */
export declare function isValidFormat(format: string): format is ImageFormat;
/**
 * Get dominant color from image (placeholder)
 */
export declare function getDominantColor(src: string): Promise<string>;
/**
 * Create image cache key
 */
export declare function createCacheKey(src: string, options: ImageTransformOptions): string;
//# sourceMappingURL=utils.d.ts.map