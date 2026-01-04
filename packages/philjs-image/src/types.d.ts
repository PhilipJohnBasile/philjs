/**
 * PhilJS Image Optimization - Type Definitions
 */
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'gif';
export type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
export type ImagePosition = 'center' | 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top';
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
    src: string;
    alt: string;
    width?: number;
    height?: number;
    aspectRatio?: number | string;
    maintainAspectRatio?: boolean;
    quality?: number;
    formats?: ImageFormat[];
    sizes?: string;
    srcSet?: string;
    artDirection?: ArtDirectionSource[];
    loading?: LoadingStrategy;
    priority?: boolean;
    fetchPriority?: 'high' | 'low' | 'auto';
    placeholder?: PlaceholderType;
    blurDataURL?: string;
    placeholderColor?: string;
    blurHash?: string;
    loadingAnimation?: LoadingAnimation;
    animationDuration?: number;
    fit?: ImageFit;
    position?: ImagePosition;
    className?: string;
    style?: Record<string, string>;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    unoptimized?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials';
    referrerPolicy?: string;
    decoding?: 'async' | 'auto' | 'sync';
    service?: string;
}
export interface ImageOptimizationConfig {
    formats?: ImageFormat[];
    quality?: number;
    qualityByFormat?: Partial<Record<ImageFormat, number>>;
    maxWidth?: number;
    maxHeight?: number;
    breakpoints?: number[];
    outputDir?: string;
    cacheDir?: string;
    cacheTTL?: number;
    sharpOptions?: {
        progressive?: boolean;
        optimizeScans?: boolean;
        effort?: number;
    };
    cdnUrl?: string;
    cdnQueryParams?: Record<string, string>;
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
//# sourceMappingURL=types.d.ts.map