/**
 * PhilJS UI - Switch Component
 */
export type SwitchSize = 'sm' | 'md' | 'lg';
export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    label?: string;
    description?: string;
    id?: string;
    name?: string;
    size?: SwitchSize;
    onChange?: (checked: boolean) => void;
    className?: string;
    'aria-label'?: string;
}
export declare function Switch(props: SwitchProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Switch.d.ts.map