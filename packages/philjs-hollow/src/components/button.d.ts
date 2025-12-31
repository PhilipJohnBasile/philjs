/**
 * Hollow Button Component
 * A versatile button with multiple variants and sizes
 */
import { HollowElement } from '../core/base-element.js';
/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';
/**
 * Hollow Button Web Component
 *
 * @example
 * ```html
 * <hollow-button variant="primary" size="md">Click me</hollow-button>
 * ```
 */
export declare class HollowButton extends HollowElement {
    static observedAttributes: string[];
    /** Form association */
    static formAssociated: boolean;
    variant: ButtonVariant;
    size: ButtonSize;
    disabled: boolean;
    loading: boolean;
    type: 'button' | 'submit' | 'reset';
    protected template(): string;
    protected styles(): string;
    /**
     * Handle click event
     */
    private handleClick;
}
export default HollowButton;
//# sourceMappingURL=button.d.ts.map