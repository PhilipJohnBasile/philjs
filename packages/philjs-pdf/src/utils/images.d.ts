/**
 * Image Embedding Utilities for PDF Generation
 */
import { PDFDocument, PDFImage, PDFPage } from 'pdf-lib';
export interface ImageDimensions {
    width: number;
    height: number;
}
export interface ImagePosition {
    x: number;
    y: number;
}
export interface ImageOptions {
    /** Width of the image */
    width?: number;
    /** Height of the image */
    height?: number;
    /** X position */
    x?: number;
    /** Y position */
    y?: number;
    /** Maintain aspect ratio when scaling */
    maintainAspectRatio?: boolean;
    /** Rotation in degrees */
    rotation?: number;
    /** Opacity (0-1) */
    opacity?: number;
    /** Horizontal alignment */
    align?: 'left' | 'center' | 'right';
    /** Vertical alignment */
    valign?: 'top' | 'middle' | 'bottom';
}
export interface ImageFit {
    /** How the image should fit */
    mode: 'contain' | 'cover' | 'fill' | 'none';
    /** Container width */
    containerWidth: number;
    /** Container height */
    containerHeight: number;
}
export type ImageFormat = 'png' | 'jpg' | 'jpeg';
/**
 * Manages image embedding for PDF generation
 */
export declare class ImageManager {
    private images;
    private pdfDoc;
    /**
     * Initialize with a PDF document
     */
    init(pdfDoc: PDFDocument): Promise<void>;
    /**
     * Embed an image from a URL
     */
    embedFromUrl(url: string, name?: string): Promise<PDFImage>;
    /**
     * Embed an image from file path (Node.js)
     */
    embedFromFile(path: string, name?: string): Promise<PDFImage>;
    /**
     * Embed an image from raw data
     */
    embedFromData(data: Uint8Array, name: string): Promise<PDFImage>;
    /**
     * Embed an image from base64 string
     */
    embedFromBase64(base64: string, format: ImageFormat, name: string): Promise<PDFImage>;
    /**
     * Get an embedded image by name
     */
    getImage(name: string): PDFImage | undefined;
    /**
     * Draw an image on a page with options
     */
    drawImage(page: PDFPage, image: PDFImage, options?: ImageOptions): void;
    /**
     * Clear all images
     */
    clear(): void;
}
/**
 * Detect image format from binary data
 */
export declare function detectImageFormat(data: Uint8Array): ImageFormat;
/**
 * Calculate dimensions for fitting image in container
 */
export declare function calculateFitDimensions(imageDimensions: ImageDimensions, fit: ImageFit): ImageDimensions;
/**
 * Calculate centered position for image in container
 */
export declare function calculateCenteredPosition(imageDimensions: ImageDimensions, containerDimensions: ImageDimensions, containerPosition?: ImagePosition): ImagePosition;
/**
 * Scale image dimensions proportionally
 */
export declare function scaleImage(dimensions: ImageDimensions, scale: number): ImageDimensions;
/**
 * Scale image to fit within max dimensions
 */
export declare function scaleToFit(dimensions: ImageDimensions, maxWidth: number, maxHeight: number): ImageDimensions;
/**
 * Convert data URL to Uint8Array
 */
export declare function dataUrlToUint8Array(dataUrl: string): {
    data: Uint8Array;
    mimeType: string;
};
/**
 * Convert Uint8Array to base64 data URL
 */
export declare function uint8ArrayToDataUrl(data: Uint8Array, mimeType: string): string;
/**
 * Create a placeholder image (solid color)
 */
export declare function createPlaceholderImage(pdfDoc: PDFDocument, width: number, height: number, color?: {
    r: number;
    g: number;
    b: number;
}): Promise<PDFImage>;
export declare const imageManager: ImageManager;
export default ImageManager;
//# sourceMappingURL=images.d.ts.map