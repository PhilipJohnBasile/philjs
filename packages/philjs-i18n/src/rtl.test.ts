/**
 * Tests for PhilJS i18n RTL (Right-to-Left) Language Support
 */

import { describe, it, expect } from 'vitest';
import {
  isRtlLanguage,
  getTextDirection,
  RTL_LANGUAGES,
  physicalToLogical,
  toLogicalProperty,
  flipProperty,
  flipValue,
  BIDI_CHARS,
  wrapInIsolate,
  addDirectionalMark,
  stripBidiChars,
  detectTextDirection,
  mirrorChars,
  mirrorBrackets,
  createRtlConfig,
  getStartEnd,
  logicalToPhysical,
} from './rtl';

describe('RTL Language Detection', () => {
  describe('RTL_LANGUAGES', () => {
    it('should include common RTL languages', () => {
      expect(RTL_LANGUAGES.has('ar')).toBe(true); // Arabic
      expect(RTL_LANGUAGES.has('he')).toBe(true); // Hebrew
      expect(RTL_LANGUAGES.has('fa')).toBe(true); // Persian/Farsi
      expect(RTL_LANGUAGES.has('ur')).toBe(true); // Urdu
    });

    it('should not include LTR languages', () => {
      expect(RTL_LANGUAGES.has('en')).toBe(false);
      expect(RTL_LANGUAGES.has('fr')).toBe(false);
      expect(RTL_LANGUAGES.has('zh')).toBe(false);
    });
  });

  describe('isRtlLanguage', () => {
    it('should return true for RTL languages', () => {
      expect(isRtlLanguage('ar')).toBe(true);
      expect(isRtlLanguage('ar-SA')).toBe(true);
      expect(isRtlLanguage('he')).toBe(true);
      expect(isRtlLanguage('he-IL')).toBe(true);
      expect(isRtlLanguage('fa')).toBe(true);
      expect(isRtlLanguage('ur')).toBe(true);
    });

    it('should return false for LTR languages', () => {
      expect(isRtlLanguage('en')).toBe(false);
      expect(isRtlLanguage('en-US')).toBe(false);
      expect(isRtlLanguage('fr-FR')).toBe(false);
      expect(isRtlLanguage('de-DE')).toBe(false);
      expect(isRtlLanguage('zh-CN')).toBe(false);
      expect(isRtlLanguage('ja-JP')).toBe(false);
    });
  });

  describe('getTextDirection', () => {
    it('should return rtl for RTL languages', () => {
      expect(getTextDirection('ar')).toBe('rtl');
      expect(getTextDirection('he')).toBe('rtl');
    });

    it('should return ltr for LTR languages', () => {
      expect(getTextDirection('en')).toBe('ltr');
      expect(getTextDirection('fr')).toBe('ltr');
    });
  });
});

describe('CSS Property Mapping', () => {
  describe('physicalToLogical', () => {
    it('should map physical margin properties', () => {
      expect(physicalToLogical['margin-left']).toBe('margin-inline-start');
      expect(physicalToLogical['margin-right']).toBe('margin-inline-end');
    });

    it('should map physical padding properties', () => {
      expect(physicalToLogical['padding-left']).toBe('padding-inline-start');
      expect(physicalToLogical['padding-right']).toBe('padding-inline-end');
    });

    it('should map position properties', () => {
      expect(physicalToLogical['left']).toBe('inset-inline-start');
      expect(physicalToLogical['right']).toBe('inset-inline-end');
    });

    it('should map size properties', () => {
      expect(physicalToLogical['width']).toBe('inline-size');
      expect(physicalToLogical['height']).toBe('block-size');
    });
  });

  describe('toLogicalProperty', () => {
    it('should convert physical to logical properties', () => {
      expect(toLogicalProperty('margin-left')).toBe('margin-inline-start');
      expect(toLogicalProperty('padding-right')).toBe('padding-inline-end');
    });

    it('should return unchanged if no mapping exists', () => {
      expect(toLogicalProperty('color')).toBe('color');
      expect(toLogicalProperty('display')).toBe('display');
    });
  });

  describe('flipProperty', () => {
    it('should flip left/right properties', () => {
      expect(flipProperty('left')).toBe('right');
      expect(flipProperty('right')).toBe('left');
      expect(flipProperty('margin-left')).toBe('margin-right');
      expect(flipProperty('margin-right')).toBe('margin-left');
    });

    it('should flip border radius properties', () => {
      expect(flipProperty('border-top-left-radius')).toBe('border-top-right-radius');
      expect(flipProperty('border-bottom-right-radius')).toBe('border-bottom-left-radius');
    });
  });

  describe('flipValue', () => {
    it('should flip directional values for float/clear/text-align', () => {
      expect(flipValue('float', 'left')).toBe('right');
      expect(flipValue('float', 'right')).toBe('left');
      expect(flipValue('text-align', 'left')).toBe('right');
    });

    it('should not flip non-directional values', () => {
      expect(flipValue('float', 'none')).toBe('none');
      expect(flipValue('display', 'block')).toBe('block');
    });
  });
});

