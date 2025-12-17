/**
 * PhilJS UI - Drawer Component
 */
import { JSX } from 'philjs-core';
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: JSX.Element;
    placement?: DrawerPlacement;
    size?: DrawerSize;
    title?: string;
    showCloseButton?: boolean;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    className?: string;
    overlayClassName?: string;
}
export declare function Drawer(props: DrawerProps): import("philjs-core").JSXElement | null;
/**
 * Drawer Header
 */
export declare function DrawerHeader(props: {
    children: JSX.Element;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Drawer Body
 */
export declare function DrawerBody(props: {
    children: JSX.Element;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Drawer Footer
 */
export declare function DrawerFooter(props: {
    children: JSX.Element;
    className?: string;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Drawer.d.ts.map