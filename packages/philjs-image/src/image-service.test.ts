/**
 * PhilJS Image Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SharpImageService,
  CloudinaryImageService,
  ImgixImageService,
  ImageServiceRegistry,
  configureImageService,
  getImageService,
  selectOptimalFormat,
  getFormatPriority,
} from './image-service';

describe('ImageServiceRegistry', () => {
  let registry: ImageServiceRegistry;

  beforeEach(() => {
    registry = new ImageServiceRegistry();
  });

  it('should register and retrieve services', () => {
    const cloudinary = new CloudinaryImageService({ cloudName: 'test' });
    registry.register(cloudinary);

    const retrieved = registry.getService('cloudinary');
    expect(retrieved).toBe(cloudinary);
  });

  it('should set and get active service', () => {
    const cloudinary = new CloudinaryImageService({ cloudName: 'test' });
    registry.register(cloudinary);
    registry.setActive('cloudinary');

    const active = registry.getActive();
    expect(active).toBe(cloudinary);
  });

  it('should throw when setting non-existent service as active', () => {
    expect(() => registry.setActive('nonexistent')).toThrow();
  });

  it('should list all registered services', () => {
    const cloudinary = new CloudinaryImageService({ cloudName: 'test' });
    const imgix = new ImgixImageService({ domain: 'test.imgix.net' });

    registry.register(cloudinary);
    registry.register(imgix);

    const list = registry.list();
    expect(list).toContain('cloudinary');
    expect(list).toContain('imgix');
  });
});

describe('CloudinaryImageService', () => {
  let service: CloudinaryImageService;

  beforeEach(() => {
    service = new CloudinaryImageService({ cloudName: 'demo' });
  });

  it('should generate correct URL with width', () => {
    const url = service.getUrl('/image.jpg', { width: 800 });
    expect(url).toContain('w_800');
    expect(url).toContain('demo');
  });

  it('should generate correct URL with height', () => {
    const url = service.getUrl('/image.jpg', { height: 600 });
    expect(url).toContain('h_600');
  });

  it('should generate correct URL with quality', () => {
    const url = service.getUrl('/image.jpg', { quality: 90 });
    expect(url).toContain('q_90');
  });

  it('should generate correct URL with format', () => {
    const url = service.getUrl('/image.jpg', { format: 'webp' });
    expect(url).toContain('f_webp');
  });

  it('should generate correct URL with fit mode', () => {
    const url = service.getUrl('/image.jpg', { width: 800, fit: 'cover' });
    expect(url).toContain('c_fill');
  });

  it('should generate correct URL with blur', () => {
    const url = service.getUrl('/image.jpg', { blur: 5 });
    expect(url).toContain('e_blur:500');
  });

  it('should generate correct URL with background', () => {
    const url = service.getUrl('/image.jpg', { background: '#ff0000' });
    expect(url).toContain('b_rgb:ff0000');
  });

  it('should generate correct URL with aspect ratio', () => {
    const url = service.getUrl('/image.jpg', { aspectRatio: 16 / 9 });
    expect(url).toContain('ar_');
  });

  it('should support all standard formats', () => {
    const formats = service.getSupportedFormats();
    expect(formats).toContain('webp');
    expect(formats).toContain('avif');
    expect(formats).toContain('jpeg');
    expect(formats).toContain('png');
  });
});

describe('ImgixImageService', () => {
  let service: ImgixImageService;

  beforeEach(() => {
    service = new ImgixImageService({ domain: 'demo.imgix.net' });
  });

  it('should generate correct URL with width', () => {
    const url = service.getUrl('/image.jpg', { width: 800 });
    expect(url).toContain('w=800');
    expect(url).toContain('demo.imgix.net');
  });

  it('should generate correct URL with height', () => {
    const url = service.getUrl('/image.jpg', { height: 600 });
    expect(url).toContain('h=600');
  });

  it('should generate correct URL with quality', () => {
    const url = service.getUrl('/image.jpg', { quality: 90 });
    expect(url).toContain('q=90');
  });

  it('should generate correct URL with format', () => {
    const url = service.getUrl('/image.jpg', { format: 'webp' });
    expect(url).toContain('fm=webp');
  });

  it('should always include auto format and compress', () => {
    const url = service.getUrl('/image.jpg', {});
    expect(url).toContain('auto=format%2Ccompress');
  });

  it('should generate correct URL with fit mode', () => {
    const url = service.getUrl('/image.jpg', { width: 800, fit: 'cover' });
    expect(url).toContain('fit=crop');
  });

  it('should generate correct URL with blur', () => {
    const url = service.getUrl('/image.jpg', { blur: 5 });
    expect(url).toContain('blur=500');
  });

  it('should support all standard formats', () => {
    const formats = service.getSupportedFormats();
    expect(formats).toContain('webp');
    expect(formats).toContain('avif');
    expect(formats).toContain('jpeg');
    expect(formats).toContain('png');
  });
});

describe('configureImageService', () => {
  it('should configure Cloudinary service', () => {
    configureImageService('cloudinary', { cloudName: 'test' });
    const service = getImageService();
    expect(service.name).toBe('cloudinary');
  });

  it('should configure imgix service', () => {
    configureImageService('imgix', { domain: 'test.imgix.net' });
    const service = getImageService();
    expect(service.name).toBe('imgix');
  });

  it('should throw when Cloudinary config missing cloudName', () => {
    expect(() => configureImageService('cloudinary', {})).toThrow();
  });

  it('should throw when imgix config missing domain', () => {
    expect(() => configureImageService('imgix', {})).toThrow();
  });

  it('should accept custom service', () => {
    const customService = new CloudinaryImageService({ cloudName: 'custom' });
    configureImageService(customService);
    const service = getImageService();
    expect(service).toBe(customService);
  });
});

describe('selectOptimalFormat', () => {
  it('should select AVIF when supported', () => {
    const format = selectOptimalFormat('image/avif,image/webp,image/jpeg', ['avif', 'webp', 'jpeg']);
    expect(format).toBe('avif');
  });

  it('should select WebP when AVIF not supported', () => {
    const format = selectOptimalFormat('image/webp,image/jpeg', ['avif', 'webp', 'jpeg']);
    expect(format).toBe('webp');
  });

  it('should fallback to JPEG when modern formats not supported', () => {
    const format = selectOptimalFormat('image/jpeg', ['avif', 'webp', 'jpeg']);
    expect(format).toBe('jpeg');
  });

  it('should return fallback when no accept header', () => {
    const format = selectOptimalFormat(undefined, ['avif', 'webp', 'jpeg']);
    expect(format).toBe('jpeg');
  });

  it('should handle case-insensitive accept headers', () => {
    const format = selectOptimalFormat('IMAGE/WEBP', ['avif', 'webp', 'jpeg']);
    expect(format).toBe('webp');
  });
});

describe('getFormatPriority', () => {
  it('should order formats by priority', () => {
    const priority = getFormatPriority(['jpeg', 'webp', 'avif']);
    expect(priority[0]).toBe('avif');
    expect(priority[1]).toBe('webp');
    expect(priority[2]).toBe('jpeg');
  });

  it('should handle partial format lists', () => {
    const priority = getFormatPriority(['jpeg', 'png']);
    expect(priority[0]).toBe('jpeg');
    expect(priority[1]).toBe('png');
    expect(priority).not.toContain('avif');
    expect(priority).not.toContain('webp');
  });

  it('should maintain order for modern formats', () => {
    const priority = getFormatPriority(['avif', 'webp']);
    expect(priority[0]).toBe('avif');
    expect(priority[1]).toBe('webp');
  });
});
