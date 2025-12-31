/**
 * Field Components for PhilJS Forms
 *
 * A collection of form field components that work with the Form class.
 * These provide consistent styling, validation, and accessibility features.
 */
import type { FieldValue } from './types.js';
export interface BaseFieldProps<T = FieldValue> {
    name: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
    'aria-describedby'?: string;
    value?: T;
    error?: string | null;
    touched?: boolean;
    onChange?: (value: T) => void;
    onBlur?: () => void;
    onFocus?: () => void;
}
export interface TextFieldProps extends BaseFieldProps<string> {
    type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    autoComplete?: string;
    autoFocus?: boolean;
}
export interface TextAreaFieldProps extends BaseFieldProps<string> {
    rows?: number;
    cols?: number;
    minLength?: number;
    maxLength?: number;
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}
export interface SelectFieldProps extends BaseFieldProps<string | string[]> {
    options: Array<{
        value: string;
        label: string;
        disabled?: boolean;
    }>;
    multiple?: boolean;
    size?: number;
}
export interface CheckboxFieldProps extends BaseFieldProps<boolean> {
    indeterminate?: boolean;
}
export interface RadioFieldProps extends BaseFieldProps<string> {
    options: Array<{
        value: string;
        label: string;
        disabled?: boolean;
    }>;
    inline?: boolean;
}
export interface FileFieldProps extends BaseFieldProps<File | File[] | null> {
    accept?: string;
    multiple?: boolean;
    capture?: 'user' | 'environment';
}
export interface NumberFieldProps extends BaseFieldProps<number | null> {
    min?: number;
    max?: number;
    step?: number;
}
/**
 * Create a text input field configuration
 */
export declare function TextField(props: TextFieldProps): {
    type: 'text';
    props: TextFieldProps;
    render: () => {
        tag: 'input';
        attributes: Record<string, unknown>;
    };
};
/**
 * Create a textarea field configuration
 */
export declare function TextAreaField(props: TextAreaFieldProps): {
    type: 'textarea';
    props: TextAreaFieldProps;
    render: () => {
        tag: 'textarea';
        attributes: Record<string, unknown>;
    };
};
/**
 * Create a select field configuration
 */
export declare function SelectField(props: SelectFieldProps): {
    type: 'select';
    props: SelectFieldProps;
    render: () => {
        tag: 'select';
        attributes: Record<string, unknown>;
        options: SelectFieldProps['options'];
    };
};
/**
 * Create a checkbox field configuration
 */
export declare function CheckboxField(props: CheckboxFieldProps): {
    type: 'checkbox';
    props: CheckboxFieldProps;
    render: () => {
        tag: 'input';
        attributes: Record<string, unknown>;
    };
};
/**
 * Create a radio field configuration
 */
export declare function RadioField(props: RadioFieldProps): {
    type: 'radio';
    props: RadioFieldProps;
    render: () => {
        tag: 'fieldset';
        options: RadioFieldProps['options'];
        attributes: Record<string, unknown>;
    };
};
/**
 * Create a file input field configuration
 */
export declare function FileField(props: FileFieldProps): {
    type: 'file';
    props: FileFieldProps;
    render: () => {
        tag: 'input';
        attributes: Record<string, unknown>;
    };
};
/**
 * Create a number input field configuration
 */
export declare function NumberField(props: NumberFieldProps): {
    type: 'number';
    props: NumberFieldProps;
    render: () => {
        tag: 'input';
        attributes: Record<string, unknown>;
    };
};
export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number';
export type FieldProps = TextFieldProps | TextAreaFieldProps | SelectFieldProps | CheckboxFieldProps | RadioFieldProps | FileFieldProps | NumberFieldProps;
/**
 * Generic field factory that creates the appropriate field type
 */
export declare function Field(type: 'text', props: TextFieldProps): ReturnType<typeof TextField>;
export declare function Field(type: 'textarea', props: TextAreaFieldProps): ReturnType<typeof TextAreaField>;
export declare function Field(type: 'select', props: SelectFieldProps): ReturnType<typeof SelectField>;
export declare function Field(type: 'checkbox', props: CheckboxFieldProps): ReturnType<typeof CheckboxField>;
export declare function Field(type: 'radio', props: RadioFieldProps): ReturnType<typeof RadioField>;
export declare function Field(type: 'file', props: FileFieldProps): ReturnType<typeof FileField>;
export declare function Field(type: 'number', props: NumberFieldProps): ReturnType<typeof NumberField>;
//# sourceMappingURL=fields.d.ts.map