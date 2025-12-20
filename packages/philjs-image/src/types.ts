/**
 * PhilJS Image Optimization - Type Definitions
 */

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';

export type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export type ImagePosition =
  | 'center'
  | 'top'
  | 'right top'
  | 'right'
  | 'right bottom'
  | 'bottom'
  | 'left bottom'
  | 'left'
  | 'left top';

export type LoadingStrategy = 'lazy' | 'eager' | 'auto';

export type PlaceholderType = 'blur' | 'color' | 'none';

/**
 * Art direction source for different breakpoints
 */
export interface ArtDirectionSource {
  media: string;
  src: string;
  width?: number;
  height?: number;
}

/**
 * Loading animation types
 */
export type LoadingAnimation = 'fade' | 'blur' | 'scale' | 'none';

export interface ImageProps {
  // Required
  src: string;
  alt: string;

  // Dimensions
  width?: number;
  height?: number;

  // Aspect ratio locking
  aspectRatio?: number | string; // e.g., 16/9 or "16:9"
  maintainAspectRatio?: boolean;

  // Quality
  quality?: number; // 1-100

  // Formats
  formats?: ImageFormat[];

  // Responsive
  sizes?: string;
  srcSet?: string;

  // Art direction - different images for different breakpoints
  artDirection?: ArtDirectionSource[];

  // Loading
  loading?: LoadingStrategy;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto'; // Priority hints for LCP

  // Placeholder
  placeholder?: PlaceholderType;
  blurDataURL?: string;
  placeholderColor?: string;
  blurHash?: string;

  // Loading animation
  loadingAnimation?: LoadingAnimation;
  animationDuration?: number;

  // Fit and position
  fit?: ImageFit;
  position?: ImagePosition;

  // Styling
  className?: string;
  style?: Record<string, string>;

  // Events
  onLoad?: () => void;
  onError?: (error: Error) => void;

  // Advanced
  unoptimized?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  referrerPolicy?: string;
  decoding?: 'async' | 'auto' | 'sync';

  // Service
  service?: string; // Image service to use
}

export interface ImageOptimizationConfig {
  // Formats to generate
  formats?: ImageFormat[];

  // Quality settings
  quality?: number;
  qualityByFormat?: Partial<Record<ImageFormat, number>>;

  // Size limits
  maxWidth?: number;
  maxHeight?: number;

  // Responsive breakpoints
  breakpoints?: number[];

  // Output directory
  outputDir?: string;

  // Cache
  cacheDir?: string;
  cacheTTL?: number;

  // Sharp options
  sharpOptions?: {
    progressive?: boolean;
    optimizeScans?: boolean;
    effort?: number; // 0-6 for AVIF/WebP
  };

  // CDN
  cdnUrl?: string;
  cdnQueryParams?: Record<string, string>;

  // Domains
  allowedDomains?: string[];
  remotePatterns?: Array<{
    protocol?: 'http' | 'https';
    hostname: string;
    port?: string;
    pathname?: string;
  }>;
}

export interface OptimizedImage {
  src: string;
  srcSet: string;
  sizes?: string;
  width: number;
  height: number;
  format: ImageFormat;
  placeholder?: string;
  blurDataURL?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
  dominantColor?: string;
  blurDataURL?: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  format?: ImageFormat;
  quality?: number;
  fit?: ImageFit;
  position?: ImagePosition;
  blur?: number;
}

export interface ImageCache {
  get(key: string): Promise<Buffer | null>;
  set(key: string, value: Buffer, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