describe('Bidirectional Text', () => {
  describe('BIDI_CHARS', () => {
    it('should contain Unicode directional characters', () => {
      expect(BIDI_CHARS.LRM).toBe('\u200E');
      expect(BIDI_CHARS.RLM).toBe('\u200F');
      expect(BIDI_CHARS.LRI).toBe('\u2066');
      expect(BIDI_CHARS.RLI).toBe('\u2067');
      expect(BIDI_CHARS.PDI).toBe('\u2069');
    });
  });

  describe('wrapInIsolate', () => {
    it('should wrap text in LTR isolate', () => {
      const result = wrapInIsolate('Hello', 'ltr');
      expect(result.startsWith(BIDI_CHARS.LRI)).toBe(true);
      expect(result.endsWith(BIDI_CHARS.PDI)).toBe(true);
      expect(result).toContain('Hello');
    });

    it('should wrap text in RTL isolate', () => {
      const result = wrapInIsolate('مرحبا', 'rtl');
      expect(result.startsWith(BIDI_CHARS.RLI)).toBe(true);
      expect(result.endsWith(BIDI_CHARS.PDI)).toBe(true);
    });

    it('should use FSI for auto direction', () => {
      const result = wrapInIsolate('Test', 'auto');
      expect(result.startsWith(BIDI_CHARS.FSI)).toBe(true);
    });
  });

  describe('addDirectionalMark', () => {
    it('should add LRM for LTR', () => {
      const result = addDirectionalMark('Hello', 'ltr');
      expect(result).toBe('Hello' + BIDI_CHARS.LRM);
    });

    it('should add RLM for RTL', () => {
      const result = addDirectionalMark('مرحبا', 'rtl');
      expect(result).toBe('مرحبا' + BIDI_CHARS.RLM);
    });
  });

  describe('stripBidiChars', () => {
    it('should remove bidirectional control characters', () => {
      const textWithBidi = `${BIDI_CHARS.LRI}Hello${BIDI_CHARS.PDI}`;
      expect(stripBidiChars(textWithBidi)).toBe('Hello');
    });

    it('should leave normal text unchanged', () => {
      expect(stripBidiChars('Hello World')).toBe('Hello World');
    });
  });

  describe('detectTextDirection', () => {
    it('should detect LTR text', () => {
      expect(detectTextDirection('Hello World')).toBe('ltr');
      expect(detectTextDirection('123 Test')).toBe('ltr');
    });

    it('should detect RTL text', () => {
      expect(detectTextDirection('مرحبا')).toBe('rtl');
      expect(detectTextDirection('שלום')).toBe('rtl');
    });

    it('should return neutral for numbers/symbols only', () => {
      expect(detectTextDirection('123')).toBe('neutral');
      expect(detectTextDirection('...')).toBe('neutral');
    });
  });
});

describe('Mirror Characters', () => {
  describe('mirrorChars', () => {
    it('should contain bracket pairs', () => {
      expect(mirrorChars['(']).toBe(')');
      expect(mirrorChars[')']).toBe('(');
      expect(mirrorChars['[']).toBe(']');
      expect(mirrorChars[']']).toBe('[');
      expect(mirrorChars['{']).toBe('}');
      expect(mirrorChars['}']).toBe('{');
    });

    it('should contain angle brackets', () => {
      expect(mirrorChars['<']).toBe('>');
      expect(mirrorChars['>']).toBe('<');
    });

    it('should contain guillemets', () => {
      expect(mirrorChars['«']).toBe('»');
      expect(mirrorChars['»']).toBe('«');
    });
  });

  describe('mirrorBrackets', () => {
    it('should mirror all brackets in text', () => {
      expect(mirrorBrackets('(hello)')).toBe(')hello(');
      expect(mirrorBrackets('[test]')).toBe(']test[');
      expect(mirrorBrackets('{code}')).toBe('}code{');
    });

    it('should handle mixed text', () => {
      expect(mirrorBrackets('func(x)')).toBe('func)x(');
    });

    it('should leave non-bracket text unchanged', () => {
      expect(mirrorBrackets('hello')).toBe('hello');
    });
  });
});

describe('RTL Utilities', () => {
  describe('createRtlConfig', () => {
    it('should create RTL config for RTL locales', () => {
      const config = createRtlConfig('ar-SA');
      expect(config.locale).toBe('ar-SA');
      expect(config.isRtl).toBe(true);
      expect(config.dir).toBe('rtl');
    });

    it('should create LTR config for LTR locales', () => {
      const config = createRtlConfig('en-US');
      expect(config.locale).toBe('en-US');
      expect(config.isRtl).toBe(false);
      expect(config.dir).toBe('ltr');
    });
  });

  describe('getStartEnd', () => {
    it('should return correct start/end for LTR', () => {
      const { start, end } = getStartEnd(false);
      expect(start).toBe('left');
      expect(end).toBe('right');
    });

    it('should return flipped start/end for RTL', () => {
      const { start, end } = getStartEnd(true);
      expect(start).toBe('right');
      expect(end).toBe('left');
    });
  });

  describe('logicalToPhysical', () => {
    it('should convert start to left in LTR', () => {
      expect(logicalToPhysical('start', false)).toBe('left');
      expect(logicalToPhysical('end', false)).toBe('right');
    });

    it('should convert start to right in RTL', () => {
      expect(logicalToPhysical('start', true)).toBe('right');
      expect(logicalToPhysical('end', true)).toBe('left');
    });
  });
});
