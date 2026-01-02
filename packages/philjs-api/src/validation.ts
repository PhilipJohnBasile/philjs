/**
 * PhilJS Validation
 *
 * Schema validation for API routes.
 */

export interface ValidationSchema {
  [key: string]: FieldValidation;
}

export interface FieldValidation {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: (value: unknown) => boolean | string;
  items?: FieldValidation;
  properties?: ValidationSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  data: Record<string, unknown>;
}

export class ValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate data against a schema
 */
export function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const validData: Record<string, unknown> = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const fieldErrors: string[] = [];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${key} is required`);
    }

    if (value !== undefined && value !== null && value !== '') {
      // Type check
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            fieldErrors.push(`${key} must be a string`);
          } else {
            if (rules.minLength && value.length < rules.minLength) {
              fieldErrors.push(`${key} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              fieldErrors.push(`${key} must be at most ${rules.maxLength} characters`);
            }
            if (rules.pattern && !rules.pattern.test(value)) {
              fieldErrors.push(`${key} has invalid format`);
            }
          }
          break;

        case 'number':
          const num = typeof value === 'number' ? value : Number(value);
          if (isNaN(num)) {
            fieldErrors.push(`${key} must be a number`);
          } else {
            if (rules.min !== undefined && num < rules.min) {
              fieldErrors.push(`${key} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && num > rules.max) {
              fieldErrors.push(`${key} must be at most ${rules.max}`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            fieldErrors.push(`${key} must be a boolean`);
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            fieldErrors.push(`${key} must be an array`);
          } else {
            if (rules.min !== undefined && value.length < rules.min) {
              fieldErrors.push(`${key} must have at least ${rules.min} items`);
            }
            if (rules.max !== undefined && value.length > rules.max) {
              fieldErrors.push(`${key} must have at most ${rules.max} items`);
            }
          }
          break;

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            fieldErrors.push(`${key} must be an object`);
          }
          break;

        case 'email':
          if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
            fieldErrors.push(`${key} must be a valid email address`);
          }
          break;

        case 'url':
          if (typeof value !== 'string' || !URL.canParse(value)) {
            fieldErrors.push(`${key} must be a valid URL`);
          }
          break;

        case 'date':
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            fieldErrors.push(`${key} must be a valid date`);
          }
          break;
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        fieldErrors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (typeof result === 'string') {
          fieldErrors.push(result);
        } else if (!result) {
          fieldErrors.push(`${key} is invalid`);
        }
      }
    }

    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
    } else if (value !== undefined) {
      validData[key] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: validData,
  };
}

/**
 * Create a validator function
 */
export function createValidator(schema: ValidationSchema) {
  return function validateData(data: Record<string, unknown>): ValidationResult {
    return validate(data, schema);
  };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow(
  data: Record<string, unknown>,
  schema: ValidationSchema
): Record<string, unknown> {
  const result = validate(data, schema);
  if (!result.valid) {
    throw new ValidationError(result.errors);
  }
  return result.data;
}
