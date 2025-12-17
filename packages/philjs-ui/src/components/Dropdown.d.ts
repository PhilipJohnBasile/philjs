/**
 * PhilJS UI - Dropdown Component
 */
import { JSX } from 'philjs-core';
export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export interface DropdownProps {
    trigger: JSX.Element;
    children: JSX.Element | JSX.Element[];
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
    children: JSX.Element;
    onClick?: () => void;
    disabled?: boolean;
    icon?: JSX.Element;
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
    children: JSX.Element;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Dropdown.d.ts.map