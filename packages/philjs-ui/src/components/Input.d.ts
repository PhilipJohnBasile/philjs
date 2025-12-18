/**
 * PhilJS UI - Input Component
 */
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'flushed';
export interface InputProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    size?: InputSize;
    variant?: InputVariant;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    error?: boolean | string;
    helperText?: string;
    label?: string;
    id?: string;
    name?: string;
    leftElement?: any;
    rightElement?: any;
    onInput?: (e: InputEvent) => void;
    onChange?: (e: Event) => void;
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
    className?: string;
    inputClassName?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
}
export declare function Input(props: InputProps): import("philjs-core").JSXElement;
/**
 * Textarea Component
 */
export interface TextareaProps extends Omit<InputProps, 'type' | 'leftElement' | 'rightElement'> {
    rows?: number;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
export declare function Textarea(props: TextareaProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Input.d.ts.map