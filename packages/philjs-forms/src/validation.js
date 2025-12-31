/**
 * Form validation utilities with Zod integration
 */
/**
 * Built-in validation rules
 */
export const validators = {
    required: (message = 'This field is required') => ({
        validate: (value) => {
            if (value === null || value === undefined || value === '')
                return false;
            if (Array.isArray(value))
                return value.length > 0;
            return true;
        },
        message
    }),
    email: (message = 'Invalid email address') => ({
        validate: (value) => {
            if (!value)
                return true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },
        message
    }),
    minLength: (min, message) => ({
        validate: (value) => {
            if (!value)
                return true;
            return value.length >= min;
        },
        message: message || `Must be at least ${min} characters`
    }),
    maxLength: (max, message) => ({
        validate: (value) => {
            if (!value)
                return true;
            return value.length <= max;
        },
        message: message || `Must be at most ${max} characters`
    }),
    min: (min, message) => ({
        validate: (value) => {
            if (value === null || value === undefined)
                return true;
            return value >= min;
        },
        message: message || `Must be at least ${min}`
    }),
    max: (max, message) => ({
        validate: (value) => {
            if (value === null || value === undefined)
                return true;
            return value <= max;
        },
        message: message || `Must be at most ${max}`
    }),
    pattern: (regex, message = 'Invalid format') => ({
        validate: (value) => {
            if (!value)
                return true;
            return regex.test(value);
        },
        message
    }),
    url: (message = 'Invalid URL') => ({
        validate: (value) => {
            if (!value)
                return true;
            return URL.parse(value) !== null;
        },
        message
    }),
    matches: (field, message) => ({
        validate: (value, values) => {
            if (!values)
                return true;
            return value === values[field];
        },
        message: message || `Must match ${field}`
    }),
    oneOf: (options, message) => ({
        validate: (value) => {
            return options.includes(value);
        },
        message: message || `Must be one of: ${options.join(', ')}`
    }),
    custom: (fn, message) => ({
        validate: fn,
        message
    })
};
/**
 * Validate a value against rules
 */
export async function validateValue(value, rules, allValues) {
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
export function zodValidator(schema) {
    return async (values) => {
        try {
            await schema.parseAsync(values);
            return {};
        }
        catch (error) {
            const errors = {};
            if (error.errors) {
                for (const err of error.errors) {
                    const field = err.path[0];
                    if (field) {
                        errors[field] = err.message;
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
export function createZodValidator(schema) {
    const validator = zodValidator(schema);
    return {
        validate: validator,
        validateField: async (name, value) => {
            try {
                // Validate just this field
                const fieldSchema = schema.shape[name];
                if (fieldSchema) {
                    await fieldSchema.parseAsync(value);
                }
                return null;
            }
            catch (error) {
                return error.errors?.[0]?.message || 'Invalid value';
            }
        }
    };
}
/**
 * Compose multiple validators
 */
export function composeValidators(...validators) {
    return async (values) => {
        const allErrors = {};
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
export function debounceValidation(fn, delay = 300) {
    let timeoutId = null;
    return ((...args) => {
        if (timeoutId)
            clearTimeout(timeoutId);
        return new Promise((resolve) => {
            timeoutId = setTimeout(async () => {
                const result = await fn(...args);
                resolve(result);
            }, delay);
        });
    });
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
//# sourceMappingURL=validation.js.map