/**
 * Form management with reactive signals
 */
import { type Signal, type Memo } from 'philjs-core/signals';
import type { FormValues, FormErrors, TouchedFields, FormConfig, FormState, FieldError } from './types.js';
export declare class Form<T extends FormValues = FormValues> {
    private valuesSignal;
    private errorsSignal;
    private touchedSignal;
    private isSubmittingSignal;
    private isValidatingSignal;
    private submitCountSignal;
    private initialValues;
    private config;
    constructor(config?: FormConfig<T>);
    /**
     * Get form values as signal
     */
    get values(): Signal<T>;
    /**
     * Get form errors as signal
     */
    get errors(): Signal<FormErrors<T>>;
    /**
     * Get touched fields as signal
     */
    get touched(): Signal<TouchedFields<T>>;
    /**
     * Computed: is form valid
     */
    get isValid(): any;
    /**
     * Computed: is form dirty (has changes)
     */
    get isDirty(): any;
    /**
     * Get submitting state
     */
    get isSubmitting(): Signal<boolean>;
    /**
     * Get validating state
     */
    get isValidating(): Signal<boolean>;
    /**
     * Get submit count
     */
    get submitCount(): Signal<number>;
    /**
     * Get complete form state
     */
    get state(): Memo<FormState<T>>;
    /**
     * Set field value
     */
    setFieldValue<K extends keyof T>(name: K, value: T[K]): void;
    /**
     * Set multiple field values
     */
    setValues(values: Partial<T>): void;
    /**
     * Set field error
     */
    setFieldError<K extends keyof T>(name: K, error: FieldError): void;
    /**
     * Set multiple errors
     */
    setErrors(errors: FormErrors<T>): void;
    /**
     * Mark field as touched
     */
    setFieldTouched<K extends keyof T>(name: K, touched?: boolean): void;
    /**
     * Mark all fields as touched
     */
    setTouched(touched: TouchedFields<T>): void;
    /**
     * Reset form to initial values
     */
    reset(): void;
    /**
     * Reset to new values
     */
    resetWith(values: Partial<T>): void;
    /**
     * Validate a single field
     */
    validateField<K extends keyof T>(name: K): Promise<FieldError>;
    /**
     * Validate entire form
     */
    validate(): Promise<FormErrors<T>>;
    /**
     * Handle form submission
     */
    handleSubmit(e?: Event): Promise<void>;
    /**
     * Get field props for binding
     */
    getFieldProps<K extends keyof T>(name: K): {
        name: string;
        value: any;
        error: any;
        touched: any;
        onChange: (value: T[K]) => void;
        onBlur: () => void;
    };
}
/**
 * Create a form instance
 */
export declare function createForm<T extends FormValues = FormValues>(config?: FormConfig<T>): Form<T>;
/**
 * Hook-like function to use a form
 */
export declare function useForm<T extends FormValues = FormValues>(config?: FormConfig<T>): {
    values: Signal<T_1>;
    errors: Signal<FormErrors<T_1>>;
    touched: Signal<TouchedFields<T_1>>;
    isValid: any;
    isDirty: any;
    isSubmitting: Signal<boolean>;
    isValidating: Signal<boolean>;
    submitCount: Signal<number>;
    state: Memo<FormState<T_1>>;
    setFieldValue: <K extends keyof T>(name: K, value: T[K]) => void;
    setValues: (values: Partial<T>) => void;
    setFieldError: <K extends keyof T>(name: K, error: FieldError) => void;
    setErrors: (errors: FormErrors<T>) => void;
    setFieldTouched: <K extends keyof T>(name: K, touched?: boolean) => void;
    setTouched: (touched: TouchedFields<T>) => void;
    reset: () => void;
    resetWith: (values: Partial<T>) => void;
    validate: () => Promise<FormErrors<T>>;
    validateField: <K extends keyof T>(name: K) => Promise<FieldError>;
    handleSubmit: (e?: Event) => Promise<void>;
    getFieldProps: <K extends keyof T>(name: K) => {
        name: string;
        value: any;
        error: any;
        touched: any;
        onChange: (value: T[K]) => void;
        onBlur: () => void;
    };
};
//# sourceMappingURL=form.d.ts.map