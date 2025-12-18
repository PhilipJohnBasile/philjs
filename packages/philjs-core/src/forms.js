/**
 * Form validation system with progressive enhancement.
 * Type-safe validation with schema builder.
 */
import { signal } from "./signals.js";
// ============================================================================
// Schema Builder API
// ============================================================================
class Schema {
    config;
    constructor(config) {
        this.config = config;
    }
    required(message) {
        this.config.required = true;
        if (message) {
            this.config.rules = this.config.rules || [];
            this.config.rules.unshift({
                validate: (val) => val != null && val !== "",
                message,
            });
        }
        return this;
    }
    min(min, message) {
        this.config.rules = this.config.rules || [];
        this.config.rules.push({
            validate: (val) => {
                if (typeof val === "string" || Array.isArray(val))
                    return val.length >= min;
                if (typeof val === "number")
                    return val >= min;
                return false;
            },
            message: message || ((val) => {
                if (typeof val === "string")
                    return `Must be at least ${min} characters`;
                if (typeof val === "number")
                    return `Must be at least ${min}`;
                return `Must have at least ${min} items`;
            }),
        });
        return this;
    }
    max(max, message) {
        this.config.rules = this.config.rules || [];
        this.config.rules.push({
            validate: (val) => {
                if (typeof val === "string" || Array.isArray(val))
                    return val.length <= max;
                if (typeof val === "number")
                    return val <= max;
                return false;
            },
            message: message || ((val) => {
                if (typeof val === "string")
                    return `Must be at most ${max} characters`;
                if (typeof val === "number")
                    return `Must be at most ${max}`;
                return `Must have at most ${max} items`;
            }),
        });
        return this;
    }
    pattern(regex, message) {
        this.config.rules = this.config.rules || [];
        this.config.rules.push({
            validate: (val) => {
                if (typeof val !== "string")
                    return false;
                return regex.test(val);
            },
            message: message || `Invalid format`,
        });
        return this;
    }
    email(message) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.pattern(emailRegex, message || "Invalid email address");
    }
    url(message) {
        this.config.rules = this.config.rules || [];
        this.config.rules.push({
            validate: (val) => {
                if (typeof val !== "string")
                    return false;
                try {
                    new URL(val);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: message || "Invalid URL",
        });
        return this;
    }
    custom(rule) {
        this.config.rules = this.config.rules || [];
        this.config.rules.push(rule);
        return this;
    }
    transform(fn) {
        this.config.transform = fn;
        return this;
    }
    default(value) {
        this.config.defaultValue = value;
        return this;
    }
    getConfig() {
        return this.config;
    }
}
// ============================================================================
// Schema Builders
// ============================================================================
export const v = {
    string() {
        return new Schema({ type: "string" });
    },
    number() {
        return new Schema({
            type: "number",
            transform: (val) => {
                const num = Number(val);
                return isNaN(num) ? 0 : num;
            },
        });
    },
    boolean() {
        return new Schema({
            type: "boolean",
            transform: (val) => val === true || val === "true" || val === "on",
        });
    },
    email() {
        return new Schema({ type: "email" }).email();
    },
    url() {
        return new Schema({ type: "url" }).url();
    },
    date() {
        return new Schema({
            type: "date",
            transform: (val) => {
                if (val instanceof Date)
                    return val;
                return new Date(val);
            },
        });
    },
    custom(validator) {
        return new Schema({ type: "custom" });
    },
};
export function useForm(options) {
    const { schema, initialValues, onSubmit, validateOnChange = false, validateOnBlur = true } = options;
    // Extract schemas and build initial values
    const schemaConfigs = {};
    const defaults = {};
    for (const [key, schemaInstance] of Object.entries(schema)) {
        const config = schemaInstance.getConfig();
        schemaConfigs[key] = config;
        if (config.defaultValue !== undefined) {
            defaults[key] = config.defaultValue;
        }
    }
    // State signals
    const values = signal({ ...defaults, ...initialValues });
    const errors = signal({});
    const touched = signal({});
    const dirty = signal({});
    const isValid = signal(true);
    const isSubmitting = signal(false);
    const submitCount = signal(0);
    // Validate single field
    async function validateField(field) {
        const config = schemaConfigs[field];
        if (!config)
            return true;
        const value = values()[field];
        const fieldErrors = [];
        // Required check
        if (config.required && (value == null || value === "")) {
            fieldErrors.push(`${String(field)} is required`);
        }
        // Run validation rules
        if (config.rules && value != null && value !== "") {
            for (const rule of config.rules) {
                const isValid = await rule.validate(value);
                if (!isValid) {
                    const message = typeof rule.message === "function" ? rule.message(value) : rule.message;
                    fieldErrors.push(message);
                }
            }
        }
        // Update errors
        const currentErrors = errors();
        if (fieldErrors.length > 0) {
            errors.set({ ...currentErrors, [field]: fieldErrors });
            return false;
        }
        else {
            const { [field]: _, ...rest } = currentErrors;
            errors.set(rest);
            return true;
        }
    }
    // Validate all fields
    async function validate(field) {
        if (field) {
            return validateField(field);
        }
        const validationResults = await Promise.all(Object.keys(schemaConfigs).map((key) => validateField(key)));
        const allValid = validationResults.every((v) => v);
        isValid.set(allValid);
        return allValid;
    }
    // Set value and optionally validate
    function setValue(field, value) {
        const config = schemaConfigs[field];
        // Apply transformation if defined
        let transformedValue = value;
        if (config?.transform) {
            transformedValue = config.transform(value);
        }
        const currentValues = values();
        values.set({ ...currentValues, [field]: transformedValue });
        const currentDirty = dirty();
        dirty.set({ ...currentDirty, [field]: true });
        if (validateOnChange) {
            validateField(field);
        }
    }
    // Set error
    function setError(field, message) {
        const currentErrors = errors();
        errors.set({ ...currentErrors, [field]: [message] });
        isValid.set(false);
    }
    // Clear error
    function clearError(field) {
        const currentErrors = errors();
        const { [field]: _, ...rest } = currentErrors;
        errors.set(rest);
    }
    // Set touched
    function setTouched(field, touchedValue) {
        const currentTouched = touched();
        touched.set({ ...currentTouched, [field]: touchedValue });
    }
    // Handle change event
    function handleChange(field) {
        return (e) => {
            const target = e.target;
            const config = schemaConfigs[field];
            let value = target.value;
            // Type transformation
            if (config?.type === "number") {
                value = target.valueAsNumber;
            }
            else if (config?.type === "boolean") {
                value = target.checked;
            }
            else if (config?.type === "date") {
                value = target.valueAsDate;
            }
            // Custom transformation
            if (config?.transform) {
                value = config.transform(value);
            }
            setValue(field, value);
        };
    }
    // Handle blur event
    function handleBlur(field) {
        return (e) => {
            setTouched(field, true);
            if (validateOnBlur) {
                validateField(field);
            }
        };
    }
    // Handle submit
    async function handleSubmit(e) {
        if (e) {
            e.preventDefault();
        }
        submitCount.set(submitCount() + 1);
        // Mark all fields as touched
        const allTouched = {};
        for (const key of Object.keys(schemaConfigs)) {
            allTouched[key] = true;
        }
        touched.set(allTouched);
        // Validate all fields
        const valid = await validate();
        if (!valid) {
            return;
        }
        // Submit
        isSubmitting.set(true);
        try {
            await onSubmit(values());
        }
        catch (error) {
            console.error("Form submission error:", error);
            throw error;
        }
        finally {
            isSubmitting.set(false);
        }
    }
    // Reset form
    function reset() {
        values.set({ ...defaults, ...initialValues });
        errors.set({});
        touched.set({});
        dirty.set({});
        isValid.set(true);
        isSubmitting.set(false);
        submitCount.set(0);
    }
    return {
        values,
        errors,
        touched,
        dirty,
        isValid,
        isSubmitting,
        submitCount,
        setValue,
        setError,
        clearError,
        setTouched,
        validate,
        handleSubmit,
        handleChange,
        handleBlur,
        reset,
    };
}
export function createField() {
    return {
        Input: (props) => {
            const { form, name, label, placeholder, type = "text", className } = props;
            const value = form.values()[name];
            const errorMessages = form.errors()[name] || [];
            const isTouched = form.touched()[name];
            const showError = isTouched && errorMessages.length > 0;
            return {
                type: "div",
                props: {
                    className: `field ${className || ""}`.trim(),
                    children: [
                        label && {
                            type: "label",
                            props: {
                                htmlFor: String(name),
                                children: label,
                            },
                        },
                        {
                            type: "input",
                            props: {
                                id: String(name),
                                name: String(name),
                                type,
                                value: value || "",
                                placeholder,
                                onChange: form.handleChange(name),
                                onBlur: form.handleBlur(name),
                                "aria-invalid": showError,
                                "aria-describedby": showError ? `${String(name)}-error` : undefined,
                            },
                        },
                        showError && {
                            type: "div",
                            props: {
                                id: `${String(name)}-error`,
                                className: "field-error",
                                role: "alert",
                                children: errorMessages[0],
                            },
                        },
                    ].filter(Boolean),
                },
            };
        },
        TextArea: (props) => {
            const { form, name, label, placeholder, rows = 4, className } = props;
            const value = form.values()[name];
            const errorMessages = form.errors()[name] || [];
            const isTouched = form.touched()[name];
            const showError = isTouched && errorMessages.length > 0;
            return {
                type: "div",
                props: {
                    className: `field ${className || ""}`.trim(),
                    children: [
                        label && {
                            type: "label",
                            props: {
                                htmlFor: String(name),
                                children: label,
                            },
                        },
                        {
                            type: "textarea",
                            props: {
                                id: String(name),
                                name: String(name),
                                value: value || "",
                                placeholder,
                                rows,
                                onChange: form.handleChange(name),
                                onBlur: form.handleBlur(name),
                                "aria-invalid": showError,
                                "aria-describedby": showError ? `${String(name)}-error` : undefined,
                            },
                        },
                        showError && {
                            type: "div",
                            props: {
                                id: `${String(name)}-error`,
                                className: "field-error",
                                role: "alert",
                                children: errorMessages[0],
                            },
                        },
                    ].filter(Boolean),
                },
            };
        },
        Checkbox: (props) => {
            const { form, name, label, className } = props;
            const value = form.values()[name];
            const errorMessages = form.errors()[name] || [];
            const isTouched = form.touched()[name];
            const showError = isTouched && errorMessages.length > 0;
            return {
                type: "div",
                props: {
                    className: `field field-checkbox ${className || ""}`.trim(),
                    children: [
                        {
                            type: "label",
                            props: {
                                children: [
                                    {
                                        type: "input",
                                        props: {
                                            id: String(name),
                                            name: String(name),
                                            type: "checkbox",
                                            checked: !!value,
                                            onChange: form.handleChange(name),
                                            onBlur: form.handleBlur(name),
                                            "aria-invalid": showError,
                                            "aria-describedby": showError ? `${String(name)}-error` : undefined,
                                        },
                                    },
                                    label && {
                                        type: "span",
                                        props: {
                                            children: label,
                                        },
                                    },
                                ].filter(Boolean),
                            },
                        },
                        showError && {
                            type: "div",
                            props: {
                                id: `${String(name)}-error`,
                                className: "field-error",
                                role: "alert",
                                children: errorMessages[0],
                            },
                        },
                    ].filter(Boolean),
                },
            };
        },
    };
}
//# sourceMappingURL=forms.js.map