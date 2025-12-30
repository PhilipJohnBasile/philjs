/**
 * Advanced Form Validation
 *
 * Extended validation capabilities:
 * - Async validators
 * - Conditional validation
 * - Cross-field validation
 * - Schema-based validation
 * - Validation groups
 * - Real-time validation
 */

import type { FieldValue, FormValues, FieldError, FormErrors, ValidationRule } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface AsyncValidationRule<T = FieldValue> {
  validate: (value: T, allValues?: FormValues, context?: ValidationContext) => Promise<boolean>;
  message: string | ((value: T) => string);
  debounce?: number;
}

export interface ConditionalRule<T = FieldValue> {
  when: (values: FormValues) => boolean;
  rule: ValidationRule<T>;
}

export interface ValidationContext {
  fieldName: string;
  touched: boolean;
  dirty: boolean;
  submitting: boolean;
  submitted: boolean;
  signal?: AbortSignal;
}

export interface ValidationGroup {
  name: string;
  fields: string[];
  validateOn?: 'change' | 'blur' | 'submit';
}

export interface CrossFieldRule {
  fields: string[];
  validate: (values: Record<string, FieldValue>) => boolean | Promise<boolean>;
  message: string;
  target?: string;
}

export interface ValidationSchema<T extends FormValues = FormValues> {
  rules: { [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[] };
  asyncRules?: { [K in keyof T]?: AsyncValidationRule<T[K]> | AsyncValidationRule<T[K]>[] };
  conditionalRules?: { [K in keyof T]?: ConditionalRule<T[K]>[] };
  crossFieldRules?: CrossFieldRule[];
  groups?: ValidationGroup[];
}

export interface ValidationResult<T extends FormValues = FormValues> {
  valid: boolean;
  errors: FormErrors<T>;
  warnings: FormErrors<T>;
  fieldResults: Map<keyof T, FieldValidationResult>;
}

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  asyncPending: boolean;
}

// =============================================================================
// Advanced Validators
// =============================================================================

export const advancedValidators = {
  /**
   * Async email validation with domain check
   */
  emailWithDomainCheck: (
    allowedDomains?: string[],
    message = 'Invalid email or domain not allowed'
  ): AsyncValidationRule<string> => ({
    validate: async (value) => {
      if (!value) return true;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return false;

      if (allowedDomains?.length) {
        const domain = value.split('@')[1]?.toLowerCase();
        return allowedDomains.some(d => domain === d.toLowerCase());
      }

      return true;
    },
    message,
    debounce: 300,
  }),

  /**
   * Check if username is available
   */
  usernameAvailable: (
    checkFn: (username: string) => Promise<boolean>,
    message = 'Username is already taken'
  ): AsyncValidationRule<string> => ({
    validate: async (value) => {
      if (!value || value.length < 3) return true;
      return await checkFn(value);
    },
    message,
    debounce: 500,
  }),

  /**
   * Password strength validation
   */
  passwordStrength: (
    minStrength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'medium',
    message?: string
  ): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;

      let strength = 0;
      if (value.length >= 8) strength++;
      if (value.length >= 12) strength++;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
      if (/\d/.test(value)) strength++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++;

      const required = { weak: 1, medium: 2, strong: 3, 'very-strong': 4 };
      return strength >= required[minStrength];
    },
    message: message || `Password must be ${minStrength} or stronger`,
  }),

  /**
   * File validation
   */
  file: (options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  }): ValidationRule<File | File[] | FileList> => ({
    validate: (value) => {
      if (!value) return true;

      const files = value instanceof FileList
        ? Array.from(value)
        : Array.isArray(value) ? value : [value];

      if (options.maxFiles && files.length > options.maxFiles) {
        return false;
      }

      for (const file of files) {
        if (options.maxSize && file.size > options.maxSize) {
          return false;
        }
        if (options.allowedTypes?.length && !options.allowedTypes.includes(file.type)) {
          return false;
        }
      }

      return true;
    },
    message: 'Invalid file',
  }),

  /**
   * Date validation
   */
  date: (options: {
    min?: Date;
    max?: Date;
    format?: string;
    excludeWeekends?: boolean;
    excludeDates?: Date[];
  }): ValidationRule<Date | string> => ({
    validate: (value) => {
      if (!value) return true;

      const date = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(date.getTime())) return false;

      if (options.min && date < options.min) return false;
      if (options.max && date > options.max) return false;

      if (options.excludeWeekends) {
        const day = date.getDay();
        if (day === 0 || day === 6) return false;
      }

      if (options.excludeDates?.length) {
        const dateStr = date.toISOString().split('T')[0];
        if (options.excludeDates.some(d => d.toISOString().split('T')[0] === dateStr)) {
          return false;
        }
      }

      return true;
    },
    message: 'Invalid date',
  }),

  /**
   * Array validation
   */
  array: (options: {
    min?: number;
    max?: number;
    unique?: boolean;
    itemValidator?: ValidationRule;
  }): ValidationRule<unknown[]> => ({
    validate: (value) => {
      if (!Array.isArray(value)) return false;

      if (options.min !== undefined && value.length < options.min) return false;
      if (options.max !== undefined && value.length > options.max) return false;

      if (options.unique) {
        const uniqueSet = new Set(value.map(v => JSON.stringify(v)));
        if (uniqueSet.size !== value.length) return false;
      }

      if (options.itemValidator) {
        for (const item of value) {
          if (!options.itemValidator.validate(item as FieldValue)) return false;
        }
      }

      return true;
    },
    message: 'Invalid array',
  }),

  /**
   * Credit card validation with Luhn algorithm
   */
  creditCard: (message = 'Invalid credit card number'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;

      const digits = value.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;

      let sum = 0;
      let isEven = false;

      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]!, 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0;
    },
    message,
  }),

  /**
   * IBAN validation
   */
  iban: (message = 'Invalid IBAN'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;

      const iban = value.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;

      const rearranged = iban.slice(4) + iban.slice(0, 4);
      const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
        (char.charCodeAt(0) - 55).toString()
      );

      let remainder = '';
      for (const char of numericIban) {
        const temp = remainder + char;
        remainder = (parseInt(temp, 10) % 97).toString();
      }

      return parseInt(remainder, 10) === 1;
    },
    message,
  }),

  /**
   * JSON validation
   */
  json: (message = 'Invalid JSON'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  /**
   * Slug validation
   */
  slug: (message = 'Invalid slug format'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
    },
    message,
  }),

  /**
   * UUID validation
   */
  uuid: (version?: 1 | 4, message = 'Invalid UUID'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;

      const patterns: Record<string, RegExp> = {
        default: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      };

      const pattern = version ? patterns[version] : patterns['default'];
      return pattern!.test(value);
    },
    message,
  }),
};

