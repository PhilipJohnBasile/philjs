/**
 * PhilJS Rocket Forms
 *
 * Form handling utilities for Rocket framework.
 * Provides type-safe form parsing, validation, and CSRF protection.
 */
/**
 * Form field type
 */
export type FieldType = 'text' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'file' | 'array';
/**
 * Form field definition
 */
export interface FormField<T = unknown> {
    /** Field name */
    name: string;
    /** Field type */
    type: FieldType;
    /** Is required */
    required?: boolean;
    /** Default value */
    default?: T;
    /** Minimum length (for strings) */
    minLength?: number;
    /** Maximum length (for strings) */
    maxLength?: number;
    /** Minimum value (for numbers) */
    min?: number;
    /** Maximum value (for numbers) */
    max?: number;
    /** Regex pattern for validation */
    pattern?: string;
    /** Custom validation function */
    validate?: (value: T) => boolean | string;
    /** Transform function */
    transform?: (value: unknown) => T;
}
/**
 * Form schema definition
 */
export type FormSchema<T> = {
    [K in keyof T]: FormField<T[K]>;
};
/**
 * Form validation result
 */
export interface FormValidationResult<T> {
    /** Whether validation passed */
    valid: boolean;
    /** Validated and transformed data */
    data: T | null;
    /** Validation errors by field */
    errors: Record<string, string[]>;
}
/**
 * Uploaded file
 */
export interface UploadedFile {
    /** Field name */
    fieldName: string;
    /** Original filename */
    fileName: string;
    /** Content type */
    contentType: string;
    /** File size in bytes */
    size: number;
    /** File content */
    content: Uint8Array;
    /** Temporary file path (if persisted) */
    tempPath?: string;
}
/**
 * Form data with files
 */
export interface FormDataWithFiles<T = Record<string, unknown>> {
    /** Form field values */
    fields: T;
    /** Uploaded files */
    files: UploadedFile[];
}
/**
 * Form validator class
 */
export declare class FormValidator<T extends Record<string, unknown>> {
    private schema;
    private csrfEnabled;
    private csrfFieldName;
    constructor(schema: FormSchema<T>);
    /**
     * Disable CSRF validation
     */
    withoutCsrf(): this;
    /**
     * Set CSRF field name
     */
    csrfField(name: string): this;
    /**
     * Validate form data
     */
    validate(data: Record<string, unknown>, csrfToken?: string): FormValidationResult<T>;
    private validateAndTransform;
    private isValidEmail;
    private isValidUrl;
}
/**
 * Create a form validator
 */
export declare function createFormValidator<T extends Record<string, unknown>>(schema: FormSchema<T>): FormValidator<T>;
/**
 * Parse URL-encoded form data
 */
export declare function parseFormData(body: string): Record<string, string | string[]>;
/**
 * Parse multipart form data
 */
export declare function parseMultipartFormData(request: Request): Promise<FormDataWithFiles>;
/**
 * Generate a CSRF token
 */
export declare function generateCsrfToken(): string;
/**
 * Create a CSRF hidden field HTML
 */
export declare function csrfField(token: string, fieldName?: string): string;
/**
 * CSRF validation middleware
 */
export declare function validateCsrf(formToken: string | undefined, sessionToken: string | undefined): boolean;
/**
 * Form builder for generating HTML forms
 */
export declare class FormBuilder {
    private action;
    private method;
    private enctype;
    private csrfToken?;
    private fields;
    private attributes;
    /**
     * Set form action
     */
    setAction(url: string): this;
    /**
     * Set form method
     */
    setMethod(method: 'GET' | 'POST'): this;
    /**
     * Enable multipart encoding for file uploads
     */
    multipart(): this;
    /**
     * Set CSRF token
     */
    csrf(token: string): this;
    /**
     * Add a form attribute
     */
    attr(name: string, value: string): this;
    /**
     * Add a text input
     */
    text(name: string, options?: InputOptions): this;
    /**
     * Add an email input
     */
    email(name: string, options?: InputOptions): this;
    /**
     * Add a password input
     */
    password(name: string, options?: InputOptions): this;
    /**
     * Add a number input
     */
    number(name: string, options?: InputOptions & {
        min?: number;
        max?: number;
        step?: number;
    }): this;
    /**
     * Add a textarea
     */
    textarea(name: string, options?: TextareaOptions): this;
    /**
     * Add a select dropdown
     */
    select(name: string, options: SelectOptions): this;
    /**
     * Add a checkbox
     */
    checkbox(name: string, options?: CheckboxOptions): this;
    /**
     * Add a file input
     */
    file(name: string, options?: FileInputOptions): this;
    /**
     * Add a submit button
     */
    submit(text?: string, options?: ButtonOptions): this;
    /**
     * Add raw HTML
     */
    raw(html: string): this;
    /**
     * Build the form HTML
     */
    build(): string;
    private input;
    private escapeHtml;
}
/**
 * Create a form builder
 */
export declare function createForm(action?: string, method?: 'GET' | 'POST'): FormBuilder;
interface InputOptions {
    label?: string;
    value?: string | number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
    pattern?: string;
    autocomplete?: string;
}
interface TextareaOptions {
    label?: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
    cols?: number;
    className?: string;
}
interface SelectOptions {
    label?: string;
    choices: Array<{
        value: string;
        label: string;
    }>;
    value?: string | string[];
    required?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    className?: string;
}
interface CheckboxOptions {
    label?: string;
    checked?: boolean;
    value?: string;
    disabled?: boolean;
    className?: string;
}
interface FileInputOptions {
    label?: string;
    accept?: string;
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}
interface ButtonOptions {
    disabled?: boolean;
    className?: string;
}
/**
 * Generate Rust form struct
 */
export declare function generateRustFormStruct(name: string, fields: Record<string, FormField>): string;
export {};
//# sourceMappingURL=forms.d.ts.map