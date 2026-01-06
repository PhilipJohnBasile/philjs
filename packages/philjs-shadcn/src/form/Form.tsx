/**
 * Form components - shadcn/ui style for PhilJS
 * Provides form field wrappers with validation support
 */

import { signal, effect, computed, type Signal } from '@philjs/core';
import { cn } from '../utils.js';
import { Label } from './Label.js';

// Types
export interface FormFieldContextValue {
    name: string;
    id: string;
    error?: string | Signal<string | undefined>;
    formItemId: string;
    formDescriptionId: string;
    formMessageId: string;
}

export interface FormProps {
    onSubmit?: (e: Event) => void;
    className?: string;
    children?: any;
}

export interface FormFieldProps {
    name: string;
    children?: any;
}

export interface FormItemProps {
    className?: string;
    children?: any;
}

export interface FormLabelProps {
    className?: string;
    children?: any;
}

export interface FormControlProps {
    className?: string;
    children?: any;
}

export interface FormDescriptionProps {
    className?: string;
    children?: any;
}

export interface FormMessageProps {
    className?: string;
    children?: any;
}

// Context
let currentFieldContext: FormFieldContextValue | null = null;

/**
 * Form root element
 */
export function Form(props: FormProps) {
    const { onSubmit, className, children } = props;

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    return (
        <form onSubmit={handleSubmit} class={cn('space-y-6', className)}>
            {children}
        </form>
    );
}

/**
 * Form field wrapper - provides context for child components
 */
export function FormField(props: FormFieldProps) {
    const { name, children } = props;

    const id = `form-field-${name}-${Math.random().toString(36).slice(2, 9)}`;

    const prevContext = currentFieldContext;
    currentFieldContext = {
        name,
        id,
        formItemId: `${id}-item`,
        formDescriptionId: `${id}-description`,
        formMessageId: `${id}-message`,
    };

    const result = children;

    currentFieldContext = prevContext;
    return result;
}

/**
 * Form item container
 */
export function FormItem(props: FormItemProps) {
    const { className, children } = props;

    return (
        <div class={cn('space-y-2', className)}>
            {children}
        </div>
    );
}

/**
 * Form label
 */
export function FormLabel(props: FormLabelProps) {
    const { className, children } = props;
    const context = currentFieldContext;

    const error = typeof context?.error === 'function' ? context.error() : context?.error;

    return (
        <Label
            htmlFor={context?.formItemId}
            className={cn(error && 'text-destructive', className)}
        >
            {children}
        </Label>
    );
}

/**
 * Form control - wraps the input element
 */
export function FormControl(props: FormControlProps) {
    const { className, children } = props;
    const context = currentFieldContext;

    const error = typeof context?.error === 'function' ? context.error() : context?.error;

    return (
        <div
            id={context?.formItemId}
            aria-describedby={
                error
                    ? `${context?.formDescriptionId} ${context?.formMessageId}`
                    : context?.formDescriptionId
            }
            aria-invalid={!!error}
            class={className}
        >
            {children}
        </div>
    );
}

/**
 * Form description text
 */
export function FormDescription(props: FormDescriptionProps) {
    const { className, children } = props;
    const context = currentFieldContext;

    return (
        <p
            id={context?.formDescriptionId}
            class={cn('text-[0.8rem] text-muted-foreground', className)}
        >
            {children}
        </p>
    );
}

/**
 * Form error message
 */
export function FormMessage(props: FormMessageProps) {
    const { className, children } = props;
    const context = currentFieldContext;

    const error = typeof context?.error === 'function' ? context.error() : context?.error;
    const message = error ?? children;

    if (!message) return null;

    return (
        <p
            id={context?.formMessageId}
            class={cn('text-[0.8rem] font-medium text-destructive', className)}
        >
            {message}
        </p>
    );
}

// Form validation utilities
export interface ValidationRule {
    required?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    validate?: (value: any) => string | true;
}

