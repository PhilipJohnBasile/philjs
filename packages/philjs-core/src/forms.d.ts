/**
 * Form validation system with progressive enhancement.
 * Type-safe validation with schema builder.
 */
import { type Signal } from "./signals.js";
export type ValidationRule<T = any> = {
    validate: (value: T) => boolean | Promise<boolean>;
    message: string | ((value: T) => string);
};
export type FieldSchema<T = any> = {
    type: "string" | "number" | "boolean" | "date" | "email" | "url" | "custom";
    required?: boolean;
    rules?: ValidationRule<T>[];
    transform?: (value: any) => T;
    defaultValue?: T;
};
export type FormSchema<T extends Record<string, any>> = {
    [K in keyof T]: FieldSchema<T[K]>;
};
export type ValidationError = {
    field: string;
    message: string;
};
export type FormState<T> = {
    values: T;
    errors: Record<keyof T, string[]>;
    touched: Record<keyof T, boolean>;
    dirty: Record<keyof T, boolean>;
    isValid: boolean;
    isSubmitting: boolean;
    submitCount: number;
};
declare class Schema<T> {
    private config;
    constructor(config: FieldSchema<T>);
    required(message?: string): Schema<T>;
    min(min: number, message?: string): Schema<T>;
    max(max: number, message?: string): Schema<T>;
    pattern(regex: RegExp, message?: string): Schema<T>;
    email(message?: string): Schema<T>;
    url(message?: string): Schema<T>;
    custom(rule: ValidationRule<T>): Schema<T>;
    transform(fn: (value: any) => T): Schema<T>;
    default(value: T): Schema<T>;
    getConfig(): FieldSchema<T>;
}
export declare const v: {
    string(): Schema<string>;
    number(): Schema<number>;
    boolean(): Schema<boolean>;
    email(): Schema<string>;
    url(): Schema<string>;
    date(): Schema<Date>;
    custom<T>(validator: (val: any) => val is T): Schema<T>;
};
export type UseFormOptions<T extends Record<string, any>> = {
    schema: Record<keyof T, Schema<any>>;
    initialValues?: Partial<T>;
    onSubmit: (values: T) => Promise<void> | void;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
};
export type FormApi<T extends Record<string, any>> = {
    values: Signal<T>;
    errors: Signal<Record<keyof T, string[]>>;
    touched: Signal<Record<keyof T, boolean>>;
    dirty: Signal<Record<keyof T, boolean>>;
    isValid: Signal<boolean>;
    isSubmitting: Signal<boolean>;
    submitCount: Signal<number>;
    setValue: <K extends keyof T>(field: K, value: T[K]) => void;
    setError: (field: keyof T, message: string) => void;
    clearError: (field: keyof T) => void;
    setTouched: (field: keyof T, touched: boolean) => void;
    validate: (field?: keyof T) => Promise<boolean>;
    handleSubmit: (e?: Event) => Promise<void>;
    handleChange: <K extends keyof T>(field: K) => (e: Event) => void;
    handleBlur: (field: keyof T) => (e: Event) => void;
    reset: () => void;
};
export declare function useForm<T extends Record<string, any>>(options: UseFormOptions<T>): FormApi<T>;
export type FieldProps<T extends Record<string, any>, K extends keyof T> = {
    form: FormApi<T>;
    name: K;
    label?: string;
    placeholder?: string;
    type?: string;
    className?: string;
};
export declare function createField<T extends Record<string, any>>(): {
    Input: <K extends keyof T>(props: FieldProps<T, K>) => {
        type: string;
        props: {
            className: string;
            children: (false | "" | {
                type: string;
                props: {
                    htmlFor: string;
                    children: string;
                    id?: undefined;
                    name?: undefined;
                    type?: undefined;
                    value?: undefined;
                    placeholder?: undefined;
                    onChange?: undefined;
                    onBlur?: undefined;
                    "aria-invalid"?: undefined;
                    "aria-describedby"?: undefined;
                    className?: undefined;
                    role?: undefined;
                };
            } | {
                type: string;
                props: {
                    id: string;
                    name: string;
                    type: string;
                    value: string | NonNullable<T[K]>;
                    placeholder: string | undefined;
                    onChange: (e: Event) => void;
                    onBlur: (e: Event) => void;
                    "aria-invalid": boolean;
                    "aria-describedby": string | undefined;
                    htmlFor?: undefined;
                    children?: undefined;
                    className?: undefined;
                    role?: undefined;
                };
            } | {
                type: string;
                props: {
                    id: string;
                    className: string;
                    role: string;
                    children: string;
                    htmlFor?: undefined;
                    name?: undefined;
                    type?: undefined;
                    value?: undefined;
                    placeholder?: undefined;
                    onChange?: undefined;
                    onBlur?: undefined;
                    "aria-invalid"?: undefined;
                    "aria-describedby"?: undefined;
                };
            } | undefined)[];
        };
    };
    TextArea: <K extends keyof T>(props: FieldProps<T, K> & {
        rows?: number;
    }) => {
        type: string;
        props: {
            className: string;
            children: (false | "" | {
                type: string;
                props: {
                    htmlFor: string;
                    children: string;
                    id?: undefined;
                    name?: undefined;
                    value?: undefined;
                    placeholder?: undefined;
                    rows?: undefined;
                    onChange?: undefined;
                    onBlur?: undefined;
                    "aria-invalid"?: undefined;
                    "aria-describedby"?: undefined;
                    className?: undefined;
                    role?: undefined;
                };
            } | {
                type: string;
                props: {
                    id: string;
                    name: string;
                    value: string | NonNullable<T[K]>;
                    placeholder: string | undefined;
                    rows: number;
                    onChange: (e: Event) => void;
                    onBlur: (e: Event) => void;
                    "aria-invalid": boolean;
                    "aria-describedby": string | undefined;
                    htmlFor?: undefined;
                    children?: undefined;
                    className?: undefined;
                    role?: undefined;
                };
            } | {
                type: string;
                props: {
                    id: string;
                    className: string;
                    role: string;
                    children: string;
                    htmlFor?: undefined;
                    name?: undefined;
                    value?: undefined;
                    placeholder?: undefined;
                    rows?: undefined;
                    onChange?: undefined;
                    onBlur?: undefined;
                    "aria-invalid"?: undefined;
                    "aria-describedby"?: undefined;
                };
            } | undefined)[];
        };
    };
    Checkbox: <K extends keyof T>(props: FieldProps<T, K>) => {
        type: string;
        props: {
            className: string;
            children: (false | {
                type: string;
                props: {
                    children: ("" | {
                        type: string;
                        props: {
                            id: string;
                            name: string;
                            type: string;
                            checked: boolean;
                            onChange: (e: Event) => void;
                            onBlur: (e: Event) => void;
                            "aria-invalid": boolean;
                            "aria-describedby": string | undefined;
                            children?: undefined;
                        };
                    } | {
                        type: string;
                        props: {
                            children: string;
                            id?: undefined;
                            name?: undefined;
                            type?: undefined;
                            checked?: undefined;
                            onChange?: undefined;
                            onBlur?: undefined;
                            "aria-invalid"?: undefined;
                            "aria-describedby"?: undefined;
                        };
                    } | undefined)[];
                    id?: undefined;
                    className?: undefined;
                    role?: undefined;
                };
            } | {
                type: string;
                props: {
                    id: string;
                    className: string;
                    role: string;
                    children: string;
                };
            })[];
        };
    };
};
export {};
//# sourceMappingURL=forms.d.ts.map