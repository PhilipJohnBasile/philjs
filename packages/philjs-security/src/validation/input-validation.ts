/**
 * PhilJS Security - Input Validation
 *
 * Validate and sanitize user input.
 */

import type { InputValidationConfig } from '../types.js';
import { escape, stripTags } from '../xss/sanitizer.js';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the input is valid */
  valid: boolean;
  /** Validation error message (if invalid) */
  error?: string;
  /** Sanitized value (if sanitization was applied) */
  value?: unknown;
}

/**
 * Validate a string value
 *
 * @param value - Value to validate
 * @param config - Validation configuration
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateString(userInput, {
 *   required: true,
 *   minLength: 3,
 *   maxLength: 100,
 *   pattern: /^[a-zA-Z0-9]+$/,
 * });
 *
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateString(value: unknown, config: InputValidationConfig = {}): ValidationResult {
  // Handle undefined/null
  if (value === undefined || value === null) {
    if (config.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  // Convert to string
  let str = String(value);

  // Trim if requested
  if (config.trim) {
    str = str.trim();
  }

  // Check required after trim
  if (config.required && str.length === 0) {
    return { valid: false, error: 'This field is required' };
  }

  // Allow empty strings for non-required fields
  if (str.length === 0 && !config.required) {
    return { valid: true, value: str };
  }

  // Check minimum length
  if (config.minLength !== undefined && str.length < config.minLength) {
    return {
      valid: false,
      error: `Must be at least ${config.minLength} characters`,
    };
  }

  // Check maximum length
  if (config.maxLength !== undefined && str.length > config.maxLength) {
    return {
      valid: false,
      error: `Must be at most ${config.maxLength} characters`,
    };
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(str)) {
    return {
      valid: false,
      error: 'Invalid format',
    };
  }

  // Run custom validation
  if (config.validate) {
    const customResult = config.validate(str);
    if (customResult !== true) {
      return {
        valid: false,
        error: typeof customResult === 'string' ? customResult : 'Validation failed',
      };
    }
  }

  // Sanitize if requested
  if (config.sanitize) {
    str = escape(str);
  }

  return { valid: true, value: str };
}

/**
 * Validate an email address
 *
 * @param value - Email to validate
 * @param options - Additional options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateEmail(userEmail);
 * if (result.valid) {
 *   // Email is valid
 * }
 * ```
 */
export function validateEmail(
  value: unknown,
  options: { required?: boolean } = {}
): ValidationResult {
  // RFC 5322 compliant email regex (simplified)
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return validateString(value, {
    required: options.required ?? false,
    trim: true,
    maxLength: 254, // RFC 5321 max length
    pattern: emailPattern,
  });
}

/**
 * Validate a URL
 *
 * @param value - URL to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateUrl(userUrl, {
 *   protocols: ['https'],
 *   requireProtocol: true,
 * });
 * ```
 */
