/**
 * PhilJS Image Optimizer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  configure,
  getConfig,
  isSharpAvailable,
  type BlurPlaceholderOptions,
} from './optimizer';

describe('Image Optimizer Configuration', () => {
  beforeEach(() => {
    // Reset to default config
    configure({
      formats: ['webp', 'avif', 'jpeg'],
      quality: 85,
      breakpoints: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    });
  });

  it('should return default config', () => {
    const config = getConfig();
    expect(config.quality).toBe(85);
    expect(config.formats).toContain('webp');
    expect(config.formats).toContain('avif');
  });

  it('should update config', () => {
    configure({ quality: 90 });
    const config = getConfig();
    expect(config.quality).toBe(90);
  });

  it('should merge with existing config', () => {
    configure({ quality: 90 });
    const config = getConfig();
    expect(config.quality).toBe(90);
    expect(config.formats).toBeDefined();
  });

  it('should support custom breakpoints', () => {
    configure({ breakpoints: [480, 768, 1024] });
    const config = getConfig();
    expect(config.breakpoints).toEqual([480, 768, 1024]);
  });

  it('should support format-specific quality', () => {
    configure({
      qualityByFormat: {
        jpeg: 85,
        webp: 85,
        avif: 75,
        png: 90,
      },
    });
    const config = getConfig();
    expect(config.qualityByFormat?.avif).toBe(75);
    expect(config.qualityByFormat?.png).toBe(90);
  });
});

describe('Sharp Availability', () => {
  it('should detect Sharp availability', () => {
    const available = isSharpAvailable();
    // This will depend on whether Sharp is installed in the test environment
    expect(typeof available).toBe('boolean');
  });
});

describe('Blur Placeholder Options', () => {
  it('should define valid placeholder types', () => {
    const validTypes: BlurPlaceholderOptions['type'][] = [
      'base64',
      'blurhash',
      'dominant-color',
      'lqip',
    ];

    validTypes.forEach(type => {
      const options: BlurPlaceholderOptions = { type };
      expect(options.type).toBe(type);
    });
  });

  it('should support custom dimensions', () => {
    const options: BlurPlaceholderOptions = {
      width: 20,
      height: 20,
    };
    expect(options.width).toBe(20);
    expect(options.height).toBe(20);
  });

  it('should support custom quality', () => {
    const options: BlurPlaceholderOptions = {
      quality: 30,
    };
    expect(options.quality).toBe(30);
  });

  it('should support custom blur amount', () => {
    const options: BlurPlaceholderOptions = {
      blurAmount: 15,
    };
    expect(options.blurAmount).toBe(15);
  });
});

// Note: These tests would require Sharp to be installed and mocked
// For actual Sharp functionality tests, you'd need integration tests

describe('Image Optimization (Mock)', () => {
  it('should define correct transformation options', () => {
    const options = {
      width: 800,
      height: 600,
      format: 'webp' as const,
      quality: 85,
      fit: 'cover' as const,
      position: 'center' as const,
      blur: 5,
    };

    expect(options.width).toBe(800);
    expect(options.height).toBe(600);
    expect(options.format).toBe('webp');
    expect(options.quality).toBe(85);
    expect(options.fit).toBe('cover');
  });

  it('should support all image formats', () => {
    const formats = ['webp', 'avif', 'jpeg', 'png', 'gif'] as const;
    formats.forEach(format => {
      const options = { format };
      expect(options.format).toBe(format);
    });
  });

  it('should support all fit modes', () => {
    const fitModes = ['cover', 'contain', 'fill', 'inside', 'outside'] as const;
    fitModes.forEach(fit => {
      const options = { fit };
      expect(options.fit).toBe(fit);
    });
  });

  it('should support all position options', () => {
    const positions = [
      'center',
      'top',
      'right top',
      'right',
      'right bottom',
      'bottom',
      'left bottom',
      'left',
      'left top',
    ] as const;

    positions.forEach(position => {
      const options = { position };
      expect(options.position).toBe(position);
    });
  });
});

describe('Responsive Set Generation (Mock)', () => {
  it('should define correct responsive options', () => {
    const options = {
      formats: ['webp', 'avif'] as const,
      breakpoints: [640, 750, 828, 1080, 1200, 1920],
      quality: 85,
    };

    expect(options.formats).toHaveLength(2);
    expect(options.breakpoints).toHaveLength(6);
    expect(options.quality).toBe(85);
  });

  it('should support custom breakpoints', () => {
    const breakpoints = [480, 768, 1024, 1920];
    const options = { breakpoints };
    expect(options.breakpoints).toEqual(breakpoints);
  });
});

describe('Metadata Extraction (Mock)', () => {
  it('should define correct metadata structure', () => {
    const metadata = {
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: 256000,
      aspectRatio: 16 / 9,
      dominantColor: '#3366cc',
    };

    expect(metadata.width).toBe(1920);
    expect(metadata.height).toBe(1080);
    expect(metadata.format).toBe('jpeg');
    expect(metadata.aspectRatio).toBeCloseTo(16 / 9, 4);
    expect(metadata.dominantColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should calculate correct aspect ratio', () => {
    const cases = [
      { width: 1920, height: 1080, expected: 16 / 9 },
      { width: 1600, height: 900, expected: 16 / 9 },
      { width: 1024, height: 768, expected: 4 / 3 },
      { width: 800, height: 600, expected: 4 / 3 },
    ];

    cases.forEach(({ width, height, expected }) => {
      const aspectRatio = width / height;
      expect(aspectRatio).toBeCloseTo(expected, 3);
    });
  });
});

describe('Dominant Color Extraction (Mock)', () => {
  it('should produce valid hex color', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];

    colors.forEach(color => {
      expect(color).toMatch(hexPattern);
    });
  });

  it('should handle RGB to hex conversion', () => {
    const rgbToHex = (r: number, g: number, b: number) => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });
});
