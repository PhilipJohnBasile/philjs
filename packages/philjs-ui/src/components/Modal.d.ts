/**
 * PhilJS UI - Modal Component
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: any;
    title?: string;
    size?: ModalSize;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    initialFocus?: HTMLElement | null;
    className?: string;
    overlayClassName?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
}
export declare function Modal(props: ModalProps): import("philjs-core").JSXElement | null;
/**
 * Modal Header
 */
export declare function ModalHeader(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Modal Body
 */
export declare function ModalBody(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Modal Footer
 */
export declare function ModalFooter(props: {
    children: any;
    className?: string;
}): import("philjs-core").JSXElement;
/**
 * Confirmation Dialog
 */
export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'info' | 'warning' | 'danger';
}
export declare function ConfirmDialog(props: ConfirmDialogProps): import("philjs-core").JSXElement;
//# sourceMappingURL=Modal.d.ts.map