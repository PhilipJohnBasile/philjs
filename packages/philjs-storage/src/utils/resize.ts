/**
 * Image Resizing Utilities
 *
 * Resize and optimize images before upload using Sharp.
 */

import sharp, { type Sharp, type ResizeOptions as SharpResizeOptions } from 'sharp';

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
  background?: string | { r: number; g: number; b: number; alpha?: number };
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
  sharpen?: boolean | { sigma?: number; m1?: number; m2?: number };
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
 * Get MIME type for image format
 */
function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    tiff: 'image/tiff',
  };
  return mimeTypes[format];
}

/**
 * Detect image format from buffer
 */
async function detectFormat(data: Buffer): Promise<ImageFormat | null> {
  try {
    const metadata = await sharp(data).metadata();
    if (metadata.format && ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'].includes(metadata.format)) {
      return metadata.format as ImageFormat;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resize an image
 *
 * @param input - Image data as Buffer, Uint8Array, or file path
 * @param options - Resize options
 * @returns Resized image result
 */
export async function resizeImage(
  input: Buffer | Uint8Array | string,
  options: ResizeOptions
): Promise<ResizeResult> {
  let image: Sharp;

  if (typeof input === 'string') {
    image = sharp(input);
  } else if (input instanceof Uint8Array) {
    image = sharp(Buffer.from(input));
  } else {
    image = sharp(input);
  }

  // Auto-rotate based on EXIF
  if (options.autoRotate !== false) {
    image = image.rotate();
  }

  // Apply resize
  if (options.width || options.height) {
    const resizeOpts: SharpResizeOptions = {
      width: options.width,
      height: options.height,
      fit: options.fit || 'cover',
      position: options.position || 'center',
      withoutEnlargement: true,
    };

    if (options.background) {
      resizeOpts.background = options.background;
    }

    image = image.resize(resizeOpts);
  }

  // Apply rotation
  if (options.rotate) {
    image = image.rotate(options.rotate, {
      background: options.background || { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  // Apply flips
  if (options.flip) {
    image = image.flip();
  }
  if (options.flop) {
    image = image.flop();
  }

  // Apply color adjustments
  if (options.grayscale) {
    image = image.grayscale();
  }
  if (options.negate) {
    image = image.negate();
  }
  if (options.normalize) {
    image = image.normalize();
  }
  if (options.gamma) {
    image = image.gamma(options.gamma);
  }

  // Apply blur
  if (options.blur) {
    image = image.blur(options.blur);
  }

  // Apply sharpen
  if (options.sharpen) {
    if (typeof options.sharpen === 'boolean') {
      image = image.sharpen();
    } else {
      image = image.sharpen(options.sharpen.sigma, options.sharpen.m1, options.sharpen.m2);
    }
  }

  // Strip metadata
  if (options.stripMetadata) {
    image = image.withMetadata({ orientation: undefined });
  }

  // Determine output format
  const inputBuffer = typeof input === 'string' ? undefined : Buffer.isBuffer(input) ? input : Buffer.from(input);
  const inputFormat = inputBuffer ? await detectFormat(inputBuffer) : null;
  const outputFormat = options.format || inputFormat || 'jpeg';

  // Apply format-specific options
  switch (outputFormat) {
    case 'jpeg':
      image = image.jpeg({
        quality: options.quality || 80,
        progressive: options.progressive !== false,
        mozjpeg: true,
      });
      break;
    case 'png':
      image = image.png({
        progressive: options.progressive,
        compressionLevel: 9,
      });
      break;
    case 'webp':
      image = image.webp({
        quality: options.quality || 80,
        lossless: options.quality === 100,
      });
      break;
    case 'avif':
      image = image.avif({
        quality: options.quality || 50,
        lossless: options.quality === 100,
      });
      break;
    case 'gif':
      image = image.gif();
      break;
    case 'tiff':
      image = image.tiff({
        quality: options.quality || 80,
        compression: 'lzw',
      });
      break;
  }

  // Generate output
  let outputBuffer = await image.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  // If maxFileSize is specified, reduce quality until we fit
  if (options.maxFileSize && outputBuffer.length > options.maxFileSize) {
    let quality = options.quality || 80;

    while (outputBuffer.length > options.maxFileSize && quality > 10) {
      quality -= 10;

      image = sharp(typeof input === 'string' ? input : Buffer.isBuffer(input) ? input : Buffer.from(input));

      // Reapply all transforms...
      if (options.autoRotate !== false) image = image.rotate();
      if (options.width || options.height) {
        image = image.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          position: options.position || 'center',
          withoutEnlargement: true,
        });
      }

      // Apply format with reduced quality
      switch (outputFormat) {
        case 'jpeg':
          image = image.jpeg({ quality, progressive: true, mozjpeg: true });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'avif':
          image = image.avif({ quality });
          break;
        default:
          break;
      }

      outputBuffer = await image.toBuffer();
    }
  }

  return {
    data: outputBuffer,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: outputFormat,
    mimeType: getMimeType(outputFormat),
    size: outputBuffer.length,
  };
}

/**
 * Create a thumbnail
 *
 * @param input - Image data
 * @param options - Thumbnail options
 * @returns Thumbnail result
 */
export async function createThumbnail(
  input: Buffer | Uint8Array | string,
  options: ThumbnailOptions
): Promise<ResizeResult> {
  return resizeImage(input, {
    width: options.size,
    height: options.size,
    fit: 'inside',
    format: options.format,
    quality: options.quality || 70,
    stripMetadata: true,
  });
}

/**
 * Create multiple sizes of an image
 *
 * @param input - Image data
 * @param sizes - Array of sizes to generate
 * @param options - Common options for all sizes
 * @returns Map of size to resize result
 */
export async function createResponsiveImages(
  input: Buffer | Uint8Array | string,
  sizes: number[],
  options: Omit<ResizeOptions, 'width' | 'height'> = {}
): Promise<Map<number, ResizeResult>> {
  const results = new Map<number, ResizeResult>();

  await Promise.all(
    sizes.map(async (size) => {
      const result = await resizeImage(input, {
        ...options,
        width: size,
        fit: 'inside',
      });
      results.set(size, result);
    })
  );

  return results;
}

/**
 * Add a watermark to an image
 *
 * @param input - Image data
 * @param options - Watermark options
 * @returns Watermarked image
 */
export async function addWatermark(
  input: Buffer | Uint8Array | string,
  options: WatermarkOptions
): Promise<Buffer> {
  const image = sharp(typeof input === 'string' ? input : Buffer.isBuffer(input) ? input : Buffer.from(input));

  const watermark = typeof options.image === 'string'
    ? sharp(options.image)
    : sharp(options.image);

  // Get dimensions
  const [imageMetadata, watermarkMetadata] = await Promise.all([
    image.metadata(),
    watermark.metadata(),
  ]);

  // Apply opacity to watermark
  let watermarkBuffer: Buffer;
  if (options.opacity !== undefined && options.opacity < 1) {
    watermarkBuffer = await watermark
      .ensureAlpha()
      .modulate({ brightness: 1, saturation: 1 })
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(options.opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      }])
      .toBuffer();
  } else {
    watermarkBuffer = await watermark.toBuffer();
  }

  // Calculate position
  let left = 0;
  let top = 0;
  const margin = options.margin || 10;

  const imgWidth = imageMetadata.width || 0;
  const imgHeight = imageMetadata.height || 0;
  const wmWidth = watermarkMetadata.width || 0;
  const wmHeight = watermarkMetadata.height || 0;

  switch (options.gravity || 'southeast') {
    case 'northwest':
      left = margin;
      top = margin;
      break;
    case 'north':
      left = Math.floor((imgWidth - wmWidth) / 2);
      top = margin;
      break;
    case 'northeast':
      left = imgWidth - wmWidth - margin;
      top = margin;
      break;
    case 'west':
      left = margin;
      top = Math.floor((imgHeight - wmHeight) / 2);
      break;
    case 'center':
      left = Math.floor((imgWidth - wmWidth) / 2);
      top = Math.floor((imgHeight - wmHeight) / 2);
      break;
    case 'east':
      left = imgWidth - wmWidth - margin;
      top = Math.floor((imgHeight - wmHeight) / 2);
      break;
    case 'southwest':
      left = margin;
      top = imgHeight - wmHeight - margin;
      break;
    case 'south':
      left = Math.floor((imgWidth - wmWidth) / 2);
      top = imgHeight - wmHeight - margin;
      break;
    case 'southeast':
    default:
      left = imgWidth - wmWidth - margin;
      top = imgHeight - wmHeight - margin;
      break;
  }

  return image
    .composite([
      {
        input: watermarkBuffer,
        left: Math.max(0, left),
        top: Math.max(0, top),
        tile: options.tile,
      },
    ])
    .toBuffer();
}

/**
 * Get image metadata
 *
 * @param input - Image data
 * @returns Image metadata
 */
export async function getImageMetadata(input: Buffer | Uint8Array | string): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
  density?: number;
}> {
  const image = sharp(typeof input === 'string' ? input : Buffer.isBuffer(input) ? input : Buffer.from(input));
  const metadata = await image.metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: metadata.size || 0,
    hasAlpha: metadata.hasAlpha || false,
    orientation: metadata.orientation,
    density: metadata.density,
  };
}

/**
 * Check if a buffer is a valid image
 *
 * @param input - Data to check
 * @returns True if valid image
 */
export async function isValidImage(input: Buffer | Uint8Array): Promise<boolean> {
  try {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}
