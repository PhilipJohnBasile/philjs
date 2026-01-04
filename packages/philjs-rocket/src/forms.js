/**
 * PhilJS Rocket Forms
 *
 * Form handling utilities for Rocket framework.
 * Provides type-safe form parsing, validation, and CSRF protection.
 */
// ============================================================================
// Form Validation
// ============================================================================
/**
 * Form validator class
 */
export class FormValidator {
    schema;
    csrfEnabled = true;
    csrfFieldName = '_csrf';
    constructor(schema) {
        this.schema = schema;
    }
    /**
     * Disable CSRF validation
     */
    withoutCsrf() {
        this.csrfEnabled = false;
        return this;
    }
    /**
     * Set CSRF field name
     */
    csrfField(name) {
        this.csrfFieldName = name;
        return this;
    }
    /**
     * Validate form data
     */
    validate(data, csrfToken) {
        const errors = {};
        const result = {};
        // CSRF validation
        if (this.csrfEnabled && csrfToken) {
            const formCsrf = data[this.csrfFieldName];
            if (formCsrf !== csrfToken) {
                errors[this.csrfFieldName] = ['Invalid CSRF token'];
            }
        }
        // Field validation
        for (const [fieldName, field] of Object.entries(this.schema)) {
            const fieldErrors = [];
            let value = data[fieldName];
            // Required check
            if (field.required && (value === undefined || value === null || value === '')) {
                fieldErrors.push(`${fieldName} is required`);
                errors[fieldName] = fieldErrors;
                continue;
            }
            // Use default if no value
            if ((value === undefined || value === null || value === '') && field.default !== undefined) {
                value = field.default;
            }
            // Skip optional empty fields
            if (value === undefined || value === null || value === '') {
                continue;
            }
            // Type validation and transformation
            try {
                value = this.validateAndTransform(value, field, fieldErrors);
            }
            catch (error) {
                fieldErrors.push(`Invalid ${fieldName}`);
            }
            // Pattern validation
            if (field.pattern && typeof value === 'string') {
                const regex = new RegExp(field.pattern);
                if (!regex.test(value)) {
                    fieldErrors.push(`${fieldName} format is invalid`);
                }
            }
            // Custom validation
            if (field.validate && fieldErrors.length === 0) {
                const customResult = field.validate(value);
                if (typeof customResult === 'string') {
                    fieldErrors.push(customResult);
                }
                else if (!customResult) {
                    fieldErrors.push(`${fieldName} validation failed`);
                }
            }
            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
            else {
                result[fieldName] = value;
            }
        }
        const valid = Object.keys(errors).length === 0;
        return {
            valid,
            data: valid ? result : null,
            errors,
        };
    }
    validateAndTransform(value, field, errors) {
        // Apply transform if provided
        if (field.transform) {
            value = field.transform(value);
        }
        switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
                value = String(value);
                if (field.minLength && value.length < field.minLength) {
                    errors.push(`Must be at least ${field.minLength} characters`);
                }
                if (field.maxLength && value.length > field.maxLength) {
                    errors.push(`Must be at most ${field.maxLength} characters`);
                }
                if (field.type === 'email' && !this.isValidEmail(value)) {
                    errors.push('Invalid email address');
                }
                if (field.type === 'url' && !this.isValidUrl(value)) {
                    errors.push('Invalid URL');
                }
                break;
            case 'number':
                value = Number(value);
                if (isNaN(value)) {
                    errors.push('Must be a number');
                }
                else {
                    if (field.min !== undefined && value < field.min) {
                        errors.push(`Must be at least ${field.min}`);
                    }
                    if (field.max !== undefined && value > field.max) {
                        errors.push(`Must be at most ${field.max}`);
                    }
                }
                break;
            case 'boolean':
                value = value === 'true' || value === '1' || value === true;
                break;
            case 'date':
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push('Invalid date');
                }
                else {
                    value = date;
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    value = [value];
                }
                break;
        }
        return value;
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidUrl(url) {
        return URL.parse(url) !== null;
    }
}
/**
 * Create a form validator
 */
export function createFormValidator(schema) {
    return new FormValidator(schema);
}
// ============================================================================
// Form Parsing
// ============================================================================
/**
 * Parse URL-encoded form data
 */
export function parseFormData(body) {
    const params = new URLSearchParams(body);
    const result = {};
    params.forEach((value, key) => {
        if (key in result) {
            const existing = result[key];
            if (Array.isArray(existing)) {
                existing.push(value);
            }
            else if (existing !== undefined) {
                result[key] = [existing, value];
            }
        }
        else {
            result[key] = value;
        }
    });
    return result;
}
/**
 * Parse multipart form data
 */