export interface FormState<T extends Record<string, any>> {
    values: Signal<T>;
    errors: Signal<Partial<Record<keyof T, string>>>;
    touched: Signal<Partial<Record<keyof T, boolean>>>;
    isValid: Signal<boolean>;
    isSubmitting: Signal<boolean>;
    setValue: <K extends keyof T>(name: K, value: T[K]) => void;
    setError: <K extends keyof T>(name: K, error: string | undefined) => void;
    setTouched: <K extends keyof T>(name: K, touched: boolean) => void;
    validate: () => boolean;
    reset: () => void;
    handleSubmit: (onValid: (values: T) => void | Promise<void>) => (e: Event) => void;
}

/**
 * Create form state management
 */
export function useForm<T extends Record<string, any>>(
    defaultValues: T,
    rules?: Partial<Record<keyof T, ValidationRule>>
): FormState<T> {
    const values = signal<T>({ ...defaultValues });
    const errors = signal<Partial<Record<keyof T, string>>>({});
    const touched = signal<Partial<Record<keyof T, boolean>>>({});
    const isSubmitting = signal(false);

    const isValid = computed(() => {
        const currentErrors = errors();
        return Object.keys(currentErrors).length === 0;
    });

    const setValue = <K extends keyof T>(name: K, value: T[K]) => {
        values.set({ ...values(), [name]: value });
        // Validate on change if field was touched
        if (touched()[name] && rules?.[name]) {
            const error = validateField(name, value, rules[name]!);
            if (error) {
                errors.set({ ...errors(), [name]: error });
            } else {
                const newErrors = { ...errors() };
                delete newErrors[name];
                errors.set(newErrors);
            }
        }
    };

    const setError = <K extends keyof T>(name: K, error: string | undefined) => {
        if (error) {
            errors.set({ ...errors(), [name]: error });
        } else {
            const newErrors = { ...errors() };
            delete newErrors[name];
            errors.set(newErrors);
        }
    };

    const setTouched = <K extends keyof T>(name: K, isTouched: boolean) => {
        touched.set({ ...touched(), [name]: isTouched });
    };

    const validateField = <K extends keyof T>(
        name: K,
        value: any,
        rule: ValidationRule
    ): string | undefined => {
        if (rule.required) {
            const isEmpty = value === undefined || value === null || value === '';
            if (isEmpty) {
                return typeof rule.required === 'string' ? rule.required : 'This field is required';
            }
        }

        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength.value) {
            return rule.minLength.message;
        }

        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength.value) {
            return rule.maxLength.message;
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.value.test(value)) {
            return rule.pattern.message;
        }

        if (rule.min && typeof value === 'number' && value < rule.min.value) {
            return rule.min.message;
        }

        if (rule.max && typeof value === 'number' && value > rule.max.value) {
            return rule.max.message;
        }

        if (rule.validate) {
            const result = rule.validate(value);
            if (result !== true) {
                return result;
            }
        }

        return undefined;
    };

    const validate = (): boolean => {
        if (!rules) return true;

        const newErrors: Partial<Record<keyof T, string>> = {};
        const currentValues = values();

        for (const [name, rule] of Object.entries(rules)) {
            const error = validateField(name as keyof T, currentValues[name as keyof T], rule as ValidationRule);
            if (error) {
                newErrors[name as keyof T] = error;
            }
        }

        errors.set(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const reset = () => {
        values.set({ ...defaultValues });
        errors.set({});
        touched.set({});
        isSubmitting.set(false);
    };

    const handleSubmit = (onValid: (values: T) => void | Promise<void>) => {
        return async (e: Event) => {
            e.preventDefault();
            isSubmitting.set(true);

            if (validate()) {
                try {
                    await onValid(values());
                } finally {
                    isSubmitting.set(false);
                }
            } else {
                isSubmitting.set(false);
            }
        };
    };

    return {
        values,
        errors,
        touched,
        isValid,
        isSubmitting,
        setValue,
        setError,
        setTouched,
        validate,
        reset,
        handleSubmit,
    };
}
