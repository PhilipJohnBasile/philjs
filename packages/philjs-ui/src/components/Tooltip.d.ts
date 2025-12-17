/**
 * PhilJS UI - Tooltip Component
 */
import { JSX } from 'philjs-core';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export interface TooltipProps {
    content: string | JSX.Element;
    children: JSX.Element;
    placement?: TooltipPlacement;
    delay?: number;
    disabled?: boolean;
    className?: string;
    arrow?: boolean;
}
export declare function Tooltip(props: TooltipProps): import("philjs-core").JSXElement;
/**
 * Popover - More complex tooltip with interactive content
 */
export interface PopoverProps {
    trigger: JSX.Element;
    children: JSX.Element;
    placement?: TooltipPlacement;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    closeOnClickOutside?: boolean;
    className?: string;
}
export declare function Popover(props: PopoverProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Tooltip.d.ts.map