/**
 * PhilJS UI - Dropdown Component
 */
export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export interface DropdownProps {
    trigger: any;
    children: any;
    placement?: DropdownPlacement;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    closeOnSelect?: boolean;
    className?: string;
}
export declare function Dropdown(props: DropdownProps): import("philjs-core").JSXElement;
/**
 * Dropdown Item
 */
export interface DropdownItemProps {
    children: any;
    onClick?: () => void;
    disabled?: boolean;
    icon?: any;
    danger?: boolean;
    className?: string;
}
export declare function DropdownItem(props: DropdownItemProps): import("philjs-core").JSXElement;
/**
 * Dropdown Divider
 */
export declare function DropdownDivider(): import("philjs-core").JSXElement;
/**
 * Dropdown Label
 */
export declare function DropdownLabel(props: {
    children: any;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Dropdown.d.ts.map