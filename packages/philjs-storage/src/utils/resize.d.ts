/**
 * Image Resizing Utilities
 *
 * Resize and optimize images before upload using Sharp.
 */
/**
 * Supported output formats
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';
/**
 * Resize fit modes
 */
export type ResizeFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
/**
 * Resize options
 */
export interface ResizeOptions {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** How to fit the image into the target dimensions */
    fit?: ResizeFit;
    /** Position for fit: cover/contain */
    position?: 'top' | 'right' | 'bottom' | 'left' | 'center' | 'entropy' | 'attention';
    /** Background color for fit: contain (default: transparent/white) */
    background?: string | {
        r: number;
        g: number;
        b: number;
        alpha?: number;
    };
    /** Output format */
    format?: ImageFormat;
    /** Quality (1-100) for lossy formats */
    quality?: number;
    /** Enable progressive/interlaced encoding */
    progressive?: boolean;
    /** Strip metadata (EXIF, ICC profile, etc.) */
    stripMetadata?: boolean;
    /** Auto-rotate based on EXIF orientation */
    autoRotate?: boolean;
    /** Maximum file size in bytes (will reduce quality to fit) */
    maxFileSize?: number;
    /** Blur radius (0.3-1000) */
    blur?: number;
    /** Sharpen the image */
    sharpen?: boolean | {
        sigma?: number;
        m1?: number;
        m2?: number;
    };
    /** Grayscale conversion */
    grayscale?: boolean;
    /** Flip vertically */
    flip?: boolean;
    /** Flip horizontally */
    flop?: boolean;
    /** Rotation angle (90, 180, 270, or any angle with background) */
    rotate?: number;
    /** Normalize/stretch contrast */
    normalize?: boolean;
    /** Gamma correction (1.0-3.0) */
    gamma?: number;
    /** Negate (invert) colors */
    negate?: boolean;
}
/**
 * Resize result
 */
export interface ResizeResult {
    /** Resized image data */
    data: Buffer;
    /** Width of output image */
    width: number;
    /** Height of output image */
    height: number;
    /** Output format */
    format: ImageFormat;
    /** MIME type */
    mimeType: string;
    /** File size in bytes */
    size: number;
}
/**
 * Thumbnail options (simplified resize)
 */
export interface ThumbnailOptions {
    /** Maximum dimension (width or height) */
    size: number;
    /** Output format */
    format?: ImageFormat;
    /** Quality (1-100) */
    quality?: number;
}
/**
 * Watermark options
 */
export interface WatermarkOptions {
    /** Watermark image buffer or path */
    image: Buffer | string;
    /** Position gravity */
    gravity?: 'northwest' | 'north' | 'northeast' | 'west' | 'center' | 'east' | 'southwest' | 'south' | 'southeast';
    /** Opacity (0-1) */
    opacity?: number;
    /** Tile the watermark */
    tile?: boolean;
    /** Margin from edge in pixels */
    margin?: number;
}
/**
 * Resize an image
 *
 * @param input - Image data as Buffer, Uint8Array, or file path
 * @param options - Resize options
 * @returns Resized image result
 */
export declare function resizeImage(input: Buffer | Uint8Array | string, options: ResizeOptions): Promise<ResizeResult>;
/**
 * Create a thumbnail
 *
 * @param input - Image data
 * @param options - Thumbnail options
 * @returns Thumbnail result
 */
export declare function createThumbnail(input: Buffer | Uint8Array | string, options: ThumbnailOptions): Promise<ResizeResult>;
/**
 * Create multiple sizes of an image
 *
 * @param input - Image data
 * @param sizes - Array of sizes to generate
 * @param options - Common options for all sizes
 * @returns Map of size to resize result
 */
export declare function createResponsiveImages(input: Buffer | Uint8Array | string, sizes: number[], options?: Omit<ResizeOptions, 'width' | 'height'>): Promise<Map<number, ResizeResult>>;
/**
 * Add a watermark to an image
 *
 * @param input - Image data
 * @param options - Watermark options
 * @returns Watermarked image
 */
export declare function addWatermark(input: Buffer | Uint8Array | string, options: WatermarkOptions): Promise<Buffer>;
/**
 * Get image metadata
 *
 * @param input - Image data
 * @returns Image metadata
 */
export declare function getImageMetadata(input: Buffer | Uint8Array | string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    orientation?: number;
    density?: number;
}>;
/**
 * Check if a buffer is a valid image
 *
 * @param input - Data to check
 * @returns True if valid image
 */
export declare function isValidImage(input: Buffer | Uint8Array): Promise<boolean>;
//# sourceMappingURL=resize.d.ts.map