/**
 * Input Masking System
 *
 * Format and mask input values in real-time:
 * - Phone number formatting
 * - Credit card formatting
 * - Currency formatting
 * - Date formatting
 * - Custom mask patterns
 */

// =============================================================================
// Types
// =============================================================================

export interface MaskConfig {
  pattern: string;
  placeholder?: string;
  guide?: boolean;
  keepCharPositions?: boolean;
  showMaskOnFocus?: boolean;
  showMaskOnHover?: boolean;
}

export interface MaskResult {
  maskedValue: string;
  rawValue: string;
  isComplete: boolean;
  isValid: boolean;
}

export type MaskChar = string | RegExp;

export interface MaskDefinition {
  pattern: MaskChar[];
  placeholder: string;
  validator?: (value: string) => boolean;
}

// =============================================================================
// Mask Character Definitions
// =============================================================================

export const maskChars: Record<string, RegExp> = {
  '9': /\d/,           // Digit
  'a': /[a-zA-Z]/,     // Letter
  'A': /[A-Z]/,        // Uppercase letter
  '*': /[a-zA-Z0-9]/,  // Alphanumeric
  '#': /\d/,           // Digit (alias)
};

// =============================================================================
// Core Mask Functions
// =============================================================================

/**
 * Parse a mask pattern string into an array of mask characters
 */
export function parseMaskPattern(pattern: string): MaskChar[] {
  const result: MaskChar[] = [];
  let escaped = false;

  for (const char of pattern) {
    if (escaped) {
      result.push(char);
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char in maskChars) {
      result.push(maskChars[char]!);
    } else {
      result.push(char);
    }
  }

  return result;
}

/**
 * Apply a mask to a value
 */
export function applyMask(value: string, pattern: string | MaskChar[]): MaskResult {
  const maskPattern = typeof pattern === 'string' ? parseMaskPattern(pattern) : pattern;
  let maskedValue = '';
  let rawValue = '';
  let valueIndex = 0;
  let isComplete = true;

  for (let i = 0; i < maskPattern.length; i++) {
    const maskChar = maskPattern[i];

    if (maskChar instanceof RegExp) {
      // Find the next matching character in the value
      while (valueIndex < value.length) {
        const inputChar = value[valueIndex]!;
        valueIndex++;

        if (maskChar.test(inputChar)) {
          maskedValue += inputChar;
          rawValue += inputChar;
          break;
        }
      }

      // If we couldn't find a match, mark as incomplete
      if (maskedValue.length <= i) {
        isComplete = false;
        break;
      }
    } else {
      // Literal character
      maskedValue += maskChar;
      // Skip if the input has this literal
      if (valueIndex < value.length && value[valueIndex] === maskChar) {
        valueIndex++;
      }
    }
  }

  return {
    maskedValue,
    rawValue,
    isComplete,
    isValid: isComplete,
  };
}

/**
 * Remove mask from a value, keeping only raw input
 */
export function unmask(maskedValue: string, pattern: string | MaskChar[]): string {
  const maskPattern = typeof pattern === 'string' ? parseMaskPattern(pattern) : pattern;
  let rawValue = '';
  let maskIndex = 0;

  for (const char of maskedValue) {
    if (maskIndex >= maskPattern.length) break;

    const maskChar = maskPattern[maskIndex];

    if (maskChar instanceof RegExp) {
      if (maskChar.test(char)) {
        rawValue += char;
        maskIndex++;
      }
    } else if (char === maskChar) {
      maskIndex++;
    }
  }

  return rawValue;
}

// =============================================================================
// Predefined Masks
// =============================================================================

/**
 * Phone number mask (US format)
 */
