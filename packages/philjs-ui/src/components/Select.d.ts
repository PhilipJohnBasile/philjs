/**
 * PhilJS UI - Select Component
 */
export type SelectSize = 'sm' | 'md' | 'lg';
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps {
    options: SelectOption[];
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    size?: SelectSize;
    disabled?: boolean;
    required?: boolean;
    error?: boolean | string;
    helperText?: string;
    label?: string;
    id?: string;
    name?: string;
    onChange?: (value: string) => void;
    className?: string;
    'aria-label'?: string;
}
export declare function Select(props: SelectProps): import("philjs-core").JSXElement;
/**
 * Multi-Select Component
 */
export interface MultiSelectProps extends Omit<SelectProps, 'value' | 'defaultValue' | 'onChange'> {
    value?: string[];
    defaultValue?: string[];
    onChange?: (values: string[]) => void;
    maxSelections?: number;
}
export declare function MultiSelect(props: MultiSelectProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Select.d.ts.map