// =============================================================================
// Schema Validator
// =============================================================================

export class SchemaValidator<T extends FormValues = FormValues> {
  private schema: ValidationSchema<T>;
  private pendingValidations: Map<string, AbortController> = new Map();

  constructor(schema: ValidationSchema<T>) {
    this.schema = schema;
  }

  /**
   * Validate all fields
   */
  async validate(values: T, context?: Partial<ValidationContext>): Promise<ValidationResult<T>> {
    const errors: FormErrors<T> = {};
    const warnings: FormErrors<T> = {};
    const fieldResults = new Map<keyof T, FieldValidationResult>();

    // Validate each field
    for (const [field, rules] of Object.entries(this.schema.rules || {})) {
      const value = values[field as keyof T];
      const result = await this.validateField(field as keyof T, value, values, context);

      fieldResults.set(field as keyof T, result);
      if (result.error) {
        errors[field as keyof T] = result.error;
      }
      if (result.warning) {
        warnings[field as keyof T] = result.warning;
      }
    }

    // Cross-field validation
    for (const rule of this.schema.crossFieldRules || []) {
      const fieldValues: Record<string, FieldValue> = {};
      for (const field of rule.fields) {
        fieldValues[field] = values[field as keyof T];
      }

      const valid = await rule.validate(fieldValues);
      if (!valid && rule.target) {
        errors[rule.target as keyof T] = rule.message;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
      fieldResults,
    };
  }

  /**
   * Validate a single field
   */
  async validateField(
    field: keyof T,
    value: T[keyof T],
    allValues?: T,
    context?: Partial<ValidationContext>
  ): Promise<FieldValidationResult> {
    const result: FieldValidationResult = {
      valid: true,
      asyncPending: false,
    };

    // Sync rules
    const rules = this.schema.rules?.[field];
    if (rules) {
      const ruleArray = Array.isArray(rules) ? rules : [rules];
      for (const rule of ruleArray) {
        if (!rule.validate(value, allValues)) {
          result.valid = false;
          result.error = typeof rule.message === 'function'
            ? rule.message(value)
            : rule.message;
          return result;
        }
      }
    }

    // Conditional rules
    const conditionalRules = this.schema.conditionalRules?.[field];
    if (conditionalRules && allValues) {
      for (const { when, rule } of conditionalRules) {
        if (when(allValues) && !rule.validate(value, allValues)) {
          result.valid = false;
          result.error = rule.message;
          return result;
        }
      }
    }

    // Async rules
    const asyncRules = this.schema.asyncRules?.[field];
    if (asyncRules) {
      // Cancel previous async validation for this field
      const prevController = this.pendingValidations.get(field as string);
      if (prevController) {
        prevController.abort();
      }

      const controller = new AbortController();
      this.pendingValidations.set(field as string, controller);
      result.asyncPending = true;

      const ruleArray = Array.isArray(asyncRules) ? asyncRules : [asyncRules];
      for (const rule of ruleArray) {
        try {
          const valid = await rule.validate(value, allValues, {
            fieldName: field as string,
            touched: context?.touched ?? false,
            dirty: context?.dirty ?? false,
            submitting: context?.submitting ?? false,
            submitted: context?.submitted ?? false,
            signal: controller.signal,
          });

          if (!valid) {
            result.valid = false;
            result.error = typeof rule.message === 'function'
              ? rule.message(value)
              : rule.message;
            break;
          }
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            // Validation was cancelled
            result.asyncPending = false;
            return result;
          }
          throw error;
        }
      }

      this.pendingValidations.delete(field as string);
      result.asyncPending = false;
    }

    return result;
  }

