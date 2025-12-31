/**
 * @philjs/ui - Test Suite
 * Tests for the UI component library exports and design tokens
 */

import { describe, it, expect } from 'vitest';
import {
  // Theme exports
  defaultTheme,
  colors,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  borderRadius,
  boxShadow,
  transition,
  zIndex,
  breakpoints,
} from '../index.js';

describe('@philjs/ui', () => {
  describe('Export Verification', () => {
    it('should export defaultTheme object', () => {
      expect(defaultTheme).toBeDefined();
      expect(typeof defaultTheme).toBe('object');
    });

    it('should export colors object', () => {
      expect(colors).toBeDefined();
      expect(typeof colors).toBe('object');
    });

    it('should export spacing object', () => {
      expect(spacing).toBeDefined();
      expect(typeof spacing).toBe('object');
    });

    it('should export fontSize object', () => {
      expect(fontSize).toBeDefined();
      expect(typeof fontSize).toBe('object');
    });

    it('should export fontWeight object', () => {
      expect(fontWeight).toBeDefined();
      expect(typeof fontWeight).toBe('object');
    });

    it('should export fontFamily object', () => {
      expect(fontFamily).toBeDefined();
      expect(typeof fontFamily).toBe('object');
    });

    it('should export borderRadius object', () => {
      expect(borderRadius).toBeDefined();
      expect(typeof borderRadius).toBe('object');
    });

    it('should export boxShadow object', () => {
      expect(boxShadow).toBeDefined();
      expect(typeof boxShadow).toBe('object');
    });

    it('should export transition object', () => {
      expect(transition).toBeDefined();
      expect(typeof transition).toBe('object');
    });

    it('should export zIndex object', () => {
      expect(zIndex).toBeDefined();
      expect(typeof zIndex).toBe('object');
    });

    it('should export breakpoints object', () => {
      expect(breakpoints).toBeDefined();
      expect(typeof breakpoints).toBe('object');
    });
  });

  describe('Color Tokens', () => {
    it('should have primary color palette', () => {
      expect(colors.primary).toBeDefined();
      expect(colors.primary[500]).toBe('#3b82f6');
    });

    it('should have gray color palette', () => {
      expect(colors.gray).toBeDefined();
      expect(colors.gray[500]).toBe('#6b7280');
    });

    it('should have success color palette', () => {
      expect(colors.success).toBeDefined();
      expect(colors.success[500]).toBe('#22c55e');
    });

    it('should have warning color palette', () => {
      expect(colors.warning).toBeDefined();
      expect(colors.warning[500]).toBe('#f59e0b');
    });

    it('should have error color palette', () => {
      expect(colors.error).toBeDefined();
      expect(colors.error[500]).toBe('#ef4444');
    });

    it('should have info color palette', () => {
      expect(colors.info).toBeDefined();
      expect(colors.info[500]).toBe('#06b6d4');
    });

    it('should have base colors', () => {
      expect(colors.white).toBe('#ffffff');
      expect(colors.black).toBe('#000000');
      expect(colors.transparent).toBe('transparent');
    });

    it('should have full color scale (50-900 or 950)', () => {
      const primaryKeys = Object.keys(colors.primary);
      expect(primaryKeys).toContain('50');
      expect(primaryKeys).toContain('100');
      expect(primaryKeys).toContain('500');
      expect(primaryKeys).toContain('900');
    });
  });

  describe('Spacing Tokens', () => {
    it('should have zero spacing', () => {
      expect(spacing[0]).toBe('0');
    });

    it('should have pixel spacing', () => {
      expect(spacing.px).toBe('1px');
    });

    it('should have rem-based spacing values', () => {
      expect(spacing[1]).toBe('0.25rem');
      expect(spacing[2]).toBe('0.5rem');
      expect(spacing[4]).toBe('1rem');
      expect(spacing[8]).toBe('2rem');
    });

    it('should have large spacing values', () => {
      expect(spacing[16]).toBe('4rem');
      expect(spacing[32]).toBe('8rem');
      expect(spacing[64]).toBe('16rem');
    });
  });

  describe('Font Size Tokens', () => {
    it('should have base font sizes with line heights', () => {
      expect(fontSize.base).toBeDefined();
      expect(Array.isArray(fontSize.base)).toBe(true);
      expect(fontSize.base[0]).toBe('1rem');
    });

    it('should have small font sizes', () => {
      expect(fontSize.xs).toBeDefined();
      expect(fontSize.sm).toBeDefined();
    });

    it('should have large font sizes', () => {
      expect(fontSize.lg).toBeDefined();
      expect(fontSize.xl).toBeDefined();
      expect(fontSize['2xl']).toBeDefined();
    });

    it('should include line height configuration', () => {
      const baseLineHeight = fontSize.base[1];
      expect(baseLineHeight).toBeDefined();
      expect(typeof baseLineHeight).toBe('object');
      expect(baseLineHeight.lineHeight).toBe('1.5rem');
    });
  });

  describe('Font Weight Tokens', () => {
    it('should have standard font weights', () => {
      expect(fontWeight.normal).toBe('400');
      expect(fontWeight.medium).toBe('500');
      expect(fontWeight.semibold).toBe('600');
      expect(fontWeight.bold).toBe('700');
    });

    it('should have thin and light weights', () => {
      expect(fontWeight.thin).toBe('100');
      expect(fontWeight.light).toBe('300');
    });

    it('should have heavy weights', () => {
      expect(fontWeight.extrabold).toBe('800');
      expect(fontWeight.black).toBe('900');
    });
  });

  describe('Font Family Tokens', () => {
    it('should have sans-serif font stack', () => {
      expect(fontFamily.sans).toBeDefined();
      expect(fontFamily.sans).toContain('system-ui');
    });

    it('should have serif font stack', () => {
      expect(fontFamily.serif).toBeDefined();
      expect(fontFamily.serif).toContain('Georgia');
    });

    it('should have monospace font stack', () => {
      expect(fontFamily.mono).toBeDefined();
      expect(fontFamily.mono).toContain('monospace');
    });
  });

  describe('Border Radius Tokens', () => {
    it('should have none radius', () => {
      expect(borderRadius.none).toBe('0');
    });

    it('should have standard radius values', () => {
      expect(borderRadius.sm).toBe('0.125rem');
      expect(borderRadius.md).toBe('0.375rem');
      expect(borderRadius.lg).toBe('0.5rem');
    });

    it('should have full radius for circles', () => {
      expect(borderRadius.full).toBe('9999px');
    });
  });

  describe('Box Shadow Tokens', () => {
    it('should have none shadow', () => {
      expect(boxShadow.none).toBe('none');
    });

    it('should have standard shadow sizes', () => {
      expect(boxShadow.sm).toBeDefined();
      expect(boxShadow.DEFAULT).toBeDefined();
      expect(boxShadow.md).toBeDefined();
      expect(boxShadow.lg).toBeDefined();
    });

    it('should have inner shadow', () => {
      expect(boxShadow.inner).toBeDefined();
      expect(boxShadow.inner).toContain('inset');
    });
  });

  describe('Transition Tokens', () => {
    it('should have none transition', () => {
      expect(transition.none).toBe('none');
    });

    it('should have all transition', () => {
      expect(transition.all).toBeDefined();
      expect(transition.all).toContain('150ms');
    });

    it('should have specific property transitions', () => {
      expect(transition.colors).toBeDefined();
      expect(transition.opacity).toBeDefined();
      expect(transition.shadow).toBeDefined();
      expect(transition.transform).toBeDefined();
    });
  });

  describe('Z-Index Tokens', () => {
    it('should have auto z-index', () => {
      expect(zIndex.auto).toBe('auto');
    });

    it('should have numeric z-index values', () => {
      expect(zIndex[0]).toBe('0');
      expect(zIndex[10]).toBe('10');
      expect(zIndex[50]).toBe('50');
    });

    it('should have semantic z-index values', () => {
      expect(zIndex.dropdown).toBe('1000');
      expect(zIndex.modal).toBe('1050');
      expect(zIndex.tooltip).toBe('1070');
    });

    it('should have proper z-index stacking order', () => {
      const modalIndex = parseInt(zIndex.modal, 10);
      const dropdownIndex = parseInt(zIndex.dropdown, 10);
      const tooltipIndex = parseInt(zIndex.tooltip, 10);

      expect(tooltipIndex).toBeGreaterThan(modalIndex);
      expect(modalIndex).toBeGreaterThan(dropdownIndex);
    });
  });

  describe('Breakpoint Tokens', () => {
    it('should have small breakpoint', () => {
      expect(breakpoints.sm).toBe('640px');
    });

    it('should have medium breakpoint', () => {
      expect(breakpoints.md).toBe('768px');
    });

    it('should have large breakpoint', () => {
      expect(breakpoints.lg).toBe('1024px');
    });

    it('should have extra large breakpoints', () => {
      expect(breakpoints.xl).toBe('1280px');
      expect(breakpoints['2xl']).toBe('1536px');
    });

    it('should have increasing breakpoint values', () => {
      const sm = parseInt(breakpoints.sm, 10);
      const md = parseInt(breakpoints.md, 10);
      const lg = parseInt(breakpoints.lg, 10);
      const xl = parseInt(breakpoints.xl, 10);

      expect(md).toBeGreaterThan(sm);
      expect(lg).toBeGreaterThan(md);
      expect(xl).toBeGreaterThan(lg);
    });
  });

  describe('Default Theme Structure', () => {
    it('should contain all token categories', () => {
      expect(defaultTheme.colors).toBe(colors);
      expect(defaultTheme.spacing).toBe(spacing);
      expect(defaultTheme.fontSize).toBe(fontSize);
      expect(defaultTheme.fontWeight).toBe(fontWeight);
      expect(defaultTheme.fontFamily).toBe(fontFamily);
      expect(defaultTheme.borderRadius).toBe(borderRadius);
      expect(defaultTheme.boxShadow).toBe(boxShadow);
      expect(defaultTheme.transition).toBe(transition);
      expect(defaultTheme.zIndex).toBe(zIndex);
      expect(defaultTheme.breakpoints).toBe(breakpoints);
    });

    it('should be a complete theme object', () => {
      const themeKeys = Object.keys(defaultTheme);
      expect(themeKeys.length).toBeGreaterThanOrEqual(10);
    });
  });
});
