/**
 * PhilJS Image Service API
 *
 * Pluggable image services (Cloudinary, imgix, sharp)
 * Astro-style service adapter interface
 */
import type { ImageFormat, ImageTransformOptions } from './types.js';
/**
 * Image Service Interface
 * Allows pluggable image transformation services
 */
export interface ImageService {
    /**
     * Name of the service
     */
    name: string;
    /**
     * Get the URL for a transformed image
     */
    getUrl(src: string, options: ImageServiceTransformOptions): string;
    /**
     * Transform an image (for local services like Sharp)
     */
    transform?(input: Buffer | string, options: ImageServiceTransformOptions): Promise<Buffer>;
    /**
     * Get image metadata
     */
    getMetadata?(input: Buffer | string): Promise<ImageServiceMetadata>;
    /**
     * Validate service configuration
     */
    validateOptions?(options: any): boolean;
    /**
     * Get supported formats
     */
    getSupportedFormats?(): ImageFormat[];
}
/**
 * Transform options for image services
 */
export interface ImageServiceTransformOptions extends ImageTransformOptions {
    src?: string;
    aspectRatio?: number;
    background?: string;
}
/**
 * Image metadata from services
 */
export interface ImageServiceMetadata {
    width: number;
    height: number;
    format: string;
    size?: number;
    aspectRatio?: number;
    dominantColor?: string;
    blurDataURL?: string;
    blurHash?: string;
}
/**
 * Sharp Local Image Service
 * Uses Sharp for local image processing
 */
export declare class SharpImageService implements ImageService {
    name: string;
    private sharp;
    private initialized;
    private ensureSharp;
    getUrl(src: string, options: ImageServiceTransformOptions): string;
    transform(input: Buffer | string, options: ImageServiceTransformOptions): Promise<Buffer>;
    getMetadata(input: Buffer | string): Promise<ImageServiceMetadata>;
    getSupportedFormats(): ImageFormat[];
    validateOptions(options: any): boolean;
}
/**
 * Cloudinary Image Service
 * Uses Cloudinary for cloud-based image transformation
 */
export declare class CloudinaryImageService implements ImageService {
    name: string;
    private cloudName;
    private baseUrl;
    constructor(config: {
        cloudName: string;
        baseUrl?: string;
    });
    getUrl(src: string, options: ImageServiceTransformOptions): string;
    private mapFitMode;
    getSupportedFormats(): ImageFormat[];
    validateOptions(options: any): boolean;
}
/**
 * imgix Image Service
 * Uses imgix for cloud-based image transformation
 */
export declare class ImgixImageService implements ImageService {
    name: string;
    private domain;
    private secureUrlToken?;
    constructor(config: {
        domain: string;
        secureUrlToken?: string;
    });
    getUrl(src: string, options: ImageServiceTransformOptions): string;
    private mapFitMode;
    getSupportedFormats(): ImageFormat[];
    validateOptions(options: any): boolean;
}
/**
 * Image Service Registry
 * Manages available image services
 */
export declare class ImageServiceRegistry {
    private services;
    private activeService?;
    /**
     * Register an image service
     */
    register(service: ImageService): void;
    /**
     * Get a service by name
     */
    getService(name: string): ImageService | undefined;
    /**
     * Set the active service
     */
    setActive(name: string): void;
    /**
     * Get the active service
     */
    getActive(): ImageService;
    /**
     * List all registered services
     */
    list(): string[];
}
export declare const imageServiceRegistry: ImageServiceRegistry;
/**
 * Configure and set the active image service
 */
export declare function configureImageService(service: ImageService | 'sharp' | 'cloudinary' | 'imgix', config?: any): void;
/**
 * Get the active image service
 */
export declare function getImageService(): ImageService;
/**
 * Automatic format selection based on browser support
 */
export declare function selectOptimalFormat(accept?: string, preferredFormats?: ImageFormat[]): ImageFormat;
/**
 * Get format priority for picture element sources
 */
export declare function getFormatPriority(formats: ImageFormat[]): ImageFormat[];
//# sourceMappingURL=image-service.d.ts.map