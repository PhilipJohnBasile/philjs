/**
 * PhilJS UI - Checkbox Component
 */
import { JSX } from 'philjs-core';
export type CheckboxSize = 'sm' | 'md' | 'lg';
export interface CheckboxProps {
    checked?: boolean;
    defaultChecked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    required?: boolean;
    error?: boolean | string;
    label?: string;
    description?: string;
    id?: string;
    name?: string;
    value?: string;
    size?: CheckboxSize;
    onChange?: (checked: boolean) => void;
    className?: string;
    'aria-label'?: string;
}
export declare function Checkbox(props: CheckboxProps): import("philjs-core").JSXElement;
/**
 * Checkbox Group
 */
export interface CheckboxGroupProps {
    children: JSX.Element | JSX.Element[];
    label?: string;
    description?: string;
    required?: boolean;
    error?: boolean | string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}
export declare function CheckboxGroup(props: CheckboxGroupProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Checkbox.d.ts.map