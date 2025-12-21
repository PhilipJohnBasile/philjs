/**
 * Styles Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StyleSheet,
  useColorScheme,
  colorScheme,
  platformStyles,
  lightTheme,
  darkTheme,
  setTheme,
  useTheme,
  currentTheme,
  breakpoints,
  currentBreakpoint,
  responsive,
  commonStyles,
} from './styles';

describe('Styles', () => {
  describe('StyleSheet', () => {
    it('should create styles', () => {
      const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: 'white',
        },
        text: {
          fontSize: 16,
          color: 'black',
        },
      });

      expect(styles.container).toBeDefined();
      expect(styles.text).toBeDefined();
      expect(styles.container.flex).toBe(1);
      expect(styles.text.fontSize).toBe(16);
    });

    it('should flatten style arrays', () => {
      const style1 = { flex: 1 };
      const style2 = { backgroundColor: 'red' };

      const flattened = StyleSheet.flatten([style1, style2]);

      expect(flattened).toEqual({ flex: 1, backgroundColor: 'red' });
    });

    it('should handle null in style arrays', () => {
      const flattened = StyleSheet.flatten([{ flex: 1 }, null, { color: 'red' }]);

      expect(flattened).toEqual({ flex: 1, color: 'red' });
    });

    it('should flatten nested arrays', () => {
      const flattened = StyleSheet.flatten([
        { flex: 1 },
        [{ color: 'red' }, { fontSize: 16 }],
      ]);

      expect(flattened).toEqual({ flex: 1, color: 'red', fontSize: 16 });
    });

    it('should return undefined for null input', () => {
      const flattened = StyleSheet.flatten(null);

      expect(flattened).toBeUndefined();
    });

    it('should compose styles', () => {
      const style1 = { flex: 1 };
      const style2 = { color: 'red' };

      const composed = StyleSheet.compose(style1, style2);

      expect(composed).toEqual([style1, style2]);
    });

    it('should handle null in compose', () => {
      const style = { flex: 1 };

      expect(StyleSheet.compose(style, null)).toBe(style);
      expect(StyleSheet.compose(null, style)).toBe(style);
      expect(StyleSheet.compose(null, null)).toBeUndefined();
    });

    it('should have absoluteFill', () => {
      expect(StyleSheet.absoluteFill).toEqual({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });
    });

    it('should have absoluteFillObject', () => {
      expect(StyleSheet.absoluteFillObject).toEqual({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });
    });

    it('should have hairlineWidth', () => {
      expect(typeof StyleSheet.hairlineWidth).toBe('number');
      expect(StyleSheet.hairlineWidth).toBeGreaterThan(0);
      expect(StyleSheet.hairlineWidth).toBeLessThanOrEqual(1);
    });
  });

  describe('Color Scheme', () => {
    it('should return color scheme', () => {
      const scheme = useColorScheme();

      expect(['light', 'dark']).toContain(scheme);
    });

    it('should have colorScheme signal', () => {
      expect(colorScheme).toBeDefined();
      expect(typeof colorScheme).toBe('function');
    });
  });

  describe('platformStyles', () => {
    it('should return web styles on web', () => {
      const styles = platformStyles({
        ios: { padding: 10 },
        android: { padding: 20 },
        web: { padding: 30 },
        default: { padding: 0 },
      });

      expect(styles.padding).toBe(30);
    });

    it('should merge with default styles', () => {
      const styles = platformStyles({
        web: { color: 'red' },
        default: { fontSize: 16 },
      });

      expect(styles.fontSize).toBe(16);
      expect(styles.color).toBe('red');
    });

    it('should fallback to default when no platform match', () => {
      const styles = platformStyles({
        ios: { padding: 10 },
        default: { padding: 0 },
      });

      expect(styles.padding).toBe(0);
    });
  });

  describe('Theme', () => {
    it('should have light theme', () => {
      expect(lightTheme).toBeDefined();
      expect(lightTheme.colors).toBeDefined();
      expect(lightTheme.spacing).toBeDefined();
      expect(lightTheme.typography).toBeDefined();
      expect(lightTheme.borderRadius).toBeDefined();
    });

    it('should have dark theme', () => {
      expect(darkTheme).toBeDefined();
      expect(darkTheme.colors).toBeDefined();
    });

    it('should have different colors for light and dark', () => {
      expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
      expect(lightTheme.colors.text).not.toBe(darkTheme.colors.text);
    });

    it('should set theme', () => {
      setTheme(darkTheme);
      expect(currentTheme()).toBe(darkTheme);

      setTheme(lightTheme);
      expect(currentTheme()).toBe(lightTheme);
    });

    it('should get current theme with hook', () => {
      setTheme(lightTheme);
      const theme = useTheme();

      expect(theme).toBe(lightTheme);
    });

    it('should have all required theme colors', () => {
      const requiredColors = [
        'primary',
        'secondary',
        'background',
        'surface',
        'error',
        'onPrimary',
        'onBackground',
        'text',
        'textSecondary',
        'border',
        'disabled',
      ];

      for (const color of requiredColors) {
        expect(lightTheme.colors).toHaveProperty(color);
        expect(darkTheme.colors).toHaveProperty(color);
      }
    });

    it('should have all required spacing values', () => {
      const requiredSpacing = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

      for (const spacing of requiredSpacing) {
        expect(lightTheme.spacing).toHaveProperty(spacing);
        expect(typeof lightTheme.spacing[spacing as keyof typeof lightTheme.spacing]).toBe('number');
      }
    });

    it('should have all required typography styles', () => {
      const requiredTypography = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'body1', 'body2', 'caption', 'button', 'overline',
      ];

      for (const typo of requiredTypography) {
        expect(lightTheme.typography).toHaveProperty(typo);
      }
    });
  });

  describe('Breakpoints', () => {
    it('should have defined breakpoints', () => {
      expect(breakpoints).toHaveProperty('xs');
      expect(breakpoints).toHaveProperty('sm');
      expect(breakpoints).toHaveProperty('md');
      expect(breakpoints).toHaveProperty('lg');
      expect(breakpoints).toHaveProperty('xl');
      expect(breakpoints).toHaveProperty('xxl');
    });

    it('should have ascending breakpoint values', () => {
      expect(breakpoints.xs).toBeLessThan(breakpoints.sm);
      expect(breakpoints.sm).toBeLessThan(breakpoints.md);
      expect(breakpoints.md).toBeLessThan(breakpoints.lg);
      expect(breakpoints.lg).toBeLessThan(breakpoints.xl);
      expect(breakpoints.xl).toBeLessThan(breakpoints.xxl);
    });

    it('should have currentBreakpoint signal', () => {
      expect(currentBreakpoint).toBeDefined();
      expect(typeof currentBreakpoint).toBe('function');
    });

    it('should return valid breakpoint', () => {
      const bp = currentBreakpoint();
      expect(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']).toContain(bp);
    });
  });

  describe('responsive', () => {
    it('should return value for current breakpoint', () => {
      const value = responsive({
        xs: 10,
        md: 20,
        xl: 30,
      });

      expect(typeof value).toBe('number');
    });

    it('should fallback to smaller breakpoint', () => {
      // Assuming we're on a medium or larger screen
      const value = responsive({
        xs: 10,
      });

      expect(value).toBe(10);
    });

    it('should return undefined when no match', () => {
      const value = responsive({});

      expect(value).toBeUndefined();
    });
  });

  describe('commonStyles', () => {
    it('should have row style', () => {
      expect(commonStyles.row).toBeDefined();
      expect(commonStyles.row.flexDirection).toBe('row');
    });

    it('should have column style', () => {
      expect(commonStyles.column).toBeDefined();
      expect(commonStyles.column.flexDirection).toBe('column');
    });

    it('should have center style', () => {
      expect(commonStyles.center).toBeDefined();
      expect(commonStyles.center.alignItems).toBe('center');
      expect(commonStyles.center.justifyContent).toBe('center');
    });

    it('should have fill style', () => {
      expect(commonStyles.fill).toBeDefined();
      expect(commonStyles.fill.flex).toBe(1);
    });

    it('should have shadow style', () => {
      expect(commonStyles.shadow).toBeDefined();
    });
  });
});
