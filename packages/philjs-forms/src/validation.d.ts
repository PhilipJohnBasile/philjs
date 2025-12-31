/**
 * Form validation utilities with Zod integration
 */
import type { ValidationRule, FieldValue, FormValues, FormErrors, FieldError } from './types.js';
/**
 * Built-in validation rules
 */
export declare const validators: {
    required: (message?: string) => ValidationRule;
    email: (message?: string) => ValidationRule<string>;
    minLength: (min: number, message?: string) => ValidationRule<string>;
    maxLength: (max: number, message?: string) => ValidationRule<string>;
    min: (min: number, message?: string) => ValidationRule<number>;
    max: (max: number, message?: string) => ValidationRule<number>;
    pattern: (regex: RegExp, message?: string) => ValidationRule<string>;
    url: (message?: string) => ValidationRule<string>;
    matches: (field: string, message?: string) => ValidationRule;
    oneOf: (options: any[], message?: string) => ValidationRule;
    custom: (fn: (value: any) => boolean | Promise<boolean>, message: string) => ValidationRule;
};
/**
 * Validate a value against rules
 */
export declare function validateValue(value: FieldValue, rules: ValidationRule | ValidationRule[], allValues?: FormValues): Promise<FieldError>;
/**
 * Zod integration
 */
export declare function zodValidator<T extends FormValues>(schema: any): (values: T) => Promise<FormErrors<T>>;
/**
 * Create a validator from Zod schema
 */
export declare function createZodValidator<T extends FormValues>(schema: any): {
    validate: (values: T) => Promise<FormErrors<T>>;
    validateField: (name: keyof T, value: any) => Promise<FieldError>;
};
/**
 * Compose multiple validators
 */
export declare function composeValidators<T extends FormValues>(...validators: Array<(values: T) => FormErrors<T> | Promise<FormErrors<T>>>): (values: T) => Promise<FormErrors<T>>;
/**
 * Debounce validation
 */
export declare function debounceValidation<T extends (...args: any[]) => any>(fn: T, delay?: number): T;
/**
 * Common validation patterns
 */
export declare const patterns: {
    email: RegExp;
    phone: RegExp;
    url: RegExp;
    alphanumeric: RegExp;
    numeric: RegExp;
    alpha: RegExp;
    username: RegExp;
    password: RegExp;
    zipCode: RegExp;
    creditCard: RegExp;
    hexColor: RegExp;
    ipv4: RegExp;
};
//# sourceMappingURL=validation.d.ts.map