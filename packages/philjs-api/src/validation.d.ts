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
export declare class ValidationError extends Error {
    errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>);
}
/**
 * Validate data against a schema
 */
export declare function validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult;
/**
 * Create a validator function
 */
export declare function createValidator(schema: ValidationSchema): (data: Record<string, unknown>) => ValidationResult;
/**
 * Validate and throw on error
 */
export declare function validateOrThrow(data: Record<string, unknown>, schema: ValidationSchema): Record<string, unknown>;
//# sourceMappingURL=validation.d.ts.map