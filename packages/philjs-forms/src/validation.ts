/**
 * Form validation utilities with Zod integration
 */

import type { ValidationRule, FieldValue, FormValues, FormErrors, FieldError } from './types.js';

/**
 * Built-in validation rules
 */
export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      return value.length >= min;
    },
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      return value.length <= max;
    },
    message: message || `Must be at most ${max} characters`
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => {
      if (value === null || value === undefined) return true;
      return value >= min;
    },
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => {
      if (value === null || value === undefined) return true;
      return value <= max;
    },
    message: message || `Must be at most ${max}`
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      return regex.test(value);
    },
    message
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  matches: (field: string, message?: string): ValidationRule => ({
    validate: (value, values) => {
      if (!values) return true;
      return value === values[field];
    },
    message: message || `Must match ${field}`
  }),

  oneOf: (options: any[], message?: string): ValidationRule => ({
    validate: (value) => {
      return options.includes(value);
    },
    message: message || `Must be one of: ${options.join(', ')}`
  }),

  custom: (fn: (value: any) => boolean | Promise<boolean>, message: string): ValidationRule => ({
    validate: fn,
    message
  })
};

/**
 * Validate a value against rules
 */
export async function validateValue(
  value: FieldValue,
  rules: ValidationRule | ValidationRule[],
  allValues?: FormValues
): Promise<FieldError> {
  const rulesArray = Array.isArray(rules) ? rules : [rules];

  for (const rule of rulesArray) {
    const result = await rule.validate(value, allValues);
    if (!result) {
      return rule.message;
    }
  }

  return null;
}

/**
 * Zod integration
 */
export function zodValidator<T extends FormValues>(schema: any) {
  return async (values: T): Promise<FormErrors<T>> => {
    try {
      await schema.parseAsync(values);
      return {};
    } catch (error: any) {
      const errors: FormErrors<T> = {};

      if (error.errors) {
        for (const err of error.errors) {
          const field = err.path[0];
          if (field) {
            errors[field as keyof T] = err.message;
          }
        }
      }

      return errors;
    }
  };
}

/**
 * Create a validator from Zod schema
 */
export function createZodValidator<T extends FormValues>(schema: any) {
  const validator = zodValidator<T>(schema);

  return {
    validate: validator,
    validateField: async (name: keyof T, value: any): Promise<FieldError> => {
      try {
        // Validate just this field
        const fieldSchema = schema.shape[name];
        if (fieldSchema) {
          await fieldSchema.parseAsync(value);
        }
        return null;
      } catch (error: any) {
        return error.errors?.[0]?.message || 'Invalid value';
      }
    }
  };
}

/**
 * Compose multiple validators
 */
export function composeValidators<T extends FormValues>(
  ...validators: Array<(values: T) => FormErrors<T> | Promise<FormErrors<T>>>
) {
  return async (values: T): Promise<FormErrors<T>> => {
    const allErrors: FormErrors<T> = {};

    for (const validator of validators) {
      const errors = await validator(values);
      Object.assign(allErrors, errors);
    }

    return allErrors;
  };
}

/**
 * Debounce validation
 */
export function debounceValidation<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, delay);
    });
  }) as T;
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  alpha: /^[a-zA-Z]+$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  hexColor: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
};
