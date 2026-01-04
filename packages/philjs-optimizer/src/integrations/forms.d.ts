/**
 * Form lazy loading integration
 */
/**
 * Lazy form handler
 */
export interface LazyFormHandler {
    symbolId: string;
    handler: (formData: FormData, event?: Event) => any;
    loaded: boolean;
}
/**
 * Create a lazy form submit handler
 */
export declare function lazySubmit(handler: (formData: FormData, event?: Event) => any): LazyFormHandler;
/**
 * Create a lazy form change handler
 */
export declare function lazyChange(handler: (value: any, name: string, event?: Event) => any): LazyFormHandler;
/**
 * Create a lazy form validation handler
 */
export declare function lazyValidate(handler: (value: any, values: any) => string | null): LazyFormHandler;
/**
 * Handle form submission with lazy loading
 */
export declare function handleLazySubmit(event: Event, handler: LazyFormHandler): Promise<any>;
/**
 * Enhanced form with lazy handlers
 */
export declare class LazyForm {
    private form;
    private submitHandler?;
    private changeHandlers;
    private validators;
    constructor(form: HTMLFormElement);
    /**
     * Set submit handler
     */
    onSubmit(handler: LazyFormHandler): this;
    /**
     * Set change handler for a field
     */
    onChange(name: string, handler: LazyFormHandler): this;
    /**
     * Set validator for a field
     */
    validate(name: string, handler: LazyFormHandler): this;
    /**
     * Run validation for a field
     */
    validateField(name: string, value: any): Promise<string | null>;
    /**
     * Run validation for all fields
     */
    validateAll(): Promise<Record<string, string | null>>;
    /**
     * Get form values
     */
    getValues(): Record<string, any>;
    /**
     * Set form values
     */
    setValues(values: Record<string, any>): void;
    /**
     * Reset form
     */
    reset(): void;
}
/**
 * Create a lazy form instance
 */
export declare function createLazyForm(form: HTMLFormElement): LazyForm;
//# sourceMappingURL=forms.d.ts.map