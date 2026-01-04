/**
 * PhilJS Image Optimizer
 *
 * Server-side image optimization using Sharp
 */
import type { ImageFormat, ImageTransformOptions, ImageMetadata, ImageOptimizationConfig } from './types.js';
/**
 * Configure image optimization
 */
export declare function configure(options: ImageOptimizationConfig): void;
/**
 * Get current configuration
 */
export declare function getConfig(): ImageOptimizationConfig;
/**
 * Optimize an image
 */
export declare function optimizeImage(input: Buffer | string, options: ImageTransformOptions): Promise<Buffer>;
/**
 * Get image metadata
 */
export declare function getMetadata(input: Buffer | string): Promise<ImageMetadata>;
/**
 * Blur placeholder generation options
 */
export interface BlurPlaceholderOptions {
    type?: 'base64' | 'blurhash' | 'dominant-color' | 'lqip';
    width?: number;
    height?: number;
    quality?: number;
    blurAmount?: number;
}
/**
 * Generate blur placeholder (LQIP - Low Quality Image Placeholder)
 */
export declare function generateBlurPlaceholder(input: Buffer | string, options?: BlurPlaceholderOptions): Promise<string>;
/**
 * Generate responsive image set
 */
export declare function generateResponsiveSet(input: Buffer | string, options?: {
    formats?: ImageFormat[];
    breakpoints?: number[];
    quality?: number;
}): Promise<Array<{
    buffer: Buffer;
    width: number;
    format: ImageFormat;
}>>;
/**
 * Extract dominant color
 */
export declare function extractDominantColor(input: Buffer | string): Promise<string>;
/**
 * Check if Sharp is available
 */
export declare function isSharpAvailable(): boolean;
//# sourceMappingURL=optimizer.d.ts.map