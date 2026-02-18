/**
 * Right-to-Left (RTL) Language Support
 *
 * Utilities for handling RTL languages like Arabic, Hebrew, Persian
 */

// ============================================================================
// RTL Language Detection
// ============================================================================

/**
 * Languages that are written right-to-left
 */
export const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'arc', // Aramaic
  'az-Arab', // Azerbaijani (Arabic script)
  'dv', // Divehi/Maldivian
  'fa', // Persian/Farsi
  'ha-Arab', // Hausa (Arabic script)
  'he', // Hebrew
  'iw', // Hebrew (old code)
  'khw', // Khowar
  'ks', // Kashmiri
  'ku-Arab', // Kurdish (Arabic script)
  'ms-Arab', // Malay (Arabic script)
  'pa-Arab', // Punjabi (Arabic script)
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'uz-Arab', // Uzbek (Arabic script)
  'yi', // Yiddish
]);

/**
 * Check if a language is RTL
 */
export function isRtlLanguage(locale: string): boolean {
  // Extract language code
  const language = locale.split('-')[0]?.toLowerCase();
  if (!language) return false;

  // Check direct match
  if (RTL_LANGUAGES.has(language)) return true;

  // Check with script suffix
  if (RTL_LANGUAGES.has(locale)) return true;

  // Use Intl.Locale if available for script detection
  try {
    const intlLocale = new Intl.Locale(locale);
    // Arabic script is RTL
    if (intlLocale.script === 'Arab' || intlLocale.script === 'Hebr') {
      return true;
    }
    // Check maximize() to get implicit script
    const maximized = intlLocale.maximize();
    if (maximized.script === 'Arab' || maximized.script === 'Hebr') {
      return true;
    }
  } catch {
    // Fallback to simple check
  }

  return false;
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRtlLanguage(locale) ? 'rtl' : 'ltr';
}

// ============================================================================
// DOM Direction Management
// ============================================================================

/**
 * Set document direction based on locale
 */
export function setDocumentDirection(locale: string): void {
  if (typeof document === 'undefined') return;

  const dir = getTextDirection(locale);
  document.documentElement.dir = dir;
  document.documentElement.setAttribute('dir', dir);
}

/**
 * Set direction on a specific element
 */
export function setElementDirection(
  element: HTMLElement,
  locale: string
): void {
  element.dir = getTextDirection(locale);
}

/**
 * Create direction-aware style values
 */
export interface DirectionalValues<T> {
  ltr: T;
  rtl: T;
}

/**
 * Get direction-specific value
 */
export function getDirectionalValue<T>(
  values: DirectionalValues<T>,
  locale: string
): T {
  return isRtlLanguage(locale) ? values.rtl : values.ltr;
}

// ============================================================================
// Logical CSS Property Mapping
// ============================================================================

/**
 * Maps physical CSS properties to their logical equivalents
 */
export const physicalToLogical: Record<string, string> = {
  // Margin
  'margin-left': 'margin-inline-start',
  'margin-right': 'margin-inline-end',
  'margin-top': 'margin-block-start',
  'margin-bottom': 'margin-block-end',

  // Padding
  'padding-left': 'padding-inline-start',
  'padding-right': 'padding-inline-end',
  'padding-top': 'padding-block-start',
  'padding-bottom': 'padding-block-end',

  // Border
  'border-left': 'border-inline-start',
  'border-right': 'border-inline-end',
  'border-top': 'border-block-start',
  'border-bottom': 'border-block-end',

  // Border radius
  'border-top-left-radius': 'border-start-start-radius',
  'border-top-right-radius': 'border-start-end-radius',
  'border-bottom-left-radius': 'border-end-start-radius',
  'border-bottom-right-radius': 'border-end-end-radius',

  // Position
  left: 'inset-inline-start',
  right: 'inset-inline-end',
  top: 'inset-block-start',
  bottom: 'inset-block-end',

  // Size
  width: 'inline-size',
  height: 'block-size',
  'min-width': 'min-inline-size',
  'min-height': 'min-block-size',
  'max-width': 'max-inline-size',
  'max-height': 'max-block-size',
};

/**
 * Convert physical CSS property to logical
 */
export function toLogicalProperty(physicalProperty: string): string {
  return physicalToLogical[physicalProperty] || physicalProperty;
}

/**
 * Flip physical CSS property for RTL
 */
export function flipProperty(property: string): string {
  const flips: Record<string, string> = {
    left: 'right',
    right: 'left',
    'margin-left': 'margin-right',
    'margin-right': 'margin-left',
    'padding-left': 'padding-right',
    'padding-right': 'padding-left',
    'border-left': 'border-right',
    'border-right': 'border-left',
    'border-top-left-radius': 'border-top-right-radius',
    'border-top-right-radius': 'border-top-left-radius',
    'border-bottom-left-radius': 'border-bottom-right-radius',
    'border-bottom-right-radius': 'border-bottom-left-radius',
    float: 'float', // value flip, not property
    clear: 'clear', // value flip, not property
    'text-align': 'text-align', // value flip, not property
  };

  return flips[property] || property;
}