export function phoneMask(value: string, options: {
  format?: 'us' | 'international' | 'simple';
  countryCode?: string;
} = {}): MaskResult {
  const { format = 'us', countryCode = '+1' } = options;
  const digits = value.replace(/\D/g, '');

  let pattern: string;
  let formatted: string;

  switch (format) {
    case 'international':
      pattern = `${countryCode} (999) 999-9999`;
      break;
    case 'simple':
      pattern = '9999999999';
      break;
    case 'us':
    default:
      pattern = '(999) 999-9999';
  }

  if (format === 'us') {
    if (digits.length <= 3) {
      formatted = digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  } else if (format === 'international') {
    if (digits.length <= 3) {
      formatted = digits.length > 0 ? `${countryCode} (${digits}` : countryCode;
    } else if (digits.length <= 6) {
      formatted = `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      formatted = `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  } else {
    formatted = digits.slice(0, 10);
  }

  return {
    maskedValue: formatted,
    rawValue: digits.slice(0, 10),
    isComplete: digits.length >= 10,
    isValid: digits.length === 10,
  };
}

/**
 * Credit card mask
 */
export function creditCardMask(value: string): MaskResult & {
  cardType: string | null;
} {
  const digits = value.replace(/\D/g, '');
  const cardType = detectCardType(digits);

  let formatted: string;
  let maxLength: number;

  // Different card types have different formats
  if (cardType === 'amex') {
    // Amex: 4-6-5 format
    maxLength = 15;
    if (digits.length <= 4) {
      formatted = digits;
    } else if (digits.length <= 10) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10, 15)}`;
    }
  } else {
    // Standard: 4-4-4-4 format
    maxLength = 16;
    const groups = [];
    for (let i = 0; i < digits.length && i < 16; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    formatted = groups.join(' ');
  }

  return {
    maskedValue: formatted,
    rawValue: digits.slice(0, maxLength),
    isComplete: digits.length >= maxLength,
    isValid: digits.length === maxLength && luhnCheck(digits),
    cardType,
  };
}

/**
 * Detect credit card type from number
 */
export function detectCardType(number: string): string | null {
  const patterns: Record<string, RegExp> = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(number)) {
      return type;
    }
  }

  return null;
}

/**
 * Luhn algorithm for credit card validation
 */
export function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Currency mask
 */
export function currencyMask(value: string, options: {
  symbol?: string;
  symbolPosition?: 'prefix' | 'suffix';
  thousandsSeparator?: string;
  decimalSeparator?: string;
  decimalPlaces?: number;
  allowNegative?: boolean;
} = {}): MaskResult {
  const {
    symbol = '$',
    symbolPosition = 'prefix',
    thousandsSeparator = ',',
    decimalSeparator = '.',
    decimalPlaces = 2,
    allowNegative = false,
  } = options;

  // Extract sign
  const isNegative = allowNegative && value.includes('-');

  // Extract digits and decimal
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  let integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  // Format integer part with thousands separator
  integerPart = integerPart.replace(/^0+(?=\d)/, ''); // Remove leading zeros
  if (!integerPart) integerPart = '0';

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // Limit decimal places
  decimalPart = decimalPart.slice(0, decimalPlaces);

  // Build formatted value
  let formatted = formattedInteger;
  if (decimalPlaces > 0) {
    if (value.includes('.') || decimalPart) {
      formatted += decimalSeparator + decimalPart;
    }
  }

  // Add sign and symbol
  if (isNegative) {
    formatted = '-' + formatted;
  }

  if (symbolPosition === 'prefix') {
    formatted = symbol + formatted;
  } else {
    formatted = formatted + symbol;
  }

  // Calculate raw numeric value
  const numericValue = parseFloat(
    (isNegative ? '-' : '') + integerPart + (decimalPart ? '.' + decimalPart : '')
  );

  return {
    maskedValue: formatted,
    rawValue: isNaN(numericValue) ? '0' : numericValue.toString(),
    isComplete: true,
    isValid: !isNaN(numericValue),
  };
}

/**
 * Date mask
 */
export function dateMask(value: string, options: {
  format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
  separator?: string;
} = {}): MaskResult & { date: Date | null } {
  const { format = 'MM/DD/YYYY' } = options;
  const digits = value.replace(/\D/g, '');

  let formatted: string;
  let month: string;
  let day: string;
  let year: string;
  let separator: string;

  switch (format) {
    case 'DD/MM/YYYY':
      separator = '/';
      day = digits.slice(0, 2);
      month = digits.slice(2, 4);
      year = digits.slice(4, 8);
      if (digits.length <= 2) {
        formatted = day;
      } else if (digits.length <= 4) {
        formatted = `${day}${separator}${month}`;
      } else {
        formatted = `${day}${separator}${month}${separator}${year}`;
      }
      break;

    case 'YYYY-MM-DD':
      separator = '-';
      year = digits.slice(0, 4);
      month = digits.slice(4, 6);
      day = digits.slice(6, 8);
      if (digits.length <= 4) {
        formatted = year;
      } else if (digits.length <= 6) {
        formatted = `${year}${separator}${month}`;
      } else {
        formatted = `${year}${separator}${month}${separator}${day}`;
      }
      break;

    case 'MM-DD-YYYY':
      separator = '-';
      month = digits.slice(0, 2);
      day = digits.slice(2, 4);
      year = digits.slice(4, 8);
      if (digits.length <= 2) {
        formatted = month;
      } else if (digits.length <= 4) {
        formatted = `${month}${separator}${day}`;
      } else {
        formatted = `${month}${separator}${day}${separator}${year}`;
      }
      break;

    case 'MM/DD/YYYY':
    default:
      separator = '/';
      month = digits.slice(0, 2);
      day = digits.slice(2, 4);
      year = digits.slice(4, 8);
      if (digits.length <= 2) {
        formatted = month;
      } else if (digits.length <= 4) {
        formatted = `${month}${separator}${day}`;
      } else {
        formatted = `${month}${separator}${day}${separator}${year}`;
      }
  }

  // Validate date
  let date: Date | null = null;
  if (digits.length === 8) {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      date = new Date(y, m - 1, d);
      // Check if the date is valid (handles cases like Feb 30)
      if (date.getMonth() !== m - 1 || date.getDate() !== d) {
        date = null;
      }
    }
  }

  return {
    maskedValue: formatted,
    rawValue: digits.slice(0, 8),
    isComplete: digits.length === 8,
    isValid: date !== null,
    date,
  };
}

/**
 * Time mask
 */
export function timeMask(value: string, options: {
  format?: '12h' | '24h';
  showSeconds?: boolean;
} = {}): MaskResult {
  const { format = '12h', showSeconds = false } = options;
  const digits = value.replace(/\D/g, '');

  let hours = digits.slice(0, 2);
  let minutes = digits.slice(2, 4);
  let seconds = showSeconds ? digits.slice(4, 6) : '';

  // Validate hours
  const maxHours = format === '24h' ? 23 : 12;
  if (parseInt(hours, 10) > maxHours) {
    hours = maxHours.toString().padStart(2, '0');
  }

  // Validate minutes
  if (parseInt(minutes, 10) > 59) {
    minutes = '59';
  }

  // Validate seconds
  if (parseInt(seconds, 10) > 59) {
    seconds = '59';
  }

  let formatted = hours;
  if (digits.length > 2) {
    formatted += ':' + minutes;
  }
  if (showSeconds && digits.length > 4) {
    formatted += ':' + seconds;
  }

  const expectedLength = showSeconds ? 6 : 4;

  return {
    maskedValue: formatted,
    rawValue: digits.slice(0, expectedLength),
    isComplete: digits.length >= expectedLength,
    isValid: digits.length === expectedLength,
  };
}

/**
 * SSN mask (US Social Security Number)
 */
export function ssnMask(value: string): MaskResult {
  const digits = value.replace(/\D/g, '').slice(0, 9);

  let formatted: string;
  if (digits.length <= 3) {
    formatted = digits;
  } else if (digits.length <= 5) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  return {
    maskedValue: formatted,
    rawValue: digits,
    isComplete: digits.length === 9,
    isValid: digits.length === 9,
  };
}

/**
 * ZIP code mask
 */
export function zipCodeMask(value: string, options: {
  format?: 'us' | 'us-extended' | 'canada' | 'uk';
} = {}): MaskResult {
  const { format = 'us' } = options;

  switch (format) {
    case 'us-extended': {
      const digits = value.replace(/\D/g, '').slice(0, 9);
      let formatted: string;
      if (digits.length <= 5) {
        formatted = digits;
      } else {
        formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      }
      return {
        maskedValue: formatted,
        rawValue: digits,
        isComplete: digits.length >= 5,
        isValid: digits.length === 5 || digits.length === 9,
      };
    }

    case 'canada': {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      let formatted = cleaned;
      if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      }
      // Canadian postal code pattern: A1A 1A1
      const isValid = /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned);
      return {
        maskedValue: formatted,
        rawValue: cleaned,
        isComplete: cleaned.length === 6,
        isValid,
      };
    }

    case 'uk': {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      // UK postal codes are complex, simplified here
      return {
        maskedValue: cleaned,
        rawValue: cleaned,
        isComplete: cleaned.length >= 5,
        isValid: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(cleaned),
      };
    }

    case 'us':
    default: {
      const digits = value.replace(/\D/g, '').slice(0, 5);
      return {
        maskedValue: digits,
        rawValue: digits,
        isComplete: digits.length === 5,
        isValid: digits.length === 5,
      };
    }
  }
}

// =============================================================================
// Mask Input Handler
// =============================================================================

export interface MaskInputHandler {
  onInput: (event: { target: { value: string } }) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Create an input handler for masked input
 */
export function createMaskInputHandler(
  maskFn: (value: string) => MaskResult,
  onChange: (result: MaskResult) => void
): MaskInputHandler {
  return {
    onInput: (event) => {
      const result = maskFn(event.target.value);
      event.target.value = result.maskedValue;
      onChange(result);
    },
    onKeyDown: (_event) => {
      // Handle special keys like backspace
    },
    onFocus: () => {
      // Show mask placeholder
    },
    onBlur: () => {
      // Hide mask placeholder
    },
  };
}

// =============================================================================
// Mask Presets
// =============================================================================

export const maskPresets = {
  phone: {
    us: '(999) 999-9999',
    international: '+9 (999) 999-9999',
  },
  creditCard: {
    standard: '9999 9999 9999 9999',
    amex: '9999 999999 99999',
  },
  date: {
    'MM/DD/YYYY': '99/99/9999',
    'DD/MM/YYYY': '99/99/9999',
    'YYYY-MM-DD': '9999-99-99',
  },
  time: {
    '12h': '99:99',
    '24h': '99:99',
    'withSeconds': '99:99:99',
  },
  ssn: '999-99-9999',
  zip: {
    us: '99999',
    usExtended: '99999-9999',
  },
} as const;
