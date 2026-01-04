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
const createAbortError = () => {
    const error = new Error('Validation aborted');
    error.name = 'AbortError';
    return error;
};
const waitForDelay = (ms, signal) => {
    if (signal.aborted) {
        return Promise.reject(createAbortError());
    }
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(createAbortError());
        };
        const timeout = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);
        const cleanup = () => {
            clearTimeout(timeout);
            signal.removeEventListener('abort', onAbort);
        };
        signal.addEventListener('abort', onAbort, { once: true });
    });
};
const raceWithAbort = (promise, signal) => {
    if (signal.aborted) {
        return Promise.reject(createAbortError());
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(createAbortError());
        };
        const cleanup = () => {
            signal.removeEventListener('abort', onAbort);
        };
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then((value) => {
            cleanup();
            resolve(value);
        }, (error) => {
            cleanup();
            reject(error);
        });
    });
};
// =============================================================================
// Advanced Validators
// =============================================================================
export const advancedValidators = {
    /**
     * Async email validation with domain check
     */
    emailWithDomainCheck: (allowedDomains, message = 'Invalid email or domain not allowed') => ({
        validate: async (value) => {
            if (!value)
                return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value))
                return false;
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
    usernameAvailable: (checkFn, message = 'Username is already taken') => ({
        validate: async (value) => {
            if (!value || value.length < 3)
                return true;
            return await checkFn(value);
        },
        message,
        debounce: 500,
    }),
    /**
     * Password strength validation
     */
    passwordStrength: (minStrength = 'medium', message) => ({
        validate: (value) => {
            if (!value)
                return true;
            const hasLower = /[a-z]/.test(value);
            const hasUpper = /[A-Z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            const length = value.length;
            switch (minStrength) {
                case 'weak':
                    return length >= 8;
                case 'medium':
                    return length >= 8 && hasLower && hasUpper && hasNumber;
                case 'strong':
                    return length >= 8 && hasLower && hasUpper && hasNumber && hasSpecial;
                case 'very-strong':
                    return length >= 12 && hasLower && hasUpper && hasNumber && hasSpecial;
                default:
                    return false;
            }
        },
        message: message || `Password must be ${minStrength} or stronger`,
    }),
    /**
     * File validation
     */
    file: (options) => ({
        validate: (value) => {
            if (!value)
                return true;
            const supportsFileList = typeof FileList !== 'undefined';
            const files = supportsFileList && value instanceof FileList
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
    date: (options) => ({
        validate: (value) => {
            if (!value)
                return true;
            const date = typeof value === 'string' ? new Date(value) : value;
            if (isNaN(date.getTime()))
                return false;
            if (options.min && date < options.min)
                return false;
            if (options.max && date > options.max)
                return false;
            if (options.excludeWeekends) {
                const day = date.getUTCDay();
                if (day === 0 || day === 6)
                    return false;
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
    array: (options) => ({
        validate: (value) => {
            if (!Array.isArray(value))
                return false;
            if (options.min !== undefined && value.length < options.min)
                return false;
            if (options.max !== undefined && value.length > options.max)
                return false;
            if (options.unique) {
                const uniqueSet = new Set(value.map(v => JSON.stringify(v)));
                if (uniqueSet.size !== value.length)
                    return false;
            }
            if (options.itemValidator) {
                for (const item of value) {
                    if (!options.itemValidator.validate(item))
                        return false;
                }
            }
            return true;
        },
        message: 'Invalid array',
    }),
    /**
     * Credit card validation with Luhn algorithm
     */
    creditCard: (message = 'Invalid credit card number') => ({
        validate: (value) => {
            if (!value)
                return true;
            const digits = value.replace(/\D/g, '');
            if (digits.length < 13 || digits.length > 19)
                return false;
            let sum = 0;
            let isEven = false;
            for (let i = digits.length - 1; i >= 0; i--) {
                let digit = parseInt(digits[i], 10);
                if (isEven) {
                    digit *= 2;
                    if (digit > 9)
                        digit -= 9;
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
    iban: (message = 'Invalid IBAN') => ({
        validate: (value) => {
            if (!value)
                return true;
            const iban = value.replace(/\s/g, '').toUpperCase();
            if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban))
                return false;
            const rearranged = iban.slice(4) + iban.slice(0, 4);
            const numericIban = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());
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
    json: (message = 'Invalid JSON') => ({
        validate: (value) => {
            if (!value)
                return true;
            try {
                JSON.parse(value);
                return true;
            }
            catch {
                return false;
            }
        },
        message,
    }),
    /**
     * Slug validation
     */
    slug: (message = 'Invalid slug format') => ({
        validate: (value) => {
            if (!value)
                return true;
            return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
        },
        message,
    }),
    /**
     * UUID validation
     */
    uuid: (version, message = 'Invalid UUID') => ({
        validate: (value) => {
            if (!value)
                return true;
            const patterns = {
                default: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            };
            const pattern = version ? patterns[version] : patterns['default'];
            return pattern.test(value);
        },
        message,
    }),
};
// =============================================================================
// Schema Validator
// =============================================================================
export class SchemaValidator {
    schema;
    pendingValidations = new Map();
    constructor(schema) {
        this.schema = schema;
    }
    /**
     * Validate all fields
     */
    async validate(values, context) {
        const errors = {};
        const warnings = {};
        const fieldResults = new Map();
        // Validate each field
        const fields = new Set();
        for (const field of Object.keys(this.schema.rules || {})) {
            fields.add(field);
        }
        for (const field of Object.keys(this.schema.asyncRules || {})) {
            fields.add(field);
        }
        for (const field of Object.keys(this.schema.conditionalRules || {})) {
            fields.add(field);
        }
        for (const field of fields) {
            const value = values[field];
            const result = await this.validateField(field, value, values, context);
            fieldResults.set(field, result);
            if (result.error) {
                errors[field] = result.error;
            }
            if (result.warning) {
                warnings[field] = result.warning;
            }
        }
        // Cross-field validation
        for (const rule of this.schema.crossFieldRules || []) {
            const fieldValues = {};
            for (const field of rule.fields) {
                fieldValues[field] = values[field];
            }
            const valid = await rule.validate(fieldValues);
            if (!valid && rule.target) {
                errors[rule.target] = rule.message;
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
    async validateField(field, value, allValues, context) {
        const result = {
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
                    result.error = typeof rule.message === 'function'
                        ? rule.message(value)
                        : rule.message;
                    return result;
                }
            }
        }
        // Async rules
        const asyncRules = this.schema.asyncRules?.[field];
        if (asyncRules) {
            // Cancel previous async validation for this field
            const prevController = this.pendingValidations.get(field);
            if (prevController) {
                prevController.abort();
            }
            const controller = new AbortController();
            this.pendingValidations.set(field, controller);
            result.asyncPending = true;
            const ruleArray = Array.isArray(asyncRules) ? asyncRules : [asyncRules];
            for (const rule of ruleArray) {
                try {
                    await waitForDelay(rule.debounce ?? 0, controller.signal);
                    if (controller.signal.aborted) {
                        throw createAbortError();
                    }
                    const valid = await raceWithAbort(Promise.resolve(rule.validate(value, allValues, {
                        fieldName: field,
                        touched: context?.touched ?? false,
                        dirty: context?.dirty ?? false,
                        submitting: context?.submitting ?? false,
                        submitted: context?.submitted ?? false,
                        signal: controller.signal,
                    })), controller.signal);
                    if (!valid) {
                        result.valid = false;
                        result.error = typeof rule.message === 'function'
                            ? rule.message(value)
                            : rule.message;
                        break;
                    }
                }
                catch (error) {
                    if (error.name === 'AbortError') {
                        // Validation was cancelled
                        result.asyncPending = false;
                        return result;
                    }
                    throw error;
                }
            }
            this.pendingValidations.delete(field);
            result.asyncPending = false;
        }
        return result;
    }
    /**
     * Validate a group
     */
    async validateGroup(groupName, values) {
        const group = this.schema.groups?.find(g => g.name === groupName);
        if (!group)
            return {};
        const errors = {};
        for (const field of group.fields) {
            const value = values[field];
            const result = await this.validateField(field, value, values);
            if (result.error) {
                errors[field] = result.error;
            }
        }
        return errors;
    }
    /**
     * Cancel all pending validations
     */
    cancelPending() {
        for (const controller of this.pendingValidations.values()) {
            controller.abort();
        }
        this.pendingValidations.clear();
    }
}
/**
 * Create a schema validator
 */
export function createSchemaValidator(schema) {
    return new SchemaValidator(schema);
}
// =============================================================================
// Validation Utilities
// =============================================================================
/**
 * Create conditional validation rule
 */
export function when(condition, rule) {
    return { when: condition, rule };
}
/**
 * Create cross-field validation
 */
export function crossField(fields, validate, message, target) {
    const result = { fields, validate, message };
    if (target !== undefined) {
        result.target = target;
    }
    return result;
}
/**
 * Validate if field depends on another
 */
export function dependsOn(fieldName, condition, rule) {
    return {
        when: (values) => condition(values[fieldName]),
        rule,
    };
}
/**
 * Create validation message with field name
 */
export function messageWithField(template) {
    return (fieldName) => template.replace('{field}', fieldName);
}
/**
 * Combine multiple validation results
 */
export function combineResults(results) {
    const combined = {
        valid: true,
        errors: {},
        warnings: {},
        fieldResults: new Map(),
    };
    for (const result of results) {
        if (!result.valid)
            combined.valid = false;
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
export function formatErrors(errors, labels) {
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
export function hasErrors(errors) {
    return Object.values(errors).some(Boolean);
}
/**
 * Get first error
 */
export function getFirstError(errors) {
    for (const [field, error] of Object.entries(errors)) {
        if (error)
            return [field, error];
    }
    return null;
}
//# sourceMappingURL=advanced-validation.js.map