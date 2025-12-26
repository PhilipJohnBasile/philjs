/**
 * Tests for PhilJS i18n (Internationalization) Package
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n, createPlural, pluralRules, type I18n, type TranslationMap } from './index.js';

// Mock the signal from philjs-core
vi.mock('philjs-core', () => ({
  signal: (initialValue: any) => {
    let value = initialValue;
    const sig = () => value;
    sig.set = (newValue: any) => { value = newValue; };
    return sig;
  },
}));

describe('createI18n', () => {
  let i18n: I18n;

  const translations = {
    en: {
      greeting: 'Hello',
      welcome: 'Welcome, {name}!',
      items: {
        count: 'You have {count} items',
      },
      nested: {
        deep: {
          value: 'Deep nested value',
        },
      },
    },
    es: {
      greeting: 'Hola',
      welcome: 'Bienvenido, {name}!',
      items: {
        count: 'Tienes {count} artículos',
      },
    },
    fr: {
      greeting: 'Bonjour',
      welcome: 'Bienvenue, {name}!',
    },
  };

  beforeEach(() => {
    i18n = createI18n({
      defaultLocale: 'en',
      translations,
      fallbackLocale: 'en',
    });
  });

  describe('initialization', () => {
    it('should create i18n instance with default locale', () => {
      expect(i18n.locale()).toBe('en');
    });

    it('should return available locales', () => {
      const locales = i18n.getAvailableLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('fr');
      expect(locales.length).toBe(3);
    });
  });

  describe('translation function (t)', () => {
    it('should translate simple keys', () => {
      expect(i18n.t('greeting')).toBe('Hello');
    });

    it('should interpolate parameters', () => {
      expect(i18n.t('welcome', { name: 'John' })).toBe('Welcome, John!');
    });

    it('should handle nested keys with dot notation', () => {
      expect(i18n.t('items.count', { count: 5 })).toBe('You have 5 items');
    });

    it('should handle deeply nested keys', () => {
      expect(i18n.t('nested.deep.value')).toBe('Deep nested value');
    });

    it('should return key if translation is missing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should keep placeholder if parameter is not provided', () => {
      expect(i18n.t('welcome', {})).toBe('Welcome, {name}!');
    });
  });

  describe('setLocale', () => {
    it('should change the current locale', () => {
      i18n.setLocale('es');
      expect(i18n.locale()).toBe('es');
      expect(i18n.t('greeting')).toBe('Hola');
    });

    it('should warn when setting non-existent locale', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      i18n.setLocale('de');
      expect(i18n.locale()).toBe('en'); // Should stay unchanged
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('fallback locale', () => {
    it('should fallback to fallback locale for missing translations', () => {
      i18n.setLocale('fr');
      // French doesn't have 'items.count', should fallback to English
      expect(i18n.t('items.count', { count: 3 })).toBe('You have 3 items');
    });

    it('should use current locale translation when available', () => {
      i18n.setLocale('es');
      expect(i18n.t('items.count', { count: 3 })).toBe('Tienes 3 artículos');
    });
  });
});

describe('createPlural', () => {
  it('should create a pluralization function', () => {
    const plural = createPlural(pluralRules);
    expect(typeof plural).toBe('function');
  });

  it('should handle English singular/plural', () => {
    const plural = createPlural(pluralRules);

    expect(plural('en', 1, ['item', 'items'])).toBe('item');
    expect(plural('en', 2, ['item', 'items'])).toBe('items');
    expect(plural('en', 0, ['item', 'items'])).toBe('items');
  });

  it('should handle French singular/plural (0 and 1 are singular)', () => {
    const plural = createPlural(pluralRules);

    expect(plural('fr', 0, ['article', 'articles'])).toBe('article');
    expect(plural('fr', 1, ['article', 'articles'])).toBe('article');
    expect(plural('fr', 2, ['article', 'articles'])).toBe('articles');
  });

  it('should fallback to simple singular/plural for unknown locales', () => {
    const plural = createPlural(pluralRules);

    expect(plural('unknown', 1, ['thing', 'things'])).toBe('thing');
    expect(plural('unknown', 5, ['thing', 'things'])).toBe('things');
  });
});

describe('pluralRules', () => {
  it('should have rules for common languages', () => {
    expect(pluralRules.en).toBeDefined();
    expect(pluralRules.fr).toBeDefined();
    expect(pluralRules.de).toBeDefined();
    expect(pluralRules.es).toBeDefined();
    expect(pluralRules.ru).toBeDefined();
  });

  it('should return correct plural form for English', () => {
    expect(pluralRules.en(1)).toBe('one');
    expect(pluralRules.en(2)).toBe('other');
    expect(pluralRules.en(0)).toBe('other');
  });

  it('should return correct plural form for Russian', () => {
    expect(pluralRules.ru(1)).toBe('one');
    expect(pluralRules.ru(2)).toBe('few');
    expect(pluralRules.ru(5)).toBe('many');
    expect(pluralRules.ru(21)).toBe('one');
    expect(pluralRules.ru(22)).toBe('few');
    expect(pluralRules.ru(25)).toBe('many');
    expect(pluralRules.ru(11)).toBe('many');
  });

  it('should handle Spanish singular/plural', () => {
    expect(pluralRules.es(1)).toBe('one');
    expect(pluralRules.es(0)).toBe('other');
    expect(pluralRules.es(2)).toBe('other');
  });

  it('should handle German singular/plural', () => {
    expect(pluralRules.de(1)).toBe('one');
    expect(pluralRules.de(0)).toBe('other');
    expect(pluralRules.de(2)).toBe('other');
  });
});

describe('i18n with numeric interpolation', () => {
  it('should interpolate numeric values', () => {
    const i18n = createI18n({
      defaultLocale: 'en',
      translations: {
        en: {
          price: 'Price: ${amount}',
          quantity: 'Quantity: {qty}',
        },
      },
    });

    expect(i18n.t('price', { amount: 99.99 })).toBe('Price: $99.99');
    expect(i18n.t('quantity', { qty: 10 })).toBe('Quantity: 10');
  });
});

describe('i18n edge cases', () => {
  it('should handle empty translations object', () => {
    const i18n = createI18n({
      defaultLocale: 'en',
      translations: {
        en: {},
      },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(i18n.t('any.key')).toBe('any.key');
    consoleSpy.mockRestore();
  });

  it('should handle translation that is an object instead of string', () => {
    const i18n = createI18n({
      defaultLocale: 'en',
      translations: {
        en: {
          section: {
            title: 'Title',
            content: 'Content',
          },
        },
      },
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Accessing 'section' should return the key since it's not a string
    expect(i18n.t('section')).toBe('section');
    consoleSpy.mockRestore();
  });
});
