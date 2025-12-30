/**
 * Image Embedding Utilities for PDF Generation
 */

import { PDFDocument, PDFImage, PDFPage, degrees } from 'pdf-lib';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Image Manager Class
// ============================================================================

/**
 * Manages image embedding for PDF generation
 */
export class ImageManager {
  private images: Map<string, PDFImage> = new Map();
  private pdfDoc: PDFDocument | null = null;

  /**
   * Initialize with a PDF document
   */
  async init(pdfDoc: PDFDocument): Promise<void> {
    this.pdfDoc = pdfDoc;
  }

  /**
   * Embed an image from a URL
   */
  async embedFromUrl(url: string, name?: string): Promise<PDFImage> {
    if (!this.pdfDoc) {
      throw new Error('ImageManager not initialized. Call init() first.');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    return this.embedFromData(data, name || url);
  }

  /**
   * Embed an image from file path (Node.js)
   */
  async embedFromFile(path: string, name?: string): Promise<PDFImage> {
    if (!this.pdfDoc) {
      throw new Error('ImageManager not initialized. Call init() first.');
    }

    const fs = await import('fs/promises');
    const data = await fs.readFile(path);

    return this.embedFromData(new Uint8Array(data), name || path);
  }

  /**
   * Embed an image from raw data
   */
  async embedFromData(data: Uint8Array, name: string): Promise<PDFImage> {
    if (!this.pdfDoc) {
      throw new Error('ImageManager not initialized. Call init() first.');
    }

    const format = detectImageFormat(data);
    let image: PDFImage;

    if (format === 'png') {
      image = await this.pdfDoc.embedPng(data);
    } else if (format === 'jpg' || format === 'jpeg') {
      image = await this.pdfDoc.embedJpg(data);
    } else {
      throw new Error(`Unsupported image format: ${format}`);
    }

    this.images.set(name, image);
    return image;
  }

  /**
   * Embed an image from base64 string
   */
  async embedFromBase64(
    base64: string,
    format: ImageFormat,
    name: string
  ): Promise<PDFImage> {
    if (!this.pdfDoc) {
      throw new Error('ImageManager not initialized. Call init() first.');
    }

    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      data[i] = binaryString.charCodeAt(i);
    }

    return this.embedFromData(data, name);
  }

  /**
   * Get an embedded image by name
   */
  getImage(name: string): PDFImage | undefined {
    return this.images.get(name);
  }

  /**
   * Draw an image on a page with options
   */
  drawImage(page: PDFPage, image: PDFImage, options: ImageOptions = {}): void {
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const { width: imgWidth, height: imgHeight } = image.size();

    let width = options.width || imgWidth;
    let height = options.height || imgHeight;

    // Maintain aspect ratio if requested
    if (options.maintainAspectRatio !== false) {
      if (options.width && !options.height) {
        height = (imgHeight / imgWidth) * width;
      } else if (options.height && !options.width) {
        width = (imgWidth / imgHeight) * height;
      }
    }

    // Calculate position based on alignment
    let x = options.x ?? 0;
    let y = options.y ?? 0;

    if (options.align === 'center') {
      x = (pageWidth - width) / 2;
    } else if (options.align === 'right') {
      x = pageWidth - width - (options.x ?? 0);
    }

    if (options.valign === 'middle') {
      y = (pageHeight - height) / 2;
    } else if (options.valign === 'top') {
      y = pageHeight - height - (options.y ?? 0);
    }

    const drawOptions: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotate?: ReturnType<typeof degrees>;
      opacity?: number;
    } = {
      x,
      y,
      width,
      height,
    };

    if (options.rotation !== undefined) {
      drawOptions.rotate = degrees(options.rotation);
    }
    if (options.opacity !== undefined) {
      drawOptions.opacity = options.opacity;
    }

    page.drawImage(image, drawOptions);
  }

  /**
   * Clear all images
   */
  clear(): void {
    this.images.clear();
    this.pdfDoc = null;
  }
}

// ============================================================================
// Image Helper Functions
// ============================================================================

/**
 * Detect image format from binary data
 */