/**
 * Flip CSS value for RTL
 */
export function flipValue(property: string, value: string): string {
  // Flip directional values
  const directionalValues: Record<string, string> = {
    left: 'right',
    right: 'left',
    ltr: 'rtl',
    rtl: 'ltr',
  };

  if (['float', 'clear', 'text-align'].includes(property)) {
    return directionalValues[value] || value;
  }

  // Flip background position
  if (property === 'background-position' || property === 'transform-origin') {
    return value.replace(/\bleft\b/g, '__RIGHT__')
      .replace(/\bright\b/g, 'left')
      .replace(/__RIGHT__/g, 'right');
  }

  // Flip translate
  if (value.includes('translateX')) {
    return value.replace(/translateX\(([^)]+)\)/, (_, v) => {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        return `translateX(${-num}${v.replace(String(num), '')})`;
      }
      return `translateX(calc(-1 * ${v}))`;
    });
  }

  return value;
}

// ============================================================================
// Bidirectional Text Handling
// ============================================================================

/**
 * Unicode directional characters
 */
export const BIDI_CHARS = {
  LRM: '\u200E', // Left-to-Right Mark
  RLM: '\u200F', // Right-to-Left Mark
  LRE: '\u202A', // Left-to-Right Embedding
  RLE: '\u202B', // Right-to-Left Embedding
  PDF: '\u202C', // Pop Directional Formatting
  LRO: '\u202D', // Left-to-Right Override
  RLO: '\u202E', // Right-to-Left Override
  LRI: '\u2066', // Left-to-Right Isolate
  RLI: '\u2067', // Right-to-Left Isolate
  FSI: '\u2068', // First Strong Isolate
  PDI: '\u2069', // Pop Directional Isolate
} as const;

/**
 * Wrap text in directional isolate
 */
export function wrapInIsolate(
  text: string,
  direction: 'ltr' | 'rtl' | 'auto' = 'auto'
): string {
  const start =
    direction === 'ltr'
      ? BIDI_CHARS.LRI
      : direction === 'rtl'
      ? BIDI_CHARS.RLI
      : BIDI_CHARS.FSI;

  return `${start}${text}${BIDI_CHARS.PDI}`;
}

/**
 * Add directional mark after text (useful for punctuation)
 */
export function addDirectionalMark(
  text: string,
  direction: 'ltr' | 'rtl'
): string {
  const mark = direction === 'ltr' ? BIDI_CHARS.LRM : BIDI_CHARS.RLM;
  return `${text}${mark}`;
}

/**
 * Strip bidirectional control characters
 */
export function stripBidiChars(text: string): string {
  const bidiPattern = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
  return text.replace(bidiPattern, '');
}

/**
 * Detect primary text direction from content
 */
export function detectTextDirection(text: string): 'ltr' | 'rtl' | 'neutral' {
  // RTL Unicode ranges
  const rtlPattern = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  // LTR Unicode ranges (Latin, Greek, Cyrillic, etc.)
  const ltrPattern = /[A-Za-z\u00C0-\u00FF\u0100-\u017F\u0370-\u03FF\u0400-\u04FF]/;

  // Find first strong directional character
  for (const char of text) {
    if (rtlPattern.test(char)) return 'rtl';
    if (ltrPattern.test(char)) return 'ltr';
  }

  return 'neutral';
}

// ============================================================================
// Mirror Characters
// ============================================================================

/**
 * Characters that should be mirrored in RTL context
 */
export const mirrorChars: Record<string, string> = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
  '«': '»',
  '»': '«',
  '‹': '›',
  '›': '‹',
  '⟨': '⟩',
  '⟩': '⟨',
  '〈': '〉',
  '〉': '〈',
};

/**
 * Mirror bracket characters for RTL
 */
export function mirrorBrackets(text: string): string {
  return text
    .split('')
    .map((char) => mirrorChars[char] || char)
    .join('');
}

// ============================================================================
// RTL-Aware Utilities
// ============================================================================

export interface RtlConfig {
  locale: string;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
}

/**
 * Create RTL configuration from locale
 */
export function createRtlConfig(locale: string): RtlConfig {
  const isRtl = isRtlLanguage(locale);
  return {
    locale,
    isRtl,
    dir: isRtl ? 'rtl' : 'ltr',
  };
}

/**
 * RTL-aware start/end mapping
 */
export function getStartEnd(
  isRtl: boolean
): { start: 'left' | 'right'; end: 'left' | 'right' } {
  return isRtl
    ? { start: 'right', end: 'left' }
    : { start: 'left', end: 'right' };
}

/**
 * Get physical direction from logical direction
 */
export function logicalToPhysical(
  logical: 'start' | 'end',
  isRtl: boolean
): 'left' | 'right' {
  if (logical === 'start') {
    return isRtl ? 'right' : 'left';
  }
  return isRtl ? 'left' : 'right';
}
