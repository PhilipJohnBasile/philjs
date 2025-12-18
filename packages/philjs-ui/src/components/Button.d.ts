/**
 * PhilJS UI - Button Component
 */
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export interface ButtonProps {
    children: any;
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: ButtonColor;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: any;
    rightIcon?: any;
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
    icon: any;
    'aria-label': string;
}): import("philjs-core").JSXElement;
/**
 * Button Group
 */
export declare function ButtonGroup(props: {
    children: any | any[];
    attached?: boolean;
    className?: string;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Button.d.ts.map