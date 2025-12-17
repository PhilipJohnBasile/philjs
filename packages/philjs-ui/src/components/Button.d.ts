/**
 * PhilJS UI - Button Component
 */
import { JSX } from 'philjs-core';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export interface ButtonProps {
    children: JSX.Element;
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: JSX.Element;
    rightIcon?: JSX.Element;
    type?: 'button' | 'submit' | 'reset';
    onClick?: (e: MouseEvent) => void;
    className?: string;
    style?: Record<string, string>;
    'aria-label'?: string;
}
export declare function Button(props: ButtonProps): import("philjs-core").JSXElement;
/**
 * Icon Button - Button with only an icon
 */
export declare function IconButton(props: Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> & {
    icon: JSX.Element;
    'aria-label': string;
}): import("philjs-core").JSXElement;
/**
 * Button Group
 */
export declare function ButtonGroup(props: {
    children: JSX.Element | JSX.Element[];
    attached?: boolean;
    className?: string;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Button.d.ts.map