/**
 * Form management with reactive signals
 */
import { signal, memo, batch } from 'philjs-core/signals';
export class Form {
    valuesSignal;
    errorsSignal;
    touchedSignal;
    isSubmittingSignal;
    isValidatingSignal;
    submitCountSignal;
    initialValues;
    config;
    constructor(config = {}) {
        this.config = config;
        this.initialValues = (config.initialValues || {});
        this.valuesSignal = signal(this.initialValues);
        this.errorsSignal = signal({});
        this.touchedSignal = signal({});
        this.isSubmittingSignal = signal(false);
        this.isValidatingSignal = signal(false);
        this.submitCountSignal = signal(0);
        if (config.validateOnMount) {
            this.validate();
        }
    }
    /**
     * Get form values as signal
     */
    get values() {
        return this.valuesSignal;
    }
    /**
     * Get form errors as signal
     */
    get errors() {
        return this.errorsSignal;
    }
    /**
     * Get touched fields as signal
     */
    get touched() {
        return this.touchedSignal;
    }
    /**
     * Computed: is form valid
     */
    get isValid() {
        return memo(() => {
            const errors = this.errorsSignal();
            return Object.values(errors).every(error => !error);
        });
    }
    /**
     * Computed: is form dirty (has changes)
     */
    get isDirty() {
        return memo(() => {
            const current = this.valuesSignal();
            return JSON.stringify(current) !== JSON.stringify(this.initialValues);
        });
    }
    /**
     * Get submitting state
     */
    get isSubmitting() {
        return this.isSubmittingSignal;
    }
    /**
     * Get validating state
     */
    get isValidating() {
        return this.isValidatingSignal;
    }
    /**
     * Get submit count
     */
    get submitCount() {
        return this.submitCountSignal;
    }
    /**
     * Get complete form state
     */
    get state() {
        return memo(() => ({
            values: this.valuesSignal(),
            errors: this.errorsSignal(),
            touched: this.touchedSignal(),
            isValid: this.isValid(),
            isSubmitting: this.isSubmittingSignal(),
            isValidating: this.isValidatingSignal(),
            isDirty: this.isDirty(),
            submitCount: this.submitCountSignal()
        }));
    }
    /**
     * Set field value
     */
    setFieldValue(name, value) {
        const current = this.valuesSignal();
        this.valuesSignal.set({ ...current, [name]: value });
        if (this.config.validateOn === 'change') {
            this.validateField(name);
        }
    }
    /**
     * Set multiple field values
     */
    setValues(values) {
        const current = this.valuesSignal();
        this.valuesSignal.set({ ...current, ...values });
        if (this.config.validateOn === 'change') {
            this.validate();
        }
    }
    /**
     * Set field error
     */
    setFieldError(name, error) {
        const current = this.errorsSignal();
        this.errorsSignal.set({ ...current, [name]: error });
    }
    /**
     * Set multiple errors
     */
    setErrors(errors) {
        this.errorsSignal.set(errors);
    }
    /**
     * Mark field as touched
     */
    setFieldTouched(name, touched = true) {
        const current = this.touchedSignal();
        this.touchedSignal.set({ ...current, [name]: touched });
        if (touched && this.config.validateOn === 'blur') {
            this.validateField(name);
        }
    }
    /**
     * Mark all fields as touched
     */
    setTouched(touched) {
        this.touchedSignal.set(touched);
    }
    /**
     * Reset form to initial values
     */
    reset() {
        batch(() => {
            this.valuesSignal.set(this.initialValues);
            this.errorsSignal.set({});
            this.touchedSignal.set({});
            this.isSubmittingSignal.set(false);
            this.isValidatingSignal.set(false);
            this.submitCountSignal.set(0);
        });
    }
    /**
     * Reset to new values
     */
    resetWith(values) {
        this.initialValues = { ...this.initialValues, ...values };
        this.reset();
    }
    /**
     * Validate a single field
     */
    async validateField(name) {
        // Override in subclass or use validation rules
        return null;
    }
    /**
     * Validate entire form
     */
    async validate() {
        this.isValidatingSignal.set(true);
        const errors = {};
        const values = this.valuesSignal();
        for (const name in values) {
            const error = await this.validateField(name);
            if (error) {
                errors[name] = error;
            }
        }
        this.errorsSignal.set(errors);
        this.isValidatingSignal.set(false);
        return errors;
    }
    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        if (e) {
            e.preventDefault();
        }
        // Mark all fields as touched
        const values = this.valuesSignal();
        const touched = {};
        for (const name in values) {
            touched[name] = true;
        }
        this.setTouched(touched);
        // Validate
        const errors = await this.validate();
        const hasErrors = Object.values(errors).some(error => error);
        if (hasErrors) {
            return;
        }
        // Submit
        this.isSubmittingSignal.set(true);
        this.submitCountSignal.set(this.submitCountSignal() + 1);
        try {
            if (this.config.onSubmit) {
                await this.config.onSubmit(values);
            }
        }
        catch (error) {
            console.error('Form submission error:', error);
            throw error;
        }
        finally {
            this.isSubmittingSignal.set(false);
        }
    }
    /**
     * Get field props for binding
     */
    getFieldProps(name) {
        return {
            name: String(name),
            value: memo(() => this.valuesSignal()[name]),
            error: memo(() => this.errorsSignal()[name]),
            touched: memo(() => this.touchedSignal()[name]),
            onChange: (value) => this.setFieldValue(name, value),
            onBlur: () => this.setFieldTouched(name, true)
        };
    }
}
/**
 * Create a form instance
 */
export function createForm(config) {
    return new Form(config);
}
/**
 * Hook-like function to use a form
 */
export function useForm(config) {
    const form = new Form(config);
    return {
        values: form.values,
        errors: form.errors,
        touched: form.touched,
        isValid: form.isValid,
        isDirty: form.isDirty,
        isSubmitting: form.isSubmitting,
        isValidating: form.isValidating,
        submitCount: form.submitCount,
        state: form.state,
        setFieldValue: form.setFieldValue.bind(form),
        setValues: form.setValues.bind(form),
        setFieldError: form.setFieldError.bind(form),
        setErrors: form.setErrors.bind(form),
        setFieldTouched: form.setFieldTouched.bind(form),
        setTouched: form.setTouched.bind(form),
        reset: form.reset.bind(form),
        resetWith: form.resetWith.bind(form),
        validate: form.validate.bind(form),
        validateField: form.validateField.bind(form),
        handleSubmit: form.handleSubmit.bind(form),
        getFieldProps: form.getFieldProps.bind(form)
    };
}
//# sourceMappingURL=form.js.map