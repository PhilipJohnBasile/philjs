/**
 * PhilJS UI - Radio Component
 */
export type RadioSize = 'sm' | 'md' | 'lg';
export interface RadioProps {
    value: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    'aria-label'?: string;
}
export declare function Radio(props: RadioProps): import("philjs-core").JSXElement;
/**
 * Radio Group
 */
export interface RadioGroupProps {
    name: string;
    value?: string;
    defaultValue?: string;
    children: any;
    label?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    error?: boolean | string;
    size?: RadioSize;
    orientation?: 'horizontal' | 'vertical';
    onChange?: (value: string) => void;
    className?: string;
}
export declare function RadioGroup(props: RadioGroupProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Radio.d.ts.map