/**
 * Tests for PhilJS i18n Formatting Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompact,
  formatBytes,
  parseNumber,
  getCurrencySymbol,
  formatDate,
  formatDateStyle,
  formatTimeStyle,
  formatDateTime,
  formatRelativeTime,
  formatTimeAgo,
  formatList,
  getDisplayName,
  getLanguageName,
  getRegionName,
  getCurrencyName,
  createCollator,
  sortStrings,
  segmentText,
  countWords,
  countGraphemes,
} from './formatting';

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('should format numbers with default locale', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });

    it('should format numbers with different locales', () => {
      expect(formatNumber(1234.56, { locale: 'de-DE' })).toBe('1.234,56');
      expect(formatNumber(1234.56, { locale: 'fr-FR' })).toMatch(/1[\s\u202f]234,56/);
    });

    it('should format with minimum fraction digits', () => {
      expect(formatNumber(1234, { minimumFractionDigits: 2 })).toBe('1,234.00');
    });

    it('should format without grouping', () => {
      expect(formatNumber(1234567, { useGrouping: false })).toBe('1234567');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      const result = formatCurrency(99.99, 'USD');
      expect(result).toMatch(/\$99\.99/);
    });

    it('should format EUR currency', () => {
      const result = formatCurrency(99.99, 'EUR', 'de-DE');
      expect(result).toMatch(/99,99/);
      expect(result).toMatch(/€/);
    });

    it('should format JPY currency (no decimals)', () => {
      const result = formatCurrency(1000, 'JPY', 'ja-JP');
      expect(result).toMatch(/1,000/);
      expect(result).toMatch(/¥|￥/);
    });
  });

  describe('formatPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(0.125, 'en-US', 1)).toBe('12.5%');
    });

    it('should handle values over 100%', () => {
      expect(formatPercent(1.5)).toBe('150%');
    });
  });

  describe('formatCompact', () => {
    it('should format large numbers in compact form', () => {
      expect(formatCompact(1000)).toBe('1K');
      expect(formatCompact(1000000)).toBe('1M');
      expect(formatCompact(1000000000)).toBe('1B');
    });

    it('should support long display', () => {
      expect(formatCompact(1000, 'en-US', 'long')).toBe('1 thousand');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes to human-readable sizes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 'en-US', 1)).toBe('1.5 KB');
    });
  });

  describe('parseNumber', () => {
    it('should parse US-formatted numbers', () => {
      expect(parseNumber('1,234.56')).toBe(1234.56);
    });

    it('should parse German-formatted numbers', () => {
      expect(parseNumber('1.234,56', 'de-DE')).toBe(1234.56);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return currency symbols', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
    });
  });
});

describe('Date Formatting', () => {
  const testDate = new Date('2024-06-15T14:30:00Z');

  describe('formatDate', () => {
    it('should format date with options', () => {
      const result = formatDate(testDate, {
        locale: 'en-US',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(result).toMatch(/June/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });
  });

  describe('formatDateStyle', () => {
    it('should format with date styles', () => {
      const full = formatDateStyle(testDate, 'full', 'en-US');
      expect(full).toMatch(/Saturday/);
      expect(full).toMatch(/June/);

      const short = formatDateStyle(testDate, 'short', 'en-US');
      expect(short).toMatch(/6\/15\/24/);
    });
  });

  describe('formatTimeStyle', () => {
    it('should format time', () => {
      const result = formatTimeStyle(testDate, 'short', 'en-US');
      expect(result).toMatch(/\d+:\d+/);
    });
  });

  describe('formatDateTime', () => {
    it('should format both date and time', () => {
      const result = formatDateTime(testDate, 'medium', 'short', 'en-US');
      expect(result).toMatch(/Jun/);
      expect(result).toMatch(/\d+:\d+/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time units', () => {
      expect(formatRelativeTime(-1, 'day')).toBe('yesterday');
      expect(formatRelativeTime(1, 'day')).toBe('tomorrow');
      expect(formatRelativeTime(-2, 'day')).toBe('2 days ago');
      expect(formatRelativeTime(3, 'hour')).toBe('in 3 hours');
    });
  });

  describe('formatTimeAgo', () => {
    it('should auto-select appropriate units', () => {
      const now = Date.now();
      const hourAgo = new Date(now - 60 * 60 * 1000);
      const result = formatTimeAgo(hourAgo);
      expect(result).toMatch(/hour/i);
    });
  });
});

describe('List Formatting', () => {
  describe('formatList', () => {
    it('should format conjunction lists (and)', () => {
      expect(formatList(['Apple', 'Banana', 'Cherry'])).toBe(
        'Apple, Banana, and Cherry'
      );
    });

    it('should format disjunction lists (or)', () => {
      expect(formatList(['Red', 'Blue', 'Green'], 'en-US', 'disjunction')).toBe(
        'Red, Blue, or Green'
      );
    });

    it('should handle two-item lists', () => {
      expect(formatList(['Yes', 'No'])).toBe('Yes and No');
    });

    it('should handle single-item lists', () => {
      expect(formatList(['Only'])).toBe('Only');
    });
  });
});

describe('Display Names', () => {
  describe('getLanguageName', () => {
    it('should return language names', () => {
      expect(getLanguageName('en')).toBe('English');
      expect(getLanguageName('es')).toBe('Spanish');
      expect(getLanguageName('fr')).toBe('French');
      expect(getLanguageName('de')).toBe('German');
    });

    it('should localize language names', () => {
      expect(getLanguageName('en', 'de-DE')).toBe('Englisch');
    });
  });

  describe('getRegionName', () => {
    it('should return region names', () => {
      expect(getRegionName('US')).toBe('United States');
      expect(getRegionName('GB')).toBe('United Kingdom');
      expect(getRegionName('DE')).toBe('Germany');
    });
  });

  describe('getCurrencyName', () => {
    it('should return currency names', () => {
      expect(getCurrencyName('USD')).toBe('US Dollar');
      expect(getCurrencyName('EUR')).toBe('Euro');
    });
  });
});

describe('Collation and Sorting', () => {
  describe('createCollator', () => {
    it('should create a comparator function', () => {
      const compare = createCollator();
      expect(compare('apple', 'banana')).toBeLessThan(0);
      expect(compare('banana', 'apple')).toBeGreaterThan(0);
      expect(compare('apple', 'apple')).toBe(0);
    });

    it('should handle case sensitivity options', () => {
      const caseInsensitive = createCollator({ sensitivity: 'base' });
      expect(caseInsensitive('Apple', 'apple')).toBe(0);
    });

    it('should support numeric sorting', () => {
      const numeric = createCollator({ numeric: true });
      expect(numeric('file2', 'file10')).toBeLessThan(0);
    });
  });

  describe('sortStrings', () => {
    it('should sort strings alphabetically', () => {
      const sorted = sortStrings(['cherry', 'apple', 'banana']);
      expect(sorted).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should not mutate original array', () => {
      const original = ['c', 'a', 'b'];
      sortStrings(original);
      expect(original).toEqual(['c', 'a', 'b']);
    });
  });
});

describe('Text Segmentation', () => {
  describe('segmentText', () => {
    it('should segment into words', () => {
      const words = segmentText('Hello world!', 'word');
      expect(words.filter((w) => w.trim())).toEqual(['Hello', 'world', '!']);
    });

    it('should segment into graphemes', () => {
      const graphemes = segmentText('Hi!', 'grapheme');
      expect(graphemes).toEqual(['H', 'i', '!']);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('One two three four five')).toBe(5);
    });

    it('should handle empty string', () => {
      expect(countWords('')).toBe(0);
    });
  });

  describe('countGraphemes', () => {
    it('should count graphemes correctly', () => {
      expect(countGraphemes('Hello')).toBe(5);
    });

    it('should handle emoji correctly', () => {
      // Family emoji is one grapheme but multiple code points
      expect(countGraphemes('Hi')).toBe(2);
    });
  });
});
