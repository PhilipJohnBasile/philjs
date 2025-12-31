/**
 * Form lazy loading integration
 */
import { executeHandler } from '../runtime.js';
/**
 * Create a lazy handler wrapper (Qwik-style $() function)
 */
function $(handler) {
    const symbolId = `lazy_handler_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return {
        symbolId,
        handler,
        loaded: false,
    };
}
/**
 * Create a lazy form submit handler
 */
export function lazySubmit(handler) {
    const lazy = $(handler);
    return {
        symbolId: lazy.symbolId,
        handler: lazy.handler,
        loaded: lazy.loaded,
    };
}
/**
 * Create a lazy form change handler
 */
export function lazyChange(handler) {
    const lazy = $(handler);
    return {
        symbolId: lazy.symbolId,
        handler: lazy.handler,
        loaded: lazy.loaded,
    };
}
/**
 * Create a lazy form validation handler
 */
export function lazyValidate(handler) {
    const lazy = $(handler);
    return {
        symbolId: lazy.symbolId,
        handler: lazy.handler,
        loaded: lazy.loaded,
    };
}
/**
 * Handle form submission with lazy loading
 */
export async function handleLazySubmit(event, handler) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    return executeHandler(handler.symbolId, [formData, event]);
}
/**
 * Enhanced form with lazy handlers
 */
export class LazyForm {
    form;
    submitHandler;
    changeHandlers = new Map();
    validators = new Map();
    constructor(form) {
        this.form = form;
    }
    /**
     * Set submit handler
     */
    onSubmit(handler) {
        this.submitHandler = handler;
        this.form.addEventListener('submit', async (event) => {
            if (this.submitHandler) {
                await handleLazySubmit(event, this.submitHandler);
            }
        });
        return this;
    }
    /**
     * Set change handler for a field
     */
    onChange(name, handler) {
        this.changeHandlers.set(name, handler);
        const field = this.form.elements.namedItem(name);
        if (field) {
            field.addEventListener('change', async (event) => {
                const handler = this.changeHandlers.get(name);
                if (handler) {
                    await executeHandler(handler.symbolId, [
                        field.value,
                        name,
                        event,
                    ]);
                }
            });
        }
        return this;
    }
    /**
     * Set validator for a field
     */
    validate(name, handler) {
        this.validators.set(name, handler);
        return this;
    }
    /**
     * Run validation for a field
     */
    async validateField(name, value) {
        const validator = this.validators.get(name);
        if (!validator) {
            return null;
        }
        const values = this.getValues();
        return executeHandler(validator.symbolId, [value, values]);
    }
    /**
     * Run validation for all fields
     */
    async validateAll() {
        const errors = {};
        const values = this.getValues();
        for (const [name, validator] of this.validators) {
            const value = values[name];
            const error = await executeHandler(validator.symbolId, [
                value,
                values,
            ]);
            errors[name] = error;
        }
        return errors;
    }
    /**
     * Get form values
     */
    getValues() {
        const formData = new FormData(this.form);
        const values = {};
        for (const [key, value] of Array.from(formData)) {
            values[key] = value;
        }
        return values;
    }
    /**
     * Set form values
     */
    setValues(values) {
        for (const [name, value] of Object.entries(values)) {
            const field = this.form.elements.namedItem(name);
            if (field) {
                field.value = value;
            }
        }
    }
    /**
     * Reset form
     */
    reset() {
        this.form.reset();
    }
}
/**
 * Create a lazy form instance
 */
export function createLazyForm(form) {
    return new LazyForm(form);
}
//# sourceMappingURL=forms.js.map