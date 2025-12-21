import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateHash,
  cx,
  clsx,
  classNames,
  mergeStyles,
  cssPropertyToString,
  injectStyles,
  removeStyles,
  getInjectedStyles,
  clearAllStyles,
  media,
  responsive,
  cssVar,
  hover,
  focus,
  active,
  disabled,
} from './utils';
import type { CSSProperties } from './types';

describe('generateHash()', () => {
  it('generates a hash from a string', () => {
    const hash = generateHash('test-string');
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeLessThanOrEqual(8);
  });

  it('generates consistent hashes for the same input', () => {
    const input = 'consistent-input';
    const hash1 = generateHash(input);
    const hash2 = generateHash(input);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different inputs', () => {
    const hash1 = generateHash('input-one');
    const hash2 = generateHash('input-two');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', () => {
    const hash = generateHash('');
    expect(hash).toBe('0');
  });

  it('handles unicode characters', () => {
    const hash = generateHash('hello-world-');
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });

  it('handles very long strings', () => {
    const longString = 'a'.repeat(10000);
    const hash = generateHash(longString);
    expect(hash).toBeTruthy();
    expect(hash.length).toBeLessThanOrEqual(8);
  });
});

describe('cx()', () => {
  it('combines string class names', () => {
    const result = cx('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('filters out falsy values', () => {
    const result = cx('active', false, 'visible', null, undefined, '');
    expect(result).toBe('active visible');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cx(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    );
    expect(result).toBe('base active');
  });

  it('handles object syntax', () => {
    const result = cx({
      active: true,
      disabled: false,
      visible: true,
    });
    expect(result).toBe('active visible');
  });

  it('handles mixed arguments', () => {
    const result = cx(
      'base',
      { active: true, disabled: false },
      'extra',
      null
    );
    expect(result).toBe('base active extra');
  });

  it('returns empty string for no arguments', () => {
    const result = cx();
    expect(result).toBe('');
  });

  it('returns empty string for all falsy values', () => {
    const result = cx(false, null, undefined, '');
    expect(result).toBe('');
  });

  it('handles nested object with empty values', () => {
    const result = cx({
      '': false,
      'valid-class': true,
    });
    expect(result).toBe('valid-class');
  });
});

describe('clsx() and classNames()', () => {
  it('clsx is an alias for cx', () => {
    expect(clsx).toBe(cx);
  });

  it('classNames is an alias for cx', () => {
    expect(classNames).toBe(cx);
  });

  it('all aliases produce same result', () => {
    const args = ['base', { active: true }] as const;
    expect(cx(...args)).toBe(clsx(...args));
    expect(cx(...args)).toBe(classNames(...args));
  });
});

describe('mergeStyles()', () => {
  it('merges multiple style objects', () => {
    const style1: CSSProperties = { color: 'red', padding: '10px' };
    const style2: CSSProperties = { backgroundColor: 'blue' };
    const result = mergeStyles(style1, style2);
    expect(result).toEqual({
      color: 'red',
      padding: '10px',
      backgroundColor: 'blue',
    });
  });

  it('later styles override earlier ones', () => {
    const style1: CSSProperties = { color: 'red', padding: '10px' };
    const style2: CSSProperties = { color: 'blue' };
    const result = mergeStyles(style1, style2);
    expect(result.color).toBe('blue');
    expect(result.padding).toBe('10px');
  });

  it('handles null and undefined values', () => {
    const style1: CSSProperties = { color: 'red' };
    const result = mergeStyles(style1, null, undefined);
    expect(result).toEqual({ color: 'red' });
  });

  it('returns empty object for no arguments', () => {
    const result = mergeStyles();
    expect(result).toEqual({});
  });

  it('returns empty object for all null/undefined', () => {
    const result = mergeStyles(null, undefined, null);
    expect(result).toEqual({});
  });

  it('handles CSS custom properties', () => {
    const style1: CSSProperties = { '--primary': '#ff0000' };
    const style2: CSSProperties = { '--secondary': '#00ff00' };
    const result = mergeStyles(style1, style2);
    expect(result).toEqual({
      '--primary': '#ff0000',
      '--secondary': '#00ff00',
    });
  });
});

describe('cssPropertyToString()', () => {
  it('converts camelCase to kebab-case', () => {
    expect(cssPropertyToString('backgroundColor', 'red')).toBe('background-color: red;');
    expect(cssPropertyToString('fontSize', '16px')).toBe('font-size: 16px;');
    expect(cssPropertyToString('marginTop', '10px')).toBe('margin-top: 10px;');
  });

  it('handles single word properties', () => {
    expect(cssPropertyToString('color', 'blue')).toBe('color: blue;');
    expect(cssPropertyToString('padding', '20px')).toBe('padding: 20px;');
  });

  it('handles numeric values', () => {
    expect(cssPropertyToString('zIndex', 100)).toBe('z-index: 100;');
    expect(cssPropertyToString('opacity', 0.5)).toBe('opacity: 0.5;');
  });

  it('handles vendor prefixes', () => {
    // Note: The function converts camelCase where uppercase letters are preceded by lowercase
    // 'webkitTransform' becomes 'webkit-transform' (no leading dash because 'w' is lowercase)
    expect(cssPropertyToString('webkitTransform', 'rotate(45deg)')).toBe('webkit-transform: rotate(45deg);');
  });
});

describe('Style injection and management', () => {
  beforeEach(() => {
    clearAllStyles();
  });

  describe('injectStyles()', () => {
    it('injects CSS into the document head', () => {
      injectStyles('.test { color: red; }', 'test-id');

      const style = document.querySelector('[data-philjs="test-id"]');
      expect(style).toBeTruthy();
      expect(style?.textContent).toBe('.test { color: red; }');
    });

    it('does not inject duplicate styles with same id', () => {
      injectStyles('.test { color: red; }', 'dup-id');
      injectStyles('.test { color: blue; }', 'dup-id');

      const styles = document.querySelectorAll('[data-philjs="dup-id"]');
      expect(styles.length).toBe(1);
      expect(styles[0]?.textContent).toBe('.test { color: red; }');
    });

    it('injects multiple styles with different ids', () => {
      injectStyles('.a { color: red; }', 'id-1');
      injectStyles('.b { color: blue; }', 'id-2');

      expect(document.querySelector('[data-philjs="id-1"]')).toBeTruthy();
      expect(document.querySelector('[data-philjs="id-2"]')).toBeTruthy();
    });
  });

  describe('removeStyles()', () => {
    it('removes injected styles by id', () => {
      injectStyles('.test { color: red; }', 'remove-test');
      expect(document.querySelector('[data-philjs="remove-test"]')).toBeTruthy();

      removeStyles('remove-test');
      expect(document.querySelector('[data-philjs="remove-test"]')).toBeFalsy();
    });

    it('handles removing non-existent styles gracefully', () => {
      expect(() => removeStyles('non-existent')).not.toThrow();
    });
  });

  describe('getInjectedStyles()', () => {
    it('returns array of injected style ids', () => {
      injectStyles('.a { }', 'style-a');
      injectStyles('.b { }', 'style-b');

      const ids = getInjectedStyles();
      expect(ids).toContain('style-a');
      expect(ids).toContain('style-b');
    });

    it('returns empty array when no styles injected', () => {
      const ids = getInjectedStyles();
      expect(ids).toEqual([]);
    });
  });

  describe('clearAllStyles()', () => {
    it('removes all injected styles', () => {
      injectStyles('.a { }', 'clear-a');
      injectStyles('.b { }', 'clear-b');
      injectStyles('.c { }', 'clear-c');

      clearAllStyles();

      expect(document.querySelector('[data-philjs="clear-a"]')).toBeFalsy();
      expect(document.querySelector('[data-philjs="clear-b"]')).toBeFalsy();
      expect(document.querySelector('[data-philjs="clear-c"]')).toBeFalsy();
      expect(getInjectedStyles()).toEqual([]);
    });
  });
});

describe('media()', () => {
  it('creates media query wrapper', () => {
    const styles = media('768px', { display: 'flex' });
    expect(styles).toEqual({
      '@media (min-width: 768px)': { display: 'flex' },
    });
  });

  it('handles complex styles', () => {
    const styles = media('1024px', {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
    });
    expect(styles['@media (min-width: 1024px)']).toEqual({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
    });
  });
});

describe('responsive()', () => {
  it('creates responsive styles with breakpoints', () => {
    const styles = responsive({
      base: { padding: '10px' },
      md: { padding: '20px' },
      lg: { padding: '30px' },
    });

    expect(styles.padding).toBe('10px');
    expect(styles['@media (min-width: 768px)']).toEqual({ padding: '20px' });
    expect(styles['@media (min-width: 1024px)']).toEqual({ padding: '30px' });
  });

  it('handles all breakpoints', () => {
    const styles = responsive({
      base: { display: 'block' },
      sm: { display: 'flex' },
      md: { display: 'grid' },
      lg: { display: 'inline' },
      xl: { display: 'contents' },
      '2xl': { display: 'none' },
    });

    expect(styles['@media (min-width: 640px)']).toEqual({ display: 'flex' });
    expect(styles['@media (min-width: 768px)']).toEqual({ display: 'grid' });
    expect(styles['@media (min-width: 1024px)']).toEqual({ display: 'inline' });
    expect(styles['@media (min-width: 1280px)']).toEqual({ display: 'contents' });
    expect(styles['@media (min-width: 1536px)']).toEqual({ display: 'none' });
  });

  it('works without base styles', () => {
    const styles = responsive({
      md: { padding: '20px' },
    });

    expect(styles['@media (min-width: 768px)']).toEqual({ padding: '20px' });
  });
});

describe('cssVar()', () => {
  it('creates CSS variable reference', () => {
    expect(cssVar('primary')).toBe('var(--primary)');
    expect(cssVar('spacing-md')).toBe('var(--spacing-md)');
  });

  it('includes fallback value when provided', () => {
    expect(cssVar('primary', '#ff0000')).toBe('var(--primary, #ff0000)');
    expect(cssVar('font-size', '16px')).toBe('var(--font-size, 16px)');
  });

  it('handles complex fallback values', () => {
    expect(cssVar('shadow', '0 2px 4px rgba(0,0,0,0.1)')).toBe('var(--shadow, 0 2px 4px rgba(0,0,0,0.1))');
  });
});

describe('Pseudo-class helpers', () => {
  describe('hover()', () => {
    it('creates hover pseudo-class styles', () => {
      const styles = hover({ backgroundColor: 'blue' });
      expect(styles).toEqual({
        '&:hover': { backgroundColor: 'blue' },
      });
    });

    it('handles multiple properties', () => {
      const styles = hover({
        backgroundColor: 'blue',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      });
      expect(styles['&:hover']).toEqual({
        backgroundColor: 'blue',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      });
    });
  });

  describe('focus()', () => {
    it('creates focus pseudo-class styles', () => {
      const styles = focus({ outline: '2px solid blue' });
      expect(styles).toEqual({
        '&:focus': { outline: '2px solid blue' },
      });
    });
  });

  describe('active()', () => {
    it('creates active pseudo-class styles', () => {
      const styles = active({ transform: 'scale(0.98)' });
      expect(styles).toEqual({
        '&:active': { transform: 'scale(0.98)' },
      });
    });
  });

  describe('disabled()', () => {
    it('creates disabled pseudo-class styles', () => {
      const styles = disabled({
        opacity: 0.5,
        cursor: 'not-allowed',
      });
      expect(styles).toEqual({
        '&:disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      });
    });
  });
});

describe('Edge cases', () => {
  it('generateHash handles special characters', () => {
    const hash1 = generateHash('!@#$%^&*()');
    const hash2 = generateHash('class-name_with-special.chars');
    expect(hash1).toBeTruthy();
    expect(hash2).toBeTruthy();
  });

  it('cx handles deeply nested conditions', () => {
    const condition = true;
    const result = cx(
      'base',
      condition && (condition ? 'nested-true' : 'nested-false'),
      !condition && 'never'
    );
    expect(result).toBe('base nested-true');
  });

  it('mergeStyles handles objects with numeric keys', () => {
    const style: CSSProperties = { zIndex: 100 };
    const result = mergeStyles(style, { zIndex: 200 });
    expect(result.zIndex).toBe(200);
  });

  it('handles media queries with em units', () => {
    const styles = media('48em', { fontSize: '18px' });
    expect(styles['@media (min-width: 48em)']).toEqual({ fontSize: '18px' });
  });
});
