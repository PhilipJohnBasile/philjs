/**
 * PhilJS Image - Utility Functions
 */

import type { ImageFormat, ImageTransformOptions, OptimizedImage } from './types.js';

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    formats?: ImageFormat[];
  }
): OptimizedImage | null {
  const { width, height, quality = 85 } = options;

  if (!width) {
    return {
      src,
      srcSet: src,
      width: width || 0,
      height: height || 0,
      format: getFormatFromSrc(src),
    };
  }

  // Generate responsive sizes
  const breakpoints = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  const relevantBreakpoints = breakpoints.filter(bp => bp <= width * 2);

  if (!relevantBreakpoints.includes(width)) {
    relevantBreakpoints.push(width);
  }
  relevantBreakpoints.sort((a, b) => a - b);

  // Generate srcSet string
  const srcSetEntries = relevantBreakpoints.map(w => {
    const optimizedUrl = getOptimizedUrl(src, { width: w, quality });
    return `${optimizedUrl} ${w}w`;
  });

  return {
    src: getOptimizedUrl(src, { width, quality }),
    srcSet: srcSetEntries.join(', '),
    width: width || 0,
    height: height || 0,
    format: 'webp',
  };
}

/**
 * Get optimized image URL
 */
export function getOptimizedUrl(
  src: string,
  options: ImageTransformOptions
): string {
  const { width, height, quality = 85, format = 'webp' } = options;

  // For external URLs or development, return as-is
  if (isExternalUrl(src) || process.env['NODE_ENV'] === 'development') {
    return src;
  }

  // Build optimization query string
  const params = new URLSearchParams();
  if (width) params.set('w', String(width));
  if (height) params.set('h', String(height));
  if (quality) params.set('q', String(quality));
  if (format) params.set('f', format);

  const basePath = '/_image';
  const queryString = params.toString();

  return `${basePath}?url=${encodeURIComponent(src)}${queryString ? '&' + queryString : ''}`;
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurDataURL(
  src: string,
  width?: number,
  height?: number
): string {
  // Simple blur placeholder - would be replaced with sharp-generated version
  const w = width || 10;
  const h = height || 10;

  // Create a simple SVG blur placeholder
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' style='filter: url(%23b);' href='${src}'/%3E%3C/svg%3E`;
}

/**
 * Get image format from source URL
 */
export function getFormatFromSrc(src: string): ImageFormat {
  const ext = src.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'webp':
      return 'webp';
    case 'avif':
      return 'avif';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'jpeg';
  }
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get responsive sizes string
 */
export function getResponsiveSizes(width: number): string {
  return `(min-width: ${width}px) ${width}px, 100vw`;
}

/**
 * Validate image format
 */
export function isValidFormat(format: string): format is ImageFormat {
  return ['webp', 'avif', 'jpeg', 'png', 'gif'].includes(format);
}

/**
 * Get dominant color from image (placeholder)
 */
export async function getDominantColor(src: string): Promise<string> {
  // This would use sharp or canvas to extract dominant color
  // For now, return a default
  return '#f0f0f0';
}

/**
 * Create image cache key
 */
export function createCacheKey(
  src: string,
  options: ImageTransformOptions
): string {
  const { width, height, quality, format } = options;
  return `${src}-${width || 'auto'}-${height || 'auto'}-${quality || 85}-${format || 'webp'}`;
}
