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
export class SharpImageService implements ImageService {
  name = 'sharp';
  private sharp: any;
  private initialized = false;

  private async ensureSharp(): Promise<void> {
    if (!this.initialized) {
      try {
        this.sharp = (await import('sharp')).default;
        this.initialized = true;
      } catch {
        throw new Error('Sharp is not installed. Install with: npm install sharp');
      }
    }
  }

  getUrl(src: string, options: ImageServiceTransformOptions): string {
    // For local service, return a path that will be intercepted
    const params = new URLSearchParams();
    if (options.width) params.set('w', String(options.width));
    if (options.height) params.set('h', String(options.height));
    if (options.quality) params.set('q', String(options.quality));
    if (options.format) params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);

    return `/_image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  async transform(input: Buffer | string, options: ImageServiceTransformOptions): Promise<Buffer> {
    await this.ensureSharp();
    const { width, height, format = 'webp', quality = 85, fit = 'cover', position = 'center', blur, background } = options;

    let pipeline = this.sharp(input);

    // Resize
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit,
        position,
        background,
        withoutEnlargement: true,
      });
    }

    // Apply blur
    if (blur) {
      pipeline = pipeline.blur(blur);
    }

    // Convert format
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 6 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true, optimizeScans: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
    }

    return pipeline.toBuffer();
  }

  async getMetadata(input: Buffer | string): Promise<ImageServiceMetadata> {
    await this.ensureSharp();
    const image = this.sharp(input);
    const metadata = await image.metadata();
    const stats = await image.stats();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Extract dominant color
    let dominantColor: string | undefined;
    if (stats.dominant) {
      const { r, g, b } = stats.dominant;
      dominantColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    const result: ImageServiceMetadata = {
      width,
      height,
      format: metadata.format || 'unknown',
      size: metadata.size,
      aspectRatio: width / height,
    };
    if (dominantColor !== undefined) {
      result.dominantColor = dominantColor;
    }
    return result;
  }

  getSupportedFormats(): ImageFormat[] {
    return ['webp', 'avif', 'jpeg', 'png', 'gif'];
  }

  validateOptions(options: any): boolean {
    return true;
  }
}

/**
 * Cloudinary Image Service
 * Uses Cloudinary for cloud-based image transformation
 */
export class CloudinaryImageService implements ImageService {
  name = 'cloudinary';
  private cloudName: string;
  private baseUrl: string;

  constructor(config: { cloudName: string; baseUrl?: string }) {
    this.cloudName = config.cloudName;
    this.baseUrl = config.baseUrl || `https://res.cloudinary.com/${config.cloudName}/image/upload`;
  }

  getUrl(src: string, options: ImageServiceTransformOptions): string {
    const transformations: string[] = [];

    // Width and height
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);

    // Quality
    if (options.quality) transformations.push(`q_${options.quality}`);

    // Format
    if (options.format) transformations.push(`f_${options.format}`);

    // Fit mode
    if (options.fit) {
      const cloudinaryFit = this.mapFitMode(options.fit);
      transformations.push(`c_${cloudinaryFit}`);
    }

    // Blur
    if (options.blur) transformations.push(`e_blur:${options.blur * 100}`);

    // Background
    if (options.background) {
      const bg = options.background.replace('#', 'rgb:');
      transformations.push(`b_${bg}`);
    }

    // Aspect ratio
    if (options.aspectRatio) {
      transformations.push(`ar_${options.aspectRatio}`);
    }

    const transformString = transformations.join(',');
    const imagePath = src.startsWith('/') ? src.slice(1) : src;

    return `${this.baseUrl}/${transformString}/${imagePath}`;
  }

  private mapFitMode(fit: string): string {
    const fitMap: Record<string, string> = {
      cover: 'fill',
      contain: 'fit',
      fill: 'scale',
      inside: 'limit',
      outside: 'mfit',
    };
    return fitMap[fit] || 'fill';
  }

  getSupportedFormats(): ImageFormat[] {
    return ['webp', 'avif', 'jpeg', 'png', 'gif'];
  }

  validateOptions(options: any): boolean {
    return !!options.cloudName;
  }
}

/**
 * imgix Image Service
 * Uses imgix for cloud-based image transformation
 */
export class ImgixImageService implements ImageService {
  name = 'imgix';
  private domain: string;
  private secureUrlToken?: string;

  constructor(config: { domain: string; secureUrlToken?: string }) {
    this.domain = config.domain;
    if (config.secureUrlToken !== undefined) {
      this.secureUrlToken = config.secureUrlToken;
    }
  }

