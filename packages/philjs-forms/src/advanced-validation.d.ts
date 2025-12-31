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
    rules: {
        [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[];
    };
    asyncRules?: {
        [K in keyof T]?: AsyncValidationRule<T[K]> | AsyncValidationRule<T[K]>[];
    };
    conditionalRules?: {
        [K in keyof T]?: ConditionalRule<T[K]>[];
    };
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
export declare const advancedValidators: {
    /**
     * Async email validation with domain check
     */
    emailWithDomainCheck: (allowedDomains?: string[], message?: string) => AsyncValidationRule<string>;
    /**
     * Check if username is available
     */
    usernameAvailable: (checkFn: (username: string) => Promise<boolean>, message?: string) => AsyncValidationRule<string>;
    /**
     * Password strength validation
     */
    passwordStrength: (minStrength?: "weak" | "medium" | "strong" | "very-strong", message?: string) => ValidationRule<string>;
    /**
     * File validation
     */
    file: (options: {
        maxSize?: number;
        allowedTypes?: string[];
        maxFiles?: number;
    }) => ValidationRule<File | File[] | FileList>;
    /**
     * Date validation
     */
    date: (options: {
        min?: Date;
        max?: Date;
        format?: string;
        excludeWeekends?: boolean;
        excludeDates?: Date[];
    }) => ValidationRule<Date | string>;
    /**
     * Array validation
     */
    array: (options: {
        min?: number;
        max?: number;
        unique?: boolean;
        itemValidator?: ValidationRule;
    }) => ValidationRule<unknown[]>;
    /**
     * Credit card validation with Luhn algorithm
     */
    creditCard: (message?: string) => ValidationRule<string>;
    /**
     * IBAN validation
     */
    iban: (message?: string) => ValidationRule<string>;
    /**
     * JSON validation
     */
    json: (message?: string) => ValidationRule<string>;
    /**
     * Slug validation
     */
    slug: (message?: string) => ValidationRule<string>;
    /**
     * UUID validation
     */
    uuid: (version?: 1 | 4, message?: string) => ValidationRule<string>;
};
export declare class SchemaValidator<T extends FormValues = FormValues> {
    private schema;
    private pendingValidations;
    constructor(schema: ValidationSchema<T>);
    /**
     * Validate all fields
     */
    validate(values: T, context?: Partial<ValidationContext>): Promise<ValidationResult<T>>;
    /**
     * Validate a single field
     */
    validateField(field: keyof T, value: T[keyof T], allValues?: T, context?: Partial<ValidationContext>): Promise<FieldValidationResult>;
    /**
     * Validate a group
     */
    validateGroup(groupName: string, values: T): Promise<FormErrors<T>>;
    /**
     * Cancel all pending validations
     */
    cancelPending(): void;
}
/**
 * Create a schema validator
 */
export declare function createSchemaValidator<T extends FormValues>(schema: ValidationSchema<T>): SchemaValidator<T>;
/**
 * Create conditional validation rule
 */
export declare function when<T = FieldValue>(condition: (values: FormValues) => boolean, rule: ValidationRule<T>): ConditionalRule<T>;
/**
 * Create cross-field validation
 */
export declare function crossField(fields: string[], validate: (values: Record<string, FieldValue>) => boolean | Promise<boolean>, message: string, target?: string): CrossFieldRule;
/**
 * Validate if field depends on another
 */
export declare function dependsOn<T = FieldValue>(fieldName: string, condition: (dependentValue: FieldValue) => boolean, rule: ValidationRule<T>): ConditionalRule<T>;
/**
 * Create validation message with field name
 */
export declare function messageWithField(template: string): (fieldName: string) => string;
/**
 * Combine multiple validation results
 */
export declare function combineResults<T extends FormValues>(results: ValidationResult<T>[]): ValidationResult<T>;
/**
 * Format validation errors for display
 */
export declare function formatErrors<T extends FormValues>(errors: FormErrors<T>, labels?: Record<string, string>): string[];
/**
 * Check if form has errors
 */
export declare function hasErrors<T extends FormValues>(errors: FormErrors<T>): boolean;
/**
 * Get first error
 */
export declare function getFirstError<T extends FormValues>(errors: FormErrors<T>): [string, FieldError] | null;
//# sourceMappingURL=advanced-validation.d.ts.map