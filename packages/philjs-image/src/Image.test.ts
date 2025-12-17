/**
 * PhilJS Image - Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isExternalUrl,
  generateSrcSet,
  getOptimizedUrl,
  getFormatFromSrc,
  calculateAspectRatio,
  getResponsiveSizes,
  isValidFormat,
  createCacheKey,
} from './utils';

describe('Image Utils', () => {
  describe('isExternalUrl', () => {
    it('should detect external URLs', () => {
      expect(isExternalUrl('https://example.com/image.jpg')).toBe(true);
      expect(isExternalUrl('http://example.com/image.jpg')).toBe(true);
      expect(isExternalUrl('/images/photo.jpg')).toBe(false);
      expect(isExternalUrl('./photo.jpg')).toBe(false);
    });
  });

  describe('generateSrcSet', () => {
    it('should generate srcSet for local images', () => {
      const result = generateSrcSet('/photo.jpg', {
        width: 800,
        height: 600,
        quality: 85,
      });

      expect(result).not.toBeNull();
      expect(result!.width).toBe(800);
      expect(result!.height).toBe(600);
      expect(result!.srcSet).toContain('w');
    });

    it('should return basic result without width', () => {
      const result = generateSrcSet('/photo.jpg', {
        quality: 85,
      });

      expect(result).not.toBeNull();
      expect(result!.src).toBe('/photo.jpg');
    });
  });

  describe('getOptimizedUrl', () => {
    it('should return original URL for external images', () => {
      const url = getOptimizedUrl('https://example.com/image.jpg', {
        width: 800,
        quality: 85,
      });

      expect(url).toBe('https://example.com/image.jpg');
    });
  });

  describe('getFormatFromSrc', () => {
    it('should detect image formats', () => {
      expect(getFormatFromSrc('/image.jpg')).toBe('jpeg');
      expect(getFormatFromSrc('/image.jpeg')).toBe('jpeg');
      expect(getFormatFromSrc('/image.png')).toBe('png');
      expect(getFormatFromSrc('/image.webp')).toBe('webp');
      expect(getFormatFromSrc('/image.avif')).toBe('avif');
      expect(getFormatFromSrc('/image.gif')).toBe('gif');
    });
  });

  describe('calculateAspectRatio', () => {
    it('should calculate aspect ratio', () => {
      expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(1.78, 1);
      expect(calculateAspectRatio(800, 600)).toBeCloseTo(1.33, 1);
      expect(calculateAspectRatio(100, 100)).toBe(1);
    });
  });

  describe('getResponsiveSizes', () => {
    it('should generate responsive sizes string', () => {
      const sizes = getResponsiveSizes(800);
      expect(sizes).toContain('800px');
      expect(sizes).toContain('100vw');
    });
  });

  describe('isValidFormat', () => {
    it('should validate image formats', () => {
      expect(isValidFormat('webp')).toBe(true);
      expect(isValidFormat('avif')).toBe(true);
      expect(isValidFormat('jpeg')).toBe(true);
      expect(isValidFormat('png')).toBe(true);
      expect(isValidFormat('gif')).toBe(true);
      expect(isValidFormat('bmp')).toBe(false);
      expect(isValidFormat('tiff')).toBe(false);
    });
  });

  describe('createCacheKey', () => {
    it('should create consistent cache keys', () => {
      const key1 = createCacheKey('/image.jpg', { width: 800, quality: 85 });
      const key2 = createCacheKey('/image.jpg', { width: 800, quality: 85 });
      const key3 = createCacheKey('/image.jpg', { width: 1200, quality: 85 });

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });
  });
});

describe('Image Component', () => {
  // Component tests would go here with proper JSX testing setup
  it('should be tested with philjs-testing', () => {
    expect(true).toBe(true);
  });
});