  getUrl(src: string, options: ImageServiceTransformOptions): string {
    const params = new URLSearchParams();

    // Auto format
    params.set('auto', 'format,compress');

    // Width and height
    if (options.width) params.set('w', String(options.width));
    if (options.height) params.set('h', String(options.height));

    // Quality
    if (options.quality) params.set('q', String(options.quality));

    // Format
    if (options.format) params.set('fm', options.format);

    // Fit mode
    if (options.fit) {
      const imgixFit = this.mapFitMode(options.fit);
      params.set('fit', imgixFit);
    }

    // Blur
    if (options.blur) params.set('blur', String(options.blur * 100));

    // Background
    if (options.background) {
      params.set('bg', options.background.replace('#', ''));
    }

    // Aspect ratio
    if (options.aspectRatio) {
      params.set('ar', options.aspectRatio.toString());
    }

    const imagePath = src.startsWith('/') ? src.slice(1) : src;
    const baseUrl = `https://${this.domain}/${imagePath}`;

    return `${baseUrl}?${params.toString()}`;
  }

  private mapFitMode(fit: string): string {
    const fitMap: Record<string, string> = {
      cover: 'crop',
      contain: 'clip',
      fill: 'scale',
      inside: 'max',
      outside: 'min',
    };
    return fitMap[fit] || 'crop';
  }

  getSupportedFormats(): ImageFormat[] {
    return ['webp', 'avif', 'jpeg', 'png', 'gif'];
  }

  validateOptions(options: any): boolean {
    return !!options.domain;
  }
}

/**
 * Image Service Registry
 * Manages available image services
 */
export class ImageServiceRegistry {
  private services: Map<string, ImageService> = new Map();
  private activeService?: ImageService;

  /**
   * Register an image service
   */
  register(service: ImageService): void {
    this.services.set(service.name, service);
  }

  /**
   * Get a service by name
   */
  getService(name: string): ImageService | undefined {
    return this.services.get(name);
  }

  /**
   * Set the active service
   */
  setActive(name: string): void {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Image service "${name}" not found`);
    }
    this.activeService = service;
  }

  /**
   * Get the active service
   */
  getActive(): ImageService {
    if (!this.activeService) {
      throw new Error('No active image service configured');
    }
    return this.activeService;
  }

  /**
   * List all registered services
   */
  list(): string[] {
    return Array.from(this.services.keys());
  }
}

// Global registry instance
export const imageServiceRegistry = new ImageServiceRegistry();

/**
 * Configure and set the active image service
 */
export function configureImageService(
  service: ImageService | 'sharp' | 'cloudinary' | 'imgix',
  config?: any
): void {
  if (typeof service === 'string') {
    switch (service) {
      case 'sharp':
        imageServiceRegistry.register(new SharpImageService());
        break;
      case 'cloudinary':
        if (!config?.cloudName) {
          throw new Error('Cloudinary service requires cloudName in config');
        }
        imageServiceRegistry.register(new CloudinaryImageService(config));
        break;
      case 'imgix':
        if (!config?.domain) {
          throw new Error('imgix service requires domain in config');
        }
        imageServiceRegistry.register(new ImgixImageService(config));
        break;
      default:
        throw new Error(`Unknown service: ${service}`);
    }
    imageServiceRegistry.setActive(service);
  } else {
    imageServiceRegistry.register(service);
    imageServiceRegistry.setActive(service.name);
  }
}

/**
 * Get the active image service
 */
export function getImageService(): ImageService {
  return imageServiceRegistry.getActive();
}

/**
 * Automatic format selection based on browser support
 */
export function selectOptimalFormat(
  accept?: string,
  preferredFormats: ImageFormat[] = ['avif', 'webp', 'jpeg']
): ImageFormat {
  if (!accept) {
    return preferredFormats[preferredFormats.length - 1] || 'jpeg';
  }

  const acceptLower = accept.toLowerCase();

  // Check formats in order of preference
  for (const format of preferredFormats) {
    if (acceptLower.includes(`image/${format}`)) {
      return format;
    }
  }

  // Fallback to last format (usually jpeg)
  return preferredFormats[preferredFormats.length - 1] || 'jpeg';
}

/**
 * Get format priority for picture element sources
 */
export function getFormatPriority(formats: ImageFormat[]): ImageFormat[] {
  const priority: ImageFormat[] = [];

  // Add in order of preference (modern to legacy)
  if (formats.includes('avif')) priority.push('avif');
  if (formats.includes('webp')) priority.push('webp');
  if (formats.includes('jpeg')) priority.push('jpeg');
  if (formats.includes('png')) priority.push('png');
  if (formats.includes('gif')) priority.push('gif');

  return priority;
}