export function detectImageFormat(data: Uint8Array): ImageFormat {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return 'png';
  }

  // JPEG signature: FF D8 FF
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'jpg';
  }

  throw new Error('Unknown image format');
}

/**
 * Calculate dimensions for fitting image in container
 */
export function calculateFitDimensions(
  imageDimensions: ImageDimensions,
  fit: ImageFit
): ImageDimensions {
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const { containerWidth, containerHeight, mode } = fit;

  const imgRatio = imgWidth / imgHeight;
  const containerRatio = containerWidth / containerHeight;

  switch (mode) {
    case 'contain':
      if (imgRatio > containerRatio) {
        return {
          width: containerWidth,
          height: containerWidth / imgRatio,
        };
      }
      return {
        width: containerHeight * imgRatio,
        height: containerHeight,
      };

    case 'cover':
      if (imgRatio < containerRatio) {
        return {
          width: containerWidth,
          height: containerWidth / imgRatio,
        };
      }
      return {
        width: containerHeight * imgRatio,
        height: containerHeight,
      };

    case 'fill':
      return {
        width: containerWidth,
        height: containerHeight,
      };

    case 'none':
    default:
      return { width: imgWidth, height: imgHeight };
  }
}

/**
 * Calculate centered position for image in container
 */
export function calculateCenteredPosition(
  imageDimensions: ImageDimensions,
  containerDimensions: ImageDimensions,
  containerPosition: ImagePosition = { x: 0, y: 0 }
): ImagePosition {
  return {
    x: containerPosition.x + (containerDimensions.width - imageDimensions.width) / 2,
    y: containerPosition.y + (containerDimensions.height - imageDimensions.height) / 2,
  };
}

/**
 * Scale image dimensions proportionally
 */
export function scaleImage(
  dimensions: ImageDimensions,
  scale: number
): ImageDimensions {
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
  };
}

/**
 * Scale image to fit within max dimensions
 */
export function scaleToFit(
  dimensions: ImageDimensions,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  const widthRatio = maxWidth / dimensions.width;
  const heightRatio = maxHeight / dimensions.height;
  const scale = Math.min(widthRatio, heightRatio, 1);

  return scaleImage(dimensions, scale);
}

/**
 * Convert data URL to Uint8Array
 */
export function dataUrlToUint8Array(dataUrl: string): {
  data: Uint8Array;
  mimeType: string;
} {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || !matches[1] || !matches[2]) {
    throw new Error('Invalid data URL');
  }

  const mimeType: string = matches[1];
  const base64: string = matches[2];
  const binaryString = atob(base64);
  const data = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    data[i] = binaryString.charCodeAt(i);
  }

  return { data, mimeType };
}

/**
 * Convert Uint8Array to base64 data URL
 */
export function uint8ArrayToDataUrl(
  data: Uint8Array,
  mimeType: string
): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i] as number);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Create a placeholder image (solid color)
 */
export async function createPlaceholderImage(
  pdfDoc: PDFDocument,
  width: number,
  height: number,
  color: { r: number; g: number; b: number } = { r: 200, g: 200, b: 200 }
): Promise<PDFImage> {
  // Create a simple PNG with the specified color
  // This is a minimal PNG structure for a solid color image
  const header = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ]);

  // For simplicity, we'll embed a 1x1 pixel and let it scale
  // In production, you'd want to generate proper PNG data
  const pngData = createMinimalPng(1, 1, color);

  return pdfDoc.embedPng(pngData);
}

/**
 * Create minimal PNG data for a single-color image
 */
function createMinimalPng(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Uint8Array {
  // This is a simplified implementation
  // For production use, consider using a library like pngjs
  const { r, g, b } = color;

  // Minimal 1x1 PNG with the specified color
  // Pre-generated PNG structure with placeholder for color values
  const template = [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, // bit depth, color type, etc.
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0xd7, 0x63, r, g, b, 0x00, 0x00, // compressed data with color
    0x00, 0x04, 0x00, 0x01, 0x5f, 0xee, 0xce, 0x30, // CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
    0xae, 0x42, 0x60, 0x82,
  ];

  return new Uint8Array(template);
}

// ============================================================================
// Default Export
// ============================================================================

export const imageManager = new ImageManager();
export default ImageManager;
