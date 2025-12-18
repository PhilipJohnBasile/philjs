/**
 * PhilJS UI - Drawer Component
 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: any;
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
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Drawer Body
 */
export declare function DrawerBody(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Drawer Footer
 */
export declare function DrawerFooter(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Drawer.d.ts.map