export async function parseMultipartFormData(request) {
    const formData = await request.formData();
    const fields = {};
    const files = [];
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            const content = new Uint8Array(await value.arrayBuffer());
            files.push({
                fieldName: key,
                fileName: value.name,
                contentType: value.type,
                size: value.size,
                content,
            });
        }
        else {
            if (key in fields) {
                const existing = fields[key];
                if (Array.isArray(existing)) {
                    existing.push(value);
                }
                else {
                    fields[key] = [existing, value];
                }
            }
            else {
                fields[key] = value;
            }
        }
    }
    return { fields, files };
}
// ============================================================================
// CSRF Protection
// ============================================================================
/**
 * Generate a CSRF token
 */
export function generateCsrfToken() {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for non-browser environments
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Create a CSRF hidden field HTML
 */
export function csrfField(token, fieldName = '_csrf') {
    return `<input type="hidden" name="${fieldName}" value="${token}">`;
}
/**
 * CSRF validation middleware
 */
export function validateCsrf(formToken, sessionToken) {
    if (!formToken || !sessionToken) {
        return false;
    }
    return formToken === sessionToken;
}
// ============================================================================
// Form Builder
// ============================================================================
/**
 * Form builder for generating HTML forms
 */
export class FormBuilder {
    action = '';
    method = 'POST';
    enctype = 'application/x-www-form-urlencoded';
    csrfToken;
    fields = [];
    attributes = {};
    /**
     * Set form action
     */
    setAction(url) {
        this.action = url;
        return this;
    }
    /**
     * Set form method
     */
    setMethod(method) {
        this.method = method;
        return this;
    }
    /**
     * Enable multipart encoding for file uploads
     */
    multipart() {
        this.enctype = 'multipart/form-data';
        return this;
    }
    /**
     * Set CSRF token
     */
    csrf(token) {
        this.csrfToken = token;
        return this;
    }
    /**
     * Add a form attribute
     */
    attr(name, value) {
        this.attributes[name] = value;
        return this;
    }
    /**
     * Add a text input
     */
    text(name, options = {}) {
        this.fields.push(this.input('text', name, options));
        return this;
    }
    /**
     * Add an email input
     */
    email(name, options = {}) {
        this.fields.push(this.input('email', name, options));
        return this;
    }
    /**
     * Add a password input
     */
    password(name, options = {}) {
        this.fields.push(this.input('password', name, options));
        return this;
    }
    /**
     * Add a number input
     */
    number(name, options = {}) {
        this.fields.push(this.input('number', name, options));
        return this;
    }
    /**
     * Add a textarea
     */
    textarea(name, options = {}) {
        const { label, value = '', placeholder, required, rows = 4, cols, disabled, readonly, className, } = options;
        const attrs = [
            `name="${name}"`,
            `id="${name}"`,
            rows ? `rows="${rows}"` : '',
            cols ? `cols="${cols}"` : '',
            placeholder ? `placeholder="${placeholder}"` : '',
            required ? 'required' : '',
            disabled ? 'disabled' : '',
            readonly ? 'readonly' : '',
            className ? `class="${className}"` : '',
        ].filter(Boolean).join(' ');
        let html = '';
        if (label) {
            html += `<label for="${name}">${label}</label>`;
        }
        html += `<textarea ${attrs}>${this.escapeHtml(String(value))}</textarea>`;
        this.fields.push(html);
        return this;
    }
    /**
     * Add a select dropdown
     */
    select(name, options) {
        const { label, choices, value, required, disabled, multiple, className, } = options;
        const attrs = [
            `name="${name}"`,
            `id="${name}"`,
            required ? 'required' : '',
            disabled ? 'disabled' : '',
            multiple ? 'multiple' : '',
            className ? `class="${className}"` : '',
        ].filter(Boolean).join(' ');
        const optionsHtml = choices
            .map(choice => {
            const selected = (Array.isArray(value) ? value.includes(choice.value) : value === choice.value)
                ? 'selected'
                : '';
            return `<option value="${choice.value}" ${selected}>${choice.label}</option>`;
        })
            .join('');
        let html = '';
        if (label) {
            html += `<label for="${name}">${label}</label>`;
        }
        html += `<select ${attrs}>${optionsHtml}</select>`;
        this.fields.push(html);
        return this;
    }
    /**
     * Add a checkbox
     */
    checkbox(name, options = {}) {
        const { label, checked = false, value = 'true', disabled, className } = options;
        const attrs = [
            `type="checkbox"`,
            `name="${name}"`,
            `id="${name}"`,
            `value="${value}"`,
            checked ? 'checked' : '',
            disabled ? 'disabled' : '',
            className ? `class="${className}"` : '',
        ].filter(Boolean).join(' ');
        let html = `<input ${attrs}>`;
        if (label) {
            html += ` <label for="${name}">${label}</label>`;
        }
        this.fields.push(html);
        return this;
    }
    /**
     * Add a file input
     */
    file(name, options = {}) {
        const { label, accept, multiple, required, disabled, className } = options;
        const attrs = [
            `type="file"`,
            `name="${name}"`,
            `id="${name}"`,
            accept ? `accept="${accept}"` : '',
            multiple ? 'multiple' : '',
            required ? 'required' : '',
            disabled ? 'disabled' : '',
            className ? `class="${className}"` : '',
        ].filter(Boolean).join(' ');
        let html = '';
        if (label) {
            html += `<label for="${name}">${label}</label>`;
        }
        html += `<input ${attrs}>`;
        // Enable multipart if file input is added
        this.enctype = 'multipart/form-data';
        this.fields.push(html);
        return this;
    }
    /**
     * Add a submit button
     */
    submit(text = 'Submit', options = {}) {
        const { disabled, className } = options;
        const attrs = [
            `type="submit"`,
            disabled ? 'disabled' : '',
            className ? `class="${className}"` : '',
        ].filter(Boolean).join(' ');
        this.fields.push(`<button ${attrs}>${text}</button>`);
        return this;
    }
    /**
     * Add raw HTML
     */
    raw(html) {
        this.fields.push(html);
        return this;
    }
    /**
     * Build the form HTML
     */
    build() {
        const formAttrs = [
            `action="${this.action}"`,
            `method="${this.method}"`,
            `enctype="${this.enctype}"`,
            ...Object.entries(this.attributes).map(([k, v]) => `${k}="${v}"`),
        ].join(' ');
        let html = `<form ${formAttrs}>`;
        if (this.csrfToken) {
            html += csrfField(this.csrfToken);
        }
        html += this.fields.join('\n');
        html += '</form>';
        return html;
    }
    input(type, name, options) {
        const { label, value = '', placeholder, required, disabled, readonly, className, min, max, step, pattern, autocomplete, } = options;
        const attrs = [
            `type="${type}"`,
            `name="${name}"`,
            `id="${name}"`,
            value ? `value="${this.escapeHtml(String(value))}"` : '',
            placeholder ? `placeholder="${placeholder}"` : '',
            required ? 'required' : '',
            disabled ? 'disabled' : '',
            readonly ? 'readonly' : '',
            className ? `class="${className}"` : '',
            min !== undefined ? `min="${min}"` : '',
            max !== undefined ? `max="${max}"` : '',
            step !== undefined ? `step="${step}"` : '',
            pattern ? `pattern="${pattern}"` : '',
            autocomplete ? `autocomplete="${autocomplete}"` : '',
        ].filter(Boolean).join(' ');
        let html = '';
        if (label) {
            html += `<label for="${name}">${label}</label>`;
        }
        html += `<input ${attrs}>`;
        return html;
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
/**
 * Create a form builder
 */
export function createForm(action = '', method = 'POST') {
    return new FormBuilder().setAction(action).setMethod(method);
}
// ============================================================================
// Rust Code Generation
// ============================================================================
/**
 * Generate Rust form struct
 */
export function generateRustFormStruct(name, fields) {
    const fieldDefs = Object.entries(fields)
        .map(([fieldName, field]) => {
        const rustType = getRustType(field);
        const optional = !field.required;
        return `    pub ${fieldName}: ${optional ? `Option<${rustType}>` : rustType},`;
    })
        .join('\n');
    return `
use rocket::form::FromForm;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
pub struct ${name} {
${fieldDefs}
}

impl ${name} {
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        // Add validation logic here
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
`.trim();
}
function getRustType(field) {
    switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
            return 'String';
        case 'number':
            return 'i64';
        case 'boolean':
            return 'bool';
        case 'date':
            return 'chrono::NaiveDate';
        case 'file':
            return 'rocket::fs::TempFile<\'_>';
        case 'array':
            return 'Vec<String>';
        default:
            return 'String';
    }
}
//# sourceMappingURL=forms.js.map