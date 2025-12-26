/**
 * Tests for PhilJS Charts Package
 */

import { describe, it, expect } from 'vitest';
import {
  defaultPalette,
  colorBlindSafePalette,
  divergingPalette,
  sequentialPalettes,
  lightTheme,
  darkTheme,
  adjustForDarkMode,
  hexToRgba,
  generateGradient,
  getContrastColor,
  createColorScale,
} from './utils/colors.js';
import {
  formatNumber,
  formatCompact,
  formatPercent,
  formatCurrency,
  formatBytes,
  formatDate,
  formatTime,
  formatDuration,
  formatOrdinal,
  formatScientific,
  createAxisFormatter,
} from './utils/formatters.js';

describe('Color Utilities', () => {
  describe('defaultPalette', () => {
    it('should have 10 colors', () => {
      expect(defaultPalette.length).toBe(10);
    });

    it('should contain valid hex colors', () => {
      defaultPalette.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('colorBlindSafePalette', () => {
    it('should have 8 colors', () => {
      expect(colorBlindSafePalette.length).toBe(8);
    });

    it('should contain valid hex colors', () => {
      colorBlindSafePalette.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('themes', () => {
    it('should have light theme with correct properties', () => {
      expect(lightTheme.name).toBe('light');
      expect(lightTheme.background).toBe('#FFFFFF');
      expect(lightTheme.colors).toBeDefined();
      expect(lightTheme.tooltip).toBeDefined();
    });

    it('should have dark theme with correct properties', () => {
      expect(darkTheme.name).toBe('dark');
      expect(darkTheme.background).toBe('#1F2937');
      expect(darkTheme.colors.length).toBe(defaultPalette.length);
    });
  });

  describe('adjustForDarkMode', () => {
    it('should lighten colors for dark mode', () => {
      const original = '#3B82F6';
      const adjusted = adjustForDarkMode(original);

      expect(adjusted).not.toBe(original);
      expect(adjusted).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should not exceed max RGB values', () => {
      const nearWhite = '#F0F0F0';
      const adjusted = adjustForDarkMode(nearWhite);

      // Should still be valid hex
      expect(adjusted).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(hexToRgba('#00FF00', 1)).toBe('rgba(0, 255, 0, 1)');
      expect(hexToRgba('#0000FF', 0.25)).toBe('rgba(0, 0, 255, 0.25)');
    });

    it('should handle colors without hash', () => {
      expect(hexToRgba('FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });
  });

  describe('generateGradient', () => {
    it('should generate gradient between two colors', () => {
      const gradient = generateGradient('#000000', '#FFFFFF', 5);

      expect(gradient.length).toBe(5);
      expect(gradient[0]).toBe('#000000');
      expect(gradient[gradient.length - 1]).toBe('#ffffff');
    });

    it('should generate intermediate colors', () => {
      const gradient = generateGradient('#FF0000', '#0000FF', 3);

      expect(gradient.length).toBe(3);
      expect(gradient[1]).not.toBe(gradient[0]);
      expect(gradient[1]).not.toBe(gradient[2]);
    });
  });

  describe('getContrastColor', () => {
    it('should return dark text for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#1F2937');
      expect(getContrastColor('#F0F0F0')).toBe('#1F2937');
    });

    it('should return light text for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#F9FAFB');
      expect(getContrastColor('#1F2937')).toBe('#F9FAFB');
    });
  });

  describe('createColorScale', () => {
    it('should create a function that maps values to colors', () => {
      const scale = createColorScale([0, 100], ['#FF0000', '#00FF00', '#0000FF']);

      expect(typeof scale).toBe('function');
      expect(scale(0)).toBe('#FF0000');
      expect(scale(100)).toBe('#0000FF');
    });

    it('should clamp values outside domain', () => {
      const scale = createColorScale([0, 100], ['#FF0000', '#0000FF']);

      expect(scale(-50)).toBe('#FF0000');
      expect(scale(150)).toBe('#0000FF');
    });
  });
});

describe('Formatter Utilities', () => {
  describe('formatNumber', () => {
    it('should format numbers with default decimals', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234.56, 2)).toBe('1,234.56');
    });

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1234)).toBe('-1,234');
    });
  });

  describe('formatCompact', () => {
    it('should format large numbers with suffixes', () => {
      expect(formatCompact(1500)).toBe('1.5K');
      expect(formatCompact(2500000)).toBe('2.5M');
      expect(formatCompact(3500000000)).toBe('3.5B');
      expect(formatCompact(4500000000000)).toBe('4.5T');
    });

    it('should handle small numbers without suffix', () => {
      expect(formatCompact(500)).toBe('500');
      expect(formatCompact(999)).toBe('999');
    });

    it('should handle negative numbers', () => {
      expect(formatCompact(-1500)).toBe('-1.5K');
      expect(formatCompact(-2500000)).toBe('-2.5M');
    });
  });

  describe('formatPercent', () => {
    it('should format decimals as percentages', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.123, 2)).toBe('12.30%');
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('should handle values over 100%', () => {
      expect(formatPercent(1.5)).toBe('150.0%');
    });
  });

  describe('formatCurrency', () => {
    it('should format as currency with default USD', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234');
      expect(result).toContain('$');
    });

    it('should support different currencies', () => {
      const euroResult = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(euroResult).toBeDefined();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes with appropriate unit', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds to human readable duration', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(3665000)).toBe('1h 1m');
      expect(formatDuration(90061000)).toBe('1d 1h');
    });
  });

  describe('formatOrdinal', () => {
    it('should format numbers with ordinal suffixes', () => {
      expect(formatOrdinal(1)).toBe('1st');
      expect(formatOrdinal(2)).toBe('2nd');
      expect(formatOrdinal(3)).toBe('3rd');
      expect(formatOrdinal(4)).toBe('4th');
      expect(formatOrdinal(11)).toBe('11th');
      expect(formatOrdinal(12)).toBe('12th');
      expect(formatOrdinal(13)).toBe('13th');
      expect(formatOrdinal(21)).toBe('21st');
      expect(formatOrdinal(22)).toBe('22nd');
      expect(formatOrdinal(23)).toBe('23rd');
    });
  });

  describe('formatScientific', () => {
    it('should format numbers in scientific notation', () => {
      expect(formatScientific(1234567)).toMatch(/^\d\.\d+e\+\d$/);
      expect(formatScientific(0.000123)).toMatch(/^\d\.\d+e-\d$/);
    });
  });

  describe('createAxisFormatter', () => {
    it('should create number formatter by default', () => {
      const formatter = createAxisFormatter();
      expect(formatter(1234)).toBe('1,234');
    });

    it('should create compact formatter', () => {
      const formatter = createAxisFormatter({ type: 'compact' });
      expect(formatter(1500000)).toBe('1.5M');
    });

    it('should create percent formatter', () => {
      const formatter = createAxisFormatter({ type: 'percent' });
      expect(formatter(0.5)).toBe('50.0%');
    });

    it('should support prefix and suffix', () => {
      const formatter = createAxisFormatter({
        type: 'number',
        prefix: '$',
        suffix: ' USD',
      });
      expect(formatter(100)).toBe('$100 USD');
    });
  });
});

describe('Sequential Palettes', () => {
  it('should have blues palette', () => {
    expect(sequentialPalettes.blues).toBeDefined();
    expect(sequentialPalettes.blues.length).toBeGreaterThan(0);
  });

  it('should have greens palette', () => {
    expect(sequentialPalettes.greens).toBeDefined();
    expect(sequentialPalettes.greens.length).toBeGreaterThan(0);
  });

  it('should have all palettes with valid hex colors', () => {
    Object.values(sequentialPalettes).forEach(palette => {
      palette.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});

describe('Diverging Palette', () => {
  it('should have negative, neutral, and positive sections', () => {
    expect(divergingPalette.negative).toBeDefined();
    expect(divergingPalette.neutral).toBeDefined();
    expect(divergingPalette.positive).toBeDefined();
  });

  it('should have arrays for negative and positive', () => {
    expect(Array.isArray(divergingPalette.negative)).toBe(true);
    expect(Array.isArray(divergingPalette.positive)).toBe(true);
  });

  it('should have neutral as a single color', () => {
    expect(typeof divergingPalette.neutral).toBe('string');
    expect(divergingPalette.neutral).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
