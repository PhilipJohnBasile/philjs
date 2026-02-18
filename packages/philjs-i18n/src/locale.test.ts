/**
 * Tests for PhilJS i18n Locale Detection and Management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseLocale,
  normalizeLocale,
  isValidLocale,
  getLanguage,
  getRegion,
  matchLocale,
  negotiateLocales,
} from './locale';

describe('Locale Parsing', () => {
  describe('parseLocale', () => {
    it('should parse simple language codes', () => {
      const parsed = parseLocale('en');
      expect(parsed.language).toBe('en');
      expect(parsed.baseName).toBe('en');
    });

    it('should parse language-region codes', () => {
      const parsed = parseLocale('en-US');
      expect(parsed.language).toBe('en');
      expect(parsed.region).toBe('US');
      expect(parsed.baseName).toBe('en-US');
    });

    it('should parse language-script-region codes', () => {
      const parsed = parseLocale('zh-Hans-CN');
      expect(parsed.language).toBe('zh');
      expect(parsed.script).toBe('Hans');
      expect(parsed.region).toBe('CN');
    });
  });

  describe('normalizeLocale', () => {
    it('should normalize locale strings', () => {
      expect(normalizeLocale('EN-us')).toBe('en-US');
      expect(normalizeLocale('en_US')).toBe('en-US');
    });

    it('should return original for invalid locales', () => {
      expect(normalizeLocale('invalid')).toBe('invalid');
    });
  });

  describe('isValidLocale', () => {
    it('should return true for valid locales', () => {
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('en-US')).toBe(true);
      expect(isValidLocale('zh-Hans-CN')).toBe(true);
    });

    it('should return false for invalid locales', () => {
      expect(isValidLocale('')).toBe(false);
      expect(isValidLocale('not-a-locale-at-all')).toBe(false);
    });
  });

  describe('getLanguage', () => {
    it('should extract language code', () => {
      expect(getLanguage('en-US')).toBe('en');
      expect(getLanguage('zh-Hans-CN')).toBe('zh');
      expect(getLanguage('fr')).toBe('fr');
    });
  });

  describe('getRegion', () => {
    it('should extract region code', () => {
      expect(getRegion('en-US')).toBe('US');
      expect(getRegion('de-DE')).toBe('DE');
    });

    it('should return undefined for language-only codes', () => {
      expect(getRegion('en')).toBeUndefined();
    });
  });
});

describe('Locale Matching', () => {
  const availableLocales = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'ja-JP'];

  describe('matchLocale', () => {
    it('should match exact locales', () => {
      expect(matchLocale('en-US', availableLocales)).toBe('en-US');
      expect(matchLocale('fr-FR', availableLocales)).toBe('fr-FR');
    });

    it('should match by language when exact not available', () => {
      expect(matchLocale('en-AU', availableLocales)).toBe('en-US');
      expect(matchLocale('fr-CA', availableLocales)).toBe('fr-FR');
    });

    it('should return undefined when no match found', () => {
      expect(matchLocale('ko-KR', availableLocales)).toBeUndefined();
    });

    it('should accept array of requested locales', () => {
      expect(matchLocale(['ko-KR', 'ja-JP'], availableLocales)).toBe('ja-JP');
    });

    it('should return fallback when no match', () => {
      expect(matchLocale('ko-KR', availableLocales, 'en-US')).toBe('en-US');
    });
  });

  describe('negotiateLocales', () => {
    it('should return ordered list of matched locales', () => {
      const result = negotiateLocales(
        ['fr-CA', 'en-US'],
        availableLocales,
        'en-US'
      );
      expect(result[0]).toBe('fr-FR');
      expect(result).toContain('en-US');
    });

    it('should include default locale', () => {
      const result = negotiateLocales(['ja-JP'], availableLocales, 'en-US');
      expect(result).toContain('ja-JP');
      expect(result).toContain('en-US');
    });

    it('should not duplicate locales', () => {
      const result = negotiateLocales(
        ['en-US', 'en-US'],
        availableLocales,
        'en-US'
      );
      expect(result.filter((l) => l === 'en-US').length).toBe(1);
    });
  });
});

describe('Browser Locale Detection', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        languages: ['fr-FR', 'en-US'],
        language: 'fr-FR',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  // Note: These tests would need jsdom or similar to properly test
  // browser detection functions. Here we test the non-browser logic.
});

describe('Locale Manager', () => {
  // Mock @philjs/core signal
  vi.mock('@philjs/core', () => ({
    signal: (initialValue: any) => {
      let value = initialValue;
      const sig = () => value;
      sig.set = (newValue: any) => {
        value = newValue;
      };
      return sig;
    },
  }));

  // Note: Full createLocaleManager tests would require DOM mocks
  // for localStorage, document, etc.
});