export function validateUrl(
  value: unknown,
  options: {
    required?: boolean;
    protocols?: string[];
    requireProtocol?: boolean;
  } = {}
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  const str = String(value).trim();

  try {
    // Try to parse as URL
    let urlStr = str;
    if (!str.includes('://') && !options.requireProtocol) {
      urlStr = 'https://' + str;
    }

    const url = new URL(urlStr);

    // Check protocol
    if (options.protocols) {
      const protocol = url.protocol.replace(':', '');
      if (!options.protocols.includes(protocol)) {
        return {
          valid: false,
          error: `Protocol must be one of: ${options.protocols.join(', ')}`,
        };
      }
    }

    return { valid: true, value: url.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate a number
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateNumber(userAge, {
 *   min: 0,
 *   max: 150,
 *   integer: true,
 * });
 * ```
 */
export function validateNumber(
  value: unknown,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: 'Must be a valid number' };
  }

  if (options.integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be an integer' };
  }

  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: `Must be at least ${options.min}` };
  }

  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: `Must be at most ${options.max}` };
  }

  return { valid: true, value: num };
}

/**
 * Validate a date
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateDate(
  value: unknown,
  options: {
    required?: boolean;
    min?: Date;
    max?: Date;
  } = {}
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(String(value));
  }

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (options.min && date < options.min) {
    return { valid: false, error: `Date must be after ${options.min.toISOString()}` };
  }

  if (options.max && date > options.max) {
    return { valid: false, error: `Date must be before ${options.max.toISOString()}` };
  }

  return { valid: true, value: date };
}

/**
 * Validate a phone number
 *
 * @param value - Phone number to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validatePhone(
  value: unknown,
  options: {
    required?: boolean;
    format?: 'international' | 'us' | 'any';
  } = {}
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  const str = String(value).trim();

  // Remove common formatting characters for validation
  const digits = str.replace(/[\s\-().+]/g, '');

  // Must contain only digits (after removing formatting)
  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  // Check format-specific requirements
  switch (options.format) {
    case 'us':
      if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith('1'))) {
        return { valid: false, error: 'Must be a valid US phone number' };
      }
      break;
    case 'international':
      if (digits.length < 7 || digits.length > 15) {
        return { valid: false, error: 'Must be a valid international phone number' };
      }
      break;
    default:
      if (digits.length < 7 || digits.length > 15) {
        return { valid: false, error: 'Invalid phone number' };
      }
  }

  return { valid: true, value: str };
}

/**
 * Validate JSON string
 *
 * @param value - JSON string to validate
 * @param options - Validation options
 * @returns Validation result with parsed JSON
 */
export function validateJSON(
  value: unknown,
  options: {
    required?: boolean;
    schema?: (parsed: unknown) => boolean | string;
  } = {}
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    if (options.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, value: undefined };
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (options.schema) {
      const schemaResult = options.schema(parsed);
      if (schemaResult !== true) {
        return {
          valid: false,
          error: typeof schemaResult === 'string' ? schemaResult : 'Invalid JSON schema',
        };
      }
    }

    return { valid: true, value: parsed };
  } catch {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Common validation patterns
 */
export const patterns = {
  /** Alphanumeric characters only */
  alphanumeric: /^[a-zA-Z0-9]+$/,
  /** Alphabetic characters only */
  alpha: /^[a-zA-Z]+$/,
  /** Alphanumeric with spaces, hyphens, and underscores */
  slug: /^[a-zA-Z0-9\s_-]+$/,
  /** UUID v4 format */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /** Hex color (with or without #) */
  hexColor: /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  /** IP address (v4) */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  /** Credit card number (basic) */
  creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
  /** Username (alphanumeric, underscore, hyphen) */
  username: /^[a-zA-Z][a-zA-Z0-9_-]{2,31}$/,
  /** Strong password (8+ chars, uppercase, lowercase, number, special) */
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

/**
 * Sanitize object by validating all fields
 *
 * @param data - Object to sanitize
 * @param schema - Validation schema
 * @returns Sanitized object and validation errors
 *
 * @example
 * ```typescript
 * const { data, errors, valid } = sanitizeObject(userInput, {
 *   name: { required: true, maxLength: 100 },
 *   email: { required: true, validate: (v) => validateEmail(v).valid },
 *   age: { validate: (v) => validateNumber(v, { min: 0, max: 150 }).valid },
 * });
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, InputValidationConfig>
): {
  data: Partial<T>;
  errors: Record<string, string>;
  valid: boolean;
} {
  const result: Partial<T> = {};
  const errors: Record<string, string> = {};
  let valid = true;

  for (const [key, config] of Object.entries(schema)) {
    const value = data[key as keyof T];
    const validation = validateString(value, config as InputValidationConfig);

    if (validation.valid) {
      result[key as keyof T] = validation.value as T[keyof T];
    } else {
      errors[key] = validation.error!;
      valid = false;
    }
  }

  return { data: result, errors, valid };
}

/**
 * Create a validator function with predefined config
 *
 * @param config - Validation configuration
 * @returns Validator function
 *
 * @example
 * ```typescript
 * const validateUsername = createValidator({
 *   required: true,
 *   minLength: 3,
 *   maxLength: 20,
 *   pattern: patterns.username,
 * });
 *
 * const result = validateUsername(input);
 * ```
 */
export function createValidator(config: InputValidationConfig) {
  return (value: unknown): ValidationResult => validateString(value, config);
}