  /**
   * Validate a group
   */
  async validateGroup(groupName: string, values: T): Promise<FormErrors<T>> {
    const group = this.schema.groups?.find(g => g.name === groupName);
    if (!group) return {};

    const errors: FormErrors<T> = {};
    for (const field of group.fields) {
      const value = values[field as keyof T];
      const result = await this.validateField(field as keyof T, value, values);
      if (result.error) {
        errors[field as keyof T] = result.error;
      }
    }

    return errors;
  }

  /**
   * Cancel all pending validations
   */
  cancelPending(): void {
    for (const controller of this.pendingValidations.values()) {
      controller.abort();
    }
    this.pendingValidations.clear();
  }
}

/**
 * Create a schema validator
 */
export function createSchemaValidator<T extends FormValues>(
  schema: ValidationSchema<T>
): SchemaValidator<T> {
  return new SchemaValidator(schema);
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Create conditional validation rule
 */
export function when<T = FieldValue>(
  condition: (values: FormValues) => boolean,
  rule: ValidationRule<T>
): ConditionalRule<T> {
  return { when: condition, rule };
}

/**
 * Create cross-field validation
 */
export function crossField(
  fields: string[],
  validate: (values: Record<string, FieldValue>) => boolean | Promise<boolean>,
  message: string,
  target?: string
): CrossFieldRule {
  const result: CrossFieldRule = { fields, validate, message };
  if (target !== undefined) {
    result.target = target;
  }
  return result;
}

/**
 * Validate if field depends on another
 */
export function dependsOn<T = FieldValue>(
  fieldName: string,
  condition: (dependentValue: FieldValue) => boolean,
  rule: ValidationRule<T>
): ConditionalRule<T> {
  return {
    when: (values) => condition(values[fieldName]),
    rule,
  };
}

/**
 * Create validation message with field name
 */
export function messageWithField(
  template: string
): (fieldName: string) => string {
  return (fieldName) => template.replace('{field}', fieldName);
}

/**
 * Combine multiple validation results
 */
export function combineResults<T extends FormValues>(
  results: ValidationResult<T>[]
): ValidationResult<T> {
  const combined: ValidationResult<T> = {
    valid: true,
    errors: {},
    warnings: {},
    fieldResults: new Map(),
  };

  for (const result of results) {
    if (!result.valid) combined.valid = false;
    Object.assign(combined.errors, result.errors);
    Object.assign(combined.warnings, result.warnings);

    for (const [key, value] of result.fieldResults) {
      combined.fieldResults.set(key, value);
    }
  }

  return combined;
}

/**
 * Format validation errors for display
 */
export function formatErrors<T extends FormValues>(
  errors: FormErrors<T>,
  labels?: Record<string, string>
): string[] {
  return Object.entries(errors)
    .filter(([_, error]) => error)
    .map(([field, error]) => {
      const label = labels?.[field] || field;
      return `${label}: ${error}`;
    });
}

/**
 * Check if form has errors
 */
export function hasErrors<T extends FormValues>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Get first error
 */
export function getFirstError<T extends FormValues>(
  errors: FormErrors<T>
): [string, FieldError] | null {
  for (const [field, error] of Object.entries(errors)) {
    if (error) return [field, error];
  }
  return null;
}
