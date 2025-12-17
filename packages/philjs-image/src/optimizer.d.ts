/**
 * PhilJS Image Optimizer
 *
 * Server-side image optimization using Sharp
 */
import type { ImageFormat, ImageTransformOptions, ImageMetadata, ImageOptimizationConfig } from './types';
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
 * Generate blur placeholder
 */
export declare function generateBlurPlaceholder(input: Buffer | string, width?: number, height?: number): Promise<string>;
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