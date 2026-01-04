/**
 * Hollow Modal Component
 * A dialog/modal with backdrop, animations, and accessibility support
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Modal sizes
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
/**
 * Modal animation types
 */
export type ModalAnimation = 'fade' | 'slide' | 'scale' | 'none';
/**
 * Hollow Modal Web Component
 *
 * @example
 * ```html
 * <hollow-modal open size="md" animation="scale">
 *   <div slot="header">Modal Title</div>
 *   <p>Modal content goes here</p>
 *   <div slot="footer">
 *     <hollow-button variant="ghost">Cancel</hollow-button>
 *     <hollow-button variant="primary">Confirm</hollow-button>
 *   </div>
 * </hollow-modal>
 * ```
 */
export declare class HollowModal extends HollowElement {
    static observedAttributes: string[];
    open: boolean;
    size: ModalSize;
    animation: ModalAnimation;
    closable: boolean;
    closeOnBackdrop: boolean;
    closeOnEscape: boolean;
    persistent: boolean;
    private _previousActiveElement;
    protected template(): string;
    protected styles(): string;
    protected onConnect(): void;
    protected onPropChange(name: string, newValue: unknown, _oldValue: unknown): void;
    /**
     * Handle modal opening
     */
    private handleOpen;
    /**
     * Handle modal closing
     */
    private handleClosed;
    /**
     * Handle close button click
     */
    private handleClose;
    /**
     * Handle backdrop click
     */
    private handleBackdropClick;
    /**
     * Handle keyboard events
     */
    private handleKeyDown;
    /**
     * Trap focus within the modal
     */
    private trapFocus;
    /**
     * Open the modal programmatically
     */
    show(): void;
    /**
     * Close the modal programmatically
     */
    close(): void;
    /**
     * Toggle the modal
     */
    toggle(): void;
}
export default HollowModal;
//# sourceMappingURL=modal.d.ts.map