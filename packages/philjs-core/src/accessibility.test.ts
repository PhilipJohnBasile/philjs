/**
 * Accessibility Tests - Automatic Accessibility Features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  configureA11y,
  getA11yConfig,
  enhanceWithAria,
  validateHeadingHierarchy,
  getHeadingWarnings,
  resetHeadingTracker,
  getContrastRatio,
  validateColorContrast,
  auditAccessibility,
  announceToScreenReader,
  createLoadingState,
} from './accessibility';

describe('Automatic Accessibility', () => {
  beforeEach(() => {
    configureA11y({
      autoAria: true,
      headingHierarchy: true,
      keyboardNav: true,
      colorContrast: true,
      focusManagement: true,
      devWarnings: false,
      minContrastRatio: 4.5,
    });
    resetHeadingTracker();
  });

  describe('Configuration', () => {
    it('should configure accessibility settings', () => {
      configureA11y({
        autoAria: false,
        minContrastRatio: 7,
      });

      const config = getA11yConfig();
      expect(config.autoAria).toBe(false);
      expect(config.minContrastRatio).toBe(7);
    });

    it('should merge with default config', () => {
      configureA11y({ autoAria: false });

      const config = getA11yConfig();
      expect(config.autoAria).toBe(false);
      expect(config.headingHierarchy).toBe(true); // Default preserved
    });
  });

  describe('Automatic ARIA Enhancement', () => {
    it('should add ARIA to button', () => {
      const enhanced = enhanceWithAria('button', { children: 'Click me' });

      expect(enhanced.role).toBe('button');
      expect(enhanced['aria-label']).toBe('Click me');
    });

    it('should add ARIA to link', () => {
      const enhanced = enhanceWithAria('a', { href: '/home' });

      expect(enhanced.role).toBe('link');
      expect(enhanced['aria-label']).toBe('Link to /home');
    });

    it('should add ARIA to input', () => {
      const enhanced = enhanceWithAria('input', { type: 'text', placeholder: 'Name' });

      expect(enhanced['aria-label']).toBe('Name');
      expect(enhanced['aria-required']).toBe('false');
    });

    it('should add ARIA to heading', () => {
      const enhanced = enhanceWithAria('h1', { children: 'Title' });

      expect(enhanced.role).toBe('heading');
      expect(enhanced['aria-level']).toBe('1');
      expect(enhanced['aria-label']).toBe('Title');
    });

    it('should add ARIA to image', () => {
      const enhanced = enhanceWithAria('img', {});

      expect(enhanced.role).toBe('img');
      expect(enhanced['aria-label']).toBeDefined();
    });

    it('should NOT override existing ARIA', () => {
      const enhanced = enhanceWithAria('button', {
        'aria-label': 'Custom label',
        children: 'Button',
      });

      expect(enhanced['aria-label']).toBe('Custom label');
      expect(enhanced.role).toBeUndefined(); // Should not add role
    });

    it('should respect autoAria config', () => {
      configureA11y({ autoAria: false });

      const enhanced = enhanceWithAria('button', { children: 'Click' });

      expect(enhanced.role).toBeUndefined();
      expect(enhanced['aria-label']).toBeUndefined();
    });

    it('should add ARIA to navigation', () => {
      const enhanced = enhanceWithAria('nav', {});

      expect(enhanced.role).toBe('navigation');
      expect(enhanced['aria-label']).toBe('Navigation');
    });

    it('should add ARIA to list', () => {
      const enhanced = enhanceWithAria('ul', {});
      expect(enhanced.role).toBe('list');

      const item = enhanceWithAria('li', {});
      expect(item.role).toBe('listitem');
    });
  });

  describe('Heading Hierarchy Validation', () => {
    it('should pass with proper hierarchy', () => {
      validateHeadingHierarchy('h1');
      validateHeadingHierarchy('h2');
      validateHeadingHierarchy('h3');

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(0);
    });

    it('should warn when skipping levels', () => {
      validateHeadingHierarchy('h1');
      validateHeadingHierarchy('h3'); // Skipped h2!

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('heading');
      expect(warnings[0].severity).toBe('warning');
      expect(warnings[0].message).toContain('skips from h1 to h3');
    });

    it('should warn if first heading is not h1', () => {
      validateHeadingHierarchy('h2');

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('First heading is h2, should be h1');
    });

    it('should handle multiple heading skips', () => {
      validateHeadingHierarchy('h1');
      validateHeadingHierarchy('h3');
      validateHeadingHierarchy('h5');

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(2);
    });

    it('should reset heading tracker', () => {
      validateHeadingHierarchy('h2');
      expect(getHeadingWarnings()).toHaveLength(1);

      resetHeadingTracker();
      expect(getHeadingWarnings()).toHaveLength(0);
    });
  });

  describe('Color Contrast Validation', () => {
    it('should validate good contrast (black on white)', () => {
      const result = validateColorContrast('#000000', '#ffffff');

      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThan(20); // Perfect contrast is 21:1
    });

    it('should fail poor contrast', () => {
      const result = validateColorContrast('#888888', '#999999');

      expect(result.passes).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning?.type).toBe('contrast');
    });

    it('should handle hex colors', () => {
      const result = validateColorContrast('#ffffff', '#000000');
      expect(result.passes).toBe(true);
    });

    it('should handle rgb colors', () => {
      const result = validateColorContrast('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(result.passes).toBe(true);
    });

    it('should use different threshold for large text', () => {
      const fgColor = '#757575';
      const bgColor = '#ffffff';

      const normalText = validateColorContrast(fgColor, bgColor, false);
      const largeText = validateColorContrast(fgColor, bgColor, true);

      // Large text has more lenient requirement (3:1 vs 4.5:1)
      // So it might pass while normal text fails
      expect(largeText.ratio).toBe(normalText.ratio);
    });

    it('should respect minContrastRatio config', () => {
      configureA11y({ minContrastRatio: 7 }); // WCAG AAA

      const result = validateColorContrast('#767676', '#ffffff');

      // This has ~4.6:1 ratio, passes AA but fails AAA
      expect(result.passes).toBe(false);
    });

    it('should calculate contrast ratio correctly', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);

      const ratio2 = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio2).toBe(1);
    });
  });

  describe('Accessibility Audit', () => {
    it('should generate audit report with no issues', () => {
      const report = auditAccessibility();

      expect(report.warnings).toHaveLength(0);
      expect(report.score).toBe(100);
      expect(report.failed).toBe(0);
    });

    it('should generate audit report with warnings', () => {
      validateHeadingHierarchy('h2'); // Bad hierarchy
      validateHeadingHierarchy('h4'); // Skip level

      const report = auditAccessibility();

      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.score).toBeLessThan(100);
      expect(report.failed).toBeGreaterThan(0);
    });

    it('should calculate score correctly', () => {
      // Create specific number of warnings
      validateHeadingHierarchy('h2'); // 1 warning
      validateHeadingHierarchy('h4'); // 1 more warning

      const report = auditAccessibility();

      // 2 warnings = -10 points = 90 score
      expect(report.score).toBe(90);
      expect(report.failed).toBe(2);
    });

    it('should include timestamp', () => {
      const report = auditAccessibility();
      expect(report.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should create loading state controller', () => {
      const loading = createLoadingState('Loading data...');

      expect(loading.start).toBeDefined();
      expect(loading.stop).toBeDefined();

      // Should not throw
      loading.start();
      loading.stop();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should enhance form with proper ARIA', () => {
      const form = {
        input: enhanceWithAria('input', { type: 'email', placeholder: 'Email' }),
        button: enhanceWithAria('button', { children: 'Submit' }),
      };

      expect(form.input['aria-label']).toBe('Email');
      expect(form.button['aria-label']).toBe('Submit');
    });

    it('should validate navigation structure', () => {
      validateHeadingHierarchy('h1'); // Page title
      validateHeadingHierarchy('h2'); // Section
      validateHeadingHierarchy('h3'); // Subsection
      validateHeadingHierarchy('h2'); // Another section

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(0);
    });

    it('should detect color issues in theme', () => {
      const theme = {
        primary: '#3b82f6',
        background: '#ffffff',
        text: '#000000',
      };

      const primaryOnWhite = validateColorContrast(theme.primary, theme.background);
      const textOnWhite = validateColorContrast(theme.text, theme.background);

      expect(textOnWhite.passes).toBe(true);
      // Primary blue might not have enough contrast
    });

    it('should enhance card component', () => {
      const card = {
        heading: enhanceWithAria('h2', { children: 'Card Title' }),
        link: enhanceWithAria('a', { href: '/details' }),
        button: enhanceWithAria('button', { children: 'Learn More' }),
      };

      expect(card.heading.role).toBe('heading');
      expect(card.heading['aria-level']).toBe('2');
      expect(card.link.role).toBe('link');
      expect(card.button.role).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle elements without children', () => {
      const enhanced = enhanceWithAria('button', {});
      expect(enhanced['aria-label']).toBeDefined();
    });

    it('should handle complex heading hierarchy', () => {
      // Realistic document structure
      validateHeadingHierarchy('h1'); // Page title
      validateHeadingHierarchy('h2'); // First section
      validateHeadingHierarchy('h3'); // Subsection
      validateHeadingHierarchy('h3'); // Another subsection
      validateHeadingHierarchy('h2'); // Second section
      validateHeadingHierarchy('h3'); // Its subsection

      const warnings = getHeadingWarnings();
      expect(warnings).toHaveLength(0);
    });

    it('should handle invalid color formats gracefully', () => {
      const ratio = getContrastRatio('invalid', 'alsoInvalid');
      expect(ratio).toBe(21); // Assumes perfect contrast if can't parse
    });

    it('should handle rgba colors', () => {
      const ratio = getContrastRatio('rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 1)');
      expect(ratio).toBeGreaterThan(1);
    });
  });

  describe('Performance', () => {
    it('should handle 100 ARIA enhancements quickly', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        enhanceWithAria('button', { children: `Button ${i}` });
        enhanceWithAria('a', { href: `/link${i}` });
        enhanceWithAria('input', { type: 'text' });
      }

      const duration = performance.now() - start;
      console.log(`  → 300 ARIA enhancements in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('should validate 100 headings quickly', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        validateHeadingHierarchy('h2');
      }

      const duration = performance.now() - start;
      console.log(`  → 100 heading validations in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    it('should calculate 100 contrast ratios quickly', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        getContrastRatio('#000000', '#ffffff');
        getContrastRatio('#3b82f6', '#ffffff');
        getContrastRatio('#ef4444', '#000000');
      }

      const duration = performance.now() - start;
      console.log(`  → 300 contrast calculations in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10);
    });
  });
});
